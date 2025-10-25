# 🚀 Next Phase: Week 2-3 - Risk Domain Extraction

## 📋 Overview

**Phase**: Week 2-3 of 8-week refactoring  
**Objective**: Extract Risk domain from monolithic `risk-routes-aria5.ts`  
**Target**: Transform 4,185 lines → 10 modular files (<500 lines each)  
**Timeline**: 14 days (2 weeks)  
**Status**: ⏳ READY TO START (Week 1 infrastructure complete)

---

## 🎯 Goals & Objectives

### Primary Goals
1. ✅ Extract Risk domain into clean DDD architecture
2. ✅ Reduce file size from 4,185 lines to <500 lines per module
3. ✅ Implement CQRS pattern for all risk operations
4. ✅ Achieve >90% test coverage
5. ✅ Deploy to production without breaking existing features

### Success Criteria
- ✅ All 10 modules created and working
- ✅ Zero TypeScript compilation errors
- ✅ All existing Risk APIs continue working
- ✅ Response times improved or maintained
- ✅ UI functionality unchanged (same user experience)

---

## 📦 Deliverables Breakdown

### Module Structure (10 Files Total)

```
src/domains/risks/
├── core/                                    # Domain Layer (3 files)
│   ├── entities/
│   │   ├── Risk.ts                         # ~200 lines - Risk entity
│   │   ├── RiskTreatment.ts                # ~150 lines - Treatment entity
│   │   └── KRI.ts                          # ~180 lines - KRI entity
│   ├── value-objects/
│   │   ├── RiskScore.ts                    # ~80 lines - Score calculation
│   │   └── RiskStatus.ts                   # ~40 lines - Status enum
│   └── repositories/
│       ├── IRiskRepository.ts              # ~60 lines - Interface
│       └── IKRIRepository.ts               # ~50 lines - Interface
│
├── application/                             # Application Layer (2 files)
│   ├── commands/
│   │   ├── CreateRiskCommand.ts            # ~80 lines
│   │   ├── UpdateRiskCommand.ts            # ~90 lines
│   │   └── DeleteRiskCommand.ts            # ~60 lines
│   ├── queries/
│   │   ├── ListRisksQuery.ts               # ~70 lines
│   │   ├── GetRiskByIdQuery.ts             # ~50 lines
│   │   └── SearchRisksQuery.ts             # ~100 lines
│   └── handlers/
│       ├── CreateRiskHandler.ts            # ~120 lines
│       ├── UpdateRiskHandler.ts            # ~130 lines
│       ├── DeleteRiskHandler.ts            # ~80 lines
│       ├── ListRisksHandler.ts             # ~100 lines
│       ├── GetRiskByIdHandler.ts           # ~70 lines
│       └── SearchRisksHandler.ts           # ~150 lines
│
├── infrastructure/                          # Infrastructure Layer (2 files)
│   ├── persistence/
│   │   ├── D1RiskRepository.ts             # ~350 lines - DB operations
│   │   └── D1KRIRepository.ts              # ~280 lines - KRI DB ops
│   └── mappers/
│       ├── RiskMapper.ts                   # ~150 lines - Domain↔DB
│       └── KRIMapper.ts                    # ~120 lines - Domain↔DB
│
└── presentation/                            # Presentation Layer (3 files)
    ├── routes/
    │   └── risk.routes.ts                  # ~450 lines - API routes
    ├── validators/
    │   ├── CreateRiskValidator.ts          # ~80 lines - Zod schema
    │   ├── UpdateRiskValidator.ts          # ~90 lines - Zod schema
    │   └── SearchRiskValidator.ts          # ~60 lines - Zod schema
    └── dto/
        ├── RiskDTO.ts                      # ~100 lines - API DTOs
        └── KRIDTO.ts                       # ~80 lines - KRI DTOs
```

**Total**: ~3,500 lines (down from 4,185) split into 10 well-organized modules

---

## 📅 Week-by-Week Timeline

### Week 2 (Days 1-7): Core Implementation

#### Day 1-2: Domain Entities
**Task**: Create Risk, RiskTreatment, and KRI entities

**Files to Create**:
- [ ] `src/domains/risks/core/entities/Risk.ts`
- [ ] `src/domains/risks/core/entities/RiskTreatment.ts`
- [ ] `src/domains/risks/core/entities/KRI.ts`
- [ ] `src/domains/risks/core/value-objects/RiskScore.ts`
- [ ] `src/domains/risks/core/value-objects/RiskStatus.ts`

