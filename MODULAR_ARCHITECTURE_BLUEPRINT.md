# ARIA5.1 - Modular Architecture Blueprint

**Document Version**: 1.0  
**Date**: October 21, 2025  
**Objective**: Transform ARIA5.1 into a modular, maintainable, and extensible enterprise GRC platform  
**Status**: Architectural Proposal  

---

## Executive Summary

Current ARIA5.1 has **monolithic route files** (up to 237KB), tightly coupled services, and limited modularity. This blueprint proposes a **Domain-Driven Design (DDD)** approach with **feature modules**, **clean architecture layers**, and **plugin-based extensibility** to support future enhancements without impacting existing functionality.

### Current Problems ❌
- **Giant route files**: `admin-routes-aria5.ts` (237KB), `risk-routes-aria5.ts` (189KB)
- **Tightly coupled code**: Direct database access in routes
- **No module boundaries**: Everything imports everything
- **Difficult testing**: Business logic mixed with HTTP handling
- **Hard to extend**: Adding features requires modifying core files
- **No plugin system**: Cannot add features without code changes

### Proposed Solutions ✅
- **Feature-based modules**: Self-contained domain modules
- **Clean architecture layers**: Clear separation of concerns
- **Repository pattern**: Abstract database access
- **Event-driven communication**: Loose coupling between modules
- **Plugin system**: Dynamic feature loading
- **Dependency injection**: Flexible component management

---

## 1. Proposed Directory Structure

### **1.1 New Modular Structure**

