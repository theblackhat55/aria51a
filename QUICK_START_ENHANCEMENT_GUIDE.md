# ARIA 5.1 ENHANCEMENT - QUICK START GUIDE

## 🚀 FOR DEVELOPERS

This is your quick reference guide to start implementing the ARIA 5.1 Enterprise Enhancement Roadmap.

---

## 📖 DOCUMENTATION INDEX

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[ENHANCEMENT_ROADMAP_SUMMARY.md](ENHANCEMENT_ROADMAP_SUMMARY.md)** | Executive overview | Start here - 10 min read |
| **[ARIA51_ENTERPRISE_ENHANCEMENT_ROADMAP.md](ARIA51_ENTERPRISE_ENHANCEMENT_ROADMAP.md)** | Complete implementation plan | Before coding each phase |
| **[MODULAR_ARCHITECTURE_REFACTORING_PLAN.md](MODULAR_ARCHITECTURE_REFACTORING_PLAN.md)** | DDD transformation guide | Week 1 before starting |
| **[QUICK_START_ENHANCEMENT_GUIDE.md](QUICK_START_ENHANCEMENT_GUIDE.md)** | This document | Daily reference |

---

## 🗓️ TIMELINE AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────┐
│ REFACTORING (8 weeks) → Clean foundation for 23 new features   │
├─────────────────────────────────────────────────────────────────┤
│ Week 1: Infrastructure setup (base classes, directories)        │
│ Week 2-3: Extract Risk domain (4,185 lines → 10 modules)       │
│ Week 4: Extract Compliance domain (2,764 lines → 7 modules)    │
│ Week 5: Extract Assets domain (4,288 lines → 12 modules)       │
│ Week 6: Extract Admin domain (5,406 lines → 15 modules)        │
│ Week 7: Extract Threat Intel (3,704 lines → 8 modules)         │
│ Week 8: Cutover and deprecate old routes                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1 (Months 1-3) → Compliance Engine Core                  │
├─────────────────────────────────────────────────────────────────┤
│ Month 1: Framework import pipeline (NIST, ISO, OSCAL parsers)  │
│ Month 2: Control mapping engine (AI similarity scoring)         │
│ Month 3: Test procedures + Template library (100+ templates)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2 (Months 4-6) → Integration Ecosystem                   │
├─────────────────────────────────────────────────────────────────┤
│ Month 4: Connector framework + AWS/Azure/GCP                    │
│ Month 5: Identity + DevOps connectors (20+ total)              │
│ Month 6: Security tools + Attack surface discovery              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3 (Months 7-9) → Audit & Governance                      │
├─────────────────────────────────────────────────────────────────┤
│ Month 7: Auditor portal + KPI framework design                  │
│ Month 8: Evidence presentation + KPI calculations               │
│ Month 9: Export packages + Board dashboards                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4 (Months 10-12) → Advanced Automation                   │
├─────────────────────────────────────────────────────────────────┤
│ Month 10: Continuous monitoring (200+ automated tests)          │
│ Month 11: ML models (anomaly detection, prediction)            │
│ Month 12: Auto-remediation + GraphQL API                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARCHITECTURE QUICK REFERENCE

### Current Structure (Monolithic)
```
src/routes/
├── admin-routes-aria5.ts         5,406 lines ❌
├── operations-fixed.ts            4,288 lines ❌
├── risk-routes-aria5.ts           4,185 lines ❌
├── intelligence-routes.ts         3,704 lines ❌
└── enhanced-compliance-routes.ts  2,764 lines ❌
```

