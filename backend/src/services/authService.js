import { userRepo } from "../repositories/userRepo.js";
import { verifyPassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";
import { permissionsForRole, ROLE_LABELS } from "../config/permissions.js";
import { UnauthorizedError } from "../utils/errors.js";

// Shapes a DB user row into the public profile the frontend consumes.
export function toPublicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    role: row.role,
    roleLabel: ROLE_LABELS[row.role] ?? row.role,
    permissions: permissionsForRole(row.role),
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
  };
}

export const authService = {
  async login(username, password) {
    const user = await userRepo.findByUsername(username);
    // Constant-ish failure path — same error whether user is missing or password wrong.
    if (!user || !user.is_active) throw new UnauthorizedError("Invalid username or password");

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) throw new UnauthorizedError("Invalid username or password");

    await userRepo.touchLastLogin(user.id);

    const publicUser = toPublicUser(user);
    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return { token, user: publicUser };
  },

  async me(userId) {
    const row = await userRepo.findById(userId);
    if (!row) throw new UnauthorizedError("Account no longer exists");
    return toPublicUser(row);
  },
};
