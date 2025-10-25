/**
 * CreateIncidentCommand
 * 
 * Command to create a new incident in the system.
 */

import { Command } from '../../../../shared/application/Command';
import { IncidentSeverity } from '../../core/value-objects/IncidentSeverity';
import { IncidentStatus } from '../../core/value-objects/IncidentStatus';
import { IncidentCategory } from '../../core/value-objects/IncidentCategory';
import { ImpactLevel } from '../../core/value-objects/ImpactLevel';

export interface CreateIncidentPayload {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  impact: ImpactLevel;
  detectedAt: Date;
  detectedBy: number; // userId
  assignedTo?: number; // userId
  affectedSystems?: string[];
  affectedUsers?: number;
  estimatedCost?: number;
  dataCompromised?: boolean;
  organizationId: number;
}

export class CreateIncidentCommand extends Command<CreateIncidentPayload> {
  constructor(payload: CreateIncidentPayload) {
    super(payload);
  }
}
