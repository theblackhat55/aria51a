# 🚀 Quick Deployment Guide - ARIA51

## Fastest Path to Production

### Prerequisites (One-Time Setup)
```bash
# 1. Get Cloudflare API Token from:
# https://dash.cloudflare.com/profile/api-tokens

# 2. Set environment variable
export CLOUDFLARE_API_TOKEN="your-token-here"
```

### Deploy in 3 Steps

#### Option A: Automated Script (Recommended)
```bash
# Full deployment (build + database + deploy)
./deploy.sh

# Deploy to staging first
./deploy.sh --staging

# Skip build if already built
./deploy.sh --skip-build

# Skip database migrations
./deploy.sh --skip-db
```

#### Option B: Manual Commands
```bash
# 1. Build
npm run build

# 2. Apply database migrations
wrangler d1 migrations apply aria51-production

# 3. Deploy
wrangler pages deploy dist --project-name aria51
```

### Verify Deployment
```bash
# Check health
curl https://aria51.pages.dev/health

# Test login
curl -X POST https://aria51.pages.dev/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "demo123"}'
```

---

## Current Status

### ✅ Build Status
- **Application Built:** YES
- **Build Output:** `dist/_worker.js` (1.86 MB)
- **Build Time:** ~2 seconds
- **Status:** Ready for deployment

### 🗄️ Database Structure
- **Tables:** 80+ comprehensive schema
- **Migrations:** 2 files ready
  - `0001_complete_schema.sql` - Core schema
  - `0113_api_management.sql` - API management
- **Demo Data:** Available in seed files
- **Status:** Ready to apply

### 📦 What Gets Deployed

#### Frontend & Backend
- Hono server with TypeScript
- All routes and API endpoints
- Authentication system
- Session management

#### Database Schema (80+ Tables)
**Core Tables:**
- users, organizations, risks, kris
- assets, incidents, evidence

**Compliance:**
- compliance_frameworks, framework_controls
- soa, compliance_assessments, assessment_responses

**Security Operations:**
- defender_assets, defender_incidents
- defender_vulnerabilities

**AI & Intelligence:**
- ai_configurations, chat_history
- rag_documents, document_chunks

**API Management:**
- api_endpoints, api_request_logs
- api_health_checks

**Audit & Reporting:**
- audit_logs, reports

#### Features Deployed
- ✅ Risk Management Dashboard
- ✅ Key Risk Indicators (KRI)
- ✅ Asset Management
- ✅ MS Defender Integration
- ✅ Compliance Framework Management
- ✅ AI Assistant Chatbot
- ✅ Threat Intelligence
- ✅ Evidence Repository
- ✅ Audit Logging
- ✅ Report Generation

---

## Production URLs

### Main Application
🔗 **https://aria51.pages.dev**

### Key Pages
- Dashboard: `/`
- Risk Management: `/risk`
- Operations: `/operations`
- Compliance: `/compliance`
- MS Defender: `/ms-defender`
- AI Assistant: `/ai`
- Admin Panel: `/admin`

### API Health
🔗 **https://aria51.pages.dev/health**

---

## Demo Accounts

All accounts use password: `demo123`

| Username | Role | Access Level |
|----------|------|--------------|
| admin | Administrator | Full system access |
| avi_security | Risk Manager | Risk management |
| sarah_compliance | Compliance Officer | Compliance features |
| mike_analyst | Security Analyst | Analysis tools |
| demo_user | Standard User | Read-only access |

---

## Troubleshooting

### "Not Authenticated" Error
```bash
# Set API token
export CLOUDFLARE_API_TOKEN="your-token"

# Or login interactively
wrangler login
```

### Build Errors
```bash
# Clean rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Database Issues
```bash
# Check database
wrangler d1 list

# Verify tables
wrangler d1 execute aria51-production \
  --command="SELECT COUNT(*) FROM sqlite_master WHERE type='table';"
```

### Deployment Failed
```bash
# Check deployment status
wrangler pages deployment list --project-name aria51

# View logs
wrangler pages deployment tail --project-name aria51
```

---

## Database Management

### View Tables
```bash
wrangler d1 execute aria51-production \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Check Data
```bash
# Count risks
wrangler d1 execute aria51-production \
  --command="SELECT COUNT(*) as count FROM risks;"

# View users
wrangler d1 execute aria51-production \
  --command="SELECT username, role FROM users LIMIT 5;"
```

### Backup Database
```bash
wrangler d1 export aria51-production \
  --output=./backups/backup-$(date +%Y%m%d).sql
```

---

## Deployment Checklist

Before deploying:
- [ ] Cloudflare API token set
- [ ] npm install completed
- [ ] npm run build successful
- [ ] Database name confirmed in wrangler.jsonc
- [ ] R2 bucket created (if needed)

After deploying:
- [ ] Health endpoint responds (200 OK)
- [ ] Login page loads
- [ ] Can authenticate with demo account
- [ ] Dashboard displays correctly
- [ ] Database queries work

---

## Next Steps After Deployment

1. **Test Login**
   - Visit https://aria51.pages.dev
   - Login with admin/demo123
   - Verify dashboard loads

2. **Check Features**
   - Navigate to Risk Management
   - View Asset Inventory
   - Test AI Assistant
   - Check Compliance Dashboard

3. **Verify Database**
   - Check risk records
   - View user accounts
   - Test CRUD operations

4. **Monitor**
   - Check health endpoint
   - Review deployment logs
   - Monitor error rates

---

## Support & Documentation

- **Full Guide:** `DEPLOYMENT_GUIDE.md`
- **Platform Guide:** `platform-user-guide.md`
- **API Security:** `API_KEY_SECURITY.md`
- **Database Analysis:** `database-analysis.md`

---

**Quick Reference Card**

```
Build:   npm run build
Migrate: wrangler d1 migrations apply aria51-production
Deploy:  wrangler pages deploy dist --project-name aria51
Health:  curl https://aria51.pages.dev/health
```

---

**Status:** Production Ready ✅  
**Last Build:** 2025-10-22  
**Version:** 5.1.0
