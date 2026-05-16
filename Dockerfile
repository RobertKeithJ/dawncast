FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter server build

EXPOSE 3000

CMD ["bun", "run", "start"]