# URL Corrections for ARIA5.1 Platform

**Date**: 2025-01-23  
**Issue**: User reported 404 errors for AI providers and risk-v2 pages

---

## ✅ CORRECTED URLs

### 1. AI Providers Configuration Page

**❌ Incorrect URL** (404 Error):
```
/ai-providers
```

**✅ Correct URL**:
```
/admin/ai-providers
```

**Why**: The AI providers configuration page is an **administrative function** and is located under the `/admin` route prefix, which requires admin role access.

**Access Requirements**:
- ✅ Must be logged in
- ✅ Must have admin role
- ✅ Route: `/admin/ai-providers`

**How to Access**:
1. Log in with admin account: `admin / demo123`
2. Navigate to Admin dashboard: Click "Admin" in navigation menu
3. Click "AI Providers" card or visit `/admin/ai-providers`

**Features Available**:
- Configure OpenAI (GPT-4, GPT-3.5)
- Configure Anthropic (Claude models)
- Configure Google Gemini
- Configure Azure OpenAI
- Configure Cloudflare Workers AI
- Test provider connections
- Save API keys securely
- View provider status

**Code Reference**:
- **File**: `src/routes/admin-routes-aria5.ts`
- **Line**: 146 - `app.get('/ai-providers', async (c) => {`
- **Registration**: `src/index-secure.ts` line ~384 - `app.route('/admin', createAdminRoutesARIA5())`

---

### 2. Risk Management v2 (Clean Architecture)

**❌ Incorrect URL** (404 Error):
```
/risk-v2
```

**✅ Correct URLs**:

#### UI Routes (HTMX/HTML):
```
/risk-v2/ui          → Main risk list page
/risk-v2/ui/create   → Create new risk
/risk-v2/ui/edit/:id → Edit existing risk
```

#### API Routes (JSON):
```
/risk-v2/api/list       → GET risks (JSON)
/risk-v2/api/create     → POST create risk (JSON)
/risk-v2/api/update/:id → PUT update risk (JSON)
/risk-v2/api/delete/:id → DELETE risk (JSON)
```

**Why**: The risk-v2 implementation uses **Clean Architecture** with separate API and UI routes. The bare `/risk-v2` path automatically redirects to `/risk-v2/ui/`.

**Access Requirements**:
- ✅ Must be logged in
- ✅ Any authenticated user can access
- ✅ UI Routes: `/risk-v2/ui/*`
- ✅ API Routes: `/risk-v2/api/*`

**How to Access**:
1. Log in with any demo account (e.g., `admin / demo123`)
2. Visit `/risk-v2/ui` directly OR
3. Click "Risk Management v2" if available in navigation

**Architecture**:
```
/risk-v2/
├── ui/              → HTMX/HTML responses (human interface)
│   ├── /            → List all risks
│   ├── /create      → Create risk form
│   └── /edit/:id    → Edit risk form
└── api/             → JSON responses (programmatic interface)
    ├── /list        → GET risks
    ├── /create      → POST create
    ├── /update/:id  → PUT update
    └── /delete/:id  → DELETE delete
```

**Code Reference**:
- **Module**: `src/modules/risk/presentation/routes/`
- **Files**: 
  - `index.ts` - Route exports
  - API routes in `api-routes.ts`
  - UI routes in `ui-routes.ts`
- **Registration**: `src/index-secure.ts` lines ~359-363:
  ```typescript
  app.get('/risk-v2', (c) => c.redirect('/risk-v2/ui'))
  app.get('/risk-v2/', (c) => c.redirect('/risk-v2/ui/'))
  app.route('/risk-v2/api', createRiskRoutesV2())
  app.route('/risk-v2/ui', createRiskUIRoutes())
  ```

---

## 🔍 How to Verify URLs

### Method 1: Direct Browser Access
```
https://aria51.pages.dev/admin/ai-providers
https://aria51.pages.dev/risk-v2/ui
```

