/**
 * UpdateIncidentCommand
 * 
 * Command to update an existing incident.
 */

import { Command } from '../../../../shared/application/Command';
import { IncidentSeverity } from '../../core/value-objects/IncidentSeverity';
import { IncidentStatus } from '../../core/value-objects/IncidentStatus';
import { IncidentCategory } from '../../core/value-objects/IncidentCategory';
import { ImpactLevel } from '../../core/value-objects/ImpactLevel';

export interface UpdateIncidentPayload {
  id: number;
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  impact?: ImpactLevel;
  assignedTo?: number;
  affectedSystems?: string[];
  affectedUsers?: number;
  estimatedCost?: number;
  actualCost?: number;
  dataCompromised?: boolean;
  rootCause?: string;
  lessonsLearned?: string;
  remediationSteps?: string[];
  relatedRisks?: number[];
  relatedAssets?: string[];
  organizationId: number;
}

export class UpdateIncidentCommand extends Command<UpdateIncidentPayload> {
  constructor(payload: UpdateIncidentPayload) {
    super(payload);
  }
}