```
src/
├── core/                                # Core framework (rarely changes)
│   ├── domain/                          # Core domain entities
│   │   ├── entities/                    # Base entity classes
│   │   │   ├── BaseEntity.ts
│   │   │   ├── AggregateRoot.ts
│   │   │   └── ValueObject.ts
│   │   ├── events/                      # Domain events
│   │   │   ├── DomainEvent.ts
│   │   │   ├── EventBus.ts
│   │   │   └── EventHandler.ts
│   │   └── exceptions/                  # Core exceptions
│   │       ├── DomainException.ts
│   │       ├── ValidationException.ts
│   │       └── NotFoundException.ts
│   │
│   ├── application/                     # Core application services
│   │   ├── interfaces/                  # Core interfaces
│   │   │   ├── IRepository.ts
│   │   │   ├── IUnitOfWork.ts
│   │   │   ├── IEventBus.ts
│   │   │   └── ILogger.ts
│   │   ├── dto/                         # Data Transfer Objects
│   │   │   ├── PaginationDTO.ts
│   │   │   └── ResponseDTO.ts
│   │   └── services/                    # Core services
│   │       ├── AuthenticationService.ts
│   │       └── AuthorizationService.ts
│   │
│   ├── infrastructure/                  # Core infrastructure
│   │   ├── database/                    # Database abstraction
│   │   │   ├── DatabaseConnection.ts
│   │   │   ├── TransactionManager.ts
│   │   │   └── QueryBuilder.ts
│   │   ├── cache/                       # Caching layer
│   │   │   ├── CacheManager.ts
│   │   │   └── CacheProvider.ts
│   │   ├── logging/                     # Logging infrastructure
│   │   │   ├── Logger.ts
│   │   │   └── LoggerFactory.ts
│   │   └── messaging/                   # Message queue (future)
│   │       ├── MessageBroker.ts
│   │       └── MessageHandler.ts
│   │
│   └── presentation/                    # Core presentation layer
│       ├── middleware/                  # Shared middleware
│       │   ├── AuthMiddleware.ts
│       │   ├── ErrorHandlerMiddleware.ts
│       │   ├── ValidationMiddleware.ts
│       │   └── RateLimitMiddleware.ts
│       ├── validators/                  # Request validators
│       │   ├── BaseValidator.ts
│       │   └── ValidationRules.ts
│       └── transformers/                # Response transformers
│           ├── BaseTransformer.ts
│           └── PaginationTransformer.ts
│
├── modules/                             # Feature modules (isolated domains)
│   │
│   ├── risk-management/                 # Risk Management Module
│   │   ├── domain/                      # Domain layer
│   │   │   ├── entities/
│   │   │   │   ├── Risk.ts              # Risk aggregate root
│   │   │   │   ├── RiskTreatment.ts
│   │   │   │   ├── RiskAssessment.ts
│   │   │   │   └── KeyRiskIndicator.ts
│   │   │   ├── value-objects/           # Value objects
│   │   │   │   ├── RiskScore.ts
│   │   │   │   ├── RiskCategory.ts
│   │   │   │   ├── RiskStatus.ts
│   │   │   │   └── RiskProbability.ts
│   │   │   ├── repositories/            # Repository interfaces
│   │   │   │   ├── IRiskRepository.ts
│   │   │   │   ├── IRiskTreatmentRepository.ts
│   │   │   │   └── IKRIRepository.ts
│   │   │   ├── services/                # Domain services
│   │   │   │   ├── RiskScoringService.ts
│   │   │   │   ├── RiskValidationService.ts
│   │   │   │   └── RiskRelationshipService.ts
│   │   │   └── events/                  # Domain events
│   │   │       ├── RiskCreatedEvent.ts
│   │   │       ├── RiskUpdatedEvent.ts
│   │   │       ├── RiskDeletedEvent.ts
│   │   │       └── RiskMitigatedEvent.ts
│   │   │
│   │   ├── application/                 # Application layer
│   │   │   ├── commands/                # Command handlers (CQRS)
│   │   │   │   ├── CreateRiskCommand.ts
│   │   │   │   ├── UpdateRiskCommand.ts
│   │   │   │   ├── DeleteRiskCommand.ts
│   │   │   │   └── CreateRiskHandler.ts
│   │   │   ├── queries/                 # Query handlers (CQRS)
│   │   │   │   ├── GetRiskByIdQuery.ts
│   │   │   │   ├── ListRisksQuery.ts
│   │   │   │   ├── GetRiskStatsQuery.ts
│   │   │   │   └── GetRiskByIdHandler.ts
│   │   │   ├── dto/                     # Module-specific DTOs
│   │   │   │   ├── CreateRiskDTO.ts
│   │   │   │   ├── UpdateRiskDTO.ts
│   │   │   │   ├── RiskResponseDTO.ts
│   │   │   │   └── RiskListDTO.ts
│   │   │   └── services/                # Application services
│   │   │       ├── RiskApplicationService.ts
│   │   │       ├── RiskReportingService.ts
│   │   │       └── RiskExportService.ts
│   │   │
│   │   ├── infrastructure/              # Infrastructure layer
│   │   │   ├── repositories/            # Repository implementations
│   │   │   │   ├── RiskRepository.ts
│   │   │   │   ├── RiskTreatmentRepository.ts
│   │   │   │   └── KRIRepository.ts
│   │   │   ├── persistence/             # Database schemas
│   │   │   │   ├── RiskSchema.ts
│   │   │   │   └── migrations/
│   │   │   │       ├── 001_create_risks_table.sql
│   │   │   │       └── 002_add_risk_scoring.sql
│   │   │   └── external/                # External integrations
│   │   │       ├── ThreatIntelAdapter.ts
│   │   │       └── ComplianceAdapter.ts
│   │   │
│   │   ├── presentation/                # Presentation layer
│   │   │   ├── http/                    # HTTP routes
│   │   │   │   ├── RiskController.ts
│   │   │   │   ├── RiskAPIController.ts
│   │   │   │   └── routes.ts
│   │   │   ├── validators/              # Request validators
│   │   │   │   ├── CreateRiskValidator.ts
│   │   │   │   └── UpdateRiskValidator.ts
│   │   │   ├── transformers/            # Response transformers
│   │   │   │   ├── RiskTransformer.ts
│   │   │   │   └── RiskListTransformer.ts
│   │   │   └── views/                   # HTML templates
│   │   │       ├── risk-dashboard.ts
│   │   │       ├── risk-detail.ts
│   │   │       └── risk-form.ts
│   │   │
│   │   ├── tests/                       # Module tests
│   │   │   ├── unit/
│   │   │   │   ├── entities/
│   │   │   │   ├── services/
│   │   │   │   └── value-objects/
│   │   │   ├── integration/
│   │   │   │   ├── repositories/
│   │   │   │   └── commands/
│   │   │   └── e2e/
│   │   │       └── risk-workflows.test.ts
│   │   │
│   │   ├── config/                      # Module configuration
│   │   │   ├── module.config.ts
│   │   │   └── permissions.config.ts
│   │   │
│   │   └── index.ts                     # Module entry point
│   │
│   ├── compliance/                      # Compliance Module
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── ComplianceFramework.ts
│   │   │   │   ├── Control.ts
│   │   │   │   ├── Assessment.ts
│   │   │   │   └── Evidence.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── ControlStatus.ts
│   │   │   │   └── ComplianceScore.ts
│   │   │   ├── repositories/
│   │   │   │   ├── IFrameworkRepository.ts
│   │   │   │   └── IControlRepository.ts
│   │   │   └── events/
│   │   │       ├── ControlImplementedEvent.ts
│   │   │       └── AssessmentCompletedEvent.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── services/
│   │   ├── infrastructure/
│   │   │   ├── repositories/
│   │   │   └── persistence/
│   │   ├── presentation/
│   │   │   ├── http/
│   │   │   └── views/
│   │   └── index.ts
│   │
│   ├── vendor-management/               # TPRM Module (NEW)
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── Vendor.ts
│   │   │   │   ├── VendorAssessment.ts
│   │   │   │   ├── VendorContract.ts
│   │   │   │   └── VendorRisk.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── VendorTier.ts
│   │   │   │   └── ContractStatus.ts
│   │   │   └── repositories/
│   │   │       └── IVendorRepository.ts
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── index.ts
│   │
│   ├── asset-management/                # Asset Management Module
│   ├── incident-management/             # Incident Management Module
│   ├── policy-management/               # Policy Management Module (NEW)
│   ├── business-continuity/             # BC/DR Module (NEW)
│   ├── threat-intelligence/             # Threat Intelligence Module
│   ├── ai-assistant/                    # AI Assistant Module
│   ├── audit-logging/                   # Audit & Logging Module
│   └── user-management/                 # User & RBAC Module
│
├── shared/                              # Shared utilities (cross-cutting)
│   ├── utils/
│   │   ├── DateUtils.ts
│   │   ├── StringUtils.ts
│   │   ├── ValidationUtils.ts
│   │   └── CryptoUtils.ts
│   ├── constants/
│   │   ├── AppConstants.ts
│   │   ├── ErrorCodes.ts
│   │   └── HttpStatus.ts
│   ├── types/
│   │   ├── CommonTypes.ts
│   │   └── GlobalInterfaces.ts
│   └── helpers/
│       ├── ResponseHelper.ts
│       └── ErrorHelper.ts
│
├── plugins/                             # Plugin system (NEW)
│   ├── plugin-manager/
│   │   ├── PluginLoader.ts
│   │   ├── PluginRegistry.ts
│   │   └── IPlugin.ts
│   ├── installed-plugins/
│   │   ├── custom-compliance-plugin/
│   │   └── third-party-integration/
│   └── plugin-api/
│       ├── PluginHooks.ts
│       └── PluginContext.ts
│
├── config/                              # Application configuration
│   ├── database.config.ts
│   ├── app.config.ts
│   ├── modules.config.ts                # Module registry
│   ├── plugins.config.ts
│   └── environment.ts
│
├── bootstrap/                           # Application bootstrapping
│   ├── app.bootstrap.ts                 # Main application setup
│   ├── module.bootstrap.ts              # Module loader
│   ├── dependency-injection.ts          # DI container
│   └── event-listeners.ts               # Event subscriber registration
│
├── migrations/                          # Database migrations (organized)
│   ├── core/                            # Core table migrations
│   │   ├── 001_create_users_table.sql
│   │   └── 002_create_organizations.sql
│   ├── modules/                         # Per-module migrations
│   │   ├── risk-management/
│   │   │   ├── 001_create_risks.sql
│   │   │   └── 002_add_risk_scoring.sql
│   │   └── compliance/
│   │       └── 001_create_frameworks.sql
│   └── migration-runner.ts
│
└── server.ts                            # Application entry point
```