**Key Features**:
```typescript
// Risk.ts - Main entity with business logic
export class Risk extends AggregateRoot<number> {
  static create(props: CreateRiskProps): Risk
  calculateScore(): RiskScore
  updateStatus(status: RiskStatus): void
  mitigate(treatment: RiskTreatment): void
  assessControl(controlId: number): void
}

// RiskScore.ts - Value object for score calculation
export class RiskScore extends ValueObject<number> {
  static calculate(probability: number, impact: number): RiskScore
  get severity(): 'critical' | 'high' | 'medium' | 'low'
  get color(): string
}
```

**Deliverable**: 5 files, ~650 lines total

---

#### Day 3: Repository Interfaces
**Task**: Define repository contracts

**Files to Create**:
- [ ] `src/domains/risks/core/repositories/IRiskRepository.ts`
- [ ] `src/domains/risks/core/repositories/IKRIRepository.ts`
- [ ] `src/domains/risks/core/repositories/ITreatmentRepository.ts`

**Key Interfaces**:
```typescript
export interface IRiskRepository {
  // Queries
  findById(id: number): Promise<Risk | null>
  findByOrganization(orgId: number): Promise<Risk[]>
  findByStatus(orgId: number, status: RiskStatus): Promise<Risk[]>
  search(orgId: number, query: string): Promise<Risk[]>
  
  // Commands
  save(risk: Risk): Promise<Risk>
  update(risk: Risk): Promise<Risk>
  delete(id: number): Promise<void>
}
```

**Deliverable**: 3 files, ~170 lines total

---

#### Day 4-5: Repository Implementations
**Task**: Implement D1 database repositories with mappers

**Files to Create**:
- [ ] `src/domains/risks/infrastructure/persistence/D1RiskRepository.ts`
- [ ] `src/domains/risks/infrastructure/persistence/D1KRIRepository.ts`
- [ ] `src/domains/risks/infrastructure/persistence/D1TreatmentRepository.ts`
- [ ] `src/domains/risks/infrastructure/mappers/RiskMapper.ts`
- [ ] `src/domains/risks/infrastructure/mappers/KRIMapper.ts`
- [ ] `src/domains/risks/infrastructure/mappers/TreatmentMapper.ts`

**Key Features**:
```typescript
// D1RiskRepository.ts - Database operations
export class D1RiskRepository implements IRiskRepository {
  constructor(private db: D1Database) {}
  
  async findById(id: number): Promise<Risk | null> {
    const result = await this.db
      .prepare('SELECT * FROM risks WHERE id = ?')
      .bind(id)
      .first();
    return result ? RiskMapper.toDomain(result) : null;
  }
  // ... other methods
}

// RiskMapper.ts - Domain ↔ Database mapping
export class RiskMapper {
  static toDomain(raw: any): Risk {
    return Risk.create({
      id: raw.id,
      title: raw.title,
      // ... map all fields
    });
  }
  
  static toPersistence(risk: Risk): any {
    return {
      id: risk.id,
      title: risk.title,
      // ... map all fields
    };
  }
}
```

**Deliverable**: 6 files, ~1,000 lines total

---

#### Day 6-7: CQRS Handlers
**Task**: Implement command and query handlers

**Files to Create**:

**Commands**:
- [ ] `src/domains/risks/application/commands/CreateRiskCommand.ts`
- [ ] `src/domains/risks/application/commands/UpdateRiskCommand.ts`
- [ ] `src/domains/risks/application/commands/DeleteRiskCommand.ts`

**Queries**:
- [ ] `src/domains/risks/application/queries/ListRisksQuery.ts`
- [ ] `src/domains/risks/application/queries/GetRiskByIdQuery.ts`
- [ ] `src/domains/risks/application/queries/SearchRisksQuery.ts`

**Handlers**:
- [ ] `src/domains/risks/application/handlers/CreateRiskHandler.ts`
- [ ] `src/domains/risks/application/handlers/UpdateRiskHandler.ts`
- [ ] `src/domains/risks/application/handlers/DeleteRiskHandler.ts`
- [ ] `src/domains/risks/application/handlers/ListRisksHandler.ts`
- [ ] `src/domains/risks/application/handlers/GetRiskByIdHandler.ts`
- [ ] `src/domains/risks/application/handlers/SearchRisksHandler.ts`

