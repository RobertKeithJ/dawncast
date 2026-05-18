# Dawncast

Weather-aware motivational quotes PWA with AR display support. Delivers a daily quote whose tone matches your current weather.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS 4** - Utility-first CSS for rapid UI development
- **Elysia** - Type-safe, high-performance framework
- **Bun** - Runtime environment and package manager
- **Drizzle ORM** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **PWA** - Progressive Web App support with offline caching

## Getting Started

```bash
# Install dependencies
bun install

# Start development (web:3001, server:3000)
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser. The API runs at [http://localhost:3000](http://localhost:3000).

### Database Setup

1. Copy `apps/server/.env.example` → `apps/server/.env` and fill in your PostgreSQL connection string.
2. Apply the schema:

```bash
bun run db:push
```

## Available Scripts

- `bun run dev` - Start all apps (web + server)
- `bun run dev:web` - Frontend only (http://localhost:3001)
- `bun run dev:server` - Backend only (http://localhost:3000)
- `bun run build` - Build server for production
- `bun run check-types` - TypeScript across all apps
- `bun run lint` - ESLint across all apps
- `bun run test` - Vitest unit tests
- `bun run db:push` - Push schema to database
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio UI

### PWA Assets

```bash
cd apps/web && bun run generate-pwa-assets
```
After adding icon files to `apps/web/public/`, run the above to regenerate PWA assets.

## Project Structure

```
dawncast/
├── apps/
│   ├── web/      # React + TanStack Router + Vite + TailwindCSS 4 + PWA
│   └── server/  # Elysia + Bun + Drizzle ORM
└── packages/
    ├── ui/       # Shared shadcn/ui components
    └── db/       # Database schema, migrations, seed
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TanStack Router, Vite, TailwindCSS 4, vite-plugin-pwa |
| Backend | Elysia, Bun |
| Database | PostgreSQL, Drizzle ORM |
| Monorepo | Turborepo |