---

## 2. Core Architecture Patterns

### **2.1 Clean Architecture Layers**

```typescript
// Layer Dependencies (Dependency Inversion Principle)
// Outer layers depend on inner layers, NEVER the reverse

┌─────────────────────────────────────────────┐
│         Presentation Layer (HTTP)           │ ← Controllers, Routes, Views
│  - Routes/Controllers                       │
│  - Request/Response Handling                │
│  - Input Validation                         │
└───────────────┬─────────────────────────────┘
                │ depends on ↓
┌───────────────▼─────────────────────────────┐
│         Application Layer (Use Cases)       │ ← Commands, Queries, Services
│  - Command Handlers (CQRS)                  │
│  - Query Handlers (CQRS)                    │
│  - Application Services                     │
│  - DTOs                                     │
└───────────────┬─────────────────────────────┘
                │ depends on ↓
┌───────────────▼─────────────────────────────┐
│         Domain Layer (Business Logic)       │ ← Entities, Value Objects
│  - Entities (Aggregates)                    │
│  - Value Objects                            │
│  - Domain Services                          │
│  - Domain Events                            │
│  - Repository Interfaces                    │
└───────────────┬─────────────────────────────┘
                │ implemented by ↓
┌───────────────▼─────────────────────────────┐
│      Infrastructure Layer (Technical)       │ ← Database, External APIs
│  - Repository Implementations               │
│  - Database Access                          │
│  - External Service Integrations            │
│  - File System                              │
└─────────────────────────────────────────────┘
```

### **2.2 Module Independence**

Each module is **self-contained** with minimal dependencies:

```typescript
// modules/risk-management/index.ts
export class RiskManagementModule implements IModule {
  readonly name = 'risk-management';
  readonly version = '1.0.0';
  
  // Module metadata
  readonly dependencies = ['audit-logging', 'user-management'];
  readonly provides = ['RiskService', 'RiskRepository'];
  
  // Lifecycle hooks
  async initialize(container: DIContainer): Promise<void> {
    // Register repositories
    container.register('IRiskRepository', RiskRepository);
    
    // Register services
    container.register('RiskApplicationService', RiskApplicationService);
    
    // Register event handlers
    container.register('RiskCreatedEventHandler', RiskCreatedEventHandler);
  }
  
  async boot(app: Application): Promise<void> {
    // Register routes
    const router = new Router();
    router.register('/risks', RiskController);
    app.use('/api/v1', router);
  }
  
  async shutdown(): Promise<void> {
    // Cleanup resources
  }
}
```

### **2.3 Event-Driven Communication**

Modules communicate via **domain events** instead of direct coupling:

```typescript
// modules/risk-management/domain/events/RiskCreatedEvent.ts
export class RiskCreatedEvent extends DomainEvent {
  constructor(
    public readonly riskId: string,
    public readonly riskData: {
      title: string;
      severity: string;
      category: string;
      affectedAssets: string[];
    }
  ) {
    super('risk.created');
  }
}

// modules/risk-management/application/commands/CreateRiskHandler.ts
export class CreateRiskCommandHandler {
  async handle(command: CreateRiskCommand): Promise<Risk> {
    // Create risk
    const risk = Risk.create(command.data);
    await this.riskRepository.save(risk);
    
    // Publish event (other modules can listen)
    await this.eventBus.publish(new RiskCreatedEvent(
      risk.id,
      risk.toEventData()
    ));
    
    return risk;
  }
}

// modules/compliance/application/event-handlers/RiskCreatedHandler.ts
export class ComplianceRiskCreatedHandler implements IEventHandler {
  async handle(event: RiskCreatedEvent): Promise<void> {
    // Automatically create compliance assessment for high-severity risks
    if (event.riskData.severity === 'critical') {
      await this.assessmentService.createAutomaticAssessment(event.riskId);
    }
  }
}
```

---

## 3. Repository Pattern Implementation

### **3.1 Repository Interface (Domain Layer)**

```typescript
// modules/risk-management/domain/repositories/IRiskRepository.ts
export interface IRiskRepository {
  // Basic CRUD
  findById(id: string): Promise<Risk | null>;
  findAll(filters?: RiskFilters): Promise<Risk[]>;
  save(risk: Risk): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Domain-specific queries
  findByCategory(category: string): Promise<Risk[]>;
  findCriticalRisks(): Promise<Risk[]>;
  findOverdueRisks(date: Date): Promise<Risk[]>;
  
  // Aggregations
  countByStatus(status: RiskStatus): Promise<number>;
  calculateAverageScore(): Promise<number>;
  
  // Batch operations
  saveMany(risks: Risk[]): Promise<void>;
}

// Repository filters (Value Object)
export class RiskFilters {
  constructor(
    public readonly status?: RiskStatus,
    public readonly category?: string,
    public readonly minScore?: number,
    public readonly maxScore?: number,
    public readonly ownerId?: string,
    public readonly pagination?: { page: number; limit: number }
  ) {}
}
```

