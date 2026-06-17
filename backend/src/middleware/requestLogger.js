import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

const SLOW_MS = 1000;

// Structured HTTP access logs for monitoring (method, path, status, latency, client).
export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const fields = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.meta?.ip ?? null,
      userAgent: req.meta?.userAgent ?? null,
    };

    if (status >= 500) logger.error("http_request", fields);
    else if (status >= 400 || durationMs >= SLOW_MS) logger.warn("http_request", fields);
    else logger.info("http_request", fields);
  });

  next();
}
