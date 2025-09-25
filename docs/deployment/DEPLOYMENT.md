# NLC-CMS Complaint Management – Deployment Guide

Audience: QA engineers, developers, and DevOps.

This guide covers local development, staging, and production deployments for the full-stack application:

- client/ – React + Vite SPA (TypeScript)
- server/ – Node.js + Express API
- prisma/ – Prisma ORM schemas, migrations, and seeders
- shared/ – Shared types/utilities between client and server

Key defaults in development:

- Frontend: http://localhost:3000 (Vite)
- Backend API: http://localhost:4005 (Express)
- Frontend proxies /api to the backend (configured in vite.config.ts)

---

## 1) Prerequisites

- Node.js >= 18 and npm >= 8 (see package.json engines)
- Git and a terminal with Bash-compatible shell
- Databases
  - Development: SQLite file database (DATABASE_URL="file:./dev.db")
  - Staging/Production: PostgreSQL 14+ (recommended)
- Optional tooling
  - PM2 for process management in production (ecosystem.prod.config.cjs provided)
  - Docker (if you prefer containerized deployment; Dockerfiles are not included by default)
  - Netlify/Vercel for hosting the SPA (optional)

---

## 2) Environment Setup

The server loads base .env and then .env.<NODE_ENV> (see server/config/environment.js).

1. Create environment files
   - Copy or create at project root:
     - .env (base)
     - .env.development (dev overrides)
     - .env.production (prod overrides)
   - Optionally create client/.env for client-only overrides (remember that Vite exposes variables prefixed with VITE\_ only).

2. Minimum required variables (root .env or environment)
   - DATABASE_URL
     - Development (SQLite): DATABASE_URL="file:./dev.db"
     - Staging/Production (Postgres): DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB"
   - JWT_SECRET="a-secure-random-string"
   - PORT=4005 (recommended) and HOST=0.0.0.0
   - CORS_ORIGIN="http://localhost:3000,http://localhost:8080" (comma-separated; set to your staging/prod domains)
   - Email (production): EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, EMAIL_FROM
     - In development, an Ethereal test account is auto-created if EMAIL\_\* are not set. Preview URLs are printed in logs.

3. Client-side variables (client/.env or injected at build time)
   - VITE_API_URL or VITE_PROXY_TARGET (optional; the dev server already proxies /api to 4005)
   - VITE_HMR_PORT (if your proxy needs a fixed HMR port; defaults to 3001)
   - Any feature flags consumed by the SPA must be VITE\_\* prefixed

4. Install dependencies

```bash
npm install
```

5. Validate DB env

```bash
npm run validate:db
```

---

## 3) Database Management (Prisma)

Useful scripts from package.json:

- Generate Prisma client
  - Development: npm run db:generate:dev
  - Production: npm run db:generate:prod
- Apply schema changes
  - Development (SQLite): npm run db:push:dev
  - Production (Postgres): npm run db:migrate:prod
- Create a new dev migration (when using dev Postgres): npm run db:migrate:create
- Reset database (dangerous): npm run db:migrate:reset:dev | npm run db:migrate:reset:prod
- Seed data
  - Development: npm run seed:dev
  - Production-safe: npm run seed:prod
  - Generic: npm run seed

Quick setup examples:

```bash
# SQLite dev setup (clean slate)
rm -f dev.db dev.db-journal
npm run db:generate:dev
npm run db:push:dev
npm run seed:dev

# Production/staging (Postgres)
npm run db:generate:prod
npm run db:migrate:prod
npm run seed:prod    # only if your seed is safe for prod
```

---

## 4) Local Development

Start both servers concurrently (frontend @ 3000, backend @ 4005):

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend Health: http://localhost:4005/api/health and /api/health/detailed
- API Docs (Swagger): http://localhost:4005/api-docs

Common checks before QA handoff:

```bash
npm run typecheck
npm run test
# Optional: npm run cypress:run
```

Notes:

- The Vite dev server proxies /api to the backend (vite.config.ts). If your environment uses a reverse proxy, adjust VITE_CLIENT_HOST / VITE_CLIENT_PORT / VITE_HMR_PORT as needed.
- Nodemon watches server/\* files (see nodemon.json). Client code changes hot-reload via Vite.

---

## 5) Building for Production

Root production build compiles the SPA to dist/spa and TypeScript to dist types (server is mostly JS):

```bash
npm run build
```

Artifacts:

- SPA bundle: dist/spa (served by Express in production if present)
- Server remains server/server.js; pm2 config points to it (ecosystem.prod.config.cjs)

Smoke test locally with production server:

```bash
npm run server:prod
# Visit http://localhost:4005/api/health and ensure dist/spa is served for non-API routes
```

