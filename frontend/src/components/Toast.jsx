import { palette, radius } from "../config/theme";
import { Icon } from "./Icon";

const TYPES = {
  ok:   { color: palette.ok,     bg: palette.okGlow,     border: palette.okBorder,     icon: "check" },
  err:  { color: palette.err,    bg: palette.errGlow,    border: palette.errBorder,    icon: "alert" },
  warn: { color: palette.warn,   bg: palette.warnGlow,   border: palette.warnBorder,   icon: "alert" },
  info: { color: palette.accent, bg: palette.accentGlow, border: palette.accentBorder, icon: "info" },
};

export function Toast({ message, type = "info" }) {
  const t = TYPES[type] ?? TYPES.info;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", top: 22, right: 22, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 11,
        padding: "13px 18px",
        borderRadius: radius.md,
        background: palette.glass,
        border: `1px solid ${t.border}`,
        color: palette.text,
        fontSize: 14, fontWeight: 500,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: palette.shadowLg,
        animation: "slideIn .3s var(--ease)",
        maxWidth: 440,
      }}
    >
      <span style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: t.bg, color: t.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={t.icon} size={16} />
      </span>
      {message}
    </div>
  );
}
