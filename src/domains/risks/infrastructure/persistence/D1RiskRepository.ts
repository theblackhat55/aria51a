/**
 * D1RiskRepository - Cloudflare D1 implementation of IRiskRepository
 * 
 * Handles all database operations for Risk aggregate
 */

import { IRiskRepository, ListRisksOptions } from '../../core/repositories/IRiskRepository';
import { Risk } from '../../core/entities/Risk';
import { RiskStatus } from '../../core/value-objects/RiskStatus';
import { RiskMapper, RiskDBRecord } from '../mappers/RiskMapper';

export class D1RiskRepository implements IRiskRepository {
  constructor(private db: D1Database) {}

  async findById(id: number, organizationId: number): Promise<Risk | null> {
    const result = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE id = ? AND organization_id = ?`
      )
      .bind(id, organizationId)
      .first<RiskDBRecord>();

    return result ? RiskMapper.toDomain(result) : null;
  }

  async findByOrganization(organizationId: number): Promise<Risk[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ?
         ORDER BY created_at DESC`
      )
      .bind(organizationId)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async list(options: ListRisksOptions): Promise<{ risks: Risk[]; total: number }> {
    // Build WHERE clauses
    const conditions: string[] = ['organization_id = ?'];
    const params: any[] = [options.organizationId];

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }

    if (options.ownerId) {
      conditions.push('owner_id = ?');
      params.push(options.ownerId);
    }

    if (options.searchQuery) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const searchPattern = `%${options.searchQuery}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM risks WHERE ${whereClause}`;
    const countResult = await this.db
      .prepare(countQuery)
      .bind(...params)
      .first<{ count: number }>();

    const total = countResult?.count ?? 0;

