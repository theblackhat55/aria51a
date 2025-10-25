# ARIA 5.1 MODULAR ARCHITECTURE REFACTORING PLAN
## Domain-Driven Design Transformation

---

## 🎯 OBJECTIVES

Transform ARIA 5.1 from **monolithic route files** to **modular Domain-Driven Design architecture** to:
1. ✅ **Eliminate code duplication** - Break 20,347 lines of problematic routes into <500 line modules
2. ✅ **Enable parallel development** - Teams can work on different domains independently
3. ✅ **Improve testability** - Domain logic isolated from infrastructure
4. ✅ **Facilitate Phase 1-4 implementation** - Clean foundation for 23 new features
5. ✅ **Maintain backward compatibility** - Zero breaking changes to existing APIs

---

## 📊 CURRENT STATE ANALYSIS

### Problematic Files (20,347 lines = 57% of route code)

| File | Lines | Issues | Refactor Target |
|------|-------|--------|-----------------|
| `admin-routes-aria5.ts` | 5,406 | Admin functions + API management + Settings | 15 modules @ <400 lines |
| `operations-fixed.ts` | 4,288 | Assets + Services + Defender + Operations | 12 modules @ <400 lines |
| `risk-routes-aria5.ts` | 4,185 | Risk CRUD + Treatments + KRIs + Analysis | 10 modules @ <450 lines |
| `intelligence-routes.ts` | 3,704 | Threat Intel + IOCs + Feeds + Analysis | 8 modules @ <500 lines |
| `enhanced-compliance-routes.ts` | 2,764 | Frameworks + Assessments + Controls | 7 modules @ <400 lines |

### Architecture Violations

1. **Mixed Concerns**
   - Route handlers contain business logic
   - Database queries embedded in routes
   - No separation of commands and queries
   - Cross-domain dependencies

2. **Code Duplication**
   - User authentication logic repeated 50+ times
   - Database connection patterns duplicated
   - Similar CRUD operations copied across routes
   - Error handling inconsistent

3. **Testing Challenges**
   - Routes tightly coupled to Hono framework
   - Database dependencies hardcoded
   - Difficult to mock external services
   - No unit test coverage

4. **Scalability Issues**
   - Cannot add new features without modifying existing files
   - Git merge conflicts frequent
   - Slow build times due to large files
   - Difficult onboarding for new developers

---

## 🏗️ TARGET ARCHITECTURE

### Domain-Driven Design Structure

