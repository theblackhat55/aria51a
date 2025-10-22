# ARIA51 Production Deployment Guide

## 🚀 Complete Production Deployment with Database Structure

This guide provides step-by-step instructions for deploying the ARIA51 Enterprise Security Intelligence Platform to production with full database structure.

---

## 📋 Pre-Deployment Checklist

### Required Resources
- ✅ Cloudflare Account (Free tier sufficient for testing)
- ✅ GitHub Repository: https://github.com/theblackhat55/ARIA5-HTMX.git
- ✅ Node.js 18+ installed
- ✅ Wrangler CLI configured
- ✅ Project built successfully (dist/ directory created)

### Project Information
- **Project Name**: aria51
- **Database**: aria51-production
- **Database ID**: 8c465a3b-7e5a-4f39-9237-ff56b8e644d0
- **Current Deployment**: https://aria51.pages.dev
- **Production Status**: ✅ ACTIVE

---

## 🔐 Step 1: Cloudflare Authentication

### Option A: Interactive Login (Recommended for Local Development)
```bash
cd /home/user/webapp
wrangler login
```
This will open a browser window for OAuth authentication.

### Option B: API Token (Recommended for CI/CD and Automation)

1. **Create API Token**:
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template or create custom with:
     - Account → D1 → Edit
     - Account → Pages → Edit
     - Account → Workers Scripts → Edit

2. **Set Environment Variable**:
```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

3. **Verify Authentication**:
```bash
wrangler whoami
```

---

## 🗄️ Step 2: Database Setup and Migration

### 2.1 Verify Database Connection

```bash
# List all D1 databases
wrangler d1 list

# Check current database
wrangler d1 info aria51-production
```

### 2.2 Apply Database Migrations

The project includes comprehensive database migrations in `/migrations/`:

```bash
# Apply all migrations to production database
wrangler d1 migrations apply aria51-production --remote

# Confirm migration status
wrangler d1 migrations list aria51-production --remote
```

**Migration Files**:
1. `0001_complete_schema.sql` - Core database schema (80+ tables)
2. `0113_api_management.sql` - API management and monitoring tables

### 2.3 Verify Database Schema

```bash
# Check database schema
wrangler d1 execute aria51-production --remote --command=".schema"

# Count tables
wrangler d1 execute aria51-production --remote --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';"

# Verify critical tables exist
wrangler d1 execute aria51-production --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### 2.4 Seed Production Data (Optional)

If you need to populate initial data:

```bash
# Check if users exist
wrangler d1 execute aria51-production --remote --command="SELECT COUNT(*) FROM users;"

# Check if risks exist
wrangler d1 execute aria51-production --remote --command="SELECT COUNT(*) FROM risks;"

# If needed, run seed script
wrangler d1 execute aria51-production --remote --file=./seed-production.sql
```

---

## 🔨 Step 3: Build Production Application

```bash
cd /home/user/webapp

# Clean previous build
rm -rf dist/

# Build for production
npm run build

# Verify build output
ls -lh dist/
```

**Expected Output**:
- `dist/_worker.js` - Main application bundle (1.8+ MB)
- `dist/_worker.js.map` - Source map for debugging
- Build should complete in ~2-5 seconds

---

## 🚀 Step 4: Deploy to Cloudflare Pages

### 4.1 Deploy Application

```bash
# Deploy to production (aria51 project)
wrangler pages deploy dist --project-name aria51

# Or use npm script
npm run deploy
```

### 4.2 Deployment Output

You should see:
```
✨ Success! Uploaded X files (Y.YY sec)
✨ Deployment complete! Take a peek over at https://xxxxxxxx.aria51.pages.dev
```

### 4.3 Configure Custom Domain (Optional)

```bash
# Add custom domain through dashboard or CLI
wrangler pages domains add aria51 yourdomain.com
```

---

## ✅ Step 5: Post-Deployment Verification

### 5.1 Health Check

