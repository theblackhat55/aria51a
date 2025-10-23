# Risk Module v2 - Integration Test Plan

**Date**: 2025-10-23  
**Status**: ✅ Routes Integrated, Ready for Testing  
**Public URL**: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev

---

## 🎯 Integration Summary

### What Was Done (Days 8-9)

1. ✅ Created 7 UI template files (~58KB)
2. ✅ Aligned all UI with ARIA5 design patterns
3. ✅ Implemented HTMX interactions
4. ✅ Created UI routes for HTMX endpoints
5. ✅ Updated barrel exports
6. ✅ Integrated routes into main application
7. ✅ Added authentication middleware
8. ✅ Added CSRF protection
9. ✅ Build successful
10. ✅ Development server running

### Routes Now Available

#### API Routes (JSON responses)
- `POST /risk-v2/api/create` - Create new risk
- `GET /risk-v2/api/list` - List risks with filters
- `GET /risk-v2/api/:id` - Get risk by ID
- `PUT /risk-v2/api/update/:id` - Update risk
- `DELETE /risk-v2/api/delete/:id` - Delete risk
- `GET /risk-v2/api/stats` - Get risk statistics
- `POST /risk-v2/api/bulk-delete` - Bulk delete risks
- `POST /risk-v2/api/import` - Import risks
- `GET /risk-v2/api/export` - Export risks

#### UI Routes (HTML/HTMX responses)
- `GET /risk-v2/ui/` - Main risk management page
- `GET /risk-v2/ui/stats` - Statistics cards (HTMX endpoint)
- `GET /risk-v2/ui/table` - Risk table with filters (HTMX endpoint)
- `GET /risk-v2/ui/create` - Create risk modal (HTMX endpoint)
- `GET /risk-v2/ui/view/:id` - View risk modal (HTMX endpoint)
- `POST /risk-v2/ui/calculate-score` - Live score calculation (HTMX endpoint)
- `GET /risk-v2/ui/edit/:id` - Edit risk modal ⚠️ (placeholder)
- `POST /risk-v2/ui/status/:id` - Status change modal ⚠️ (placeholder)
- `POST /risk-v2/ui/import` - Import handler ⚠️ (placeholder)
- `GET /risk-v2/ui/export` - Export handler ⚠️ (placeholder)

---

## 🔒 Security Configuration

### Authentication
- All `/risk-v2/*` routes require authentication via `authMiddleware`
- Users must be logged in to access any Risk v2 functionality

### CSRF Protection
Applied to state-changing operations:
- `/risk-v2/api/create` ✅
- `/risk-v2/api/update/*` ✅
- `/risk-v2/api/delete/*` ✅
- `/risk-v2/ui/create` ✅
- `/risk-v2/ui/edit/*` ✅
- `/risk-v2/ui/status/*` ✅

### Login Credentials (Test Account)
For testing, you'll need to login first at:
- **Login URL**: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/login
- Use existing ARIA5 test credentials

---

## 🧪 Browser Testing Checklist

### 1. Main Page Load
- [ ] Navigate to `/risk-v2/ui/`
- [ ] Verify page header displays "Risk Management v2"
- [ ] Check page description mentions "Clean Architecture"
- [ ] Verify action buttons visible: Import, Export, Add New Risk

**Expected**: Page loads with ARIA5 styling, TailwindCSS working, Font Awesome icons visible

---

### 2. Statistics Cards (HTMX Loading)
- [ ] Wait 1-2 seconds for statistics to load
- [ ] Verify 5 cards appear:
  - Critical Risks (red icon)
  - High Risks (orange icon)
  - Medium Risks (yellow icon)
  - Low Risks (green icon)
  - Total Risks (blue icon)
- [ ] Check numbers match actual database counts

**Expected**: Cards load via HTMX from `/risk-v2/ui/stats`, replacing loading placeholders

---

### 3. Risk Table (HTMX Loading)
- [ ] Verify table loads with 10 columns:
  - Risk ID
  - Title
  - Category
  - Owner
  - Probability
  - Impact
  - Score
  - Status
  - Review Date
  - Actions
- [ ] Check risk level badges show correct colors:
  - Critical: red
  - High: orange
  - Medium: yellow
  - Low: green
- [ ] Verify status badges show icons and colors
- [ ] Check hover effect on table rows

**Expected**: Table loads via HTMX from `/risk-v2/ui/table`

---

### 4. Filters Section
Test each filter control:

#### Search Filter
- [ ] Type in search box
- [ ] Verify table updates after 300ms delay (HTMX debounce)
- [ ] Check filtered results match search term

#### Status Filter
- [ ] Select different status from dropdown
- [ ] Verify table updates immediately
- [ ] Test "All Statuses" option

#### Category Filter
- [ ] Select different category
- [ ] Verify filtering works
- [ ] Test "All Categories" option

#### Risk Level Filter
- [ ] Select different risk level
- [ ] Verify filtering works
- [ ] Test "All Levels" option

#### Sort Controls
- [ ] Change "Sort By" dropdown
- [ ] Change "Sort Order" (asc/desc)
- [ ] Verify table re-sorts correctly

