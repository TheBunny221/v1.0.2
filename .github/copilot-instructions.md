# Copilot Instructions

This repository implements the production-grade **Cochin Smart City Complaint Management System**. When proposing code or reviews, Copilot must respect the following conventions derived from the whole project:

## Project Layout
- `client/` – React SPA (TypeScript) with pages, reusable `components/ui`, contexts, hooks and Redux Toolkit state in `store/`.
- `server/` – Express API (TypeScript ES modules) with routes, controllers, middleware and Prisma-backed DB helpers under `db/`.
- `shared/` – Type definitions shared by client and server.
- `prisma/` – Prisma schemas and migration utilities.

## General Guidelines
- Use **TypeScript** everywhere; avoid `any` unless unavoidable.
- Prefer **async/await** with robust `try/catch` error handling.
- Respect path aliases: `@/*` for client code and `@shared/*` for shared types.
- Reuse existing utilities and components; keep modules small and focused.
- Only add new Express endpoints when logic must run on the server (e.g. secrets or database operations).

## Client (React)
- React 18 with **React Router 6**; new pages live in `client/pages/` and are registered in `client/App.tsx`.
- Global state uses **Redux Toolkit** and **RTK Query** in `client/store/`.
- Style with **TailwindCSS** and merge classes via `cn()` from `@/lib/utils`.
- Build functional components with typed props; compose UI with **Radix UI** primitives and `lucide-react` icons.

## Server (Express)
- Express API under `server/`; routes prefixed with `/api` and return typed JSON.
- Database access goes through **Prisma**; keep schema changes in `prisma/` and leverage helpers in `server/db`.
- Utilize middleware for validation, authentication and rate limiting.

## Testing & Quality
- Run `npm run lint` and `npm test` (Vitest) before committing; keep lint warnings at zero.
- Test files reside beside source in `__tests__` directories.
- Preserve existing configuration in `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts` and Prisma schemas.

## Dependency Management
- Prefer existing libraries; discuss before adding new runtime dependencies.
- Keep commit messages descriptive and pull requests focused.

Adhering to these instructions ensures contributions align with the project's architecture and maintain production readiness.
