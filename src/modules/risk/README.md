# Risk Management Module v2.0

**Clean Architecture Implementation** | **DDD Pattern** | **CQRS**

---

## Overview

Complete rewrite of the risk management module following Clean Architecture and Domain-Driven Design principles. Extracted from monolithic 4,183-line file into clean, testable, maintainable layers.

---

## Architecture

```
risk/
├── domain/              1,811 lines  ✅ Week 1 Day 1
│   ├── entities/        Risk aggregate root
│   ├── value-objects/   RiskScore, RiskStatus, RiskCategory
│   ├── events/          Domain events (4 types)
│   └── repositories/    IRiskRepository interface
│
├── application/         1,683 lines  ✅ Week 1 Days 2-3
│   ├── dto/             DTOs for data transfer
│   ├── commands/        CQRS commands (4 types)
│   ├── queries/         CQRS queries (4 types)
│   └── handlers/        8 handlers (4 command, 4 query)
│
├── infrastructure/      822 lines    ✅ Week 1 Day 4
│   ├── mappers/         Entity ↔ Database conversion
│   └── repositories/    D1RiskRepository (24 methods)
│
└── presentation/        1,716 lines  ✅ Week 2 Days 6-7
    ├── validation/      Zod schemas (5 schemas)
    ├── middleware/      Validation middleware
    └── routes/          Hono routes (20+ endpoints)
```

**Total**: 6,032 lines across 60+ files

---

## API Endpoints

### Base Path: `/risk-v2/*`

#### Core CRUD
- `POST /create` - Create new risk
- `GET /:id` - Get risk by database ID
- `GET /riskId/:riskId` - Get risk by business ID
- `PUT /:id` - Update risk (full/partial)
- `PATCH /:id/status` - Update status with audit trail
- `DELETE /:id` - Delete risk by database ID
- `DELETE /riskId/:riskId` - Delete risk by business ID

#### Query & List
- `GET /list` - List with filters, sorting, pagination
- `GET /search?q=<query>` - Search risks
- `GET /statistics` - Get aggregated statistics

#### Specialized Queries
- `GET /critical` - Critical risks (score >= 20)
- `GET /needs-attention` - Active high/critical or overdue
- `GET /overdue-reviews` - Overdue review dates

#### Bulk Operations
- `POST /bulk/create` - Create multiple (max 50)
- `DELETE /bulk/delete` - Delete multiple (max 100)
- `PATCH /bulk/status` - Update status bulk (max 100)

#### Health
- `GET /health` - Health check with DB connectivity

---

## Domain Model

### Risk Aggregate Root
**36+ Business Rules Implemented**:
- Risk score calculation (Probability × Impact)
- Risk level determination (Low, Medium, High, Critical)
- Status state machine (7 valid statuses)
- Review date tracking
- Mitigation/contingency planning
- Tag management
- Metadata support

### Value Objects
- **RiskScore**: Immutable probability × impact calculation
- **RiskStatus**: 7 valid statuses with state machine
- **RiskCategory**: 15 categories with metadata

### Domain Events
- `RiskCreatedEvent` - Fired on creation
- `RiskUpdatedEvent` - Fired on updates
- `RiskDeletedEvent` - Fired on deletion
- `RiskStatusChangedEvent` - Fired on status changes

---

## Repository Interface

**IRiskRepository** (24 methods):

### Core CRUD
- `save(risk)` - Create or update
- `findById(id)` - Get by database ID
- `findByRiskId(riskId)` - Get by business ID
- `delete(id)` - Delete risk

### Query Operations
- `list(filters, sort, pagination)` - Advanced filtering
- `search(query, organizationId)` - Full-text search
- `findByOwner(ownerId)` - By owner
- `findByOrganization(orgId)` - By organization
- `findByStatus(status)` - By status
- `findByCategory(category)` - By category

### Specialized Queries
- `findCriticalRisks(orgId)` - score >= 20
- `findNeedingAttention(orgId)` - High priority risks
- `findOverdueReviews(orgId)` - Overdue review dates

### Statistics
- `getStatistics(orgId)` - Aggregated data

### Bulk Operations
- `saveMany(risks)` - Batch create/update
- `deleteMany(ids)` - Batch delete
- `updateStatusBulk(ids, status)` - Batch status update

---

## Validation

### Zod Schemas
- **CreateRiskSchema** - All required fields validated
- **UpdateRiskSchema** - Partial updates (at least one field)
- **ListRisksQuerySchema** - Query parameters with coercion
- **UpdateStatusSchema** - Status changes with audit trail
- **BulkOperationSchema** - Bulk operations with limits

### Middleware
- `validateBody(schema)` - Validate JSON body
- `validateQuery(schema)` - Validate query params
- `validateParams(schema)` - Validate route params

---

## CQRS Pattern

### Commands (State-Changing)
1. **CreateRiskCommand** → `CreateRiskHandler`
   - Validates risk ID uniqueness
   - Creates Risk aggregate
   - Publishes RiskCreatedEvent

2. **UpdateRiskCommand** → `UpdateRiskHandler`
   - Loads existing risk
   - Applies updates
   - Publishes RiskUpdatedEvent

3. **DeleteRiskCommand** → `DeleteRiskHandler`
   - Soft/hard delete
   - Publishes RiskDeletedEvent

4. **ChangeRiskStatusCommand** → `ChangeRiskStatusHandler`
   - Validates status transition
   - Updates status
   - Publishes RiskStatusChangedEvent

### Queries (Read-Only)
1. **GetRiskByIdQuery** → `GetRiskByIdHandler`
   - Returns single risk by ID
   - Optional owner/creator inclusion

2. **ListRisksQuery** → `ListRisksHandler`
   - Advanced filtering
   - Pagination
   - Sorting

