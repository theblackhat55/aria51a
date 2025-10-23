# ARIA5.1 MCP Server - Complete Deployment Guide

**Version**: Phase 3 Complete  
**Date**: 2025-10-23  
**Status**: Ready for Production Deployment

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Setup](#cloudflare-setup)
3. [Local Development Setup](#local-development-setup)
4. [Data Indexing](#data-indexing)
5. [Production Deployment](#production-deployment)
6. [Testing & Validation](#testing--validation)
7. [Webhook Integration](#webhook-integration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### **Required**
- [x] Cloudflare account with Pages/Workers enabled
- [x] Node.js 20+ and npm installed
- [x] Wrangler CLI (`npm install -g wrangler`)
- [x] Git repository access
- [x] API token with required permissions

### **Required Cloudflare Permissions**
Your API token must have these permissions:
- ✅ **Account** → **Vectorize** → **Edit** (Read & Write)
- ✅ **Account** → **D1** → **Edit**
- ✅ **Account** → **Workers KV Storage** → **Edit**
- ✅ **Account** → **Workers R2 Storage** → **Edit**
- ✅ **Account** → **Workers Scripts** → **Edit**
- ✅ **Account** → **Pages** → **Edit**

**To configure permissions**:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Find your Wrangler API token (or create new)
3. Click **Edit** → Add missing permissions
4. Save changes

---

## 🔧 Cloudflare Setup

### **Step 1: Create Vectorize Index**

```bash
# Navigate to project directory
cd /home/user/webapp

# Create Vectorize index for semantic search
npx wrangler vectorize create aria51-mcp-vectors \
  --dimensions=768 \
  --metric=cosine

# Expected output:
# ✅ Successfully created index aria51-mcp-vectors
# 📋 Index ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**⚠️ If this fails with "Authentication error [code: 10000]":**
- Your API token lacks Vectorize permissions
- Follow the "Required Cloudflare Permissions" section above
- Retry after permissions are updated

### **Step 2: Create KV Namespace for Caching**

```bash
# Create production KV namespace
npx wrangler kv:namespace create MCP_CACHE

# Create preview KV namespace (for local dev)
npx wrangler kv:namespace create MCP_CACHE --preview

# Copy the IDs from output and update wrangler.jsonc:
# "kv_namespaces": [
#   {
#     "binding": "KV",
#     "id": "YOUR_PRODUCTION_KV_ID_HERE",
#     "preview_id": "YOUR_PREVIEW_KV_ID_HERE"
#   }
# ]
```

### **Step 3: Set Webhook Secret (Recommended)**

```bash
# Generate secure random secret
SECRET=$(openssl rand -hex 32)
echo "Generated secret: $SECRET"

# Set in Cloudflare Workers
npx wrangler secret put WEBHOOK_SECRET
# Paste the secret when prompted

# Save the secret securely (you'll need it for webhook configuration)
```

### **Step 4: Verify D1 Database**

```bash
# List D1 databases
npx wrangler d1 list

# Should show: aria51a-production

# Test database connection
npx wrangler d1 execute aria51a-production --local \
  --command="SELECT COUNT(*) as count FROM risks"
```

---

## 💻 Local Development Setup

### **1. Clone & Install**

```bash
# Clone repository
git clone <your-repo-url>
cd webapp

# Install dependencies (with 300s timeout)
npm install

# Verify TypeScript compilation
npx tsc --noEmit
```

### **2. Configure Environment**

Create `.dev.vars` file for local development:

```bash
cat > .dev.vars << 'EOF'
# Local development variables
WEBHOOK_SECRET=your-local-secret-for-testing
# Add other secrets as needed
EOF
```

### **3. Build Project**

```bash
# Build for local testing
npm run build

# Expected output:
# ✓ built in XXXms
# dist/_worker.js created
```

### **4. Start Local Development Server**

```bash
# Kill any existing processes on port 3000
fuser -k 3000/tcp 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 logs --nostream

# Test local server
curl http://localhost:3000/health
```

---

## 📊 Data Indexing

### **Important: Index Existing Data Before Production Use**

The MCP server requires existing data to be indexed into Vectorize for semantic search to work.

### **Option 1: Batch Index All Data (Recommended)**

```bash
# Index all namespaces (risks, incidents, compliance, documents)
npx tsx src/mcp-server/scripts/batch-indexer.ts all

# Expected output:
# 📊 Starting risk indexing...
# Found 245 risks to index
# ✅ Indexed 50 risks
# ✅ Indexed 50 risks
# ...
# ✅ Risk indexing completed
#    Processed: 245
#    Successful: 243
#    Failed: 2
```

**Estimated Time**:
- Risks (245 records): ~5 minutes
- Incidents (189 records): ~4 minutes
- Compliance (456 records): ~9 minutes
- Documents (78 docs): ~6 minutes
- **Total: ~25 minutes**

### **Option 2: Index Specific Namespaces**

```bash
# Index only risks
npx tsx src/mcp-server/scripts/batch-indexer.ts risks

# Index only incidents
npx tsx src/mcp-server/scripts/batch-indexer.ts incidents

# Index only compliance controls
npx tsx src/mcp-server/scripts/batch-indexer.ts compliance

# Index only documents
npx tsx src/mcp-server/scripts/batch-indexer.ts documents
```

### **Option 3: Dry Run (Test Without Indexing)**

```bash
# See what would be indexed without actually doing it
npx tsx src/mcp-server/scripts/batch-indexer.ts all --dry-run
```

### **Verify Indexing**

```bash
# Check Vectorize index stats
curl http://localhost:3000/mcp/stats

# Expected response:
# {
#   "dimensions": 768,
#   "metric": "cosine",
#   "recordCount": 968,  // Total vectors indexed
#   "namespaces": {
#     "risks": 245,
#     "incidents": 189,
#     "compliance": 456,
#     "documents": 78
#   }
# }
```

---

## 🚀 Production Deployment

### **Step 1: Final Build**

```bash
# Clean build
rm -rf dist .wrangler
npm run build

# Verify build output
ls -lh dist/
# Should see: _worker.js, _routes.json, and static assets
```

### **Step 2: Deploy to Cloudflare Pages**

```bash
# Deploy to production
npm run deploy

# Or with explicit project name
npx wrangler pages deploy dist --project-name aria51a

# Expected output:
# ✨ Success! Uploaded XXX files
# ✨ Deployment complete!
# 🌎 https://aria51a.pages.dev
# 🌎 https://main.aria51a.pages.dev
```

### **Step 3: Verify Deployment**

```bash
# Health check
curl https://aria51a.pages.dev/health

# MCP health
curl https://aria51a.pages.dev/mcp/health

# List MCP tools
curl https://aria51a.pages.dev/mcp/tools

# Expected: 13 tools listed
```

### **Step 4: Test Semantic Search**

```bash
# Test risk search
curl -X POST https://aria51a.pages.dev/mcp/tools/search_risks_semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ransomware threats",
    "topK": 5
  }'

# Expected: List of relevant risks with semantic scores

# Test cross-namespace correlation
curl -X POST https://aria51a.pages.dev/mcp/tools/correlate_across_namespaces \
  -H "Content-Type: application/json" \
  -d '{
    "query": "data breach incidents",
    "namespaces": ["risks", "incidents", "compliance"]
  }'
```

---

## 🧪 Testing & Validation

### **1. Health Checks**

```bash
# Application health
curl https://aria51a.pages.dev/health

# MCP server health
curl https://aria51a.pages.dev/mcp/health

# Webhook health
curl https://aria51a.pages.dev/webhooks/health

# Auto-indexing stats
curl https://aria51a.pages.dev/webhooks/health | jq '.autoIndexing'
```

### **2. Semantic Search Tests**

#### **Test 1: Risk Search**
```bash
curl -X POST https://aria51a.pages.dev/mcp/tools/search_risks_semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cybersecurity vulnerabilities",
    "topK": 10,
    "filters": {
      "risk_level": ["high", "critical"]
    }
  }' | jq '.'
```

#### **Test 2: Incident Search**
```bash
curl -X POST https://aria51a.pages.dev/mcp/tools/search_threats_semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "phishing attacks",
    "topK": 5,
    "filters": {
      "severity": ["high", "critical"]
    }
  }' | jq '.'
```

#### **Test 3: Compliance Search**
```bash
curl -X POST https://aria51a.pages.dev/mcp/tools/search_compliance_semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "access control requirements",
    "topK": 10
  }' | jq '.'
```

#### **Test 4: Document Search**
```bash
curl -X POST https://aria51a.pages.dev/mcp/tools/search_documents_semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "incident response procedures",
    "topK": 5,
    "group_by_document": true
  }' | jq '.'
