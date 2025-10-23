# Risk Module v2 - Complete Route Documentation

**Date**: 2025-10-23  
**Version**: 2.0.0  
**Architecture**: Clean Architecture with CQRS

---

## 📋 **Table of Contents**

1. [UI Routes](#ui-routes) - HTMX-powered user interface
2. [API Routes](#api-routes) - RESTful JSON API
3. [Route Comparison](#route-comparison) - ARIA5 vs v2
4. [Authentication](#authentication) - Auth requirements
5. [Error Handling](#error-handling) - Error responses
6. [Examples](#examples) - Usage examples

---

## 🎨 **UI Routes** (HTMX-Powered)

Base Path: `/risk-v2/ui/`

### **Main Page**

#### `GET /risk-v2/ui/`
**Purpose**: Main risk management dashboard  
**Auth**: Required  
**Returns**: HTML page with HTMX components  
**Features**:
- Statistics cards (auto-load via HTMX)
- Risk table with filters
- Search functionality
- Pagination controls
- Create/Import/Export buttons

**HTMX Behavior**:
- Statistics cards load via `hx-get="/risk-v2/ui/stats"`
- Risk table loads via `hx-get="/risk-v2/ui/table"`
- No full page reloads

---

### **Statistics**

#### `GET /risk-v2/ui/stats`
**Purpose**: Load statistics cards (HTMX endpoint)  
**Auth**: Required  
**Returns**: HTML fragment with 5 stat cards  
**Trigger**: `hx-trigger="load"` (auto-load on page load)

**Response Format**:
```html
<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
  <div class="stat-card">Total Risks: 117</div>
  <div class="stat-card">Critical: 18</div>
  <div class="stat-card">High: 32</div>
  <div class="stat-card">Medium: 43</div>
  <div class="stat-card">Low: 24</div>
</div>
```

---

### **Risk Table**

#### `GET /risk-v2/ui/table`
**Purpose**: Load risk table with filters (HTMX endpoint)  
**Auth**: Required  
**Returns**: HTML fragment with risk table  
**Trigger**: `hx-trigger="load"` (auto-load) or filter changes

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status (active, pending, mitigated, etc.) |
| `category` | string | all | Filter by category (cybersecurity, operational, etc.) |
| `riskLevel` | string | all | Filter by risk level (Critical, High, Medium, Low) |
| `search` | string | - | Search in title and description |
| `sortBy` | string | created_at | Sort field (title, risk_score, status, etc.) |
| `sortOrder` | string | desc | Sort direction (asc, desc) |
| `page` | number | 1 | Page number (1-based) |
| `limit` | number | 10 | Items per page |

**Example**:
```
GET /risk-v2/ui/table?status=active&category=cybersecurity&riskLevel=Critical&page=1&limit=10
```

**Response**: HTML table with risk rows, pagination, and HTMX attributes

---

### **Create Risk**

#### `GET /risk-v2/ui/create`
**Purpose**: Show create risk modal (HTMX endpoint)  
**Auth**: Required  
**Returns**: HTML modal form  
**Trigger**: Button click with `hx-get="/risk-v2/ui/create"`

**Form Fields**:
- risk_id (auto-generated, read-only)
- title (required)
- description (required)
- category (dropdown, required)
- subcategory (text)
- probability (1-5, required)
- impact (1-5, required)
- status (dropdown, default: active)
- owner_id (dropdown, users)
- organization_id (dropdown, organizations)
- review_date (date picker)
- source (text)
- tags (text)
- mitigation_plan (textarea)

**Live Features**:
- Risk score calculation (probability × impact)
- Risk level badge updates (Critical/High/Medium/Low)
- Debounced input (300ms delay)

**Submission**:
- `hx-post="/risk-v2/api/create"`
- `hx-swap="none"` (closes modal, refreshes table)

---

### **View Risk**

#### `GET /risk-v2/ui/view/:id`
**Purpose**: Show risk details modal (read-only)  
**Auth**: Required  
**Returns**: HTML modal with risk details  
**Trigger**: Click "View" button with `hx-get="/risk-v2/ui/view/{id}"`

**Displays**:
- All risk fields (read-only)
- Color-coded risk level badge
- Status badge with icon
- Owner name (not just ID)
- Formatted dates
- Action buttons (Edit, Change Status, Delete)

---

### **Edit Risk**

#### `GET /risk-v2/ui/edit/:id`
**Purpose**: Show edit risk modal (HTMX endpoint)  
**Auth**: Required  
**Returns**: HTML modal form with pre-populated values  
**Trigger**: Click "Edit" button with `hx-get="/risk-v2/ui/edit/{id}"`

**Features**:
- risk_id field (read-only, non-editable)
- All fields pre-populated
- Live score calculation
- Owner name displayed
- Review date formatted for input (YYYY-MM-DD)

**Submission**:
- `hx-put="/risk-v2/api/{id}"`
- `hx-swap="none"` (closes modal, refreshes table)

---

### **Change Status**

#### `GET /risk-v2/ui/status/:id`
**Purpose**: Show status change modal  
**Auth**: Required  
**Returns**: HTML modal form  
**Trigger**: Click "Change Status" button

**Features**:
- Current status displayed (disabled in dropdown)
- New status selection
- Optional reason textarea
- Status change history (if implemented)

**Submission**:
- `hx-patch="/risk-v2/api/{id}/status"`
- `hx-swap="none"` (closes modal, updates status badge)

---

### **Live Score Calculation**

#### `POST /risk-v2/ui/calculate-score`
**Purpose**: Calculate risk score in real-time  
**Auth**: Required (but called from authenticated pages)  
**Returns**: HTML input field with calculated score  
**Trigger**: `hx-trigger="input changed delay:300ms"`

**Request Body** (form data):
- `probability`: 1-5
- `impact`: 1-5

**Response**:
```html
<input type="text" 
       name="risk_score" 
       value="20" 
       readonly
       class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
<div class="mt-2">
  <span class="px-2 py-1 rounded bg-red-100 text-red-800">Critical</span>
</div>
```

---

### **Import/Export**

#### `GET /risk-v2/ui/import`
**Purpose**: Show CSV import modal  
**Auth**: Required  
**Returns**: HTML modal with file upload form

**Features**:
- File input (accepts .csv)
- Download template link
- Skip duplicates checkbox
- Validate only checkbox

#### `GET /risk-v2/ui/import/template`
**Purpose**: Download CSV template  
**Auth**: Required  
**Returns**: CSV file download  
**Filename**: `risk_import_template.csv`

**Template Format**:
```csv
risk_id,title,description,category,subcategory,probability,impact,status,owner_id,organization_id,review_date,source,tags,mitigation_plan
RISK-SAMPLE-001,Sample Risk 1,Description,cybersecurity,data_breach,4,5,active,1,1,2025-02-28,Import Template,"security,high-priority","Implement MFA"
```

#### `POST /risk-v2/ui/import`
**Purpose**: Process CSV import  
**Auth**: Required  
**Content-Type**: multipart/form-data  
**Returns**: HTML result message

**Form Fields**:
- `file`: CSV file
- `skipDuplicates`: boolean (true/false)
- `validateOnly`: boolean (true/false)

**Response** (Success):
```html
<div class="p-4 bg-green-50 border border-green-200 rounded-md">
  <h4 class="font-medium text-green-900 mb-2">
    <i class="fas fa-check-circle mr-2"></i>Import Completed
  </h4>
  <p class="text-green-800">✓ 15 risks imported successfully</p>
  <p class="text-yellow-600">⊘ 2 duplicates skipped</p>
</div>
```

#### `POST /risk-v2/ui/export`
**Purpose**: Export risks to CSV  
**Auth**: Required  
**Content-Type**: application/x-www-form-urlencoded  
**Returns**: CSV file download

**Query Parameters** (filters):
- `status`: Filter by status
- `category`: Filter by category
- `riskLevel`: Filter by risk level
- `format`: Export format (default: csv)

**Response Headers**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="risks_export_2025-10-23.csv"
```

**CSV Columns**:
```
risk_id,title,description,category,subcategory,probability,impact,risk_score,risk_level,status,owner_id,organization_id,review_date,source,tags,mitigation_plan,created_at,updated_at
```

---

## 🔌 **API Routes** (RESTful JSON)

Base Path: `/risk-v2/api/`

### **Create Risk**

#### `POST /risk-v2/api/create`
**Purpose**: Create new risk  
**Auth**: Required  
**Content-Type**: application/json  
**Returns**: JSON with created risk

**Request Body**:
```json
{
  "title": "New Risk",
  "description": "Risk description",
  "category": "cybersecurity",
  "subcategory": "data_breach",
  "probability": 4,
  "impact": 5,
  "status": "active",
  "ownerId": 6,
  "organizationId": 1,
  "reviewDate": "2025-12-31",
  "source": "API",
  "tags": "security,high-priority",
  "mitigationPlan": "Implement controls"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 118,
    "riskId": "RISK-00118",
    "title": "New Risk",
    "description": "Risk description",
    "category": "cybersecurity",
    "subcategory": "data_breach",
    "probability": 4,
    "impact": 5,
    "riskScore": 20,
    "riskLevel": "Critical",
    "status": "active",
    "ownerId": 6,
    "organizationId": 1,
    "reviewDate": "2025-12-31",
    "source": "API",
    "tags": "security,high-priority",
    "mitigationPlan": "Implement controls",
    "createdAt": "2025-10-23T10:00:00Z",
    "updatedAt": "2025-10-23T10:00:00Z"
  }
}
```

---

### **Get Risk by ID**

#### `GET /risk-v2/api/:id`
**Purpose**: Retrieve risk by numeric ID  
**Auth**: Required  
**Returns**: JSON with risk details

**Example**: `GET /risk-v2/api/1`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "riskId": "RISK-00001",
    "title": "Data Breach Through Third-Party Vendor",
    "description": "Potential unauthorized access...",
    "category": "cybersecurity",
    "subcategory": "data_breach",
    "probability": 5,
    "impact": 5,
    "riskScore": 25,
    "riskLevel": "Critical",
    "status": "active",
    "ownerId": 6,
    "organizationId": 1,
    "reviewDate": "2025-11-22",
    "source": "Risk Assessment 2025-Q1",
    "tags": null,
    "mitigationPlan": null,
    "createdAt": "2025-10-23T08:00:00Z",
    "updatedAt": "2025-10-23T08:00:00Z"
  }
}
```

**Error** (404 Not Found):
```json
{
  "success": false,
  "error": "Risk not found"
}
```

---

### **Get Risk by Risk ID**

#### `GET /risk-v2/api/riskId/:riskId`
**Purpose**: Retrieve risk by risk_id (e.g., "RISK-00001")  
**Auth**: Required  
**Returns**: JSON with risk details

**Example**: `GET /risk-v2/api/riskId/RISK-00001`

**Response**: Same as Get Risk by ID

---

### **Update Risk**

#### `PUT /risk-v2/api/:id`
**Purpose**: Update existing risk  
**Auth**: Required  
**Content-Type**: application/json  
**Returns**: JSON with updated risk

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "probability": 3,
  "impact": 4,
  "status": "monitoring"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "riskId": "RISK-00001",
    "title": "Updated Title",
    "probability": 3,
    "impact": 4,
    "riskScore": 12,
    "riskLevel": "High",
    "status": "monitoring",
    "updatedAt": "2025-10-23T10:30:00Z"
  }
}
```

---

### **Change Risk Status**

#### `PATCH /risk-v2/api/:id/status`
**Purpose**: Change risk status only  
**Auth**: Required  
**Content-Type**: application/json  
**Returns**: JSON with updated risk

**Request Body**:
```json
{
  "status": "mitigated",
  "statusChangeReason": "Controls implemented and tested"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "riskId": "RISK-00001",
    "status": "mitigated",
    "updatedAt": "2025-10-23T10:45:00Z"
  }
}
```

---

### **Delete Risk**

#### `DELETE /risk-v2/api/:id`
**Purpose**: Delete risk (soft delete)  
**Auth**: Required  
**Returns**: JSON confirmation

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Risk deleted successfully"
}
```

#### `DELETE /risk-v2/api/riskId/:riskId`
**Purpose**: Delete risk by risk_id  
**Auth**: Required  
**Returns**: JSON confirmation

---

### **List Risks**

#### `GET /risk-v2/api/list`
**Purpose**: List risks with filters and pagination  
**Auth**: Required  
**Returns**: JSON with paginated results

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status |
| `category` | string | - | Filter by category |
| `riskLevel` | string | - | Filter by risk level |
| `ownerId` | number | - | Filter by owner |
| `organizationId` | number | - | Filter by organization |
| `sortBy` | string | created_at | Sort field |
| `sortOrder` | string | desc | Sort direction (asc/desc) |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Example**:
```
GET /risk-v2/api/list?status=active&category=cybersecurity&riskLevel=Critical&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "riskId": "RISK-00001",
        "title": "Data Breach...",
        "riskScore": 25,
        "riskLevel": "Critical",
        "status": "active"
      }
    ],
    "total": 18,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### **Search Risks**

#### `GET /risk-v2/api/search`
**Purpose**: Full-text search in risks  
**Auth**: Required  
**Returns**: JSON with matching risks

**Query Parameters**:
- `q`: Search query
- `page`: Page number
- `limit`: Items per page

**Example**: `GET /risk-v2/api/search?q=breach&page=1&limit=10`

**Response**: Same format as List Risks

---

### **Get Statistics**

#### `GET /risk-v2/api/statistics`
**Purpose**: Get risk statistics  
**Auth**: Required  
**Returns**: JSON with aggregated stats

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalRisks": 117,
    "byLevel": {
      "Critical": 18,
      "High": 32,
      "Medium": 43,
      "Low": 24
    },
    "byStatus": {
      "active": 85,
      "monitoring": 13,
      "accepted": 8,
      "pending": 6,
      "mitigated": 3,
      "under_review": 2
    },
    "byCategory": {
      "operational": 41,
      "technology": 40,
      "cybersecurity": 24,
      "compliance": 11,
      "financial": 1
    },
    "criticalCount": 18,
    "highCount": 32,
    "needsAttention": 25,
    "overdueReviews": 12
  }
}
```

---

### **Get Critical Risks**

#### `GET /risk-v2/api/critical`
**Purpose**: Get only critical risks (score >= 20)  
**Auth**: Required  
**Returns**: JSON with critical risks

**Response**: Same format as List Risks, filtered to critical

---

### **Get Risks Needing Attention**

#### `GET /risk-v2/api/needs-attention`
**Purpose**: Get risks that need attention (active + critical/high)  
**Auth**: Required  
**Returns**: JSON with risks needing attention

---

### **Get Overdue Reviews**

#### `GET /risk-v2/api/overdue-reviews`
**Purpose**: Get risks with overdue review dates  
**Auth**: Required  
**Returns**: JSON with overdue risks

---

### **Bulk Operations**

#### `POST /risk-v2/api/bulk/create`
**Purpose**: Create multiple risks at once  
**Auth**: Required  
**Content-Type**: application/json  
**Returns**: JSON with results

**Request Body**:
```json
{
  "risks": [
    {
      "title": "Risk 1",
      "category": "cybersecurity",
      "probability": 3,
      "impact": 4
    },
    {
      "title": "Risk 2",
      "category": "operational",
      "probability": 2,
      "impact": 3
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "created": 2,
    "risks": [
      { "id": 118, "riskId": "RISK-00118", "title": "Risk 1" },
      { "id": 119, "riskId": "RISK-00119", "title": "Risk 2" }
    ]
  }
}
```

#### `DELETE /risk-v2/api/bulk/delete`
**Purpose**: Delete multiple risks  
**Auth**: Required  
**Content-Type**: application/json  
**Returns**: JSON with results

**Request Body**:
```json
{
  "ids": [118, 119, 120]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deleted": 3
  }
}
```

#### `PATCH /risk-v2/api/bulk/status`
**Purpose**: Update status for multiple risks  
**Auth**: Required  
**Content-Type**: application/json  
**Returns**: JSON with results

**Request Body**:
```json
{
  "ids": [1, 2, 3],
  "status": "mitigated",
  "reason": "Controls implemented"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "updated": 3
  }
}
```

---

### **Health Check**

#### `GET /risk-v2/api/health`
**Purpose**: Check API health  
**Auth**: Not required  
**Returns**: JSON with health status

**Response** (200 OK):
```json
{
  "success": true,
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-10-23T10:00:00Z"
}
```

---

## 🔄 **Route Comparison: ARIA5 vs v2**

| ARIA5 Route | Risk v2 Route | Notes |
|-------------|---------------|-------|
| `/risk/` | `/risk-v2/ui/` | Main page |
| `/risk/stats` | `/risk-v2/ui/stats` | Statistics HTMX |
| `/risk/table` | `/risk-v2/ui/table` | Table HTMX |
| `/risk/create` | `/risk-v2/ui/create` | Create modal |
| `/risk/view/:id` | `/risk-v2/ui/view/:id` | View modal |
| `/risk/edit/:id` | `/risk-v2/ui/edit/:id` | Edit modal |
| `/risk/status-change/:id` | `/risk-v2/ui/status/:id` | Status modal |
| `POST /risk/create` | `POST /risk-v2/api/create` | API endpoint |
| `POST /risk/edit/:id` | `PUT /risk-v2/api/:id` | API endpoint |
| `DELETE /risk/:id` | `DELETE /risk-v2/api/:id` | API endpoint |
| `/risk/import` | `/risk-v2/ui/import` | Import modal |
| `POST /risk/import` | `POST /risk-v2/ui/import` | Import process |
| `POST /risk/export` | `POST /risk-v2/ui/export` | Export CSV |
| N/A | `GET /risk-v2/api/list` | **New**: RESTful list |
| N/A | `GET /risk-v2/api/search` | **New**: Search API |
| N/A | `GET /risk-v2/api/statistics` | **New**: Stats API |
| N/A | `PATCH /risk-v2/api/:id/status` | **New**: Status API |
| N/A | `POST /risk-v2/api/bulk/*` | **New**: Bulk operations |

---

## 🔐 **Authentication**

All routes except `/risk-v2/api/health` require authentication.

**Authentication Method**: Session-based (cookies)

**Login Required**:
```
User must be logged in via /login endpoint
Session cookie must be present
```

**Unauthorized Response** (302 Redirect):
```
Location: /login
```

**API Unauthorized Response** (401):
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## ⚠️ **Error Handling**

### **HTTP Status Codes**:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### **Error Response Format**:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "Error details if applicable"
  }
}
```

### **Validation Errors** (400):
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "title": "Title is required",
    "probability": "Probability must be between 1 and 5",
    "impact": "Impact must be between 1 and 5"
  }
}
```

