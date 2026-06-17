// Frontend mirror of the backend permission strings (single source of truth
// for what UI a role can see). The backend is always the enforcement point.
export const PERM = {
  MEMBERS_LOOKUP: "members.lookup",
  MEMBERS_ENROLL: "members.enroll",
  BULK_ENROLL: "bulk.enroll",
  USERS_MANAGE: "users.manage",
  DASHBOARD_VIEW: "dashboard.view",
  LOGS_VIEW_ALL: "logs.view.all",
  LOGS_VIEW_OWN: "logs.view.own",
};

export function can(user, permission) {
  return Boolean(user?.permissions?.includes(permission));
}
