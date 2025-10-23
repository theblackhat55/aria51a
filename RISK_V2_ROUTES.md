# 📍 Risk Module v2 Route Documentation

**Base URL**: `/risk-v2/`  
**Architecture**: Clean Architecture with HTMX-powered UI  
**Total Routes**: 20 routes (9 UI + 11 API)

---

## 🌐 Main Entry Point

### GET `/risk-v2/`
**Description**: Main Risk Management Dashboard  
**Type**: Full HTML page  
**Features**: HTMX-powered single-page application with real-time updates  
**Authentication**: Required  
**URL**: https://0a3e2bb0.aria51a.pages.dev/risk-v2/

**What you see:**
- Statistics cards (Critical, High, Medium, Low risk counts)
- Risk table with pagination
- Filter controls (Category, Status, Risk Level)
- Search bar
- Action buttons (Create, Import, Export)

---

## 📊 UI Routes (HTMX Endpoints)

These routes return HTML fragments for dynamic page updates via HTMX.

### 1. GET `/risk-v2/stats`
**Description**: Real-time statistics cards  
**Returns**: HTML fragment with 4 statistic cards  
**Refresh**: Auto-refreshes every 30 seconds via HTMX  

**Example Response:**
```html
<div class="grid grid-cols-4 gap-4">
  <div class="stat-card">Critical: 18</div>
  <div class="stat-card">High: 32</div>
  <div class="stat-card">Medium: 43</div>
  <div class="stat-card">Low: 24</div>
</div>
```

---

### 2. GET `/risk-v2/table`
**Description**: Risk table with pagination, filters, and sorting  
**Returns**: HTML table fragment  

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Current page number |
| `pageSize` | number | 10 | Items per page |
| `category` | string | - | Filter by category (cybersecurity, operational, technology, compliance, financial) |
| `status` | string | - | Filter by status (active, pending, mitigated, monitoring, accepted, under_review) |
| `riskLevel` | string | - | Filter by level (Critical, High, Medium, Low) |
| `search` | string | - | Search in title, description, category, owner |
| `sortBy` | string | created_at | Sort column (title, category, probability, impact, risk_score, status, owner_name, created_at) |
| `sortOrder` | string | desc | Sort order (asc, desc) |

**Example URLs:**
```
# Default table (page 1, 10 items)
/risk-v2/table

# Filtered by category
/risk-v2/table?category=cybersecurity

# Filtered and sorted
/risk-v2/table?category=cybersecurity&status=active&sortBy=risk_score&sortOrder=desc

# Search with pagination
/risk-v2/table?search=data breach&page=2
```

---

### 3. GET `/risk-v2/create`
**Description**: Create Risk modal form  
**Returns**: HTML form in modal  

**Form Fields:**
- Title (required, max 200 chars)
- Description (optional, textarea)
- Category (dropdown: 5 options)
- Subcategory (text, optional)
- Probability (1-5 scale)
- Impact (1-5 scale)
- Status (dropdown: 6 options)
- Owner (user dropdown)
- Review Date (date picker)
- Source (text, optional)

**Automatic Calculation:**
- Risk Score = Probability × Impact
- Risk Level = Auto-assigned based on score

---

### 4. GET `/risk-v2/view/:id`
**Description**: View Risk details modal (read-only)  
**Returns**: HTML modal with risk details  

**Parameters:**
- `id` (path param) - Risk ID

**Example:**
```
GET /risk-v2/view/1
GET /risk-v2/view/117
```

**Displays:**
- All risk fields (read-only)
- Risk ID (RISK-00001 format)
- Calculated risk score and level
- Owner name
- Creation/update timestamps

---

### 5. GET `/risk-v2/edit/:id`
**Description**: Edit Risk modal form  
**Returns**: HTML form pre-filled with risk data  

**Parameters:**
- `id` (path param) - Risk ID

**Features:**
- Pre-filled form
- Real-time risk score calculation
- Validation
- Update confirmation

---

### 6. GET `/risk-v2/status/:id`
**Description**: Status change modal with comments  
**Returns**: HTML form for status update  

**Parameters:**
- `id` (path param) - Risk ID

**Form Fields:**
- New Status (dropdown)
- Comment (optional, textarea)
- Reason for change

---

### 7. GET `/risk-v2/import`
**Description**: CSV Import modal  
**Returns**: HTML form for CSV upload  