    // Get paginated results
    const sortBy = options.sortBy ?? 'created_at';
    const sortOrder = options.sortOrder ?? 'desc';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const selectQuery = `
      SELECT * FROM risks 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const { results } = await this.db
      .prepare(selectQuery)
      .bind(...params, limit, offset)
      .all<RiskDBRecord>();

    return {
      risks: RiskMapper.toDomainList(results),
      total
    };
  }

  async findByStatus(organizationId: number, status: RiskStatus): Promise<Risk[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ? AND status = ?
         ORDER BY created_at DESC`
      )
      .bind(organizationId, status)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async findByCategory(organizationId: number, category: string): Promise<Risk[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ? AND category = ?
         ORDER BY created_at DESC`
      )
      .bind(organizationId, category)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async findByOwner(organizationId: number, ownerId: number): Promise<Risk[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ? AND owner_id = ?
         ORDER BY created_at DESC`
      )
      .bind(organizationId, ownerId)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async findCritical(organizationId: number): Promise<Risk[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ? 
         AND (probability * impact) >= 20
         ORDER BY (probability * impact) DESC`
      )
      .bind(organizationId)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async findOverdue(organizationId: number): Promise<Risk[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ? 
         AND review_date < datetime('now')
         AND status NOT IN ('closed')
         ORDER BY review_date ASC`
      )
      .bind(organizationId)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async search(organizationId: number, query: string): Promise<Risk[]> {
    const searchPattern = `%${query}%`;
    
    const { results } = await this.db
      .prepare(
        `SELECT * FROM risks 
         WHERE organization_id = ? 
         AND (title LIKE ? OR description LIKE ? OR category LIKE ?)
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .bind(organizationId, searchPattern, searchPattern, searchPattern)
      .all<RiskDBRecord>();

    return RiskMapper.toDomainList(results);
  }

  async save(risk: Risk): Promise<Risk> {
    const insertData = RiskMapper.toInsertData(risk);

    const result = await this.db
      .prepare(
        `INSERT INTO risks (
          title, description, category, subcategory, probability, impact,
          status, owner_id, organization_id, inherent_risk, residual_risk,
          source, affected_assets, review_date, due_date, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING *`
      )
      .bind(
        insertData.title,
        insertData.description,
        insertData.category,
        insertData.subcategory,
        insertData.probability,
        insertData.impact,
        insertData.status,
        insertData.owner_id,
        insertData.organization_id,
        insertData.inherent_risk,
        insertData.residual_risk,
        insertData.source,
        insertData.affected_assets,
        insertData.review_date,
        insertData.due_date,
        insertData.created_by
      )
      .first<RiskDBRecord>();

    if (!result) {
      throw new Error('Failed to create risk');
    }

    return RiskMapper.toDomain(result);
  }

  async update(risk: Risk): Promise<Risk> {
    const updateData = RiskMapper.toUpdateData(risk);

    const result = await this.db
      .prepare(
        `UPDATE risks SET
          title = ?, description = ?, category = ?, subcategory = ?,
          probability = ?, impact = ?, status = ?, owner_id = ?,
          inherent_risk = ?, residual_risk = ?, source = ?,
          affected_assets = ?, review_date = ?, due_date = ?,
          updated_at = datetime('now')
         WHERE id = ? AND organization_id = ?
         RETURNING *`
      )
      .bind(
        updateData.title,
        updateData.description,
        updateData.category,
        updateData.subcategory,
        updateData.probability,
        updateData.impact,
        updateData.status,
        updateData.owner_id,
        updateData.inherent_risk,
        updateData.residual_risk,
        updateData.source,
        updateData.affected_assets,
        updateData.review_date,
        updateData.due_date,
        risk.id,
        risk.organizationId
      )
      .first<RiskDBRecord>();

    if (!result) {
      throw new Error(`Failed to update risk: ${risk.id}`);
    }

    return RiskMapper.toDomain(result);
  }

  async delete(id: number, organizationId: number): Promise<void> {
    await this.db
      .prepare(
        `DELETE FROM risks 
         WHERE id = ? AND organization_id = ?`
      )
      .bind(id, organizationId)
      .run();
  }

  async exists(id: number, organizationId: number): Promise<boolean> {
    const result = await this.db
      .prepare(
        `SELECT 1 FROM risks 
         WHERE id = ? AND organization_id = ?`
      )
      .bind(id, organizationId)
      .first();

    return result !== null;
  }

  async count(organizationId: number): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM risks 
         WHERE organization_id = ?`
      )
      .bind(organizationId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }

  async countByStatus(organizationId: number, status: RiskStatus): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM risks 
         WHERE organization_id = ? AND status = ?`
      )
      .bind(organizationId, status)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }

  async getStatistics(organizationId: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    // Total count
    const total = await this.count(organizationId);

    // By status
    const statusResults = await this.db
      .prepare(
        `SELECT status, COUNT(*) as count 
         FROM risks 
         WHERE organization_id = ?
         GROUP BY status`
      )
      .bind(organizationId)
      .all<{ status: string; count: number }>();

    const byStatus: Record<string, number> = {};
    statusResults.results.forEach(row => {
      byStatus[row.status] = row.count;
    });

    // By severity (calculated from probability * impact)
    const severityResults = await this.db
      .prepare(
        `SELECT 
          CASE 
            WHEN (probability * impact) >= 20 THEN 'critical'
            WHEN (probability * impact) >= 15 THEN 'high'
            WHEN (probability * impact) >= 8 THEN 'medium'
            WHEN (probability * impact) >= 4 THEN 'low'
            ELSE 'very_low'
          END as severity,
          COUNT(*) as count
         FROM risks 
         WHERE organization_id = ?
         GROUP BY severity`
      )
      .bind(organizationId)
      .all<{ severity: string; count: number }>();

    const bySeverity: Record<string, number> = {};
    severityResults.results.forEach(row => {
      bySeverity[row.severity] = row.count;
    });

    // By category
    const categoryResults = await this.db
      .prepare(
        `SELECT category, COUNT(*) as count 
         FROM risks 
         WHERE organization_id = ?
         GROUP BY category`
      )
      .bind(organizationId)
      .all<{ category: string; count: number }>();

    const byCategory: Record<string, number> = {};
    categoryResults.results.forEach(row => {
      byCategory[row.category] = row.count;
    });

    return {
      total,
      byStatus,
      bySeverity,
      byCategory
    };
  }
}