### Target Structure (Modular DDD)
```
src/
├── domains/
│   ├── risks/                     Risk Management
│   │   ├── core/                  Business logic (no dependencies)
│   │   │   ├── entities/          Risk, RiskTreatment, KRI
│   │   │   ├── value-objects/     RiskScore, RiskStatus
│   │   │   ├── repositories/      IRiskRepository (interface)
│   │   │   └── services/          RiskScoringService
│   │   ├── application/           Use cases
│   │   │   ├── commands/          CreateRiskCommand + handlers
│   │   │   ├── queries/           GetRiskQuery + handlers
│   │   │   └── events/            RiskCreatedEvent
│   │   ├── infrastructure/        External concerns
│   │   │   ├── persistence/       D1RiskRepository (D1 implementation)
│   │   │   └── mappers/           DB row ↔ Entity conversion
│   │   └── presentation/          API layer
│   │       ├── routes/            Hono route handlers
│   │       ├── validators/        Zod schemas
│   │       └── dto/               Request/Response objects
│   │
│   ├── compliance/                Compliance Management
│   ├── assets/                    Asset Management
│   ├── incidents/                 Incident Management
│   ├── threat-intelligence/       Threat Intel
│   ├── admin/                     Administration
│   │
│   ├── frameworks/                NEW: Framework Library (Phase 1.1)
│   ├── templates/                 NEW: Template Library (Phase 1.2)
│   ├── integrations/              NEW: 40+ Connectors (Phase 2.1)
│   ├── attack-surface/            NEW: External Discovery (Phase 2.2)
│   ├── auditor-portal/            NEW: Auditor Workspace (Phase 3.1)
│   ├── kpis/                      NEW: Board Dashboards (Phase 3.2)
│   └── continuous-monitoring/     NEW: Automated Tests (Phase 4.1)
│
└── shared/                        Shared Kernel
    ├── domain/                    Entity, ValueObject, AggregateRoot
    ├── application/               Command, Query, EventBus
    ├── infrastructure/            D1, KV, R2, Queue, Vectorize
    └── presentation/              Middleware, ApiResponse
```

---

## 🔨 WEEK 1 CHECKLIST (Infrastructure Setup)

### Day 1: Create Directory Structure
```bash
cd /home/user/webapp

# Create domain directories
mkdir -p src/domains/{risks,compliance,assets,incidents,threat-intelligence,admin}/{core/{entities,value-objects,repositories,services},application/{commands,queries,events},infrastructure/{persistence,mappers},presentation/{routes,validators,dto}}

# Create shared kernel
mkdir -p src/shared/{domain,application,infrastructure/{database,messaging,caching,storage},presentation/{middleware,responses}}

# Create new domain directories for Phase 1-4
mkdir -p src/domains/{frameworks,templates,integrations,attack-surface,auditor-portal,kpis,continuous-monitoring}/{core,application,infrastructure,presentation}
```

### Day 2: Create Base Classes
```bash
# Create shared domain base classes
touch src/shared/domain/{Entity,ValueObject,AggregateRoot,DomainEvent}.ts

# Create shared application base classes
touch src/shared/application/{Command,CommandHandler,Query,QueryHandler,EventBus}.ts

# Create shared infrastructure
touch src/shared/infrastructure/database/{D1Connection,Transaction,QueryBuilder}.ts
touch src/shared/infrastructure/messaging/QueueClient.ts
touch src/shared/infrastructure/caching/KVCache.ts
touch src/shared/infrastructure/storage/R2Storage.ts

# Create shared presentation
touch src/shared/presentation/middleware/{auth,validate,error}.middleware.ts
touch src/shared/presentation/responses/{ApiResponse,ErrorResponse}.ts
```

### Day 3-5: Implement Base Classes
See detailed code in `MODULAR_ARCHITECTURE_REFACTORING_PLAN.md` sections:
- Entity.ts (base entity with ID and domain events)
- ValueObject.ts (immutable value objects)
- Command.ts / Query.ts (CQRS pattern)
- D1Connection.ts (database connection manager)

### Day 6-7: Set Up Testing Framework
```bash
# Create test directories
mkdir -p tests/{unit,integration}/{domains,shared}

# Install testing dependencies (if not already installed)
npm install -D vitest @vitest/ui @vitest/coverage-v8 happy-dom

# Create test configuration (already exists in vitest.config.ts)
```

