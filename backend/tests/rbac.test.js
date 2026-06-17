import { test } from "node:test";
import assert from "node:assert/strict";
import { requirePermission, requireRole } from "../src/middleware/rbac.js";
import { ROLES, PERMISSIONS } from "../src/config/permissions.js";

function run(mw, req) {
  return new Promise((resolve) => mw(req, {}, (err) => resolve(err)));
}

test("requirePermission allows a holder and blocks a non-holder", async () => {
  const adminReq = { user: { role: ROLES.ADMIN, permissions: [PERMISSIONS.USERS_MANAGE] } };
  const cxReq = { user: { role: ROLES.CX_AGENT, permissions: [PERMISSIONS.MEMBERS_ENROLL] } };
  assert.equal(await run(requirePermission(PERMISSIONS.USERS_MANAGE), adminReq), undefined);
  const blocked = await run(requirePermission(PERMISSIONS.USERS_MANAGE), cxReq);
  assert.equal(blocked?.status, 403);
});

test("requireRole enforces exact role membership", async () => {
  const ok = await run(requireRole(ROLES.ADMIN), { user: { role: ROLES.ADMIN, permissions: [] } });
  assert.equal(ok, undefined);
  const denied = await run(requireRole(ROLES.ADMIN), { user: { role: ROLES.CX_AGENT, permissions: [] } });
  assert.equal(denied?.status, 403);
});
