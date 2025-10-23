/**
 * Domain Events - Barrel Export
 * Central export point for all risk domain events
 */

export { RiskCreatedEvent, type RiskCreatedPayload } from './RiskCreatedEvent';
export { RiskUpdatedEvent, type RiskUpdatedPayload } from './RiskUpdatedEvent';
export { RiskStatusChangedEvent, type RiskStatusChangedPayload } from './RiskStatusChangedEvent';
export { RiskDeletedEvent, type RiskDeletedPayload } from './RiskDeletedEvent';
