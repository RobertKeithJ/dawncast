# Dawncast

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

    subgraph External["External APIs (no API key required)"]
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
dawncast/
├── apps/
│   ├── web/                    # React + Vite frontend (port 3001)
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── routes/         # TanStack Router routes
│   │   │   ├── lib/            # API client, storage, utils
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   └── index.css       # Global styles + CSS vars
│   │   └── vite.config.ts      # Vite + PWA config
│   │
│   └── server/                 # Elysia + Bun backend (port 3000)
│       ├── src/
│       │   ├── index.ts        # API routes
│       │   ├── services/       # Business logic
│       │   ├── functions.ts    # Utilities
│       │   ├── constants.ts    # API URLs, defaults
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
| UI Components | shadcn/ui (Base UI + Radix primitives) |
| Toast | Sonner (Emil Kowalski) |
| AI | Google Gemini (quote classification — optional) |

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
| `/` | GET | Health check |

## PWA Features

- Offline-capable via Workbox caching
- Installable as standalone app (PWA install prompt via Sonner toast)
- iOS Safari hint toast with share button disambiguation
- In-app browser detection ("Open in Safari" notice)
- Camera access for AR display mode (simulated AR overlay)
- Custom install prompt with permanent snooze / 3-dismiss permanent suppression

## Development Commands

```bash
# Install dependencies
bun install

# Start development (both apps)
bun run dev              # web:3001 + server:3000
bun run dev:web         # Frontend only
bun run dev:server      # Backend only

# Build
bun run build           # Build server
bun run check-types     # TypeScript check

# Database
bun run db:push         # Push schema
bun run db:generate     # Generate client
bun run db:studio       # Open Drizzle Studio

# Seeding (requires GEMINI_API_KEY)
bun run seed:quotes
```

## Environment Setup

**apps/web/.env:**
```
VITE_SERVER_URL=http://localhost:3000
```

**apps/server/.env:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
# GEMINI_API_KEY=... (only for seeding)
```

Copy `.env.example` files for each app as a starting point.