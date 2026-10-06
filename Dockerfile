# API image (Hono on Bun). Built from the repo root so workspace packages resolve.
FROM oven/bun:1.4.2
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
WORKDIR /app/apps/api
ENV NODE_ENV=production PORT=4021 DB_PATH=/data/simpuru.db
EXPOSE 4021
CMD ["bun", "src/index.ts"]