**Features:**
- File upload input (CSV only)
- Template download button
- Import instructions
- Validation preview

**CSV Format:**
- Columns: title, description, category, subcategory, probability, impact, status, owner_id, review_date, source
- Header row required
- UTF-8 encoding

---

### 8. GET `/risk-v2/score/:probability/:impact`
**Description**: Risk score calculation display  
**Returns**: HTML fragment with calculated score  

**Parameters:**
- `probability` (path param) - 1-5
- `impact` (path param) - 1-5

**Example:**
```
GET /risk-v2/score/4/5
Returns: <div>Risk Score: 20 (Critical)</div>
```

---

## 🔌 API Routes (JSON Endpoints)

These routes return JSON data for programmatic access.

### 1. POST `/risk-v2/api/create`
**Description**: Create new risk  
**Content-Type**: `application/json`  
**Authentication**: Required  

**Request Body:**
```json
{
  "title": "Data Breach Through Third-Party Vendor",
  "description": "Potential unauthorized access to customer data...",
  "category": "cybersecurity",
  "subcategory": "Third-Party Risk",
  "probability": 4,
  "impact": 5,
  "status": "active",
  "ownerId": 6,
  "reviewDate": "2025-12-31",
  "source": "Risk Assessment"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 118,
    "riskId": "RISK-00118",
    "title": "Data Breach Through Third-Party Vendor",
    "riskScore": 20,
    "riskLevel": "Critical",
    "createdAt": "2025-10-23T08:00:00Z"
  }
}
```

---

### 2. GET `/risk-v2/api/list`
**Description**: List risks with filters and pagination  
**Authentication**: Required  

**Query Parameters:** Same as table route

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "riskId": "RISK-00001",
        "title": "Data Breach Through Third-Party Vendor",
        "category": "cybersecurity",
        "probability": 4,
        "impact": 5,
        "riskScore": 20,
        "riskLevel": "Critical",
        "status": "active",
        "ownerName": "Sarah Johnson"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 117,
      "totalPages": 12
    }
  }
}
```

---

### 3. GET `/risk-v2/api/:id`
**Description**: Get single risk by ID  
**Authentication**: Required  

**Example:**
```bash
GET /risk-v2/api/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "riskId": "RISK-00001",
    "title": "Data Breach Through Third-Party Vendor",
    "description": "Detailed description...",
    "category": "cybersecurity",
    "subcategory": "Third-Party Risk",
    "probability": 4,
    "impact": 5,
    "riskScore": 20,
    "riskLevel": "Critical",
    "status": "active",
    "ownerId": 6,
    "ownerName": "Sarah Johnson",
    "reviewDate": "2025-12-31",
    "source": "Risk Assessment",
    "createdAt": "2025-09-15T10:30:00Z",
    "updatedAt": "2025-10-20T14:20:00Z"
  }
}
```

---

### 4. PUT `/risk-v2/api/:id`
**Description**: Update existing risk  
**Content-Type**: `application/json`  
**Authentication**: Required  

**Request Body:** (partial updates supported)
```json
{
  "status": "mitigated",
  "probability": 2,
  "impact": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "riskScore": 6,
    "riskLevel": "Medium",
    "updatedAt": "2025-10-23T08:15:00Z"
  }
}
```

---

### 5. DELETE `/risk-v2/api/:id`
**Description**: Delete risk  
**Authentication**: Required  

**Example:**
```bash
DELETE /risk-v2/api/118
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Risk deleted successfully"
}
```

---

### 6. GET `/risk-v2/api/statistics`
**Description**: Get risk statistics  
**Authentication**: Required  

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalRisks": 117,
    "criticalCount": 18,
    "highCount": 32,
    "mediumCount": 43,
    "lowCount": 24,
    "activeCount": 89,
    "mitigatedCount": 15
  }
}
```

---

### 7. GET `/risk-v2/api/search`
**Description**: Search risks  
**Authentication**: Required  

**Query Parameters:**
- `q` (required) - Search query
- `page` (optional) - Page number
- `pageSize` (optional) - Items per page

**Example:**
```bash
GET /risk-v2/api/search?q=data breach&page=1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "riskId": "RISK-00001",
        "title": "Data Breach Through Third-Party Vendor",
        "highlightedText": "...Data <mark>Breach</mark>..."
      }
    ],
    "total": 5
  }
}
```

