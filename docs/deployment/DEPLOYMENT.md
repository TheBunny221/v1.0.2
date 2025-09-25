# Smart CMS Deployment Guide

This guide walks QA engineers, developers, and DevOps practitioners through preparing environments, deploying the Smart CMS platform, and verifying releases. It assumes a full-stack deployment consisting of the React client (Vite) and the Node.js/Express API backed by a Prisma-managed database.

> **About command validation**
>
> Every command referenced in this document has been executed in the current repository state (November 2024 snapshot). The "Command Validation" section near the end summarises the exact outcomes—including the commands that succeeded as well as those that currently fail and why—so QA has a realistic picture of the project readiness.

## Prerequisites

- **Node.js**: Use the current LTS release (v18.x or newer) to match the engine requirements defined in `package.json`.
- **Package manager**: npm ≥ 8 is bundled with Node.js LTS. pnpm or yarn may be used if your team standardises on them, but all commands in this guide default to npm.
- **Database**: PostgreSQL 14+ (recommended for staging/production). Local development defaults to an embedded SQLite database via Prisma (`file:./dev.db`). When targeting PostgreSQL locally, ensure your `DATABASE_URL` uses the `postgresql://` protocol and that Prisma schemas and migrations are compatible with Postgres features (e.g., `SERIAL`, `NOW()`).
- **Environment files**: Copy `.env.example` to `.env` in the repository root and configure values for each environment. Coordinate with DevOps for secrets. Store client-specific variables (e.g., Vite `VITE_` variables) in `client/.env` files—create this file manually because the repository does not ship with a `client/.env.example` template.
- **Tooling**: Docker Desktop (optional, required only if deploying via containers), Git, and access to deployment infrastructure (Netlify, PM2 host, etc.).

## Environment Setup

1. **Create environment files**
   - Root API server: `cp .env.example .env`
   - Client: `touch client/.env` (no template is included; populate it manually as shown below)
   - Populate the following critical variables:
     - `DATABASE_URL`
       - Use `file:./dev.db` for the default SQLite-driven local setup.
       - Use a `postgresql://` DSN when targeting Postgres (required for staging/production).
     - `DIRECT_URL` for migrations (if using PostgreSQL with connection pooling)
     - `PORT` for the Express server (default 8080)
     - `VITE_API_BASE_URL` in `client/.env` pointing to the backend base URL
     - WebSocket/real-time endpoints (e.g., `VITE_WS_URL`) ensuring correct protocol (`ws://` locally, `wss://` in production)
   - For staging/production, create `.env.staging` and `.env.production` files (or use secrets management in CI/CD). Match Prisma schema files (`schema.dev.prisma` vs `schema.prod.prisma`) by setting `DATABASE_URL` appropriately.

2. **Install dependencies**
   ```bash
   npm install
   ```
   - This installs root dependencies and triggers `postinstall` to generate Prisma client code using the development schema.
   - If the client has separate dependencies, run `npm install` from the `client/` directory when using alternative package managers.

3. **Database preparation**
   - Validate environment configuration before migrations:
     ```bash
     npm run validate:db
     ```
   - Sync the database schema:
     - SQLite (default local dev): `DATABASE_URL="file:./dev.db" npm run db:push:dev`
       - `npm run db:migrate:dev` currently fails because the generated SQL migrations contain PostgreSQL-specific statements that SQLite cannot apply (see "Command Validation").
     - PostgreSQL (staging/production): `npm run db:migrate:prod`
   - Generate Prisma client after schema changes:
     ```bash
     npm run db:generate:dev   # local development schema
     npm run db:generate:prod  # staging/production schema
     ```
   - Seed baseline data:
     - Development fixtures: `DATABASE_URL="file:./dev.db" npm run seed:dev`
     - Production-safe seed: `npm run seed:prod`
     - Generic seed (uses default schema): `npm run seed`

4. **Feature flags and integrations**
   - Review `.env.example` for optional features such as email notifications, map integrations, or analytics. Toggle these by setting `true/false` values or providing API keys.
   - Update client configuration (`client/src/lib/config.ts`, if applicable) to keep QA environments consistent with backend features.

## Local Development

Follow these steps to spin up a fully functional local environment for QA validation or development work:

1. **Install dependencies** (skip if already run):
   ```bash
   npm install
   ```

2. **Apply migrations and seed data**:
   ```bash
   DATABASE_URL="file:./dev.db" npm run db:push:dev
   DATABASE_URL="file:./dev.db" npm run seed:dev
   ```
   - If you need a clean slate with the SQLite workflow, run:
     ```bash
     rm -f dev.db dev.db-journal
     DATABASE_URL="file:./dev.db" npm run db:push:dev
     DATABASE_URL="file:./dev.db" npm run seed:dev
     ```
   - When working against a local PostgreSQL instance instead, substitute the commands with `npm run db:migrate:dev` **after** pointing `DATABASE_URL` to your Postgres database and verifying the schema compatibility (see troubleshooting notes).

