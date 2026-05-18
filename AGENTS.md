# AGENTS.md

## Project Overview

**Dawncast** — Weather-aware motivational quotes PWA with AR display support. Delivers a daily quote whose tone matches the user's current weather.

**Stack:** React + TanStack Router + Vite + TailwindCSS 4 (web) | Elysia + Bun + Drizzle ORM (server) | PostgreSQL (database)

**Package manager:** Bun (monorepo workspaces via `package.json` `workspaces` field).

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
├── web/           # React + TanStack Router + Vite + TailwindCSS 4 + vite-plugin-pwa
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom hooks (usePwaInstall)
│       ├── lib/          # API client, storage, utils
│       ├── routes/       # TanStack Router routes (index.tsx, history.tsx)
│       └── index.css     # Global styles
└── server/        # Elysia + Bun
    └── src/
        ├── index.ts        # API routes
        ├── services/      # Business logic (weather, quotes, daily-quote)
        ├── functions.ts   # Tone mapping, weather condition labels
        ├── constants.ts  # API URLs, defaults
        └── types.ts      # Shared types

packages/
├── ui/            # Shared shadcn/ui components (import from @dawncast/ui)
├── db/            # Drizzle schema, migrations & seed
├── env/           # Env validation (server.ts, web.ts)
└── config/        # Shared TypeScript config
```

## Setup Requirements

- **Runtime:** Bun ≥ 1.3
- **Database:** PostgreSQL — copy `apps/server/.env.example` → `apps/server/.env` and fill in values
- **Web env:** copy `apps/web/.env.example` → `apps/web/.env` and set `VITE_SERVER_URL`
- **PWA assets:** `cd apps/web && bun run generate-pwa-assets` (after adding icons to `public/`)

## Environment Variables

### apps/server/.env
```
DATABASE_URL=postgresql://user:pass@host:5432/db   # Required — Supabase or any Postgres
CORS_ORIGIN=http://localhost:3001                 # Required — frontend URL
NODE_ENV=development                                # Optional (default: development)
GEMINI_API_KEY=...                                  # Optional — only for seeding script
```

### apps/web/.env
```
VITE_SERVER_URL=http://localhost:3000   # Required — backend URL (prod: Railway URL)
```

## Deployment

### Railway (backend — Dockerfile)
The project root contains a `Dockerfile`. Railway auto-detects it.
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

### Weather-to-Tone Mapping
| Weather Codes | Condition | Tone Category |
|---|---|---|
| 0, 1, 2 | Clear, Sunny | Energy & Action |
| 3 | Partly Cloudy | Patience & Perseverance |
| 45, 48 | Fog | Clarity & Focus |
| 51-67, 80-82 | Drizzle, Rain | Resilience & Growth |
| 71-77, 85-86 | Snow | Rest & Renewal |
| 95-99 | Thunderstorm | Courage & Strength |

### Deterministic Quote Selection
Same user + same day + same weather tone = same quote (stable hash-based selection).

### Weather Caching
60-minute TTL on `weather_cache` table. Reduces Open-Meteo API calls.
Coordinates are rounded to 2 decimal places (~1.1 km grid).

### No-Repeat Window
30-day dedup via `delivery_log` query. Same quote won't repeat within 30 days.
**Note:** Only applies to users with a `subscriptionId`. Anonymous users rely on client-side `seen_quote_ids` in localStorage.

### Bonus Quote Deduplication (Anonymous Users)
Since anonymous users have no `subscriptionId`, the server can't track their history via `delivery_log`. The client bridges this gap by maintaining a `seen_quote_ids` list in localStorage. On each bonus quote request, the client sends `excludeIds` (all quote IDs seen today). The server merges these with `extraExcludeIds` in `getBonusQuote()` before selecting.

### PWA Install Flow
- Android/Chrome: Native `beforeinstallprompt` event captured → toast shown via Sonner after quote renders
- iOS Safari: No `beforeinstallprompt` support → custom hint toast directs user to Safari's Share button
- In-app browsers (FB/Instagram): Shows "Open in Safari" notice
- Dismissal: Snooze 3 days per dismissal. After 3 dismissals → permanent suppression.
- Install confirmation: "appinstalled" event shows success toast.

### External APIs (no API keys required)
- **Open-Meteo Geocoding:** `https://geocoding-api.open-meteo.com/v1/search`
- **Open-Meteo Forecast:** `https://api.open-meteo.com/v1/forecast`
- **ZenQuotes fallback:** `https://zenquotes.io/api/random`

## Key Patterns

- Server uses Bun hot-reload in dev (`bun run dev:server`)
- Server builds with tsdown (`bun run build` → `dist/index.mjs`), production uses `bun run start:server`
- Web uses Vite with TanStack Router (file-based routing in `apps/web/src/routes/`)
- Shared UI components exported from `packages/ui/src/components/*`
- Lint: ESLint 9 flat config at root (`eslint.config.js`)
- Tests: Vitest (web + server), Playwright (E2E in `e2e/`)

## File Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` prefixed with `use`
- Utils/lib: `camelCase.ts`
- Routes: `kebab-case.tsx` matching the URL path