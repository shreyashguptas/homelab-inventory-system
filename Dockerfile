# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install Tailscale and required tools
RUN apk add --no-cache \
    tailscale \
    iptables \
    ip6tables \
    iproute2 \
    ca-certificates \
    supervisor \
    wget

# Create directories
RUN mkdir -p /var/run/tailscale /var/lib/tailscale /app/data /var/log/supervisor

# Copy standalone build from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy source for database initialization
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/src/lib/utils ./src/lib/utils

# Copy MCP server source and build it
COPY --from=builder /app/mcp-server ./mcp-server
RUN cd mcp-server && npm install && npm run build

# Copy entrypoint and supervisor config
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN chmod +x /entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port (internal, Tailscale will handle external access)
EXPOSE 3000

# Volume for persistent data
VOLUME ["/app/data", "/var/lib/tailscale"]

ENTRYPOINT ["/entrypoint.sh"]
