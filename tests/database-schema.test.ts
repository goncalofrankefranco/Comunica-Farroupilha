import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const migrationPath = "db/migrations/0001_initial.sql";

test("production schema defines every durable platform entity", () => {
  assert.equal(existsSync(migrationPath), true, "initial database migration must exist");
  const source = readFileSync(migrationPath, "utf8");

  for (const table of [
    "schema_migrations",
    "users",
    "sessions",
    "proposals",
    "proposal_supports",
    "proposal_saves",
    "comments",
    "comment_likes",
    "activities",
    "activity_feedbacks",
    "notifications",
    "chapa_questions",
    "legacy_imports",
  ]) {
    assert.match(source, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, "i"), `${table} must be durable`);
  }
});

test("interaction and feedback relations are unique per user", () => {
  assert.equal(existsSync(migrationPath), true, "initial database migration must exist");
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /proposal_supports[\s\S]*PRIMARY KEY\s*\(proposal_id, user_id\)/i);
  assert.match(source, /proposal_saves[\s\S]*PRIMARY KEY\s*\(proposal_id, user_id\)/i);
  assert.match(source, /comment_likes[\s\S]*PRIMARY KEY\s*\(comment_id, user_id\)/i);
  assert.match(source, /activity_feedbacks[\s\S]*UNIQUE\s*\(activity_id, user_id\)/i);
});

test("credentials use hashes rather than plaintext password storage", () => {
  assert.equal(existsSync(migrationPath), true, "initial database migration must exist");
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /password_hash\s+TEXT\s+NOT NULL/i);
  assert.match(source, /token_hash\s+TEXT\s+(?:PRIMARY KEY|NOT NULL)/i);
  assert.doesNotMatch(source, /\bpassword\s+TEXT\b/i);
});

test("workflow migration supports cancellation and targeted notifications", () => {
  const source = readFileSync("db/migrations/0005_participation_workflows.sql", "utf8");
  assert.match(source, /'cancelled'/);
  assert.match(source, /notification_type TEXT/);
  assert.match(source, /proposal_id UUID REFERENCES proposals/);
  assert.match(source, /recipient_user_id UUID REFERENCES users/);
  assert.match(source, /recipient_role TEXT/);
});

test("Google migration links verified identities without requiring a local password", () => {
  const source = readFileSync("db/migrations/0006_google_auth.sql", "utf8");
  assert.match(source, /ADD COLUMN IF NOT EXISTS email TEXT/);
  assert.match(source, /ADD COLUMN IF NOT EXISTS google_sub TEXT/);
  assert.match(source, /ALTER COLUMN password_hash DROP NOT NULL/);
  assert.match(source, /users_email_unique_idx/);
  assert.match(source, /users_google_sub_unique_idx/);
});

test("legacy Google account linking stores one-time expiring token hashes", () => {
  const source = readFileSync("db/migrations/0008_legacy_google_account_linking.sql", "utf8");
  assert.match(source, /CREATE TABLE IF NOT EXISTS legacy_google_link_tokens/);
  assert.match(source, /token_hash TEXT PRIMARY KEY/);
  assert.match(source, /user_id UUID NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(source, /expires_at TIMESTAMPTZ NOT NULL/);
});

test("rate limit migration stores hashed, expiring shared request budgets", () => {
  const source = readFileSync("db/migrations/0007_request_rate_limits.sql", "utf8");
  assert.match(source, /CREATE TABLE IF NOT EXISTS request_rate_limits/);
  assert.match(source, /bucket_hash TEXT PRIMARY KEY/);
  assert.match(source, /expires_at TIMESTAMPTZ NOT NULL/);
  assert.match(source, /request_rate_limits_expires_at_idx/);
  assert.match(source, /proposal_supports_created_at_idx/);
  assert.match(source, /proposal_saves_user_created_idx/);
  assert.match(source, /comment_likes_user_comment_idx/);
  assert.match(source, /activity_feedbacks_activity_created_idx/);
  assert.match(source, /activity_feedbacks_created_idx/);
});

test("database integration tests require a dedicated, guarded database URL", () => {
  const source = readFileSync("tests/test-database.ts", "utf8");
  const safety = readFileSync("scripts/database-url-safety.mjs", "utf8");
  assert.match(source, /TEST_DATABASE_URL/);
  assert.match(source, /assertSafeTestDatabaseUrl/);
  assert.match(safety, /ALLOW_REMOTE_TEST_DATABASE=true/);
  assert.match(safety, /must be different from the application database/);
  assert.match(source, /process\.env\.DATABASE_URL = databaseUrl/);
});
