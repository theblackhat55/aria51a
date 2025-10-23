# Risk Module v2 Routes Overview

**Base Path**: `/risk-v2/`  
**Architecture**: Clean Architecture with CQRS pattern  
**Authentication**: Required for all routes (session-based)  
**CSRF Protection**: Enabled for all state-changing operations

---

## 🎯 Route Structure

The `/risk-v2/` route is split into two main categories:

### 1. **API Routes** (`/risk-v2/api/*`)
JSON-based REST API endpoints for programmatic access

### 2. **UI Routes** (`/risk-v2/ui/*`)
HTMX-powered HTML endpoints for interactive web interface

---

## 📍 Complete Route Map

### UI Routes (`/risk-v2/ui/*`)

#### **Main Page**
```
GET /risk-v2/ui/
```
**Description**: Main risk management dashboard page  
**Returns**: Full HTML page with risk management interface  
**Features**:
- Statistics cards (Total, Critical, High, Medium risks)
- Risk table with filtering and search
- Create, Edit, Delete actions
- Import/Export functionality

---

#### **HTMX Dynamic Endpoints**

##### Statistics Cards
```
GET /risk-v2/ui/stats
```
**Description**: Real-time risk statistics  
**Returns**: HTML fragment with 4 statistics cards  
**Auto-refresh**: Every 30 seconds via HTMX  
**Data**:
- Total risks count
- Critical risks count (score 20-25)
- High risks count (score 12-19)
- Medium risks count (score 6-11)

##### Risk Table
```
GET /risk-v2/ui/table
```
**Description**: Paginated risk table with filters  
**Returns**: HTML table rows with risk data  
**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `search` - Search term (title, description, category, owner)
- `category` - Filter by category (cybersecurity, operational, etc.)
- `status` - Filter by status (active, pending, mitigated, etc.)
- `riskLevel` - Filter by risk level (Critical, High, Medium, Low)
- `sortBy` - Sort field (created_at, risk_score, etc.)
- `sortOrder` - Sort direction (asc, desc)

**Features**:
- Pagination (10 items per page)
- Real-time filtering
- Multi-field search
- Sortable columns
- HTMX-powered updates (no page reload)

##### Create Risk Modal
```
GET /risk-v2/ui/create
```
**Description**: Modal form to create new risk  
**Returns**: HTML modal with risk creation form  
**Fields**:
- Title (required)
- Category (required)
- Subcategory
- Description
- Probability (1-5)
- Impact (1-5)
- Status (active, pending, etc.)
- Owner
- Mitigation plan
- Review date
- Tags

##### View Risk Modal
```
GET /risk-v2/ui/view/:id
```
**Description**: Modal displaying risk details  
**Returns**: HTML modal with read-only risk information  
**Displays**:
- All risk fields
- Risk score and level (color-coded)
- Created/updated timestamps
- Owner information

##### Edit Risk Modal
```
GET /risk-v2/ui/edit/:id
```
**Description**: Modal form to edit existing risk  
**Returns**: HTML modal with pre-populated form  
**Fields**: Same as create modal, pre-filled with current values

##### Status Change Modal
```
GET /risk-v2/ui/status/:id
```
**Description**: Quick status change modal  
**Returns**: HTML modal with status dropdown  
**Purpose**: Fast status updates without full edit form

##### Calculate Risk Score
```
POST /risk-v2/ui/calculate-score
```
**Description**: Real-time risk score calculation  
**Body**: `{ "probability": 1-5, "impact": 1-5 }`  
**Returns**: HTML with calculated score and level  
**Formula**: `score = probability × impact`  
**Levels**:
- Critical: 20-25 (red)
- High: 12-19 (orange)
- Medium: 6-11 (yellow)
- Low: 1-5 (green)

##### Import Risks
```
GET /risk-v2/ui/import
POST /risk-v2/ui/import
```
**GET**: Returns import modal with upload form  
**POST**: Processes CSV file upload  
**Features**:
- CSV file validation
- Duplicate detection (by title)
- Error reporting with line numbers
- Batch import support

##### Import Template
```
GET /risk-v2/ui/import/template
```
**Description**: Download CSV template for import  
**Returns**: CSV file with correct headers and example data  
**Headers**: All 18 risk fields

##### Export Risks
```
POST /risk-v2/ui/export
```
**Description**: Export risks to CSV  
**Body**: `{ filters... }` (optional)  
**Returns**: CSV file download  
**Includes**: All risks matching current filters  
**Fields**: All 18 risk fields

