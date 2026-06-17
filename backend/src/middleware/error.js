import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

// 404 fallback for unmatched routes.
export function notFound(_req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

// Central error handler — maps typed errors to HTTP responses.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error("app_error", {
        requestId: req.requestId ?? null,
        code: err.code,
        message: err.message,
        status: err.status,
      });
    }
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  logger.error("unhandled_error", {
    requestId: req.requestId ?? null,
    message: err?.message ?? String(err),
    stack: err?.stack,
  });
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}
