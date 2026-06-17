import { palette, radius } from "../config/theme";
import { useTheme } from "../theme/ThemeContext";
import { Icon } from "./Icon";

export function ThemeToggle({ compact = false }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: compact ? 40 : undefined,
        height: 40,
        padding: compact ? 0 : "0 14px",
        borderRadius: radius.md,
        border: `1px solid ${palette.border}`,
        background: palette.surface,
        color: palette.muted,
        cursor: "pointer",
        transition: "all .15s var(--ease)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Icon name={isDark ? "sun" : "moon"} size={18} />
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
