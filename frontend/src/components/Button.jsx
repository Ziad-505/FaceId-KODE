import { palette, radius } from "../config/theme";
import { Icon } from "./Icon";

const VARIANTS = {
  primary: {
    background: "linear-gradient(135deg, var(--primary), var(--primary-strong))",
    color: palette.primaryContrast,
    border: "1px solid transparent",
    boxShadow: "var(--shadow-sm)",
  },
  ghost: {
    background: palette.surface,
    color: palette.muted,
    border: `1px solid ${palette.border}`,
  },
  subtle: {
    background: palette.surface2,
    color: palette.text,
    border: `1px solid ${palette.border}`,
  },
  danger: {
    background: "var(--err-soft)",
    color: palette.err,
    border: `1px solid ${palette.errBorder}`,
  },
};

const SIZES = {
  sm: { padding: "7px 12px", fontSize: 12.5 },
  md: { padding: "11px 18px", fontSize: 14 },
  lg: { padding: "13px 22px", fontSize: 15 },
};

export function Button({
  children, onClick, type = "button", variant = "primary", size = "md",
  icon, iconRight, disabled, loading, full, style, ...rest
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: radius.md,
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
        transition: "all .15s var(--ease)",
        width: full ? "100%" : undefined,
        ...v,
        ...s,
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span style={{
          width: 15, height: 15, borderRadius: "50%",
          border: "2px solid currentColor", borderTopColor: "transparent",
          animation: "spin .7s linear infinite", opacity: 0.9,
        }} />
      ) : icon ? <Icon name={icon} size={size === "sm" ? 15 : 17} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={size === "sm" ? 15 : 17} /> : null}
    </button>
  );
}
