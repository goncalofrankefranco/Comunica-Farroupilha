import assert from "node:assert/strict";
import { test } from "node:test";

test("legacy account linking trims the username but preserves the password exactly", async () => {
  const { parseLegacyLinkCredentials } = await import("../src/lib/legacy-account-linking.ts");

  assert.deepEqual(
    parseLegacyLinkCredentials({ username: "  ana.silva  ", password: "  senha antiga  " }),
    { username: "ana.silva", password: "  senha antiga  " },
  );
});

test("legacy account linking rejects missing or oversized credentials", async () => {
  const { parseLegacyLinkCredentials } = await import("../src/lib/legacy-account-linking.ts");

  assert.equal(parseLegacyLinkCredentials({ username: "  ", password: "senha antiga" }), null);
  assert.equal(parseLegacyLinkCredentials({ username: "ana.silva", password: "" }), null);
  assert.equal(parseLegacyLinkCredentials({ username: "a".repeat(161), password: "senha antiga" }), null);
  assert.equal(parseLegacyLinkCredentials({ username: "ana.silva", password: "s".repeat(257) }), null);
});
