# Day 10: Browser Testing Script - HTMX Interactions

**Date**: 2025-10-23  
**Purpose**: Manual testing checklist for Risk Module v2 HTMX interactions  
**URL**: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev

---

## 🧪 **Pre-Test Setup**

### **1. Open Browser**
- Chrome/Firefox/Safari (latest version)
- Open Developer Tools (F12)
- Keep Network tab open to monitor HTMX requests

### **2. Login**
- Navigate to: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/login
- Username: `riskmanager`
- Password: `demo123`
- ✅ Verify redirect to dashboard

### **3. Navigate to Risk v2**
- Click "Risk Management" or navigate to `/risk-v2/ui/`
- ✅ Verify page loads without full reload

---

## 📋 **Test 1: Statistics Cards (HTMX Loading)**

**Endpoint**: `GET /risk-v2/ui/stats`  
**Trigger**: `hx-trigger="load"`  
**Expected**: Cards load automatically without page refresh

### **Steps**:
1. Open `/risk-v2/ui/`
2. **Watch Network tab** for `/risk-v2/ui/stats` request
3. **Verify**:
   - ✅ Loading placeholders display initially
   - ✅ Statistics cards replace placeholders
   - ✅ Total Risks count matches database (17)
   - ✅ Critical Risks count correct (3)
   - ✅ High Risks count correct (4)
   - ✅ No full page reload occurred
   - ✅ Request completes in < 500ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 2: Risk Table (HTMX Loading)**

**Endpoint**: `GET /risk-v2/ui/table`  
**Trigger**: `hx-trigger="load"`  
**Expected**: Table loads automatically with data

### **Steps**:
1. On main page, **watch Network tab** for `/risk-v2/ui/table` request
2. **Verify**:
   - ✅ Loading spinner/placeholder displays
   - ✅ Table replaces placeholder
   - ✅ All 17 risks display
   - ✅ risk_id column shows "RISK-00001", "RISK-00002", etc.
   - ✅ Owner column shows "David Martinez" NOT "Unassigned"
   - ✅ Status badges display with correct colors
   - ✅ Risk level badges display with correct colors
   - ✅ No full page reload
   - ✅ Request completes in < 1 second

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 3: Create Risk Modal (HTMX)**

**Endpoint**: `GET /risk-v2/ui/create`  
**Trigger**: Button click with `hx-get`  
**Expected**: Modal opens without page reload

### **Steps**:
1. Click "Create New Risk" button
2. **Watch Network tab** for `/risk-v2/ui/create` request
3. **Verify**:
   - ✅ Modal opens smoothly
   - ✅ Form displays all required fields
   - ✅ No full page reload
   - ✅ Modal overlay covers background
   - ✅ Close button works
   - ✅ Click outside modal closes it
   - ✅ Request completes in < 200ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 4: Live Score Calculation (HTMX)**

**Endpoint**: `POST /risk-v2/ui/calculate-score`  
**Trigger**: `hx-trigger="input changed delay:300ms"`  
**Expected**: Score updates live as user types

### **Steps**:
1. Open Create Risk modal
2. Set **Probability** to 4
3. Set **Impact** to 5
4. **Watch Network tab** for `/risk-v2/ui/calculate-score` requests
5. **Verify**:
   - ✅ Score field updates automatically
   - ✅ Shows "20" (4 × 5)
   - ✅ Risk level badge shows "Critical"
   - ✅ Badge color is red (bg-red-100)
   - ✅ Debounce works (300ms delay)
   - ✅ No full page reload
   - ✅ Only changed fields trigger update

### **Test Different Combinations**:
- Probability=5, Impact=5 → Score=25, Level="Critical" (red)
- Probability=4, Impact=4 → Score=16, Level="High" (orange)
- Probability=3, Impact=3 → Score=9, Level="Medium" (yellow)
- Probability=2, Impact=2 → Score=4, Level="Low" (green)

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 5: Create Risk Submission (HTMX)**

