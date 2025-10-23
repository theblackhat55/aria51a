/**
 * D1RiskRepository
 * Cloudflare D1 implementation of IRiskRepository
 * Handles all database operations for Risk aggregate
 */

import { D1Database } from '@cloudflare/workers-types';
import { 
  IRiskRepository, 
  Risk, 
  RiskStatus, 
  RiskCategory,
  RiskListFilters,
  RiskListSort,
  PaginationOptions,
  PaginatedResult,
  RiskStatistics
} from '../../domain';
import { RiskMapper, RiskDbRow } from '../mappers/RiskMapper';

export class D1RiskRepository implements IRiskRepository {
  constructor(private readonly db: D1Database) {}

  /**
   * Save a new or existing risk
   */
  async save(risk: Risk): Promise<Risk> {
    if (risk.id === 0) {
      // Create new risk
      return this.create(risk);
    } else {
      // Update existing risk
      return this.update(risk);
    }
  }

  /**
   * Create new risk in database
   */
  private async create(risk: Risk): Promise<Risk> {
    const data = RiskMapper.toInsert(risk);
    
    const result = await this.db.prepare(`
      INSERT INTO risks (
        risk_id, title, description, category, 
        probability, impact, risk_score, status,
        organization_id, owner_id, created_by, risk_type,
        mitigation_plan, contingency_plan, review_date, last_review_date,
        tags, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.risk_id,
      data.title,
      data.description,
      data.category,
      data.probability,
      data.impact,
      data.risk_score,
      data.status,
      data.organization_id,
      data.owner_id,
      data.created_by,
      data.risk_type,
      data.mitigation_plan,
      data.contingency_plan,
      data.review_date,
      data.last_review_date,
      data.tags,
      data.metadata,
      data.created_at,
      data.updated_at
    ).run();

    // Fetch the created risk with its new ID
    const createdRisk = await this.findById(result.meta.last_row_id);
    if (!createdRisk) {
      throw new Error('Failed to create risk');
    }

    // Publish domain events
    await this.publishEvents(createdRisk);

    return createdRisk;
  }

  /**
   * Update existing risk in database
   */
  private async update(risk: Risk): Promise<Risk> {
    const data = RiskMapper.toUpdate(risk);

    await this.db.prepare(`
      UPDATE risks SET
        risk_id = ?,
        title = ?,
        description = ?,
        category = ?,
        probability = ?,
        impact = ?,
        risk_score = ?,
        status = ?,
        organization_id = ?,
        owner_id = ?,
        created_by = ?,
        risk_type = ?,
        mitigation_plan = ?,
        contingency_plan = ?,
        review_date = ?,
        last_review_date = ?,
        tags = ?,
        metadata = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      data.risk_id,
      data.title,
      data.description,
      data.category,
      data.probability,
      data.impact,
      data.risk_score,
      data.status,
      data.organization_id,
      data.owner_id,
      data.created_by,
      data.risk_type,
      data.mitigation_plan,
      data.contingency_plan,
      data.review_date,
      data.last_review_date,
      data.tags,
      data.metadata,
      data.updated_at,
      risk.id
    ).run();

    // Fetch updated risk
    const updatedRisk = await this.findById(risk.id);
    if (!updatedRisk) {
      throw new Error('Failed to update risk');
    }

    // Publish domain events
    await this.publishEvents(updatedRisk);

    return updatedRisk;
  }

  /**
   * Find risk by database ID
   */
  async findById(id: number): Promise<Risk | null> {
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE id = ?
    `).bind(id).first<RiskDbRow>();

    if (!result) {
      return null;
    }

    return RiskMapper.toEntity(result);
  }

  /**
   * Find risk by business identifier (riskId)
   */
  async findByRiskId(riskId: string): Promise<Risk | null> {
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE risk_id = ?
    `).bind(riskId).first<RiskDbRow>();

    if (!result) {
      return null;
    }

