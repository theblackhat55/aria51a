# ARIA5.1 Deployment Checklist

## Pre-Deployment Requirements

### 1. Cloudflare Account Setup
- [ ] Cloudflare account with Pages and Workers enabled
- [ ] API token with correct permissions
- [ ] Domain configured (optional)

### 2. Database Setup
```bash
# Create D1 database
npx wrangler d1 create aria51-production

# Update wrangler.jsonc with database ID
# Copy the database_id from create command output
```

### 3. Storage Setup
```bash
# Create KV namespace
npx wrangler kv:namespace create "ARIA51_KV"
npx wrangler kv:namespace create "ARIA51_KV" --preview

# Create R2 bucket
npx wrangler r2 bucket create aria51-storage

# Update wrangler.jsonc with KV IDs
```

### 4. Environment Variables
```bash
# Set production secrets
npx wrangler pages secret put JWT_SECRET --project-name aria51-enterprise
npx wrangler pages secret put OPENAI_API_KEY --project-name aria51-enterprise
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name aria51-enterprise
npx wrangler pages secret put ENCRYPTION_KEY --project-name aria51-enterprise
```

## Deployment Process

### 1. Build and Test Locally
```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Seed development data
npm run db:seed

# Build application
npm run build

# Test locally with full stack
npm run dev:full
```

### 2. Deploy to Staging
```bash
# Apply migrations to production database
npm run db:migrate:prod

# Deploy to staging environment
npm run deploy:staging

# Test staging deployment
curl https://aria51-staging.pages.dev/health
curl https://aria51-staging.pages.dev/api/health
```

### 3. Deploy to Production
```bash
# Final production deployment
npm run deploy:prod

# Verify production
curl https://aria51-enterprise.pages.dev/health
curl https://aria51-enterprise.pages.dev/api/auth/status
```

## Post-Deployment Verification

### 1. Health Checks
- [ ] `/health` endpoint responds with 200
- [ ] `/api/health` endpoint shows all services healthy
- [ ] Database connection working
- [ ] R2 storage accessible
- [ ] KV namespace accessible

### 2. Authentication Flow
- [ ] User registration works
- [ ] Login/logout functions correctly
- [ ] JWT tokens issued properly
- [ ] Session management working

### 3. Core Features
- [ ] Risk management CRUD operations
- [ ] Compliance framework loading
- [ ] Evidence upload to R2
- [ ] Dashboard loading with data
- [ ] WebSocket real-time updates

### 4. Security Checks
- [ ] CORS configured properly
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection protection
- [ ] XSS protection enabled

## Monitoring Setup

### 1. Cloudflare Analytics
- Enable Workers Analytics
- Configure custom metrics
- Set up alerts for errors

### 2. Error Tracking
- Monitor 4xx/5xx responses
- Track database errors
- Monitor AI API failures

### 3. Performance Metrics
- Response time monitoring
- Database query performance
- Memory usage tracking
- Request volume analysis

## Rollback Plan

### 1. Quick Rollback
```bash
# Rollback to previous deployment
wrangler pages deployment list --project-name aria51-enterprise
wrangler pages deployment promote <deployment-id> --project-name aria51-enterprise
```

### 2. Database Rollback
```bash
# Export current database
npm run db:backup

# Restore from backup if needed
wrangler d1 execute aria51-production --file=./backups/db-backup.sql
```

## Maintenance

### 1. Regular Tasks
- [ ] Database backups (weekly)
- [ ] Security updates (monthly)  
- [ ] Performance optimization (quarterly)
- [ ] Compliance report generation (as needed)

### 2. Scaling Considerations
- Monitor request volumes
- Optimize database queries
- Consider CDN for static assets
- Plan for geographic distribution