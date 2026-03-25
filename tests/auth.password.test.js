import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "../lib/auth/password.js";

test("hashPassword and verifyPassword round-trip for valid credentials", () => {
  const password = "change-me-superadmin";
  const storedHash = hashPassword(password);

  assert.ok(storedHash.includes(":"), "stored hash should contain salt separator");
  assert.equal(verifyPassword(password, storedHash), true);
});

test("verifyPassword rejects wrong password and malformed stored hash", () => {
  const storedHash = hashPassword("owner-secret");

  assert.equal(verifyPassword("wrong-password", storedHash), false);
  assert.equal(verifyPassword("anything", "not-a-valid-hash"), false);
});
