// Normalizes client IP + user-agent for audit logging.
export function requestMeta(req, _res, next) {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim()) || req.socket?.remoteAddress || null;
  req.meta = { ip, userAgent: req.headers["user-agent"] ?? null };
  next();
}
