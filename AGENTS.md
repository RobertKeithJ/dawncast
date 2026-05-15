# AGENTS.md

## Project Overview

Daily Motivational Quotes PWA - serves weather-aware motivational quotes with AR display support. Uses Better-T-Stack (React + TanStack Router + Elysia + Drizzle).

## Commands

```bash
# Development
pnpm run dev              # Start all apps (web:3001, server:3000)
pnpm run dev:web          # Frontend only
pnpm run dev:server       # Backend only

# Build & Typecheck
pnpm run build            # Build all packages
pnpm run check-types      # TypeScript across all apps

# Database (PostgreSQL required)
pnpm run db:push          # Push schema to DB
pnpm run db:generate      # Generate Drizzle client
pnpm run db:migrate       # Run migrations
pnpm run db:studio        # Open Drizzle Studio UI
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
├── db/            # Drizzle schema & queries
├── env/           # Env validation (server.ts, web.ts)
└── config/        # Shared TypeScript config
```

## Setup Requirements

- **Runtime**: Bun (packageManager: pnpm@10.33.2)
- **Database**: PostgreSQL - configure connection in `apps/server/.env`
- **PWA**: Run `cd apps/web && pnpm run generate-pwa-assets` after adding icons

## Architecture Notes

- No lint or test scripts configured
- Server uses Bun's hot-reload (`bun run --hot src/index.ts`)
- Web uses Vite with TanStack Router (file-based routing in `apps/web/src/routes/`)
- Shared UI components exported from `packages/ui/components/*`