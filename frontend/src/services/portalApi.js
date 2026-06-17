// ── KODE Face-ID — Portal backend client ────────────────────────────────────
// Talks to the new Express backend (auth, users, audit logs, dashboard).
// This is SEPARATE from services/api.js, which still calls the AEOS/Suprema API
// directly and is intentionally left untouched.
//
// Base URL: set VITE_PORTAL_API in .env. Defaults to the local backend in dev
// (http://localhost:4000/api). In production point it at the deployed backend
// or a reverse-proxied path (e.g. "/portal-api" rewritten to the backend).
const PORTAL_BASE = import.meta.env?.VITE_PORTAL_API ?? "http://localhost:4000/api";

const TOKEN_KEY = "kode-faceid-jwt";

export const tokenStore = {
  get() {
    try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { token ? window.localStorage.setItem(TOKEN_KEY, token) : window.localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
  clear() { this.set(null); },
};

export class PortalAuthError extends Error {
  constructor(message = "Your portal session has expired — please sign in again") {
    super(message);
    this.name = "PortalAuthError";
  }
}

async function request(path, { method = "GET", body, auth = true, query } = {}) {
  const url = new URL(`${PORTAL_BASE}${path}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url.toString().replace(window.location.origin, ""), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the portal server");
  }

  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok) {
    if (res.status === 401) throw new PortalAuthError(data?.error?.message);
    throw new Error(data?.error?.message || `Request failed (HTTP ${res.status})`);
  }
  return data;
}

export const portalApi = {
  // ── auth ──
  async login(username, password) {
    const data = await request("/auth/login", { method: "POST", auth: false, body: { username, password } });
    tokenStore.set(data.token);
    return data.user;
  },
  async me() {
    const data = await request("/auth/me");
    return data.user;
  },
  logout() { tokenStore.clear(); },

  // ── users (admin) ──
  listUsers: () => request("/users").then((r) => r.data),
  createUser: (payload) => request("/users", { method: "POST", body: payload }).then((r) => r.data),
  updateUser: (id, payload) => request(`/users/${id}`, { method: "PATCH", body: payload }).then((r) => r.data),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }).then((r) => r.data),

  // ── audit logs ──
  // Fire-and-forget audit event. Never throws into the enrollment flow.
  recordLog: (payload) => request("/logs", { method: "POST", body: payload }).catch(() => null),
  listLogs: (filters) => request("/logs", { query: filters }),

  // ── dashboard (admin) ──
  dashboardSummary: () => request("/dashboard/summary").then((r) => r.data),
  dashboardTimeseries: (range) => request("/dashboard/timeseries", { query: { range } }).then((r) => r.data),
  dashboardBreakdown: (limit) => request("/dashboard/breakdown", { query: { limit } }).then((r) => r.data),
};
