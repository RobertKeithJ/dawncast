# Implementation Instructions for Agent: AR Daily Motivational Quotes
This document is the execution guide to fully implement the functionality described in `ar-motivational-quotes.feature.md` and harden the codebase to production quality.

## 1) Mission
Implement the app so that all major behaviors in `ar-motivational-quotes.feature.md` are functionally present, testable, and reliable in production.

Do this in small, reviewable PR-sized increments, but keep architecture coherent across backend, frontend, data, PWA, and notifications.

## 2) Current baseline (what already exists)
- Monorepo with `apps/web`, `apps/server`, `packages/db`, `packages/env`, `packages/ui`
- Basic weather fetch + weather-to-tone mapping
- Basic quote retrieval + fallback
- Basic AR simulation via camera overlay (`getUserMedia`)
- Basic PWA plugin setup and runtime cache configuration
- Basic push subscription endpoint and client prompt

## 3) Non-negotiable implementation rules
1. Do not use mock push subscription data in production code paths.
2. Do not hardcode API base URLs in frontend code.
3. Do not add new `any` usage; keep strict typing.
4. Do not silently swallow errors that affect user-critical behavior.
5. Add tests for each new behavior; avoid untested feature additions.
6. Preserve backward compatibility for existing route contracts when possible.
7. Prefer explicit domain functions/services over embedding all logic in route handlers/components.

## 4) Required outcomes (high level)
By completion, the app must support:
- Weather detection and manual location fallback
- Robust weather-conditioned quote selection
- Daily primary quote behavior with rollover, bonus quotes, and history
- PWA install + meaningful offline behavior
- Real push subscription and scheduling path (no placeholders)
- Share flow with native and fallback paths
- User preferences persistence (including language/tone/unit/theme)
- Accessibility-critical behavior and keyboard support
- Graceful error handling and recoverability
- Automated test coverage for core behavior

## 5) Sequence of implementation (must follow this order)

## Phase 0 — Foundation and guardrails
### Tasks
- Add linting and formatting standards (ESLint + optional Prettier/Biome).
- Add test tooling:
  - Unit/integration: Vitest
  - Component/UI: Testing Library
  - E2E: Playwright
- Add scripts to root/workspaces for `lint`, `test`, `test:e2e`.
- Fix frontend API client to use environment variable from `packages/env/src/web.ts` instead of hardcoded `http://localhost:3000`:
  - Update `apps/web/src/lib/api.ts`
- Address CSS import-order warning by moving Google Fonts import ahead of generated CSS rules:
  - `packages/ui/src/styles/globals.css`
  - `packages/ui/src/styles/dawncast-theme.css`

### Acceptance criteria
- `pnpm run check-types` passes.
- `pnpm run lint` passes.
- `pnpm run test` runs and passes baseline tests.
- No build warnings about invalid CSS `@import` ordering.

## Phase 1 — Domain model and persistence correctness
### Tasks
- Review/adjust DB schema to support all spec behavior:
  - quote history and 30-day dedupe (`delivery_log`)
  - weather cache TTL and lookups (`weather_cache`)
  - notification preferences/schedule (`push_subscriptions`)
  - language selection and fallback behavior (`quotes.language`)
- Add missing indexes/constraints for performance and correctness:
  - Index by `tone_category_id`, `language`, `is_active` on quotes
  - Index by `(subscription_id, served_date)` on delivery_log
  - Index weather cache by location rounding and `expires_at`
- Add migration(s) for any schema changes.
- Seed `tone_categories` and a real quote set per tone/language.

### Acceptance criteria
- Migrations run cleanly on empty and existing DB.
- Query plans are acceptable for core endpoints (no full-table scans on hot paths).
- Seeded DB can satisfy all tone categories without third-party quote fallback.

## Phase 2 — Backend service refactor and API contracts
### Tasks
- Refactor `apps/server/src/index.ts` into service modules (example split):
  - `weather-service.ts`
  - `quote-service.ts`
  - `daily-quote-service.ts`
  - `notification-service.ts`
- Keep route handlers thin; move business logic into services.
- Implement deterministic daily quote logic:
  - One primary quote per local date
  - Return same primary quote on repeat opens that day
  - Bonus quote generation that does not replace primary
  - Midnight rollover behavior
  - 30-day no-repeat rule with pool reset when exhausted
- Implement weather cache read-through/write-through with 60-minute validity.
- Implement unknown-weather fallback with structured logging/metrics.
- Replace `ORDER BY RANDOM()` selection with scalable selection strategy.

### API endpoints to support
- `GET /api/daily-quote` (with geolocation/city and user context)
- `POST /api/quote/bonus`
- `GET /api/quote/history`
- `POST /api/preferences`
- `GET /api/preferences`
- `POST /api/subscribe`
- `POST /api/unsubscribe` (or equivalent deactivation endpoint)

### Acceptance criteria
- API contracts are fully typed and validated.
- Returning users receive stable daily quote behavior.
- History endpoint includes quote text, author, date, and weather condition.
- Unknown weather code path falls back to general motivation and logs once per event.

## Phase 3 — Frontend behavior parity with feature spec
### Tasks
- Implement durable client state flow for:
  - geolocation success/failure
  - manual city fallback
  - loading/error/empty states
- Implement daily quote UX semantics:
  - “Your quote for today” label for primary quote
  - “Bonus Quote” label for manual additional quotes
  - quote history UI route/page
