# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma/
COPY backend/ .

RUN npx prisma generate
RUN npm run build

# Dependencies Stage (Pruned)
FROM node:22-slim AS deps
WORKDIR /app
COPY backend/package*.json ./
# Install ONLY production dependencies
RUN npm ci --omit=dev

# Production Stage
FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD [  "npm", "run", "start:prod" ]
