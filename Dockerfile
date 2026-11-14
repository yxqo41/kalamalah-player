FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN bun install --frozen-lockfile --ignore-scripts || bun install --ignore-scripts

COPY . .
RUN bun run build:client

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "start"]
