import { palette } from "../config/theme";

export function LoadingOverlay({ label = "Working…" }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "color-mix(in srgb, var(--bg) 55%, transparent)",
        backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)",
        display: "flex", flexDirection: "column", gap: 16,
        alignItems: "center", justifyContent: "center",
        animation: "fadeIn .15s var(--ease)",
      }}
    >
      <div style={{
        width: 42, height: 42,
        border: `3px solid ${palette.border}`,
        borderTopColor: palette.accent,
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }} />
      <span style={{ fontSize: 13, color: palette.muted, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
