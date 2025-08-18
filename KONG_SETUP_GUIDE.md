# Kong Gateway Setup Guide for Risk Management Platform

## Overview

This guide walks you through replacing your basic API middleware with **Kong Gateway Community Edition** - an enterprise-grade, open-source API management solution that's perfect for Ubuntu/Docker environments.

## Why Kong Gateway?

### Current Limitations ❌
- Basic in-memory rate limiting (not distributed)
- No API analytics or monitoring
- Limited security features
- No request/response transformation
- No API versioning management
- No circuit breaker patterns

### Kong Benefits ✅
- **Enterprise-grade features**: Rate limiting, JWT validation, CORS, transformations
- **High performance**: C-based core with Lua plugins
- **Distributed architecture**: Redis-backed, scalable across multiple instances
- **Rich plugin ecosystem**: 250+ plugins available
- **Excellent Docker support**: Production-ready containers
- **Active community**: 30k+ GitHub stars, extensive documentation
- **Hybrid deployment**: Works with cloud, on-premise, or hybrid setups

## Prerequisites

- Ubuntu 18.04+ or compatible Linux distribution
- Docker 20.10+ installed
- Docker Compose 1.29+ installed
- 4GB+ RAM recommended
- Network access to pull Docker images

## Quick Setup (5 minutes)

```bash
# 1. Navigate to your project directory
cd /home/user/webapp

# 2. Run the Kong setup script
./kong-setup/setup-kong.sh

# 3. Verify Kong is running
curl http://localhost:8001/status

# 4. Access Kong Manager UI
open http://localhost:8002
```

## Manual Setup Steps

### 1. Start Kong Gateway Stack

```bash
cd kong-setup
docker-compose up -d
```

This starts:
- **PostgreSQL**: Kong's database
- **Kong Gateway**: The API gateway (port 8000)
- **Kong Admin API**: Management interface (port 8001)
- **Konga UI**: Web-based management (port 8002)
- **Redis**: For distributed rate limiting and caching

### 2. Apply Kong Configuration

```bash
# Using Kong Admin API
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d @kong-service-config.json

# Or using deck (Kong's config management tool)
deck sync --kong-addr http://localhost:8001 --state kong-config.yml
```

### 3. Configure Your Application

Update your `src/index.tsx` to use Kong-enhanced API:

```typescript
// Replace current API import
import { createAPI } from './api';

// With Kong-enhanced version
import { createKongEnhancedAPI } from './api-kong-enhanced';

// In your app setup
const api = createKongEnhancedAPI();
app.route('/', api);
```

## Kong Features Configuration

### 1. Authentication (JWT Plugin)

```bash
# Enable JWT plugin on API routes
curl -X POST http://localhost:8001/routes/api-routes/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "jwt",
    "config": {
      "header_names": ["authorization"],
      "claims_to_verify": ["exp", "nbf"]
    }
  }'
```

### 2. Rate Limiting (Distributed)

```bash
# Configure distributed rate limiting with Redis
curl -X POST http://localhost:8001/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rate-limiting",
    "config": {
      "minute": 100,
      "hour": 1000,
      "policy": "redis",
      "redis_host": "kong-redis"
    }
  }'
```

### 3. CORS Configuration

```bash
# Enable CORS for your domain
curl -X POST http://localhost:8001/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cors",
    "config": {
      "origins": ["http://localhost:3000", "https://your-domain.com"],
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "credentials": true
    }
  }'
```

### 4. Security Headers

```bash
# Add security headers automatically
curl -X POST http://localhost:8001/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "response-transformer",
    "config": {
      "add": {
        "headers": [
          "X-Content-Type-Options:nosniff",
          "X-Frame-Options:DENY",
          "Strict-Transport-Security:max-age=31536000"
        ]
      }
    }
  }'
```

## Monitoring & Analytics

### 1. Kong Manager Dashboard
- Access: http://localhost:8002
- Features: Service health, traffic analytics, plugin management

### 2. Request Logging
Kong automatically logs all requests. View logs with:
```bash
docker-compose logs -f kong-gateway
```

### 3. Metrics Endpoint
Your application now includes a metrics endpoint:
```bash
curl -H "Authorization: Bearer your-admin-token" \
  http://localhost:8000/api/kong/metrics
```

## Advanced Features

### 1. Custom Plugins
Create custom Lua plugins for specialized functionality:

