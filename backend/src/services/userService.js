import { userRepo } from "../repositories/userRepo.js";
import { hashPassword } from "../utils/hash.js";
import { isValidRole } from "../config/permissions.js";
import { toPublicUser } from "./authService.js";
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from "../utils/errors.js";

const MIN_PASSWORD_LENGTH = 6;

export const userService = {
  async list() {
    const rows = await userRepo.list();
    return rows.map(toPublicUser);
  },

  async create({ fullName, username, password, role }) {
    if (!isValidRole(role)) throw new BadRequestError("Invalid role");
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    const existing = await userRepo.findByUsername(username.trim());
    if (existing) throw new ConflictError("Username already taken");

    const passwordHash = await hashPassword(password);
    const row = await userRepo.create({
      fullName: fullName.trim(),
      username: username.trim(),
      passwordHash,
      role,
    });
    return toPublicUser(row);
  },

  async update(id, actingUserId, { fullName, role, password, isActive }) {
    const target = await userRepo.findById(id);
    if (!target) throw new NotFoundError("User not found");

    if (role !== undefined && !isValidRole(role)) throw new BadRequestError("Invalid role");
    // Guard: an admin cannot demote or deactivate themselves (avoids lockout).
    if (id === actingUserId && (role !== undefined || isActive === false)) {
      throw new ForbiddenError("You cannot change your own role or active state");
    }

    let passwordHash;
    if (password !== undefined) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new BadRequestError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      }
      passwordHash = await hashPassword(password);
    }

    const row = await userRepo.update(id, {
      fullName: fullName?.trim(),
      role,
      passwordHash,
      isActive,
    });
    return toPublicUser(row);
  },

  async remove(id, actingUserId) {
    if (id === actingUserId) throw new ForbiddenError("You cannot delete your own account");
    const target = await userRepo.findById(id);
    if (!target) throw new NotFoundError("User not found");
    await userRepo.remove(id);
    return { id, fullName: target.full_name };
  },
};
