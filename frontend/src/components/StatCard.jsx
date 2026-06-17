import { palette, radius } from "../config/theme";
import { Icon } from "./Icon";

const TONES = {
  primary: { color: "var(--primary)", soft: "var(--primary-soft)", border: "var(--primary-border)" },
  ok:      { color: "var(--ok)",      soft: "var(--ok-soft)",      border: "var(--ok-border)" },
  err:     { color: "var(--err)",     soft: "var(--err-soft)",     border: "var(--err-border)" },
  warn:    { color: "var(--warn)",    soft: "var(--warn-soft)",    border: "var(--warn-border)" },
  accent:  { color: "var(--accent)",  soft: "color-mix(in srgb, var(--accent) 14%, transparent)", border: "color-mix(in srgb, var(--accent) 32%, transparent)" },
};

export function StatCard({ label, value, icon, tone = "primary", hint, loading }) {
  const t = TONES[tone] ?? TONES.primary;
  return (
    <div style={{
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: radius.lg,
      padding: 20,
      boxShadow: palette.shadowSm,
      display: "flex", flexDirection: "column", gap: 14,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: palette.muted, letterSpacing: ".2px" }}>{label}</span>
        <span style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: t.soft, color: t.color, border: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div style={{
        fontSize: 30, fontWeight: 700, color: palette.text, lineHeight: 1,
        fontFeatureSettings: "'tnum' 1", letterSpacing: "-0.5px",
        minHeight: 30,
      }}>
        {loading ? <span style={{ opacity: 0.4 }}>—</span> : value}
      </div>
      {hint && <div style={{ fontSize: 12, color: palette.dim }}>{hint}</div>}
    </div>
  );
}