```

### **3. Correlation Tests**

```bash
# Cross-namespace correlation
curl -X POST https://aria51a.pages.dev/mcp/tools/correlate_across_namespaces \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ransomware",
    "namespaces": ["risks", "incidents", "compliance", "documents"],
    "topK_per_namespace": 5
  }' | jq '.'

# Security intelligence dashboard
curl -X POST https://aria51a.pages.dev/mcp/tools/get_security_intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "cloud security",
    "time_range_days": 90,
    "include_trends": true
  }' | jq '.'
```

### **4. Cache Performance Tests**

```bash
# First query (should be cache MISS)
time curl -X POST https://aria51a.pages.dev/mcp/tools/search_risks_semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "data encryption", "topK": 10}'

# Repeat same query (should be cache HIT - much faster)
time curl -X POST https://aria51a.pages.dev/mcp/tools/search_risks_semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "data encryption", "topK": 10}'

# Get cache statistics
curl https://aria51a.pages.dev/mcp/cache/stats | jq '.'
```

---

## 🔗 Webhook Integration

### **Configure ARIA5.1 to Send Webhooks**

Add webhook calls after data modifications in your application:

#### **Example: Risk Creation**

```typescript
// In your risk creation handler
async function createRisk(riskData: any) {
  // 1. Save to database
  const result = await db.insert(risks).values(riskData);
  const newRisk = result[0];
  
  // 2. Trigger webhook for real-time indexing
  await fetch('https://aria51a.pages.dev/webhooks/data-change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': generateHMAC(JSON.stringify({
        namespace: 'risks',
        recordId: newRisk.id,
        operation: 'insert',
        data: newRisk
      }), WEBHOOK_SECRET)
    },
    body: JSON.stringify({
      namespace: 'risks',
      recordId: newRisk.id,
      operation: 'insert',
      data: newRisk
    })
  });
  
  return newRisk;
}

