# Phase 1.2: Incremental Migration Plan

**Strategy**: Option A - Incremental Migration  
**Timeline**: 2-3 weeks  
**Approach**: Feature-by-feature migration with parallel systems  

---

## 📋 Migration Phases

### **Phase 1: Core CRUD Operations** (Week 1 - Nov 5-9)
**Priority**: HIGH  
**Risk**: LOW  
**Status**: 🔄 IN PROGRESS  

#### Features to Migrate (15 endpoints)
1. ✅ Risk list view (`GET /risk/`)
2. ✅ Risk statistics (`GET /risk/stats`)
3. ✅ Risk table (`GET /risk/table`)
4. ✅ Create risk form (`GET /risk/create`)
5. ✅ Create risk (`POST /risk/create`)
6. ✅ View risk detail (`GET /risk/view/:id`)
7. ✅ Edit risk form (`GET /risk/edit/:id`)
8. ✅ Update risk (`POST /risk/edit/:id`)
9. ✅ Delete risk (`DELETE /risk/:id`)
10. ✅ Calculate score (`POST /risk/calculate-score`)
11. ✅ Status change form (`GET /risk/status-change/:id`)
12. ✅ Update status (`POST /risk/status-change/:id`)
13. ✅ Alternative list (`GET /risk/risks`)
14. ✅ Key indicators (`GET /risk/kris`)
15. ✅ Enhanced table (`GET /risk/table-enhanced`)

#### Technical Implementation
- ✅ Domain Model (Risk entity, value objects)
- ✅ Repository pattern with D1
- ✅ Command handlers (Create, Update, Delete)
- ✅ Query handlers (List, GetById, Stats)
- ✅ UI templates (maintain exact styling)
- ✅ Validation schemas
- ✅ Integration with existing auth

#### Success Criteria
- [ ] All 15 endpoints working identically
- [ ] UI matches pixel-perfect
- [ ] No breaking changes to API
- [ ] Tests for all operations
- [ ] Documentation complete

---

### **Phase 2: Advanced Features** (Week 2 - Nov 12-16)
**Priority**: MEDIUM  
**Risk**: MEDIUM  
**Status**: ⏳ PENDING  

#### Features to Migrate (10 endpoints)
1. ⏳ AI analysis (`POST /risk/analyze-ai`)
2. ⏳ Fill from AI (`POST /risk/fill-from-ai`)
3. ⏳ Update from AI (`POST /risk/update-from-ai`)
4. ⏳ Assessments (`GET /risk/assessments`)
5. ⏳ Import page (`GET /risk/import`)
6. ⏳ Import risks (`POST /risk/import`)
7. ⏳ Export risks (`POST /risk/export`)
8. ⏳ Alternative create form (`GET /risk/add`)
9. ⏳ Debug endpoints (4 endpoints)

#### Technical Implementation
- ⏳ AI service integration
- ⏳ Import/Export service
- ⏳ Assessment entity
- ⏳ File handling
- ⏳ AI command handlers

---

### **Phase 3: Threat Intelligence & Incidents** (Week 3 - Nov 19-23)
**Priority**: MEDIUM  
**Risk**: HIGH  
**Status**: ⏳ PENDING  

#### Features to Migrate (11 endpoints)
1. ⏳ Dynamic risks from TI (`GET /risk/api/ti/dynamic-risks`)
2. ⏳ Auto-generate risk (`POST /risk/api/ti/auto-generate-risk`)
3. ⏳ Validate risk (`POST /risk/api/ti/validate-risk/:id`)
4. ⏳ Pipeline stats (`GET /risk/api/ti/risk-pipeline-stats`)
5. ⏳ State history (`GET /risk/api/ti/risk/:id/state-history`)
6. ⏳ Process threats (`POST /risk/api/ti/process-detected-threats`)
7. ⏳ Incidents list (`GET /risk/incidents`)
8. ⏳ New incident form (`GET /risk/incidents/new`)
9. ⏳ Create incident (`POST /risk/incidents/create`)

#### Technical Implementation
- ⏳ Threat Intelligence integration
- ⏳ Incident entity
- ⏳ Dynamic risk state management
- ⏳ Event-driven risk generation
- ⏳ Pipeline orchestration