### **3.2 Repository Implementation (Infrastructure Layer)**

```typescript
// modules/risk-management/infrastructure/repositories/RiskRepository.ts
export class RiskRepository implements IRiskRepository {
  constructor(
    private readonly db: DatabaseConnection,
    private readonly mapper: RiskMapper
  ) {}
  
  async findById(id: string): Promise<Risk | null> {
    const row = await this.db.query(
      'SELECT * FROM risks WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    return this.mapper.toDomain(row);
  }
  
  async save(risk: Risk): Promise<void> {
    const data = this.mapper.toPersistence(risk);
    
    const exists = await this.exists(risk.id);
    if (exists) {
      await this.db.query(
        'UPDATE risks SET title = ?, description = ?, ... WHERE id = ?',
        [data.title, data.description, ..., risk.id]
      );
    } else {
      await this.db.query(
        'INSERT INTO risks (id, title, description, ...) VALUES (?, ?, ?, ...)',
        [risk.id, data.title, data.description, ...]
      );
    }
    
    // Emit domain events
    for (const event of risk.getDomainEvents()) {
      await this.eventBus.publish(event);
    }
    risk.clearDomainEvents();
  }
  
  async findCriticalRisks(): Promise<Risk[]> {
    const rows = await this.db.query(`
      SELECT * FROM risks 
      WHERE risk_score >= 20 
      AND status = 'active'
      ORDER BY risk_score DESC
    `);
    
    return rows.map(row => this.mapper.toDomain(row));
  }
  
  private async exists(id: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM risks WHERE id = ? LIMIT 1',
      [id]
    );
    return !!result;
  }
}
```

### **3.3 Data Mapper Pattern**

```typescript
// modules/risk-management/infrastructure/mappers/RiskMapper.ts
export class RiskMapper {
  // Domain → Database
  toPersistence(risk: Risk): RiskPersistenceModel {
    return {
      id: risk.id,
      title: risk.title,
      description: risk.description,
      category: risk.category.value,
      probability: risk.probability.value,
      impact: risk.impact.value,
      risk_score: risk.score.value,
      status: risk.status.value,
      owner_id: risk.ownerId,
      created_at: risk.createdAt,
      updated_at: risk.updatedAt
    };
  }
  
  // Database → Domain
  toDomain(raw: RiskPersistenceModel): Risk {
    return Risk.reconstitute({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      category: RiskCategory.fromValue(raw.category),
      probability: RiskProbability.fromValue(raw.probability),
      impact: RiskImpact.fromValue(raw.impact),
      score: RiskScore.calculate(raw.probability, raw.impact),
      status: RiskStatus.fromValue(raw.status),
      ownerId: raw.owner_id,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    });
  }
}
```

---

## 4. CQRS Pattern (Command Query Responsibility Segregation)

### **4.1 Command Side (Write Operations)**

```typescript
// modules/risk-management/application/commands/CreateRiskCommand.ts
export class CreateRiskCommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly probability: number,
    public readonly impact: number,
    public readonly ownerId: string,
    public readonly userId: string // Who's creating it
  ) {}
}

// modules/risk-management/application/commands/CreateRiskHandler.ts
export class CreateRiskCommandHandler {
  constructor(
    private readonly riskRepository: IRiskRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}
  
  async handle(command: CreateRiskCommand): Promise<string> {
    this.logger.info('Creating new risk', { title: command.title });
    
    // Validate command
    this.validate(command);
    
    // Create domain entity
    const risk = Risk.create({
      title: command.title,
      description: command.description,
      category: RiskCategory.fromValue(command.category),
      probability: RiskProbability.fromValue(command.probability),
      impact: RiskImpact.fromValue(command.impact),
      ownerId: command.ownerId,
      createdBy: command.userId
    });
    
    // Persist
    await this.riskRepository.save(risk);
    
    this.logger.info('Risk created successfully', { riskId: risk.id });
    
    return risk.id;
  }
  
  private validate(command: CreateRiskCommand): void {
    if (!command.title || command.title.length < 3) {
      throw new ValidationException('Risk title must be at least 3 characters');
    }
    if (command.probability < 1 || command.probability > 5) {
      throw new ValidationException('Probability must be between 1 and 5');
    }
    // ... more validations
  }
}
```

### **4.2 Query Side (Read Operations)**

```typescript
// modules/risk-management/application/queries/GetRiskByIdQuery.ts
export class GetRiskByIdQuery {
  constructor(public readonly riskId: string) {}
}

// modules/risk-management/application/queries/GetRiskByIdHandler.ts
export class GetRiskByIdQueryHandler {
  constructor(
    private readonly riskRepository: IRiskRepository,
    private readonly riskTransformer: RiskTransformer
  ) {}
  
  async handle(query: GetRiskByIdQuery): Promise<RiskResponseDTO> {
    const risk = await this.riskRepository.findById(query.riskId);
    
    if (!risk) {
      throw new NotFoundException(`Risk with ID ${query.riskId} not found`);
    }
    
    // Transform to DTO
    return this.riskTransformer.toDTO(risk);
  }
}

// modules/risk-management/application/queries/ListRisksQuery.ts
export class ListRisksQuery {
  constructor(
    public readonly filters?: {
      status?: string;
      category?: string;
      minScore?: number;
      page?: number;
      limit?: number;
    }
  ) {}
}

// modules/risk-management/application/queries/ListRisksHandler.ts
export class ListRisksQueryHandler {
  async handle(query: ListRisksQuery): Promise<PaginatedResponse<RiskListDTO>> {
    const filters = new RiskFilters(
      query.filters?.status ? RiskStatus.fromValue(query.filters.status) : undefined,
      query.filters?.category,
      query.filters?.minScore,
      undefined,
      undefined,
      { page: query.filters?.page || 1, limit: query.filters?.limit || 20 }
    );
    
    const risks = await this.riskRepository.findAll(filters);
    const total = await this.riskRepository.count(filters);
    
    return {
      data: risks.map(risk => this.riskTransformer.toListDTO(risk)),
      pagination: {
        page: filters.pagination!.page,
        limit: filters.pagination!.limit,
        total,
        totalPages: Math.ceil(total / filters.pagination!.limit)
      }
    };
  }
}
```

