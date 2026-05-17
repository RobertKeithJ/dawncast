# ────────────────────────────────────────────────────────────────────────────────
# Stage 1 — Install dependencies
# ────────────────────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy only the manifest files that affect dependency resolution.
# Layer-cache is preserved as long as these files don't change.
# Copy both lockfile formats — bun.lock (text, >=1.2) and bun.lockb (binary, <1.2)
COPY package.json bun.lock* bun.lockb* ./

COPY apps/server/package.json           ./apps/server/
COPY packages/db/package.json           ./packages/db/
COPY packages/env/package.json          ./packages/env/
COPY packages/config/package.json       ./packages/config/

# Install all workspace deps.
# The server workspace packages (db, env, config) are resolved via workspace:
# protocol — a full workspace install is required so Bun links them correctly.
RUN bun install --frozen-lockfile || bun install

# ────────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production runner
# ────────────────────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

# Re-use installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only the source packages the server actually needs at runtime.
# Intentionally excludes apps/web and packages/ui (frontend-only).
COPY tsconfig.json                       ./
COPY apps/server                         ./apps/server
COPY packages/db                         ./packages/db
COPY packages/env                        ./packages/env
COPY packages/config                     ./packages/config

# Railway injects PORT; default to 3000 for local Docker runs.
ENV NODE_ENV=production
EXPOSE 3000

RUN bun run build

CMD ["bun", "run", "dist/index.mjs"]
