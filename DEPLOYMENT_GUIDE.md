# ARIA51 Production Deployment Guide

## 🚀 Complete Deployment Process with Database Structure

This guide provides step-by-step instructions for deploying the ARIA51 Enterprise Security Intelligence Platform to Cloudflare Pages with full database setup.

---

## 📋 Prerequisites

### Required Accounts & Access
- **Cloudflare Account** with Pages and D1 Database access
- **GitHub Repository** access (https://github.com/theblackhat55/ARIA5-HTMX.git)
- **Cloudflare API Token** or ability to authenticate via OAuth

### Required Tools
- Node.js >= 18.0.0
- npm (Node Package Manager)
- Wrangler CLI (Cloudflare Workers CLI)

---

## 🗄️ Database Structure Overview

### Production Database: `aria51-production`
- **Database ID**: `8c465a3b-7e5a-4f39-9237-ff56b8e644d0`
- **Type**: Cloudflare D1 (SQLite)
- **Total Tables**: 80+ comprehensive enterprise security tables

### Core Database Tables

#### 1. **User Management** (3 tables)
- `users` - User accounts with authentication
- `organizations` - Multi-tenant organization structure
- `audit_logs` - Complete audit trail

#### 2. **Risk Management** (4 tables)
- `risks` - Risk assessments with dynamic scoring
- `risk_treatments` - Risk mitigation strategies
- `kris` - Key Risk Indicators
- `risk_relationships` - Risk dependencies

#### 3. **Compliance Management** (6 tables)
- `compliance_frameworks` - Regulatory frameworks (ISO 27001, NIST, etc.)
- `framework_controls` - Individual compliance controls
- `soa` - Statement of Applicability
- `compliance_assessments` - Assessment tracking
- `assessment_responses` - Control assessment results
- `evidence` - Evidence documentation

#### 4. **Asset & Operations** (3 tables)
- `assets` - IT and business assets
- `services` - Operational services
- `business_units` - Organizational structure

#### 5. **Microsoft Defender Integration** (8 tables)
- `defender_assets` - Assets from MS Defender
- `defender_incidents` - Security incidents
- `defender_vulnerabilities` - Vulnerability data
- `defender_alerts` - Security alerts
- `defender_threat_analytics` - Threat intelligence
- `defender_hunting_queries` - KQL queries
- `defender_recommendations` - Security recommendations
- Junction tables for relationships

#### 6. **Threat Intelligence** (5 tables)
- `threat_feeds` - External threat feeds
- `threat_indicators` - IOCs (Indicators of Compromise)
- `threat_campaigns` - Attack campaigns
- `threat_actors` - Known threat actors
- `incidents` - Security incident tracking

#### 7. **AI & Automation** (6 tables)
- `ai_configurations` - AI provider settings
- `chat_history` - AI assistant conversations
- `rag_documents` - RAG knowledge base
- `document_chunks` - Document embeddings
- `ai_analysis_results` - AI-powered analysis
- `ai_recommendations` - AI-generated recommendations

#### 8. **API Management** (3 tables)
- `api_endpoints` - API inventory and documentation
- `api_request_logs` - API usage monitoring
- `api_health_checks` - API health status

#### 9. **Reporting & Analytics** (2 tables)
- `reports` - Generated reports
- `report_schedules` - Automated reporting

### Database Views
- `v_risk_summary` - Comprehensive risk overview
- `v_compliance_overview` - Compliance status summary
- `v_asset_security_status` - Asset security metrics

### Sample Data Included
- **8 Production Risks** with complete metadata
- **5 Demo User Accounts** with different roles
- **Multiple Compliance Frameworks** (ISO 27001, NIST CSF, SOC 2)
- **MS Defender Sample Data** (assets, incidents, vulnerabilities)
- **Threat Intelligence Feeds** and IOCs

---

## 🔧 Step 1: Authentication with Cloudflare

### Option A: OAuth Login (Interactive)
```bash
cd /home/user/webapp
wrangler login
```
This will open a browser for OAuth authentication.

### Option B: API Token (Non-Interactive)
```bash
# Set the API token as environment variable
export CLOUDFLARE_API_TOKEN="your-api-token-here"

# Or create ~/.wrangler/config/default.toml
mkdir -p ~/.wrangler/config
cat > ~/.wrangler/config/default.toml << EOF
api_token = "your-api-token-here"
EOF
```

### Verify Authentication
```bash
wrangler whoami
```

---

## 🏗️ Step 2: Build the Application

### Install Dependencies
```bash
cd /home/user/webapp
npm install
```

### Build for Production
```bash
cd /home/user/webapp
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle all assets
- Optimize for production
- Generate output in `./dist` directory

---

## 🗄️ Step 3: Database Migration

### Apply Database Migrations to Production

#### Migration 1: Complete Schema
```bash
cd /home/user/webapp
wrangler d1 migrations apply aria51-production
```

This applies:
- **0001_complete_schema.sql** - Core 80+ table structure
- **0113_api_management.sql** - API management system

### Verify Database Structure
```bash
# List all tables
wrangler d1 execute aria51-production --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check specific table structure
wrangler d1 execute aria51-production --command="PRAGMA table_info(risks);"

# Verify data
wrangler d1 execute aria51-production --command="SELECT COUNT(*) as risk_count FROM risks;"
```

### Expected Output
- **80+ tables** created successfully
- **8 risks** in the risks table
- **5+ users** in the users table
- All indexes and views created

---

## 🚀 Step 4: Deploy to Cloudflare Pages

### Deploy Command
```bash
cd /home/user/webapp
npm run deploy
```

Or manually:
```bash
cd /home/user/webapp
wrangler pages deploy dist --project-name aria51
```

### Deployment Process
1. **Upload assets** to Cloudflare Pages
2. **Create deployment** with unique URL
3. **Bind D1 database** (aria51-production)
4. **Configure environment variables**
5. **Activate deployment**

### Expected Output
```
✨ Deployment complete!
✨ Success! Deployed to https://aria51.pages.dev
🌎 Production URL: https://aria51.pages.dev
```

---

## ✅ Step 5: Post-Deployment Verification

### 1. Health Check
```bash
curl https://aria51.pages.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-22T..."
}
```

### 2. Test Authentication
Navigate to: `https://aria51.pages.dev/login`

