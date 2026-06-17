// KODE Face-ID portal branding — glow, shadows, and labels for login + shell.
// Primary accent is sky/cyan (matches --primary in styles/global.css).
export const portalTheme = {
  name: "KODE Face-ID",
  shortName: "Face-ID",
  logoSrc: "/logo.png",
  logoAlt: "KODE Face-ID",
  // RGB tuple for rgba() in inline styles / CSS (dark-theme primary #38BDF8).
  glowRgb: "56, 189, 248",
  glowRgbLight: "14, 165, 233",
};

export function glowRgba(rgb, alpha) {
  return `rgba(${rgb}, ${alpha})`;
}
