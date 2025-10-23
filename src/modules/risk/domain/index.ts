/**
 * Domain Layer - Barrel Export
 * Central export point for all domain components
 */

// Entities
export { Risk, type RiskProps } from './entities/Risk';

// Value Objects
export { RiskScore } from './value-objects/RiskScore';
export { RiskStatus, type RiskStatusType } from './value-objects/RiskStatus';
export { RiskCategory, type RiskCategoryType } from './value-objects/RiskCategory';

// Events
export {
  RiskCreatedEvent,
  RiskUpdatedEvent,
  RiskStatusChangedEvent,
  RiskDeletedEvent,
  type RiskCreatedPayload,
  type RiskUpdatedPayload,
  type RiskStatusChangedPayload,
  type RiskDeletedPayload
} from './events';

// Repositories
export {
  type IRiskRepository,
  type RiskListFilters,
  type RiskListSort,
  type PaginationOptions,
  type PaginatedResult,
  type RiskStatistics
} from './repositories/IRiskRepository';