---

## 📝 CODING STANDARDS

### 1. File Size Limits
- ✅ **Route files:** <500 lines (target <400)
- ✅ **Entity classes:** <200 lines
- ✅ **Handler classes:** <100 lines
- ✅ **Utility functions:** <50 lines

### 2. Naming Conventions
```typescript
// Entities (PascalCase, singular)
class Risk extends Entity { }

// Value Objects (PascalCase, descriptive)
class RiskScore extends ValueObject<number> { }

// Commands (PascalCase, imperative verb + noun + "Command")
class CreateRiskCommand extends Command { }

// Queries (PascalCase, "Get/List/Search" + noun + "Query")
class ListRisksQuery extends Query { }

// Handlers (PascalCase, command/query name + "Handler")
class CreateRiskHandler implements CommandHandler<CreateRiskCommand> { }

// Repositories (PascalCase, "I" prefix for interface, tech prefix for implementation)
interface IRiskRepository { }
class D1RiskRepository implements IRiskRepository { }

// Routes (kebab-case)
export const riskRoutes = new Hono();
```

### 3. Import Organization
```typescript
// 1. External dependencies
import { Hono } from 'hono';
import { z } from 'zod';

// 2. Shared kernel
import { Entity } from '@/shared/domain/Entity';
import { Command } from '@/shared/application/Command';

// 3. Domain layer (same domain only)
import { Risk } from '../../core/entities/Risk';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';

// 4. Infrastructure layer (same domain only)
import { D1RiskRepository } from '../../infrastructure/persistence/D1RiskRepository';

// ❌ NEVER import from other domains' core layer
// ❌ NEVER import infrastructure in core layer
```

### 4. Dependency Rules (Clean Architecture)
```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ←────┘

✅ Presentation can import: Application, Domain, Infrastructure
✅ Application can import: Domain only
✅ Infrastructure can import: Domain only
✅ Domain can import: Nothing (pure business logic)

❌ Domain CANNOT import: Application, Infrastructure, Presentation
❌ Core layers CANNOT import outer layers
```

---

## 🧪 TESTING STRATEGY

### Test Coverage Targets
- **Unit Tests:** >90% coverage of core domain logic
- **Integration Tests:** All database operations
- **E2E Tests:** Critical user workflows

### Test File Locations
```
tests/
├── unit/
│   └── domains/
│       └── risks/
│           ├── core/
│           │   ├── entities/
│           │   │   └── Risk.test.ts
│           │   └── value-objects/
│           │       └── RiskScore.test.ts
│           └── application/
│               └── handlers/
│                   └── CreateRiskHandler.test.ts
└── integration/
    └── domains/
        └── risks/
            └── infrastructure/
                └── D1RiskRepository.test.ts
```

### Example Test Structure
```typescript
// tests/unit/domains/risks/core/entities/Risk.test.ts
import { describe, it, expect } from 'vitest';
import { Risk } from '@/domains/risks/core/entities/Risk';

describe('Risk Entity', () => {
  describe('creation', () => {
    it('should create valid risk with score calculation', () => {
      const risk = Risk.create({
        title: 'Test Risk',
        probability: 4,
        impact: 5,
        // ...
      });
      
      expect(risk.calculateScore().value).toBe(20);
      expect(risk.calculateScore().severity).toBe('critical');
    });
  });

  describe('validation', () => {
    it('should reject invalid probability', () => {
      expect(() => {
        Risk.create({ probability: 6, /* ... */ });
      }).toThrow('Probability must be between 1 and 5');
    });
  });
});
```

---

## 🔗 USEFUL COMMANDS

### Development
```bash
# Start local development
npm run dev:sandbox

# Build for production
npm run build

# Run tests
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode

# Database operations
npm run db:migrate:local  # Apply migrations locally
npm run db:seed          # Seed test data
npm run db:reset         # Reset and reseed
```

