# Cloudflare Pages Bindings Configuration Required

## Issue
The Integration Marketplace feature requires database access (`c.env.DB`) but Cloudflare Pages doesn't automatically configure bindings from `wrangler.jsonc`.

**Error:** `500 Internal Server Error` on `/integrations` route

## Root Cause
Cloudflare Pages bindings (D1, KV, R2, AI, Vectorize) must be configured manually in the Cloudflare Dashboard. They are NOT automatically applied from `wrangler.jsonc` when using `wrangler pages deploy`.

## Solution: Configure Bindings in Cloudflare Dashboard

### Step 1: Go to Cloudflare Dashboard
1. Navigate to: https://dash.cloudflare.com/
2. Select your account
3. Go to **Workers & Pages**
4. Click on **aria51a** project

### Step 2: Configure Production Bindings
1. Click on **Settings** tab
2. Scroll to **Functions** section
3. Click **Add binding** for each required service:

#### D1 Database Binding
- **Variable name:** `DB`
- **D1 database:** `aria51a-production`
- **Database ID:** `0abfed35-8f17-45ad-af91-ec9956dbc44c`

#### KV Namespace Binding
- **Variable name:** `KV`
- **KV namespace:** Select the KV namespace
- **Namespace ID:** `fc0d95b57d8e4e36a3d2cfa26f981955`

#### R2 Bucket Binding
- **Variable name:** `R2`
- **R2 bucket:** `aria51a-bucket`

#### AI Binding (Cloudflare Workers AI)
- **Variable name:** `AI`
- **Type:** Workers AI

#### Vectorize Binding
- **Variable name:** `VECTORIZE`
- **Index name:** `aria51-mcp-vectors`

### Step 3: Configure Preview Bindings (Optional)
Repeat the same configuration under **Preview** bindings tab for preview deployments.

### Step 4: Save and Redeploy
1. Click **Save** on all bindings
2. Bindings will be available on next deployment
3. The existing deployment at `https://ad66b2a3.aria51a.pages.dev` should start working immediately

## Verification
After configuring bindings, test the integration marketplace:
```bash
# Should return 302 redirect to /login (expected for unauthenticated user)
curl -I https://ad66b2a3.aria51a.pages.dev/integrations

# After login, should return 200 OK with marketplace page
curl -I https://ad66b2a3.aria51a.pages.dev/integrations -H "Cookie: aria_token=YOUR_TOKEN"
```

## Current Status
- ✅ Database migrations applied to production
- ✅ Code deployed to Cloudflare Pages
- ❌ **Bindings NOT configured** (causing 500 error)
- ⏳ **Action Required:** Configure bindings in dashboard

## Production URLs
- **Production:** https://aria51a.pages.dev
- **Latest Deployment:** https://ad66b2a3.aria51a.pages.dev
- **GitHub:** https://github.com/theblackhat55/aria51a

## Alternative: Use Cloudflare Workers (Not Pages)
If you prefer CLI-based deployment with automatic binding configuration, consider deploying as a Cloudflare Worker instead of Pages. Workers support bindings via `wrangler.toml` and `wrangler deploy` command.
