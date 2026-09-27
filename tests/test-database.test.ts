import assert from "node:assert/strict";
import { test } from "node:test";
import { getTestDatabaseUrl } from "./test-database.ts";

test("remote-test opt-in still refuses the production database URL", () => {
  const original = {
    databaseUrl: process.env.DATABASE_URL,
    unpooledUrl: process.env.DATABASE_URL_UNPOOLED,
    testUrl: process.env.TEST_DATABASE_URL,
    allowRemote: process.env.ALLOW_REMOTE_TEST_DATABASE,
  };
  const productionUrl = "postgres://platform:production-secret@ep-school.neon.tech/platform?sslmode=require";

  process.env.DATABASE_URL = productionUrl;
  process.env.DATABASE_URL_UNPOOLED = "";
  process.env.TEST_DATABASE_URL = productionUrl;
  process.env.ALLOW_REMOTE_TEST_DATABASE = "true";

  try {
    assert.throws(() => getTestDatabaseUrl(), /different from the application database/i);
  } finally {
    if (original.databaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original.databaseUrl;
    if (original.unpooledUrl === undefined) delete process.env.DATABASE_URL_UNPOOLED;
    else process.env.DATABASE_URL_UNPOOLED = original.unpooledUrl;
    if (original.testUrl === undefined) delete process.env.TEST_DATABASE_URL;
    else process.env.TEST_DATABASE_URL = original.testUrl;
    if (original.allowRemote === undefined) delete process.env.ALLOW_REMOTE_TEST_DATABASE;
    else process.env.ALLOW_REMOTE_TEST_DATABASE = original.allowRemote;
  }
});

test("test database guard does not treat a second database role as an isolated database", () => {
  const original = {
    databaseUrl: process.env.DATABASE_URL,
    unpooledUrl: process.env.DATABASE_URL_UNPOOLED,
    testUrl: process.env.TEST_DATABASE_URL,
    allowRemote: process.env.ALLOW_REMOTE_TEST_DATABASE,
  };

  process.env.DATABASE_URL = "postgres://pooled-role:secret@ep-school-pooler.neon.tech/platform?sslmode=require";
  process.env.DATABASE_URL_UNPOOLED = "postgresql://platform-owner:secret@ep-school.neon.tech/platform?sslmode=require";
  process.env.TEST_DATABASE_URL = "postgres://test-role:other-secret@ep-school.neon.tech:5432/platform?sslmode=require";
  process.env.ALLOW_REMOTE_TEST_DATABASE = "true";

  try {
    assert.throws(() => getTestDatabaseUrl(), /different from the application database/i);
  } finally {
    if (original.databaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original.databaseUrl;
    if (original.unpooledUrl === undefined) delete process.env.DATABASE_URL_UNPOOLED;
    else process.env.DATABASE_URL_UNPOOLED = original.unpooledUrl;
    if (original.testUrl === undefined) delete process.env.TEST_DATABASE_URL;
    else process.env.TEST_DATABASE_URL = original.testUrl;
    if (original.allowRemote === undefined) delete process.env.ALLOW_REMOTE_TEST_DATABASE;
    else process.env.ALLOW_REMOTE_TEST_DATABASE = original.allowRemote;
  }
});