```lua
-- /usr/local/share/lua/5.1/kong/plugins/risk-audit/handler.lua
local plugin = {
  PRIORITY = 1000,
  VERSION = "0.1.0",
}

function plugin:access(plugin_conf)
  -- Custom risk audit logic
  kong.log.info("Risk API accessed by: " .. kong.client.get_ip())
end

return plugin
```

### 2. Circuit Breaker Pattern
```bash
# Add circuit breaker for upstream health
curl -X POST http://localhost:8001/plugins \
  -d "name=request-termination" \
  -d "config.status_code=503" \
  -d "config.message=Service temporarily unavailable"
```

### 3. Request/Response Transformation
```bash
# Transform requests automatically
curl -X POST http://localhost:8001/plugins \
  -d "name=request-transformer" \
  -d "config.add.headers=X-API-Version:v2.0"
```

## Performance Optimization

### 1. Enable Caching
```bash
# Cache API responses for 5 minutes
curl -X POST http://localhost:8001/plugins \
  -d "name=proxy-cache" \
  -d "config.response_code=200" \
  -d "config.ttl=300"
```

### 2. Load Balancing
```bash
# Add multiple upstream targets
curl -X POST http://localhost:8001/upstreams \
  -d "name=risk-management-upstream"

curl -X POST http://localhost:8001/upstreams/risk-management-upstream/targets \
  -d "target=risk-app-1:3000"

curl -X POST http://localhost:8001/upstreams/risk-management-upstream/targets \
  -d "target=risk-app-2:3000"
```

## Production Deployment

### 1. SSL/TLS Configuration
```bash
# Add SSL certificate
curl -X POST http://localhost:8001/certificates \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem"
```

### 2. Database Backup
```bash
# Backup Kong configuration
docker-compose exec kong-database pg_dump -U kong kong > kong-backup.sql
```

### 3. Health Checks
```bash
# Configure upstream health checks
curl -X POST http://localhost:8001/upstreams/risk-management-upstream \
  -d "healthchecks.active.healthy.interval=10" \
  -d "healthchecks.active.healthy.http_statuses=200,302"
```

## Migration from Current Setup

### 1. Gradual Migration
1. Deploy Kong alongside current setup
2. Route specific endpoints through Kong
3. Monitor performance and functionality
4. Gradually migrate all endpoints
5. Remove old middleware

### 2. Testing
```bash
# Test Kong-enhanced endpoints
curl -H "Authorization: Bearer test-token" \
  http://localhost:8000/api/risks

# Compare with direct application
curl -H "Authorization: Bearer test-token" \
  http://localhost:3000/api/risks
```

## Troubleshooting

### Common Issues

1. **Kong not starting**
   ```bash
   docker-compose logs kong-gateway
   # Check database connectivity and migrations
   ```

2. **Plugin not working**
   ```bash
   curl http://localhost:8001/plugins
   # Verify plugin is enabled and configured correctly
   ```

3. **Rate limiting not distributed**
   ```bash
   docker-compose logs kong-redis
   # Ensure Redis is accessible
   ```

### Performance Tuning

```bash
# Increase worker processes
KONG_NGINX_WORKER_PROCESSES=4

# Adjust database connections
KONG_PG_MAX_CONCURRENT_QUERIES=20

# Enable keepalive
KONG_UPSTREAM_KEEPALIVE_POOL_SIZE=60
```

## Cost Comparison

| Feature | Current Setup | Kong Community | Enterprise Solutions |
|---------|---------------|----------------|---------------------|
| **Cost** | Free | Free | $1000+/month |
| **Features** | Basic | Enterprise-grade | Full enterprise |
| **Support** | Community | Community | 24/7 Support |
| **Scalability** | Limited | High | Very High |
| **Learning Curve** | Low | Medium | High |

## Next Steps

1. **Deploy Kong** using the provided Docker Compose setup
2. **Migrate gradually** by routing specific endpoints through Kong
3. **Monitor performance** and adjust configurations as needed
4. **Explore plugins** to add advanced functionality
5. **Plan production deployment** with SSL, backups, and monitoring

## Resources

- **Kong Documentation**: https://docs.konghq.com/
- **Plugin Hub**: https://docs.konghq.com/hub/
- **Community Support**: https://github.com/Kong/kong
- **Best Practices**: https://docs.konghq.com/gateway/latest/production/

---

**Ready to get started?** Run `./kong-setup/setup-kong.sh` to deploy Kong Gateway in 5 minutes!