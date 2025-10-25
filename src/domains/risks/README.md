# Risk Domain Module

## Overview

This module implements the **Risk Management** domain using **Domain-Driven Design (DDD)** principles and **CQRS pattern**.

## Architecture Layers

```
src/domains/risks/
├── core/                   # Domain Layer (Business Logic)
│   ├── entities/          # Domain entities (Risk, RiskTreatment)
│   ├── value-objects/     # Immutable value objects (RiskScore, RiskStatus)
│   ├── repositories/      # Repository interfaces (contracts)
│   └── services/          # Domain services (RiskScoringService, RiskDomainService)
├── application/            # Application Layer (Use Cases)
│   ├── commands/          # Write operations (Create, Update, Delete)
│   ├── queries/           # Read operations (Get, List, Search)
│   ├── handlers/          # Command/Query handlers (CQRS)
│   └── dto/               # Data Transfer Objects
└── infrastructure/         # Infrastructure Layer (Technical Details)
    ├── persistence/       # Database implementations (D1RiskRepository)
    └── mappers/           # Domain ↔ Database mapping
```

## Key Patterns

### 1. Domain-Driven Design (DDD)

**Entities** (with identity):
- `Risk` - Aggregate root for risk management
- `RiskTreatment` - Entity for mitigation actions

**Value Objects** (immutable, compared by value):
- `RiskScore` - Calculated risk score (probability × impact)
- `RiskStatus` - Risk lifecycle status with transition rules

**Repositories** (persistence abstraction):
- `IRiskRepository` - Interface for risk data access
- `ITreatmentRepository` - Interface for treatment data access

**Domain Services** (complex business logic):
- `RiskScoringService` - Advanced risk score calculations
- `RiskDomainService` - Multi-entity operations

### 2. CQRS (Command Query Responsibility Segregation)

**Commands** (write operations):
```typescript
import { CreateRiskCommand } from '@/domains/risks';

const command = new CreateRiskCommand({
  title: 'Data Breach Risk',
  description: 'Potential customer data exposure',
  category: 'cybersecurity',
  probability: 4,
  impact: 5,
  ownerId: 1,
  organizationId: 1,
  createdBy: 1
});

const handler = new CreateRiskHandler(riskRepository);
const result = await handler.handle(command);
```

**Queries** (read operations):
```typescript
import { ListRisksQuery } from '@/domains/risks';

const query = new ListRisksQuery({
  organizationId: 1,
  status: RiskStatus.Active,
  limit: 10,
  offset: 0
});

const handler = new ListRisksHandler(riskRepository);
const result = await handler.handle(query);
```

### 3. Repository Pattern

Abstraction over data access:
```typescript
// Interface (core layer)
interface IRiskRepository {
  findById(id: number): Promise<Risk | null>;
  save(risk: Risk): Promise<Risk>;
  // ... other methods
}

// Implementation (infrastructure layer)
class D1RiskRepository implements IRiskRepository {
  constructor(private db: D1Database) {}
  // ... implementation
}
```

## Usage Examples

### Creating a New Risk

```typescript
import { 
  CreateRiskCommand, 
  CreateRiskHandler,
  D1RiskRepository 
} from '@/domains/risks';

// Setup (typically done in dependency injection container)
const riskRepository = new D1RiskRepository(env.DB);
const handler = new CreateRiskHandler(riskRepository);

// Execute command
const command = new CreateRiskCommand({
  title: 'Ransomware Attack',
  description: 'Potential ransomware targeting file servers',
  category: 'cybersecurity',
  subcategory: 'malware',
  probability: 3,
  impact: 5,
  ownerId: 2,
  organizationId: 1,
  source: 'Threat intelligence report',
  affectedAssets: 'File servers, user workstations',
  createdBy: 1
});

const riskDTO = await handler.handle(command);
console.log(`Created risk ${riskDTO.id} with score ${riskDTO.riskScore.score}`);
```

### Listing Risks with Filters

```typescript
import { 
  ListRisksQuery,
  ListRisksHandler,
  RiskStatus
} from '@/domains/risks';

const handler = new ListRisksHandler(riskRepository);

const query = new ListRisksQuery({
  organizationId: 1,
  status: RiskStatus.Active,
  category: 'cybersecurity',
  sortBy: 'risk_score',
  sortOrder: 'desc',
  limit: 20,
  offset: 0
});

const result = await handler.handle(query);
console.log(`Found ${result.total} risks, showing ${result.risks.length}`);
```

### Using Domain Services

```typescript
import { 
  RiskScoringService,
  RiskDomainService,
  D1RiskRepository,
  D1TreatmentRepository
} from '@/domains/risks';

// Setup
const riskRepo = new D1RiskRepository(env.DB);
const treatmentRepo = new D1TreatmentRepository(env.DB);
const domainService = new RiskDomainService(riskRepo, treatmentRepo);
const scoringService = new RiskScoringService();

// Create risk with assessment
const risk = await domainService.createRiskWithAssessment({
  title: 'Cloud Misconfiguration',
  description: 'S3 buckets exposed publicly',
  category: 'operational',
  probability: 4,
  impact: 4,
  ownerId: 3,
  organizationId: 1
});

// Advanced scoring
const assessment = scoringService.assessRisk(risk, {
  hasActiveControls: true,
  controlEffectiveness: 60,
  threatLevel: 4,
  complianceStatus: 'partial'
});

console.log(`Inherent risk: ${assessment.inherentRisk.severity}`);
console.log(`Residual risk: ${assessment.residualRisk.severity}`);
console.log(`Control reduction: ${assessment.controlReduction}%`);
console.log(`Recommendation: ${assessment.recommendation}`);
```

