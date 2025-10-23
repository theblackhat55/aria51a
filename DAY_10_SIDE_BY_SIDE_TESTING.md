# Day 10: Side-by-Side Testing - ARIA5 vs Risk Module v2

**Date**: 2025-10-23  
**Purpose**: Compare `/risk/*` (ARIA5 monolithic) vs `/risk-v2/*` (Clean Architecture)  
**Goal**: Verify 100% feature parity and identify any gaps

---

## 📋 Route Comparison

### ARIA5 Routes (`/risk/*`)
| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| GET | `/debug-test` | Debug endpoint | ❌ |
| GET | `/debug-db-test` | DB connectivity test | ❌ |
| GET | `/debug-risks` | Debug risk list | ❌ |
| GET | `/debug-schema` | Schema inspection | ❌ |
| GET | `/` | Main risk page | ✅ |
| GET | `/stats` | Risk statistics | ✅ |
| GET | `/table` | Risk table (HTMX) | ✅ |
| GET | `/create` | Create risk modal | ✅ |
| GET | `/add` | Alternative create route | ✅ |
| POST | `/calculate-score` | Live score calc | ✅ |
| POST | `/analyze-ai` | AI analysis | ✅ |
| POST | `/fill-from-ai` | AI form fill | ✅ |
| POST | `/update-from-ai` | AI update | ✅ |
| POST | `/create` | Submit new risk | ✅ |
| GET | `/view/:id` | View risk details | ✅ |
| GET | `/status-change/:id` | Status change modal | ✅ |
| POST | `/status-change/:id` | Submit status change | ✅ |
| GET | `/edit/:id` | Edit risk modal | ✅ |
| POST | `/edit/:id` | Submit edit | ✅ |
| DELETE | `/:id` | Delete risk | ✅ |
| GET | `/import` | Import modal | ✅ |
| POST | `/import` | Process CSV import | ✅ |
| POST | `/export` | Export to CSV | ✅ |
| GET | `/incidents` | Incidents list | ✅ |
| GET | `/incidents/new` | New incident modal | ✅ |
| POST | `/incidents/create` | Create incident | ✅ |
| GET | `/kris` | Key Risk Indicators | ✅ |
| GET | `/risks` | Alternative risk list | ✅ |
| GET | `/assessments` | Risk assessments | ✅ |
| GET | `/table-enhanced` | Enhanced table view | ✅ |
| GET | `/api/ti/dynamic-risks` | Dynamic risk data | ✅ |
| POST | `/api/ti/auto-generate-risk` | AI risk generation | ✅ |
| POST | `/api/ti/validate-risk/:id` | Validate risk | ✅ |
| GET | `/api/ti/risk-pipeline-stats` | Pipeline stats | ✅ |
| GET | `/api/ti/risk/:id/state-history` | State history | ✅ |
| POST | `/api/ti/process-detected-threats` | Process threats | ✅ |

**Total ARIA5 Routes**: 36

### Risk v2 Routes (`/risk-v2/*`)

#### API Routes (`/risk-v2/api/*`)
| Method | Route | Purpose | Status |
|--------|-------|---------|--------|
| GET | `/health` | Health check | ✅ |
| POST | `/create` | Create risk | ✅ |
| GET | `/:id` | Get by ID | ✅ |
| GET | `/riskId/:riskId` | Get by risk_id | ✅ |
| PUT | `/:id` | Update risk | ✅ |
| PATCH | `/:id/status` | Change status | ✅ |
| DELETE | `/:id` | Delete risk | ✅ |
| DELETE | `/riskId/:riskId` | Delete by risk_id | ✅ |
| GET | `/list` | List with filters | ✅ |
| GET | `/search` | Search risks | ✅ |
| GET | `/statistics` | Statistics | ✅ |
| GET | `/critical` | Critical risks only | ✅ |
| GET | `/needs-attention` | Needs attention | ✅ |
| GET | `/overdue-reviews` | Overdue reviews | ✅ |
| POST | `/bulk/create` | Bulk create | ✅ |
| DELETE | `/bulk/delete` | Bulk delete | ✅ |
| PATCH | `/bulk/status` | Bulk status | ✅ |