**Endpoint**: `POST /risk-v2/api/create` (API) + table refresh  
**Expected**: Risk created and table updates without reload

### **Steps**:
1. Fill all required fields in Create modal:
   - Title: "Test Risk from Browser"
   - Description: "Testing HTMX submission"
   - Category: "cybersecurity"
   - Subcategory: "data_breach"
   - Probability: 3
   - Impact: 4
   - Status: "active"
   - Owner: Select any user
2. Click "Create Risk"
3. **Watch Network tab** for `/risk-v2/api/create` request
4. **Verify**:
   - ✅ Modal closes automatically
   - ✅ Success message displays
   - ✅ Table refreshes with new risk
   - ✅ New risk appears at top (or sorted position)
   - ✅ New risk has auto-generated risk_id (RISK-00018)
   - ✅ No full page reload
   - ✅ Statistics cards update (Total +1)

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 6: View Risk Modal (HTMX)**

**Endpoint**: `GET /risk-v2/ui/view/:id`  
**Expected**: Read-only modal displays all risk details

### **Steps**:
1. Click "View" button on any risk
2. **Watch Network tab** for `/risk-v2/ui/view/:id` request
3. **Verify**:
   - ✅ Modal opens without page reload
   - ✅ risk_id displays (RISK-00001)
   - ✅ All fields display correctly
   - ✅ Owner name shows "David Martinez" (not ID)
   - ✅ Status badge displays with color
   - ✅ Risk level badge displays with color
   - ✅ Dates formatted correctly
   - ✅ Close button works
   - ✅ Request completes in < 300ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 7: Edit Risk Modal (HTMX)**

**Endpoint**: `GET /risk-v2/ui/edit/:id`  
**Expected**: Editable modal with pre-populated fields

### **Steps**:
1. Click "Edit" button on any risk
2. **Watch Network tab** for `/risk-v2/ui/edit/:id` request
3. **Verify**:
   - ✅ Modal opens without page reload
   - ✅ risk_id field is read-only
   - ✅ All fields pre-populated with current values
   - ✅ Owner name displays correctly
   - ✅ Live score calculation works on edit
   - ✅ Change Probability to 5
   - ✅ Score recalculates automatically
   - ✅ Risk level badge updates
   - ✅ Request completes in < 300ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 8: Edit Risk Submission (HTMX)**

**Endpoint**: `PUT /risk-v2/api/:id`  
**Expected**: Risk updated and table refreshes

### **Steps**:
1. In Edit modal, modify:
   - Title: Add " - EDITED" to title
   - Probability: Change to different value
2. Click "Save Changes"
3. **Watch Network tab** for `PUT /risk-v2/api/:id` request
4. **Verify**:
   - ✅ Modal closes
   - ✅ Success message displays
   - ✅ Table refreshes
   - ✅ Risk title shows " - EDITED"
   - ✅ Risk score updated
   - ✅ Risk level badge updated
   - ✅ Owner name still displays correctly
   - ✅ No full page reload

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 9: Status Change Modal (HTMX)**

**Endpoint**: `GET /risk-v2/ui/status/:id`  
**Expected**: Status change modal opens

### **Steps**:
1. Click "Change Status" button on any risk
2. **Watch Network tab** for `/risk-v2/ui/status/:id` request
3. **Verify**:
   - ✅ Modal opens without page reload
   - ✅ Current status displays at top
   - ✅ Current status disabled in dropdown
   - ✅ Other statuses available
   - ✅ Optional reason textarea present
   - ✅ Request completes in < 200ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 10: Status Change Submission (HTMX)**

**Endpoint**: `PATCH /risk-v2/api/:id/status`  
**Expected**: Status updates and badge changes color

### **Steps**:
1. In Status Change modal:
   - Select "mitigated" status
   - Add reason: "Testing status change"
