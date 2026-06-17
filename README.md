# KODE Face-ID

Access-controlled enrollment portal for **AEOS / Suprema** face recognition at **KODE Sports Club**. Staff look up members by code, enroll face images (single or bulk), and administrators monitor activity through a dashboard with full audit logging.

Built by the **Technology Department** as part of the KODE internal portal family.

---

## Overview

| Layer | Stack | Responsibility |
|-------|-------|----------------|
| **Frontend** | React 18 · Vite | UI, enrollment workflow, AEOS API client |
| **Portal backend** | Express · PostgreSQL | Users, JWT auth, RBAC, audit logs, dashboard |
| **AEOS / ePM** | External middleware | Member data, biometrics, carrier IDs *(not in this repo)* |

The portal database stores **only** portal users and audit logs. Member records and face images remain in AEOS.

---

## Features

- **Dual-theme UI** — light and dark modes driven by CSS design tokens
- **KODE login experience** — animated logo splash, click-to-reveal sign-in form
- **Enrollment** — member lookup, single upload, bulk CSV enrollment
- **Role-based access** — Admin and CX Agent with permission-gated navigation
- **Dashboard** — KPIs and activity charts (admin only)
- **Users & roles** — create, activate, and manage portal accounts (admin only)
- **Audit trail** — every lookup, upload, login, and admin action logged to PostgreSQL
- **Structured logging** — JSON request logs with `X-Request-Id` for monitoring

---

## Repository structure

```
FaceID-KODE/
├── frontend/             # React + Vite SPA
│   ├── public/           # Static assets (logo.png)
│   ├── src/
│   │   ├── components/   # Reusable UI (AppShell, charts, forms…)
│   │   ├── config/       # Theme tokens, permissions, constants
│   │   ├── services/     # api.js (AEOS) · portalApi.js (backend)
│   │   ├── styles/       # global.css design system
│   │   ├── theme/        # Portal branding (login glow, labels)
│   │   ├── utils/
│   │   └── views/        # Login, Work, Admin, Dashboard
│   ├── .env.example
│   └── vite.config.js
│
├── backend/              # Express + PostgreSQL API
│   ├── src/
│   │   ├── routes/       # HTTP route definitions
│   │   ├── controllers/  # Request/response adapters
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Database access
│   │   ├── middleware/   # Auth, RBAC, logging, errors
│   │   ├── db/           # Schema, migrate, seed
│   │   └── utils/
│   ├── tests/
│   └── .env.example
│
├── docs/
│   └── PORTAL.md         # Architecture & design documentation
└── README.md             # This file
```

---

## Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** 14+ (local or remote)
- **Network access** to the AEOS / ePM middleware *(required for enrollment; not needed for portal-only features)*

---

## Quick start

### 1. Clone and configure

```bash
git clone <repository-url>
cd FaceID-KODE
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` — set `JWT_SECRET`, database credentials (`DATABASE_URL` or `PG*` vars), and seed passwords.

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

API listens on **http://localhost:4000** (`/api/health` for health check).

### 3. Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE` | AEOS / ePM middleware URL (no trailing slash). Leave empty in dev to use the Vite proxy. |
| `VITE_PORTAL_API` | Portal backend URL (default `http://localhost:4000/api`) |

Place your portal logo at `frontend/public/logo.png`.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

### 4. Sign in

Default seeded accounts *(change before production)*:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `kode@2026!` |
| CX Agent | `cxteam` | `cxteam@26` |

Passwords are bcrypt-hashed in PostgreSQL. Seed values are controlled by `SEED_*` vars in `backend/.env`.

---

## Roles & permissions

| Capability | Admin | CX Agent |
|------------|:-----:|:--------:|
| Member lookup & enroll (single + bulk) | ✓ | ✓ |
| View own activity | ✓ | ✓ |
| Dashboard & monitoring | ✓ | |
| Manage users & roles | ✓ | |
| View all audit logs | ✓ | |

The backend enforces every permission. The frontend mirrors them for navigation only.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | | HTTP port (default `4000`) |
| `CORS_ORIGINS` | | Comma-separated frontend origins |
| `DATABASE_URL` or `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` | ✓ | PostgreSQL connection |
| `JWT_SECRET` | ✓ | Signing key for portal JWTs |
| `JWT_EXPIRES_IN` | | Token lifetime (default `8h`) |
| `LOG_LEVEL` | | `error` · `warn` · `info` · `debug` |
| `SEED_ADMIN_*` / `SEED_CX_*` | | Initial user credentials for `npm run seed` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE` | | AEOS middleware base URL |
| `VITE_PORTAL_API` | | Portal backend API base URL |

> **Never commit `.env` files.** Use `.env.example` as the template.

---

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with file watch |
| `npm start` | Production start |
| `npm run migrate` | Apply database schema |
| `npm run seed` | Create initial admin + CX agent |
| `npm test` | Run unit tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

---

## Security notes

- Portal credentials are hashed with **bcrypt**; sessions use **JWT**.
- AEOS API credentials currently ship in the frontend bundle (`frontend/src/config/constants.js`). This is a known trade-off of the auth-only backend design. To hide them server-side, proxy AEOS calls through the backend.
- Rotate `JWT_SECRET` and all default passwords before production.
- Restrict `CORS_ORIGINS` to your deployed frontend URL.
- The portal database intentionally excludes biometric or member PII beyond membership codes in audit logs.

---

## Documentation

For system architecture, data flows, UI design system, and integration boundaries, see **[docs/PORTAL.md](docs/PORTAL.md)**.

---

## Production build

```bash
# Frontend
cd frontend && npm run build
# Serve dist/ behind IIS, nginx, or static hosting (web.config included for IIS rewrite)

# Backend
cd backend && npm start
# Run behind a reverse proxy; set NODE_ENV=production
```

---

## License & ownership

Proprietary — **KODE Sports Club · Technology Department**.  
Internal use. Contact the Technology Department for access and deployment support.
