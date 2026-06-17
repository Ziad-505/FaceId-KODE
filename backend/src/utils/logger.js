import { env } from "../config/env.js";

const LEVEL_RANK = { error: 0, warn: 1, info: 2, debug: 3 };

function shouldLog(level) {
  const configured = LEVEL_RANK[env.logLevel] ?? LEVEL_RANK.info;
  return (LEVEL_RANK[level] ?? LEVEL_RANK.info) <= configured;
}

function write(level, message, fields = {}) {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    service: "kode-face-id-backend",
    msg: message,
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  error(message, fields) {
    write("error", message, fields);
  },
  warn(message, fields) {
    write("warn", message, fields);
  },
  info(message, fields) {
    write("info", message, fields);
  },
  debug(message, fields) {
    write("debug", message, fields);
  },
  child(context) {
    return {
      error: (message, fields) => write("error", message, { ...context, ...fields }),
      warn: (message, fields) => write("warn", message, { ...context, ...fields }),
      info: (message, fields) => write("info", message, { ...context, ...fields }),
      debug: (message, fields) => write("debug", message, { ...context, ...fields }),
    };
  },
};
