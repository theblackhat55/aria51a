# DMT Risk Assessment Platform - Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+ installed
- Docker Compose 1.29+ installed
- Keycloak server configured and accessible

### Environment Setup

1. **Copy environment configuration:**
   ```bash
   cp .env.docker .env
   ```

2. **Update Keycloak configuration in `.env`:**
   ```bash
   # Keycloak Configuration
   KEYCLOAK_URL=https://your-keycloak-server.com
   KEYCLOAK_REALM=your-realm
   KEYCLOAK_CLIENT_ID=dmt-risk-assessment
   KEYCLOAK_CLIENT_SECRET=your-client-secret
   
   # Application Configuration
   JWT_SECRET=your-secure-jwt-secret-here
   NODE_ENV=production
   PORT=3000
   DATABASE_PATH=/app/database/dmt.sqlite
   ```

### Deployment Options

## Option 1: Docker Compose (Recommended)

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Option 2: Docker Build Script

```bash
# Build with cleanup and testing
./build-docker.sh --clean --test

# Run manually
docker run -d \
  --name dmt-risk-assessment \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/logs:/app/logs \
  dmt-risk-assessment:ubuntu-latest
```

## Option 3: Manual Docker Commands

```bash
# Build image
docker build -f Dockerfile.ubuntu -t dmt-risk-assessment:ubuntu-latest .

# Run container
docker run -d \
  --name dmt-risk-assessment \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e KEYCLOAK_URL=https://your-keycloak.com \
  -e KEYCLOAK_REALM=your-realm \
  -e KEYCLOAK_CLIENT_ID=dmt-risk-assessment \
  -e KEYCLOAK_CLIENT_SECRET=your-secret \
  -v /path/to/data:/app/database \
  dmt-risk-assessment:ubuntu-latest
```

## 🔧 Docker Build Fix Applied

**Issue Fixed:** The Docker build was failing with npm dependency synchronization errors.

**Root Cause:** 
- The Dockerfile was copying both `package.json` and `package-lock.json`
- Then overwriting `package.json` with `package.docker.json` 
- This caused a mismatch between the new `package.json` and existing `package-lock.json`
- `npm ci` requires exact synchronization between these files

**Solution Applied:**
1. **Modified Dockerfile.ubuntu** to only copy `package.docker.json` as `package.json`
2. **Changed from `npm ci` to `npm install`** to allow fresh dependency resolution
3. **Added cache cleaning** to optimize image size

**Changes Made in Dockerfile.ubuntu:**
```dockerfile
# Before (causing errors):
COPY --chown=dmtuser:dmtuser package*.json ./
COPY --chown=dmtuser:dmtuser package.docker.json ./package.json
RUN npm ci --only=production --no-audit --no-fund

# After (fixed version):
COPY --chown=dmtuser:dmtuser package.docker.json ./package.json
RUN npm install --only=production --no-audit --no-fund \
    && npm cache clean --force
```

## 🔍 Verification Steps

After deployment, verify the system is working:

```bash
# Check container status
docker ps

# Test health endpoint
curl http://localhost:3000/health

# Test main application
curl http://localhost:3000

# Check logs for errors
docker logs dmt-risk-assessment -f

# Test Keycloak authentication flow
curl http://localhost:3000/auth/login
```

## 📊 Container Management

```bash
# View container logs
docker logs dmt-risk-assessment -f

# Access container shell
docker exec -it dmt-risk-assessment bash

# Check application status inside container
docker exec dmt-risk-assessment supervisorctl status

# Restart application service
docker exec dmt-risk-assessment supervisorctl restart dmt-risk-assessment

# View application logs inside container
docker exec dmt-risk-assessment tail -f /app/logs/app.log
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Container                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Supervisor                         │   │
│  │  ┌─────────────────┐  ┌─────────────────────┐   │   │
│  │  │   Node.js App   │  │   Nginx (Optional)  │   │   │
│  │  │   (Port 3000)   │  │   (Port 80/443)     │   │   │
│  │  └─────────────────┘  └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              File System                        │   │
│  │  • /app/database - SQLite database             │   │
│  │  • /app/logs - Application logs                │   │
│  │  • /app/uploads - File uploads                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Keycloak Server   │
                    │  (External Service) │
                    └─────────────────────┘
```

## 🛠️ Troubleshooting

### Build Issues

1. **npm ci synchronization error:**
   - ✅ **Fixed:** Now using `npm install` with `package.docker.json` only

2. **Missing dependencies:**
   ```bash
   # Check if all required files exist
   ls -la package.docker.json Dockerfile.ubuntu .env.docker
   ```

3. **Docker daemon not running:**
   ```bash
   sudo systemctl start docker  # Linux
   # or start Docker Desktop on macOS/Windows
   ```

### Runtime Issues

1. **Keycloak connection failed:**
   - Verify Keycloak URL is accessible
   - Check client ID and secret are correct
   - Ensure redirect URI is configured in Keycloak

2. **Database initialization failed:**
   ```bash
   # Check database directory permissions
   docker exec dmt-risk-assessment ls -la /app/database
   
   # Manually initialize database
   docker exec dmt-risk-assessment node -e "
   const { initializeDatabase } = require('./src/database/sqlite.js');
   initializeDatabase().then(() => console.log('Done'));
   "
   ```

3. **Port conflicts:**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Use different port
   docker run -p 3001:3000 dmt-risk-assessment:ubuntu-latest
   ```

## 🔐 Security Considerations

1. **Environment Variables:**
   - Never commit real secrets to version control
   - Use Docker secrets for production deployments
   - Rotate JWT secrets regularly

2. **Network Security:**
   - Use HTTPS in production
   - Configure proper firewall rules
   - Enable rate limiting

3. **Container Security:**
   - Run as non-root user (dmtuser)
   - Regular security updates
   - Scan images for vulnerabilities

## 📈 Production Deployment

For production environments:

1. **Use Docker Swarm or Kubernetes**
2. **Set up proper logging and monitoring**
3. **Configure SSL/TLS certificates**
4. **Set up backup strategies for database**
5. **Implement health checks and auto-restart**
6. **Use environment-specific configurations**

## 🔄 Updates and Maintenance

```bash
# Update to latest version
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Backup database before updates
docker exec dmt-risk-assessment cp /app/database/dmt.sqlite /app/backups/dmt-$(date +%Y%m%d).sqlite
```

---

**Next Steps:**
1. Update your Keycloak configuration with correct URLs and secrets
2. Run the Docker build using the fixed Dockerfile
3. Test the complete authentication flow
4. Deploy to your production environment