#### Page Size
- [ ] Change page size (10, 25, 50, 100)
- [ ] Verify table shows correct number of rows

#### Quick Filters (Buttons)
- [ ] Click "Critical Only" button
- [ ] Click "Active Only" button
- [ ] Click "Reset Filters" button
- [ ] Verify each filter applies correctly

**Expected**: All filters trigger HTMX requests to `/risk-v2/ui/table` with query parameters

---

### 5. Create Risk Modal

#### Modal Opening
- [ ] Click "Add New Risk" button
- [ ] Verify modal opens with fixed overlay
- [ ] Check modal is scrollable
- [ ] Verify modal width is max-w-4xl
- [ ] Check modal header shows "Create New Risk"
- [ ] Verify close button (X) works

#### Form Sections
**Section 1: Basic Information**
- [ ] Risk ID input (auto-generated placeholder)
- [ ] Risk Type dropdown
- [ ] Title input (required)
- [ ] Description textarea
- [ ] Category dropdown
- [ ] Status dropdown

**Section 2: Risk Assessment**
- [ ] Probability dropdown (1-5)
- [ ] Impact dropdown (1-5)
- [ ] Risk Score display (readonly, auto-calculated)
- [ ] Verify score calculation updates live

**Section 3: Ownership**
- [ ] Organization ID input
- [ ] Owner ID input
- [ ] Created By input

**Section 4: Mitigation & Planning**
- [ ] Mitigation Plan textarea
- [ ] Contingency Plan textarea
- [ ] Review Date input (date picker)

**Section 5: Tags & Metadata**
- [ ] Tags input (comma-separated)

**Section 6: Form Actions**
- [ ] Cancel button (closes modal)
- [ ] Create Risk button (submits form)

#### Live Score Calculation
- [ ] Change probability value
- [ ] Wait 300ms
- [ ] Verify score updates automatically
- [ ] Check risk level text updates (Low/Medium/High/Critical)
- [ ] Verify badge color changes (green/yellow/orange/red)
- [ ] Change impact value
- [ ] Verify score recalculates

**Expected**: 
- Score = probability × impact
- Level: Critical (≥20), High (≥12), Medium (≥6), Low (<6)
- HTMX posts to `/risk-v2/ui/calculate-score`

#### Form Submission
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Check for validation errors
- [ ] Verify HTMX submits to `/risk-v2/api/create`
- [ ] Check success/error handling

**Expected**: Form submits via HTMX POST, modal closes on success, table refreshes

---

### 6. View Risk Modal

#### Modal Opening
- [ ] Click "View" (eye icon) on any risk row
- [ ] Verify modal opens
- [ ] Check modal shows risk data
- [ ] Verify readonly display

#### Modal Content
**Section 1: Basic Information**
- [ ] Risk ID badge
- [ ] Title
- [ ] Category badge
- [ ] Description

**Section 2: Risk Assessment**
- [ ] Probability badge (1-5)
- [ ] Impact badge (1-5)
- [ ] Risk Score and Level badge
- [ ] Verify colors match create modal

**Section 3: Status**
- [ ] Status badge with icon
- [ ] Correct color scheme

#### Modal Actions
- [ ] Close button works
- [ ] "Edit Risk" button present
- [ ] Click "Edit Risk" ⚠️ (shows placeholder)

**Expected**: Modal loads via HTMX from `/risk-v2/ui/view/:id`

---

### 7. Action Buttons (Placeholders)

#### Edit Button
- [ ] Click edit (pencil icon) on risk row
- [ ] Verify shows "Coming soon" message
- [ ] Or opens edit modal (if implemented)

#### Status Button
- [ ] Click status (check icon) on risk row
- [ ] Verify shows "Coming soon" message
- [ ] Or opens status change modal (if implemented)

#### Delete Button
- [ ] Click delete (trash icon) on risk row
- [ ] Verify confirmation prompt
- [ ] Test delete functionality

**Expected**: Edit and status show placeholders (not yet implemented)

---

### 8. Responsive Design Testing

#### Mobile (< 640px)
- [ ] Test on mobile viewport
- [ ] Verify table columns hide appropriately
- [ ] Check Owner column hidden
- [ ] Check Review Date column hidden
- [ ] Verify horizontal scroll if needed
- [ ] Test modal on mobile (full width)

#### Tablet (640px - 1024px)
- [ ] Test on tablet viewport
- [ ] Verify layout adjusts correctly
- [ ] Check table visibility

#### Desktop (> 1024px)
- [ ] Test on desktop viewport
- [ ] Verify all columns visible
- [ ] Check max-w-7xl container centering

---

### 9. HTMX Interaction Testing

#### Verify HTMX Attributes
Open browser dev tools and check:
- [ ] `hx-get` attributes on buttons
- [ ] `hx-post` attributes on forms
- [ ] `hx-target` attributes point to correct IDs
- [ ] `hx-swap` attributes configured correctly
- [ ] `hx-trigger` attributes for events
- [ ] `hx-include` for form field inclusion

