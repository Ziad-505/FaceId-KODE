import { ForbiddenError } from "../utils/errors.js";

// Route guard factory. Usage: router.post("/", authenticate, requirePermission("users.manage"), ...)
export function requirePermission(...permissions) {
  return (req, _res, next) => {
    const held = req.user?.permissions ?? [];
    const ok = permissions.every((p) => held.includes(p));
    if (!ok) return next(new ForbiddenError("You do not have permission to perform this action"));
    return next();
  };
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new ForbiddenError("Insufficient role"));
    }
    return next();
  };
}
