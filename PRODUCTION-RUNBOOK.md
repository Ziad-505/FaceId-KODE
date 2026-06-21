# KODE Face-ID — Production Runbook (zero → live)

Execute phases **in order**. Each ends with a ✅ checkpoint — don't move on until it passes.
Legend: 🖥️ = run on the **production server** · 💻 = run on your **dev machine** · 🌐 = in the **GitHub web UI**.

---

## Phase 0 — Pre-flight (gather these first)

- [ ] Production **Windows Server** hostname/IP and an admin account on it.
- [ ] Internal **DNS name** for the portal (e.g. `kode-portal.yourdomain.local`).
- [ ] **PostgreSQL** location (same server or another host) + a DB login you can use.
- [ ] Confirm the server can reach the AEOS/ePm host **`10.1.171.10`** (the portal proxies to it).
- [ ] Admin access to the **GitHub repo** (to add a runner + environment variables).

✅ **Done when:** you have all of the above written down.

---

## Phase 1 — Required code/config changes (💻 dev machine)

> You chose to apply these yourself. These two are **blockers** — do them before any deploy.
> The optional hardening list is at the bottom of this phase; skip it for now if you want.

### 1a. Commit the lockfiles (without this, `npm ci` in the workflow fails)

Edit `.gitignore` and **delete these two lines**:
```
package-lock.json
```
(there's one under "Dependencies" — remove it). Then:
```powershell
cd backend;  npm install      # regenerates backend/package-lock.json
cd ..\frontend; npm install   # regenerates frontend/package-lock.json
cd ..
git add .gitignore backend/package-lock.json frontend/package-lock.json
git commit -m "ci: commit lockfiles for reproducible npm ci builds"
```

### 1b. Make JWT_SECRET truly required

In `backend/src/config/env.js`, change:
```js
jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),
```
to:
```js
jwtSecret: required("JWT_SECRET"),
```
Commit it:
```powershell
git add backend/src/config/env.js
git commit -m "security: require JWT_SECRET (no insecure fallback)"
```

### 1c. Push

```powershell
git push origin main
```

<details><summary>Optional hardening (recommended, can do later)</summary>

- `express-rate-limit` on `/api/auth/login`
- `helmet()` in `app.js`
- DB-aware `/api/health` (`SELECT 1`)
- `app.set("trust proxy", 'loopback')`
- Rotate the AEOS `epm#003` credential
</details>

✅ **Done when:** `git push` succeeds and `backend/package-lock.json` + `frontend/package-lock.json` are in the repo on GitHub.

---

## Phase 2 — Provision the production server (🖥️)

Install, in this order:

1. **Node.js 18 LTS+** — installer from nodejs.org, "Add to PATH" checked. Verify: `node -v`.
2. **PM2** — `npm install -g pm2`. Verify: `pm2 -v`.
3. **IIS + URL Rewrite + ARR**:
   - Server Manager → Add Roles → **Web Server (IIS)**.
   - Install **URL Rewrite** and **Application Request Routing** (from microsoft.com/download or Web Platform Installer).
   - IIS Manager → server node → **Application Request Routing Cache → Server Proxy Settings → ✔ Enable proxy**.
4. **PostgreSQL** — install (or confirm reachable). Create the database + login:
   ```sql
   CREATE DATABASE kode_faceid;
   CREATE USER kode WITH PASSWORD '<strong-password>';
   GRANT ALL PRIVILEGES ON DATABASE kode_faceid TO kode;
   ```
5. **Folders**:
   ```powershell
   mkdir C:\inetpub\kode-faceid
   mkdir C:\pm2-logs
   ```

✅ **Done when:** `node -v`, `pm2 -v` work, IIS proxy is enabled, and you can connect to the DB.

---

## Phase 3 — Backend first bring-up (🖥️)

You need the repo on the server once for the manual bring-up (the runner will keep it updated after). Clone it (or copy the `backend` folder):
```powershell
cd C:\apps
git clone <your-repo-url> FaceID-KODE
cd FaceID-KODE\backend
```

Create `backend\.env` (server-only — never commit). Generate the JWT secret:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Put it in `.env`:
```env
PORT=4000
CORS_ORIGINS=http://kode-portal.yourdomain.local
PGHOST=localhost
PGPORT=5432
PGUSER=kode
PGPASSWORD=<strong-password>
PGDATABASE=kode_faceid
JWT_SECRET=<paste the generated hex>
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
SEED_ADMIN_PASSWORD=<strong-unique>
SEED_CX_PASSWORD=<strong-unique>
```

Bring it up:
```powershell
npm ci
npm run migrate     # creates tables
npm run seed        # creates admin + cx users with YOUR passwords
pm2 start ecosystem.config.cjs
pm2 save
```

✅ **Done when:** `pm2 list` shows `kode-faceid-backend` **online**, and
`curl http://localhost:4000/api/health` returns `{"status":"ok",...}`.

---

## Phase 4 — Auto-start on reboot (🖥️ — the Windows gotcha)

`pm2 startup` does NOT work on Windows. Run PM2 as a service:

**Recommended — pm2-installer** (https://github.com/jessety/pm2-installer): download, then in that folder:
```powershell
npm run setup
npm run configure
pm2 save
```
**Or lightweight:**
```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

**Then actually reboot the server** and confirm the app came back **without** anyone starting it.

✅ **Done when:** after a reboot, `pm2 list` shows the backend online and `/api/health` responds — untouched by hand.

---

## Phase 5 — IIS site (🖥️)

1. IIS Manager → **Sites → Add Website**:
   - Site name: `kode-faceid`
   - Physical path: `C:\inetpub\kode-faceid`
   - Binding: your internal hostname (add an **https** binding with an internal cert — strongly recommended).
2. Confirm `web.config` will land at the site root (the deploy job publishes it there).

(The site folder is empty until Phase 7 publishes the frontend — that's expected.)

✅ **Done when:** the site exists in IIS and starts without error.

---

## Phase 6 — GitHub self-hosted runner + variables (🌐 + 🖥️)

GitHub-hosted runners can't reach your internal network, so install a runner **on the server**:

1. 🌐 Repo → **Settings → Actions → Runners → New self-hosted runner** (Windows x64).
2. 🖥️ Run the shown `config.cmd` commands. When prompted for **labels**, add: `kode-portal`
   (so the runner matches `[self-hosted, windows, kode-portal]` in the workflow).
3. 🖥️ Install it **as a service** (`./svc.cmd install` then `./svc.cmd start`) under an account that can write to `C:\inetpub\kode-faceid` and run `pm2`.
4. 🌐 Repo → **Settings → Environments → New environment → `production`**.
   Add **Variables** (not secrets — they're build-time, baked into the bundle):
   - `VITE_API_BASE` → your ePm middleware URL (or leave blank to use the IIS `/api` proxy)
   - `VITE_PORTAL_API` → e.g. `http://kode-portal.yourdomain.local/portal-api` or the backend URL

✅ **Done when:** 🌐 the runner shows **Idle / green** in Settings → Actions → Runners.

---

## Phase 7 — First automated deploy (🌐)

Trigger the workflow: **Actions → "Deploy KODE Face-ID Portal" → Run workflow** (or push any commit to `main`).

Watch the run. It does: install → test → migrate → build → publish to IIS → `pm2 reload`.

✅ **Done when:** the workflow run is **green** and `C:\inetpub\kode-faceid` now contains `index.html`, an `assets/` folder, and `web.config`.

---

## Phase 8 — Verify (smoke test)

1. Browse to the portal hostname → the **login page** loads.
2. Log in with the **admin** user + the password you set in Phase 3. (If it fails, JWT_SECRET or seed didn't run — check `pm2 logs`.)
3. Do one **member lookup** by code → confirms the IIS `/api` proxy to `10.1.171.10` works.
4. Do one **face enrollment** end-to-end → confirms AEOS/Suprema path.
5. As admin, open the **audit log / dashboard** → confirms the login + actions were recorded.

✅ **Done when:** all five pass.

---

## Phase 9 — Go-live & ops

- [ ] Log rotation: `pm2 install pm2-logrotate; pm2 set pm2-logrotate:max_size 10M; pm2 set pm2-logrotate:retain 14`
- [ ] Point your monitoring at `GET /api/health`.
- [ ] Confirm DB backups are running for `kode_faceid`.
- [ ] Record admin/cx credentials in your password manager; remove any temporary ones.
- [ ] (Backlog) the optional hardening from Phase 1 + the AEOS-credential proxy.

🎉 **Live when:** Phase 8 passes and a rebooted server self-recovers (Phase 4).

---

### Daily ops cheatsheet
```powershell
pm2 list                         # status
pm2 logs kode-faceid-backend     # live logs
pm2 reload kode-faceid-backend   # manual restart (deploys do this automatically)
```