#### Network Tab Verification
- [ ] Check HTMX requests in Network tab
- [ ] Verify correct endpoints called
- [ ] Check request/response payloads
- [ ] Verify response times
- [ ] Check for errors

---

### 10. ARIA5 Design Consistency

#### Color Verification
- [ ] Critical risks: red-100 background, red-800 text
- [ ] High risks: orange-100 background, orange-800 text
- [ ] Medium risks: yellow-100 background, yellow-800 text
- [ ] Low risks: green-100 background, green-800 text

#### Status Colors
- [ ] Active: green with exclamation-triangle icon
- [ ] Pending: yellow with clock icon
- [ ] Mitigated: blue with shield-check icon
- [ ] Monitoring: purple with eye icon
- [ ] Escalated: red with arrow-up icon
- [ ] Closed: gray with check-circle icon
- [ ] Under Review: indigo with search icon

#### Component Styling
- [ ] Badges: rounded, border, padding correct
- [ ] Buttons: hover effects work
- [ ] Cards: shadow and border-radius match
- [ ] Table: hover effects on rows
- [ ] Modal: overlay opacity, shadow correct
- [ ] Loading states: skeleton/spinner present

---

## 🐛 Known Issues & Limitations

### Not Yet Implemented (Placeholders)
1. ⚠️ Edit risk modal (`/risk-v2/ui/edit/:id`)
   - Currently shows "Coming soon" message
   - Route exists but returns placeholder HTML

2. ⚠️ Status change modal (`/risk-v2/ui/status/:id`)
   - Currently shows "Coming soon" message
   - Route exists but returns placeholder HTML

3. ⚠️ Import functionality (`/risk-v2/ui/import`)
   - Button present but returns placeholder response

4. ⚠️ Export functionality (`/risk-v2/ui/export`)
   - Button present but returns placeholder response

### Data Integration Gaps
- **Owner Name**: Currently shows "Unassigned" because users table lookup not implemented
- **Pagination**: Component created but may not be fully wired to filter state

### Testing Gaps
- No unit tests for templates
- No integration tests for HTMX flows
- No E2E tests for complete user journeys

---

## 🚀 Quick Test Commands

### Health Check
```bash
curl https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/health
```

### Test Main UI Page (After Login)
```bash
# Note: Requires authentication cookie
curl -H "Cookie: aria_token=YOUR_TOKEN" \
  https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/risk-v2/ui/
```

### Test Statistics Endpoint
```bash
curl -H "Cookie: aria_token=YOUR_TOKEN" \
  https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/risk-v2/ui/stats
```

### Test Table Endpoint with Filters
```bash
curl -H "Cookie: aria_token=YOUR_TOKEN" \
  "https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/risk-v2/ui/table?status=active&category=operational&page=1&limit=10"
```

---

## 📊 Comparison Testing (Week 3)

Once browser testing is complete, proceed to side-by-side comparison:

### URLs to Compare
- **Legacy**: `/risk/*` (ARIA5 monolithic implementation)
- **New**: `/risk-v2/ui/*` (Clean Architecture implementation)

### Comparison Criteria
1. **Visual Consistency**: Both should look identical
2. **Feature Parity**: Same functionality available
3. **Performance**: Response times, load times
4. **Data Consistency**: Same risk data displayed
5. **User Experience**: Interactions, feedback, errors

---

## ✅ Sign-Off Checklist

### Before Moving to Week 3
- [ ] All main page elements load correctly
- [ ] Statistics cards display data
- [ ] Risk table loads with data
- [ ] Filters work (at least search and status)
- [ ] Create modal opens and closes
- [ ] View modal opens with data
- [ ] Live score calculation works
- [ ] HTMX requests successful (check Network tab)
- [ ] No console errors (check browser console)
- [ ] Responsive design works on mobile

### Ready for Week 3 When
- [ ] 80%+ of above tests pass
- [ ] Core user journey works: view list → view details → create risk
- [ ] No critical bugs blocking basic usage
- [ ] ARIA5 design alignment verified visually

---

## 📝 Testing Notes

### Testing Date: _____________

**Tester**: _____________

**Browser**: _____________

**Pass/Fail Summary**:
- Main Page: ☐ Pass ☐ Fail
- Statistics: ☐ Pass ☐ Fail
- Table: ☐ Pass ☐ Fail
- Filters: ☐ Pass ☐ Fail
- Create Modal: ☐ Pass ☐ Fail
- View Modal: ☐ Pass ☐ Fail
- Live Calc: ☐ Pass ☐ Fail
- Responsive: ☐ Pass ☐ Fail

**Issues Found**:
1. 
2. 
3. 

**Recommendations**:
1. 
2. 
3. 

---

## 🎯 Next Steps After Testing

1. **If tests pass (80%+)**:
   - Document any issues found
   - Proceed to Week 3 (side-by-side testing)
   - Create performance comparison plan

2. **If tests reveal critical bugs**:
   - Fix critical issues first
   - Re-test after fixes
   - Then proceed to Week 3

3. **If placeholders need implementation**:
   - Decide: implement now or defer?
   - If critical to testing: implement edit/status modals
   - If not blocking: defer to post-Week 3

---

**End of Integration Test Plan**
