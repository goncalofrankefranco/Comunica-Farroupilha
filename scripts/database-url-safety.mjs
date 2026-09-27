function databaseIdentity(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(/-pooler(?=\.)/, "");
  const database = url.pathname.replace(/^\/+|\/+$/g, "");
  return `postgresql://${host}:${url.port || "5432"}/${database}`;
}

export function assertSafeTestDatabaseUrl(testDatabaseUrl, applicationDatabaseUrls, allowRemote) {
  if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is required for test migrations.");
  const parsed = new URL(testDatabaseUrl);
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("TEST_DATABASE_URL must be a PostgreSQL connection string.");
  }
  if (applicationDatabaseUrls.some((applicationUrl) => databaseIdentity(applicationUrl) === databaseIdentity(testDatabaseUrl))) {
    throw new Error("TEST_DATABASE_URL must be different from the application database.");
  }

  const host = parsed.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  if (!local && !allowRemote) throw new Error("Remote integration tests require ALLOW_REMOTE_TEST_DATABASE=true.");
  return testDatabaseUrl;
}

export function resolveMigrationDatabaseUrl(options) {
  if (options.testMode) {
    return assertSafeTestDatabaseUrl(
      options.testDatabaseUrl,
      options.applicationDatabaseUrls ?? [],
      options.allowRemote === true,
    );
  }

  const databaseUrl = options.databaseUrlUnpooled ?? options.databaseUrl;
  if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED ou DATABASE_URL é obrigatória para executar migrações.");
  return databaseUrl;
}