### Mitigating a Risk

```typescript
import { TreatmentType } from '@/domains/risks';

const { risk, treatment } = await domainService.mitigateRisk(
  riskId,
  organizationId,
  {
    title: 'Implement S3 Bucket Policy Review',
    description: 'Audit all S3 buckets and apply least privilege policies',
    treatmentType: TreatmentType.Mitigate,
    ownerId: 3,
    estimatedCost: 5000,
    targetDate: new Date('2025-12-31'),
    priority: 5
  }
);

console.log(`Risk ${risk.id} status: ${risk.status.displayName}`);
console.log(`Treatment ${treatment.id} created: ${treatment.title}`);
```

## Domain Events

Entities emit domain events for important state changes:

```typescript
const risk = Risk.create({ /* props */ });

// Events are automatically added
const events = risk.getDomainEvents();
// [RiskCreatedEvent { riskId: 0, title: '...', severity: 'high' }]

// Publish events (typically done by event bus)
await eventBus.publish(events);

// Clear after publishing
risk.clearDomainEvents();
```

## Validation

Business rules are enforced in entities:

```typescript
// Title validation
Risk.create({ 
  title: 'AB',  // Too short! 
  // Error: Risk title must be at least 3 characters long
  ...
});

// Status transition validation
risk.updateStatus(RiskStatus.Closed);
// Error: Cannot transition from Active to Closed

// Treatment lifecycle
treatment.complete();
// Error: Only in-progress treatments can be completed
```

## Testing

Each layer can be tested independently:

```typescript
// Unit test - Entity
describe('Risk Entity', () => {
  it('should calculate risk score correctly', () => {
    const risk = Risk.create({
      probability: 4,
      impact: 5,
      // ... other props
    });
    
    expect(risk.calculateScore().score).toBe(20);
    expect(risk.calculateScore().severity).toBe('critical');
  });
});

// Integration test - Handler
describe('CreateRiskHandler', () => {
  it('should create risk and return DTO', async () => {
    const mockRepo = new InMemoryRiskRepository();
    const handler = new CreateRiskHandler(mockRepo);
    
    const command = new CreateRiskCommand({ /* props */ });
    const result = await handler.handle(command);
    
    expect(result.id).toBeDefined();
    expect(result.riskScore.score).toBe(20);
  });
});
```

## Migration from Monolithic Code

The old monolithic `risk-routes-aria5.ts` file (4,185 lines) has been split into this modular structure:

**Before:**
- 1 file with 4,185 lines
- Mixed concerns (business logic, data access, API handling)
- Hard to test and maintain

**After:**
- 30+ focused modules with <500 lines each
- Clear separation of concerns
- Easy to test and extend
- Follows SOLID principles

## Benefits

1. **Maintainability**: Small, focused modules are easier to understand and modify
2. **Testability**: Each layer can be tested independently with mocks
3. **Flexibility**: Easy to swap implementations (e.g., different database)
4. **Scalability**: New features can be added without affecting existing code
5. **Team Collaboration**: Different developers can work on different layers
6. **Code Reuse**: Shared kernel can be used by other domains

## Next Steps

To integrate this module into your Hono routes:

```typescript
// src/routes/risk.routes.ts
import { Hono } from 'hono';
import { 
  CreateRiskCommand,
  CreateRiskHandler,
  D1RiskRepository
} from '@/domains/risks';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.post('/api/risks', async (c) => {
  const body = await c.req.json();
  
  // Setup dependencies
  const repo = new D1RiskRepository(c.env.DB);
  const handler = new CreateRiskHandler(repo);
  
  // Execute command
  const command = new CreateRiskCommand({
    ...body,
    organizationId: c.get('organizationId'),
    createdBy: c.get('userId')
  });
  
  const result = await handler.handle(command);
  
  return c.json(result, 201);
});

export default app;
```

## Documentation

- See [MODULAR_ARCHITECTURE_REFACTORING_PLAN.md](../../MODULAR_ARCHITECTURE_REFACTORING_PLAN.md) for overall refactoring strategy
- See [NEXT_PHASE_WEEK_2-3_GUIDE.md](../../NEXT_PHASE_WEEK_2-3_GUIDE.md) for Week 2-3 implementation details
- See shared kernel documentation at `src/shared/domain/README.md`

## Status

✅ **Phase 0 Week 1 COMPLETE**
- ✅ Domain entities (Risk, RiskTreatment)
- ✅ Value objects (RiskScore, RiskStatus)
- ✅ Repository interfaces
- ✅ Domain services
- ✅ CQRS commands and queries
- ✅ Command/Query handlers
- ✅ DTOs and mappers
- ✅ D1 repository implementations
- ⏳ Unit tests (pending)
- ⏳ Integration with existing routes (pending)
