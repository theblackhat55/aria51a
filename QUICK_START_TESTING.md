# Quick Start - Testing Risk Module v2

**Status**: ✅ Ready for Browser Testing  
**Date**: 2025-10-23

---

## 🚀 Access the Application

### Public URL
```
https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev
```

### Key URLs
- **Login**: `/login`
- **Health Check**: `/health`
- **Risk v2 Main Page**: `/risk-v2/ui/`
- **Legacy Risk Page**: `/risk/` (for comparison)

---

## 🔐 Authentication Required

All `/risk-v2/*` routes require authentication. You must login first.

**Test Account**: Use existing ARIA5 credentials from the platform.

---

## ✅ What's Ready to Test

### 1. Main Page (`/risk-v2/ui/`)
- ✅ Page header and description
- ✅ Action buttons (Import, Export, Add New Risk)
- ✅ Statistics cards (5 cards with HTMX loading)
- ✅ Filters section (8 filter controls)
- ✅ Risk register table (HTMX loading)

### 2. Statistics Cards
- ✅ Load via HTMX from `/risk-v2/ui/stats`
- ✅ 5 cards: Critical, High, Medium, Low, Total
- ✅ Icons and colors match ARIA5

### 3. Risk Table
- ✅ Load via HTMX from `/risk-v2/ui/table`
- ✅ 10 columns with responsive design
- ✅ Risk level badges (red/orange/yellow/green)
- ✅ Status badges with icons
- ✅ Action buttons (View, Edit, Status, Delete)

### 4. Filters
- ✅ Search filter (300ms debounce)
- ✅ Status dropdown
- ✅ Category dropdown
- ✅ Risk level dropdown
- ✅ Sort by/order controls
- ✅ Page size control
- ✅ Quick filter buttons (Critical Only, Active Only, Reset)

### 5. Create Risk Modal
- ✅ Opens via HTMX from `/risk-v2/ui/create`
- ✅ 6 form sections
- ✅ Live risk score calculation (probability × impact)
- ✅ Auto-updating risk level badge
- ✅ Form validation
- ✅ HTMX submission to `/risk-v2/api/create`

### 6. View Risk Modal
- ✅ Opens via HTMX from `/risk-v2/ui/view/:id`
- ✅ Read-only risk details
- ✅ 3 sections: Basic Info, Risk Assessment, Status
- ✅ Edit button present

---

## ⚠️ Known Placeholders (Not Blocking)

### Not Yet Implemented
- ⚠️ **Edit Risk Modal**: Shows "Coming soon"
- ⚠️ **Status Change Modal**: Shows "Coming soon"
- ⚠️ **Import**: Button present but returns placeholder
- ⚠️ **Export**: Button present but returns placeholder

### Data Gaps
- **Owner Name**: Shows "Unassigned" (users table lookup not implemented)
- **Pagination**: Component created but not fully wired

---

## 🧪 Quick Test Steps

### Step 1: Login
1. Navigate to `/login`
2. Use existing ARIA5 credentials
3. Should redirect to dashboard

### Step 2: Access Risk v2
1. Navigate to `/risk-v2/ui/`
2. Wait for page to load
3. Verify page header shows "Risk Management v2"

### Step 3: Check Statistics
1. Wait 1-2 seconds for statistics cards to load
2. Verify 5 cards appear with icons and numbers
3. Check colors: red, orange, yellow, green, blue

### Step 4: Check Table
1. Wait for risk table to load
2. Verify table has data (if risks exist in database)
3. Check risk level badges show correct colors
4. Hover over table rows to see hover effect

### Step 5: Test Search Filter
1. Type in search box
2. Wait 300ms
3. Verify table updates with filtered results

### Step 6: Open Create Modal
1. Click "Add New Risk" button
2. Modal should open with form
3. Verify form has 6 sections

### Step 7: Test Live Calculation
1. In create modal, select Probability = 4
2. Select Impact = 5
3. Wait 300ms
4. Verify Risk Score displays "20 - Critical" in red

### Step 8: View Risk Details
1. Click "View" (eye icon) on any risk row
2. Modal should open with risk details
3. Verify data displays correctly
4. Close modal with X button

### Step 9: Test Filters
1. Select Status = "Active"
2. Verify table updates
3. Select Category (any)
4. Verify table filters again
5. Click "Reset Filters"
6. Verify table resets

### Step 10: Check Responsive Design
1. Resize browser to mobile width
2. Verify table columns hide appropriately
3. Check modal displays correctly on mobile
4. Restore desktop width

---

## 📊 Expected Results

### Main Page
- Clean layout with white background
- TailwindCSS styling applied
- Font Awesome icons visible
- No console errors

### Statistics Cards
- Load within 2 seconds
- Show actual numbers from database
- Icons and colors match ARIA5

### Risk Table
- Loads with proper column headers
- Risk level badges show correct colors:
  - Critical: Red background
  - High: Orange background
  - Medium: Yellow background
  - Low: Green background
- Status badges show icons and colors
- Hover effect on rows (gray background)

### Create Modal
- Opens smoothly
- Form fields render correctly
- Live calculation works:
  - Probability 1 × Impact 1 = 1 (Low, green)
  - Probability 3 × Impact 3 = 9 (Medium, yellow)
  - Probability 4 × Impact 4 = 16 (High, orange)
  - Probability 5 × Impact 5 = 25 (Critical, red)