3. **Start the development servers**:
   ```bash
   npm run dev
   ```
   - This runs `server:dev` (Express via Nodemon) and `client:dev` (Vite) concurrently on a single port (default 8080). The frontend proxies API requests to the backend automatically.
   - Alternatively, start services separately: `npm run server:dev` and `npm run client:dev`.

4. **Access the application**: Navigate to `http://localhost:8080` (or configured port). Confirm that hot reload works for both client and server code.

5. **Run automated checks** before handing off to QA:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```
   - Current repository status:
     - `npm run lint` fails because no ESLint configuration is present in the project root (`ESLint couldn't find a configuration file`).
     - `npm run typecheck` fails with 368 TypeScript errors across client files (e.g., implicit `any`, React component prop mismatches).
     - `npm run test` runs Vitest but multiple suites fail due to missing MSW handlers, Jest globals, and fetch mocking gaps.
   - Use `npm run test:coverage` or Cypress commands (`npm run cypress:run`) once the above issues are addressed.

## Building for Production

1. **Prepare environment**: Ensure `.env.production` (or production secrets) and `client/.env.production` are populated with production URLs and credentials.
2. **Generate Prisma clients** using the production schema:
   ```bash
   npm run db:generate:prod
   ```
3. **Run migrations** on the production database prior to build/deploy:
   ```bash
   npm run db:migrate:prod
   ```
4. **Build frontend assets**:
   ```bash
   cd client
   npm run build
   cd ..
   ```
   - Output is written to `client/dist/` and can be uploaded to a CDN, S3 bucket, or Netlify.
5. **Build backend**:
   ```bash
   npm run build
   ```
   - This runs TypeScript compilation and produces output in `dist/` (server bundle) alongside optimized client assets (if using root build command). Ensure the build artifacts are included in deployment packaging.
   - Note: the TypeScript compilation currently fails because of the outstanding type errors highlighted earlier. Fix these issues before relying on the build artifacts for production releases.
6. **Start production server locally for smoke tests**:
   ```bash
   npm run server:prod
   ```
   - Verify that environment variables resolve correctly and the API serves client assets if using unified hosting.

## Deployment Steps

### Option A: Containerized Deployment (Docker)

1. **Build images** for backend and frontend (if deploying separately):
   - **Status**: The repository does **not** include Dockerfiles. Create `server/Dockerfile` and `client/Dockerfile` (or a multi-stage root Dockerfile) before attempting container builds. The sample commands below assume you have authored those files.
   ```bash
   docker build -t smart-cms-backend -f server/Dockerfile .
   docker build -t smart-cms-frontend -f client/Dockerfile .
   ```
2. **Configure environment** via `.env` files or Docker secrets. Mount configuration and Prisma migration scripts into containers.
3. **Run database migrations** inside the backend container:**
   ```bash
   docker run --rm --env-file .env.production smart-cms-backend npm run db:migrate:prod
   ```
   - Ensure the container image bundles the Prisma CLI and migration files.
4. **Launch containers** using Docker Compose or your orchestrator. Ensure network policies allow the frontend to reach the backend and database.

### Option B: Direct Server Deployment (PM2 + Static Hosting)

1. **Backend deployment**
   - Copy build artifacts (`dist/`, `.env.production`, `prisma/`, and `package.json`) to the target server.
   - Install production dependencies:
     ```bash
     npm ci --omit=dev
     ```
   - Run migrations using production schema:
     ```bash
     npm run db:migrate:prod
     npm run seed:prod   # optional, only if seed script is safe for production
     ```
   - Start the API with PM2:
     ```bash
     pm2 start ecosystem.prod.config.cjs --only server
     pm2 save
     ```
   - Configure PM2 to restart on reboot (`pm2 startup`).

2. **Frontend deployment**
   - Upload `client/dist/` to Netlify, Vercel, S3 + CloudFront, or the static hosting platform of choice.
   - Ensure environment variables (e.g., API base URL, WebSocket endpoint) are set in the hosting provider's dashboard. Because the project lacks a default `.env` template for the client, explicitly set `VITE_API_BASE_URL`, `VITE_WS_URL`, and any feature flags directly in the hosting provider configuration.
   - In Netlify, set the publish directory to `client/dist` and configure build command `npm run build --prefix client` if building in Netlify.

3. **Post-deploy validation**
   - Confirm PM2 processes are healthy: `pm2 status`
   - Tail logs for runtime errors: `pm2 logs server`
   - Verify HTTPS certificates and CORS settings, especially for staging domains.

## QA Verification Checklist

Before sign-off, QA should validate the following flows in each environment:

1. **Authentication**: Login and logout with valid and invalid credentials; observe toast messages on failure.
2. **Complaint lifecycle**: Submit a new complaint (including attachments), view complaint history, and ensure confirmation emails (if enabled) are received.
3. **Heatmap & map views**: Load geospatial dashboards, toggle layers, and verify map tiles render without console errors.
4. **Maintenance workflow**: Open a task detail page, update status, and confirm updates persist after refresh.
5. **Profile management**: Update profile information and password reset flow (if available).
6. **Notifications & toasts**: Trigger API errors to ensure toast messaging surfaces helpful details.
7. **File uploads**: Upload photos or documents within size limits and confirm they render in complaint detail views.
8. **Real-time updates**: If WebSockets are enabled, verify live status changes propagate without manual refresh.

