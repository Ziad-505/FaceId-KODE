import { authService } from "../services/authService.js";
import { logService } from "../services/logService.js";
import { requireFields } from "../utils/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authController = {
  login: asyncHandler(async (req, res) => {
    requireFields(req.body, ["username", "password"]);
    const result = await authService.login(req.body.username.trim(), req.body.password);
    // Best-effort audit of the successful login (never blocks the response).
    logService
      .record(result.user, { action: "login", status: "ok", detail: "Signed in" }, req.meta)
      .catch(() => {});
    res.json(result);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ user });
  }),
};
