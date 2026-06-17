import { userService } from "../services/userService.js";
import { logService } from "../services/logService.js";
import { requireFields } from "../utils/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";

function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  if (Number.isNaN(id)) throw new BadRequestError("Invalid user id");
  return id;
}

export const userController = {
  list: asyncHandler(async (_req, res) => {
    res.json({ data: await userService.list() });
  }),

  create: asyncHandler(async (req, res) => {
    requireFields(req.body, ["fullName", "username", "password", "role"]);
    const user = await userService.create(req.body);
    logService.record(req.user, {
      action: "user_create", status: "ok", detail: `Created ${user.roleLabel} "${user.username}"`,
    }, req.meta).catch(() => {});
    res.status(201).json({ data: user });
  }),

  update: asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const user = await userService.update(id, req.user.id, req.body);
    logService.record(req.user, {
      action: "user_update", status: "ok", detail: `Updated "${user.username}"`,
    }, req.meta).catch(() => {});
    res.json({ data: user });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const removed = await userService.remove(id, req.user.id);
    logService.record(req.user, {
      action: "user_delete", status: "ok", detail: `Removed "${removed.fullName}"`,
    }, req.meta).catch(() => {});
    res.json({ data: removed });
  }),
};
