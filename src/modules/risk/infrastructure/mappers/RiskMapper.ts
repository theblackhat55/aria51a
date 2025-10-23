/**
 * RiskMapper
 * Maps between Risk domain entity and database representation
 * Handles conversion of value objects and timestamps
 */

import { Risk, RiskScore, RiskStatus, RiskCategory } from '../../domain';

/**
 * Database row interface matching the risks table schema
 */
export interface RiskDbRow {
  id: number;
  risk_id: string;
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  risk_score: number;
  status: string;
  organization_id: number;
  owner_id: number;
  created_by: number;
  risk_type: string;
  mitigation_plan?: string;
  contingency_plan?: string;
  review_date?: string;
  last_review_date?: string;
  tags?: string; // JSON string
  metadata?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export class RiskMapper {
  /**
   * Convert database row to Risk domain entity
   */
  static toEntity(row: RiskDbRow): Risk {
    // Parse value objects
    const category = RiskCategory.create(row.category);
    const score = RiskScore.create(row.probability, row.impact);
    const status = RiskStatus.create(row.status);

    // Parse optional fields
    const reviewDate = row.review_date ? new Date(row.review_date) : undefined;
    const lastReviewDate = row.last_review_date ? new Date(row.last_review_date) : undefined;
    const tags = row.tags ? JSON.parse(row.tags) : [];
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};

    // Reconstitute entity with timestamps
    const risk = Risk.reconstitute(
      row.id,
      {
        riskId: row.risk_id,
        title: row.title,
        description: row.description,
        category,
        score,
        status,
        organizationId: row.organization_id,
        ownerId: row.owner_id,
        createdBy: row.created_by,
        riskType: row.risk_type,
        mitigationPlan: row.mitigation_plan,
        contingencyPlan: row.contingency_plan,
        reviewDate,
        lastReviewDate,
        tags,
        metadata
      },
      new Date(row.created_at),
      new Date(row.updated_at)
    );

    return risk;
  }

  /**
   * Convert Risk domain entity to database row
   */
  static toPersistence(risk: Risk): Omit<RiskDbRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      risk_id: risk.riskId,
      title: risk.title,
      description: risk.description,
      category: risk.category.value,
      probability: risk.score.probability,
      impact: risk.score.impact,
      risk_score: risk.score.score,
      status: risk.status.value,
      organization_id: risk.organizationId,
      owner_id: risk.ownerId,
      created_by: risk.createdBy,
      risk_type: risk.riskType,
      mitigation_plan: risk.mitigationPlan,
      contingency_plan: risk.contingencyPlan,
      review_date: risk.reviewDate?.toISOString(),
      last_review_date: risk.lastReviewDate?.toISOString(),
      tags: risk.tags.length > 0 ? JSON.stringify(risk.tags) : null,
      metadata: Object.keys(risk.metadata).length > 0 ? JSON.stringify(risk.metadata) : null
    };
  }

  /**
   * Convert multiple database rows to Risk entities
   */
  static toEntityList(rows: RiskDbRow[]): Risk[] {
    return rows.map(row => this.toEntity(row));
  }

  /**
   * Create a new database row for insertion
   */
  static toInsert(risk: Risk): Omit<RiskDbRow, 'id'> {
    const persistence = this.toPersistence(risk);
    return {
      ...persistence,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Create update data for existing record
   */
  static toUpdate(risk: Risk): Omit<RiskDbRow, 'id' | 'created_at'> {
    const persistence = this.toPersistence(risk);
    return {
      ...persistence,
      updated_at: new Date().toISOString()
    };
  }
}