### Code Quality
```bash
# Type checking
npx tsc --noEmit

# Find large files (>500 lines)
find src -name "*.ts" -exec wc -l {} + | sort -rn | head -20

# Check for code duplication
npx jscpd src/

# Count lines by directory
find src/domains/risks -name "*.ts" -exec wc -l {} + | tail -1
```

---

## 📚 LEARNING RESOURCES

### Domain-Driven Design
- **Book:** "Domain-Driven Design" by Eric Evans
- **Video:** "DDD Europe 2020 - Domain-Driven Design" (YouTube)
- **Article:** [Martin Fowler - Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

### CQRS Pattern
- **Article:** [Martin Fowler - CQRS](https://martinfowler.com/bliki/CQRS.html)
- **Video:** "CQRS and Event Sourcing" by Greg Young
- **Example:** See `src/domains/risks/application/` for implementation

### Clean Architecture
- **Book:** "Clean Architecture" by Robert C. Martin
- **Article:** [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- **Diagram:** See dependency flow in `MODULAR_ARCHITECTURE_REFACTORING_PLAN.md`

---

## 🆘 TROUBLESHOOTING

### Issue: Import errors after refactoring
**Solution:** Update `tsconfig.json` paths mapping
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/domains/*": ["./src/domains/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

### Issue: Database connection in tests
**Solution:** Use in-memory SQLite for unit tests
```typescript
import { Database } from 'better-sqlite3';

const db = new Database(':memory:');
// Initialize schema for tests
```

### Issue: Circular dependencies
**Solution:** Check dependency rules - likely violating Clean Architecture
- Domain layer should NEVER import from application/infrastructure
- Use dependency inversion (interfaces) if needed

### Issue: Large handler files
**Solution:** Extract business logic to domain services
```typescript
// ❌ Don't put logic in handlers
class CreateRiskHandler {
  execute(command) {
    // 50 lines of complex logic here ❌
  }
}

// ✅ Extract to domain service
class RiskScoringService {
  calculateScore(risk) { /* logic */ }
}

class CreateRiskHandler {
  constructor(private scoringService: RiskScoringService) {}
  execute(command) {
    const risk = Risk.create(command);
    const score = this.scoringService.calculateScore(risk);
    // ...
  }
}
```

---

## 📊 PROGRESS TRACKING

### Weekly Checklist Template
```
Week X: [Domain Name] Extraction
- [ ] Day 1-2: Create entities and value objects
- [ ] Day 3: Create repository interfaces
- [ ] Day 4: Implement D1 repositories
- [ ] Day 5-7: Create CQRS handlers
- [ ] Day 8-9: Create routes with validation
- [ ] Day 10: Update main index.ts
- [ ] Day 11-12: Write tests (>90% coverage)
- [ ] Code review and merge
```

### Success Criteria Per Domain
- ✅ All files <500 lines
- ✅ Zero cross-domain core imports
- ✅ Test coverage >90%
- ✅ All old functionality preserved
- ✅ API backward compatible (v1 and v2 both work)

---

## 🎯 NEXT ACTIONS

### This Week (Week 1)
1. ✅ Read all documentation (4 hours)
2. ⏳ Set up development environment
3. ⏳ Create directory structure (Day 1)
4. ⏳ Implement base classes (Day 2-5)
5. ⏳ Configure testing framework (Day 6-7)

### Next Week (Week 2)
1. Start Risk domain extraction
2. Daily standup to track progress
3. Code reviews for base classes
4. Document learnings and blockers

---

## 📞 SUPPORT

**Questions?** Ask in:
- Slack: #aria-enhancement-project
- Email: [team-lead@company.com]
- Weekly Office Hours: Fridays 2-3pm

**Blockers?** Escalate to:
- Technical: [architecture-lead@company.com]
- Process: [project-manager@company.com]

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Status:** Ready for Team Distribution