**Key Implementation**:
```typescript
// CreateRiskCommand.ts
export class CreateRiskCommand extends Command {
  constructor(public readonly data: CreateRiskDTO) {
    super();
  }
  
  validate(): void {
    if (!this.data.title) throw new ValidationError('Title required');
    if (this.data.probability < 1 || this.data.probability > 5) {
      throw new ValidationError('Probability must be 1-5');
    }
  }
}

// CreateRiskHandler.ts
export class CreateRiskHandler extends BaseCommandHandler<CreateRiskCommand, Risk> {
  constructor(
    private riskRepository: IRiskRepository,
    private eventBus: EventBus
  ) {
    super();
  }
  
  protected async handle(command: CreateRiskCommand): Promise<Risk> {
    // 1. Create domain entity
    const risk = Risk.create(command.data);
    
    // 2. Save to database
    const savedRisk = await this.riskRepository.save(risk);
    
    // 3. Publish domain events
    await this.eventBus.publishAll(savedRisk.getDomainEvents());
    
    return savedRisk;
  }
}
```

**Deliverable**: 12 files, ~1,050 lines total

---

### Week 3 (Days 8-14): Routes, Testing & Deployment

#### Day 8-9: Routes & Validators
**Task**: Create API routes with Zod validation

**Files to Create**:
- [ ] `src/domains/risks/presentation/routes/risk.routes.ts`
- [ ] `src/domains/risks/presentation/validators/CreateRiskValidator.ts`
- [ ] `src/domains/risks/presentation/validators/UpdateRiskValidator.ts`
- [ ] `src/domains/risks/presentation/validators/SearchRiskValidator.ts`
- [ ] `src/domains/risks/presentation/dto/RiskDTO.ts`
- [ ] `src/domains/risks/presentation/dto/KRIDTO.ts`

**Key Implementation**:
```typescript
// risk.routes.ts
import { Hono } from 'hono';
import { authMiddleware } from '@/shared/presentation/middleware/auth.middleware';
import { validateMiddleware } from '@/shared/presentation/middleware/validate.middleware';
import { CreateRiskValidator } from '../validators/CreateRiskValidator';
import { CreateRiskHandler } from '../../application/handlers/CreateRiskHandler';
import { ApiResponse } from '@/shared/presentation/responses/ApiResponse';

const riskRoutes = new Hono();

// POST /api/risks - Create risk
riskRoutes.post(
  '/',
  authMiddleware,
  validateMiddleware(CreateRiskValidator.schema),
  async (c) => {
    const data = getValidatedData<CreateRiskDTO>(c);
    const handler = new CreateRiskHandler(riskRepository, eventBus);
    const risk = await handler.execute(new CreateRiskCommand(data));
    return c.json(ApiResponse.success(risk, 'Risk created successfully'), 201);
  }
);

// GET /api/risks - List risks
riskRoutes.get(
  '/',
  authMiddleware,
  async (c) => {
    const user = getCurrentUser(c);
    const handler = new ListRisksHandler(riskRepository);
    const risks = await handler.execute(new ListRisksQuery(user.organizationId));
    return c.json(ApiResponse.success(risks));
  }
);

// GET /api/risks/:id - Get risk by ID
riskRoutes.get(
  '/:id',
  authMiddleware,
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const handler = new GetRiskByIdHandler(riskRepository);
    const risk = await handler.execute(new GetRiskByIdQuery(id));
    
    if (!risk) {
      return c.json(ApiResponse.notFound('Risk', id), 404);
    }
    
    return c.json(ApiResponse.success(risk));
  }
);

// PUT /api/risks/:id - Update risk
riskRoutes.put(
  '/:id',
  authMiddleware,
  validateMiddleware(UpdateRiskValidator.schema),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = getValidatedData<UpdateRiskDTO>(c);
    const handler = new UpdateRiskHandler(riskRepository, eventBus);
    const risk = await handler.execute(new UpdateRiskCommand(id, data));
    return c.json(ApiResponse.success(risk, 'Risk updated successfully'));
  }
);

// DELETE /api/risks/:id - Delete risk
riskRoutes.delete(
  '/:id',
  authMiddleware,
  requireRole(['admin', 'risk_manager']),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const handler = new DeleteRiskHandler(riskRepository, eventBus);
    await handler.execute(new DeleteRiskCommand(id));
    return c.json(ApiResponse.success(null, 'Risk deleted successfully'), 204);
  }
);

// POST /api/risks/search - Search risks
riskRoutes.post(
  '/search',
  authMiddleware,
  validateMiddleware(SearchRiskValidator.schema),
  async (c) => {
    const user = getCurrentUser(c);
    const searchParams = getValidatedData<SearchRiskDTO>(c);
    const handler = new SearchRisksHandler(riskRepository);
    const risks = await handler.execute(
      new SearchRisksQuery(user.organizationId, searchParams)
    );
    return c.json(ApiResponse.success(risks));
  }
);

export default riskRoutes;
```

