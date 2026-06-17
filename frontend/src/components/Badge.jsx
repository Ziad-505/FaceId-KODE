import { palette, radius } from "../config/theme";

const TONES = {
  ok:      { color: palette.ok,    bg: palette.okGlow,     border: palette.okBorder },
  err:     { color: palette.err,   bg: palette.errGlow,    border: palette.errBorder },
  warn:    { color: palette.warn,  bg: palette.warnGlow,   border: palette.warnBorder },
  info:    { color: palette.accent,bg: palette.accentGlow, border: palette.accentBorder },
  neutral: { color: palette.muted, bg: palette.surface2,   border: palette.border },
};

export function Badge({ children, tone = "neutral", dot = false, style }) {
  const t = TONES[tone] ?? TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: radius.pill,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".3px",
        color: t.color,
        background: t.bg,
        border: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.color }} />}
      {children}
    </span>
  );
}