    return RiskMapper.toEntity(result);
  }

  /**
   * Find multiple risks by IDs
   */
  async findByIds(ids: number[]): Promise<Risk[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE id IN (${placeholders})
    `).bind(...ids).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * List risks with filters, sorting, and pagination
   */
  async list(
    filters?: RiskListFilters,
    sort?: RiskListSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Risk>> {
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (filters) {
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        whereConditions.push(`status IN (${statuses.map(() => '?').join(',')})`);
        params.push(...statuses);
      }

      if (filters.category) {
        const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
        whereConditions.push(`category IN (${categories.map(() => '?').join(',')})`);
        params.push(...categories);
      }

      if (filters.riskLevel) {
        const levels = Array.isArray(filters.riskLevel) ? filters.riskLevel : [filters.riskLevel];
        const levelConditions = levels.map(level => {
          switch (level) {
            case 'critical': return 'risk_score >= 20';
            case 'high': return 'risk_score >= 12 AND risk_score < 20';
            case 'medium': return 'risk_score >= 6 AND risk_score < 12';
            case 'low': return 'risk_score < 6';
            default: return null;
          }
        }).filter(Boolean);
        
        if (levelConditions.length > 0) {
          whereConditions.push(`(${levelConditions.join(' OR ')})`);
        }
      }

      if (filters.ownerId) {
        whereConditions.push('owner_id = ?');
        params.push(filters.ownerId);
      }

      if (filters.organizationId) {
        whereConditions.push('organization_id = ?');
        params.push(filters.organizationId);
      }

      if (filters.minScore) {
        whereConditions.push('risk_score >= ?');
        params.push(filters.minScore);
      }

      if (filters.maxScore) {
        whereConditions.push('risk_score <= ?');
        params.push(filters.maxScore);
      }

      if (filters.search) {
        whereConditions.push('(title LIKE ? OR description LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters.createdAfter) {
        whereConditions.push('created_at >= ?');
        params.push(filters.createdAfter.toISOString());
      }

      if (filters.createdBefore) {
        whereConditions.push('created_at <= ?');
        params.push(filters.createdBefore.toISOString());
      }

      if (filters.reviewOverdue !== undefined && filters.reviewOverdue) {
        whereConditions.push('review_date < ?');
        params.push(new Date().toISOString());
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const sortField = sort?.field || 'created_at';
    const sortOrder = sort?.order || 'desc';
    const orderByClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    // Count total matching records
    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM risks ${whereClause}
    `).bind(...params).first<{ count: number }>();

    const total = countResult?.count || 0;

    // Calculate pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    // Fetch paginated results
    const result = await this.db.prepare(`
      SELECT * FROM risks ${whereClause} ${orderByClause} LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all<RiskDbRow>();

    const items = RiskMapper.toEntityList(result.results || []);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  /**
   * Find all risks (use with caution)
   */
  async findAll(): Promise<Risk[]> {
    const result = await this.db.prepare(`
      SELECT * FROM risks ORDER BY created_at DESC
    `).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find risks by owner
   */
  async findByOwner(ownerId: number): Promise<Risk[]> {
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE owner_id = ? ORDER BY created_at DESC
    `).bind(ownerId).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find risks by organization
   */
  async findByOrganization(organizationId: number): Promise<Risk[]> {
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE organization_id = ? ORDER BY created_at DESC
    `).bind(organizationId).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find risks by status
   */
  async findByStatus(status: RiskStatus): Promise<Risk[]> {
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE status = ? ORDER BY created_at DESC
    `).bind(status.value).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find risks by category
   */
  async findByCategory(category: RiskCategory): Promise<Risk[]> {
    const result = await this.db.prepare(`
      SELECT * FROM risks WHERE category = ? ORDER BY created_at DESC
    `).bind(category.value).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find critical risks (score >= 20)
   */
  async findCriticalRisks(organizationId?: number): Promise<Risk[]> {
    const whereClause = organizationId 
      ? 'WHERE risk_score >= 20 AND organization_id = ?' 
      : 'WHERE risk_score >= 20';

    const query = `SELECT * FROM risks ${whereClause} ORDER BY risk_score DESC`;
    
    const result = organizationId
      ? await this.db.prepare(query).bind(organizationId).all<RiskDbRow>()
      : await this.db.prepare(query).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find active risks that need immediate attention
   */
  async findNeedingAttention(organizationId?: number): Promise<Risk[]> {
    const whereClause = organizationId
      ? 'WHERE risk_score >= 15 AND status = ? AND organization_id = ?'
      : 'WHERE risk_score >= 15 AND status = ?';

    const query = `SELECT * FROM risks ${whereClause} ORDER BY risk_score DESC`;

    const result = organizationId
      ? await this.db.prepare(query).bind('active', organizationId).all<RiskDbRow>()
      : await this.db.prepare(query).bind('active').all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Find risks with overdue reviews
   */
  async findOverdueReviews(organizationId?: number): Promise<Risk[]> {
    const now = new Date().toISOString();
    const whereClause = organizationId
      ? 'WHERE review_date < ? AND organization_id = ?'
      : 'WHERE review_date < ?';

    const query = `SELECT * FROM risks ${whereClause} ORDER BY review_date ASC`;

    const result = organizationId
      ? await this.db.prepare(query).bind(now, organizationId).all<RiskDbRow>()
      : await this.db.prepare(query).bind(now).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Search risks by text (title, description)
   */
  async search(query: string, organizationId?: number): Promise<Risk[]> {
    const searchTerm = `%${query}%`;
    const whereClause = organizationId
      ? 'WHERE (title LIKE ? OR description LIKE ?) AND organization_id = ?'
      : 'WHERE (title LIKE ? OR description LIKE ?)';

    const sql = `SELECT * FROM risks ${whereClause} ORDER BY risk_score DESC LIMIT 50`;

    const result = organizationId
      ? await this.db.prepare(sql).bind(searchTerm, searchTerm, organizationId).all<RiskDbRow>()
      : await this.db.prepare(sql).bind(searchTerm, searchTerm).all<RiskDbRow>();

    return RiskMapper.toEntityList(result.results || []);
  }

  /**
   * Get risk statistics
   */
  async getStatistics(organizationId?: number): Promise<RiskStatistics> {
    const whereClause = organizationId ? 'WHERE organization_id = ?' : '';

    // Get overall counts
    const countsQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(risk_score) as avg_score,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN review_date < ? THEN 1 ELSE 0 END) as overdue_count
      FROM risks ${whereClause}
    `;

    const countsParams: any[] = [new Date().toISOString()];
    if (organizationId) countsParams.push(organizationId);

    const counts = organizationId
      ? await this.db.prepare(countsQuery).bind(...countsParams).first<any>()
      : await this.db.prepare(countsQuery).bind(new Date().toISOString()).first<any>();

    // Get by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM risks ${whereClause}
      GROUP BY status
    `;

    const statusResult = organizationId
      ? await this.db.prepare(statusQuery).bind(organizationId).all<any>()
      : await this.db.prepare(statusQuery).all<any>();

    const byStatus: Record<string, number> = {};
    (statusResult.results || []).forEach((row: any) => {
      byStatus[row.status] = row.count;
    });

    // Get by category
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM risks ${whereClause}
      GROUP BY category
    `;

    const categoryResult = organizationId
      ? await this.db.prepare(categoryQuery).bind(organizationId).all<any>()
      : await this.db.prepare(categoryQuery).all<any>();

    const byCategory: Record<string, number> = {};
    (categoryResult.results || []).forEach((row: any) => {
      byCategory[row.category] = row.count;
    });

    // Calculate by level
    const levelQuery = `
      SELECT 
        SUM(CASE WHEN risk_score >= 20 THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN risk_score >= 12 AND risk_score < 20 THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN risk_score >= 6 AND risk_score < 12 THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN risk_score < 6 THEN 1 ELSE 0 END) as low
      FROM risks ${whereClause}
    `;

    const levels = organizationId
      ? await this.db.prepare(levelQuery).bind(organizationId).first<any>()
      : await this.db.prepare(levelQuery).first<any>();

    return {
      total: counts?.total || 0,
      byStatus,
      byLevel: {
        low: levels?.low || 0,
        medium: levels?.medium || 0,
        high: levels?.high || 0,
        critical: levels?.critical || 0
      },
      byCategory,
      averageScore: counts?.avg_score || 0,
      activeCount: counts?.active_count || 0,
      closedCount: counts?.closed_count || 0,
      reviewOverdueCount: counts?.overdue_count || 0
    };
  }

  /**
   * Check if risk with given riskId exists
   */
  async exists(riskId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM risks WHERE risk_id = ?
    `).bind(riskId).first<{ count: number }>();

    return (result?.count || 0) > 0;
  }

  /**
   * Delete risk by ID
   */
  async delete(id: number): Promise<void> {
    await this.db.prepare(`
      DELETE FROM risks WHERE id = ?
    `).bind(id).run();
  }

  /**
   * Delete risk by riskId
   */
  async deleteByRiskId(riskId: string): Promise<void> {
    await this.db.prepare(`
      DELETE FROM risks WHERE risk_id = ?
    `).bind(riskId).run();
  }

  /**
   * Count risks matching filters
   */
  async count(filters?: RiskListFilters): Promise<number> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (filters) {
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        whereConditions.push(`status IN (${statuses.map(() => '?').join(',')})`);
        params.push(...statuses);
      }

      if (filters.organizationId) {
        whereConditions.push('organization_id = ?');
        params.push(filters.organizationId);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM risks ${whereClause}
    `).bind(...params).first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * Get next available risk ID number for given prefix
   */
  async getNextRiskIdNumber(prefix: string): Promise<number> {
    const pattern = `${prefix}-%`;
    
    const result = await this.db.prepare(`
      SELECT risk_id FROM risks 
      WHERE risk_id LIKE ? 
      ORDER BY id DESC 
      LIMIT 1
    `).bind(pattern).first<{ risk_id: string }>();

    if (!result) {
      return 1;
    }

    // Extract number from risk_id (e.g., "RISK-005" -> 5)
    const match = result.risk_id.match(/\d+$/);
    if (!match) {
      return 1;
    }

    return parseInt(match[0], 10) + 1;
  }

  /**
   * Save multiple risks in a transaction
   */
  async saveMany(risks: Risk[]): Promise<Risk[]> {
    // Note: D1 doesn't support traditional transactions yet
    // We'll save sequentially for now
    const savedRisks: Risk[] = [];

    for (const risk of risks) {
      const saved = await this.save(risk);
      savedRisks.push(saved);
    }

    return savedRisks;
  }

  /**
   * Delete multiple risks by IDs
   */
  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await this.db.prepare(`
      DELETE FROM risks WHERE id IN (${placeholders})
    `).bind(...ids).run();
  }

  /**
   * Update risk status in bulk
   */
  async updateStatusBulk(ids: number[], newStatus: RiskStatus, reason?: string): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await this.db.prepare(`
      UPDATE risks 
      SET status = ?, updated_at = ? 
      WHERE id IN (${placeholders})
    `).bind(newStatus.value, new Date().toISOString(), ...ids).run();
  }

  /**
   * Publish domain events from aggregate
   */
  private async publishEvents(risk: Risk): Promise<void> {
    const events = risk.pullDomainEvents();
    
    // TODO: Integrate with event bus
    // For now, just log events
    for (const event of events) {
      console.log('Domain Event:', event.eventType, event.aggregateId, event.payload);
    }
  }
}
