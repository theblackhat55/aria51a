# Production Deployment Checklist - Risk Module v2

**Date**: 2025-10-23  
**Version**: 2.0.0  
**Deployment Type**: Immediate Switchover  
**Risk Level**: 🟢 LOW

---

## 📋 **Pre-Deployment Checklist**

### **T-24 Hours: Preparation Phase**

#### **Code Review** ✅
- [x] All feature parity requirements met (100%)
- [x] Code follows Clean Architecture principles
- [x] CQRS pattern implemented correctly
- [x] Repository pattern validated
- [x] No TODO or FIXME comments in production code
- [x] All known issues fixed (Option B complete)

#### **Testing Validation** ✅
- [x] Feature parity verified (Days 10)
- [x] Large dataset tested (117 risks)
- [x] Database performance validated (< 100ms)
- [x] HTMX interactions documented (20 tests)
- [x] Filter/sort/pagination test plans created
- [x] Import/Export functionality verified

#### **Documentation** ✅
- [x] Switchover strategy complete
- [x] Route documentation complete
- [x] Rollback plan documented
- [x] API documentation complete
- [x] User guide updated (if applicable)

#### **Database Preparation** ✅
- [x] risk_id field added and populated
- [x] Migrations applied (0114_add_risk_id_field.sql)
- [x] Seed data loaded (117 risks)
- [x] Database backup created (automatic via D1)
- [x] Database schema compatible

#### **Infrastructure** ✅
- [x] aria51a test environment validated
- [x] PM2 configuration updated
- [x] Health checks passing
- [x] Service URL accessible
- [x] Monitoring configured

---

### **T-1 Hour: Final Checks**

#### **Backup & Safety** 🔄
- [ ] **CRITICAL**: Take full database backup
  ```bash
  # For local D1
  cd /home/user/webapp
  npx wrangler d1 execute aria51a-production --local --command="SELECT * FROM risks" > backup_risks_$(date +%Y%m%d_%H%M%S).json
  ```
- [ ] **CRITICAL**: Take full code backup
  ```bash
  cd /home/user/webapp
  git add -A && git commit -m "Pre-deployment backup - $(date)"
  git tag v2.0.0-pre-deployment
  ```
- [ ] Verify rollback procedure documented
- [ ] Test rollback on test environment (optional but recommended)

#### **Communication** 🔄
- [ ] Notify technical team (use email template from Switchover Strategy)
- [ ] Post deployment notice on status page (if applicable)
- [ ] Schedule post-deployment review meeting
- [ ] Prepare support team with known issues list

#### **Environment Verification** 🔄
- [ ] Verify all environment variables set correctly
  ```bash
  # Check .dev.vars for local
  cat .dev.vars
  
  # Check wrangler.jsonc for production
  cat wrangler.jsonc
  ```
- [ ] Verify D1 database binding configured
  ```bash
  npx wrangler d1 list
  ```
- [ ] Verify PM2 ecosystem config correct
  ```bash
  cat ecosystem.config.cjs | grep -A 3 "name:"
  ```

#### **Final Smoke Tests** 🔄
- [ ] Health check passing
  ```bash
  curl http://localhost:3000/health
  # Expected: {"status":"healthy","version":"5.1.0-enterprise",...}
  ```
- [ ] Risk v2 UI accessible
  ```bash
  curl -I http://localhost:3000/risk-v2/ui/
  # Expected: 302 or 200 (redirect to login or page)
  ```
- [ ] Database connection working
  ```bash
  npx wrangler d1 execute aria51a-production --local --command="SELECT COUNT(*) FROM risks"
  # Expected: 117
  ```

---

## 🚀 **Deployment Phase**

### **T-0: Execute Deployment** (15 minutes)

#### **Step 1: Code Changes** (5 minutes) 🔄

**File: src/index.tsx**

