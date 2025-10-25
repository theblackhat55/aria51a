/**
 * Risk Domain - Main exports
 * 
 * Central export point for the Risk domain module
 */

// Core - Entities
export { Risk, CreateRiskProps, RiskProps } from './core/entities/Risk';
export { RiskTreatment, TreatmentType, TreatmentStatus } from './core/entities/RiskTreatment';

// Core - Value Objects
export { RiskScore, RiskSeverity } from './core/value-objects/RiskScore';
export { RiskStatus, RiskStatusVO } from './core/value-objects/RiskStatus';

// Core - Repositories
export { IRiskRepository, ListRisksOptions } from './core/repositories/IRiskRepository';
export { ITreatmentRepository } from './core/repositories/ITreatmentRepository';

// Core - Services
export { RiskScoringService, ScoringContext, ScoringResult } from './core/services/RiskScoringService';
export { RiskDomainService, RiskWithTreatments } from './core/services/RiskDomainService';

// Application - Commands
export { CreateRiskCommand, CreateRiskCommandPayload } from './application/commands/CreateRiskCommand';
export { UpdateRiskCommand, UpdateRiskCommandPayload } from './application/commands/UpdateRiskCommand';
export { DeleteRiskCommand, DeleteRiskCommandPayload } from './application/commands/DeleteRiskCommand';
export { UpdateRiskStatusCommand, UpdateRiskStatusCommandPayload } from './application/commands/UpdateRiskStatusCommand';

// Application - Queries
export { GetRiskByIdQuery, GetRiskByIdQueryPayload } from './application/queries/GetRiskByIdQuery';
export { ListRisksQuery, ListRisksQueryPayload } from './application/queries/ListRisksQuery';
export { SearchRisksQuery, SearchRisksQueryPayload } from './application/queries/SearchRisksQuery';
export { GetRiskStatisticsQuery, GetRiskStatisticsQueryPayload } from './application/queries/GetRiskStatisticsQuery';

// Application - Handlers
export { CreateRiskHandler } from './application/handlers/CreateRiskHandler';
export { UpdateRiskHandler } from './application/handlers/UpdateRiskHandler';
export { DeleteRiskHandler } from './application/handlers/DeleteRiskHandler';
export { GetRiskByIdHandler } from './application/handlers/GetRiskByIdHandler';
export { ListRisksHandler } from './application/handlers/ListRisksHandler';
export { GetRiskStatisticsHandler } from './application/handlers/GetRiskStatisticsHandler';

// Application - DTOs
export { RiskDTO, RiskListDTO, RiskStatisticsDTO, RiskDTOMapper } from './application/dto/RiskDTO';
export { TreatmentDTO, TreatmentDTOMapper } from './application/dto/TreatmentDTO';

// Infrastructure - Repositories
export { D1RiskRepository } from './infrastructure/persistence/D1RiskRepository';
export { D1TreatmentRepository } from './infrastructure/persistence/D1TreatmentRepository';

// Infrastructure - Mappers
export { RiskMapper, RiskDBRecord } from './infrastructure/mappers/RiskMapper';
export { TreatmentMapper, TreatmentDBRecord } from './infrastructure/mappers/TreatmentMapper';