2. Click "Change Status"
3. **Watch Network tab** for `PATCH /risk-v2/api/:id/status` request
4. **Verify**:
   - ✅ Modal closes
   - ✅ Success message displays
   - ✅ Table refreshes
   - ✅ Status badge changes to blue (mitigated)
   - ✅ Status badge shows shield icon
   - ✅ No full page reload
   - ✅ Statistics update if needed

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 11: Filter by Status (HTMX)**

**Endpoint**: `GET /risk-v2/ui/table?status=active`  
**Trigger**: Dropdown change with `hx-get`  
**Expected**: Table filters without page reload

### **Steps**:
1. Change "Status" filter to "Active"
2. **Watch Network tab** for `/risk-v2/ui/table?status=active` request
3. **Verify**:
   - ✅ Table refreshes without page reload
   - ✅ Only "active" risks display
   - ✅ Other statuses hidden
   - ✅ Count updates
   - ✅ Request completes in < 500ms
4. Change to "All Statuses"
5. **Verify** all risks return

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 12: Filter by Category (HTMX)**

**Endpoint**: `GET /risk-v2/ui/table?category=cybersecurity`  
**Expected**: Table filters by category

### **Steps**:
1. Change "Category" filter to "Cybersecurity"
2. **Watch Network tab** for `/risk-v2/ui/table?category=cybersecurity` request
3. **Verify**:
   - ✅ Table refreshes without page reload
   - ✅ Only cybersecurity risks display
   - ✅ Count updates
   - ✅ Request completes in < 500ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 13: Filter by Risk Level (HTMX)**

**Endpoint**: `GET /risk-v2/ui/table?riskLevel=Critical`  
**Expected**: Table filters by risk level

### **Steps**:
1. Change "Risk Level" filter to "Critical"
2. **Watch Network tab** for `/risk-v2/ui/table?riskLevel=Critical` request
3. **Verify**:
   - ✅ Table refreshes without page reload
   - ✅ Only Critical risks display (score 20-25)
   - ✅ Should show 3 risks (RISK-00001, RISK-00002, RISK-00003)
   - ✅ All have red badges
   - ✅ Request completes in < 500ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 14: Combined Filters (HTMX)**

**Endpoint**: `GET /risk-v2/ui/table?status=active&category=cybersecurity&riskLevel=High`  
**Expected**: Multiple filters work together

### **Steps**:
1. Set multiple filters:
   - Status: "Active"
   - Category: "Cybersecurity"
   - Risk Level: "High"
2. **Watch Network tab** for combined query parameters
3. **Verify**:
   - ✅ Table refreshes
   - ✅ Only risks matching ALL criteria display
   - ✅ Count accurate
   - ✅ Clear filters button works
   - ✅ Request completes in < 500ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 15: Search (HTMX)**

**Endpoint**: `GET /risk-v2/ui/table?search=breach`  
**Trigger**: Input with debounce (500ms)  
**Expected**: Table filters by search term

### **Steps**:
1. Type "breach" in search box
2. Wait 500ms for debounce
3. **Watch Network tab** for `/risk-v2/ui/table?search=breach` request
4. **Verify**:
   - ✅ Table refreshes after debounce
   - ✅ Only risks with "breach" in title/description display
   - ✅ Should show "Data Breach Through Third-Party Vendor"
   - ✅ Highlighting (if implemented)
   - ✅ Request completes in < 500ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 16: Import Modal (HTMX)**

**Endpoint**: `GET /risk-v2/ui/import`  
**Expected**: Import modal opens

### **Steps**:
1. Click "Import" button
2. **Watch Network tab** for `/risk-v2/ui/import` request
3. **Verify**:
   - ✅ Modal opens without page reload
   - ✅ File upload field present
   - ✅ "Download Template" link works
   - ✅ Options present (Skip Duplicates, Validate Only)
   - ✅ Request completes in < 200ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 17: Download CSV Template**

**Endpoint**: `GET /risk-v2/ui/import/template`  
**Expected**: CSV file downloads

