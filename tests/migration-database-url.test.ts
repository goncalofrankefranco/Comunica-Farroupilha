import assert from "node:assert/strict";
import { test } from "node:test";

test("test migrations reject the application database despite a different role and pool endpoint", async () => {
  const { resolveMigrationDatabaseUrl } = await import("../scripts/database-url-safety.mjs");

  assert.throws(() => resolveMigrationDatabaseUrl({
    testMode: true,
    testDatabaseUrl: "postgres://test-role:other@ep-school.neon.tech:5432/platform?sslmode=require",
    applicationDatabaseUrls: [
      "postgres://pooled-role:secret@ep-school-pooler.neon.tech/platform?sslmode=require",
      "postgresql://platform-owner:secret@ep-school.neon.tech/platform?sslmode=require",
    ],
    allowRemote: true,
  }), /different from the application database/i);
});

test("test migrations require explicit opt-in for remote databases", async () => {
  const { resolveMigrationDatabaseUrl } = await import("../scripts/database-url-safety.mjs");
  const remoteTestUrl = "postgres://test:secret@test-db.example.net/platform";

  assert.throws(() => resolveMigrationDatabaseUrl({
    testMode: true,
    testDatabaseUrl: remoteTestUrl,
    applicationDatabaseUrls: [],
    allowRemote: false,
  }), /ALLOW_REMOTE_TEST_DATABASE=true/);
  assert.equal(resolveMigrationDatabaseUrl({
    testMode: true,
    testDatabaseUrl: remoteTestUrl,
    applicationDatabaseUrls: [],
    allowRemote: true,
  }), remoteTestUrl);
});

test("test migration mode never falls back to an application database URL", async () => {
  const { resolveMigrationDatabaseUrl } = await import("../scripts/database-url-safety.mjs");
  const productionUrl = "postgres://app:secret@ep-school.neon.tech/platform";

  assert.throws(() => resolveMigrationDatabaseUrl({
    testMode: true,
    testDatabaseUrl: undefined,
    applicationDatabaseUrls: [productionUrl],
    allowRemote: true,
    databaseUrl: productionUrl,
    databaseUrlUnpooled: productionUrl,
  }), /TEST_DATABASE_URL is required/);
});

test("test migrations accept an isolated local PostgreSQL URL", async () => {
  const { resolveMigrationDatabaseUrl } = await import("../scripts/database-url-safety.mjs");
  const localTestUrl = "postgres://test:secret@localhost:55432/platform";

  assert.equal(resolveMigrationDatabaseUrl({
    testMode: true,
    testDatabaseUrl: localTestUrl,
    applicationDatabaseUrls: ["postgres://app:secret@localhost:5432/platform"],
    allowRemote: false,
  }), localTestUrl);
});
