/**
 * TreatmentMapper - Maps between RiskTreatment entity and database records
 */

import { RiskTreatment, TreatmentProps, TreatmentType, TreatmentStatus } from '../../core/entities/RiskTreatment';

export interface TreatmentDBRecord {
  id: number;
  risk_id: number;
  title: string;
  description: string;
  treatment_type: string;
  status: string;
  owner_id: number;
  estimated_cost: number | null;
  actual_cost: number | null;
  target_date: string | null;
  completed_date: string | null;
  priority: number;
  effectiveness: number | null;
  created_at: string;
  updated_at: string;
}

export class TreatmentMapper {
  /**
   * Convert database record to RiskTreatment entity
   */
  static toDomain(raw: TreatmentDBRecord): RiskTreatment {
    const props: TreatmentProps = {
      id: raw.id,
      riskId: raw.risk_id,
      title: raw.title,
      description: raw.description,
      treatmentType: raw.treatment_type as TreatmentType,
      status: raw.status as TreatmentStatus,
      ownerId: raw.owner_id,
      estimatedCost: raw.estimated_cost ?? undefined,
      actualCost: raw.actual_cost ?? undefined,
      targetDate: raw.target_date ? new Date(raw.target_date) : undefined,
      completedDate: raw.completed_date ? new Date(raw.completed_date) : undefined,
      priority: raw.priority,
      effectiveness: raw.effectiveness ?? undefined,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

    return RiskTreatment.reconstitute(props);
  }

  /**
   * Convert array to domain entities
   */
  static toDomainList(records: TreatmentDBRecord[]): RiskTreatment[] {
    return records.map(record => this.toDomain(record));
  }

  /**
   * Convert entity to database record
   */
  static toPersistence(treatment: RiskTreatment): Omit<TreatmentDBRecord, 'created_at' | 'updated_at'> {
    return {
      id: treatment.id,
      risk_id: treatment.riskId,
      title: treatment.title,
      description: treatment.description,
      treatment_type: treatment.treatmentType,
      status: treatment.status,
      owner_id: treatment.ownerId,
      estimated_cost: treatment.estimatedCost ?? null,
      actual_cost: treatment.actualCost ?? null,
      target_date: treatment.targetDate?.toISOString() ?? null,
      completed_date: treatment.completedDate?.toISOString() ?? null,
      priority: treatment.priority,
      effectiveness: treatment.effectiveness ?? null
    };
  }

  /**
   * Create insert data (without id)
   */
  static toInsertData(treatment: RiskTreatment): Omit<TreatmentDBRecord, 'id' | 'created_at' | 'updated_at'> {
    const persistence = this.toPersistence(treatment);
    const { id, ...insertData } = persistence;
    return insertData;
  }
}