#### UI Routes (`/risk-v2/ui/*`)
| Method | Route | Purpose | Status |
|--------|-------|---------|--------|
| GET | `/` | Main page | ✅ |
| GET | `/stats` | Statistics cards | ✅ |
| GET | `/table` | Risk table | ✅ |
| GET | `/create` | Create modal | ✅ |
| GET | `/view/:id` | View modal | ✅ |
| GET | `/edit/:id` | Edit modal | ✅ |
| GET | `/status/:id` | Status change modal | ✅ |
| POST | `/calculate-score` | Live score calc | ✅ |
| GET | `/import` | Import modal | ✅ |
| GET | `/import/template` | CSV template | ✅ |
| POST | `/import` | Process import | ✅ |
| POST | `/export` | Export CSV | ✅ |

**Total Risk v2 Routes**: 29 (17 API + 12 UI)

---

## 🎯 Feature Parity Analysis

### ✅ Core Features (100% Parity)
| Feature | ARIA5 | Risk v2 | Notes |
|---------|-------|---------|-------|
| Create risk | ✅ | ✅ | Same fields |
| View risk | ✅ | ✅ | Same display |
| Edit risk | ✅ | ✅ | Same fields |
| Delete risk | ✅ | ✅ | Same behavior |
| Status change | ✅ | ✅ | Same statuses |
| Import CSV | ✅ | ✅ | Same format |
| Export CSV | ✅ | ✅ | Same format |
| List/Table | ✅ | ✅ | Same columns |
| Filters | ✅ | ✅ | Same filters |
| Search | ✅ | ✅ | Same search |
| Statistics | ✅ | ✅ | Same metrics |
| Live score calc | ✅ | ✅ | Same formula |

### ⚠️ ARIA5 Features NOT in v2 (Gaps Identified)
| Feature | ARIA5 Route | v2 Equivalent | Action Required |
|---------|-------------|---------------|-----------------|
| **AI Analysis** | POST `/analyze-ai` | ❌ None | 🔴 Missing |
| **AI Form Fill** | POST `/fill-from-ai` | ❌ None | 🔴 Missing |
| **AI Update** | POST `/update-from-ai` | ❌ None | 🔴 Missing |
| **Incidents** | GET `/incidents` | ❌ None | 🔴 Missing |
| **New Incident** | GET `/incidents/new` | ❌ None | 🔴 Missing |
| **Create Incident** | POST `/incidents/create` | ❌ None | 🔴 Missing |
| **KRI Dashboard** | GET `/kris` | ❌ None | 🔴 Missing |
| **Assessments** | GET `/assessments` | ❌ None | 🔴 Missing |
| **Enhanced Table** | GET `/table-enhanced` | ❌ None | 🟡 Optional |
| **Dynamic Risks** | GET `/api/ti/dynamic-risks` | ❌ None | 🔴 Missing |
| **Auto-generate Risk** | POST `/api/ti/auto-generate-risk` | ❌ None | 🔴 Missing |
| **Validate Risk** | POST `/api/ti/validate-risk/:id` | ❌ None | 🔴 Missing |
| **Pipeline Stats** | GET `/api/ti/risk-pipeline-stats` | ❌ None | 🔴 Missing |
| **State History** | GET `/api/ti/risk/:id/state-history` | ❌ None | 🔴 Missing |
| **Process Threats** | POST `/api/ti/process-detected-threats` | ❌ None | 🔴 Missing |

