import { logRepo } from "../repositories/logRepo.js";
import { userRepo } from "../repositories/userRepo.js";
import { clampInt } from "../utils/validate.js";

const ALLOWED_ACTIONS = new Set([
  "login", "lookup", "upload", "bulk_upload",
  "user_create", "user_update", "user_delete",
]);
const ALLOWED_STATUSES = new Set(["ok", "err", "info"]);

export const logService = {
  async record(actor, payload, requestMeta) {
    const action = ALLOWED_ACTIONS.has(payload.action) ? payload.action : "info";
    const status = ALLOWED_STATUSES.has(payload.status) ? payload.status : "info";
    const user = await userRepo.findById(actor.id);
    const actorFullName = user?.full_name ?? actor.fullName ?? actor.username;
    return logRepo.create({
      actorId: actor.id,
      actorUsername: actor.username,
      actorFullName,
      action,
      status,
      detail: typeof payload.detail === "string" ? payload.detail.slice(0, 1000) : "",
      targetCode: payload.targetCode ?? null,
      carrierId: payload.carrierId != null ? String(payload.carrierId) : null,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });
  },

  // canViewAll → admin; otherwise restricted to the actor's own logs.
  async list({ canViewAll, actorScopeId, filters }) {
    const limit = clampInt(filters.limit, { min: 1, max: 200, fallback: 50 });
    const page = clampInt(filters.page, { min: 1, max: 100000, fallback: 1 });
    const offset = (page - 1) * limit;

    const { rows, total } = await logRepo.list({
      scopeActorId: canViewAll ? undefined : actorScopeId,
      actorId: filters.actorId,
      action: filters.action,
      status: filters.status,
      from: filters.from,
      to: filters.to,
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    };
  },
};
