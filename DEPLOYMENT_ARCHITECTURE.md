# ARIA51 Production Deployment Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACCESS LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  🌐 https://aria51.pages.dev                                    │
│  🌐 https://b743dea0.aria51.pages.dev (Direct)                  │
│  🔐 Demo: admin/demo123, avi_security/demo123                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/TLS 1.3
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE EDGE NETWORK                        │
├─────────────────────────────────────────────────────────────────┤
│  • Global CDN (300+ locations)                                  │
│  • DDoS Protection                                               │
│  • WAF (Web Application Firewall)                               │
│  • SSL/TLS Termination                                          │
│  • Rate Limiting                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE PAGES (HOSTING)                      │
├─────────────────────────────────────────────────────────────────┤
│  Project: aria51                                                 │
│  Runtime: Cloudflare Workers (V8 Isolates)                      │
│  Build Output: dist/_worker.js (1.86 MB)                        │
│  Compatibility: 2025-01-01                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER (HONO)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Authentication  │  │  Authorization   │                    │
│  │  Middleware      │  │  & RBAC          │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              ROUTE HANDLERS                            │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  /dashboard      │  Risk Dashboard                     │   │
│  │  /risk           │  Risk Management Module             │   │
│  │  /operations     │  Operations & Asset Management      │   │
│  │  /compliance     │  Compliance Framework Management    │   │
│  │  /ms-defender    │  MS Defender Integration            │   │
│  │  /ai             │  AI Assistant & Chat                │   │
│  │  /threats        │  Threat Intelligence                │   │
│  │  /api/*          │  REST API Endpoints (40+)           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────┬────────────────────┬──────────────────────────┘
                 │                    │
                 │                    │
                 ▼                    ▼
┌────────────────────────┐  ┌───────────────────────────────────┐
│  CLOUDFLARE D1 (DB)    │  │  CLOUDFLARE BINDINGS              │
├────────────────────────┤  ├───────────────────────────────────┤
│                        │  │                                   │
│  Name: aria51-prod     │  │  R2 Bucket: aria51-bucket        │
│  ID: 8c465a3b-...      │  │  • Evidence files                │
│  Type: SQLite          │  │  • Generated reports             │
│  Storage: 500 MB       │  │  • Document storage              │
│                        │  │                                   │
│  Tables: 80+           │  │  AI Binding: Cloudflare Workers  │
│  ┌──────────────────┐ │  │  • GPT Models                    │
│  │ Authentication   │ │  │  • Text Analysis                 │
│  │  • users (5)     │ │  │  • Embeddings                    │
│  │  • organizations │ │  │                                   │
│  │  • audit_logs    │ │  │  KV Namespace: (Future)          │
│  └──────────────────┘ │  │  • Session storage               │
│                        │  │  • Cache layer                   │
│  ┌──────────────────┐ │  └───────────────────────────────────┘
│  │ Risk Management  │ │
│  │  • risks (8)     │ │
│  │  • treatments    │ │  ┌───────────────────────────────────┐
│  │  • kris          │ │  │  EXTERNAL INTEGRATIONS            │
│  └──────────────────┘ │  ├───────────────────────────────────┤
│                        │  │                                   │
│  ┌──────────────────┐ │  │  Microsoft Defender (Optional)    │
│  │ Compliance       │ │  │  • Tenant Auth                    │
│  │  • frameworks    │ │  │  • Incident Sync                  │
│  │  • controls      │ │  │  • Vulnerability Feed             │
│  │  • assessments   │ │  │                                   │
│  └──────────────────┘ │  │  OpenAI API (Optional)            │
│                        │  │  • GPT-4 / GPT-3.5               │
│  ┌──────────────────┐ │  │  • AI Analysis                   │
│  │ Operations       │ │  │  • Risk Assessment               │
│  │  • assets        │ │  │                                   │
│  │  • incidents     │ │  │  Anthropic Claude (Optional)      │
│  │  • defender_*    │ │  │  • Advanced reasoning            │
│  └──────────────────┘ │  │  • Context handling              │
│                        │  │                                   │
│  ┌──────────────────┐ │  │  Google Gemini (Optional)         │
│  │ AI & Analytics   │ │  │  • Multimodal AI                 │
│  │  • chat_history  │ │  │  • Document analysis             │
│  │  • rag_docs      │ │  │                                   │
│  │  • embeddings    │ │  └───────────────────────────────────┘
│  └──────────────────┘ │
│                        │
│  ┌──────────────────┐ │
│  │ API Management   │ │
│  │  • endpoints     │ │
│  │  • request_logs  │ │
│  │  • health_checks │ │
│  └──────────────────┘ │
│                        │
└────────────────────────┘
```

---

## 🔄 Deployment Flow

```
┌─────────────────┐
│  DEVELOPER      │
│  Local Machine  │
└────────┬────────┘
         │
         │ 1. Code Changes
         │    git commit
         │    git push
         ▼
┌─────────────────────────────────┐
│       GITHUB REPOSITORY         │
│  theblackhat55/ARIA5-HTMX       │
│  Branch: main                   │
└────────┬────────────────────────┘
         │
         │ 2. Pull Latest
         │    git pull origin main
         ▼
┌─────────────────────────────────┐
│     LOCAL BUILD PROCESS         │
│  • npm install                  │
│  • npm run build                │
│  • Output: dist/_worker.js      │
└────────┬────────────────────────┘
         │
         │ 3. Database Migrations
         │    wrangler d1 migrations apply
         ▼
┌─────────────────────────────────┐
│   CLOUDFLARE D1 DATABASE        │
│  • Create/Update tables         │
│  • Apply schema changes         │
│  • Seed initial data            │
└────────┬────────────────────────┘
         │
         │ 4. Deploy Application
         │    wrangler pages deploy
         ▼
┌─────────────────────────────────┐
│   CLOUDFLARE PAGES DEPLOY       │
│  • Upload build artifacts       │
│  • Configure bindings           │
│  • Activate deployment          │
└────────┬────────────────────────┘
         │
         │ 5. Health Checks
         │    curl /health
         ▼
┌─────────────────────────────────┐
│   PRODUCTION VERIFICATION       │
│  • Database connectivity        │
│  • API endpoint tests           │
│  • Authentication checks        │
└────────┬────────────────────────┘
         │
         │ 6. Production Live
         ▼
┌─────────────────────────────────┐
│   🌐 aria51.pages.dev           │
│   Status: LIVE                  │
└─────────────────────────────────┘
```

---

## 📊 Database Schema Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE: aria51-production                   │
│                    Type: Cloudflare D1 (SQLite)                  │
│                    Tables: 80+  |  Indexes: 45+  |  Views: 2    │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  AUTHENTICATION & AUTHORIZATION                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  users ─────────┬──────► organizations                        │
│    │            │                                              │
│    │            └──────► audit_logs                           │
│    │                                                           │
│    └────────────────────► sessions (via KV - future)          │
│                                                                │
│  Relationships:                                                │
│  • 1 user : N roles (RBAC)                                    │
│  • 1 user : 1 organization (multi-tenant)                     │
│  • 1 user : N audit entries                                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  RISK MANAGEMENT CORE                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  risks ─────────┬──────► risk_treatments                      │
│    │            │                                              │
│    │            ├──────► kris (Key Risk Indicators)           │
│    │            │                                              │
│    │            ├──────► incidents                            │
│    │            │                                              │
│    │            ├──────► assets (affected_assets)             │
│    │            │                                              │
│    │            └──────► evidence (risk_ids)                  │
│    │                                                           │
│    └────────────────────► audit_logs                          │
│                                                                │
│  Computed Columns:                                             │
│  • risk_score = probability × impact                          │
│  • inherent_risk, residual_risk                               │
│                                                                │
│  Current Data: 8 active risks                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  COMPLIANCE FRAMEWORK                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  compliance_frameworks ──┬──► framework_controls              │
│                          │                                     │
│                          └──► compliance_assessments           │
│                               │                                │
│  framework_controls ─────────┼──► soa (Statement of Applicability)
│    │                          │                                │
│    │                          └──► assessment_responses        │
│    │                                                           │
│    └────────────────────────────► evidence (control_ids)      │
│                                                                │
│  Frameworks: GDPR, ISO 27001, SOC 2, NIST, etc.              │
│  Controls: 1000+ across frameworks                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  OPERATIONS & ASSET MANAGEMENT                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  assets ────────┬──────► incidents                            │
│    │            │                                              │
│    │            ├──────► defender_assets (integration)        │
│    │            │         │                                    │
│    │            │         ├──► defender_incidents             │
│    │            │         │                                    │
│    │            │         └──► defender_vulnerabilities       │
│    │            │                                              │
│    │            └──────► asset_relationships                  │
│    │                                                           │
│    └────────────────────► risks (affected_assets)             │
│                                                                │
│  MS Defender Integration:                                     │
│  • Real-time incident sync                                    │
│  • Vulnerability tracking                                     │
│  • Asset security context                                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  AI & ANALYTICS                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ai_configurations ──┬──► chat_history                        │
│                      │      │                                  │
│                      │      └──► users (context)              │
│                      │                                         │
│  rag_documents ──────┼──► document_chunks                     │
│    │                 │      │                                  │
│    │                 │      └──► embeddings (vector search)   │
│    │                 │                                         │
│    └─────────────────┴──► ai_insights                         │
│                                                                │
│  Features:                                                     │
│  • Conversation memory                                        │
│  • RAG (Retrieval Augmented Generation)                       │
│  • Semantic search with embeddings                            │
│  • Multi-provider support (OpenAI, Claude, Gemini)           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  API MANAGEMENT & MONITORING                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  api_endpoints ──┬──► api_request_logs                        │
│                  │                                             │
│                  └──► api_health_checks                        │
│                                                                │
│  Registered Endpoints: 40+                                     │
│  Categories:                                                   │
│  • Admin APIs (4 endpoints)                                   │
│  • Risk Management (4 endpoints)                              │
│  • Operations (6 endpoints)                                   │
│  • Compliance (5 endpoints)                                   │
│  • Threat Intelligence (4 endpoints)                          │
│  • AI Assistant (3 endpoints)                                 │
│  • MS Defender (8 endpoints)                                  │
│                                                                │
│  Monitoring:                                                   │
│  • Request/response logging                                   │
│  • Performance metrics                                         │
│  • Health check automation                                     │
│  • Rate limiting enforcement                                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  REPORTING & NOTIFICATIONS                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  reports ───────┬──► users (generated_by)                     │
│    │            │                                              │
│    │            └──► organizations                            │
│    │                                                           │
│    └────────────────► R2 Bucket (file_path)                   │
│                                                                │
│  notifications ─┴──► users (recipient)                        │
│                                                                │
│  Report Types:                                                 │
│  • Risk Assessment Reports                                    │
│  • Compliance Reports                                         │
│  • Audit Reports                                              │
│  • Executive Dashboards                                       │
│  • Custom Analytics                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Network Security (Cloudflare)
├── DDoS Protection (Automatic)
├── WAF Rules (Custom + Managed)
├── Rate Limiting (API + Web)
└── SSL/TLS 1.3 (Automatic)

Layer 2: Application Security
├── Authentication Middleware
│   ├── Session-based auth
│   ├── JWT tokens (stateless)
│   └── Cookie security (httpOnly, secure, sameSite)
│
├── Authorization (RBAC)
│   ├── Role: admin (full access)
│   ├── Role: risk_manager (risk + compliance)
│   ├── Role: compliance_officer (compliance only)
│   ├── Role: analyst (read-only)
│   └── Role: user (limited access)
│
├── Input Validation
│   ├── SQL injection prevention (parameterized queries)
│   ├── XSS protection (sanitization)
│   ├── CSRF tokens (state validation)
│   └── Request size limits
│
└── Data Encryption
    ├── At rest: Database encryption
    ├── In transit: TLS/HTTPS
    └── Sensitive fields: bcrypt hashing (passwords)

Layer 3: Database Security
├── Foreign Key Constraints (referential integrity)
├── Prepared Statements (SQL injection prevention)
├── Row-Level Security (future enhancement)
└── Audit Logging (all modifications tracked)

Layer 4: Monitoring & Compliance
├── Audit Logs (all user actions)
├── API Request Logs (performance + security)
├── Health Checks (availability monitoring)
└── Anomaly Detection (future AI-powered)
```

---

## 🚀 Deployment Strategies

### Strategy 1: Blue-Green Deployment (Current)
```
Production (Blue) ──────► aria51.pages.dev
                          │
                          ├─► Always active
                          └─► Rollback available

New Deployment (Green) ──► [unique-id].aria51.pages.dev
                          │
                          ├─► Test in isolation
                          └─► Promote when ready

Process:
1. Deploy new version to unique URL
2. Test thoroughly on unique URL
3. If successful, promote to production
4. Previous version remains for rollback
```

### Strategy 2: Canary Deployment (Future)
```
Production (90%) ────► aria51.pages.dev (current)
Canary (10%) ────────► aria51.pages.dev (new version)

Gradual rollout:
10% → 25% → 50% → 75% → 100%

Monitor metrics at each stage:
- Error rates
- Response times
- User feedback
```

### Strategy 3: Feature Flags (Future)
```
All Users ──────► aria51.pages.dev
                  │
                  ├─► Feature A: enabled for all
                  ├─► Feature B: enabled for 50%
                  └─► Feature C: enabled for beta users

Database table: feature_flags
Control from admin panel
```

---

## 📈 Scalability Architecture

```
Current Capacity (Free Tier):
├── D1 Database: 100,000 reads/day, 1,000 writes/day
├── Workers: 100,000 requests/day
├── Pages: Unlimited bandwidth
└── R2 Storage: 10 GB/month

Scaling Path:
├── Tier 1 (Current): Free tier - Development/Small teams
│   └── Capacity: ~3,000 requests/day sustained
│
├── Tier 2 (Growth): Workers Paid ($5/mo)
│   ├── 10M requests/month
│   ├── D1: 5M reads, 50K writes/month
│   └── Capacity: ~300,000 requests/day
│
├── Tier 3 (Enterprise): Custom pricing
│   ├── Unlimited requests
│   ├── Dedicated support
│   ├── SLA guarantees
│   └── Custom optimizations
│
└── Scaling Strategies:
    ├── Horizontal: Multiple Workers (automatic)
    ├── Caching: KV namespace for hot data
    ├── CDN: Static assets on Pages
    └── Database: Read replicas (D1 feature)
```

---

## 🔧 Configuration Management

```
Environment: Production
├── wrangler.jsonc
│   ├── Project: aria51
│   ├── Database: aria51-production (8c465a3b-...)
│   ├── R2 Bucket: aria51-bucket
│   ├── Compatibility: 2025-01-01
│   └── Node.js compat: enabled
│
├── Environment Variables (Cloudflare Secrets)
│   ├── JWT_SECRET (required)
│   ├── OPENAI_API_KEY (optional)
│   ├── ANTHROPIC_API_KEY (optional)
│   ├── GEMINI_API_KEY (optional)
│   ├── MICROSOFT_TENANT_ID (optional)
│   ├── MICROSOFT_CLIENT_ID (optional)
│   └── MICROSOFT_CLIENT_SECRET (optional)
│
└── Build Configuration
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 📊 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                              │
└─────────────────────────────────────────────────────────────────┘

Application Monitoring:
├── Health Endpoint: /health
│   ├── Database connectivity
│   ├── API availability
│   └── System status
│
├── Metrics Collection:
│   ├── Request count (api_request_logs)
│   ├── Response times (avg_response_time_ms)
│   ├── Error rates (failed_requests)
│   └── API health (api_health_checks)
│
└── Real-time Logs:
    └── wrangler pages deployment tail

Cloudflare Analytics:
├── Web Analytics (Pages)
│   ├── Page views
│   ├── Unique visitors
│   └── Geographical distribution
│
├── Workers Analytics
│   ├── Request volume
│   ├── CPU time
│   └── Errors and exceptions
│
└── D1 Analytics
    ├── Query performance
    ├── Read/write operations
    └── Storage usage

Custom Monitoring:
├── Audit Logs Review
├── Risk Score Trends
├── User Activity Patterns
└── API Usage Analytics
```

---

## 🎯 Performance Optimization

```
Current Performance:
├── Page Load: < 2 seconds (target: < 1s)
├── API Response: < 500ms (target: < 200ms)
├── Database Query: < 100ms (target: < 50ms)
└── Build Size: 1.86 MB (target: < 2 MB)

Optimization Strategies:
├── Frontend:
│   ├── Code splitting (route-based)
│   ├── Lazy loading (components)
│   ├── Asset compression (gzip/brotli)
│   └── CDN caching (static assets)
│
├── Backend:
│   ├── Database indexing (45+ indexes)
│   ├── Query optimization (prepared statements)
│   ├── Connection pooling (D1 automatic)
│   └── Response caching (KV namespace)
│
└── Network:
    ├── HTTP/2 (Cloudflare automatic)
    ├── Edge caching (Cloudflare CDN)
    ├── Smart routing (Argo)
    └── Compression (automatic)
```

---

## 📁 File Structure

```
/home/user/webapp/
├── src/
│   ├── index-htmx.ts          # Main application entry
│   ├── routes/                # Route handlers
│   ├── middleware/            # Auth, CORS, etc.
│   ├── services/              # Business logic
│   └── utils/                 # Helper functions
│
├── migrations/
│   ├── 0001_complete_schema.sql      # Core schema
│   └── 0113_api_management.sql       # API management
│
├── dist/                      # Build output
│   └── _worker.js             # Compiled bundle
│
├── docs/                      # Documentation
├── public/                    # Static assets
│
├── wrangler.jsonc             # Cloudflare config
├── package.json               # Dependencies
├── vite.config.ts             # Build config
│
└── Deployment Files:
    ├── deploy-production.sh         # Auto deployment
    ├── verify-database.sh           # DB verification
    ├── PRODUCTION_DEPLOYMENT_GUIDE.md
    ├── DEPLOYMENT_QUICK_START.md
    ├── DEPLOYMENT_SUMMARY.md
    └── DEPLOYMENT_ARCHITECTURE.md (this file)
```

---

## 🔄 CI/CD Pipeline (Future Enhancement)

```
GitHub Actions Workflow:
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Trigger Workflow   │
│  • On: push to main │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Build & Test       │
│  • npm install      │
│  • npm run build    │
│  • npm test         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Database Migration │
│  • Apply migrations │
│  • Verify schema    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Deploy to Staging  │
│  • Test environment │
│  • Smoke tests      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Deploy to Prod     │
│  • Blue-green       │
│  • Health checks    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Verify & Monitor   │
│  • Run tests        │
│  • Check metrics    │
│  • Send alerts      │
└─────────────────────┘
```

---

## 📞 Support & Resources

### Quick Links
- **Production**: https://aria51.pages.dev
- **Health**: https://aria51.pages.dev/health
- **Dashboard**: https://dash.cloudflare.com/
- **GitHub**: https://github.com/theblackhat55/ARIA5-HTMX

### Documentation
- Architecture (this file)
- Deployment Guide
- Quick Start Guide
- API Documentation
- User Guide

---

**Last Updated**: October 22, 2025  
**Version**: 5.1.0  
**Status**: Production Architecture  
**Maintained By**: ARIA5 Development Team

© 2025 ARIA5 Platform - Enterprise Security Intelligence