```
src/
├── domains/                              # NEW: Business domains
│   │
│   ├── risks/                            # Risk Management Domain
│   │   ├── core/
│   │   │   ├── entities/
│   │   │   │   ├── Risk.ts               # Risk entity
│   │   │   │   ├── RiskTreatment.ts      # Treatment entity
│   │   │   │   └── KRI.ts                # KRI entity
│   │   │   ├── value-objects/
│   │   │   │   ├── RiskScore.ts          # Risk score calculation
│   │   │   │   ├── RiskStatus.ts         # Status enum
│   │   │   │   └── RiskCategory.ts       # Category types
│   │   │   ├── repositories/
│   │   │   │   ├── IRiskRepository.ts    # Interface
│   │   │   │   └── IKRIRepository.ts     # Interface
│   │   │   └── services/
│   │   │       ├── RiskScoringService.ts # Scoring logic
│   │   │       └── RiskAnalysisService.ts# AI analysis
│   │   │
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── CreateRiskCommand.ts
│   │   │   │   ├── UpdateRiskCommand.ts
│   │   │   │   ├── DeleteRiskCommand.ts
│   │   │   │   └── handlers/
│   │   │   │       ├── CreateRiskHandler.ts
│   │   │   │       ├── UpdateRiskHandler.ts
│   │   │   │       └── DeleteRiskHandler.ts
│   │   │   ├── queries/
│   │   │   │   ├── GetRiskByIdQuery.ts
│   │   │   │   ├── ListRisksQuery.ts
│   │   │   │   ├── SearchRisksQuery.ts
│   │   │   │   └── handlers/
│   │   │   │       ├── GetRiskByIdHandler.ts
│   │   │   │       ├── ListRisksHandler.ts
│   │   │   │       └── SearchRisksHandler.ts
│   │   │   └── events/
│   │   │       ├── RiskCreatedEvent.ts
│   │   │       ├── RiskUpdatedEvent.ts
│   │   │       └── RiskDeletedEvent.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   │   ├── D1RiskRepository.ts   # D1 implementation
│   │   │   │   └── D1KRIRepository.ts    # D1 implementation
│   │   │   └── mappers/
│   │   │       ├── RiskMapper.ts         # DB row → Entity
│   │   │       └── KRIMapper.ts          # DB row → Entity
│   │   │
│   │   └── presentation/
│   │       ├── routes/
│   │       │   ├── risk-routes.ts        # GET/POST/PUT/DELETE /api/risks
│   │       │   ├── kri-routes.ts         # GET/POST /api/kris
│   │       │   └── treatment-routes.ts   # GET/POST /api/treatments
│   │       ├── validators/
│   │       │   ├── create-risk.validator.ts  # Zod schemas
│   │       │   └── update-risk.validator.ts  # Zod schemas
│   │       └── dto/
│   │           ├── CreateRiskDTO.ts
│   │           ├── UpdateRiskDTO.ts
│   │           └── RiskResponseDTO.ts
│   │
│   ├── compliance/                       # Compliance Domain
│   │   ├── core/
│   │   │   ├── entities/
│   │   │   │   ├── Framework.ts
│   │   │   │   ├── Control.ts
│   │   │   │   └── Assessment.ts
│   │   │   ├── repositories/
│   │   │   │   ├── IFrameworkRepository.ts
│   │   │   │   └── IAssessmentRepository.ts
│   │   │   └── services/
│   │   │       ├── ComplianceScoreService.ts
│   │   │       └── GapAnalysisService.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── CreateAssessmentCommand.ts
│   │   │   │   └── handlers/
│   │   │   ├── queries/
│   │   │   │   ├── GetFrameworkQuery.ts
│   │   │   │   └── handlers/
│   │   │   └── events/
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── D1FrameworkRepository.ts
│   │   │       └── D1AssessmentRepository.ts
│   │   └── presentation/
│   │       ├── routes/
│   │       │   ├── framework-routes.ts
│   │       │   ├── assessment-routes.ts
│   │       │   └── control-routes.ts
│   │       └── validators/
│   │
│   ├── assets/                           # Asset Management Domain
│   │   ├── core/
│   │   │   ├── entities/
│   │   │   │   ├── Asset.ts
│   │   │   │   ├── Service.ts
│   │   │   │   └── Vulnerability.ts
│   │   │   └── repositories/
│   │   │       ├── IAssetRepository.ts
│   │   │       └── IServiceRepository.ts
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── incidents/                        # Incident Management Domain
│   │   ├── core/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── threat-intelligence/              # Threat Intel Domain
│   │   ├── core/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   └── admin/                            # Admin Domain
│       ├── core/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
│
├── shared/                               # Shared Kernel
│   ├── domain/
│   │   ├── Entity.ts                     # Base entity class
│   │   ├── ValueObject.ts                # Base value object
│   │   ├── AggregateRoot.ts              # DDD aggregate
│   │   └── DomainEvent.ts                # Event base
│   │
│   ├── application/
│   │   ├── Command.ts                    # Command base
│   │   ├── CommandHandler.ts             # Handler interface
│   │   ├── Query.ts                      # Query base
│   │   ├── QueryHandler.ts               # Handler interface
│   │   └── EventBus.ts                   # Event dispatcher
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── D1Connection.ts           # Connection manager
│   │   │   ├── Transaction.ts            # Transaction wrapper
│   │   │   └── QueryBuilder.ts           # Type-safe query builder
│   │   ├── messaging/
│   │   │   └── QueueClient.ts            # Cloudflare Queue
│   │   ├── caching/
│   │   │   └── KVCache.ts                # Cloudflare KV
│   │   └── storage/
│   │       └── R2Storage.ts              # Cloudflare R2
│   │
│   └── presentation/
│       ├── middleware/
│       │   ├── auth.middleware.ts        # Authentication
│       │   ├── validate.middleware.ts    # Validation
│       │   └── error.middleware.ts       # Error handling
│       └── responses/
│           ├── ApiResponse.ts            # Standard response
│           └── ErrorResponse.ts          # Standard error
│
├── core/                                 # Keep existing
│   ├── auth.ts                           # → Move to shared/
│   ├── config.ts                         # Keep
│   └── types.ts                          # → Split by domain
│
├── mcp-server/                           # Keep existing (separate bounded context)
├── middleware/                           # → Move to shared/presentation/
├── templates/                            # Keep existing
└── index.ts                              # Main entry (refactor)
```

---

## 🔄 REFACTORING STRATEGY

### Phase 0: Preparation (Week 1)

