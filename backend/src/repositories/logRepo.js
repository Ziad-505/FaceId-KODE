import { query } from "../config/db.js";

export const logRepo = {
  async create({ actorId, actorUsername, actorFullName, action, status, detail, targetCode, carrierId, ip, userAgent }) {
    const { rows } = await query(
      `INSERT INTO audit_logs
         (actor_id, actor_username, actor_full_name, action, status, detail, target_code, carrier_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, actor_id, actor_username, actor_full_name, action, status, detail, target_code, carrier_id, created_at`,
      [actorId, actorUsername, actorFullName ?? "", action, status, detail ?? "", targetCode ?? null, carrierId ?? null, ip ?? null, userAgent ?? null]
    );
    return rows[0];
  },

  // Filtered + paginated. `scopeActorId` (when set) restricts to one actor (CX agents see only their own).
  async list({ scopeActorId, actorId, action, status, from, to, limit, offset }) {
    const where = [];
    const values = [];
    let i = 1;
    if (scopeActorId !== undefined && scopeActorId !== null) { where.push(`actor_id = $${i++}`); values.push(scopeActorId); }
    if (actorId) { where.push(`actor_id = $${i++}`); values.push(actorId); }
    if (action) { where.push(`action = $${i++}`); values.push(action); }
    if (status) { where.push(`status = $${i++}`); values.push(status); }
    if (from) { where.push(`created_at >= $${i++}`); values.push(from); }
    if (to) { where.push(`created_at <= $${i++}`); values.push(to); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countRes = await query(`SELECT COUNT(*)::int AS n FROM audit_logs ${whereSql}`, values);
    const total = countRes.rows[0].n;

    const dataValues = [...values, limit, offset];
    const { rows } = await query(
      `SELECT id, actor_id, actor_username, actor_full_name, action, status, detail, target_code, carrier_id, created_at
         FROM audit_logs ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${i++} OFFSET $${i++}`,
      dataValues
    );
    return { rows, total };
  },

  // ── Dashboard aggregations ──
  async summary() {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE action IN ('upload','bulk_upload') AND status = 'ok')::int AS total_enrollments,
        COUNT(*) FILTER (WHERE action IN ('upload','bulk_upload') AND status = 'ok'
                         AND created_at >= date_trunc('day', now()))::int AS today_enrollments,
        COUNT(*) FILTER (WHERE action IN ('upload','bulk_upload'))::int AS total_enroll_attempts,
        COUNT(*) FILTER (WHERE action IN ('upload','bulk_upload') AND status = 'err')::int AS failed_enrollments,
        COUNT(*) FILTER (WHERE action = 'lookup')::int AS total_lookups
      FROM audit_logs
    `);
    return rows[0];
  },

  async timeseries(days) {
    const { rows } = await query(
      `SELECT
         to_char(d.day, 'YYYY-MM-DD') AS date,
         COALESCE(SUM(CASE WHEN l.status = 'ok'  THEN 1 ELSE 0 END), 0)::int AS ok,
         COALESCE(SUM(CASE WHEN l.status = 'err' THEN 1 ELSE 0 END), 0)::int AS err
       FROM generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day',
                            date_trunc('day', now()), interval '1 day') AS d(day)
       LEFT JOIN audit_logs l
         ON date_trunc('day', l.created_at) = d.day
        AND l.action IN ('upload','bulk_upload')
       GROUP BY d.day
       ORDER BY d.day ASC`,
      [days]
    );
    return rows;
  },

  async byAction() {
    const { rows } = await query(`
      SELECT action, COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE status = 'ok')::int AS ok,
             COUNT(*) FILTER (WHERE status = 'err')::int AS err
      FROM audit_logs GROUP BY action ORDER BY total DESC`);
    return rows;
  },

  async byUser(limit = 8) {
    const { rows } = await query(
      `SELECT actor_username,
              MAX(actor_full_name) AS actor_full_name,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE action IN ('upload','bulk_upload') AND status = 'ok')::int AS enrollments
       FROM audit_logs
       GROUP BY actor_username
       ORDER BY total DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async recent(limit = 10) {
    const { rows } = await query(
      `SELECT id, actor_username, action, status, detail, target_code, carrier_id, created_at
       FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows;
  },
};
