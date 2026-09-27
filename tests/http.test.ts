import assert from "node:assert/strict";
import { test } from "node:test";

test("timestamp cursors reject malformed values and accept canonical database cursors", async () => {
  const { parseTimestampCursor } = await import("../src/lib/http.ts");
  const cursor = "2026-09-26T12:34:56.123456Z~123e4567-e89b-42d3-a456-426614174000";

  assert.equal(parseTimestampCursor(null), undefined);
  assert.deepEqual(parseTimestampCursor(cursor), {
    createdAt: "2026-09-26T12:34:56.123456Z",
    id: "123e4567-e89b-42d3-a456-426614174000",
  });
  assert.equal(parseTimestampCursor("bad~not-an-id"), null);
  assert.equal(parseTimestampCursor("2026-02-30T12:34:56.123456Z~123e4567-e89b-42d3-a456-426614174000"), null);
  assert.equal(parseTimestampCursor("2026-09-26T12:34:56.123Z~123e4567-e89b-42d3-a456-426614174000"), null);
});
