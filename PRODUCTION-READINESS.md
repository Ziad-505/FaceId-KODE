# KODE Face-ID Portal — Production Readiness Review

**Reviewer:** Senior engineering review · **Date:** 2026-06-21
**Verdict:** **Not yet production-ready.** The architecture is clean and well-structured, but there are **4 blocking issues** that would cause an insecure or unreliable deployment. All are small, fast fixes. Estimated effort to green: ~half a day.

The codebase is genuinely good in shape — clean layering (routes → controllers → services → repositories), parameterized SQL (no injection), bcrypt password hashing, typed errors, structured JSON logging, JWT auth, RBAC guards, graceful shutdown, and a sane audit-log design that deliberately stores no biometric data. The problems below are about hardening and deploy mechanics, not rewrites.

---

## BLOCKERS — fix before deploying

### B1. `package-lock.json` is git-ignored → CI builds are not reproducible
`.gitignore` ignores `package-lock.json`. The deploy workflow uses `npm ci`, which **requires** a committed lockfile and will fail. More importantly, without a lockfile every build can resolve different transitive dependency versions — the opposite of what you want for a reliable internal deployment.
**Fix:** remove `package-lock.json` (and ideally the `node_modules/` is fine to keep) from `.gitignore`, then commit `backend/package-lock.json` and `frontend/package-lock.json`.

### B2. JWT secret silently falls back to a public, known value
`config/env.js`: `jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret")`. The `required()` helper is handed a fallback, so it never actually throws — if `JWT_SECRET` is unset in production, the server boots with a **hard-coded secret that is in your source code**. Anyone who reads the repo can forge admin tokens.
**Fix:** call `required("JWT_SECRET")` with **no fallback** so the server refuses to start without a real secret (and keep a dev-only branch gated on `NODE_ENV !== 'production'` if you want local convenience).

### B3. Real ePm/AEOS API credentials are hard-coded in the frontend
`frontend/src/config/constants.js` ships `API_CREDENTIALS = { UserName: "epmapidev", Password: "epm#003", Role: "api" }`. Vite bakes this into the JS bundle, so **any user on the internal network can open DevTools and read the AEOS service credentials**, then call the enrollment API directly.
**Fix:** move the AEOS login behind your own backend (proxy the `/api/Login` + enrollment calls through the Node service, keep the credential server-side). At minimum rotate `epm#003` and treat it as compromised. This is the most serious finding.

### B4. Default seed passwords are weak and published
`kode@2026!` (admin) and `cxteam@26` (cx) appear in `.env.example` and are the defaults in `env.js`. If `npm run seed` runs with defaults, the portal ships with publicly-known admin credentials.
**Fix:** set strong `SEED_ADMIN_PASSWORD` / `SEED_CX_PASSWORD` in the server `.env` before seeding, and force a password change on first login (or rotate immediately).

---

## HIGH — strongly recommended before or immediately after go-live

- **No brute-force protection on `/api/auth/login`.** No rate limiting or lockout. Add `express-rate-limit` (e.g. 10 attempts / 15 min per IP) on the login route.
- **No security headers.** `helmet` isn't installed. Add `app.use(helmet())` for HSTS, X-Content-Type-Options, frame options, etc.
- **Plain HTTP + JWT in `localStorage`.** Token is stored in `localStorage` (readable by any XSS) and, without TLS, is sniffable on the LAN. Put IIS in front with an internal HTTPS cert; it's an "internal network" but credentials and tokens still cross the wire.
- **`app.set("trust proxy", true)` trusts every hop.** This lets a client spoof `X-Forwarded-For`, polluting the IP field in your audit logs. Scope it to the IIS/loopback proxy (e.g. `trust proxy = 'loopback'`).
- **`/api/health` doesn't check the database.** It always returns `ok` even if Postgres is down, so a monitor can't detect a DB outage and the app starts even with no DB. Add a `SELECT 1` to the health check.

## MEDIUM — reliability & operability polish

- **No endpoint/integration tests.** Unit tests cover hashing, JWT, RBAC, validation, and errors (good), but nothing exercises the actual routes/controllers against a DB. Add a few supertest-based tests for login, RBAC denial, and user CRUD.
- **PM2 log growth.** Configure `pm2-logrotate` (covered in `DEPLOYMENT.md`) so logs don't fill the disk.
- **DB pool is untuned and has no SSL option.** Fine for localhost Postgres; if the DB ever moves off-box, add `max`, `connectionTimeoutMillis`, and SSL.
- **CORS `credentials: true` with Bearer-token auth.** The app authenticates via `Authorization` header, not cookies, so `credentials: true` is unnecessary; harmless but worth removing to avoid confusion. Ensure `CORS_ORIGINS` is set to the real portal hostname in prod (default is localhost only).
- **Login input isn't length-bounded.** Add a max length on `username`/`password` to avoid pathological payloads.

## What's already solid (no action needed)

Parameterized queries throughout (no SQL injection), bcrypt with configurable rounds, identical login error for missing-user vs wrong-password (no user enumeration), tampered-token rejection tested, clean separation of concerns, idempotent migrations and seed, graceful SIGTERM/SIGINT shutdown closing the pool, structured request logging with request IDs, and a schema that correctly avoids storing any biometric/PII.

---

## Go / No-Go checklist

| # | Item | Status |
|---|------|--------|
| B1 | Commit `package-lock.json` (un-ignore) | ☐ |
| B2 | `JWT_SECRET` required, no fallback; real secret in server `.env` | ☐ |
| B3 | AEOS credentials off the client / rotated | ☐ |
| B4 | Strong seed passwords set before `npm run seed` | ☐ |
| H1 | Rate limit on login | ☐ |
| H2 | `helmet` added | ☐ |
| H3 | HTTPS on the IIS binding | ☐ |
| H4 | `trust proxy` scoped to loopback | ☐ |
| H5 | DB-aware health check | ☐ |
| Ops | PM2 runs as a Windows service + `pm2 save` (auto-start verified after a reboot) | ☐ |
| Ops | Self-hosted runner installed as a service with IIS write access | ☐ |

Once B1–B4 and the HTTPS item are done, this is reliable enough for an internal production rollout.