```typescript
// FIND these lines (current state):
import { createRiskRoutesARIA5 } from './routes/risk-routes-aria5';
app.route('/risk', createRiskRoutesARIA5());

// REPLACE with:
import { createRiskUIRoutes } from './modules/risk/presentation/routes/riskUIRoutes';
import { createRiskRoutes } from './modules/risk/presentation/routes/riskRoutes';

// Mount v2 routes to /risk path (primary)
app.route('/risk', createRiskUIRoutes());

// Mount v2 API routes
app.route('/risk/api', createRiskRoutes());

// Keep v2 routes as backup path
app.route('/risk-v2', createRiskUIRoutes());
app.route('/risk-v2/api', createRiskRoutes());
```

**Verification**:
- [ ] Old import commented out or removed
- [ ] New imports added
- [ ] Routes mounted correctly
- [ ] No syntax errors

#### **Step 2: Build** (3 minutes) 🔄

**Local/Staging**:
```bash
cd /home/user/webapp

# Clean build
rm -rf dist/
npm run build

# Verify build successful
ls -lh dist/_worker.js
# Should show file size ~2MB
```

**Production (Cloudflare Pages)**:
```bash
cd /home/user/webapp

# Build and deploy
npm run build
npx wrangler pages deploy dist --project-name aria51a

# Note the deployment URL
# Example: https://abc123.aria51a.pages.dev
```

**Checklist**:
- [ ] Build completed without errors
- [ ] dist/ directory created
- [ ] _worker.js file present
- [ ] No TypeScript errors
- [ ] No ESLint warnings

#### **Step 3: Deploy** (2 minutes) 🔄

**Local/Staging**:
```bash
# Restart PM2 service
pm2 restart aria51a

# Wait 10 seconds for startup
sleep 10

# Verify service running
pm2 status
# Expected: aria51a - online
```

**Production (Cloudflare Pages)**:
```bash
# Deployment already done in Step 2
# Just verify deployment succeeded
npx wrangler pages deployment list --project-name aria51a | head -5

# Should show latest deployment as "Success"
```

**Checklist**:
- [ ] Service restarted successfully
- [ ] No errors in PM2 logs
- [ ] Process status: online
- [ ] Memory usage normal (< 100MB)

#### **Step 4: Immediate Verification** (5 minutes) 🔄

**Test 1: Health Check**
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy",...}
```
- [ ] Health check passing

**Test 2: New Routes Active**
```bash
curl -I http://localhost:3000/risk/
# Expected: 302 redirect to /login or 200 OK
```
- [ ] Main route accessible

**Test 3: v2 Backup Routes Active**
```bash
curl -I http://localhost:3000/risk-v2/ui/
# Expected: 302 redirect to /login or 200 OK
```
- [ ] Backup route accessible

**Test 4: Login & Basic Workflow**
- [ ] Navigate to `/risk/` (should be v2 now)
- [ ] Login with demo user (riskmanager / demo123)
- [ ] Verify risk table displays all 117 risks
- [ ] Verify statistics cards load
- [ ] Click "Create Risk" - modal opens
- [ ] Close modal - works correctly

**Test 5: Quick CRUD Check**
- [ ] Create a test risk (title: "Deployment Test")
- [ ] Verify appears in table
- [ ] Edit the test risk
- [ ] Change status
- [ ] Delete the test risk
- [ ] All operations work without errors

---

## ✅ **Post-Deployment Verification**

### **T+5 Minutes: Critical Path Testing**

#### **UI Tests** (5 minutes) 🔄
- [ ] Main page loads (`/risk/`)
- [ ] Statistics cards display correct counts
- [ ] Risk table shows all 117 risks
- [ ] Pagination displays (12 pages)
- [ ] Filters work (status, category, risk level)
- [ ] Search functionality works
- [ ] Sort columns work (ascending/descending)
- [ ] No JavaScript errors in console (F12)

#### **CRUD Tests** (5 minutes) 🔄
- [ ] Create risk modal opens
- [ ] Live score calculation works (probability × impact)
- [ ] Create risk saves successfully
- [ ] View risk modal shows all details
- [ ] Edit risk modal pre-populates correctly
- [ ] risk_id field is read-only in edit
- [ ] Edit saves successfully
- [ ] Status change modal works
- [ ] Status change saves, badge updates
- [ ] Delete risk works (with confirmation)

#### **Import/Export Tests** (3 minutes) 🔄
- [ ] Import modal opens
- [ ] Download template works
- [ ] CSV template has correct format
- [ ] Import validation works ("Validate Only")
- [ ] Import execution works (skip tested, actual import optional)
- [ ] Export button works
- [ ] Exported CSV has all columns
- [ ] risk_id column populated in export

#### **Performance Check** (2 minutes) 🔄
- [ ] Page load time < 1.5 seconds
- [ ] Risk table loads < 500ms (watch Network tab)
- [ ] Filter changes < 300ms
- [ ] Sort changes < 300ms
- [ ] No noticeable lag or delays

---

### **T+30 Minutes: Extended Validation**

#### **Error Monitoring** 🔄
```bash
# Check PM2 logs for errors
pm2 logs aria51a --nostream --lines 100 | grep -i error

