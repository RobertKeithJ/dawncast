# AGENTS.md

## Project Overview

Daily Motivational Quotes PWA — serves weather-aware motivational quotes with AR display support. Uses Better-T-Stack (React + TanStack Router + Elysia + Drizzle).

**Package manager: Bun** (monorepo workspaces via `package.json` `workspaces` field).

## Commands

```bash
# Install dependencies
bun install

# Development
bun run dev              # Start all apps (web:3001, server:3000)
bun run dev:web          # Frontend only
bun run dev:server       # Backend only

# Build & Typecheck
bun run build            # Build server (tsdown → dist/index.mjs)
bun run check-types      # TypeScript across all apps

# Lint & Test
bun run lint             # ESLint across all apps (via Turbo)
bun run test             # Vitest across all apps (via Turbo)
bun run test:e2e         # Playwright E2E tests

# Database (PostgreSQL required — configure apps/server/.env)
bun run db:push          # Push schema to DB
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio UI

# Seeding
cd packages/db && bun run seed          # Seed tone categories + quotes
bun run --filter server seed:quotes     # Classify CSV quotes (requires GEMINI_API_KEY)
```

## Monorepo Structure

```
apps/
├── web/           # React + TanStack Router + Vite + TailwindCSS 4
│   └── src/       # Entry: routes/index.tsx
└── server/        # Elysia + Bun
    └── src/index.ts

packages/
├── ui/            # Shared shadcn/ui components (import from @project-dailyquotes/ui)
├── db/            # Drizzle schema, migrations & seed
├── env/           # Env validation (server.ts, web.ts)
└── config/        # Shared TypeScript config
```

## Setup Requirements

- **Runtime**: Bun ≥ 1.3
- **Database**: PostgreSQL — copy `apps/server/.env.example` → `apps/server/.env` and fill in values
- **Web env**: copy `apps/web/.env.example` → `apps/web/.env` and set `VITE_SERVER_URL`
- **PWA assets**: `cd apps/web && bun run generate-pwa-assets` (after adding icons)

## Deployment

### Railway (backend — Dockerfile)
The project root contains a `Dockerfile`. Railway will auto-detect it.
Set these environment variables in Railway:
- `DATABASE_URL` — PostgreSQL connection string
- `CORS_ORIGIN` — Your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
- `NODE_ENV=production`
- `PORT` is injected automatically by Railway

### Vercel (frontend)
A `vercel.json` at the project root configures the build:
- Install command: `bun install`
- Build command: `cd apps/web && bun run build`
- Output directory: `apps/web/dist`

Set this environment variable in Vercel:
- `VITE_SERVER_URL` — Your Railway backend URL (e.g. `https://your-server.up.railway.app`)

## Architecture Notes

- Server uses Bun's hot-reload in dev (`bun run --hot src/index.ts`)
- Server runs TypeScript natively in production (no compile step in Docker)
- Web uses Vite with TanStack Router (file-based routing in `apps/web/src/routes/`)
- Shared UI components exported from `packages/ui/src/components/*`
- Lint: ESLint 9 flat config at root (`eslint.config.js`)
- Tests: Vitest (web + server), Playwright (E2E in `e2e/`)
