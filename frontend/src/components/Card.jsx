import { palette, radius } from "../config/theme";

export function Card({ children, glow = false, disabled = false, padded = true, style = {} }) {
  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${glow ? palette.accentBorder : palette.border}`,
        borderRadius: radius.lg,
        padding: padded ? 24 : 0,
        boxShadow: glow ? palette.shadowGlow : palette.shadowSm,
        transition: "all .3s var(--ease)",
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? "none" : "auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHead({ stepNumber, done, title, sub, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div
        style={{
          width: 38, height: 38, borderRadius: radius.md, flexShrink: 0,
          background: done ? palette.okGlow : palette.accentGlow,
          border: `1px solid ${done ? palette.okBorder : palette.accentBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700,
          color: done ? palette.ok : palette.accent,
          transition: "all .3s var(--ease)",
        }}
      >
        {done ? "✓" : stepNumber}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: palette.text }}>{title}</h3>
        {sub && <p style={{ margin: "3px 0 0", fontSize: 13, color: palette.dim, lineHeight: 1.5 }}>{sub}</p>}
      </div>
    </div>
  );
}
