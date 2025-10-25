/**
 * UpdateSecurityEventCommand
 * 
 * Command to update an existing security event.
 * Follows CQRS pattern for write operations.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { Command } from '../../../../shared/application/Command';
import { EventSeverity } from '../../core/value-objects/EventSeverity';

export interface UpdateSecurityEventPayload {
  id: number;
  severity?: EventSeverity;
  description?: string;
  confidence?: number;
  falsePositive?: boolean;
  incidentId?: number;
  correlatedEvents?: number[];
  metadata?: Record<string, any>;
  organizationId: number;
}

export class UpdateSecurityEventCommand extends Command<UpdateSecurityEventPayload> {
  constructor(payload: UpdateSecurityEventPayload) {
    super(payload);
  }
}