---

## 5. Dependency Injection Container

### **5.1 DI Container Implementation**

```typescript
// core/infrastructure/dependency-injection/DIContainer.ts
export class DIContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();
  
  // Register singleton
  register<T>(token: string, instance: T): void {
    this.services.set(token, instance);
  }
  
  // Register factory (creates new instance each time)
  registerFactory<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }
  
  // Register class (instantiates with dependencies)
  registerClass<T>(token: string, ClassConstructor: new (...args: any[]) => T): void {
    this.factories.set(token, () => {
      const dependencies = this.resolveDependencies(ClassConstructor);
      return new ClassConstructor(...dependencies);
    });
  }
  
  // Resolve dependency
  resolve<T>(token: string): T {
    // Check if singleton exists
    if (this.services.has(token)) {
      return this.services.get(token);
    }
    
    // Check if factory exists
    if (this.factories.has(token)) {
      return this.factories.get(token)!();
    }
    
    throw new Error(`Service "${token}" not registered in DI container`);
  }
  
  private resolveDependencies(ClassConstructor: any): any[] {
    // Read constructor parameters metadata (requires reflect-metadata)
    const paramTypes = Reflect.getMetadata('design:paramtypes', ClassConstructor) || [];
    return paramTypes.map((type: any) => this.resolve(type.name));
  }
}
```

### **5.2 Decorator-Based Injection**

```typescript
// core/infrastructure/dependency-injection/decorators.ts
export function Injectable() {
  return function (target: any) {
    Reflect.defineMetadata('injectable', true, target);
  };
}

export function Inject(token: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingParams = Reflect.getMetadata('inject:params', target) || [];
    existingParams.push({ index: parameterIndex, token });
    Reflect.defineMetadata('inject:params', existingParams, target);
  };
}

// Usage in services
@Injectable()
export class CreateRiskCommandHandler {
  constructor(
    @Inject('IRiskRepository') private riskRepository: IRiskRepository,
    @Inject('IEventBus') private eventBus: IEventBus,
    @Inject('ILogger') private logger: ILogger
  ) {}
}
```

### **5.3 Module Registration**

```typescript
// bootstrap/dependency-injection.ts
export function setupDependencyInjection(): DIContainer {
  const container = new DIContainer();
  
  // Register core services
  container.register('IEventBus', new EventBus());
  container.register('ILogger', new Logger());
  container.register('DatabaseConnection', new DatabaseConnection());
  
  // Register modules
  const modules = [
    new RiskManagementModule(),
    new ComplianceModule(),
    new VendorManagementModule()
  ];
  
  for (const module of modules) {
    module.initialize(container);
  }
  
  return container;
}
```

---

## 6. Plugin System Architecture

### **6.1 Plugin Interface**

```typescript
// plugins/plugin-manager/IPlugin.ts
export interface IPlugin {
  // Metadata
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  
  // Dependencies
  readonly requiredModules?: string[];
  readonly requiredPlugins?: string[];
  
  // Lifecycle hooks
  install?(context: PluginContext): Promise<void>;
  initialize?(context: PluginContext): Promise<void>;
  boot?(context: PluginContext): Promise<void>;
  shutdown?(): Promise<void>;
  uninstall?(): Promise<void>;
  
  // Extension points
  registerRoutes?(router: Router): void;
  registerEventHandlers?(eventBus: IEventBus): void;
  registerMiddleware?(app: Application): void;
  extendDatabase?(migrations: Migration[]): void;
}

// Plugin context (sandbox for plugins)
export interface PluginContext {
  container: DIContainer;
  eventBus: IEventBus;
  logger: ILogger;
  database: DatabaseConnection;
  config: PluginConfig;
}
```

### **6.2 Plugin Manager**

```typescript
// plugins/plugin-manager/PluginManager.ts
export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private loadedPlugins: Set<string> = new Set();
  
  constructor(
    private readonly pluginRegistry: PluginRegistry,
    private readonly context: PluginContext
  ) {}
  
  // Discover and load plugins
  async loadPlugins(): Promise<void> {
    const pluginPaths = await this.discoverPlugins();
    
    for (const path of pluginPaths) {
      try {
        const plugin = await this.loadPlugin(path);
        await this.registerPlugin(plugin);
      } catch (error) {
        this.context.logger.error(`Failed to load plugin: ${path}`, error);
      }
    }
  }
  
  // Register a plugin
  async registerPlugin(plugin: IPlugin): Promise<void> {
    // Check dependencies
    this.validateDependencies(plugin);
    
    // Register in registry
    this.plugins.set(plugin.name, plugin);
    
    // Run lifecycle hooks
    if (plugin.install) await plugin.install(this.context);
    if (plugin.initialize) await plugin.initialize(this.context);
    if (plugin.boot) await plugin.boot(this.context);
    
    this.loadedPlugins.add(plugin.name);
    this.context.logger.info(`Plugin loaded: ${plugin.name} v${plugin.version}`);
  }
  
  // Get plugin by name
  getPlugin(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }
  
  // Check if plugin is loaded
  isLoaded(name: string): boolean {
    return this.loadedPlugins.has(name);
  }
  
  private validateDependencies(plugin: IPlugin): void {
    if (plugin.requiredModules) {
      for (const moduleName of plugin.requiredModules) {
        if (!this.context.container.has(moduleName)) {
          throw new Error(`Plugin "${plugin.name}" requires module "${moduleName}"`);
        }
      }
    }
    
    if (plugin.requiredPlugins) {
      for (const pluginName of plugin.requiredPlugins) {
        if (!this.isLoaded(pluginName)) {
          throw new Error(`Plugin "${plugin.name}" requires plugin "${pluginName}"`);
        }
      }
    }
  }
  
  private async discoverPlugins(): Promise<string[]> {
    // Scan plugins directory
    // Return paths to plugin entry points
  }
  
  private async loadPlugin(path: string): Promise<IPlugin> {
    // Dynamically import plugin
    const module = await import(path);
    return new module.default();
  }
}
```