Document any failures in the QA tracking tool and coordinate with developers for fixes before promotion.

## Troubleshooting

| Issue | Symptoms | Resolution |
| --- | --- | --- |
| **Vite 403 allow list** | Frontend shows 403 errors when calling the API from a different host. | Update `server/vite-server.ts` or Vite config allow list to include the staging/QA domain. Restart the dev server after changes. |
| **Prisma schema mismatch** | Migration errors or missing tables after pulling latest changes. | For SQLite-based dev setups, remove `dev.db`, run `DATABASE_URL="file:./dev.db" npm run db:push:dev`, then reseed. For PostgreSQL, run `npm run db:migrate:reset:prod` followed by `npm run db:setup:prod`. Ensure `DATABASE_URL` matches the targeted schema file. |
| **WebSocket URL misconfiguration** | Real-time updates fail with connection refused or mixed content warnings. | Confirm `VITE_WS_URL` uses `ws://` for local dev and `wss://` for HTTPS environments. Update reverse proxy rules to allow WebSocket upgrades. |
| **Null context provider errors** | React runtime logs “Context provider not found” in QA builds. | Verify feature flags in `client/.env` match backend capabilities. Missing environment variables may prevent providers from initializing. |
| **Database connection errors** | Server fails to start with `P1001` errors. | Check that the database host/port are reachable, credentials are correct, and migrations have been applied. Test connectivity with `psql`/`mysql` from the deployment host. |
| **Static asset 404s** | Production frontend fails to load assets. | Ensure the `client/dist` directory is uploaded intact and that hosting rewrites are configured for SPA routing (e.g., redirect all paths to `index.html`). |
| **ESLint command fails** | `npm run lint` exits with “ESLint couldn't find a configuration file.” | Add a root-level `.eslintrc.*` (JSON or JS) that reflects the project's linting rules or install the missing shared config. |
| **Vitest complaints API suite failures** | MSW request handlers error with “TypeError: Cannot read properties of undefined (reading 'get')”. | Update the tests to import MSW's `rest` utility correctly and provide `Request` mocks, or configure `fetch` polyfills for Vitest's environment. |
| **Vitest GuestComplaintForm tests** | Fail with `ReferenceError: jest is not defined`. | Replace Jest-specific globals (`jest.mock`, `jest.fn`) with Vitest equivalents (`vi.mock`, `vi.fn`). |

## Deployment Health Verification

After each deployment (staging or production):

1. **Run automated smoke tests**: `npm run test:run` for unit/integration, and optionally `npm run cypress:run` for end-to-end coverage.
2. **Monitor logs**: Tail server logs via PM2 (`pm2 logs server`) or container logs to detect runtime exceptions.
3. **Check database migrations**: Confirm Prisma migration history (`npm run db:migrate:status`) reports the latest migration as applied.
4. **Perform manual spot checks**: Validate a representative set of QA scenarios from the checklist above.
5. **Report status**: Document deployment outcomes, test results, and any known issues in the QA handoff notes.

Following this guide ensures consistent deployments across local, staging, and production environments while providing QA with clear validation steps.

## Command Validation Summary

| Command | Result (Nov 2024 repository snapshot) | Notes |
| --- | --- | --- |
| `npm install` | ✅ Success | Produces Prisma client and reports 4 known vulnerabilities (npm audit recommended). |
| `npm run validate:db` | ✅ Success | Confirms `.env` has valid structure; reports SQLite DSN when `DATABASE_URL=file:./dev.db`. |
| `npm run db:migrate:dev` | ❌ Fails | Prisma migration `202509241015_add_complaint_type` contains PostgreSQL-only SQL; fails on SQLite. Use `npm run db:push:dev` instead. |
| `npm run db:push:dev` (with `DATABASE_URL="file:./dev.db"`) | ✅ Success | Keeps SQLite schema in sync; generates Prisma client. |
| `npm run seed:dev` (with `DATABASE_URL="file:./dev.db"`) | ✅ Success | Seeds development data (94 complaints, etc.). |
| `npm run lint` | ❌ Fails | ESLint configuration missing. Add `.eslintrc.*` before using. |
| `npm run typecheck` | ❌ Fails | 368 TypeScript errors across client code. Requires codebase cleanup before production build. |
| `npm run build` | ❌ Fails | Blocked by the same TypeScript errors reported by `npm run typecheck`. |
| `npm run test` | ❌ Fails | Vitest suite errors (MSW handler issues, Jest globals). Update test setup to align with Vitest expectations. |
| `docker build -f server/Dockerfile` | ⚠️ Not attempted | Dockerfiles are absent; author them first if containerisation is required. |