### Method 2: Using curl (Local Development)
```bash
# AI Providers (requires admin authentication)
curl -s "http://localhost:3000/admin/ai-providers" \
  -H "Cookie: aria_token=YOUR_VALID_TOKEN"

# Risk v2 UI (requires any authentication)
curl -s "http://localhost:3000/risk-v2/ui" \
  -H "Cookie: aria_token=YOUR_VALID_TOKEN"
```

### Method 3: Browser Developer Tools
1. Open browser developer tools (F12)
2. Go to Network tab
3. Visit the URL
4. Check response:
   - **200 OK**: URL is correct and working
   - **404 Not Found**: URL is incorrect
   - **401 Unauthorized**: Need to log in
   - **403 Forbidden**: Need appropriate role/permissions

---

## 📋 Complete URL Map

### Public URLs (No Authentication)
```
/                      → Landing page
/login                 → Login page
/demo                  → Platform demo
/health                → Health check API
```

### Protected URLs (Authentication Required)
```
/dashboard             → Main dashboard
/risk                  → Risk management (original)
/risk-v2/ui            → Risk management v2 (Clean Architecture)
/compliance            → Compliance management
/operations            → Operations center
/ai                    → AI assistant
/intelligence          → Intelligence dashboard
/ms-defender           → Microsoft Defender integration
```

### Admin URLs (Admin Role Required)
```
/admin                 → Admin dashboard
/admin/ai-providers    → AI provider configuration
/admin/api-management  → API management
/admin/smtp-settings   → SMTP configuration
/admin/users           → User management
```

### API Endpoints
```
/api/*                 → Various API endpoints (auth required)
/mcp/*                 → MCP server endpoints (auth required)
/webhooks/*            → Webhook endpoints (HMAC verified)
/risk-v2/api/*         → Risk v2 API endpoints (auth required)
```

---

## 🛠️ Troubleshooting

### Issue: "404 Not Found"
**Possible Causes**:
1. ❌ Using incorrect URL path
2. ❌ Missing route prefix (e.g., `/admin` for AI providers)
3. ❌ Typo in URL

**Solution**:
- Check this document for correct URLs
- Ensure proper route prefix is included
- Verify URL spelling

### Issue: "401 Unauthorized" or Redirect to Login
**Possible Causes**:
1. ❌ Not logged in
2. ❌ Session expired
3. ❌ Invalid authentication token

**Solution**:
- Log in with valid credentials
- Use demo accounts: `admin / demo123`
- Check that cookies are enabled

### Issue: "403 Forbidden"
**Possible Causes**:
1. ❌ Insufficient permissions (e.g., trying to access admin page without admin role)
2. ❌ CSRF token missing/invalid

**Solution**:
- Log in with appropriate role (use `admin / demo123` for admin pages)
- Ensure CSRF token is present for POST/PUT/DELETE requests

---

## 📝 Navigation Menu Updates Needed

**Recommendation**: Update the navigation menu to include correct links:

```html
<!-- Admin Menu -->
<a href="/admin/ai-providers">AI Providers</a>

<!-- Risk Menu -->
<a href="/risk-v2/ui">Risk Management v2</a>
```

**Implementation Location**: 
- `src/templates/layout-clean.ts` or equivalent layout template
- Add to admin dropdown or main navigation as appropriate

---

## ✅ Summary

| Feature | Incorrect URL | Correct URL | Access Level |
|---------|--------------|-------------|--------------|
| AI Providers | `/ai-providers` | `/admin/ai-providers` | Admin |
| Risk v2 UI | `/risk-v2` | `/risk-v2/ui` | Authenticated |
| Risk v2 API | `/risk-v2` | `/risk-v2/api/*` | Authenticated |

**Key Takeaway**: Both features exist and work correctly, but require proper URL paths with appropriate prefixes (`/admin` for admin features, `/ui` or `/api` for risk-v2).

---

**Generated**: 2025-01-23  
**Document Status**: Complete  
**Action Required**: Update navigation menus with correct URLs
