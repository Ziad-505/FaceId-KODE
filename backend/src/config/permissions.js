// Fixed role-based access control. Two roles, permissions baked in per role.
// Permissions are coarse-grained capability strings the frontend uses to
// show/hide UI and the backend uses to guard routes.
export const ROLES = Object.freeze({
  ADMIN: "admin",
  CX_AGENT: "cx_agent",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Admin",
  [ROLES.CX_AGENT]: "CX Agent",
});

export const PERMISSIONS = Object.freeze({
  MEMBERS_LOOKUP: "members.lookup",
  MEMBERS_ENROLL: "members.enroll",
  BULK_ENROLL: "bulk.enroll",
  USERS_MANAGE: "users.manage",
  DASHBOARD_VIEW: "dashboard.view",
  LOGS_VIEW_ALL: "logs.view.all",
  LOGS_VIEW_OWN: "logs.view.own",
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [
    PERMISSIONS.MEMBERS_LOOKUP,
    PERMISSIONS.MEMBERS_ENROLL,
    PERMISSIONS.BULK_ENROLL,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.LOGS_VIEW_ALL,
  ],
  [ROLES.CX_AGENT]: [
    PERMISSIONS.MEMBERS_LOOKUP,
    PERMISSIONS.MEMBERS_ENROLL,
    PERMISSIONS.BULK_ENROLL,
    PERMISSIONS.LOGS_VIEW_OWN,
  ],
});

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

export function roleHasPermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}
