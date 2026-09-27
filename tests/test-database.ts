import path from "node:path";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {}

export function getTestDatabaseUrl() {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) return null;
  const parsed = new URL(databaseUrl);
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("TEST_DATABASE_URL must be a PostgreSQL connection string.");
  }
  const host = parsed.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  if (!local && process.env.ALLOW_REMOTE_TEST_DATABASE !== "true") {
    throw new Error("Remote integration tests require ALLOW_REMOTE_TEST_DATABASE=true.");
  }
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}
