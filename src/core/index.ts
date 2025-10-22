/**
 * Core Module - Exports all core functionality
 * Single entry point for importing core features
 */

// Domain Entities
export { BaseEntity } from './domain/entities/BaseEntity';
export { AggregateRoot } from './domain/entities/AggregateRoot';
export { ValueObject } from './domain/entities/ValueObject';

// Domain Events
export { DomainEvent, IDomainEvent } from './domain/events/DomainEvent';
export { EventBus } from './domain/events/EventBus';
export { IEventHandler } from './domain/events/IEventHandler';

// Domain Exceptions
export { DomainException } from './domain/exceptions/DomainException';
export { ValidationException, ValidationError } from './domain/exceptions/ValidationException';
export { NotFoundException } from './domain/exceptions/NotFoundException';

// Application Interfaces
export { IRepository } from './application/interfaces/IRepository';
export { IUnitOfWork } from './application/interfaces/IUnitOfWork';
export { IEventBus } from './application/interfaces/IEventBus';
export { ILogger, LogLevel, LogContext } from './application/interfaces/ILogger';

// Application DTOs
export { 
  PaginationDTO, 
  PaginationRequest, 
  PaginationResponse 
} from './application/dto/PaginationDTO';
export { 
  ResponseDTO, 
  ApiResponse, 
  ErrorDetail, 
  ResponseMeta 
} from './application/dto/ResponseDTO';

// Infrastructure
export { 
  DatabaseConnection, 
  D1DatabaseConnection, 
  QueryResult 
} from './infrastructure/database/DatabaseConnection';
export { ConsoleLogger } from './infrastructure/logging/ConsoleLogger';
export { DependencyContainer } from './infrastructure/DependencyContainer';
