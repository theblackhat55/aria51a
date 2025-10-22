# ARIA51 Deployment Quick Start

## 🚀 5-Minute Production Deployment

### Prerequisites
- Cloudflare account
- API token or ability to run `wrangler login`

---

## Option 1: Automated Deployment (Recommended)

### Step 1: Authenticate
```bash
# Interactive login
wrangler login

# OR set API token
export CLOUDFLARE_API_TOKEN="your-token-here"
```

### Step 2: Run Deployment Script
```bash
cd /home/user/webapp
./deploy-production.sh
```

That's it! The script will:
- ✅ Install dependencies
- ✅ Apply database migrations
- ✅ Build the application
- ✅ Deploy to Cloudflare Pages
- ✅ Verify deployment health

---

## Option 2: Manual Deployment

### Quick Commands
```bash
# 1. Authenticate
wrangler login

# 2. Navigate to project
cd /home/user/webapp

# 3. Apply migrations
wrangler d1 migrations apply aria51-production --remote

# 4. Build and deploy
npm run build
wrangler pages deploy dist --project-name aria51

# 5. Verify
curl https://aria51.pages.dev/health
```

---

## Option 3: NPM Scripts

```bash
# Build and deploy in one command
npm run deploy

# Or stage-specific deployment
npm run deploy:prod
```

---

## Verify Database Structure

```bash
# Run verification script
./verify-database.sh

# Or manual check
wrangler d1 execute aria51-production --remote --command="
SELECT COUNT(*) as table_count 
FROM sqlite_master 
WHERE type='table';"
```

Expected: **80+ tables**

---

## Access Production

### URLs
- **Main**: https://aria51.pages.dev
- **Health**: https://aria51.pages.dev/health
- **Dashboard**: https://aria51.pages.dev/dashboard

### Demo Login
```
Username: admin
Password: demo123
```

---

## Database Structure Included

### Core Schema (80+ tables)
✅ **Users & Auth**: users, organizations, audit_logs  
✅ **Risk Management**: risks, risk_treatments, kris  
✅ **Compliance**: compliance_frameworks, framework_controls, soa  
✅ **Operations**: assets, incidents, defender_*  
✅ **AI & Analytics**: ai_configurations, chat_history, rag_documents  
✅ **API Management**: api_endpoints, api_request_logs, api_health_checks  

### Data Included
- **8 Production Risks** with full metadata
- **5 MS Defender Assets** with security context
- **Demo User Accounts** (5 users, various roles)
- **API Endpoints** registry (40+ endpoints)
- **Sample Evidence** and compliance data

---

## Troubleshooting

### "Database not found"
```bash
# Verify database binding
cat wrangler.jsonc | grep database_name
# Should show: "aria51-production"
```

### "Migrations failed"
```bash
# Check status
wrangler d1 migrations list aria51-production --remote

# Force apply
wrangler d1 migrations apply aria51-production --remote --force
```

### "Build errors"
```bash
# Clean rebuild
rm -rf node_modules dist
npm install
npm run build
```

### "Authentication required"
```bash
# Re-login
wrangler logout
wrangler login
```

---

## Post-Deployment Checks

```bash
# 1. Health check
curl https://aria51.pages.dev/health

# 2. Database connectivity
wrangler d1 execute aria51-production --remote --command="SELECT COUNT(*) FROM risks;"

# 3. Authentication test
curl -X POST https://aria51.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo123"}'

# 4. View logs
wrangler pages deployment tail aria51
```

---

## Update Deployment

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild and redeploy
npm run build
wrangler pages deploy dist --project-name aria51

# 3. Verify
curl https://aria51.pages.dev/health
```

---

## Backup Database

```bash
# Export full database
wrangler d1 export aria51-production --remote --output=backup-$(date +%Y%m%d).sql

# Store in AI Drive
mkdir -p /mnt/aidrive/backups
cp backup-*.sql /mnt/aidrive/backups/
```

---

## Key Files

- `wrangler.jsonc` - Cloudflare configuration
- `migrations/0001_complete_schema.sql` - Main database schema (80+ tables)
- `migrations/0113_api_management.sql` - API management tables
- `deploy-production.sh` - Automated deployment script
- `verify-database.sh` - Database verification script

---

## Support

### Documentation
- Full Guide: `/home/user/webapp/PRODUCTION_DEPLOYMENT_GUIDE.md`
- README: `/home/user/webapp/README.md`
- User Guide: `/home/user/webapp/platform-user-guide.md`

### Resources
- **Dashboard**: https://dash.cloudflare.com/
- **D1 Database**: https://dash.cloudflare.com/d1
- **GitHub**: https://github.com/theblackhat55/ARIA5-HTMX

---

## Success Checklist

- [ ] Cloudflare authenticated
- [ ] Database migrations applied (80+ tables)
- [ ] Application built successfully
- [ ] Deployed to https://aria51.pages.dev
- [ ] Health check returns `{"status":"ok"}`
- [ ] Can login with admin/demo123
- [ ] Risks page shows 8 risks
- [ ] All features accessible

---

**🎉 You're Ready for Production!**

The ARIA51 platform is now fully deployed with complete database structure and ready for enterprise security intelligence operations.

---

*Last Updated: October 22, 2025*  
*Version: 5.1.0*  
*Status: Production Ready*
