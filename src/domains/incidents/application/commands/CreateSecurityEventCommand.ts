/**
 * CreateSecurityEventCommand
 * 
 * Command to create a new security event.
 */

import { Command } from '../../../../shared/application/Command';
import { EventSeverity } from '../../core/value-objects/EventSeverity';
import { EventSource } from '../../core/value-objects/EventSource';

export interface CreateSecurityEventPayload {
  eventType: string;
  severity: EventSeverity;
  source: EventSource;
  sourceSystem?: string;
  sourceIp?: string;
  destinationIp?: string;
  sourcePort?: number;
  destinationPort?: number;
  protocol?: string;
  userId?: number;
  assetId?: string;
  assetName?: string;
  description: string;
  rawLog?: string;
  detectedAt: Date;
  signature?: string;
  confidence?: number;
  incidentId?: number;
  metadata?: Record<string, any>;
  hash?: string;
  organizationId: number;
}

export class CreateSecurityEventCommand extends Command<CreateSecurityEventPayload> {
  constructor(payload: CreateSecurityEventPayload) {
    super(payload);
  }
}
