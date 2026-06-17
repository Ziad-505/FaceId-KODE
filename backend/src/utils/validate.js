import { BadRequestError } from "./errors.js";

export function requireFields(body, fields) {
  const missing = fields.filter((f) => {
    const v = body?.[f];
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  });
  if (missing.length) {
    throw new BadRequestError(`Missing required field(s): ${missing.join(", ")}`);
  }
}

export function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function clampInt(value, { min, max, fallback }) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