### **6.3 Example Plugin**

```typescript
// plugins/installed-plugins/custom-risk-scoring-plugin/index.ts
export default class CustomRiskScoringPlugin implements IPlugin {
  readonly name = 'custom-risk-scoring';
  readonly version = '1.0.0';
  readonly description = 'Custom risk scoring algorithm with industry-specific factors';
  readonly author = 'Security Team';
  
  readonly requiredModules = ['risk-management'];
  
  async initialize(context: PluginContext): Promise<void> {
    // Register custom risk scoring service
    context.container.register(
      'CustomRiskScoringService',
      new CustomRiskScoringService()
    );
  }
  
  registerEventHandlers(eventBus: IEventBus): void {
    // Listen to risk events and apply custom scoring
    eventBus.subscribe('risk.created', async (event: RiskCreatedEvent) => {
      const service = context.container.resolve<CustomRiskScoringService>(
        'CustomRiskScoringService'
      );
      await service.recalculateScore(event.riskId);
    });
  }
  
  registerRoutes(router: Router): void {
    // Add custom routes
    router.get('/api/v1/risks/:id/custom-score', async (req, res) => {
      const service = context.container.resolve<CustomRiskScoringService>(
        'CustomRiskScoringService'
      );
      const score = await service.calculateCustomScore(req.params.id);
      res.json({ customScore: score });
    });
  }
}
```

---

## 7. Migration Strategy (From Current to New Architecture)

### **7.1 Phase 1: Foundation (Weeks 1-2)**

**Create core infrastructure without breaking existing code:**

```typescript
// Step 1: Create core directory structure
src/
├── core/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── modules/  (new, empty for now)
└── (existing directories remain unchanged)

// Step 2: Implement base classes
// core/domain/entities/BaseEntity.ts
// core/domain/entities/AggregateRoot.ts
// core/infrastructure/database/DatabaseConnection.ts
// core/infrastructure/logging/Logger.ts

// Step 3: Create DI container
// bootstrap/dependency-injection.ts

// Step 4: Update server.ts to use new bootstrap
import { bootstrap } from './bootstrap/app.bootstrap';
const app = await bootstrap();
```

### **7.2 Phase 2: First Module Migration (Weeks 3-4)**

**Migrate Risk Management module as proof of concept:**

```bash
# Create new module structure
mkdir -p src/modules/risk-management/{domain,application,infrastructure,presentation}

# Create domain layer
# - Move risk business logic to domain/entities/Risk.ts
# - Create value objects (RiskScore, RiskStatus, etc.)
# - Define repository interface

# Create application layer
# - Implement command handlers
# - Implement query handlers
# - Create DTOs

# Create infrastructure layer
# - Implement repository
# - Create mapper

# Create presentation layer
# - Create new controller (thin, delegates to command/query handlers)
# - Keep old route file for backwards compatibility (proxies to new controller)

# Update module registry
# config/modules.config.ts
```

### **7.3 Phase 3: Gradual Module Migration (Weeks 5-12)**

**Migrate one module at a time, maintaining backward compatibility:**

```typescript
// Strategy: Adapter Pattern for backwards compatibility

// OLD CODE (keep for now)
// src/routes/risk-routes-aria5.ts
import { createRiskRoutesARIA5 } from './routes/risk-routes-aria5';
app.route('/risk', createRiskRoutesARIA5());

// NEW CODE (modern architecture)
// src/modules/risk-management/presentation/http/RiskController.ts
export class RiskController {
  constructor(
    private readonly createRiskHandler: CreateRiskCommandHandler,
    private readonly getRiskHandler: GetRiskByIdQueryHandler
  ) {}
  
  async create(req: Request): Promise<Response> {
    const command = new CreateRiskCommand(req.body);
    const riskId = await this.createRiskHandler.handle(command);
    return { status: 201, body: { id: riskId } };
  }
}

// ADAPTER (bridges old and new)
// src/routes/adapters/RiskRouteAdapter.ts
export function createRiskRoutesAdapter() {
  const controller = container.resolve<RiskController>('RiskController');
  
  return new Hono()
    .post('/create', async (c) => {
      const response = await controller.create(c.req);
      return c.json(response.body, response.status);
    })
    .get('/:id', async (c) => {
      const response = await controller.getById(c.req);
      return c.json(response.body, response.status);
    });
}
```

### **7.4 Phase 4: Plugin System (Weeks 13-14)**

**Implement plugin architecture for future extensibility:**