### **Steps**:
1. In Import modal, click "Download Template"
2. **Watch Network tab** for `/risk-v2/ui/import/template` request
3. **Verify**:
   - ✅ CSV file downloads
   - ✅ Filename: "risk_import_template.csv"
   - ✅ Contains header row with correct columns
   - ✅ Contains 2 sample rows
   - ✅ Request completes in < 200ms

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 18: Import CSV Validation (HTMX)**

**Endpoint**: `POST /risk-v2/ui/import`  
**Expected**: Validation results display without page reload

### **Steps**:
1. Use downloaded template CSV
2. Check "Validate Only" option
3. Upload file
4. **Watch Network tab** for `POST /risk-v2/ui/import` request
5. **Verify**:
   - ✅ Progress indicator displays
   - ✅ Results display in modal (no page reload)
   - ✅ Shows "X valid risks found"
   - ✅ Shows errors if any
   - ✅ No data inserted (validation only)
   - ✅ Request completes in < 2 seconds

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 19: Import CSV Execution (HTMX)**

**Endpoint**: `POST /risk-v2/ui/import`  
**Expected**: Risks imported and table updates

### **Steps**:
1. Upload valid CSV (uncheck "Validate Only")
2. Check "Skip Duplicates"
3. Click "Import"
4. **Watch Network tab** for `POST /risk-v2/ui/import` request
5. **Verify**:
   - ✅ Progress indicator displays
   - ✅ Success message displays
   - ✅ Shows "X risks imported"
   - ✅ Modal provides "Refresh Page" button
   - ✅ Click refresh button
   - ✅ Table updates with new risks
   - ✅ Statistics update
   - ✅ Request completes in < 5 seconds

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📋 **Test 20: Export CSV (No HTMX)**

**Endpoint**: `POST /risk-v2/ui/export`  
**Expected**: CSV file downloads

### **Steps**:
1. Click "Export" button
2. **Watch Network tab** for `POST /risk-v2/ui/export` request
3. **Verify**:
   - ✅ CSV file downloads
   - ✅ Filename includes date (e.g., "risks_export_2025-10-23.csv")
   - ✅ Contains all filtered risks
   - ✅ All 18 columns present
   - ✅ risk_id column populated
   - ✅ Owner names in owner_id column (or separate column)
   - ✅ Calculated fields (risk_score, risk_level) correct
   - ✅ Request completes in < 2 seconds

### **Result**: ⬜ Pass / ⬜ Fail  
**Notes**:

---

## 📊 **Test Results Summary**

### **HTMX Interactions**
- ⬜ Statistics Cards (Test 1)
- ⬜ Risk Table Loading (Test 2)
- ⬜ Create Modal (Test 3)
- ⬜ Live Score Calculation (Test 4)
- ⬜ Create Submission (Test 5)
- ⬜ View Modal (Test 6)
- ⬜ Edit Modal (Test 7)
- ⬜ Edit Submission (Test 8)
- ⬜ Status Change Modal (Test 9)
- ⬜ Status Change Submission (Test 10)
- ⬜ Filter by Status (Test 11)
- ⬜ Filter by Category (Test 12)
- ⬜ Filter by Risk Level (Test 13)
- ⬜ Combined Filters (Test 14)
- ⬜ Search (Test 15)
- ⬜ Import Modal (Test 16)
- ⬜ CSV Validation (Test 18)
- ⬜ CSV Import (Test 19)

### **Non-HTMX Features**
- ⬜ Download Template (Test 17)
- ⬜ Export CSV (Test 20)

### **Overall Result**
- Tests Passed: ___/20
- Tests Failed: ___/20
- Pass Rate: ___%

---

## 🐛 **Issues Found**

### **Critical Issues** (Blocking)
None

### **Major Issues** (Should Fix)
None

### **Minor Issues** (Nice to Fix)
None

---

## ✅ **Sign-Off**

**Tester**: _________________  
**Date**: 2025-10-23  
**Status**: ⬜ Pass / ⬜ Fail  
**Recommendation**: ⬜ Proceed to Day 11 / ⬜ Fix issues first

---

**Next**: Day 10 Responsive Design Testing