---

### API Routes (`/risk-v2/api/*`)

#### **CRUD Operations**

##### Create Risk
```
POST /risk-v2/api/create
```
**Body**:
```json
{
  "title": "New Risk",
  "category": "cybersecurity",
  "subcategory": "data-breach",
  "description": "Risk description",
  "probability": 4,
  "impact": 5,
  "status": "active",
  "ownerId": 6,
  "mitigation_plan": "Mitigation steps",
  "review_date": "2025-12-31",
  "tags": "critical,security"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 118,
    "riskId": "RISK-00118",
    "riskScore": 20,
    "riskLevel": "Critical",
    ...
  }
}
```

##### Get Risk by ID
```
GET /risk-v2/api/:id
```
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "riskId": "RISK-00001",
    "title": "Data Breach Through Third-Party Vendor",
    "category": "cybersecurity",
    ...
  }
}
```

##### Update Risk
```
PUT /risk-v2/api/update/:id
```
**Body**: Partial or full risk object  
**Response** (200 OK):
```json
{
  "success": true,
  "data": { /* updated risk */ }
}
```

##### Delete Risk
```
DELETE /risk-v2/api/delete/:id
```
**Response** (204 No Content):
```json
{
  "success": true,
  "message": "Risk deleted successfully"
}
```

---

#### **Query Operations**

##### List All Risks
```
GET /risk-v2/api/list
```
**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search term
- `category`, `status`, `riskLevel` - Filters
- `sortBy`, `sortOrder` - Sorting

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [ /* array of risks */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 117,
      "totalPages": 12
    }
  }
}
```

##### Get Statistics
```
GET /risk-v2/api/stats
```
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalRisks": 117,
    "criticalRisks": 18,
    "highRisks": 32,
    "mediumRisks": 43,
    "lowRisks": 24
  }
}
```

##### Search Risks
```
POST /risk-v2/api/search
```
**Body**:
```json
{
  "query": "data breach",
  "fields": ["title", "description", "category"]
}
```
**Response**: List of matching risks

---

#### **Bulk Operations**

##### Bulk Create
```
POST /risk-v2/api/bulk/create
```
**Body**: Array of risk objects  
**Response**: Array of created risks with results

##### Bulk Update
```
PUT /risk-v2/api/bulk/update
```
**Body**: Array of risk updates  
**Response**: Array of update results

##### Bulk Delete
```
DELETE /risk-v2/api/bulk/delete
```
**Body**: Array of risk IDs  
**Response**: Delete results

---

#### **Import/Export**

##### Import Risks (API)
```
POST /risk-v2/api/import
```
**Body**: Multipart form data with CSV file  
**Response**:
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "skipped": 5,
    "errors": [
      { "line": 12, "error": "Invalid category" }
    ]
  }
}
```

##### Export Risks (API)
```
GET /risk-v2/api/export
```
**Query Parameters**: Same as list filters  
**Response**: CSV file stream

##### Download Template (API)
```
GET /risk-v2/api/export/template
```
**Response**: CSV template file

---

#### **Utility Routes**

##### Health Check
```
GET /risk-v2/api/health
```
**Response** (200 OK):
```json
{
  "status": "healthy",
  "module": "risk-v2",
  "timestamp": "2025-10-23T08:00:00.000Z"
}
```

---

## 🔒 Security Features

### Authentication
- **All routes require authentication** (session-based)
- Unauthenticated requests redirect to `/login`
- Session cookie: `auth_session`

### CSRF Protection
**Protected routes**:
- `/risk-v2/api/create`
- `/risk-v2/api/update/*`
- `/risk-v2/api/delete/*`
- `/risk-v2/ui/create`
- `/risk-v2/ui/edit/*`
- `/risk-v2/ui/status/*`

**Implementation**:
- CSRF token in session
- Token validation on state-changing operations
- Token refresh on login

### Authorization
- Basic authentication: All authenticated users can access
- Future: Role-based access control (RBAC) can be added

---

## 🎨 UI Features (HTMX)

### Real-time Updates
- **Statistics cards**: Auto-refresh every 30 seconds
- **Table updates**: Instant filter/search results
- **No page reloads**: All updates via HTMX

### Modals
- Create, View, Edit, Status change modals
- Slide-in from right animation
- Close on background click or X button
- Form validation before submission