**Demo Accounts:**
```
Admin Account:
  Username: admin
  Password: demo123

Risk Manager:
  Username: avi_security
  Password: demo123

Compliance Officer:
  Username: sarah_compliance
  Password: demo123
```

### 3. Verify Database Access
Navigate to: `https://aria51.pages.dev/risk`

Should display:
- **8 production risks** in the risk table
- Proper risk scoring and categorization
- All risk metadata (owner, status, dates)

### 4. Test Key Features

#### Risk Management
- URL: `https://aria51.pages.dev/risk`
- Verify: Risk table with 8 entries
- Test: Create new risk, update existing risk

#### KRI Dashboard
- URL: `https://aria51.pages.dev/risk/kri`
- Verify: Key Risk Indicators display
- Test: KRI threshold monitoring

#### MS Defender Integration
- URL: `https://aria51.pages.dev/ms-defender`
- Verify: Asset table with incident/vulnerability counts
- Test: Click "Incidents" button on an asset

#### Compliance Management
- URL: `https://aria51.pages.dev/compliance`
- Verify: Compliance frameworks display
- Test: Assessment creation and control mapping

#### AI Assistant
- URL: `https://aria51.pages.dev/ai`
- Verify: Chat interface loads
- Test: Send a message to AI assistant

---

## 🔐 Step 6: Configure Production Secrets

### Set Environment Variables
```bash
# JWT Secret for authentication
wrangler pages secret put JWT_SECRET --project-name aria51
# Enter: <your-secure-random-jwt-secret>

# Optional: AI Provider API Keys
wrangler pages secret put OPENAI_API_KEY --project-name aria51
wrangler pages secret put ANTHROPIC_API_KEY --project-name aria51
wrangler pages secret put GEMINI_API_KEY --project-name aria51

# Optional: Microsoft Defender Integration
wrangler pages secret put MICROSOFT_TENANT_ID --project-name aria51
wrangler pages secret put MICROSOFT_CLIENT_ID --project-name aria51
wrangler pages secret put MICROSOFT_CLIENT_SECRET --project-name aria51
```

### Verify Secrets
```bash
wrangler pages secret list --project-name aria51
```

---

## 📊 Database Migration Details

### Migration Files

#### **0001_complete_schema.sql**
Creates the complete database structure:

**Core Tables:**
1. `users` - User authentication and profiles
2. `organizations` - Multi-tenant organizations
3. `risks` - Risk assessments with calculated scores
4. `risk_treatments` - Risk mitigation strategies
5. `kris` - Key Risk Indicators with thresholds
6. `compliance_frameworks` - Regulatory frameworks
7. `framework_controls` - Compliance controls
8. `soa` - Statement of Applicability
9. `compliance_assessments` - Assessment tracking
10. `assessment_responses` - Control responses
11. `evidence` - Evidence documentation
12. `incidents` - Security incident tracking
13. `assets` - IT and business assets
14. `ai_configurations` - AI provider settings
15. `chat_history` - AI conversation logs
16. `rag_documents` - RAG knowledge base
17. `document_chunks` - Document embeddings
18. `audit_logs` - Complete audit trail
19. `reports` - Report generation tracking

