import { test } from "node:test";
import assert from "node:assert/strict";
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from "../src/utils/errors.js";

test("typed errors carry the right HTTP status + code", () => {
  assert.equal(new BadRequestError().status, 400);
  assert.equal(new UnauthorizedError().status, 401);
  assert.equal(new ForbiddenError().status, 403);
  assert.equal(new NotFoundError().status, 404);
  assert.equal(new ConflictError().status, 409);
  assert.ok(new BadRequestError() instanceof AppError);
  assert.equal(new ConflictError().code, "CONFLICT");
});
