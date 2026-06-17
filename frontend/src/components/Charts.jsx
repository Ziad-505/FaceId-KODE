import { palette } from "../config/theme";

// Lightweight dependency-free SVG charts (keeps package.json untouched).

// Stacked area/line for daily enrollment outcomes.
export function TrendChart({ data, height = 220 }) {
  const w = 720, h = height, padL = 36, padR = 12, padT = 14, padB = 26;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max(4, ...data.map((d) => Math.max(d.ok, d.err)));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const x = (i) => padL + i * stepX;
  const y = (v) => padT + innerH - (v / max) * innerH;

  const line = (key) => data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[key])}`).join(" ");
  const area = (key) => `${line(key)} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label="Enrollment trend chart">
      <defs>
        <linearGradient id="okFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.30" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const gy = padT + (innerH / ticks) * i;
        return <line key={i} x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="var(--border)" strokeWidth="1" />;
      })}
      {data.map((d, i) => (
        (data.length <= 10 || i % Math.ceil(data.length / 8) === 0) && (
          <text key={i} x={x(i)} y={h - 8} fontSize="9" fill="var(--text-dim)" textAnchor="middle">
            {d.date.slice(5)}
          </text>
        )
      ))}
      <path d={area("ok")} fill="url(#okFill)" />
      <path d={line("ok")} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line("err")} fill="none" stroke="var(--err)" strokeWidth="2" strokeDasharray="4 4" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.ok)} r="2.6" fill="var(--primary)" />)}
    </svg>
  );
}

// Horizontal bars for "by action" / "by user".
export function BarList({ items, max, accessor, labelKey, color = "var(--primary)" }) {
  const peak = max ?? Math.max(1, ...items.map(accessor));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {items.map((it, i) => {
        const v = accessor(it);
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
              <span style={{ color: palette.muted, fontWeight: 500, textTransform: "capitalize" }}>{String(it[labelKey]).replace(/_/g, " ")}</span>
              <span style={{ color: palette.text, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{v}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: palette.surface2, overflow: "hidden" }}>
              <div style={{ width: `${(v / peak) * 100}%`, height: "100%", borderRadius: 4, background: color, transition: "width .5s var(--ease)" }} />
            </div>
          </div>
        );
      })}
      {items.length === 0 && <div style={{ fontSize: 13, color: palette.dim, textAlign: "center", padding: 20 }}>No data yet</div>}
    </div>
  );
}
