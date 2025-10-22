# ARIA51 Production Deployment Guide

## 🚀 Complete Deployment Instructions

This guide provides step-by-step instructions to deploy the ARIA51 Enterprise Security Intelligence Platform to production with full database structure.

---

## 📋 Prerequisites

### 1. Cloudflare Account Setup
- Active Cloudflare account with Pages access
- API Token with the following permissions:
  - Account > D1 > Edit
  - Account > Workers Scripts > Edit
  - Account > Pages > Edit
  - Account > R2 > Edit

### 2. Create Cloudflare API Token
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Add additional permissions:
   - D1: Edit
   - Pages: Edit
   - R2: Edit
5. Copy the generated token

### 3. Set Environment Variable
```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

Or add to your shell profile (~/.bashrc, ~/.zshrc):
```bash
echo 'export CLOUDFLARE_API_TOKEN="your-token-here"' >> ~/.bashrc
source ~/.bashrc
```

---

## 🗄️ Database Structure Overview

The ARIA51 platform includes a comprehensive database schema with **80+ tables**:

### Core Tables
- **users** - User accounts and authentication
- **organizations** - Multi-tenant organization management
- **risks** - Risk assessments and management
- **risk_treatments** - Risk mitigation strategies
- **kris** - Key Risk Indicators

### Compliance & Governance
- **compliance_frameworks** - Regulatory frameworks (ISO 27001, GDPR, etc.)
- **framework_controls** - Compliance controls
- **soa** - Statement of Applicability
- **compliance_assessments** - Assessment tracking
- **assessment_responses** - Control responses
- **evidence** - Evidence repository

### Security Operations
- **incidents** - Security incident tracking
- **assets** - IT asset inventory
- **defender_assets** - MS Defender asset integration
- **defender_incidents** - MS Defender incidents
- **defender_vulnerabilities** - Vulnerability tracking

### AI & Intelligence
- **ai_configurations** - AI provider settings
- **chat_history** - AI assistant conversations
- **rag_documents** - RAG document storage
- **document_chunks** - Vector embeddings for RAG

### API Management
- **api_endpoints** - API endpoint registry
- **api_request_logs** - API usage logging
- **api_health_checks** - Health monitoring

### Audit & Reporting
- **audit_logs** - Comprehensive audit trail
- **reports** - Generated reports repository

---

## 🚀 Deployment Steps

### Step 1: Build the Application
```bash
cd /home/user/webapp
npm run build
```

**Expected Output:**
```
✓ 100 modules transformed.
rendering chunks...
dist/_worker.js  1,865.58 kB
✓ built in 1.67s
```

✅ **Status:** COMPLETED

### Step 2: Apply Database Migrations

#### Option A: Fresh Database Setup
```bash
# List existing databases
wrangler d1 list

# If aria51-production doesn't exist, create it
wrangler d1 create aria51-production

# Apply migrations to create all 80+ tables
wrangler d1 migrations apply aria51-production
```

#### Option B: Update Existing Database
```bash
# Apply new migrations only
wrangler d1 migrations apply aria51-production
```

**Migration Files:**
- `migrations/0001_complete_schema.sql` - Complete database schema (80+ tables)
- `migrations/0113_api_management.sql` - API management system

### Step 3: Seed Demo Data (Optional)
```bash
# Check if seed data file exists
ls -la seed.sql

# If exists, apply seed data
wrangler d1 execute aria51-production --file=./seed.sql
```

### Step 4: Verify Database Structure
```bash
# List all tables
wrangler d1 execute aria51-production --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check risk data
wrangler d1 execute aria51-production --command="SELECT COUNT(*) as risk_count FROM risks;"

# Check users
wrangler d1 execute aria51-production --command="SELECT username, role FROM users;"
```

### Step 5: Deploy to Cloudflare Pages
```bash
# Deploy to production
wrangler pages deploy dist --project-name aria51

# Or deploy to staging first
wrangler pages deploy dist --project-name aria51-staging
```

### Step 6: Verify Deployment
```bash
# Check deployment status
wrangler pages deployment list --project-name aria51

# Test health endpoint
curl https://aria51.pages.dev/health
```

---

## 🔧 Configuration Files

### wrangler.jsonc
```json
{
  "name": "aria51",
  "compatibility_date": "2025-01-01",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "aria51-production",
      "database_id": "8c465a3b-7e5a-4f39-9237-ff56b8e644d0"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "aria51-bucket"
    }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

