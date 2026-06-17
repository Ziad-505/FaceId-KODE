import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { ROLES } from "../config/permissions.js";
import { hashPassword } from "../utils/hash.js";

// Idempotent seed: inserts the initial admin + CX agent only if absent.
async function upsertUser({ fullName, username, password, role }) {
  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rowCount > 0) {
    console.log(`[seed] user "${username}" already exists — skipping`);
    return;
  }
  const passwordHash = await hashPassword(password);
  await pool.query(
    `INSERT INTO users (full_name, username, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    [fullName, username, passwordHash, role]
  );
  console.log(`[seed] created ${role} "${username}"`);
}

async function seed() {
  await upsertUser({
    fullName: env.seed.adminFullName,
    username: env.seed.adminUsername,
    password: env.seed.adminPassword,
    role: ROLES.ADMIN,
  });
  await upsertUser({
    fullName: env.seed.cxFullName,
    username: env.seed.cxUsername,
    password: env.seed.cxPassword,
    role: ROLES.CX_AGENT,
  });
  await pool.end();
}

seed().catch((err) => {
  console.error("[seed] failed:", err.message);
  process.exit(1);
});
