import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLES, PERMISSIONS, permissionsForRole, roleHasPermission, isValidRole } from "../src/config/permissions.js";

test("admin has full permission set including user + dashboard management", () => {
  const perms = permissionsForRole(ROLES.ADMIN);
  assert.ok(perms.includes(PERMISSIONS.USERS_MANAGE));
  assert.ok(perms.includes(PERMISSIONS.DASHBOARD_VIEW));
  assert.ok(perms.includes(PERMISSIONS.LOGS_VIEW_ALL));
  assert.ok(perms.includes(PERMISSIONS.BULK_ENROLL));
});

test("cx_agent can enroll but cannot manage users or view dashboard", () => {
  const perms = permissionsForRole(ROLES.CX_AGENT);
  assert.ok(perms.includes(PERMISSIONS.MEMBERS_ENROLL));
  assert.ok(perms.includes(PERMISSIONS.BULK_ENROLL));
  assert.ok(perms.includes(PERMISSIONS.LOGS_VIEW_OWN));
  assert.ok(!perms.includes(PERMISSIONS.USERS_MANAGE));
  assert.ok(!perms.includes(PERMISSIONS.DASHBOARD_VIEW));
  assert.ok(!perms.includes(PERMISSIONS.LOGS_VIEW_ALL));
});

test("roleHasPermission + isValidRole behave correctly", () => {
  assert.equal(roleHasPermission(ROLES.ADMIN, PERMISSIONS.USERS_MANAGE), true);
  assert.equal(roleHasPermission(ROLES.CX_AGENT, PERMISSIONS.USERS_MANAGE), false);
  assert.equal(isValidRole("admin"), true);
  assert.equal(isValidRole("cx_agent"), true);
  assert.equal(isValidRole("superuser"), false);
});