If you prefer a separate SPA build step only (for static hosting):

```bash
# SPA only
vite build    # runs with vite.config.ts -> output dist/spa
```

---

## 6) Deployment Options

### A) Single host (Express serves SPA + API)

1. Prepare environment on the server

```bash
# On the target host
export NODE_ENV=production
# Provide DATABASE_URL, JWT_SECRET, EMAIL_* and CORS_ORIGIN appropriately
```

2. Copy source or CI artifacts, then build and migrate

```bash
npm ci --omit=dev
npm run db:generate:prod
npm run db:migrate:prod
npm run build
```

3. Start with PM2 (recommended)

```bash
pm2 start ecosystem.prod.config.cjs --only cochin-api
pm2 save
pm2 status
```

- Express will serve dist/spa for non-API routes automatically (see server/app.js).

### B) Split hosting (Static SPA + API)

- Frontend (Netlify/Vercel/S3+CDN)
  - Build command: npm run build
  - Publish directory: dist/spa
  - Configure environment vars for the SPA as needed (VITE\_\* only).
- Backend (VM/Container/PM2)
  - Follow the steps from option A but skip serving the SPA.
  - Ensure CORS_ORIGIN includes the exact SPA domain(s).

### C) Containers (optional)

- Dockerfiles are not included. If you choose containers, author Dockerfiles for server and SPA or a multi-stage image. Ensure migrations (npm run db:migrate:prod) run as part of the release process.

---

## 7) QA Verification Checklist

- Authentication: login/logout, handle invalid creds, observe error toasts
- Complaint lifecycle: submit complaint with attachments; view history; confirm email (in dev: Ethereal preview URL in logs)
- Maps/Heatmap: load map layers and heatmap; verify no console errors
- Maintenance workflow: open a task, change status, persist after reload
- Profile: update profile details; try password/OTP flows
- Uploads: upload photos (server serves /uploads); preview in detail screens
- Error surfaces: induce API errors and check toasts/messages
- Real-time/HMR (dev): ensure frontend updates without errors; check WebSocket stability
- Health checks: /api/health and /api/health/detailed return 200 in healthy state

---

## 8) Troubleshooting

- Vite proxy/HMR issues behind a proxy
  - Symptoms: HMR disconnects or WebSocket errors
  - Fix: set VITE_HMR_PORT (defaults to 3001) and ensure reverse proxy forwards WebSocket upgrades; set VITE_CLIENT_HOST=0.0.0.0 when needed.

- Vite 403 or file access errors
  - Cause: Vite fs.allow denies paths by default
  - Fix: update vite.config.ts server.fs.allow to include required directories; avoid exposing server/\*\* in dev.

- Database connection errors (Prisma P1001/P1000)
  - Verify DATABASE_URL, network ACLs, and credentials; run npm run db:migrate:status
  - For dev (SQLite) reset quickly:
    ```bash
    rm -f dev.db dev.db-journal
    npm run db:push:dev && npm run seed:dev
    ```

- Missing JWT_SECRET in development
  - In dev, the server logs a warning and continues. Set JWT_SECRET anyway to test auth flows deterministically.

- CORS failures in staging/prod
  - Ensure CORS_ORIGIN includes the exact scheme + host + port of your SPA (comma-separated for multiple origins).

- SPA 404s on reload in production
  - Confirm Express serves dist/spa and the SPA fallback route (server/app.js). Rebuild and redeploy if dist/spa is missing.

- Email not sending in development
  - Dev uses Ethereal if EMAIL\_\* are not provided. Check server logs for preview URLs. In prod, configure EMAIL_SERVICE/USER/PASS/PORT correctly.

---

## 9) Test and Health Gates before Handoff

Run automated checks:

```bash
npm run typecheck
npm run test
# Optional: npm run test:coverage and npm run cypress:run
```

Verify health endpoints:

```bash
curl -s http://localhost:4005/api/health | jq .
curl -s http://localhost:4005/api/health/detailed | jq .
```

If deploying split hosting, validate CORS and that the SPA calls /api successfully.

---

## 10) Quick Commands Reference

- Local dev (first run)

```bash
npm install
npm run db:setup:dev   # or: db:generate:dev + db:push:dev + seed:dev
npm run dev
```

- Staging/Prod

```bash
npm ci --omit=dev
npm run db:generate:prod
npm run db:migrate:prod
npm run build
pm2 start ecosystem.prod.config.cjs --only cochin-api
pm2 save
```

This guide reflects the current repository scripts and server behavior (Vite @ 3000, API @ 4005, SPA served from dist/spa in production). Keep it updated as the project evolves.
