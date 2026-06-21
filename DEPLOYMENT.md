# KODE Face-ID Portal — Deployment & Operations

Internal-network deployment: **GitHub Actions (self-hosted runner) → IIS (frontend) + PM2 (backend)**, with auto-start on reboot.

```
GitHub push (main)
      │
      ▼
Self-hosted runner on the IIS server
      │  build + test + migrate
      ├──► frontend/dist  ──► IIS site  (C:\inetpub\kode-faceid)
      └──► PM2 reload      ──► Node backend on :4000
                                   │
                                   └──► PostgreSQL (localhost:5432)
```

IIS serves the SPA and reverse-proxies `/api/*` to the AEOS/ePm backend (`10.1.171.10`). The Node/PM2 service serves the **portal** API (auth, users, audit logs, dashboard) on port 4000.

---

## 1. One-time server prerequisites

On the Windows Server hosting IIS, install:

1. **Node.js 18 LTS or newer** (added to PATH for all users).
2. **PM2**: `npm install -g pm2`
3. **IIS** with **URL Rewrite** and **Application Request Routing (ARR)** modules (required for the `/api` reverse-proxy rule in `web.config`). In IIS Manager → server node → **Application Request Routing Cache → Server Proxy Settings → Enable proxy**.
4. **PostgreSQL** reachable from the server (the schema is created by `npm run migrate`).
5. Create the log folder: `mkdir C:\pm2-logs`

## 2. Backend environment file (server-only, never in git)

Create `backend\.env` on the server. **Generate a real JWT secret and change every seed password.**

```env
PORT=4000
CORS_ORIGINS=http://kode-portal.yourdomain.local
PGHOST=localhost
PGPORT=5432
PGUSER=kode
PGPASSWORD=<strong-password>
PGDATABASE=kode_faceid
JWT_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
SEED_ADMIN_PASSWORD=<strong-unique>
SEED_CX_PASSWORD=<strong-unique>
```

## 3. First-time backend bring-up (manual, once)

```powershell
cd backend
npm ci
npm run migrate      # creates tables
npm run seed         # creates admin + cx user (idempotent)
pm2 start ecosystem.config.cjs
pm2 save             # writes the process list PM2 restores on boot
```

## 4. Auto-start on reboot (the important part)

PM2's `pm2 startup` does **not** work on Windows. Use one of these to run PM2 as a Windows service so it relaunches saved processes after a reboot:

**Recommended — `pm2-installer`** (runs PM2 under a managed service account):
```powershell
# Download https://github.com/jessety/pm2-installer  then from that folder:
npm run setup
npm run configure        # routes logs, sets env
# move your saved process list to the service account, then:
pm2 save
```

**Lightweight alternative — `pm2-windows-startup`:**
```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

After either, **reboot once and confirm** `pm2 list` shows `kode-faceid-backend` online without you starting it manually.

## 5. IIS site

Point an IIS site at `C:\inetpub\kode-faceid` (the deploy job publishes here). Ensure `web.config` is present at the root — it provides the SPA fallback and the `/api → 10.1.171.10/epmaeos` proxy. Bind the site to your internal hostname.

## 6. GitHub Actions self-hosted runner

GitHub-hosted runners can't reach your internal network, so install a self-hosted runner **on the IIS server**:

1. Repo → **Settings → Actions → Runners → New self-hosted runner** (Windows x64). Follow the shown commands.
2. Give it the labels the workflow expects: `self-hosted, windows, kode-portal`.
3. Install it **as a service** (`svc.cmd install` / the installer's service option) so it survives reboots, running as an account that can write to `C:\inetpub\kode-faceid` and run `pm2`.
4. Repo → **Settings → Environments → New environment → `production`**. Add **Variables**: `VITE_API_BASE`, `VITE_PORTAL_API` (these are build-time, baked into the frontend bundle — do not put secrets here).

Then every push to `main` runs `.github/workflows/deploy.yml`: install → test → migrate → build → publish to IIS → `pm2 reload`. Trigger manually anytime via **Actions → Deploy KODE Face-ID Portal → Run workflow**.

## 7. Daily operations

```powershell
pm2 list                    # status
pm2 logs kode-faceid-backend  # live logs
pm2 reload kode-faceid-backend
pm2 monit                   # CPU/memory
```

Install log rotation so PM2 logs don't grow unbounded:
```powershell
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
```

Health check (wire your monitor to this): `GET http://localhost:4000/api/health`.