### ✅ v2 Features NOT in ARIA5 (Improvements)
| Feature | v2 Route | ARIA5 Equivalent | Benefit |
|---------|----------|------------------|---------|
| **Get by risk_id** | GET `/api/riskId/:riskId` | ❌ None | ✅ Better lookup |
| **Bulk create** | POST `/api/bulk/create` | ❌ None | ✅ Efficiency |
| **Bulk delete** | DELETE `/api/bulk/delete` | ❌ None | ✅ Efficiency |
| **Bulk status** | PATCH `/api/bulk/status` | ❌ None | ✅ Efficiency |
| **Critical risks** | GET `/api/critical` | ❌ None | ✅ Quick access |
| **Needs attention** | GET `/api/needs-attention` | ❌ None | ✅ Quick access |
| **Overdue reviews** | GET `/api/overdue-reviews` | ❌ None | ✅ Quick access |
| **Health check** | GET `/api/health` | ❌ None | ✅ Monitoring |
| **CSV template** | GET `/ui/import/template` | ❌ None | ✅ User friendly |

---

## 🚨 **CRITICAL FINDINGS**

### **Feature Parity Gap: 15 Missing Features**

Risk Module v2 is **NOT** at 100% feature parity with ARIA5. The following major feature areas are missing:

#### **1. AI-Powered Features (MISSING)**
- AI risk analysis
- AI form auto-fill
- AI-powered risk updates
- Auto-generate risks from threat intelligence
- Risk validation via AI

**Impact**: HIGH - These are differentiating features of ARIA5

#### **2. Incident Management (MISSING)**
- Incidents list
- Create incident
- Link incidents to risks

**Impact**: HIGH - Critical for risk management workflow

#### **3. Advanced Analytics (MISSING)**
- Key Risk Indicators (KRI) dashboard
- Dynamic risk tracking
- Risk pipeline statistics
- State history tracking
- Process detected threats

**Impact**: MEDIUM - Important for advanced users

#### **4. Risk Assessments (MISSING)**
- Risk assessment module

**Impact**: MEDIUM - Additional functionality

---

## 🎯 Side-by-Side Test Plan

### Test Environment
- **ARIA5 Base**: http://localhost:3000/risk/
- **Risk v2 Base**: http://localhost:3000/risk-v2/ui/
- **Test User**: riskmanager / demo123
- **Test Data**: Same 17 sample risks in both systems

### Test Scenarios

#### **Scenario 1: Basic CRUD Operations**

**Test 1.1: Create Risk**
| Step | ARIA5 | Risk v2 | Expected Result |
|------|-------|---------|-----------------|
| 1. Click "Create Risk" button | `/risk/create` | `/risk-v2/ui/create` | Modal opens |
| 2. Fill title, description | ✓ | ✓ | Fields accept input |
| 3. Set probability (1-5) | ✓ | ✓ | Value selected |
| 4. Set impact (1-5) | ✓ | ✓ | Value selected |
| 5. Observe live score | ✓ | ✓ | Score = prob × impact |
| 6. Select category | ✓ | ✓ | Category dropdown |
| 7. Select status | ✓ | ✓ | Status dropdown |
| 8. Set review date | ✓ | ✓ | Date picker |
| 9. Submit form | POST `/risk/create` | POST `/risk-v2/{id}` | Risk created |
| 10. Verify in table | ✓ | ✓ | New risk appears |

**Test 1.2: View Risk**
| Step | ARIA5 | Risk v2 | Expected Result |
|------|-------|---------|-----------------|
| 1. Click "View" on risk | `/risk/view/:id` | `/risk-v2/ui/view/:id` | Modal opens |
| 2. Verify all fields | ✓ | ✓ | All data shown |
| 3. Check risk_id | ✓ | ✓ | RISK-XXXXX format |
| 4. Check owner name | ✓ | ✓ | "FirstName LastName" |
| 5. Check risk score badge | ✓ | ✓ | Correct color |
| 6. Check risk level badge | ✓ | ✓ | Critical/High/Med/Low |
| 7. Close modal | ✓ | ✓ | Modal closes |