**Goal:** Set up infrastructure without breaking existing code

```bash
# 1. Create new directory structure
mkdir -p src/domains/{risks,compliance,assets,incidents,threat-intelligence,admin}/{core/{entities,value-objects,repositories,services},application/{commands,queries,events},infrastructure/{persistence,mappers},presentation/{routes,validators,dto}}

mkdir -p src/shared/{domain,application,infrastructure/{database,messaging,caching,storage},presentation/{middleware,responses}}

# 2. Create base classes and interfaces
touch src/shared/domain/{Entity,ValueObject,AggregateRoot,DomainEvent}.ts
touch src/shared/application/{Command,CommandHandler,Query,QueryHandler,EventBus}.ts
touch src/shared/infrastructure/database/{D1Connection,Transaction,QueryBuilder}.ts

# 3. Set up testing framework for new modules
mkdir -p tests/{unit,integration}/{domains,shared}
```

**Deliverables:**
- ✅ New directory structure created
- ✅ Base classes implemented
- ✅ Testing framework configured
- ✅ Documentation updated

---

### Phase 1: Extract Risk Domain (Week 2-3)

**Target:** `risk-routes-aria5.ts` (4,185 lines) → 10 modules

#### Step 1.1: Create Core Entities (Day 1-2)

```typescript
// src/domains/risks/core/entities/Risk.ts

import { Entity } from '@/shared/domain/Entity';
import { RiskScore } from '../value-objects/RiskScore';
import { RiskStatus } from '../value-objects/RiskStatus';

export class Risk extends Entity {
  private constructor(
    id: number,
    public title: string,
    public description: string,
    public category: string,
    public probability: number,
    public impact: number,
    public status: RiskStatus,
    public ownerId: number,
    public organizationId: number,
    public createdAt: Date,
    public updatedAt: Date
  ) {
    super(id);
  }

  static create(props: CreateRiskProps): Risk {
    // Validation
    if (props.probability < 1 || props.probability > 5) {
      throw new Error('Probability must be between 1 and 5');
    }
    if (props.impact < 1 || props.impact > 5) {
      throw new Error('Impact must be between 1 and 5');
    }

    return new Risk(
      0,  // ID assigned by database
      props.title,
      props.description,
      props.category,
      props.probability,
      props.impact,
      RiskStatus.Active,
      props.ownerId,
      props.organizationId,
      new Date(),
      new Date()
    );
  }

  calculateScore(): RiskScore {
    return RiskScore.calculate(this.probability, this.impact);
  }

  updateStatus(newStatus: RiskStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
    
    // Emit domain event
    this.addDomainEvent(new RiskStatusChangedEvent(this.id, newStatus));
  }

  mitigate(treatment: RiskTreatment): void {
    // Business logic for risk mitigation
    this.addDomainEvent(new RiskMitigatedEvent(this.id, treatment.id));
  }
}
```

```typescript
// src/domains/risks/core/value-objects/RiskScore.ts

import { ValueObject } from '@/shared/domain/ValueObject';

export class RiskScore extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static calculate(probability: number, impact: number): RiskScore {
    const score = probability * impact;
    return new RiskScore(score);
  }

  get severity(): 'critical' | 'high' | 'medium' | 'low' {
    if (this.value >= 20) return 'critical';
    if (this.value >= 12) return 'high';
    if (this.value >= 6) return 'medium';
    return 'low';
  }

  get color(): string {
    const colors = {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#F59E0B',
      low: '#10B981'
    };
    return colors[this.severity];
  }
}
```

#### Step 1.2: Create Repository Interfaces (Day 3)

```typescript
// src/domains/risks/core/repositories/IRiskRepository.ts

import { Risk } from '../entities/Risk';
import { RiskStatus } from '../value-objects/RiskStatus';

export interface IRiskRepository {
  // Queries
  findById(id: number): Promise<Risk | null>;
  findByOrganization(orgId: number): Promise<Risk[]>;
  findByStatus(orgId: number, status: RiskStatus): Promise<Risk[]>;
  findByCategory(orgId: number, category: string): Promise<Risk[]>;
  search(orgId: number, query: string): Promise<Risk[]>;
  
  // Commands
  save(risk: Risk): Promise<Risk>;
  update(risk: Risk): Promise<Risk>;
  delete(id: number): Promise<void>;
  
  // Bulk operations
  saveBatch(risks: Risk[]): Promise<Risk[]>;
  deleteByOrganization(orgId: number): Promise<void>;
}
```