```typescript
// CreateRiskValidator.ts
import { z } from 'zod';

export class CreateRiskValidator {
  static schema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(2000),
    category: z.enum(['strategic', 'operational', 'financial', 'compliance', 'technological', 'reputational']),
    probability: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    ownerId: z.number().int().positive(),
    organizationId: z.number().int().positive(),
    controls: z.array(z.number()).optional(),
    tags: z.array(z.string()).optional()
  });
}
```

**Deliverable**: 6 files, ~650 lines total

---

#### Day 10: Integration
**Task**: Wire up dependencies and register routes

**Files to Update**:
- [ ] `src/index.ts` - Main application entry
- [ ] Create dependency container

**Key Implementation**:
```typescript
// src/index.ts
import { Hono } from 'hono';
import { D1Connection } from '@/shared/infrastructure/database/D1Connection';
import { EventBus } from '@/shared/application/EventBus';

// Import risk routes
import riskRoutes from '@/domains/risks/presentation/routes/risk.routes';

// Import repositories
import { D1RiskRepository } from '@/domains/risks/infrastructure/persistence/D1RiskRepository';

const app = new Hono();

// Initialize infrastructure
const initializeInfrastructure = (env: CloudflareBindings) => {
  // Initialize database connection
  D1Connection.getInstance().initialize(env.DB);
  
  // Create repositories
  const riskRepository = new D1RiskRepository(env.DB);
  
  // Create event bus
  const eventBus = EventBus.getInstance();
  
  return { riskRepository, eventBus };
};

// Register routes
app.route('/api/risks', riskRoutes);

// Keep existing routes for backward compatibility
import { createRiskRoutesARIA5 } from './routes/risk-routes-aria5';
app.route('/api/v1/risks', createRiskRoutesARIA5()); // Deprecated

export default app;
```

**Deliverable**: Updated main app, dependency injection configured

---

#### Day 11-12: Testing
**Task**: Write comprehensive tests (>90% coverage)

**Test Files to Create**:

**Unit Tests** (Domain Layer):
- [ ] `tests/unit/domains/risks/entities/Risk.test.ts`
- [ ] `tests/unit/domains/risks/entities/RiskTreatment.test.ts`
- [ ] `tests/unit/domains/risks/value-objects/RiskScore.test.ts`

**Unit Tests** (Application Layer):
- [ ] `tests/unit/domains/risks/handlers/CreateRiskHandler.test.ts`
- [ ] `tests/unit/domains/risks/handlers/UpdateRiskHandler.test.ts`
- [ ] `tests/unit/domains/risks/handlers/ListRisksHandler.test.ts`

**Integration Tests** (Infrastructure Layer):
- [ ] `tests/integration/domains/risks/repositories/D1RiskRepository.test.ts`
- [ ] `tests/integration/domains/risks/repositories/D1KRIRepository.test.ts`

**E2E Tests** (API Layer):
- [ ] `tests/e2e/domains/risks/risk-routes.test.ts`

**Test Example**:
```typescript
// Risk.test.ts
import { describe, it, expect } from 'vitest';
import { Risk } from '@/domains/risks/core/entities/Risk';

describe('Risk Entity', () => {
  it('should create a valid risk', () => {
    const risk = Risk.create({
      title: 'Data Breach Risk',
      description: 'Risk of unauthorized data access',
      category: 'technological',
      probability: 4,
      impact: 5,
      ownerId: 1,
      organizationId: 1
    });

    expect(risk).toBeDefined();
    expect(risk.title).toBe('Data Breach Risk');
    expect(risk.calculateScore().value).toBe(20);
    expect(risk.calculateScore().severity).toBe('critical');
  });

  it('should throw error for invalid probability', () => {
    expect(() => {
      Risk.create({
        title: 'Test Risk',
        description: 'Test',
        category: 'operational',
        probability: 6,  // Invalid
        impact: 3,
        ownerId: 1,
        organizationId: 1
      });
    }).toThrow('Probability must be between 1 and 5');
  });

  it('should update status and emit domain event', () => {
    const risk = Risk.create({
      title: 'Test Risk',
      description: 'Test',
      category: 'operational',
      probability: 3,
      impact: 3,
      ownerId: 1,
      organizationId: 1
    });

    risk.updateStatus('mitigated');

    expect(risk.status).toBe('mitigated');
    expect(risk.getDomainEvents()).toHaveLength(1);
    expect(risk.getDomainEvents()[0].eventType).toBe('RiskStatusChanged');
  });
});
```