3. **SearchRisksQuery** → `SearchRisksHandler`
   - Full-text search
   - Limit 50 results

4. **GetRiskStatisticsQuery** → `GetRiskStatisticsHandler`
   - Aggregated counts by status
   - Counts by risk level
   - Counts by category
   - Average score

---

## Data Flow

```
HTTP Request
    ↓
Hono Route (/risk-v2/*)
    ↓
Validation Middleware (Zod)
    ↓
Type-Safe Context
    ↓
Command/Query Object
    ↓
Handler (CQRS)
    ↓
Domain Entity (Risk)
    ↓
Repository (D1)
    ↓
Database (SQLite)
    ↓
Response DTO
    ↓
JSON Response
```

---

## Database Schema

```sql
CREATE TABLE risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  probability INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  organization_id INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  risk_type TEXT DEFAULT 'business',
  mitigation_plan TEXT,
  contingency_plan TEXT,
  review_date TEXT,
  last_review_date TEXT,
  tags TEXT,  -- JSON array
  metadata TEXT,  -- JSON object
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_risks_risk_id ON risks(risk_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_organization ON risks(organization_id);
CREATE INDEX idx_risks_owner ON risks(owner_id);
CREATE INDEX idx_risks_category ON risks(category);
CREATE INDEX idx_risks_risk_score ON risks(risk_score);
CREATE INDEX idx_risks_review_date ON risks(review_date);
```

---

## Testing Strategy

### Unit Tests (Day 5 - Pending)
- RiskMapper tests (~150 lines)
- Domain entity tests
- Value object tests

### Integration Tests (Day 5 - Pending)
- D1RiskRepository tests (~300 lines)
- Handler integration tests
- End-to-end flow tests

### Target Coverage
- 90%+ code coverage
- All critical paths tested

---

## Usage Examples

### Create Risk
```typescript
import { createRiskRoutesV2 } from './presentation/routes';

const riskRoutes = createRiskRoutesV2();
app.route('/risk-v2', riskRoutes);
```

```bash
curl -X POST http://localhost:3000/risk-v2/create \
  -H "Content-Type: application/json" \
  -d '{
    "riskId": "RISK-001",
    "title": "Data breach risk",
    "description": "Potential unauthorized access to customer data",
    "category": "cybersecurity",
    "probability": 4,
    "impact": 5,
    "organizationId": 1,
    "ownerId": 101,
    "createdBy": 101,
    "tags": ["security", "data-protection"]
  }'
```

### List Risks with Filters
```bash
curl "http://localhost:3000/risk-v2/list?\
page=1&\
limit=20&\
status=active&\
riskLevel=high&\
sortBy=score&\
sortOrder=desc"
```

### Search Risks
```bash
curl "http://localhost:3000/risk-v2/search?q=data+breach&organizationId=1"
```

### Get Statistics
```bash
curl "http://localhost:3000/risk-v2/statistics?organizationId=1"
```

---

## Migration Path

### Phase 1 (Current): Parallel Endpoints
- Old routes: `/risk/*` (monolithic, 4,183 lines)
- New routes: `/risk-v2/*` (clean architecture, 6,032 lines)
- Both active simultaneously
- Zero downtime migration

### Phase 2 (Week 3): Testing & Validation
- Side-by-side comparison
- Feature parity verification
- Performance testing
- Bug fixes

### Phase 3 (Week 3): Switchover
- Update frontend to use `/risk-v2/*`
- Deprecate `/risk/*` routes
- Remove old implementation
- Documentation updates

---

## Benefits

### Code Quality
- ✅ Clean Architecture layers
- ✅ DDD patterns
- ✅ SOLID principles
- ✅ Type-safe throughout
- ✅ Zero compilation errors

### Maintainability
- ✅ 6,032 lines across 60+ files (vs 4,183 lines in 1 file)
- ✅ Single Responsibility Principle
- ✅ Easy to locate and fix bugs
- ✅ Clear separation of concerns

### Testability
- ✅ Mockable dependencies
- ✅ Isolated layers
- ✅ CQRS pattern (separate read/write)
- ✅ Repository interface (swappable implementation)

### Extensibility
- ✅ Easy to add new commands/queries
- ✅ Domain events for integration
- ✅ Pluggable validation
- ✅ Flexible filtering/sorting

---

## Status

- ✅ **Week 1** (Days 1-4): Foundation Complete (Domain + Application + Infrastructure)
- ✅ **Week 2** (Days 6-7): Validation + Routes Complete
- ⏳ **Week 2** (Days 8-9): UI Templates (Pending)
- ⏳ **Week 3** (Days 10-12): Testing + Migration (Pending)

**Current**: 6,032 lines, 60+ files, 20+ endpoints, 0 TypeScript errors

---

## Next Steps

1. **Days 8-9**: UI Templates (~400 lines)
   - Extract templates from `/risk/*` routes
   - HTMX integration
   - Form validation
   - UI components

2. **Days 10-11**: Testing & Validation
   - Side-by-side testing
   - Feature parity verification
   - Performance comparison

3. **Day 12**: Switchover & Deployment
   - Frontend migration
   - Route deprecation
   - Documentation updates
   - Production deployment

---

## Team

**Developer**: Avi (Security Specialist)  
**Architecture**: Clean Architecture + DDD + CQRS  
**Timeline**: 3 weeks (12 days)  
**Current Progress**: 60% complete (Days 1-7 of 12)

---

## Links

- [Phase 1.2 Day 4 Report](../../PHASE_1_2_DAY_4_COMPLETE.md)
- [Phase 1.2 Days 6-7 Report](../../PHASE_1_2_DAY_6_7_COMPLETE.md)
- Original monolithic file: `src/routes/risk-routes-aria5.ts` (4,183 lines)