#### Step 1.3: Implement D1 Repository (Day 4)

```typescript
// src/domains/risks/infrastructure/persistence/D1RiskRepository.ts

import { IRiskRepository } from '../../core/repositories/IRiskRepository';
import { Risk } from '../../core/entities/Risk';
import { RiskMapper } from '../mappers/RiskMapper';

export class D1RiskRepository implements IRiskRepository {
  constructor(private db: D1Database) {}

  async findById(id: number): Promise<Risk | null> {
    const result = await this.db
      .prepare('SELECT * FROM risks WHERE id = ?')
      .bind(id)
      .first();
    
    return result ? RiskMapper.toDomain(result) : null;
  }

  async findByOrganization(orgId: number): Promise<Risk[]> {
    const results = await this.db
      .prepare('SELECT * FROM risks WHERE organization_id = ? ORDER BY created_at DESC')
      .bind(orgId)
      .all();
    
    return results.results.map(RiskMapper.toDomain);
  }

  async save(risk: Risk): Promise<Risk> {
    const data = RiskMapper.toPersistence(risk);
    
    const result = await this.db
      .prepare(`
        INSERT INTO risks (title, description, category, probability, impact, status, owner_id, organization_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        data.title, data.description, data.category,
        data.probability, data.impact, data.status,
        data.owner_id, data.organization_id
      )
      .first();
    
    return RiskMapper.toDomain(result);
  }

  async update(risk: Risk): Promise<Risk> {
    const data = RiskMapper.toPersistence(risk);
    
    const result = await this.db
      .prepare(`
        UPDATE risks
        SET title = ?, description = ?, category = ?,
            probability = ?, impact = ?, status = ?,
            owner_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING *
      `)
      .bind(
        data.title, data.description, data.category,
        data.probability, data.impact, data.status,
        data.owner_id, risk.id
      )
      .first();
    
    return RiskMapper.toDomain(result);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM risks WHERE id = ?')
      .bind(id)
      .run();
  }
}
```

#### Step 1.4: Create CQRS Handlers (Day 5-7)

```typescript
// src/domains/risks/application/commands/CreateRiskCommand.ts

import { Command } from '@/shared/application/Command';

export class CreateRiskCommand extends Command {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly probability: number,
    public readonly impact: number,
    public readonly ownerId: number,
    public readonly organizationId: number,
    public readonly userId: number  // For audit
  ) {
    super();
  }
}
```

```typescript
// src/domains/risks/application/commands/handlers/CreateRiskHandler.ts

import { CommandHandler } from '@/shared/application/CommandHandler';
import { CreateRiskCommand } from '../CreateRiskCommand';
import { IRiskRepository } from '../../../core/repositories/IRiskRepository';
import { Risk } from '../../../core/entities/Risk';
import { EventBus } from '@/shared/application/EventBus';

export class CreateRiskHandler implements CommandHandler<CreateRiskCommand> {
  constructor(
    private repository: IRiskRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CreateRiskCommand): Promise<Risk> {
    // 1. Create domain entity
    const risk = Risk.create({
      title: command.title,
      description: command.description,
      category: command.category,
      probability: command.probability,
      impact: command.impact,
      ownerId: command.ownerId,
      organizationId: command.organizationId
    });

    // 2. Persist to database
    const savedRisk = await this.repository.save(risk);

    // 3. Publish domain events
    await this.eventBus.publish(risk.getDomainEvents());

    return savedRisk;
  }
}
```

```typescript
// src/domains/risks/application/queries/ListRisksQuery.ts

import { Query } from '@/shared/application/Query';

export class ListRisksQuery extends Query {
  constructor(
    public readonly organizationId: number,
    public readonly filters?: {
      status?: string;
      category?: string;
      ownerId?: number;
    },
    public readonly page: number = 1,
    public readonly limit: number = 50
  ) {
    super();
  }
}
```

```typescript
// src/domains/risks/application/queries/handlers/ListRisksHandler.ts

import { QueryHandler } from '@/shared/application/QueryHandler';
import { ListRisksQuery } from '../ListRisksQuery';
import { IRiskRepository } from '../../../core/repositories/IRiskRepository';
import { Risk } from '../../../core/entities/Risk';

export class ListRisksHandler implements QueryHandler<ListRisksQuery, Risk[]> {
  constructor(private repository: IRiskRepository) {}