---

## 📊 Database Schema Verification

### Check Table Count
```bash
wrangler d1 execute aria51-production --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';"
```

**Expected Result:** 80+ tables

### Verify Core Tables
```bash
# Core tables
wrangler d1 execute aria51-production --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'risks', 'assets', 'compliance_frameworks', 'api_endpoints');"
```

### Sample Data Verification
```bash
# Check risks
wrangler d1 execute aria51-production --command="SELECT id, title, category, risk_score, status FROM risks LIMIT 5;"

# Check users
wrangler d1 execute aria51-production --command="SELECT id, username, role, is_active FROM users LIMIT 5;"
```

---

## 🔐 Demo Accounts

After deployment, these demo accounts are available:

```
Administrator: admin / demo123
Risk Manager: avi_security / demo123
Compliance Officer: sarah_compliance / demo123
Security Analyst: mike_analyst / demo123
Standard User: demo_user / demo123
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://aria51.pages.dev/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T...",
  "database": "connected"
}
```

### 2. Login Test
```bash
curl -X POST https://aria51.pages.dev/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "demo123"}'
```

### 3. Access Dashboard
Visit: https://aria51.pages.dev/

### 4. Test Key Features
- **Risk Management:** https://aria51.pages.dev/risk
- **Operations:** https://aria51.pages.dev/operations
- **Compliance:** https://aria51.pages.dev/compliance
- **MS Defender:** https://aria51.pages.dev/ms-defender
- **AI Assistant:** https://aria51.pages.dev/ai

---

## 🛠️ Automated Deployment Script

### deploy.sh
```bash
#!/bin/bash
set -e

echo "🚀 ARIA51 Production Deployment"
echo "================================"

# Check prerequisites
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN not set"
    echo "Please set: export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

# Build application
echo "📦 Building application..."
npm run build

# Apply database migrations
echo "🗄️ Applying database migrations..."
wrangler d1 migrations apply aria51-production

# Verify database
echo "✅ Verifying database structure..."
TABLE_COUNT=$(wrangler d1 execute aria51-production --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" --json | jq -r '.[0].results[0].count')
echo "   Tables created: $TABLE_COUNT"

# Deploy to Pages
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name aria51

# Get deployment URL
echo ""
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Production URL: https://aria51.pages.dev"
echo "🔗 Health Check:  https://aria51.pages.dev/health"
echo ""
echo "📋 Demo Accounts:"
echo "   admin / demo123 (Administrator)"
echo "   avi_security / demo123 (Risk Manager)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## 📈 Production URLs

### Primary Production
- **Main URL:** https://aria51.pages.dev
- **Direct URL:** https://b743dea0.aria51.pages.dev
- **Health Check:** https://aria51.pages.dev/health

### Database
- **Name:** aria51-production
- **ID:** 8c465a3b-7e5a-4f39-9237-ff56b8e644d0
- **Tables:** 80+
- **Status:** Production Ready

---

## 🔍 Troubleshooting

### Authentication Issues
```bash
# Re-authenticate
wrangler logout
wrangler login

# Or use API token
export CLOUDFLARE_API_TOKEN="your-token"
```

### Database Migration Errors
```bash
# Check migration status
wrangler d1 migrations list aria51-production

# Rollback if needed
wrangler d1 migrations apply aria51-production --rollback

# Re-apply
wrangler d1 migrations apply aria51-production
```

### Build Failures
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Deployment Verification
```bash
# Check deployment logs
wrangler pages deployment list --project-name aria51

# View specific deployment
wrangler pages deployment tail --project-name aria51
```

---

## 📚 Additional Resources

- **Cloudflare Pages:** https://developers.cloudflare.com/pages/
- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **API Documentation:** See `API_KEY_SECURITY.md`
- **Platform Guide:** See `platform-user-guide.md`

---

## ✅ Deployment Checklist

- [ ] Cloudflare API token created and set
- [ ] Application built successfully (`npm run build`)
- [ ] Database migrations applied (80+ tables created)
- [ ] Demo data seeded (optional)
- [ ] Deployed to Cloudflare Pages
- [ ] Health check endpoint responding
- [ ] Login functionality tested
- [ ] Key features verified (Risk, Compliance, Operations)
- [ ] Demo accounts accessible

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-10-22  
**Status:** Production Ready  
**Platform:** ARIA51 Enterprise Security Intelligence

**© 2025 ARIA51 Platform - Complete Production Deployment Guide**
