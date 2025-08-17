# Docker Build Fixes for DMT Risk Assessment Platform

## 🐛 Issue Description

The Docker build fails with npm dependency resolution conflicts, specifically between Cloudflare Workers packages and Node.js packages:

```
npm error ERESOLVE could not resolve
npm error While resolving: wrangler@4.29.1
npm error Found: @cloudflare/workers-types@4.20250705.0
```

## 🛠️ Solution Options

### Option 1: Use Docker-Specific Package.json (Recommended)

The main issue is that the original `package.json` includes both Cloudflare Workers dependencies (for cloud deployment) AND Node.js dependencies (for Docker deployment), which have conflicting peer dependencies.

#### Fixed Dockerfile:
```dockerfile
# Copy Docker-specific package file instead of original
COPY package.docker.json package.json

# Install only production dependencies needed for Docker
RUN npm install --production && npm cache clean --force
```

#### Benefits:
- ✅ Clean separation of dependencies
- ✅ Faster build times
- ✅ No dependency conflicts
- ✅ Smaller image size

### Option 2: Use Legacy Peer Deps Flag

If you prefer to use the original package.json:

```dockerfile
# Install with legacy peer deps to bypass conflicts
RUN npm install --production --legacy-peer-deps && npm cache clean --force
```

### Option 3: Use Alternative Simple Dockerfile

Use `Dockerfile.simple` which manually installs dependencies:

```bash
# Build with simple Dockerfile
docker build -f Dockerfile.simple -t dmt-risk-assessment .
```

## 🚀 Quick Fix Commands

### Method 1: Use Fixed Docker Files (Recommended)
```bash
# The repository now includes fixed Docker files
git pull origin main
cd GRC
docker-compose up -d
```

### Method 2: Manual Fix
```bash
# If you encounter the error, apply this fix:
cd GRC

# Replace the problematic line in Dockerfile
sed -i 's/COPY package\*\.json \.\//COPY package.docker.json package.json/' Dockerfile
sed -i 's/npm ci --omit=dev --legacy-peer-deps/npm install --production/' Dockerfile

# Build with fixed Dockerfile
docker build -t dmt-risk-assessment .
```

### Method 3: Force with Legacy Peer Deps
```bash
# Edit Dockerfile to use legacy peer deps
sed -i 's/npm ci --only=production/npm install --production --legacy-peer-deps/' Dockerfile
docker build -t dmt-risk-assessment .
```

## 📋 Verification Steps

After applying the fix:

```bash
# 1. Build the Docker image
docker build -t dmt-risk-assessment .

# 2. Run the container
docker run -d -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/logs:/app/logs \
  --name dmt-risk-app \
  dmt-risk-assessment

# 3. Check container is running
docker ps

# 4. Test health endpoint
curl http://localhost:3000/health

# 5. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "demo123"}'
```

## 🔧 Alternative: Docker Compose with Build Fix

Update your docker-compose.yml to use the fixed build:

```yaml
version: '3.8'

services:
  dmt-risk-app:
    build:
      context: .
      dockerfile: Dockerfile  # Uses the fixed Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
    volumes:
      - ./database:/app/database
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🎯 Root Cause Analysis

The issue occurs because:

1. **Mixed Dependencies**: The package.json contains both Cloudflare Workers and Node.js dependencies
2. **Peer Dependency Conflicts**: Wrangler requires newer @cloudflare/workers-types than specified
3. **Production vs Dev**: Docker production build tries to install dev dependencies

## 💡 Prevention

For future development:

1. **Separate Concerns**: Keep Cloudflare and Docker dependencies separate
2. **Use .dockerignore**: Exclude unnecessary files from Docker context
3. **Multi-stage Builds**: Consider using multi-stage Dockerfile for complex projects
4. **Lock Versions**: Use exact versions in package-lock.json

## 📞 Still Having Issues?

If you continue to experience problems:

1. **Clear Docker Cache**:
   ```bash
   docker system prune -a
   docker volume prune
   ```

2. **Use Simple Build**:
   ```bash
   docker build -f Dockerfile.simple -t dmt-risk-assessment .
   ```

3. **Check Logs**:
   ```bash
   docker logs dmt-risk-app
   ```

4. **Manual Dependency Installation**:
   ```bash
   # Inside container
   docker exec -it dmt-risk-app sh
   npm list  # Check installed packages
   ```

The Docker build should now work successfully with these fixes! 🚀