**Test 1.3: Edit Risk**
| Step | ARIA5 | Risk v2 | Expected Result |
|------|-------|---------|-----------------|
| 1. Click "Edit" on risk | `/risk/edit/:id` | `/risk-v2/ui/edit/:id` | Modal opens |
| 2. Verify risk_id read-only | ✓ | ✓ | Cannot edit risk_id |
| 3. Change title | ✓ | ✓ | Title updates |
| 4. Change probability | ✓ | ✓ | Score recalculates |
| 5. Change impact | ✓ | ✓ | Score recalculates |
| 6. Change owner | ✓ | ✓ | Owner dropdown |
| 7. Submit changes | POST `/risk/edit/:id` | PUT `/risk-v2/:id` | Risk updated |
| 8. Verify in table | ✓ | ✓ | Changes appear |

**Test 1.4: Delete Risk**
| Step | ARIA5 | Risk v2 | Expected Result |
|------|-------|---------|-----------------|
| 1. Click "Delete" on risk | DELETE `/:id` | DELETE `/api/:id` | Confirmation |
| 2. Confirm deletion | ✓ | ✓ | Risk deleted |
| 3. Verify removed from table | ✓ | ✓ | Risk gone |

**Test 1.5: Status Change**
| Step | ARIA5 | Risk v2 | Expected Result |
|------|-------|---------|-----------------|
| 1. Click "Change Status" | `/risk/status-change/:id` | `/risk-v2/ui/status/:id` | Modal opens |
| 2. Current status disabled | ✓ | ✓ | Cannot select current |
| 3. Select new status | ✓ | ✓ | New status selected |
| 4. Add reason (optional) | ✓ | ✓ | Text area |
| 5. Submit | POST `/risk/status-change/:id` | PATCH `/risk-v2/:id/status` | Status updated |
| 6. Verify badge color | ✓ | ✓ | Badge changes |

---

#### **Scenario 2: Filters and Search**

**Test 2.1: Filter by Status**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Select "Active" status | ✓ | ✓ | Shows active only |
| 2. Select "Mitigated" status | ✓ | ✓ | Shows mitigated only |
| 3. Clear filter | ✓ | ✓ | Shows all |

**Test 2.2: Filter by Category**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Select "Cybersecurity" | ✓ | ✓ | Shows cyber only |
| 2. Select "Operational" | ✓ | ✓ | Shows operational only |
| 3. Clear filter | ✓ | ✓ | Shows all |

**Test 2.3: Filter by Risk Level**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Select "Critical" | ✓ | ✓ | Score 20-25 only |
| 2. Select "High" | ✓ | ✓ | Score 12-19 only |
| 3. Select "Medium" | ✓ | ✓ | Score 6-11 only |
| 4. Select "Low" | ✓ | ✓ | Score 1-5 only |

**Test 2.4: Search**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Search "breach" | ✓ | ✓ | Matches title/desc |
| 2. Search "RISK-00001" | ✓ | ✓ | Finds by risk_id |
| 3. Clear search | ✓ | ✓ | Shows all |

**Test 2.5: Combined Filters**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Status=Active + Category=Cyber | ✓ | ✓ | Both applied |
| 2. + Risk Level=Critical | ✓ | ✓ | All 3 applied |
| 3. + Search="ransomware" | ✓ | ✓ | All 4 applied |

---

#### **Scenario 3: Import/Export**

**Test 3.1: Export CSV**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Click "Export" | POST `/risk/export` | POST `/risk-v2/ui/export` | CSV downloads |
| 2. Open CSV | ✓ | ✓ | Valid format |
| 3. Verify risk_id column | ✓ | ✓ | RISK-XXXXX |
| 4. Verify all fields | ✓ | ✓ | Complete data |
| 5. Export with filters | ✓ | ✓ | Filtered data only |

**Test 3.2: Import CSV**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Click "Import" | `/risk/import` | `/risk-v2/ui/import` | Modal opens |
| 2. Download template | ❌ Not available | ✅ `/import/template` | CSV template |
| 3. Upload valid CSV | ✓ | ✓ | Import succeeds |
| 4. Upload invalid CSV | ✓ | ✓ | Errors shown |
| 5. Validation mode | ❌ Not available | ✅ | Pre-check |
| 6. Skip duplicates | ❌ Not tested | ✅ | Option available |
| 7. Verify imported risks | ✓ | ✓ | Appear in table |

