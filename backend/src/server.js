import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info("server_started", {
    port: env.port,
    nodeEnv: process.env.NODE_ENV ?? "development",
    logLevel: env.logLevel,
  });
});

async function shutdown(signal) {
  logger.info("server_shutdown", { signal });
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