**MS Defender Tables:**
20. `defender_assets` - MS Defender asset inventory
21. `defender_incidents` - Security incidents
22. `defender_vulnerabilities` - Vulnerability data
23. `defender_alerts` - Security alerts
24. `defender_recommendations` - Security recommendations
25. `defender_threat_analytics` - Threat intelligence
26. `defender_hunting_queries` - KQL query library
27. Junction tables for asset relationships

**Indexes:**
- Performance indexes on frequently queried columns
- Composite indexes for complex queries
- Full-text search indexes where applicable

**Views:**
- `v_risk_summary` - Risk overview with joins
- `v_compliance_overview` - Compliance status aggregation

#### **0113_api_management.sql**
Creates API management system:

1. `api_endpoints` - Complete API inventory
2. `api_request_logs` - API usage monitoring
3. `api_health_checks` - Health check history

Includes seed data for all existing API endpoints.

---

## 🔄 Continuous Deployment

### Automatic Deployment with GitHub Integration

#### Setup GitHub Integration
1. Go to Cloudflare Dashboard
2. Navigate to **Pages** → **aria51**
3. Click **Settings** → **Builds & Deployments**
4. Connect to GitHub repository: `theblackhat55/ARIA5-HTMX`
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

#### Automatic Deployments
- **Push to `main` branch** → Automatic production deployment
- **Pull request created** → Preview deployment
- **Commit to branch** → Development deployment

---

## 🐛 Troubleshooting

### Issue: Authentication Failed
**Solution:**
```bash
# Clear existing credentials
rm -rf ~/.wrangler

# Re-authenticate
wrangler login
```

### Issue: Database Not Found
**Solution:**
```bash
# Verify database exists
wrangler d1 list

# If not found, create it
wrangler d1 create aria51-production

# Update wrangler.jsonc with correct database_id
```

### Issue: Build Fails
**Solution:**
```bash
# Clear node_modules and reinstall
cd /home/user/webapp
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .wrangler

# Rebuild
npm run build
```

### Issue: Migration Fails
**Solution:**
```bash
# Check migration files
ls -la migrations/

# Apply migrations one by one
wrangler d1 execute aria51-production --file=migrations/0001_complete_schema.sql
wrangler d1 execute aria51-production --file=migrations/0113_api_management.sql
```

### Issue: 404 on Deployment
**Solution:**
- Verify `dist` directory exists and contains `_worker.js`
- Check `wrangler.jsonc` configuration
- Ensure `pages_build_output_dir` is set to `"./dist"`

---

## 📈 Monitoring & Maintenance

### Check Deployment Status
```bash
wrangler pages deployment list --project-name aria51
```

### View Logs
```bash
wrangler pages deployment tail --project-name aria51
```

### Database Backup
```bash
# Export production database
wrangler d1 export aria51-production --output=./backups/aria51-prod-$(date +%Y%m%d-%H%M%S).sql
```

### Rollback Deployment
```bash
# List previous deployments
wrangler pages deployment list --project-name aria51

# Rollback to specific deployment
wrangler pages deployment rollback <deployment-id> --project-name aria51
```

---

## 🎯 Quick Deployment Checklist

- [ ] Authenticate with Cloudflare (`wrangler login`)
- [ ] Install dependencies (`npm install`)
- [ ] Build application (`npm run build`)
- [ ] Apply database migrations (`wrangler d1 migrations apply aria51-production`)
- [ ] Verify database structure (check table count)
- [ ] Deploy to Cloudflare Pages (`npm run deploy`)
- [ ] Test health endpoint (`/health`)
- [ ] Test authentication (`/login`)
- [ ] Verify risk data (`/risk`)
- [ ] Configure production secrets
- [ ] Set up GitHub integration for CD
- [ ] Document production URLs

---

## 🌐 Production URLs

**Primary Production URL:**
- https://aria51.pages.dev

**Direct Deployment URL:**
- https://b743dea0.aria51.pages.dev

**Health Check:**
- https://aria51.pages.dev/health

**API Documentation:**
- https://aria51.pages.dev/api/docs (if implemented)

---

## 📞 Support & Resources

### Documentation
- Project README: `/home/user/webapp/README.md`
- API Documentation: `/home/user/webapp/docs/`
- Security Policies: `/home/user/webapp/security-policies/`

### Cloudflare Resources
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

### GitHub Repository
- https://github.com/theblackhat55/ARIA5-HTMX

---

**Document Created:** 2025-10-22
**Version:** 1.0.0
**Deployment Target:** ARIA51 Production (aria51.pages.dev)
**Database:** aria51-production (8c465a3b-7e5a-4f39-9237-ff56b8e644d0)

---

© 2025 ARIA5 Platform - Enterprise Risk Intelligence Production Deployment
