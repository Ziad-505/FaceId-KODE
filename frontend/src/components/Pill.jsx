import { palette, radius } from "../config/theme";

export function Pill({ stepNumber, text, active, done }) {
  const color = done ? palette.ok : active ? palette.accent : palette.dim;
  const bg = done ? palette.okGlow : active ? palette.accentGlow : "transparent";
  const border = done ? palette.okBorder : active ? palette.accentBorder : palette.border;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 16px", borderRadius: radius.pill,
      background: bg, border: `1px solid ${border}`,
      transition: "all .3s var(--ease)",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: done ? palette.ok : active ? palette.accent : palette.surface3,
        color: done || active ? palette.primaryContrast : palette.dim,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
      }}>
        {done ? "✓" : stepNumber}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{text}</span>
    </div>
  );
}
