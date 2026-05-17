# Development Workflow

## Prerequisites

- **Runtime:** Bun (configured as packageManager)
- **Package Manager:** pnpm v10.33.2
- **Database:** PostgreSQL

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup database (ensure PostgreSQL is running)
pnpm run db:push

# Start development
pnpm run dev
```

## Project Structure

### Frontend (apps/web)

```
apps/web/src/
├── components/          # React components
│   ├── header.tsx      # App header with nav
│   ├── quote-card.tsx  # Quote display component
│   ├── weather-display.tsx
│   └── ...
├── routes/             # TanStack Router file-based routing
│   ├── index.tsx      # Home route
│   ├── history.tsx   # Quote history
│   └── settings.tsx  # User preferences
├── lib/               # Client utilities
│   ├── api.ts        # Eden Treaty client
│   ├── storage.ts    # localStorage helpers
│   └── functions.ts  # Utility functions
├── hooks/             # Custom React hooks
└── main.tsx          # React entry point
```

### Backend (apps/server)

```
apps/server/src/
├── index.ts           # Main server + API routes
├── functions.ts       # Weather-to-tone mapping
├── constants.ts       # API URLs, defaults
├── services/          # Business logic
│   ├── weather-service.ts      # Weather API + caching
│   ├── quote-service.ts        # Quote database ops
│   └── daily-quote-service.ts  # Quote orchestration
└── types.ts           # TypeScript types
```

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start both web (3001) and server (3000) |
| `pnpm run dev:web` | Frontend only with HMR |
| `pnpm run dev:server` | Backend only with hot reload |
| `pnpm run build` | Build server to dist/ |
| `pnpm run check-types` | TypeScript type checking |

## Database Commands

| Command | Description |
|---------|-------------|
| `pnpm run db:push` | Push schema to database |
| `pnpm run db:generate` | Generate Drizzle client |
| `pnpm run db:migrate` | Run pending migrations |
| `pnpm run db:studio` | Open Drizzle Studio UI |

## Seeding Quotes

```bash
# Requires GEMINI_API_KEY in apps/server/.env
pnpm run seed:quotes
```

This script:
1. Reads quotes from `scripts/Quotes.csv`
2. Uses Gemini AI to classify each quote into tone categories
3. Inserts classified quotes into the database

## Environment Variables

### apps/web/.env
```
VITE_SERVER_URL=http://localhost:3000
```

### apps/server/.env
```
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://user:pass@localhost:5432/dailyquotes
DIRECT_URL=postgresql://user:pass@localhost:5432/dailyquotes
GEMINI_API_KEY=your_api_key_here
```

## PWA Development

```bash
# Generate PWA icons (after adding icon files)
cd apps/web
pnpm run generate-pwa-assets
```

The PWA config is in `apps/web/vite.config.ts`.

## Hot Reload Behavior

- **Server:** Uses Bun's `--hot` flag for instant reload on file changes
- **Web:** Uses Vite HMR for instant component updates

## Key Patterns

### Deterministic Quote Selection
Same user + same day + same weather tone = same quote (stable hash)

### Weather Caching
- 60-minute TTL on weather_cache table
- Reduces Open-Meteo API calls
- Key: `(latitude, longitude)`

### No-Repeat Window
- 30-day dedup via delivery_log query
- Same quote won't repeat within 30 days