- Implement weather refresh behavior when stale (>60 minutes).
- Ensure time/date display consistency and locale-safe formatting.
- Add share flow parity:
  - Web Share API path
  - Fallback modal with copy + social links
- Improve AR mode:
  - capability detection (WebXR vs simulated AR)
  - explicit simulated badge
  - clean camera lifecycle stop/start on route/background changes

### Acceptance criteria
- UI behavior matches intended scenarios for weather, quote retrieval, and fallback paths.
- No dead-end UI states.
- AR mode always exits cleanly and releases camera tracks.

## Phase 4 — PWA and offline reliability
### Tasks
- Finalize service worker caching strategy for:
  - daily quote payload
  - weather payload
  - app shell/static assets
- Implement offline handling states:
  - cached quote available
  - no cached quote available
- Add stale-while-revalidate logic for daily quote with proper UX hints.
- Implement install prompt logic with cooldown persistence.
- Implement background sync only where browser support allows; add fallback behavior where unsupported.

### Acceptance criteria
- Installed app launches in standalone mode.
- Offline open with cached quote shows usable experience.
- Offline first-open shows friendly fallback state with retry.

## Phase 5 — Push notifications (production-capable)
### Tasks
- Integrate real VAPID key-based push subscription flow.
- Remove all mock endpoint/key placeholders from client and server.
- Persist schedule/timezone updates and active state.
- Implement unsubscribe/deactivation flow.
- Implement foreground notification behavior (in-app toast) and background push click handling.

### Acceptance criteria
- Successful real subscription end-to-end.
- Notification preference changes persist and affect scheduling.
- No notification sent to deactivated subscriptions.

## Phase 6 — Preferences, accessibility, and i18n
### Tasks
- Add preferences screen and storage for:
  - tone weighting
  - dark mode
  - temperature unit
  - language
  - notification time
- Implement language-aware quote selection with fallback behavior if translation unavailable.
- Accessibility implementation:
  - `aria-live` quote announcements
  - keyboard navigation and visible focus states
  - minimum touch targets
  - reduced-motion compliance checks
  - contrast checks in AR overlays and standard view

### Acceptance criteria
- Preferences persist across sessions/devices (as designed).
- Screen reader and keyboard-only flows are functional.
- WCAG AA contrast goals are met for core quote and controls.

## Phase 7 — Error handling and observability
### Tasks
- Standardize typed error responses from API.
- Add retry strategy where specified (weather API, quote API fallback behavior).
- Add structured logging with event names for:
  - weather fetch failures
  - unknown weather codes
  - quote fallback usage
  - notification subscription failures
- Ensure local storage corruption is detected and recovered safely.

### Acceptance criteria
- User-facing failures are graceful and actionable.
- Logs are sufficient to diagnose failures in production.

## Phase 8 — BDD alignment and test coverage closure
### Tasks
- Convert executable scenarios into real `.feature` files (not Markdown code fences) for automated BDD where applicable.
- Correct invalid Gherkin constructs:
  - Convert `Scenario + Examples` into `Scenario Outline + Examples`.
- Add test matrix:
  - Unit tests for weather-to-tone mapping and daily quote selection
  - Integration tests for server endpoints and DB interactions
  - E2E tests for geolocation fallback, daily quote repeat behavior, share, offline, and AR simulation path

### Acceptance criteria
- Core scenarios from the feature spec are executable and passing.
- CI pipeline enforces typecheck, lint, unit/integration, and key e2e tests.

## 6) File-level guidance (starting points)
- Backend:
  - `apps/server/src/index.ts`
  - `apps/server/src/functions.ts`
  - `apps/server/src/constants.ts`
- Frontend:
  - `apps/web/src/routes/index.tsx`
  - `apps/web/src/components/header.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/web/vite.config.ts`
- Database:
  - `packages/db/src/schema/quotes.ts`
  - `packages/db/src/schema/delivery-log.ts`
  - `packages/db/src/schema/weather.ts`
  - `packages/db/src/schema/subscriptions.ts`
  - `packages/db/src/migrations/*`
- Env/config:
  - `packages/env/src/server.ts`
  - `packages/env/src/web.ts`

## 7) Performance and reliability constraints
- Avoid expensive random selection queries on large quote tables.
- Use cache TTL and selective invalidation; avoid redundant weather API calls.
- Keep mobile-first render path fast and avoid blocking camera initialization on unrelated network calls.
- Avoid large client bundles when adding AR/push/offline features; code-split heavy UI paths.

## 8) Definition of done
All items below must be true:
1. Major scenarios in `ar-motivational-quotes.feature.md` are implemented or explicitly deferred with rationale.
2. No mock push logic remains.
3. No hardcoded frontend API URL remains.
4. Typecheck, lint, tests, and build pass.
5. Offline/PWA and daily quote behavior are verified through automated tests plus manual smoke checks.
6. Accessibility checks pass for key screens and interactions.
7. A final implementation report is produced with:
   - completed scenarios
   - deferred scenarios
   - known limitations
   - follow-up recommendations

## 9) Suggested PR slicing
1. Tooling + guardrails (lint/test/env-url/css warning)
2. DB migrations + seed + domain services
3. Daily quote + history backend APIs
4. Frontend daily/history/share/weather refresh
5. PWA/offline hardening
6. Real push implementation
7. Preferences + accessibility + i18n
8. BDD test conversion and coverage closure

---
If trade-offs are required, prioritize in this order:
1) Daily quote correctness, 2) reliability/error handling, 3) PWA/offline behavior, 4) notifications, 5) advanced AR features.
