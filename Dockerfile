FROM oven/bun:1 AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Dummy values so the env validator doesn't fail at build time
# Real values are injected at runtime via docker-compose environment
ENV DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder
ENV ORIGIN=http://localhost:3000
ENV BETTER_AUTH_SECRET=placeholder
ENV RESEND_API_KEY=re_placeholder

RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts

EXPOSE ${PORT:-3000}
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Run pending migrations before starting the app; abort boot if they fail
CMD ["sh", "-c", "bun run ./scripts/migrate.ts && bun ./build/index.js"]