```bash
# Test health endpoint
curl https://aria51.pages.dev/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"..."}
```

### 5.2 Database Connectivity Test

```bash
# Query production database through API
curl https://aria51.pages.dev/api/health/db

# Or test directly
wrangler d1 execute aria51-production --remote --command="SELECT COUNT(*) as risk_count FROM risks;"
```

### 5.3 Authentication Test

Test with demo credentials:
- **Admin**: admin / demo123
- **Risk Manager**: avi_security / demo123
- **Compliance Officer**: sarah_compliance / demo123

```bash
# Test login endpoint
curl -X POST https://aria51.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo123"}'
```

### 5.4 Full Application Test

Visit in browser:
1. **Main Dashboard**: https://aria51.pages.dev/
2. **Risk Management**: https://aria51.pages.dev/risk
3. **Operations Center**: https://aria51.pages.dev/operations
4. **MS Defender**: https://aria51.pages.dev/ms-defender
5. **AI Assistant**: https://aria51.pages.dev/ai

---

## 📊 Database Structure Overview

### Core Tables (80+ total)

**Authentication & Users**:
- `users` - User accounts and profiles
- `organizations` - Organization management
- `audit_logs` - Security audit trail

**Risk Management**:
- `risks` - Risk assessments (8 production risks)
- `risk_treatments` - Risk mitigation strategies
- `kris` - Key Risk Indicators

**Compliance**:
- `compliance_frameworks` - Regulatory frameworks
- `framework_controls` - Control requirements
- `soa` - Statement of Applicability
- `compliance_assessments` - Assessment tracking
- `evidence` - Evidence repository

**Operations**:
- `assets` - IT asset inventory
- `incidents` - Security incidents
- `defender_assets` - MS Defender integration
- `defender_incidents` - Defender incidents
- `defender_vulnerabilities` - Vulnerability tracking

**AI & Analytics**:
- `ai_configurations` - AI provider settings
- `chat_history` - Conversation logs
- `rag_documents` - RAG document storage
- `document_chunks` - Vector embeddings

**API Management**:
- `api_endpoints` - API endpoint registry
- `api_request_logs` - Request monitoring
- `api_health_checks` - Health monitoring

**Reporting**:
- `reports` - Generated reports
- `notifications` - Alert system

---

## 🔧 Troubleshooting

### Issue: "Database not found"
```bash
# Verify database binding in wrangler.jsonc
cat wrangler.jsonc | grep -A5 d1_databases

# Expected:
# "database_name": "aria51-production"
# "database_id": "8c465a3b-7e5a-4f39-9237-ff56b8e644d0"
```

### Issue: "Migrations failed"
```bash
# Check migration status
wrangler d1 migrations list aria51-production --remote

# Force apply specific migration
wrangler d1 migrations apply aria51-production --remote --migration-file=0001_complete_schema.sql
```

### Issue: "Authentication failed"
```bash
# Re-authenticate
wrangler logout
wrangler login

# Or refresh API token
export CLOUDFLARE_API_TOKEN="new-token"
```

### Issue: "Build errors"
```bash
# Clear cache and rebuild
rm -rf node_modules/ dist/ .wrangler/
npm install
npm run build
```

### Issue: "500 errors after deployment"
```bash
# Check logs
wrangler pages deployment tail aria51

# Check database connection
wrangler d1 execute aria51-production --remote --command="SELECT 1;"
```

---

## 📈 Monitoring and Maintenance

### View Deployment Logs
```bash
# Real-time logs
wrangler pages deployment tail aria51

# Historical logs (via dashboard)
# https://dash.cloudflare.com/pages → aria51 → Logs
```

### Database Backups
```bash
# Export full database
wrangler d1 export aria51-production --remote --output=backup-$(date +%Y%m%d).sql

# Store backup safely
mkdir -p /mnt/aidrive/backups
cp backup-*.sql /mnt/aidrive/backups/
```

