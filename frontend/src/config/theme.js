// All colors resolve to CSS variables defined in styles/global.css.
// Because every value is a `var(--token)`, any inline style that reads from
// `palette` automatically re-themes when <html data-theme> flips — no JS needed.
// Existing keys are preserved for backward compatibility; new tokens are added.
export const palette = {
  // surfaces / structure
  bg: "var(--bg)",
  surface: "var(--surface)",
  surfaceAlt: "var(--surface-2)",
  surface2: "var(--surface-2)",
  surface3: "var(--surface-3)",
  glass: "var(--surface-glass)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",

  // text
  text: "var(--text)",
  muted: "var(--text-muted)",
  dim: "var(--text-dim)",

  // brand / primary (legacy name: accent)
  accent: "var(--primary)",
  primary: "var(--primary)",
  primaryStrong: "var(--primary-strong)",
  primaryContrast: "var(--primary-contrast)",
  accentGlow: "var(--primary-soft)",
  accentBorder: "var(--primary-border)",
  accent2: "var(--accent)",
  accent3: "var(--accent-2)",

  // semantic
  ok: "var(--ok)",
  okGlow: "var(--ok-soft)",
  okBorder: "var(--ok-border)",
  err: "var(--err)",
  errGlow: "var(--err-soft)",
  errBorder: "var(--err-border)",
  warn: "var(--warn)",
  warnGlow: "var(--warn-soft)",
  warnBorder: "var(--warn-border)",

  // effects
  ring: "var(--ring)",
  shadowSm: "var(--shadow-sm)",
  shadowMd: "var(--shadow-md)",
  shadowLg: "var(--shadow-lg)",
  shadowGlow: "var(--shadow-glow)",
};

export const radius = { sm: "var(--r-sm)", md: "var(--r-md)", lg: "var(--r-lg)", xl: "var(--r-xl)", pill: "var(--r-pill)" };

export const baseStyles = {
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: palette.muted,
    marginBottom: 7,
    letterSpacing: ".2px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: radius.md,
    border: `1px solid ${palette.border}`,
    background: palette.surface2,
    color: palette.text,
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "11px 20px",
    borderRadius: radius.md,
    border: "none",
    background: `linear-gradient(135deg, var(--primary), var(--primary-strong))`,
    color: palette.primaryContrast,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    transition: "all .15s var(--ease)",
  },
  ghostButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: radius.md,
    border: `1px solid ${palette.border}`,
    background: palette.surface,
    color: palette.muted,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
    cursor: "pointer",
    transition: "all .15s var(--ease)",
  },
  tableCell: { padding: "13px 22px", fontSize: 14 },
};
