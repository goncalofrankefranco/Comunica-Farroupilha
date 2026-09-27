import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { test } from "node:test";
import { Pool } from "@neondatabase/serverless";
import { getTestDatabaseUrl } from "./test-database.ts";

const testDatabaseUrl = getTestDatabaseUrl();

test("shared rate-limit buckets enforce concurrent requests atomically", { skip: !testDatabaseUrl }, async () => {
  const { enforceRequestLimit } = await import("../src/lib/rate-limit.ts");
  const secret = process.env.RATE_LIMIT_SECRET ?? testDatabaseUrl!;
  const address = "203.0.113.43";
  const scope = `rate-limit-test:${randomUUID()}`;
  const bucketHash = createHmac("sha256", secret).update(`${scope}\0ip:${address}`).digest("hex");
  const request = new Request("https://example.test", { headers: { "x-forwarded-for": address } });
  const pool = new Pool({ connectionString: testDatabaseUrl! });

  try {
    const results = await Promise.all(Array.from({ length: 8 }, () => enforceRequestLimit(request, scope, 3, 60)));
    assert.equal(results.filter((result) => result === null).length, 3);
    assert.equal(results.filter((result) => result?.status === 429).length, 5);
  } finally {
    await pool.query("DELETE FROM request_rate_limits WHERE bucket_hash = $1", [bucketHash]);
    await pool.end();
  }
});
