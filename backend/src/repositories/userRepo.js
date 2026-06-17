import { query } from "../config/db.js";

// Only this layer writes SQL for the users table. Returns plain rows;
// password_hash is included only where the service explicitly needs it.
const PUBLIC_COLUMNS =
  "id, full_name, username, role, is_active, created_at, updated_at, last_login_at";

export const userRepo = {
  async findByUsername(username) {
    const { rows } = await query(
      `SELECT id, full_name, username, password_hash, role, is_active
         FROM users WHERE username = $1`,
      [username]
    );
    return rows[0] ?? null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async list() {
    const { rows } = await query(
      `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY created_at ASC`
    );
    return rows;
  },

  async create({ fullName, username, passwordHash, role }) {
    const { rows } = await query(
      `INSERT INTO users (full_name, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_COLUMNS}`,
      [fullName, username, passwordHash, role]
    );
    return rows[0];
  },

  async update(id, { fullName, role, passwordHash, isActive }) {
    // Build a dynamic SET clause from provided fields only.
    const sets = [];
    const values = [];
    let i = 1;
    if (fullName !== undefined) { sets.push(`full_name = $${i++}`); values.push(fullName); }
    if (role !== undefined) { sets.push(`role = $${i++}`); values.push(role); }
    if (passwordHash !== undefined) { sets.push(`password_hash = $${i++}`); values.push(passwordHash); }
    if (isActive !== undefined) { sets.push(`is_active = $${i++}`); values.push(isActive); }
    if (sets.length === 0) return this.findById(id);
    sets.push(`updated_at = now()`);
    values.push(id);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${i} RETURNING ${PUBLIC_COLUMNS}`,
      values
    );
    return rows[0] ?? null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [id]);
    return rowCount > 0;
  },

  async touchLastLogin(id) {
    await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [id]);
  },

  async countActive() {
    const { rows } = await query(`SELECT COUNT(*)::int AS n FROM users WHERE is_active = TRUE`);
    return rows[0].n;
  },
};
