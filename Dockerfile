# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force
RUN cd client && npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies)
RUN npm ci --legacy-peer-deps
RUN cd client && npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/client/build ./client/build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copy SSL certificates (if they exist)
COPY --from=builder --chown=nodejs:nodejs /app/ssl ./ssl

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Create data and ssl directories
RUN mkdir -p /app/data /app/ssl && chown -R nodejs:nodejs /app/data /app/ssl

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 5443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5443/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]