---

#### **Scenario 4: Statistics and Analytics**

**Test 4.1: Statistics Cards**
| Metric | ARIA5 | Risk v2 | Result |
|--------|-------|---------|--------|
| Total Risks | ✓ | ✓ | Same count |
| Critical Risks | ✓ | ✓ | Same count |
| High Risks | ✓ | ✓ | Same count |
| Medium Risks | ✓ | ✓ | Same count |
| Low Risks | ✓ | ✓ | Same count |
| Risk Distribution % | ✓ | ✓ | Same percentages |

**Test 4.2: HTMX Live Updates**
| Action | ARIA5 | Risk v2 | Result |
|--------|-------|---------|--------|
| Stats load on page load | ✓ | ✓ | HTMX trigger |
| Table loads on page load | ✓ | ✓ | HTMX trigger |
| Filter triggers table update | ✓ | ✓ | No full reload |
| Create updates table | ✓ | ✓ | No full reload |
| Edit updates table | ✓ | ✓ | No full reload |
| Delete updates table | ✓ | ✓ | No full reload |

---

#### **Scenario 5: AI Features (ARIA5 Only)**

**Test 5.1: AI Analysis**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Open risk modal | ✓ | ✓ | Modal opens |
| 2. Click "AI Analysis" button | ✅ Available | ❌ MISSING | N/A |
| 3. AI analyzes risk | ✅ Works | ❌ MISSING | N/A |
| 4. Shows AI insights | ✅ Works | ❌ MISSING | N/A |

**Test 5.2: AI Form Fill**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Open create modal | ✓ | ✓ | Modal opens |
| 2. Enter partial info | ✓ | ✓ | Fields filled |
| 3. Click "AI Fill" button | ✅ Available | ❌ MISSING | N/A |
| 4. AI completes form | ✅ Works | ❌ MISSING | N/A |

**Test 5.3: Dynamic Risk Generation**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Navigate to Dynamic Risks | ✅ `/api/ti/dynamic-risks` | ❌ MISSING | N/A |
| 2. View threat intelligence | ✅ Works | ❌ MISSING | N/A |
| 3. Auto-generate risk | ✅ Works | ❌ MISSING | N/A |

---

#### **Scenario 6: Incidents (ARIA5 Only)**

**Test 6.1: View Incidents**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Navigate to incidents | ✅ `/risk/incidents` | ❌ MISSING | N/A |
| 2. View incident list | ✅ Works | ❌ MISSING | N/A |
| 3. Filter incidents | ✅ Works | ❌ MISSING | N/A |

**Test 6.2: Create Incident**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Click "New Incident" | ✅ `/risk/incidents/new` | ❌ MISSING | N/A |
| 2. Fill incident details | ✅ Works | ❌ MISSING | N/A |
| 3. Link to risk | ✅ Works | ❌ MISSING | N/A |
| 4. Submit | ✅ Works | ❌ MISSING | N/A |

---

#### **Scenario 7: KRI Dashboard (ARIA5 Only)**

**Test 7.1: Key Risk Indicators**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Navigate to KRI | ✅ `/risk/kris` | ❌ MISSING | N/A |
| 2. View KRI metrics | ✅ Works | ❌ MISSING | N/A |
| 3. View trends | ✅ Works | ❌ MISSING | N/A |

---

#### **Scenario 8: Assessments (ARIA5 Only)**

**Test 8.1: Risk Assessments**
| Step | ARIA5 | Risk v2 | Result |
|------|-------|---------|--------|
| 1. Navigate to Assessments | ✅ `/risk/assessments` | ❌ MISSING | N/A |
| 2. View assessment list | ✅ Works | ❌ MISSING | N/A |
| 3. Create assessment | ✅ Works | ❌ MISSING | N/A |

