import { useCallback, useEffect, useState } from "react";
import { palette, radius } from "../config/theme";
import { Card, StatCard, Badge, Button, Icon } from "../components";
import { TrendChart, BarList } from "../components/Charts";
import { portalApi, PortalAuthError } from "../services/portalApi";

const RANGES = [
  { key: "7d", label: "7d" },
  { key: "14d", label: "14d" },
  { key: "30d", label: "30d" },
];

const ACTION_LABELS = { lookup: "Lookup", upload: "Upload", bulk_upload: "Bulk upload", login: "Login", user_create: "User created", user_update: "User updated", user_delete: "User deleted" };

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function actorLabel(entry) {
  if (entry.actor_full_name?.trim()) return `${entry.actor_full_name} (@${entry.actor_username})`;
  return entry.actor_username;
}

export function Dashboard({ onFlash, onSessionExpired }) {
  const [range, setRange] = useState("7d");
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [breakdown, setBreakdown] = useState({ byAction: [], byUser: [], recent: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (selectedRange) => {
    setLoading(true);
    try {
      const [s, ts, bd] = await Promise.all([
        portalApi.dashboardSummary(),
        portalApi.dashboardTimeseries(selectedRange),
        portalApi.dashboardBreakdown(8),
      ]);
      setSummary(s); setSeries(ts); setBreakdown(bd);
    } catch (err) {
      if (err instanceof PortalAuthError) onSessionExpired?.(err.message);
      else onFlash?.(`Could not load dashboard: ${err.message}`, "err");
    } finally {
      setLoading(false);
    }
  }, [onFlash, onSessionExpired]);

  useEffect(() => { load(range); }, [load, range]);

  const cardTitle = (icon, title) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
      <span style={{ color: palette.accent, display: "inline-flex" }}><Icon name={icon} size={18} /></span>
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 600 }}>{title}</h3>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.md, padding: 3 }}>
          {RANGES.map((r) => (
            <button key={r.key} type="button" onClick={() => setRange(r.key)}
              style={{
                padding: "7px 15px", borderRadius: radius.sm, border: "none", cursor: "pointer",
                background: range === r.key ? palette.accentGlow : "transparent",
                color: range === r.key ? palette.accent : palette.muted,
                fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)",
              }}>{r.label}</button>
          ))}
        </div>
        <Button variant="ghost" icon="refresh" onClick={() => load(range)} loading={loading}>Refresh</Button>
      </div>

      {/* KPI row */}
      <div className="kode-grid kode-grid-kpi">
        <StatCard label="Total Enrollments" value={summary?.totalEnrollments ?? 0} icon="scan" tone="primary" loading={loading} hint="Successful Face ID enrollments" />
        <StatCard label="Enrolled Today" value={summary?.todayEnrollments ?? 0} icon="trending" tone="ok" loading={loading} hint="Since midnight" />
        <StatCard label="Success Rate" value={`${summary?.successRate ?? 0}%`} icon="activity" tone="accent" loading={loading} hint={`${summary?.failedEnrollments ?? 0} failed attempts`} />
        <StatCard label="Active Users" value={summary?.activeUsers ?? 0} icon="users" tone="warn" loading={loading} hint="Portal accounts" />
      </div>

      {/* trend + breakdown */}
      <div className="kode-grid kode-grid-2">
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            {cardTitle("trending", "Enrollment Trend")}
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: palette.muted }}><span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--primary)" }} /> Enrolled</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: palette.muted }}><span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--err)" }} /> Failed</span>
            </div>
          </div>
          {loading ? <div className="kode-skel" style={{ height: 220, borderRadius: radius.md }} />
            : series.length ? <TrendChart data={series} /> : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: palette.dim, fontSize: 13 }}>No activity in this period</div>}
        </Card>

        <Card>
          {cardTitle("pieChart", "By Action")}
          <BarList items={breakdown.byAction} accessor={(d) => d.total} labelKey="action" />
        </Card>
      </div>

      {/* recent activity + by user */}
      <div className="kode-grid kode-grid-2">
        <Card padded={false}>
          <div style={{ padding: "18px 22px 6px" }}>{cardTitle("clock", "Recent Activity")}</div>
          {loading ? (
            <div style={{ padding: "0 22px 22px" }}><div className="kode-skel" style={{ height: 160, borderRadius: radius.md }} /></div>
          ) : breakdown.recent.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: palette.dim, fontSize: 13 }}>No activity logged yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {breakdown.recent.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderTop: `1px solid ${palette.border}` }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: r.status === "ok" ? palette.okGlow : r.status === "err" ? palette.errGlow : palette.accentGlow,
                    color: r.status === "ok" ? palette.ok : r.status === "err" ? palette.err : palette.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={r.status === "ok" ? "check" : r.status === "err" ? "x" : "info"} size={15} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ color: palette.text }}>{ACTION_LABELS[r.action] ?? r.action}</span>
                      <span style={{ color: palette.dim }}> · {actorLabel(r)}</span>
                      {r.target_code && <span style={{ color: palette.dim }}> · {r.target_code}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: palette.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.detail || "—"}</div>
                  </div>
                  <span style={{ fontSize: 11.5, color: palette.dim, whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {cardTitle("users", "Most Active Users")}
          <BarList
            items={breakdown.byUser.map((u) => ({
              ...u,
              displayName: u.actor_full_name?.trim()
                ? `${u.actor_full_name} (@${u.actor_username})`
                : u.actor_username,
            }))}
            accessor={(d) => d.enrollments ?? d.total}
            labelKey="displayName"
            color="var(--accent)"
          />
        </Card>
      </div>
    </div>
  );
}
