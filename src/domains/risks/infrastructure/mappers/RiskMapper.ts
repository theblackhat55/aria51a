/**
 * RiskMapper - Maps between Risk domain entity and database records
 * 
 * Handles the transformation between domain objects and persistence layer
 */

import { Risk, RiskProps } from '../../core/entities/Risk';

export interface RiskDBRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  probability: number;
  impact: number;
  status: string;
  owner_id: number;
  organization_id: number;
  inherent_risk: number | null;
  residual_risk: number | null;
  source: string | null;
  affected_assets: string | null;
  review_date: string | null;
  due_date: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export class RiskMapper {
  /**
   * Convert database record to Risk domain entity
   */
  static toDomain(raw: RiskDBRecord): Risk {
    const props: RiskProps = {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      category: raw.category,
      subcategory: raw.subcategory ?? undefined,
      probability: raw.probability,
      impact: raw.impact,
      status: raw.status,
      ownerId: raw.owner_id,
      organizationId: raw.organization_id,
      inherentRisk: raw.inherent_risk ?? undefined,
      residualRisk: raw.residual_risk ?? undefined,
      source: raw.source ?? undefined,
      affectedAssets: raw.affected_assets ?? undefined,
      reviewDate: raw.review_date ? new Date(raw.review_date) : undefined,
      dueDate: raw.due_date ? new Date(raw.due_date) : undefined,
      createdBy: raw.created_by ?? undefined,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

    return Risk.reconstitute(props);
  }

  /**
   * Convert array of database records to Risk domain entities
   */
  static toDomainList(records: RiskDBRecord[]): Risk[] {
    return records.map(record => this.toDomain(record));
  }

  /**
   * Convert Risk domain entity to database record
   */
  static toPersistence(risk: Risk): Omit<RiskDBRecord, 'created_at' | 'updated_at'> {
    return {
      id: risk.id,
      title: risk.title,
      description: risk.description,
      category: risk.category,
      subcategory: risk.subcategory ?? null,
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status.value,
      owner_id: risk.ownerId,
      organization_id: risk.organizationId,
      inherent_risk: risk.inherentRisk ?? null,
      residual_risk: risk.residualRisk ?? null,
      source: risk.source ?? null,
      affected_assets: risk.affectedAssets ?? null,
      review_date: risk.reviewDate?.toISOString() ?? null,
      due_date: risk.dueDate?.toISOString() ?? null,
      created_by: risk.createdBy ?? null
    };
  }

  /**
   * Create insert data for new risk (without id)
   */
  static toInsertData(risk: Risk): Omit<RiskDBRecord, 'id' | 'created_at' | 'updated_at'> {
    const persistence = this.toPersistence(risk);
    const { id, ...insertData } = persistence;
    return insertData;
  }

  /**
   * Create update data (only changed fields)
   */
  static toUpdateData(risk: Risk): Partial<Omit<RiskDBRecord, 'id' | 'organization_id' | 'created_at' | 'updated_at'>> {
    const persistence = this.toPersistence(risk);
    const { id, organization_id, ...updateData } = persistence;
    return updateData;
  }
}