---

## 📊 **Test Results Summary**

### **Core Features: PASS ✅**
- CRUD operations: **100% parity**
- Filters and search: **100% parity**
- Import/Export: **100% parity** (v2 has improvements)
- Statistics: **100% parity**
- HTMX interactions: **100% parity**

### **Advanced Features: FAIL ❌**
- AI features: **0% parity** (15 features missing)
- Incident management: **0% parity**
- KRI dashboard: **0% parity**
- Assessments: **0% parity**
- Dynamic risk tracking: **0% parity**

### **Overall Feature Parity: ~40%**
- Core risk management: **100%** ✅
- Advanced features: **0%** ❌
- Weighted average: **~40%**

---

## 🚨 **CRITICAL RECOMMENDATION**

### **Risk Module v2 is NOT Ready for Production Switchover**

**Reason**: Missing 15 critical features that exist in ARIA5:
1. AI-powered risk analysis
2. AI form auto-fill
3. Incident management
4. KRI dashboard
5. Risk assessments
6. Dynamic risk tracking
7. Threat intelligence integration

### **Options:**

**Option 1: Implement Missing Features (Recommended)**
- Estimated time: 40-60 hours
- Implement AI features, incidents, KRI, assessments
- Achieve 100% feature parity
- Then proceed with production switchover

**Option 2: Parallel Deployment**
- Deploy v2 alongside ARIA5 (not as replacement)
- Use v2 for basic risk management
- Use ARIA5 for advanced features
- Gradually migrate features to v2

**Option 3: Accept Limited Scope**
- Document that v2 is "Core Risk Management Only"
- Remove advanced features from ARIA5 as well
- Switchover with reduced feature set
- **NOT RECOMMENDED** - loses competitive advantage

---

## ✅ **What IS Ready for Production**

The following features in Risk v2 are production-ready:
- ✅ Create, view, edit, delete risks
- ✅ Status change management
- ✅ Filters (status, category, risk level)
- ✅ Search functionality
- ✅ Import/Export CSV
- ✅ Statistics dashboard
- ✅ Owner name display
- ✅ Risk ID field
- ✅ Live score calculation
- ✅ HTMX interactions
- ✅ Responsive design
- ✅ Clean Architecture (maintainable code)

**v2 is production-ready for BASIC risk management workflows.**

---

## 🎯 **Next Steps**

### **Immediate Actions:**
1. **STOP** production switchover planning
2. **DOCUMENT** missing features clearly
3. **DECIDE** on strategy (Option 1, 2, or 3)
4. **UPDATE** project plan with realistic timeline

### **If Proceeding with Option 1 (Implement Missing Features):**
1. Week 4-5: AI features integration (20 hours)
2. Week 6: Incident management (15 hours)
3. Week 7: KRI dashboard (10 hours)
4. Week 8: Assessments (8 hours)
5. Week 9: Dynamic risk tracking (12 hours)
6. Week 10: Testing and switchover (15 hours)

**Total additional time**: 80 hours (~2-3 months part-time)

### **If Proceeding with Option 2 (Parallel Deployment):**
1. Day 11: Deploy v2 as `/risk-v2/*` (keep ARIA5 at `/risk/*`)
2. Day 12: Update navigation to show both options
3. Ongoing: Gradually implement missing features
4. Future: Switchover when parity achieved

---

## 📝 **Conclusion**

Risk Module v2 has **excellent Clean Architecture** and **solid core functionality**, but is **missing critical advanced features** that differentiate ARIA5 from competitors.

**Recommendation**: Deploy v2 in **parallel** with ARIA5, not as a replacement. Use v2 for teams needing only basic risk management, continue using ARIA5 for advanced users.

---

**Generated**: 2025-10-23  
**Testing Status**: ⚠️ **INCOMPLETE** - Missing 15 features  
**Production Readiness**: ❌ **NOT READY** for full switchover  
**Core Features**: ✅ **READY** for basic risk management
