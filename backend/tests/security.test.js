import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/utils/hash.js";
import { signToken, verifyToken } from "../src/utils/jwt.js";

test("password hashing round-trips and rejects wrong passwords", async () => {
  const hash = await hashPassword("kode@2026!");
  assert.notEqual(hash, "kode@2026!");
  assert.equal(await verifyPassword("kode@2026!", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
});

test("JWT sign/verify round-trips the claims", () => {
  const token = signToken({ sub: 7, username: "admin", role: "admin" });
  const decoded = verifyToken(token);
  assert.equal(decoded.sub, 7);
  assert.equal(decoded.username, "admin");
  assert.equal(decoded.role, "admin");
});

test("tampered tokens are rejected", () => {
  const token = signToken({ sub: 1, role: "admin" });
  assert.throws(() => verifyToken(token + "x"));
});
