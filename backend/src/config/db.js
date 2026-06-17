import pg from "pg";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

// Single shared connection pool. The repositories are the only layer that
// imports this — everything above them speaks in plain JS objects.
const poolConfig = env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : {
      host: env.pg.host,
      port: env.pg.port,
      user: env.pg.user,
      password: env.pg.password,
      database: env.pg.database,
    };

export const pool = new pg.Pool(poolConfig);

pool.on("error", (err) => {
  logger.error("db_pool_error", { message: err.message });
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