// HMAC signature generation
function generateHMAC(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}
```

#### **Example: Batch Updates**

```typescript
// After bulk operation
async function bulkUpdateIncidents(incidentIds: number[]) {
  // 1. Update in database
  await db.update(incidents)
    .set({ status: 'resolved' })
    .where(inArray(incidents.id, incidentIds));
  
  // 2. Trigger batch webhook
  await fetch('https://aria51a.pages.dev/webhooks/data-change-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      changes: incidentIds.map(id => ({
        namespace: 'incidents',
        recordId: id,
        operation: 'update'
      }))
    })
  });
}
```

### **Test Webhook Integration**

```bash
# Test single webhook
curl -X POST https://aria51a.pages.dev/webhooks/data-change \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "risks",
    "recordId": 123,
    "operation": "update"
  }'

# Test batch webhook
curl -X POST https://aria51a.pages.dev/webhooks/data-change-batch \
  -H "Content-Type: application/json" \
  -d '{
    "changes": [
      {"namespace": "risks", "recordId": 123, "operation": "update"},
      {"namespace": "incidents", "recordId": 456, "operation": "update"}
    ]
  }'

# Manual reindex trigger
curl -X POST https://aria51a.pages.dev/webhooks/trigger-reindex \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "risks",
    "recordId": 123
  }'
```

---

## 📈 Monitoring & Maintenance

### **1. Cache Statistics**

```bash
# Get cache performance metrics
curl https://aria51a.pages.dev/mcp/cache/stats

