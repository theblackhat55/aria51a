/**
 * D1TreatmentRepository - D1 implementation of ITreatmentRepository
 */

import { ITreatmentRepository } from '../../core/repositories/ITreatmentRepository';
import { RiskTreatment, TreatmentStatus } from '../../core/entities/RiskTreatment';
import { TreatmentMapper, TreatmentDBRecord } from '../mappers/TreatmentMapper';

export class D1TreatmentRepository implements ITreatmentRepository {
  constructor(private db: D1Database) {}

  async findById(id: number): Promise<RiskTreatment | null> {
    const result = await this.db
      .prepare('SELECT * FROM risk_treatments WHERE id = ?')
      .bind(id)
      .first<TreatmentDBRecord>();

    return result ? TreatmentMapper.toDomain(result) : null;
  }

  async findByRisk(riskId: number): Promise<RiskTreatment[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risk_treatments 
         WHERE risk_id = ?
         ORDER BY created_at DESC`
      )
      .bind(riskId)
      .all<TreatmentDBRecord>();

    return TreatmentMapper.toDomainList(results);
  }

  async findByStatus(status: TreatmentStatus): Promise<RiskTreatment[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risk_treatments 
         WHERE status = ?
         ORDER BY created_at DESC`
      )
      .bind(status)
      .all<TreatmentDBRecord>();

    return TreatmentMapper.toDomainList(results);
  }

  async findByOwner(ownerId: number): Promise<RiskTreatment[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risk_treatments 
         WHERE owner_id = ?
         ORDER BY created_at DESC`
      )
      .bind(ownerId)
      .all<TreatmentDBRecord>();

    return TreatmentMapper.toDomainList(results);
  }

  async findOverdue(): Promise<RiskTreatment[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risk_treatments 
         WHERE target_date < datetime('now')
         AND status IN ('planned', 'in_progress')
         ORDER BY target_date ASC`
      )
      .all<TreatmentDBRecord>();

    return TreatmentMapper.toDomainList(results);
  }

  async save(treatment: RiskTreatment): Promise<RiskTreatment> {
    const insertData = TreatmentMapper.toInsertData(treatment);

    const result = await this.db
      .prepare(
        `INSERT INTO risk_treatments (
          risk_id, title, description, treatment_type, status, owner_id,
          estimated_cost, actual_cost, target_date, completed_date,
          priority, effectiveness, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING *`
      )
      .bind(
        insertData.risk_id,
        insertData.title,
        insertData.description,
        insertData.treatment_type,
        insertData.status,
        insertData.owner_id,
        insertData.estimated_cost,
        insertData.actual_cost,
        insertData.target_date,
        insertData.completed_date,
        insertData.priority,
        insertData.effectiveness
      )
      .first<TreatmentDBRecord>();

    if (!result) {
      throw new Error('Failed to create treatment');
    }

    return TreatmentMapper.toDomain(result);
  }

  async update(treatment: RiskTreatment): Promise<RiskTreatment> {
    const updateData = TreatmentMapper.toPersistence(treatment);

    const result = await this.db
      .prepare(
        `UPDATE risk_treatments SET
          title = ?, description = ?, treatment_type = ?, status = ?,
          owner_id = ?, estimated_cost = ?, actual_cost = ?,
          target_date = ?, completed_date = ?, priority = ?,
          effectiveness = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`
      )
      .bind(
        updateData.title,
        updateData.description,
        updateData.treatment_type,
        updateData.status,
        updateData.owner_id,
        updateData.estimated_cost,
        updateData.actual_cost,
        updateData.target_date,
        updateData.completed_date,
        updateData.priority,
        updateData.effectiveness,
        treatment.id
      )
      .first<TreatmentDBRecord>();

    if (!result) {
      throw new Error(`Failed to update treatment: ${treatment.id}`);
    }

    return TreatmentMapper.toDomain(result);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM risk_treatments WHERE id = ?')
      .bind(id)
      .run();
  }

  async countByRisk(riskId: number): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM risk_treatments 
         WHERE risk_id = ?`
      )
      .bind(riskId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    // Total count
    const totalResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM risk_treatments')
      .first<{ count: number }>();

    const total = totalResult?.count ?? 0;

    // By status
    const statusResults = await this.db
      .prepare(
        `SELECT status, COUNT(*) as count 
         FROM risk_treatments 
         GROUP BY status`
      )
      .all<{ status: string; count: number }>();

    const byStatus: Record<string, number> = {};
    statusResults.results.forEach(row => {
      byStatus[row.status] = row.count;
    });

    // By type
    const typeResults = await this.db
      .prepare(
        `SELECT treatment_type, COUNT(*) as count 
         FROM risk_treatments 
         GROUP BY treatment_type`
      )
      .all<{ treatment_type: string; count: number }>();

    const byType: Record<string, number> = {};
    typeResults.results.forEach(row => {
      byType[row.treatment_type] = row.count;
    });

    return {
      total,
      byStatus,
      byType
    };
  }
}