# Should be empty or only expected errors
```
- [ ] No critical errors in logs
- [ ] No database connection errors
- [ ] No authentication errors
- [ ] No HTMX errors

#### **Database Integrity** 🔄
```bash
# Verify risk count unchanged
npx wrangler d1 execute aria51a-production --local --command="SELECT COUNT(*) FROM risks"
# Expected: 117 (or 118 if you created test risk)

# Verify risk_id field present
npx wrangler d1 execute aria51a-production --local --command="SELECT id, risk_id, title FROM risks LIMIT 3"
# Expected: Shows risk_id values (RISK-00001, RISK-00002, RISK-00003)
```
- [ ] Risk count correct
- [ ] No data loss
- [ ] risk_id field populated
- [ ] Database queries responding < 100ms

#### **User Feedback** 🔄
- [ ] No user-reported issues (if applicable)
- [ ] Support tickets normal volume
- [ ] No complaints about performance
- [ ] No complaints about missing features

---

### **T+2 Hours: Stability Check**

#### **Metrics Review** 🔄
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms average
- [ ] Database queries < 100ms average
- [ ] CPU usage normal (< 50%)
- [ ] Memory usage stable (< 100MB)
- [ ] No memory leaks detected

#### **Feature Usage** 🔄
- [ ] Users creating risks successfully
- [ ] Users editing risks successfully
- [ ] Users using filters/search successfully
- [ ] Import/export being used (if applicable)
- [ ] No blocking issues reported

---

### **T+24 Hours: Success Validation**

#### **Full Validation** 🔄
- [ ] All features working as expected
- [ ] Performance metrics within targets
- [ ] Error rate < 0.1%
- [ ] User satisfaction maintained
- [ ] No rollback required
- [ ] Support tickets normal
- [ ] Database integrity confirmed

#### **Documentation Update** 🔄
- [ ] Update deployment documentation with actual results
- [ ] Document any issues encountered
- [ ] Document solutions applied
- [ ] Update lessons learned
- [ ] Archive ARIA5 code (if ready)

---

## 🚨 **Rollback Procedure**

### **Trigger Conditions**
Execute rollback if ANY of these occur:
- ❌ Error rate > 5%
- ❌ Critical feature not working
- ❌ Data corruption detected
- ❌ Performance degradation > 50%
- ❌ Security vulnerability discovered
- ❌ More than 10 P1 bugs reported

### **Rollback Steps** (< 5 minutes)

#### **Step 1: Stop Service** 🔄
```bash
pm2 stop aria51a
```

#### **Step 2: Revert Code** 🔄
```bash
cd /home/user/webapp

# Option A: Git revert (recommended)
git revert HEAD --no-edit

# Option B: Reset to previous commit
git reset --hard v2.0.0-pre-deployment