**Test Commands**:
```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

**Deliverable**: 10+ test files, >90% coverage

---

#### Day 13: Documentation
**Task**: Update documentation and create completion report

**Documentation to Create/Update**:
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture diagrams
- [ ] Migration guide
- [ ] Week 2-3 completion report

**Files to Create**:
- [ ] `docs/api/risks-api-v2.md` - API documentation
- [ ] `docs/architecture/risk-domain.md` - Architecture overview
- [ ] `docs/migration/risk-migration-guide.md` - Migration instructions
- [ ] `PHASE_0_WEEK_2-3_COMPLETE.md` - Completion report

**Deliverable**: Complete documentation suite

---

#### Day 14: Deployment
**Task**: Deploy to production and verify

**Deployment Steps**:
```bash
# 1. Run final tests
npm run test:all

# 2. Build for production
npm run build

# 3. Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name aria51a

# 4. Run smoke tests on production
curl https://aria51a.pages.dev/health
curl https://aria51a.pages.dev/api/risks (with auth token)

# 5. Create project backup
# Use ProjectBackup tool

# 6. Commit and tag release
git add .
git commit -m "feat: Phase 0 Week 2-3 Complete - Risk Domain Extraction"
git tag v5.2.0-risk-domain
git push origin main --tags
```

**Verification Checklist**:
- [ ] All tests passing (>90% coverage)
- [ ] No TypeScript errors
- [ ] Build successful
- [ ] Deployment successful
- [ ] Health check returns 200 OK
- [ ] All risk API endpoints working
- [ ] UI displays risks correctly
- [ ] No performance degradation
- [ ] Backup created

**Deliverable**: Production deployment complete

---

## 📊 Success Metrics

### Code Quality
- ✅ File size: All modules <500 lines (target: <400)
- ✅ Cyclomatic complexity: <10 per function
- ✅ Code duplication: <5%
- ✅ Test coverage: >90%

### Performance
- ✅ API response time: <200ms (maintained or improved)
- ✅ Database query time: <50ms per query
- ✅ Build time: <30 seconds

### Architecture
- ✅ Zero cross-domain imports in core
- ✅ All dependencies point inward (DDD)
- ✅ 100% repository pattern usage
- ✅ Complete CQRS implementation

---

## 🚨 Risks & Mitigations

### Risk 1: Breaking Existing Features
**Mitigation**: 
- Keep old routes active during migration
- Run comprehensive E2E tests
- Deploy with gradual rollout (canary deployment)

### Risk 2: Performance Degradation
**Mitigation**:
- Load test before deployment
- Monitor response times
- Optimize queries if needed

### Risk 3: Team Learning Curve
**Mitigation**:
- Provide DDD training sessions
- Code review all PRs
- Pair programming for complex parts

---

## 📝 Checklist

### Before Starting
- [ ] Week 1 infrastructure complete
- [ ] All base classes available in `src/shared/`
- [ ] Development environment set up
- [ ] Test framework configured

### During Week 2-3
- [ ] Daily standups to track progress
- [ ] Code reviews for all PRs
- [ ] Continuous integration running
- [ ] Documentation updated daily

### After Completion
- [ ] All 10 modules created and tested
- [ ] Deployment successful
- [ ] Documentation complete
- [ ] Project backup created
- [ ] Team demo completed
- [ ] Week 2-3 completion report written

---

## 🎓 Learning Resources

### DDD Patterns
- Entity Pattern: Identity-based objects
- Value Object Pattern: Immutable objects compared by value
- Aggregate Root Pattern: Consistency boundaries
- Repository Pattern: Data access abstraction

### CQRS Pattern
- Command: Write operations that change state
- Query: Read operations that don't change state
- Handler: Execute commands/queries with business logic

### Event-Driven Architecture
- Domain Events: Capture state changes
- Event Bus: Publish/subscribe mechanism
- Event Handlers: React to domain events

---

## 📞 Support & Questions

If you have questions during implementation:

1. **Architecture Questions**: Refer to `MODULAR_ARCHITECTURE_REFACTORING_PLAN.md`
2. **DDD Patterns**: Refer to `QUICK_START_ENHANCEMENT_GUIDE.md`
3. **Shared Kernel Usage**: Check files in `src/shared/`
4. **Code Examples**: Review Week 1 implementation

---

## 🎉 Conclusion

Week 2-3 will transform the Risk domain from a 4,185-line monolith into a clean, modular, maintainable architecture using DDD principles. This will serve as the template for extracting the remaining domains in Weeks 4-8.

**Ready to start?** Follow the day-by-day plan above, starting with Day 1: Domain Entities!

---

**Prepared By**: ARIA AI Assistant  
**Date**: October 25, 2025  
**Status**: Ready for Implementation ✅