  async execute(query: ListRisksQuery): Promise<Risk[]> {
    let risks: Risk[];

    if (query.filters?.status) {
      risks = await this.repository.findByStatus(
        query.organizationId,
        query.filters.status as any
      );
    } else if (query.filters?.category) {
      risks = await this.repository.findByCategory(
        query.organizationId,
        query.filters.category
      );
    } else {
      risks = await this.repository.findByOrganization(query.organizationId);
    }

    // Apply pagination
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    return risks.slice(start, end);
  }
}
```

#### Step 1.5: Create Routes (Day 8-9)

```typescript
// src/domains/risks/presentation/routes/risk-routes.ts

import { Hono } from 'hono';
import { CreateRiskHandler } from '../../application/commands/handlers/CreateRiskHandler';
import { ListRisksHandler } from '../../application/queries/handlers/ListRisksHandler';
import { createRiskValidator } from '../validators/create-risk.validator';
import { authMiddleware } from '@/shared/presentation/middleware/auth.middleware';
import { validateMiddleware } from '@/shared/presentation/middleware/validate.middleware';

export const riskRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Dependency injection (will be configured in index.ts)
let createHandler: CreateRiskHandler;
let listHandler: ListRisksHandler;

export function configureRiskRoutes(
  createHandlerInstance: CreateRiskHandler,
  listHandlerInstance: ListRisksHandler
) {
  createHandler = createHandlerInstance;
  listHandler = listHandlerInstance;
}

// GET /api/risks - List all risks
riskRoutes.get(
  '/',
  authMiddleware,
  async (c) => {
    const user = c.get('user');
    const { status, category, page = 1, limit = 50 } = c.req.query();

    const query = new ListRisksQuery(
      user.organization_id,
      { status, category },
      parseInt(page),
      parseInt(limit)
    );

    const risks = await listHandler.execute(query);

    return c.json({
      success: true,
      data: risks.map(risk => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        score: risk.calculateScore().value,
        severity: risk.calculateScore().severity,
        status: risk.status.value,
        ownerId: risk.ownerId,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: risks.length
      }
    });
  }
);

// POST /api/risks - Create new risk
riskRoutes.post(
  '/',
  authMiddleware,
  validateMiddleware(createRiskValidator),
  async (c) => {
    const user = c.get('user');
    const body = await c.req.json();

    const command = new CreateRiskCommand(
      body.title,
      body.description,
      body.category,
      body.probability,
      body.impact,
      body.ownerId || user.id,
      user.organization_id,
      user.id
    );

    const risk = await createHandler.execute(command);

    return c.json({
      success: true,
      message: 'Risk created successfully',
      data: {
        id: risk.id,
        title: risk.title,
        score: risk.calculateScore().value,
        severity: risk.calculateScore().severity
      }
    }, 201);
  }
);

// GET /api/risks/:id - Get risk by ID
riskRoutes.get('/:id', authMiddleware, async (c) => {
  // Implementation using GetRiskByIdHandler
});

// PUT /api/risks/:id - Update risk
riskRoutes.put('/:id', authMiddleware, validateMiddleware(updateRiskValidator), async (c) => {
  // Implementation using UpdateRiskHandler
});

// DELETE /api/risks/:id - Delete risk
riskRoutes.delete('/:id', authMiddleware, async (c) => {
  // Implementation using DeleteRiskHandler
});
```

#### Step 1.6: Update Main Index (Day 10)

```typescript
// src/index.ts (updated)

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Shared infrastructure
import { D1Connection } from './shared/infrastructure/database/D1Connection';
import { EventBus } from './shared/application/EventBus';

// Risk domain
import { D1RiskRepository } from './domains/risks/infrastructure/persistence/D1RiskRepository';
import { CreateRiskHandler } from './domains/risks/application/commands/handlers/CreateRiskHandler';
import { ListRisksHandler } from './domains/risks/application/queries/handlers/ListRisksHandler';
import { riskRoutes, configureRiskRoutes } from './domains/risks/presentation/routes/risk-routes';

// Old routes (temporarily kept for backward compatibility)
import { oldRiskRoutes } from './routes/risk-routes-aria5';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('/*', cors());

app.use('*', async (c, next) => {
  // Initialize infrastructure per request
  const db = c.env.DB;
  const eventBus = new EventBus();

  // Risk domain setup
  const riskRepository = new D1RiskRepository(db);
  const createRiskHandler = new CreateRiskHandler(riskRepository, eventBus);
  const listRisksHandler = new ListRisksHandler(riskRepository);
  
  configureRiskRoutes(createRiskHandler, listRisksHandler);

  // Store in context for access in routes
  c.set('riskRepository', riskRepository);
  c.set('eventBus', eventBus);

  await next();
});

