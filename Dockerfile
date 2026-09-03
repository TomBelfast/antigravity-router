# Multi-stage build for optimal image size and security
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3321
ENV HOST=0.0.0.0
ENV CONFIG_DIR=/data
ENV ACCOUNTS_FILE=/data/accounts.json

# Install curl for healthcheck
RUN apk add --no-cache curl

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create mount directory for accounts configuration
RUN mkdir -p /data /root/.config/antigravity-cursor-proxy && chmod 777 /data

EXPOSE 3321

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:3321/health || exit 1

CMD ["node", "dist/server.js"]
