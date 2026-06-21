import dotenv from "dotenv";
dotenv.config();

const LOG_LEVELS = new Set(["error", "warn", "info", "debug"]);

function resolveLogLevel() {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return LOG_LEVELS.has(raw) ? raw : "info";
}

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  databaseUrl: process.env.DATABASE_URL,
  pg: {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),

  seed: {
    adminUsername: process.env.SEED_ADMIN_USERNAME ?? "admin",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "kode@2026!",
    adminFullName: process.env.SEED_ADMIN_FULLNAME ?? "Administrator",
    cxUsername: process.env.SEED_CX_USERNAME ?? "cxteam",
    cxPassword: process.env.SEED_CX_PASSWORD ?? "cxteam@26",
    cxFullName: process.env.SEED_CX_FULLNAME ?? "CX Team",
  },

  isProd: process.env.NODE_ENV === "production",
  logLevel: resolveLogLevel(),
};