// NEW: Modular domain routes
app.route('/api/v2/risks', riskRoutes);

// OLD: Legacy routes (will be deprecated)
app.route('/api/risks', oldRiskRoutes);

export default app;
```

#### Step 1.7: Testing (Day 11-12)

```typescript
// tests/unit/domains/risks/core/entities/Risk.test.ts

import { describe, it, expect } from 'vitest';
import { Risk } from '@/domains/risks/core/entities/Risk';
import { RiskStatus } from '@/domains/risks/core/value-objects/RiskStatus';

describe('Risk Entity', () => {
  it('should create a valid risk', () => {
    const risk = Risk.create({
      title: 'Data Breach Risk',
      description: 'Potential data breach',
      category: 'Cybersecurity',
      probability: 4,
      impact: 5,
      ownerId: 1,
      organizationId: 1
    });

    expect(risk.title).toBe('Data Breach Risk');
    expect(risk.calculateScore().value).toBe(20);
    expect(risk.calculateScore().severity).toBe('critical');
  });

  it('should throw error for invalid probability', () => {
    expect(() => {
      Risk.create({
        title: 'Invalid Risk',
        description: 'Test',
        category: 'Test',
        probability: 6,  // Invalid
        impact: 5,
        ownerId: 1,
        organizationId: 1
      });
    }).toThrow('Probability must be between 1 and 5');
  });

  it('should update status and emit event', () => {
    const risk = Risk.create({
      title: 'Test Risk',
      description: 'Test',
      category: 'Test',
      probability: 3,
      impact: 3,
      ownerId: 1,
      organizationId: 1
    });

    risk.updateStatus(RiskStatus.Mitigated);

    expect(risk.status).toBe(RiskStatus.Mitigated);
    expect(risk.getDomainEvents()).toHaveLength(1);
    expect(risk.getDomainEvents()[0].eventType).toBe('RiskStatusChanged');
  });
});
```

---

### Phase 2: Extract Compliance Domain (Week 4)

**Target:** `enhanced-compliance-routes.ts` (2,764 lines) → 7 modules

Similar approach:
1. Create entities: Framework, Control, Assessment
2. Create repositories: IFrameworkRepository, IAssessmentRepository
3. Implement D1 repositories
4. Create CQRS handlers
5. Create routes
6. Write tests

---

### Phase 3: Extract Assets Domain (Week 5)

**Target:** `operations-fixed.ts` (4,288 lines) → 12 modules

---

### Phase 4: Extract Admin Domain (Week 6)

**Target:** `admin-routes-aria5.ts` (5,406 lines) → 15 modules

---

### Phase 5: Extract Threat Intelligence Domain (Week 7)

**Target:** `intelligence-routes.ts` (3,704 lines) → 8 modules

---

### Phase 6: Deprecate Old Routes (Week 8)

**Goal:** Remove old route files, full cutover to new architecture

```typescript
// Add deprecation warnings to old routes
app.use('/api/risks', (c, next) => {
  console.warn('DEPRECATED: /api/risks is deprecated, use /api/v2/risks');
  return next();
});

// After 1 month grace period, remove old routes entirely
```

---

## 📈 SUCCESS METRICS

### Code Quality Metrics
- ✅ **File Size:** All route files <500 lines (target: <400 lines)
- ✅ **Cyclomatic Complexity:** <10 per function (down from 50+)
- ✅ **Code Duplication:** <5% (down from 30%+)
- ✅ **Test Coverage:** >90% for new modules

### Development Metrics
- ✅ **Build Time:** <30 seconds (down from 2+ minutes)
- ✅ **PR Merge Conflicts:** <10% (down from 40%)
- ✅ **Onboarding Time:** New devs productive in 3 days (vs 2 weeks)

### Architecture Metrics
- ✅ **Domain Isolation:** Zero cross-domain imports in core
- ✅ **Dependency Direction:** All dependencies point inward (DDD)
- ✅ **Interface Adherence:** 100% repository pattern usage

---

## 🚀 NEXT STEPS

1. **Week 1:** Set up infrastructure and base classes
2. **Week 2-3:** Extract Risk domain (pilot project)
3. **Week 4-7:** Extract remaining domains in parallel
4. **Week 8:** Deprecate old routes and complete cutover

**Total Timeline:** 8 weeks to complete refactoring

**Ready for Phase 1-4 Implementation:** After refactoring, clean foundation for 23 new features
