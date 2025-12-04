# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for canvas (native module) and OpenSSL for Prisma
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
# Use npm ci if package-lock.json exists, otherwise use npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies for canvas and OpenSSL for Prisma
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
# Use npm ci if package-lock.json exists, otherwise use npm install
# Note: canvas will be copied from builder stage, so we skip its install script
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --ignore-scripts; \
    else \
      npm install --only=production --ignore-scripts; \
    fi

# Copy built application and Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copy compiled canvas module (native binary) from builder (overwrites failed install)
COPY --from=builder /app/node_modules/canvas ./node_modules/canvas

# Create non-root user
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

USER nestjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]

