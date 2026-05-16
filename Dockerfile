FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/ui/package.json packages/ui/

COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/

RUN bun add -g pnpm@10 && pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter server build

EXPOSE 3000

CMD ["pnpm", "--filter", "server", "start"]