### Filtering & Search
- **5 Categories**: cybersecurity, operational, technology, compliance, financial
- **6 Statuses**: active, pending, mitigated, monitoring, accepted, under_review
- **5 Risk Levels**: Critical, High, Medium, Low, All
- **Multi-field search**: Title, description, category, owner
- **Real-time updates**: Results appear instantly

### Import/Export
- **CSV Import**: Drag & drop or file picker
- **Validation**: Real-time error checking
- **Duplicate detection**: Skip or warn
- **Template download**: Pre-formatted CSV
- **Export**: Current filtered view or all risks

---

## 📊 Data Model

### Risk Entity
```typescript
{
  id: number;                    // Auto-increment
  riskId: string;                // Human-readable (RISK-00001)
  title: string;                 // Required
  category: string;              // Required
  subcategory?: string;
  description?: string;
  probability: number;           // 1-5
  impact: number;                // 1-5
  riskScore: number;             // probability × impact
  riskLevel: string;             // Critical, High, Medium, Low
  status: string;                // active, pending, etc.
  ownerId?: number;
  ownerName?: string;            // Joined from users table
  mitigation_plan?: string;
  review_date?: string;          // ISO date
  tags?: string;                 // Comma-separated
  organizationId?: number;
  createdBy?: number;
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  source?: string;               // manual, import, api
}
```

### Risk Score Calculation
```
Score = Probability (1-5) × Impact (1-5)
Total Range: 1-25

Levels:
- Critical: 20-25 (red badge)
- High: 12-19 (orange badge)
- Medium: 6-11 (yellow badge)
- Low: 1-5 (green badge)
```

---

## 🔗 Integration with ARIA5

### Current Setup
- **Path**: `/risk-v2/*` (parallel to ARIA5 `/risk/*`)
- **Purpose**: Testing and validation
- **Coexistence**: Both systems run simultaneously

### Future Switchover
When ready for production:
1. Mount Risk v2 routes to `/risk/*` path
2. Move ARIA5 routes to `/risk-legacy/*` or remove
3. Update navigation links
4. Rollback plan: < 5 minutes (see `DAY_12_SWITCHOVER_STRATEGY.md`)

---

## 📝 Testing

### Demo Users
**Login credentials** (all passwords: `demo123`):
- sarah.johnson@aria5.com (Risk Manager)
- michael.chen@aria5.com (Compliance Officer)
- emily.rodriguez@aria5.com (Security Analyst)
- david.kim@aria5.com (IT Manager)
- lisa.martinez@aria5.com (CISO)
- And 5 more...

### Test Data
- **117 risks** pre-loaded
- **18 Critical** risks (RISK-00001 to RISK-00018)
- **32 High** risks (RISK-00019 to RISK-00050)
- **43 Medium** risks (RISK-00051 to RISK-00093)
- **24 Low** risks (RISK-00094 to RISK-00117)

### Test Procedures
See `DAY_10_BROWSER_TEST_SCRIPT.md` for:
- 20 comprehensive test cases
- HTMX interaction testing
- Performance validation
- Edge case scenarios

---

## 🚀 Performance

### Metrics
- **Query time**: < 100ms (all database queries)
- **Page load**: ~260ms
- **Filter/search**: < 50ms (HTMX updates)
- **Import**: ~2-5 seconds for 100 risks
- **Export**: < 1 second for 117 risks

### Scalability
- **Current**: 117 risks (excellent performance)
- **1,000 risks**: < 500ms expected
- **10,000 risks**: 1-2 seconds expected

---

## 📖 Additional Documentation

- **Complete API Reference**: `DAY_12_ROUTE_DOCUMENTATION.md`
- **Feature Parity Analysis**: `DAY_10_FEATURE_PARITY_ANALYSIS.md`
- **Testing Guide**: `DAY_10_BROWSER_TEST_SCRIPT.md`
- **Performance Results**: `DAY_11_LARGE_DATASET_TEST_RESULTS.md`
- **Deployment Strategy**: `DAY_12_SWITCHOVER_STRATEGY.md`
- **Deployment Checklist**: `DAY_12_PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

## 🎯 Quick Access

**Production URL**: https://0a3e2bb0.aria51a.pages.dev/risk-v2/  
**Login**: sarah.johnson@aria5.com / demo123  
**GitHub**: https://github.com/theblackhat55/aria51a

---

**Last Updated**: October 23, 2025  
**Status**: ✅ Production Ready