---

## 📚 **Examples**

### **Example 1: Create Risk via API**

```bash
curl -X POST http://localhost:3000/risk-v2/api/create \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "title": "API Test Risk",
    "description": "Created via API",
    "category": "technology",
    "subcategory": "api_security",
    "probability": 3,
    "impact": 3,
    "status": "active",
    "ownerId": 6,
    "organizationId": 1,
    "source": "API Test"
  }'
```

### **Example 2: List Filtered Risks**

```bash
curl -X GET "http://localhost:3000/risk-v2/api/list?status=active&category=cybersecurity&riskLevel=Critical&page=1&limit=5" \
  -H "Cookie: session=..."
```

### **Example 3: Search Risks**

```bash
curl -X GET "http://localhost:3000/risk-v2/api/search?q=breach&limit=10" \
  -H "Cookie: session=..."
```

### **Example 4: Update Risk Status**

```bash
curl -X PATCH http://localhost:3000/risk-v2/api/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "status": "mitigated",
    "statusChangeReason": "Controls implemented"
  }'
```

### **Example 5: Export Filtered Risks**

```bash
curl -X POST "http://localhost:3000/risk-v2/ui/export?status=active&category=cybersecurity" \
  -H "Cookie: session=..." \
  -o risks_export.csv
```

---

## 🎯 **Best Practices**

1. **Always include authentication** (session cookie or API key)
2. **Validate input** before sending requests
3. **Handle errors gracefully** with try-catch
4. **Use pagination** for large datasets (limit <= 100)
5. **Filter on server-side** instead of client-side
6. **Cache statistics** if querying frequently
7. **Use bulk operations** for multiple updates
8. **Monitor API rate limits** (if implemented)

---

**Version**: 2.0.0  
**Last Updated**: 2025-10-23  
**Architecture**: Clean Architecture + CQRS + Repository Pattern  
**Status**: ✅ Production Ready