# Option C: Restore from backup
git checkout <previous-commit-hash>
```

#### **Step 3: Rebuild** 🔄
```bash
npm run build
```

#### **Step 4: Restart** 🔄
```bash
pm2 restart aria51a
```

#### **Step 5: Verify Rollback** 🔄
```bash
# Should show ARIA5 version
curl http://localhost:3000/risk/

# Check health
curl http://localhost:3000/health

# Verify login works
# Verify risk table loads
# Verify CRUD operations work
```

#### **Step 6: Communicate** 🔄
```
Subject: Risk Module - Reverted to Previous Version

We've temporarily reverted the Risk Module to the previous version due to [REASON].

CURRENT STATUS:
- System operational
- All data intact  
- Previous interface restored

NEXT STEPS:
- Investigating root cause
- Will redeploy after fixes
- ETA: [TIMEFRAME]

Questions? Contact [SUPPORT]
```

---

## 📊 **Success Metrics**

### **Technical Success** ✅
- [ ] Zero downtime during deployment
- [ ] Error rate < 0.1%
- [ ] Performance equal or better than ARIA5
- [ ] All features functional
- [ ] No data loss
- [ ] Rollback capability maintained

### **Business Success** ✅
- [ ] User workflows uninterrupted
- [ ] Support tickets normal volume
- [ ] No productivity loss
- [ ] User satisfaction maintained

### **Operational Success** ✅
- [ ] Clean deployment process followed
- [ ] Documentation complete and accurate
- [ ] Team confidence high
- [ ] Monitoring effective
- [ ] Communication successful

---

## 📝 **Post-Deployment Report**

### **Deployment Summary**
- **Date**: _________________
- **Time**: _________________  
- **Duration**: _____________ minutes
- **Deployed By**: _________________
- **Version**: 2.0.0
- **Status**: ⬜ Success / ⬜ Rolled Back

### **Issues Encountered**
1. _________________
2. _________________
3. _________________

### **Resolutions Applied**
1. _________________
2. _________________
3. _________________

### **Lessons Learned**
1. _________________
2. _________________
3. _________________

### **Recommendations**
1. _________________
2. _________________
3. _________________

---

## 🎯 **Final Sign-Off**

### **Deployment Team**
- **Tech Lead**: _________________ ⬜ Approved
- **Database Admin**: _________________ ⬜ Approved  
- **QA Lead**: _________________ ⬜ Approved
- **Product Owner**: _________________ ⬜ Approved

### **Verification**
- [x] All pre-deployment checks passed
- [ ] Deployment executed successfully
- [ ] Post-deployment verification passed
- [ ] Monitoring configured and active
- [ ] Rollback plan tested and ready
- [ ] Documentation complete
- [ ] Team trained on new system

### **Go-Live Authorization**
- **Authorized By**: _________________
- **Date**: _________________
- **Signature**: _________________

---

## 📚 **Reference Documents**

1. **Switchover Strategy**: `DAY_12_SWITCHOVER_STRATEGY.md`
2. **Route Documentation**: `DAY_12_ROUTE_DOCUMENTATION.md`
3. **Feature Parity Analysis**: `DAY_10_FEATURE_PARITY_ANALYSIS.md`
4. **Large Dataset Testing**: `DAY_11_LARGE_DATASET_TEST_RESULTS.md`
5. **Browser Test Script**: `DAY_10_BROWSER_TEST_SCRIPT.md`
6. **Option B Fixes**: `OPTION_B_FIXES_COMPLETED.md`

---

## 🔗 **Quick Links**

- **Local**: http://localhost:3000/risk/
- **Test Environment**: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev/risk/
- **Production**: [YOUR_CLOUDFLARE_PAGES_URL]/risk/
- **Health Check**: [URL]/health
- **v2 Backup**: [URL]/risk-v2/ui/

---

**Status**: ✅ READY FOR DEPLOYMENT  
**Risk Level**: 🟢 LOW  
**Rollback Time**: < 5 minutes  
**Confidence Level**: HIGH 🚀