# Expected response:
{
  "totalQueries": 1250,
  "cacheHits": 875,
  "cacheMisses": 375,
  "hitRate": "70.0%",
  "avgLatencySaved": 560,
  "byNamespace": {
    "risks": { "hits": 420, "misses": 180 },
    "incidents": { "hits": 210, "misses": 95 },
    "compliance": { "hits": 155, "misses": 65 },
    "documents": { "hits": 90, "misses": 35 }
  }
}
```

### **2. Vectorize Statistics**

```bash
# Get index statistics
curl https://aria51a.pages.dev/mcp/stats

# Monitor index size and record counts
```

### **3. Auto-Indexing Monitoring**

```bash
# Check auto-indexing health
curl https://aria51a.pages.dev/webhooks/health

# Control polling (if needed)
curl -X POST https://aria51a.pages.dev/webhooks/polling/control \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### **4. Cache Maintenance**

```bash
# Clear all cache (after major data changes)
curl -X POST https://aria51a.pages.dev/mcp/cache/clear

# Invalidate specific namespace
curl -X POST https://aria51a.pages.dev/mcp/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"namespace": "risks"}'
```

---

## 🔍 Troubleshooting

### **Problem: Vectorize Index Creation Fails**

**Error**: `Authentication error [code: 10000]`

**Solution**:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Edit your Wrangler API token
3. Add permission: **Account → Vectorize → Edit**
4. Save and retry: `npx wrangler vectorize create aria51-mcp-vectors --dimensions=768 --metric=cosine`

### **Problem: Semantic Search Returns No Results**

**Possible Causes**:
1. Data not indexed yet
2. Vectorize index not created
3. Query embedding generation failed

**Solution**:
```bash
# 1. Verify index exists
npx wrangler vectorize list

# 2. Check record count
curl https://aria51a.pages.dev/mcp/stats

# 3. Run batch indexer
npx tsx src/mcp-server/scripts/batch-indexer.ts all

# 4. Test again
curl -X POST https://aria51a.pages.dev/mcp/tools/search_risks_semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "topK": 5}'
```

### **Problem: Cache Not Working**

**Check KV Namespace**:
```bash
# List KV namespaces
npx wrangler kv:namespace list

# Verify binding in wrangler.jsonc
grep -A5 "kv_namespaces" wrangler.jsonc

# Test KV write/read
npx wrangler kv:key put "test" "value" --namespace-id=YOUR_KV_ID
npx wrangler kv:key get "test" --namespace-id=YOUR_KV_ID
```

### **Problem: Webhooks Not Triggering**

**Debug Steps**:
1. Check webhook secret configuration
2. Verify HMAC signature generation
3. Test without signature (development)
4. Check webhook health endpoint

```bash
# Test webhook without signature
curl -X POST http://localhost:3000/webhooks/data-change \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "risks",
    "recordId": 999,
    "operation": "update"
  }'

# Check logs
pm2 logs --nostream
```

### **Problem: Slow Query Performance**

**Optimization Steps**:
1. Enable caching (should be default)
2. Check cache hit rate
3. Optimize query parameters
4. Consider namespace-specific TTLs

```bash
# Check cache stats
curl https://aria51a.pages.dev/mcp/cache/stats

# Expected hit rate: 60-70%
# If < 50%, adjust TTLs in config
```

---

## 📞 Support & Next Steps

### **Post-Deployment**
1. ✅ Monitor cache hit rates (target: 60-70%)
2. ✅ Verify webhook integration working
3. ✅ Test semantic search accuracy
4. ✅ Gather user feedback
5. ✅ Adjust cache TTLs based on usage patterns

### **Ongoing Maintenance**
- Weekly: Review cache statistics
- Monthly: Reindex data if schema changes
- Quarterly: Optimize query performance based on logs
- As needed: Invalidate cache after bulk updates

### **Getting Help**
- Check documentation: `/MCP_*.md` files
- Review logs: `pm2 logs`
- Test endpoints: Use provided curl commands
- Report issues: Include error messages and steps to reproduce

---

**Deployment Guide Version**: 1.0  
**Last Updated**: 2025-10-23  
**MCP Server Version**: Phase 3 Complete  
**Production Ready**: ✅ YES