- Cancel button closes modal
- Submit attempts to create risk

### View Modal
- Opens with risk data
- Read-only display
- Edit button present (shows placeholder)

---

## 🔍 What to Check

### Browser Console
- ✅ No JavaScript errors
- ✅ HTMX requests successful (200 status)
- ✅ No CORS errors
- ✅ No authentication errors

### Network Tab
- ✅ HTMX requests to `/risk-v2/ui/*` endpoints
- ✅ Response times reasonable (< 1 second)
- ✅ HTML responses received
- ✅ No 404 or 500 errors

### Visual Consistency
- ✅ Colors match ARIA5 exactly
- ✅ Icons match ARIA5 (Font Awesome 6.6.0)
- ✅ Badge styles consistent
- ✅ Modal structure same as ARIA5
- ✅ Table layout matches ARIA5
- ✅ Button styles consistent

### Responsive Design
- ✅ Mobile: Owner and Review Date columns hidden
- ✅ Tablet: Most columns visible
- ✅ Desktop: All columns visible
- ✅ Modal: Full width on mobile, max-w-4xl on desktop

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error
**Cause**: Not logged in  
**Solution**: Navigate to `/login` and authenticate first

### Issue: Statistics Cards Show Loading Forever
**Cause**: HTMX endpoint may be slow or failing  
**Solution**: Check Network tab for `/risk-v2/ui/stats` request

### Issue: Table Shows "No risks found"
**Cause**: Database has no risks  
**Solution**: Use create modal to add a risk, or check database

### Issue: Create Modal Doesn't Open
**Cause**: HTMX request may be blocked  
**Solution**: Check Network tab and browser console for errors

### Issue: Live Calculation Doesn't Update
**Cause**: HTMX not triggering or endpoint not responding  
**Solution**: Check Network tab for `/risk-v2/ui/calculate-score` POST

### Issue: Colors Don't Match ARIA5
**Cause**: TailwindCSS may not be loading  
**Solution**: Check Network tab for TailwindCSS CDN request

---

## 📋 Detailed Testing Checklist

See comprehensive test plan in: **`INTEGRATION_TEST_RISK_V2.md`**

The detailed plan includes:
- ✅ 10 test sections
- ✅ 100+ individual test cases
- ✅ Browser compatibility checks
- ✅ HTMX interaction verification
- ✅ ARIA5 consistency validation
- ✅ Responsive design testing

---

## 🎯 Success Criteria

### Minimum for Week 3 Progression
- ✅ Main page loads without errors
- ✅ Statistics cards display data
- ✅ Risk table loads and displays risks
- ✅ At least 2 filters work (search + status)
- ✅ Create modal opens and closes
- ✅ View modal opens with data
- ✅ Live score calculation works
- ✅ No critical console errors
- ✅ HTMX requests successful (check Network tab)
- ✅ Visual consistency with ARIA5 verified

**Target**: 80%+ tests passing

---

## 📞 Next Steps After Testing

### If 80%+ Tests Pass ✅
1. Document any issues found
2. Proceed to **Week 3 (Days 10-12)**: Side-by-side testing
3. Compare `/risk/*` vs `/risk-v2/ui/*`
4. Performance benchmarking
5. Feature parity verification

### If Critical Bugs Found 🐛
1. Document bugs with screenshots
2. Prioritize by severity
3. Fix critical issues
4. Re-test
5. Then proceed to Week 3

### If Placeholders Block Testing 📋
1. Assess impact
2. If edit/status modals critical: implement them
3. If not blocking: proceed with Week 3
4. Defer placeholders to post-Week 3

---

## 🎓 Tips for Testing

### Browser Dev Tools
1. **Console Tab**: Watch for errors
2. **Network Tab**: Monitor HTMX requests
3. **Elements Tab**: Inspect HTML structure and Tailwind classes
4. **Application Tab**: Check cookies and storage

### HTMX Debugging
- Look for `hx-get`, `hx-post`, `hx-target` attributes in HTML
- Check request headers for `HX-Request: true`
- Verify responses are HTML (not JSON)
- Watch for `hx-swap` actions in DOM

### Visual Comparison
- Open `/risk/*` (legacy) in one tab
- Open `/risk-v2/ui/*` (new) in another tab
- Compare side-by-side:
  - Colors
  - Icons
  - Spacing
  - Typography
  - Interactions

---

## 📚 Additional Resources

- **Completion Summary**: `DAYS_8-9_COMPLETION_SUMMARY.md`
- **Integration Test Plan**: `INTEGRATION_TEST_RISK_V2.md`
- **Template Code**: `/src/modules/risk/presentation/templates/`
- **UI Routes**: `/src/modules/risk/presentation/routes/riskUIRoutes.ts`

---

## ✨ Quick Command Reference

### Check Service Health
```bash
curl https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/health
```

### View PM2 Logs
```bash
pm2 logs aria52-enterprise --nostream
```

### Restart Service
```bash
fuser -k 3000/tcp && pm2 restart aria52-enterprise
```

### Check Git Status
```bash
cd /home/user/webapp && git status
```

---

**Ready to test!** 🚀

Start with the **Quick Test Steps** above, then proceed to the comprehensive checklist in `INTEGRATION_TEST_RISK_V2.md`.

---

**End of Quick Start Guide**
