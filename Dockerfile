# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

ARG DATABASE_URL=mysql://root:password@localhost:3306/br_search_name
ENV DATABASE_URL=${DATABASE_URL}

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

RUN pnpm build

# Final stage
FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated /app/src/generated

EXPOSE 8080

CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start:prod"]