---

## 🎯 Current Focus: Phase 1 - Core CRUD

### Implementation Order
1. ✅ **Value Objects** (RiskScore ✓, RiskStatus, RiskCategory)
2. ⏳ **Domain Entities** (Risk aggregate root)
3. ⏳ **Domain Events** (RiskCreated, RiskUpdated, etc.)
4. ⏳ **Repository Interface** (IRiskRepository)
5. ⏳ **Application DTOs** (CreateRiskDTO, UpdateRiskDTO, etc.)
6. ⏳ **Command Handlers** (CreateRisk, UpdateRisk, DeleteRisk)
7. ⏳ **Query Handlers** (GetRisk, ListRisks, GetStats)
8. ⏳ **Infrastructure** (D1RiskRepository implementation)
9. ⏳ **Presentation** (Routes, templates, validation)
10. ⏳ **Integration** (Wire up to index-secure.ts)

---

## 🔄 Deployment Strategy

### Parallel Operation
```typescript
// Old routes stay active at /risk/*
import { createRiskRoutesARIA5 } from './routes/risk-routes-aria5';

// New routes accessible at /risk-v2/* during testing
import { createRiskRoutesV2 } from './modules/risk/presentation/routes/risk-routes';

app.route('/risk', createRiskRoutesARIA5()); // Old (stays working)
app.route('/risk-v2', createRiskRoutesV2()); // New (parallel testing)
```

### Switchover Process
1. Deploy new routes at `/risk-v2/*`
2. Test thoroughly with real data
3. Compare behavior side-by-side
4. Fix any discrepancies
5. Switch `/risk/*` to new implementation
6. Keep old code for 1 week as backup
7. Remove old code after verification

---

## 📊 Progress Tracking

### Week 1 Daily Goals

**Monday** (Nov 5)
- [x] Analysis complete
- [x] Plan approved
- [ ] Value objects complete (3/3)
- [ ] Domain entity started

**Tuesday** (Nov 6)
- [ ] Domain entity complete
- [ ] Domain events complete
- [ ] Repository interface complete

**Wednesday** (Nov 7)
- [ ] Application DTOs complete
- [ ] Command handlers complete (3/3)
- [ ] Query handlers started

**Thursday** (Nov 8)
- [ ] Query handlers complete (5/5)
- [ ] Infrastructure repository complete
- [ ] Validation schemas complete

**Friday** (Nov 9)
- [ ] Presentation routes complete
- [ ] UI templates migrated
- [ ] Integration with auth
- [ ] Initial testing complete

---

## ✅ Definition of Done (Phase 1)

### Functionality
- [ ] All 15 endpoints respond correctly
- [ ] Data validation working
- [ ] Error handling consistent
- [ ] Authentication integrated
- [ ] CSRF protection active

### Quality
- [ ] Unit tests written (>90% coverage)
- [ ] Integration tests passing
- [ ] UI matches existing exactly
- [ ] Performance equivalent or better
- [ ] No console errors

### Documentation
- [ ] API endpoints documented
- [ ] Domain model documented
- [ ] Migration guide written
- [ ] Rollback procedure documented

---

## 🚨 Risk Mitigation

### Technical Risks
- **Data Loss**: Use transactions, test with backups
- **UI Breaking**: Maintain exact HTML structure
- **Auth Issues**: Thorough auth testing
- **Performance**: Monitor query performance

### Mitigation Strategies
1. **Feature Flags**: Can disable new code instantly
2. **Parallel Routes**: Old system always available
3. **Database Migrations**: Reversible schema changes
4. **Comprehensive Testing**: Test every endpoint
5. **Staged Rollout**: Deploy to staging first

---

## 📞 Communication Plan

### Daily Standups
- Progress on current features
- Blockers identified
- Next 24-hour goals

### Weekly Reviews
- Demo completed features
- UI comparison screenshots
- Performance metrics
- Adjust plan if needed

---

**Status**: Phase 1 in progress  
**Next**: Complete value objects and domain entity  
**ETA**: Week 1 completion by Nov 9, 2025
