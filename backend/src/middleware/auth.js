import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";
import { permissionsForRole } from "../config/permissions.js";

// Verifies the Bearer JWT and attaches req.user = { id, username, role, permissions }.
export function authenticate(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new UnauthorizedError("Missing or malformed Authorization header"));
  }
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      permissions: permissionsForRole(payload.role),
    };
    return next();
  } catch {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
}
