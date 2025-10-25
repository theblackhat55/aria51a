/**
 * TreatmentDTO - Data Transfer Object for RiskTreatment entity
 */

import { RiskTreatment } from '../../core/entities/RiskTreatment';

export interface TreatmentDTO {
  id: number;
  riskId: number;
  title: string;
  description: string;
  treatmentType: string;
  status: string;
  ownerId: number;
  estimatedCost?: number;
  actualCost?: number;
  targetDate?: string;
  completedDate?: string;
  priority: number;
  effectiveness?: number;
  isOverdue: boolean;
  daysUntilTarget: number | null;
  costVariance: number | null;
  createdAt: string;
  updatedAt: string;
}

export class TreatmentDTOMapper {
  static toDTO(treatment: RiskTreatment): TreatmentDTO {
    return treatment.toJSON() as TreatmentDTO;
  }

  static toDTOList(treatments: RiskTreatment[]): TreatmentDTO[] {
    return treatments.map(t => this.toDTO(t));
  }
}
