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

  const databaseIdentity = (url: string) => {
    const candidate = new URL(url);
    const host = candidate.hostname.toLowerCase().replace(/-pooler(?=\.)/, "");
    const database = candidate.pathname.replace(/^\/+|\/+$/g, "");
    const port = candidate.port || "5432";
    return `postgresql://${host}:${port}/${database}`;
  };
  const applicationDatabaseUrls = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter(
    (value): value is string => Boolean(value),
  );
  if (applicationDatabaseUrls.some((applicationUrl) => databaseIdentity(applicationUrl) === databaseIdentity(databaseUrl))) {
    throw new Error("TEST_DATABASE_URL must be different from the application database.");
  }

  const host = parsed.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  if (!local && process.env.ALLOW_REMOTE_TEST_DATABASE !== "true") {
    throw new Error("Remote integration tests require ALLOW_REMOTE_TEST_DATABASE=true.");
  }
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}
