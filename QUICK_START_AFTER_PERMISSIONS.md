# Quick Start Guide - After Adding Workers AI Permissions

## 🎯 You're Almost There!

Once you've added **"Account → Workers AI → Edit"** permissions to your Cloudflare API token, follow these simple steps to complete Phase 3.

---

## Step 1: Verify Permissions (2 minutes)

```bash
cd /home/user/webapp
npx tsx test-vectorize.ts
```

**Success Looks Like**:
```
✅ Generated embedding with 768 dimensions
   First 5 values: [0.0234, -0.0156, 0.0423...]
✅ Vectors inserted successfully
✅ Found 1 similar vectors
✅ All tests passed! Vectorize is working correctly.
```

**If you see "Authentication error 10000"**: The permission wasn't added correctly. Double-check you added **Workers AI → Edit** (not just Read).

---

## Step 2: Index Your Data (15 minutes)

### 2a. Ensure Server is Running
```bash
pm2 list  # Check if aria51a is online
# If not running:
pm2 start ecosystem.config.cjs
```

### 2b. Login to Get Session Cookie
```bash
curl -c /tmp/cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=demo123"
```

### 2c. Index All Data
```bash
# This will index: 117 risks + incidents + compliance + documents
curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/admin/batch-index \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "all",
    "batchSize": 50,
    "dryRun": false
  }' | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "namespace": "all",
  "result": {
    "risks": {
      "processed": 117,
      "successful": 117,
      "failed": 0
    },
    "incidents": { ... },
    "compliance": { ... },
    "documents": { ... }
  }
}
```

**This may take 10-20 minutes**. You can check progress:
```bash
pm2 logs aria51a --nostream --lines 50
```

---

## Step 3: Test Semantic Search (5 minutes)

### Test 1: Risk Search
```bash
curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ransomware attack on financial systems",
    "type": "risks",
    "topK": 5
  }' | jq '.result.items[0:3] | .[] | {title, relevance}'
```

**You should see** risks ranked by semantic similarity with relevance scores like "87.5%".

### Test 2: Threat Intelligence
```bash
curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/tools/search_threats_semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "phishing campaign targeting executives",
    "topK": 3
  }' | jq '.result.incidents[0:2]'
```

### Test 3: Cross-Namespace Correlation
```bash
curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/tools/correlate_across_namespaces \
  -H "Content-Type: application/json" \
  -d '{
    "query": "data breach response",
    "namespaces": ["risks", "incidents", "compliance", "documents"]
  }' | jq '.result.statistics'
```

**You should see** results from all 4 namespaces with correlation statistics.

---

## Step 4: Verify Query Caching (2 minutes)

Run the same query twice:
```bash
# First query (cache miss)
time curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/search \
  -H "Content-Type: application/json" \
  -d '{"query": "data breach", "type": "risks", "topK": 5}' > /dev/null

# Second query (cache hit - should be faster)
time curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/search \
  -H "Content-Type: application/json" \
  -d '{"query": "data breach", "type": "risks", "topK": 5}' > /dev/null
```

**The second query should be ~80% faster** due to KV caching.

---

## Step 5: Check MCP Health (1 minute)

```bash
curl -b /tmp/cookies.txt http://localhost:3000/mcp/health | jq '.'
```

**Success Looks Like**:
```json
{
  "status": "healthy",
  "services": {
    "database": true,
    "vectorize": true,
    "workersAI": true  ← Should now be true!
  }
}
```

---

## Step 6: Test Webhook Auto-Indexing (Optional, 5 minutes)

### 6a. Add a New Risk via Database
```bash
npx wrangler d1 execute aria51a-production --local --command="
  INSERT INTO risks (title, description, category, probability, impact, inherent_risk, status)
  VALUES ('Test Risk - API Vulnerability', 'Testing auto-indexing webhook', 'Technology', 4, 4, 16, 'active')
"
```

### 6b. Trigger Webhook
```bash
# Generate HMAC signature (use WEBHOOK_SECRET from .dev.vars)
curl -b /tmp/cookies.txt -X POST http://localhost:3000/webhooks/data-change \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: YOUR_HMAC_SIGNATURE" \
  -d '{
    "namespace": "risks",
    "recordId": 118,
    "operation": "insert"
  }'
```

### 6c. Verify Auto-Indexed
```bash
curl -b /tmp/cookies.txt -X POST http://localhost:3000/mcp/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API vulnerability testing",
    "type": "risks",
    "topK": 3
  }' | jq '.result.items[] | select(.title | contains("Test Risk"))'
```

**Your new risk should appear in search results** without manual reindexing!

---

## Step 7: Deploy to Production (Optional, 10 minutes)

```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Or deploy with specific project name
npx wrangler pages deploy dist --project-name aria51a
```

**After deployment**, update your API calls to use production URL:
```
https://aria51a.pages.dev/mcp/search
```

---

## 🎉 That's It!

You now have a fully functional MCP server with:
- ✅ Semantic search across 4 data sources
- ✅ 13 intelligent tools for security operations
- ✅ Real-time auto-indexing via webhooks
- ✅ Query caching for 80% performance boost
- ✅ Cross-namespace correlation for comprehensive intel

---

## Need Help?

**Documentation**:
- `DEPLOYMENT_GUIDE.md` - Full deployment procedures
- `MCP_PHASE3_TEST_RESULTS.md` - Complete test results
- `VECTORIZE_TEST_SUMMARY.md` - Quick testing summary
- `MCP_PHASE3_FINAL_STATUS.md` - Detailed status report

**Troubleshooting**:
- If authentication fails: Check cookie was saved correctly
- If indexing slow: Reduce batchSize from 50 to 20
- If searches return no results: Verify indexing completed successfully
- If Workers AI still fails: Double-check API token permissions

**Quick Debug**:
```bash
# Check server logs
pm2 logs aria51a --nostream --lines 100

# Test Workers AI directly
npx tsx test-vectorize.ts

# Verify Vectorize has data
curl -b /tmp/cookies.txt http://localhost:3000/mcp/stats | jq '.'
```

---

**Estimated Total Time**: 30-40 minutes from start to finish

**Ready?** Start with Step 1: `npx tsx test-vectorize.ts`