### Monitor Database Performance
```bash
# Check database size
wrangler d1 info aria51-production

# Query performance metrics
wrangler d1 execute aria51-production --remote --command="
SELECT 
  COUNT(*) as total_risks,
  AVG(risk_score) as avg_score,
  MAX(risk_score) as max_score
FROM risks
WHERE status = 'active';"
```

### Update Deployment
```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
npm run build
wrangler pages deploy dist --project-name aria51
```

---

## 🌐 Production URLs

### Primary Access
- **Production**: https://aria51.pages.dev
- **Direct**: https://b743dea0.aria51.pages.dev
- **Health Check**: https://aria51.pages.dev/health

### API Endpoints
- **Auth**: /api/auth/*
- **Risks**: /risks/api/*
- **Operations**: /operations/api/*
- **Compliance**: /compliance/api/*
- **AI Assistant**: /ai/*
- **MS Defender**: /ms-defender/api/*

---

## 🔐 Security Considerations

### Environment Variables
Never commit sensitive data. Use Cloudflare secrets:
```bash
# Set production secret
echo "your-secret-value" | wrangler secret put JWT_SECRET --project-name aria51

# Set API keys
echo "your-api-key" | wrangler secret put OPENAI_API_KEY --project-name aria51
```

### Database Security
- ✅ Row-level security in place
- ✅ Parameterized queries prevent SQL injection
- ✅ Audit logging enabled
- ✅ Regular backup schedule

### Access Control
- ✅ Session-based authentication
- ✅ Role-based access control (RBAC)
- ✅ CSRF protection enabled
- ✅ Rate limiting configured

---

## 📞 Support and Resources

### Documentation
- **Project README**: /home/user/webapp/README.md
- **API Guide**: /home/user/webapp/docs/api-documentation.md
- **User Guide**: /home/user/webapp/platform-user-guide.md

### Cloudflare Resources
- **Dashboard**: https://dash.cloudflare.com/
- **D1 Database**: https://dash.cloudflare.com/d1
- **Pages**: https://dash.cloudflare.com/pages
- **Workers**: https://dash.cloudflare.com/workers

### Support Channels
- **GitHub Issues**: https://github.com/theblackhat55/ARIA5-HTMX/issues
- **Cloudflare Community**: https://community.cloudflare.com/
- **Documentation**: https://developers.cloudflare.com/

---

## 🎯 Quick Deployment Commands

For a complete deployment from scratch:

```bash
# 1. Authenticate
export CLOUDFLARE_API_TOKEN="your-token"

# 2. Navigate to project
cd /home/user/webapp

# 3. Install dependencies
npm install

# 4. Apply database migrations
wrangler d1 migrations apply aria51-production --remote

# 5. Build application
npm run build

# 6. Deploy to production
wrangler pages deploy dist --project-name aria51

# 7. Verify deployment
curl https://aria51.pages.dev/health
```

---

## ✅ Deployment Checklist

- [ ] Cloudflare account configured
- [ ] Wrangler CLI authenticated
- [ ] Database migrations applied
- [ ] Database schema verified (80+ tables)
- [ ] Production build completed
- [ ] Application deployed to Pages
- [ ] Health check passing
- [ ] Database connectivity confirmed
- [ ] Authentication working
- [ ] All features tested
- [ ] Production URLs documented
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation updated

---

## 📝 Version Information

- **Platform Version**: 5.1.0
- **Deployment Date**: October 22, 2025
- **Database Schema Version**: 2 (migrations 0001 + 0113)
- **Node Version**: 18+
- **Cloudflare Workers**: Compatible with 2025-01-01
- **Production Status**: ✅ READY FOR DEPLOYMENT

---

**Document Created**: October 22, 2025  
**Last Updated**: October 22, 2025  
**Classification**: Production Deployment Guide  
**Status**: Complete and Ready for Use

© 2025 ARIA5 Platform - Enterprise Security Intelligence
