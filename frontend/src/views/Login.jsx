import { useState, useEffect, useCallback } from "react";
import { palette, baseStyles, radius } from "../config/theme";
import { portalTheme } from "../theme/portalTheme";
import { Field, Button, Icon, ThemeToggle } from "../components";

export function Login({ onLogin, busy }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const submit = () => { if (username && password) onLogin(username, password); };

  const handleLogoClick = useCallback(() => {
    if (!showLoginForm) setShowLoginForm(true);
  }, [showLoginForm]);

  useEffect(() => {
    if (!showLoginForm) return;
    const id = requestAnimationFrame(() => {
      document.getElementById("kode-login-username")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [showLoginForm]);

  const onLogoError = () => setLogoFailed(true);

  return (
    <div className="kode-login-page">
      <div className="kode-login-page__mesh" aria-hidden />

      <div className="kode-login-page__theme">
        <ThemeToggle />
      </div>

      {!showLoginForm && (
        <div
          className="kode-login-splash"
          onClick={handleLogoClick}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleLogoClick()}
          role="button"
          tabIndex={0}
          aria-label="Click to continue to sign in"
        >
          <div className="kode-login-splash__inner">
            <div className="kode-login-splash__logo-wrap">
              <div className="kode-login-splash__glow" aria-hidden />
              <div style={{ position: "relative" }}>
                {!logoFailed && (
                  <img
                    src={portalTheme.logoSrc}
                    alt={portalTheme.logoAlt}
                    className="kode-login-splash__logo"
                    onError={onLogoError}
                  />
                )}
                <span
                  className="kode-logo kode-login-splash__fallback"
                  style={{ display: logoFailed ? "inline-block" : "none" }}
                  aria-hidden={!logoFailed}
                >
                  K
                </span>
              </div>
            </div>
            <p className="kode-login-splash__hint">Click to continue</p>
          </div>
        </div>
      )}

      <div
        className={`kode-login-form-wrap ${showLoginForm ? "is-visible" : "is-hidden"}`}
        aria-hidden={!showLoginForm}
      >
        <div className="kode-login-form__header">
          {!logoFailed ? (
            <img
              src={portalTheme.logoSrc}
              alt={portalTheme.logoAlt}
              className="kode-login-form__logo"
              onError={onLogoError}
            />
          ) : (
            <span className="kode-logo" style={{ fontSize: 48 }}>K</span>
          )}
          <h1 className="kode-login-form__title">{portalTheme.name}</h1>
          <p className="kode-login-form__subtitle">
            AEOS &amp; Suprema face enrollment portal
          </p>
        </div>

        <div style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: radius.xl,
          padding: 34,
          boxShadow: palette.shadowLg,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
            Sign in
          </h2>
          <p style={{ fontSize: 13.5, color: palette.dim, margin: "0 0 26px" }}>
            Enter your portal credentials to continue
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field
              id="kode-login-username"
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="Username"
              autoComplete="username"
              onKeyDown={(key) => key === "Enter" && submit()}
            />
            <div>
              <label style={baseStyles.label} htmlFor="kode-login-password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="kode-login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...baseStyles.input, paddingRight: 44 }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: palette.dim,
                    display: "flex", padding: 6, borderRadius: 7,
                  }}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
                </button>
              </div>
            </div>
            <Button
              onClick={submit}
              disabled={busy || !username || !password}
              loading={busy}
              full
              size="lg"
              iconRight="chevronRight"
            >
              {busy ? "Signing in…" : "Sign In"}
            </Button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: palette.dim, marginTop: 18 }}>
          Contact Technology Department to get access
        </p>
      </div>
    </div>
  );
}