---

### 8. POST `/risk-v2/api/import`
**Description**: Import risks from CSV  
**Content-Type**: `multipart/form-data`  
**Authentication**: Required  

**Form Data:**
- `file` (required) - CSV file

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "imported": 15,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "Missing required field: title"
      },
      {
        "row": 7,
        "error": "Invalid probability value: must be 1-5"
      }
    ]
  }
}
```

---

### 9. GET `/risk-v2/api/export`
**Description**: Export risks to CSV  
**Authentication**: Required  
**Response Type**: `text/csv`  

**Example:**
```bash
GET /risk-v2/api/export?category=cybersecurity
```

**Response Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="risks_export_2025-10-23.csv"
```

---

### 10. GET `/risk-v2/api/template`
**Description**: Download CSV import template  
**Authentication**: Required  
**Response Type**: `text/csv`  

**Returns:**
CSV file with header row and one example row for reference.

---

### 11. GET `/risk-v2/api/health`
**Description**: Health check endpoint  
**Authentication**: Not required  

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Risk Management v2",
  "timestamp": "2025-10-23T08:00:00Z"
}
```

---

## 🎯 Key Features

### HTMX Integration
- **Real-time updates**: Statistics auto-refresh every 30 seconds
- **No page refresh**: All interactions use HTMX for smooth UX
- **Partial updates**: Only changed portions of UI update
- **Loading states**: Built-in loading indicators

### Pagination
- **Default**: 10 items per page
- **Current dataset**: 117 risks = 12 pages
- **Configurable**: Change pageSize via query param

### Filtering
**5 Categories:**
- Cybersecurity
- Operational
- Technology
- Compliance
- Financial

**6 Statuses:**
- Active
- Pending
- Mitigated
- Monitoring
- Accepted
- Under Review

**5 Risk Levels:**
- Critical (20-25)
- High (12-19)
- Medium (6-11)
- Low (1-5)

### Sorting
**8 Sortable Columns:**
1. Title
2. Category
3. Probability
4. Impact
5. Risk Score
6. Status
7. Owner Name
8. Created Date

### Search
**Multi-field search across:**
- Risk title
- Description
- Category
- Subcategory
- Owner name

### Import/Export
- **CSV format**: Standard comma-separated
- **Validation**: Client and server-side
- **Error reporting**: Row-level error details
- **Template**: Downloadable example file

### Risk Scoring
- **Formula**: Probability × Impact
- **Range**: 1-25
- **Auto-calculation**: Updated on probability/impact change
- **Visual indicators**: Color-coded by level

---

## 📋 Example Workflows

### Create a Risk
```javascript
// 1. Open create modal (HTMX loads form)
// User clicks "Create Risk" button

// 2. Fill form and submit
fetch('/risk-v2/api/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Security Risk',
    category: 'cybersecurity',
    probability: 4,
    impact: 5,
    status: 'active',
    ownerId: 6
  })
});

// 3. Table auto-refreshes via HTMX
// Statistics cards auto-update
```

### Filter and Search
```javascript
// User selects filters
// HTMX automatically calls:
GET /risk-v2/table?category=cybersecurity&status=active&search=breach&page=1

// Table updates with filtered results
// Pagination reflects new total
```

### Import Risks
```javascript
// 1. Download template
GET /risk-v2/api/template

// 2. Fill template with data

// 3. Upload via modal
POST /risk-v2/api/import
FormData: { file: risks.csv }

// 4. View import results
// See success count and errors
```

---

## 🔗 Quick Links

- **Live Dashboard**: https://0a3e2bb0.aria51a.pages.dev/risk-v2/
- **GitHub Repository**: https://github.com/theblackhat55/aria51a
- **Complete Documentation**: `DAY_12_ROUTE_DOCUMENTATION.md`
- **Testing Guide**: `DAY_10_BROWSER_TEST_SCRIPT.md`

---

## ✨ Summary

**Risk Module v2** provides a complete HTMX-powered risk management interface with:
- ✅ 9 UI routes for interactive interface
- ✅ 11 API routes for programmatic access
- ✅ Real-time statistics and updates
- ✅ Advanced filtering and search
- ✅ CSV import/export
- ✅ Clean Architecture implementation
- ✅ 100% feature parity with ARIA5

**Ready for production use!**
