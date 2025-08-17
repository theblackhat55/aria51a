# DMT Risk Assessment System - Docker Configuration
# Ubuntu-based Node.js deployment

FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/database /app/uploads && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/database/dmt.sqlite
ENV JWT_SECRET=secure-jwt-secret-change-in-production
ENV API_RATE_LIMIT=100
ENV SESSION_TIMEOUT=86400

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "run", "start:docker"]