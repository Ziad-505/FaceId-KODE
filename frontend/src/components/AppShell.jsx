import { useState } from "react";
import { palette, radius } from "../config/theme";
import { Icon } from "./Icon";
import { Badge } from "./Badge";
import { ThemeToggle } from "./ThemeToggle";

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", padding: "11px 14px",
        borderRadius: radius.md, border: "none",
        background: active ? palette.accentGlow : "transparent",
        color: active ? palette.accent : palette.muted,
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        textAlign: "left", transition: "all .15s var(--ease)",
        position: "relative",
      }}
    >
      {active && <span style={{
        position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)",
        width: 3, height: 22, borderRadius: 3, background: palette.accent,
      }} />}
      <Icon name={icon} size={19} />
      {label}
    </button>
  );
}

export function AppShell({ user, nav, current, onNavigate, onLogout, title, subtitle, actions, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLabel = user?.roleLabel ?? (user?.role === "admin" ? "Admin" : "CX Agent");

  const sidebar = (
    <aside
      style={{
        width: 248, flexShrink: 0,
        background: palette.surface,
        borderRight: `1px solid ${palette.border}`,
        display: "flex", flexDirection: "column",
        padding: "20px 16px",
        position: "sticky", top: 0, height: "100dvh",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 22px" }}>
        <img src="/logo.png" alt="KODE" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.4px", color: palette.text }}>
            <span style={{ color: palette.accent }}>KODE</span> Face-ID
          </div>
          <div style={{ fontSize: 10.5, color: palette.dim, fontWeight: 600, letterSpacing: ".4px" }}>ENROLLMENT PORTAL</div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: palette.dim, letterSpacing: ".6px", padding: "6px 14px 8px" }}>MENU</div>
        {nav.map((item) => (
          <NavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={current === item.key}
            onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
          />
        ))}
      </nav>

      <div style={{
        marginTop: 14, padding: 14, borderRadius: radius.md,
        background: palette.surface2, border: `1px solid ${palette.border}`,
        display: "flex", alignItems: "center", gap: 11,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--primary), var(--accent))",
          color: "var(--primary-contrast)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 15,
        }}>
          {(user?.fullName ?? "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: palette.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.fullName}</div>
          <Badge tone={user?.role === "admin" ? "warn" : "info"} style={{ marginTop: 3, padding: "1px 7px", fontSize: 10 }}>{roleLabel}</Badge>
        </div>
      </div>
      <button
        type="button" onClick={onLogout}
        style={{
          marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "10px", borderRadius: radius.md,
          border: `1px solid ${palette.border}`, background: palette.surface,
          color: palette.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all .15s var(--ease)",
        }}
      >
        <Icon name="logout" size={16} /> Sign Out
      </button>
    </aside>
  );

  return (
    <div style={{ minHeight: "100dvh", display: "flex" }}>
      {/* Desktop sidebar */}
      <div className="kode-sidebar-desktop">{sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", animation: "fadeIn .15s var(--ease)" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ animation: "slideIn .2s var(--ease)" }}>{sidebar}</div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "16px 24px",
          borderBottom: `1px solid ${palette.border}`,
          background: palette.glass,
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button
              type="button" className="kode-menu-btn" onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={{
                display: "none", width: 38, height: 38, borderRadius: radius.md,
                border: `1px solid ${palette.border}`, background: palette.surface,
                color: palette.text, cursor: "pointer", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="menu" size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.3px", color: palette.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h1>
              {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: palette.dim }}>{subtitle}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {actions}
            <ThemeToggle compact />
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 24px 56px", animation: "fadeUp .35s var(--ease)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", width: "100%" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