```typescript
// Enable plugins in config
// config/plugins.config.ts
export const pluginConfig = {
  enabled: true,
  autoload: true,
  pluginDirectory: './plugins/installed-plugins'
};

// Initialize plugin manager in bootstrap
// bootstrap/app.bootstrap.ts
const pluginManager = new PluginManager(pluginRegistry, context);
await pluginManager.loadPlugins();
```

### **7.5 Phase 5: New Features as Modules (Weeks 15+)**

**Build all new features as independent modules:**

```typescript
// Example: New Vendor Management module
src/modules/vendor-management/
├── domain/
│   ├── entities/
│   │   ├── Vendor.ts
│   │   ├── VendorAssessment.ts
│   │   └── VendorContract.ts
│   ├── value-objects/
│   │   └── VendorTier.ts
│   └── repositories/
│       └── IVendorRepository.ts
├── application/
│   ├── commands/
│   │   └── CreateVendorCommand.ts
│   └── queries/
│       └── GetVendorQuery.ts
├── infrastructure/
│   ├── repositories/
│   │   └── VendorRepository.ts
│   └── persistence/
│       └── migrations/
│           └── 001_create_vendors.sql
├── presentation/
│   └── http/
│       └── VendorController.ts
└── index.ts

// Register in module config
// config/modules.config.ts
export const modules = [
  RiskManagementModule,
  ComplianceModule,
  VendorManagementModule  // NEW MODULE
];
```

---

## 8. Testing Strategy

### **8.1 Test Structure per Module**

```typescript
// modules/risk-management/tests/

// Unit Tests (Domain Layer)
tests/unit/entities/Risk.test.ts
tests/unit/value-objects/RiskScore.test.ts
tests/unit/services/RiskScoringService.test.ts

// Integration Tests (Application Layer)
tests/integration/commands/CreateRiskHandler.test.ts
tests/integration/queries/GetRiskHandler.test.ts
tests/integration/repositories/RiskRepository.test.ts

// E2E Tests (Full stack)
tests/e2e/risk-creation-workflow.test.ts
tests/e2e/risk-api-endpoints.test.ts
```

### **8.2 Test Example**

```typescript
// modules/risk-management/tests/unit/entities/Risk.test.ts
describe('Risk Entity', () => {
  describe('create', () => {
    it('should create a valid risk with calculated score', () => {
      const risk = Risk.create({
        title: 'Data Breach Risk',
        description: 'Unauthorized data access',
        category: RiskCategory.Cybersecurity,
        probability: RiskProbability.High,
        impact: RiskImpact.Critical,
        ownerId: 'user-123'
      });
      
      expect(risk.score.value).toBe(15); // 5 * 3
      expect(risk.status.value).toBe('active');
      expect(risk.getDomainEvents()).toHaveLength(1);
      expect(risk.getDomainEvents()[0]).toBeInstanceOf(RiskCreatedEvent);
    });
    
    it('should throw validation error for invalid probability', () => {
      expect(() => {
        Risk.create({
          title: 'Test Risk',
          probability: RiskProbability.fromValue(6) // Invalid
        });
      }).toThrow(ValidationException);
    });
  });
});

// modules/risk-management/tests/integration/commands/CreateRiskHandler.test.ts
describe('CreateRiskCommandHandler', () => {
  let handler: CreateRiskCommandHandler;
  let mockRepository: jest.Mocked<IRiskRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  
  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn()
    } as any;
    
    mockEventBus = {
      publish: jest.fn()
    } as any;
    
    handler = new CreateRiskCommandHandler(
      mockRepository,
      mockEventBus,
      new Logger()
    );
  });
  
  it('should create risk and publish event', async () => {
    const command = new CreateRiskCommand(
      'Test Risk',
      'Test description',
      'cybersecurity',
      3,
      4,
      'owner-123',
      'user-123'
    );
    
    const riskId = await handler.handle(command);
    
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'risk.created',
        riskId: expect.any(String)
      })
    );
  });
});
```

---

## 9. Benefits of Modular Architecture

### **9.1 Maintainability** ✅
- **Single Responsibility**: Each module has one clear purpose
- **Smaller Files**: No more 237KB files, typical files are 50-200 lines
- **Clear Boundaries**: Know exactly where to add new code
- **Independent Testing**: Test modules in isolation

### **9.2 Scalability** ✅
- **Team Scalability**: Multiple teams can work on different modules
- **Code Scalability**: Add features without touching core code
- **Performance Scalability**: Modules can be optimized independently
- **Deployment Scalability**: Future microservices split is easier

### **9.3 Flexibility** ✅
- **Plugin System**: Add features without modifying source
- **Database Flexibility**: Repository pattern allows DB switching
- **Framework Flexibility**: Clean architecture allows framework changes
- **Event-Driven**: Loose coupling enables easy integration

### **9.4 Testability** ✅
- **Unit Testing**: Test pure business logic without infrastructure
- **Integration Testing**: Test module interactions in isolation
- **Mocking**: Easy to mock dependencies via interfaces
- **E2E Testing**: Test complete workflows without side effects

### **9.5 Future-Proof** ✅
- **Add New Modules**: Create new feature modules without impacting existing
- **Replace Modules**: Swap implementations without breaking contracts
- **Upgrade Modules**: Update one module's internal implementation safely
- **Remove Modules**: Disable/remove modules without affecting others

---

## 10. Implementation Checklist

### **Phase 1: Foundation** (Weeks 1-2)
- [ ] Create core directory structure
- [ ] Implement base entity classes
- [ ] Create repository interfaces
- [ ] Implement DI container
- [ ] Create event bus
- [ ] Set up logger infrastructure
- [ ] Create module interface and loader

