# Daily Motivational Quotes PWA

Weather-aware motivational quotes Progressive Web Application with AR display support.

## Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Vite) - Port 3001"]
        UI["React Components"]
        Router["TanStack Router"]
        Query["TanStack Query"]
        API["Eden Treaty Client"]
        Storage["localStorage"]
        PWA["PWA Service Worker"]
    end

    subgraph Server["Backend (Elysia + Bun) - Port 3000"]
        Elysia["Elysia HTTP Server"]
        WServices["Weather Service"]
        QServices["Quote Services"]
        APIRoutes["API Routes"]
    end

    subgraph DB["Database - PostgreSQL"]
        Quotes["quotes"]
        ToneCategories["tone_categories"]
        Subscriptions["push_subscriptions"]
        DeliveryLog["delivery_log"]
        WeatherCache["weather_cache"]
    end

    subgraph External["External APIs"]
        OM["Open-Meteo\nWeather API"]
        Zen["ZenQuotes\nFallback API"]
    end

    UI --> Router
    UI --> Query
    Query --> API
    API -->|HTTP/JSON| Elysia
    UI --> Storage
    PWA -->|Caching| OM
    PWA -->|Caching| API

    Elysia --> APIRoutes
    APIRoutes --> WServices
    APIRoutes --> QServices

    WServices -->|Query/Insert| DB
    QServices -->|Query/Insert| DB
    WServices -->|Fetch Weather| OM
    QServices -->|Fallback Quote| Zen
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as React App
    participant API as Elysia Server
    participant DB as PostgreSQL
    participant Weather as Open-Meteo

    User->>Web: Open app / Request quote
    Web->>API: GET /api/daily-quote?lat=&lon=
    API->>Weather: Fetch weather data
    Weather-->>API: Weather code + temp
    API->>DB: Query tone category for weather code
    DB-->>API: tone_category_id
    API->>DB: Select quote by tone + date (deterministic)
    DB-->>API: Quote data
    API-->>Web: { quote, weather, meta }
    Web-->>User: Display quote + weather
```

## Monorepo Structure

```
project-dailyquotes/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── routes/         # TanStack Router routes
│   │   │   ├── lib/            # API client, storage
│   │   │   └── hooks/          # Custom React hooks
│   │   └── vite.config.ts      # Vite + PWA config
│   │
│   └── server/                 # Elysia + Bun backend
│       ├── src/
│       │   ├── index.ts        # API routes
│       │   ├── services/       # Business logic
│       │   ├── functions.ts    # Utilities
│       │   └── types.ts       # TypeScript types
│       └── scripts/            # Seeding scripts
│
└── packages/
    ├── ui/                     # Shared shadcn/ui components
    ├── db/                     # Drizzle schema & queries
    ├── env/                    # Env validation (Zod)
    └── config/                 # Shared TypeScript config
```

## Technology Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React 19, TanStack Router, TanStack Query, Vite, TailwindCSS 4 |
| Backend | Bun, Elysia, Drizzle ORM, PostgreSQL |
| API Client | @elysiajs/eden (type-safe) |
| PWA | vite-plugin-pwa, Workbox |
| AI | Google Gemini (quote classification) |

## Weather-to-Tone Mapping

| Weather Codes | Condition | Tone Category |
|---------------|-----------|----------------|
| 0, 1, 2 | Clear, Sunny | Energy & Action |
| 3 | Partly Cloudy | Patience & Perseverance |
| 45, 48 | Fog | Clarity & Focus |
| 51-67, 80-82 | Drizzle, Rain | Resilience & Growth |
| 71-77, 85-86 | Snow | Rest & Renewal |
| 95-99 | Thunderstorm | Courage & Strength |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/daily-quote` | GET | Get primary daily quote (weather-aware) |
| `/api/quote/bonus` | POST | Get bonus quote (different from primary) |
| `/api/quote/history` | GET | Get quote history |
| `/api/subscribe` | POST | Register push subscription |
| `/api/unsubscribe` | POST | Unregister push subscription |
| `/api/preferences` | GET/POST | Get/set user preferences |

## Development Commands

```bash
# Start development (both apps)
pnpm run dev              # web:3001 + server:3000
pnpm run dev:web         # Frontend only
pnpm run dev:server      # Backend only

# Build
pnpm run build           # Build server
pnpm run check-types     # TypeScript check

# Database
pnpm run db:push         # Push schema
pnpm run db:generate     # Generate client
pnpm run db:studio       # Open Drizzle Studio

# Seeding
pnpm run seed:quotes     # Classify & seed from CSV
```

## Environment Setup

**apps/web/.env:**
```
VITE_SERVER_URL=http://localhost:3000
```

**apps/server/.env:**
```
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db
GEMINI_API_KEY=...
```

## PWA Features

- Offline-capable via Workbox caching
- Installable as standalone app
- Background sync for notifications
- Camera access for AR display mode