import { useCallback, useEffect, useState } from "react";
import { palette, baseStyles, radius } from "../config/theme";
import { Card, Badge, Button, Icon } from "../components";
import { portalApi, PortalAuthError } from "../services/portalApi";

const ROLE_OPTIONS = [
  { value: "cx_agent", label: "CX Agent" },
  { value: "admin", label: "Admin" },
];
const ACTION_FILTERS = ["", "login", "lookup", "upload", "bulk_upload", "user_create", "user_update", "user_delete"];
const STATUS_FILTERS = ["", "ok", "err", "info"];
const ACTION_LABELS = { lookup: "Lookup", upload: "Upload", bulk_upload: "Bulk upload", login: "Login", user_create: "User created", user_update: "User updated", user_delete: "User deleted", info: "Info" };

function roleLabel(role) { return role === "admin" ? "Admin" : "CX Agent"; }

const th = {
  padding: "11px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 700,
  color: palette.dim, textTransform: "uppercase", letterSpacing: ".4px",
  position: "sticky", top: 0, background: palette.surface2, zIndex: 1,
};
const td = { padding: "13px 18px", fontSize: 13.5 };

export function Admin({ currentUser, onFlash, onSessionExpired }) {
  const [tab, setTab] = useState("users");

  // ── users state ──
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", username: "", password: "", role: "cx_agent" });

  // ── logs state ──
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filters, setFilters] = useState({ action: "", status: "", page: 1 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const handleError = useCallback((err, fallback) => {
    if (err instanceof PortalAuthError) onSessionExpired?.(err.message);
    else onFlash?.(`${fallback}: ${err.message}`, "err");
  }, [onFlash, onSessionExpired]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try { setUsers(await portalApi.listUsers()); }
    catch (err) { handleError(err, "Could not load users"); }
    finally { setUsersLoading(false); }
  }, [handleError]);

  const loadLogs = useCallback(async (f) => {
    setLogsLoading(true);
    try {
      const res = await portalApi.listLogs({ action: f.action, status: f.status, page: f.page, limit: 25 });
      setLogs(res.data); setPagination(res.pagination);
    } catch (err) { handleError(err, "Could not load logs"); }
    finally { setLogsLoading(false); }
  }, [handleError]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (tab === "logs") loadLogs(filters); }, [tab, filters, loadLogs]);

  const handleAddUser = async () => {
    const u = newUser;
    if (!u.fullName.trim() || !u.username.trim() || !u.password) { onFlash?.("All fields required", "err"); return; }
    try {
      await portalApi.createUser({ fullName: u.fullName.trim(), username: u.username.trim(), password: u.password, role: u.role });
      onFlash?.(`User "${u.fullName}" added`, "ok");
      setNewUser({ fullName: "", username: "", password: "", role: "cx_agent" });
      setAdding(false);
      loadUsers();
    } catch (err) { handleError(err, "Could not add user"); }
  };

  const handleRoleChange = async (user, role) => {
    try { await portalApi.updateUser(user.id, { role }); onFlash?.(`${user.fullName} is now ${roleLabel(role)}`, "ok"); loadUsers(); }
    catch (err) { handleError(err, "Could not update role"); }
  };

  const handleToggleActive = async (user) => {
    try { await portalApi.updateUser(user.id, { isActive: !user.isActive }); onFlash?.(`${user.fullName} ${user.isActive ? "deactivated" : "activated"}`, "ok"); loadUsers(); }
    catch (err) { handleError(err, "Could not update status"); }
  };

  const handleRemove = async (user) => {
    try { await portalApi.deleteUser(user.id); onFlash?.(`Removed "${user.fullName}"`, "ok"); loadUsers(); }
    catch (err) { handleError(err, "Could not remove user"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* tabs */}
      <div style={{ display: "flex", gap: 6, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.md, padding: 4, width: "fit-content" }}>
        {[{ k: "users", label: "Users & Roles", icon: "users" }, { k: "logs", label: "Audit Logs", icon: "database" }].map((t) => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px",
              borderRadius: radius.sm, border: "none", cursor: "pointer",
              background: tab === t.k ? palette.accentGlow : "transparent",
              color: tab === t.k ? palette.accent : palette.muted,
              fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-sans)",
            }}>
            <Icon name={t.icon} size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS ── */}
      {tab === "users" && (
        <Card padded={false}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${palette.border}` }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Portal Users</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: palette.dim }}>{users.length} account{users.length !== 1 ? "s" : ""} · Admins manage access &amp; roles</p>
            </div>
            <Button icon={adding ? "x" : "plus"} variant={adding ? "ghost" : "primary"} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "Add User"}</Button>
          </div>

          {adding && (
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${palette.border}`, background: palette.surface2, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", animation: "fadeUp .2s var(--ease)" }}>
              <div style={{ flex: "1 1 150px" }}>
                <label style={baseStyles.label}>Full Name</label>
                <input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="John Doe" style={baseStyles.input} />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <label style={baseStyles.label}>Username</label>
                <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="johndoe" style={baseStyles.input} autoComplete="off" />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <label style={baseStyles.label}>Password</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="min 6 chars" style={baseStyles.input} autoComplete="new-password" />
              </div>
              <div style={{ flex: "0 0 130px" }}>
                <label style={baseStyles.label}>Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ ...baseStyles.input, cursor: "pointer" }}>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <Button onClick={handleAddUser} icon="check">Save</Button>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Full Name", "Username", "Role", "Status", "Last Login", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: palette.dim, padding: 30 }}>Loading users…</td></tr>
                ) : users.map((u) => {
                  const self = u.id === currentUser.id;
                  return (
                    <tr key={u.id} style={{ borderTop: `1px solid ${palette.border}` }}>
                      <td style={td}>
                        <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                        {self && <span style={{ marginLeft: 8, fontSize: 11, color: palette.dim }}>(you)</span>}
                      </td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12.5, color: palette.muted }}>{u.username}</td>
                      <td style={td}>
                        {self ? <Badge tone={u.role === "admin" ? "warn" : "info"}>{roleLabel(u.role)}</Badge> : (
                          <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}
                            style={{ ...baseStyles.input, width: "auto", padding: "6px 10px", fontSize: 12.5, cursor: "pointer" }}>
                            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        )}
                      </td>
                      <td style={td}>
                        <button type="button" disabled={self} onClick={() => handleToggleActive(u)}
                          style={{ background: "none", border: "none", cursor: self ? "default" : "pointer", padding: 0 }}>
                          <Badge tone={u.isActive ? "ok" : "neutral"} dot>{u.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                        </button>
                      </td>
                      <td style={{ ...td, fontSize: 12, color: palette.dim, fontFamily: "var(--font-mono)" }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "—"}</td>
                      <td style={td}>
                        <button type="button" onClick={() => handleRemove(u)} disabled={self}
                          title={self ? "You cannot remove yourself" : "Remove user"}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: self ? "not-allowed" : "pointer", color: self ? palette.dim : palette.err, fontSize: 12.5, fontWeight: 600, padding: "5px 8px", borderRadius: 6, opacity: self ? 0.5 : 1 }}>
                          <Icon name="trash" size={14} /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── LOGS ── */}
      {tab === "logs" && (
        <Card padded={false}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 22px", borderBottom: `1px solid ${palette.border}`, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Audit Logs</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: palette.dim }}>{pagination.total} event{pagination.total !== 1 ? "s" : ""} recorded</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))} style={{ ...baseStyles.input, width: "auto", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
                {ACTION_FILTERS.map((a) => <option key={a} value={a}>{a ? (ACTION_LABELS[a] ?? a) : "All actions"}</option>)}
              </select>
              <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} style={{ ...baseStyles.input, width: "auto", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
                {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s ? s.toUpperCase() : "All statuses"}</option>)}
              </select>
              <Button variant="ghost" icon="refresh" onClick={() => loadLogs(filters)} loading={logsLoading} size="sm">Refresh</Button>
            </div>
          </div>

          <div style={{ overflowX: "auto", maxHeight: 520 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Time", "Performed by", "Action", "Status", "Member", "Detail"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {logsLoading ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: palette.dim, padding: 30 }}>Loading logs…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: palette.dim, padding: 36 }}>No matching events</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} style={{ borderTop: `1px solid ${palette.border}` }}>
                    <td style={{ ...td, fontSize: 11.5, fontFamily: "var(--font-mono)", color: palette.dim, whiteSpace: "nowrap" }}>{new Date(l.created_at).toLocaleString()}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.actor_full_name || l.actor_username}</div>
                      {l.actor_full_name && (
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: palette.dim }}>@{l.actor_username}</div>
                      )}
                    </td>
                    <td style={td}>{ACTION_LABELS[l.action] ?? l.action}</td>
                    <td style={td}><Badge tone={l.status === "ok" ? "ok" : l.status === "err" ? "err" : "info"}>{l.status === "ok" ? "SUCCESS" : l.status === "err" ? "FAILED" : "INFO"}</Badge></td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12.5, color: palette.muted }}>{l.target_code || "—"}</td>
                    <td style={{ ...td, fontSize: 12.5, color: palette.muted, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderTop: `1px solid ${palette.border}` }}>
              <span style={{ fontSize: 12.5, color: palette.dim }}>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" variant="ghost" disabled={pagination.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</Button>
                <Button size="sm" variant="ghost" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
