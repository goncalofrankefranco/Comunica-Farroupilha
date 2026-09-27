import assert from "node:assert/strict";
import { test } from "node:test";

test("student password access is disabled unless the temporary fallback is enabled", async () => {
  const { canUsePasswordLogin } = await import("../src/lib/password-login-policy.ts");

  assert.equal(canUsePasswordLogin("student", false), false);
  assert.equal(canUsePasswordLogin("student", true), true);
});

test("GEF password access remains available while the student fallback is disabled", async () => {
  const { canUsePasswordLogin } = await import("../src/lib/password-login-policy.ts");

  assert.equal(canUsePasswordLogin("gef", false), true);
  assert.equal(canUsePasswordLogin("administrator", true), false);
});
