import { logService } from "../services/logService.js";
import { requireFields } from "../utils/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PERMISSIONS } from "../config/permissions.js";

export const logController = {
  create: asyncHandler(async (req, res) => {
    requireFields(req.body, ["action", "status"]);
    const entry = await logService.record(req.user, req.body, req.meta);
    res.status(201).json({ data: entry });
  }),

  list: asyncHandler(async (req, res) => {
    const canViewAll = req.user.permissions.includes(PERMISSIONS.LOGS_VIEW_ALL);
    const result = await logService.list({
      canViewAll,
      actorScopeId: req.user.id,
      filters: {
        actorId: req.query.actorId ? Number(req.query.actorId) : undefined,
        action: req.query.action,
        status: req.query.status,
        from: req.query.from,
        to: req.query.to,
        page: req.query.page,
        limit: req.query.limit,
      },
    });
    res.json(result);
  }),
};
