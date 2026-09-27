import path from "node:path";
import { assertSafeTestDatabaseUrl } from "../scripts/database-url-safety.mjs";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {}

export function getTestDatabaseUrl() {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) return null;
  const applicationDatabaseUrls = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter(
    (value): value is string => Boolean(value),
  );
  assertSafeTestDatabaseUrl(databaseUrl, applicationDatabaseUrls, process.env.ALLOW_REMOTE_TEST_DATABASE === "true");
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}