### **Phase 2: First Module (Risk Management)** (Weeks 3-4)
- [ ] Create Risk entity and value objects
- [ ] Implement risk repository
- [ ] Create command handlers (CQRS)
- [ ] Create query handlers (CQRS)
- [ ] Build risk controller
- [ ] Create adapter for old routes
- [ ] Write unit tests
- [ ] Write integration tests

### **Phase 3: Additional Core Modules** (Weeks 5-8)
- [ ] Migrate Compliance module
- [ ] Migrate Asset Management module
- [ ] Migrate Incident Management module
- [ ] Update inter-module dependencies to use events

### **Phase 4: Plugin System** (Weeks 9-10)
- [ ] Implement plugin manager
- [ ] Create plugin registry
- [ ] Build plugin loader
- [ ] Create example plugin
- [ ] Document plugin API

### **Phase 5: New Features** (Weeks 11+)
- [ ] Build Vendor Management as new module
- [ ] Build Policy Management as new module
- [ ] Build BC/DR as new module
- [ ] Document module creation guide

---

## 11. Development Guidelines

### **11.1 Naming Conventions**

```typescript
// Entities: PascalCase, singular noun
class Risk extends AggregateRoot {}
class VendorAssessment extends Entity {}

// Value Objects: PascalCase, descriptive noun
class RiskScore extends ValueObject {}
class EmailAddress extends ValueObject {}

// Services: PascalCase, ends with "Service"
class RiskScoringService {}
class EmailNotificationService {}

// Commands: PascalCase, imperative verb
class CreateRiskCommand {}
class UpdateVendorCommand {}

// Queries: PascalCase, descriptive question
class GetRiskByIdQuery {}
class ListActiveRisksQuery {}

// Events: PascalCase, past tense
class RiskCreatedEvent {}
class VendorAssessmentCompletedEvent {}

// Repositories: PascalCase, entity name + "Repository"
class RiskRepository implements IRiskRepository {}

// Interfaces: PascalCase, starts with "I"
interface IRiskRepository {}
interface IEventBus {}
```

### **11.2 File Organization**

```typescript
// One class per file
// File name matches class name

// ✅ GOOD
// modules/risk-management/domain/entities/Risk.ts
export class Risk extends AggregateRoot {}

// ❌ BAD
// modules/risk-management/domain/entities.ts
export class Risk {}
export class RiskTreatment {}
export class KeyRiskIndicator {}
```

### **11.3 Dependency Rules**

```typescript
// Dependencies flow INWARD only

// ✅ GOOD - Presentation depends on Application
import { CreateRiskCommand } from '../application/commands/CreateRiskCommand';

// ❌ BAD - Application depends on Presentation
import { RiskController } from '../presentation/http/RiskController';

// ✅ GOOD - Infrastructure depends on Domain
import { IRiskRepository } from '../domain/repositories/IRiskRepository';

// ❌ BAD - Domain depends on Infrastructure
import { RiskRepository } from '../infrastructure/repositories/RiskRepository';
```

---

## 12. Documentation Requirements

### **12.1 Module Documentation**

Each module must have:

```markdown
# Risk Management Module

## Overview
Handles risk identification, assessment, treatment, and monitoring.

## Domain Concepts
- **Risk**: An event or condition that may impact objectives
- **Risk Score**: Calculated as Probability × Impact
- **Risk Treatment**: Actions to mitigate or accept risks

## API Endpoints
- `POST /api/v1/risks` - Create new risk
- `GET /api/v1/risks/:id` - Get risk by ID
- `PUT /api/v1/risks/:id` - Update risk
- `DELETE /api/v1/risks/:id` - Delete risk

## Events Published
- `risk.created` - When a new risk is created
- `risk.updated` - When a risk is updated
- `risk.deleted` - When a risk is deleted

## Events Subscribed
- `incident.reported` - Create risk from incident
- `vulnerability.detected` - Assess risk from vulnerability

## Dependencies
- `audit-logging` - For audit trail
- `user-management` - For ownership assignment

## Database Tables
- `risks`
- `risk_treatments`
- `key_risk_indicators`
```

### **12.2 API Documentation**

```typescript
/**
 * Create a new risk in the system
 * 
 * @route POST /api/v1/risks
 * @group Risk Management - Risk operations
 * @param {CreateRiskDTO} request.body.required - Risk details
 * @returns {RiskResponseDTO} 201 - Risk created successfully
 * @returns {ValidationError} 400 - Invalid input
 * @returns {UnauthorizedError} 401 - Authentication required
 * @security Bearer
 * 
 * @example request
 * {
 *   "title": "Data Breach Risk",
 *   "description": "Unauthorized data access",
 *   "category": "cybersecurity",
 *   "probability": 4,
 *   "impact": 5,
 *   "ownerId": "user-123"
 * }
 * 
 * @example response - 201
 * {
 *   "id": "risk-456",
 *   "title": "Data Breach Risk",
 *   "score": 20,
 *   "status": "active",
 *   "createdAt": "2025-10-21T10:00:00Z"
 * }
 */
async create(request: Request): Promise<Response> {
  // Implementation
}
```

---

## Conclusion

This modular architecture transforms ARIA5.1 from a **monolithic codebase** into a **scalable, maintainable, and extensible platform**. The architecture supports:

✅ **Adding new features** without modifying existing code  
✅ **Testing in isolation** with clear module boundaries  
✅ **Team scalability** with independent module development  
✅ **Plugin extensibility** for custom features  
✅ **Future migration** to microservices if needed  
✅ **Technology flexibility** through abstraction layers  

**Estimated Migration Time**: 10-14 weeks for full transformation  
**Recommended Approach**: Gradual migration, one module at a time, maintaining backwards compatibility

---

**Document Prepared By**: Architecture Review Team  
**Review Date**: October 21, 2025  
**Next Review**: After Phase 1 completion
