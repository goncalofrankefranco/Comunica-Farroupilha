import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { Pool } from "@neondatabase/serverless";
import { getTestDatabaseUrl } from "./test-database.ts";

const testDatabaseUrl = getTestDatabaseUrl();

test("passwords are stored as versioned scrypt hashes and verified safely", async () => {
  assert.equal(existsSync("src/lib/password.ts"), true, "password module must exist");
  const { hashPassword, verifyPassword } = await import("../src/lib/password.ts");
  const password = `Segura-${randomBytes(12).toString("base64url")}`;
  const encoded = await hashPassword(password);

  assert.match(encoded, /^scrypt\$v1\$/);
  assert.equal(encoded.includes(password), false);
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword(`${password}-errada`, encoded), false);
  assert.equal(await verifyPassword(password, "hash-invalido"), false);
});

test("database sessions expire and can be revoked without storing raw tokens", { skip: !testDatabaseUrl }, async () => {
  assert.equal(existsSync("src/lib/auth-repository.ts"), true, "auth repository must exist");
  assert.equal(existsSync("src/lib/session-token.ts"), true, "session token helpers must exist");
  const auth = await import("../src/lib/auth-repository.ts");
  const { hashSessionToken } = await import("../src/lib/session-token.ts");
  const { hashPassword } = await import("../src/lib/password.ts");

  const username = `auth-${randomBytes(8).toString("hex")}`;
  const account = await auth.upsertGefAccount({
    name: username,
    turma: "GEF",
    passwordHash: await hashPassword("senha-segura-123"),
  });
  const pool = new Pool({ connectionString: testDatabaseUrl! });

  try {
    assert.equal("passwordHash" in account, false, "public account DTO must not expose hashes");
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashSessionToken(rawToken);
    assert.notEqual(tokenHash, rawToken);

    await auth.createSession(account.id, tokenHash, new Date(Date.now() + 60_000));
    assert.equal((await auth.getSessionUser(tokenHash))?.id, account.id);
    const stored = await pool.query("SELECT token_hash FROM sessions WHERE user_id = $1", [account.id]);
    assert.equal(stored.rows[0]?.token_hash, tokenHash);
    assert.equal(stored.rows[0]?.token_hash.includes(rawToken), false);

    await auth.revokeSession(tokenHash);
    assert.equal(await auth.getSessionUser(tokenHash), undefined);

    await auth.createSession(account.id, tokenHash, new Date(Date.now() - 1_000));
    assert.equal(await auth.getSessionUser(tokenHash), undefined);
  } finally {
    await pool.query("DELETE FROM users WHERE id = $1", [account.id]);
    await pool.end();
  }
});

test("legacy Google linking preserves the student record and consumes its token once", { skip: !testDatabaseUrl }, async () => {
  const auth = await import("../src/lib/auth-repository.ts");
  const { hashPassword } = await import("../src/lib/password.ts");
  const { createSessionToken, hashSessionToken } = await import("../src/lib/session-token.ts");
  const pool = new Pool({ connectionString: testDatabaseUrl! });
  const userId = randomUUID();
  const proposalId = randomUUID();
  const username = `legacy-${randomBytes(8).toString("hex")}`;
  const rawToken = createSessionToken();
  const tokenHash = hashSessionToken(rawToken);

  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, $4, 'student', $5)`,
      [userId, username, auth.normalizeUsername(username), "9º ano", await hashPassword("senha-legada-segura")],
    );
    await pool.query(
      `INSERT INTO proposals (id, title, body, author_id, author_name, theme)
       VALUES ($1, 'Histórico preservado', 'Esta proposta confirma que o mesmo estudante permanece vinculado.', $2, $3, 'Convivência')`,
      [proposalId, userId, username],
    );
    await auth.createLegacyGoogleLinkAttempt(userId, tokenHash, new Date(Date.now() + 60_000));

    const linked = await auth.completeLegacyGoogleAccountLink(tokenHash, {
      email: "ana@farroups.com.br",
      sub: "google-sub-legacy-test",
    });
    const persisted = await pool.query("SELECT email, google_sub, password_hash FROM users WHERE id = $1", [userId]);
    const history = await pool.query("SELECT author_id FROM proposals WHERE id = $1", [proposalId]);

    assert.equal(linked.id, userId);
    assert.equal(persisted.rows[0]?.email, "ana@farroups.com.br");
    assert.equal(persisted.rows[0]?.google_sub, "google-sub-legacy-test");
    assert.equal(persisted.rows[0]?.password_hash, null);
    assert.equal(history.rows[0]?.author_id, userId);
    await assert.rejects(auth.completeLegacyGoogleAccountLink(tokenHash, {
      email: "ana@farroups.com.br",
      sub: "google-sub-legacy-test",
    }), /LEGACY_LINK_EXPIRED/);
  } finally {
    await pool.query("DELETE FROM proposals WHERE id = $1", [proposalId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    await pool.end();
  }
});

test("legacy Google linking cannot claim an identity already attached to another user", { skip: !testDatabaseUrl }, async () => {
  const auth = await import("../src/lib/auth-repository.ts");
  const { hashPassword } = await import("../src/lib/password.ts");
  const { createSessionToken, hashSessionToken } = await import("../src/lib/session-token.ts");
  const pool = new Pool({ connectionString: testDatabaseUrl! });
  const legacyUserId = randomUUID();
  const linkedUserId = randomUUID();
  const suffix = randomBytes(8).toString("hex");
  const legacyUsername = `legacy-${suffix}`;
  const linkedUsername = `google-${suffix}`;
  const email = `student-${suffix}@farroups.com.br`;
  const sub = `google-sub-${suffix}`;
  const tokenHash = hashSessionToken(createSessionToken());

  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, '9º ano', 'student', $4)`,
      [legacyUserId, legacyUsername, auth.normalizeUsername(legacyUsername), await hashPassword("senha-legada-segura")],
    );
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash, email, google_sub)
       VALUES ($1, $2, $3, '9º ano', 'student', NULL, $4, $5)`,
      [linkedUserId, linkedUsername, auth.normalizeUsername(linkedUsername), email, sub],
    );
    await auth.createLegacyGoogleLinkAttempt(legacyUserId, tokenHash, new Date(Date.now() + 60_000));

    await assert.rejects(
      auth.completeLegacyGoogleAccountLink(tokenHash, { email, sub }),
      /LEGACY_LINK_CONFLICT/,
    );
    const unchanged = await pool.query("SELECT email, google_sub FROM users WHERE id = $1", [legacyUserId]);
    assert.equal(unchanged.rows[0]?.email, null);
    assert.equal(unchanged.rows[0]?.google_sub, null);
  } finally {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[legacyUserId, linkedUserId]]);
    await pool.end();
  }
});
