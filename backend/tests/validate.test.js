import { test } from "node:test";
import assert from "node:assert/strict";
import { requireFields, clampInt, isNonEmptyString } from "../src/utils/validate.js";
import { BadRequestError } from "../src/utils/errors.js";

test("requireFields throws BadRequestError listing missing fields", () => {
  assert.throws(() => requireFields({ a: "x" }, ["a", "b", "c"]), (e) => e instanceof BadRequestError && /b, c/.test(e.message));
  assert.doesNotThrow(() => requireFields({ a: "x", b: "y" }, ["a", "b"]));
});

test("requireFields treats whitespace-only as missing", () => {
  assert.throws(() => requireFields({ name: "   " }, ["name"]), BadRequestError);
});

test("clampInt bounds values and falls back on NaN", () => {
  assert.equal(clampInt("500", { min: 1, max: 200, fallback: 50 }), 200);
  assert.equal(clampInt("0", { min: 1, max: 200, fallback: 50 }), 1);
  assert.equal(clampInt("abc", { min: 1, max: 200, fallback: 50 }), 50);
  assert.equal(clampInt("25", { min: 1, max: 200, fallback: 50 }), 25);
});

test("isNonEmptyString", () => {
  assert.equal(isNonEmptyString("hi"), true);
  assert.equal(isNonEmptyString("  "), false);
  assert.equal(isNonEmptyString(5), false);
});
