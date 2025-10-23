/**
 * D1RiskRepositoryProduction
 * Production-compatible implementation that works with existing database schema
 * This version only uses columns that actually exist in the production database
 */

import { D1Database } from '@cloudflare/workers-types';
import { 
  IRiskRepository, 
  Risk, 
  RiskScore,
  RiskStatus, 
  RiskCategory,
  RiskListFilters,
  RiskListSort,
  PaginationOptions,
  PaginatedResult,
  RiskStatistics
} from '../../domain';

/**
 * Production database row (only existing columns)
 */
interface ProductionRiskDbRow {
  id: number;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  owner_id: number | null;
  organization_id: number | null;
  probability: number | null;
  impact: number | null;
  inherent_risk: number | null;
  residual_risk: number | null;
  status: string;
  review_date: string | null;
  due_date: string | null;
  source: string | null;
  affected_assets: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export class D1RiskRepositoryProduction implements IRiskRepository {
  constructor(private readonly db: D1Database) {}

  /**
   * Find all risks with filters, sorting, and pagination
   */
  async findAll(
    filters?: RiskListFilters,
    sort?: RiskListSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Risk>> {
    const { page = 1, limit = 20 } = pagination || {};
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters?.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters?.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters?.riskLevel) {
      // Calculate risk level from probability * impact
      const levelConditions: string[] = [];
      switch (filters.riskLevel) {
        case 'critical':
          levelConditions.push('(probability * impact) >= 20');
          break;
        case 'high':
          levelConditions.push('(probability * impact) >= 12 AND (probability * impact) < 20');
          break;
        case 'medium':
          levelConditions.push('(probability * impact) >= 6 AND (probability * impact) < 12');
          break;
        case 'low':
          levelConditions.push('(probability * impact) < 6');
          break;
      }
      if (levelConditions.length > 0) {
        conditions.push(`(${levelConditions.join(' OR ')})`);
      }
    }

    const whereClause = conditions.join(' AND ');

    // Build ORDER BY clause
    let orderBy = 'created_at DESC';
    if (sort?.sortBy) {
      const sortColumn = this.mapSortColumn(sort.sortBy);
      const sortOrder = sort.sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderBy = `${sortColumn} ${sortOrder}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM risks WHERE ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get paginated results
    const dataQuery = `
      SELECT * FROM risks 
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const result = await this.db.prepare(dataQuery).bind(...params, limit, offset).all<ProductionRiskDbRow>();
    
    const risks = (result.results || []).map(row => this.toEntity(row));

    return {
      items: risks,
      total,
      page,
      limit,
      hasMore: offset + risks.length < total
    };
  }

  /**
   * Find risk by ID
   */
  async findById(id: number): Promise<Risk | null> {
    const result = await this.db
      .prepare('SELECT * FROM risks WHERE id = ?')
      .bind(id)
      .first<ProductionRiskDbRow>();

    if (!result) {
      return null;
    }

    return this.toEntity(result);
  }

  /**
   * Get risk statistics
   */
  async getStatistics(): Promise<RiskStatistics> {
    // Get status counts
    const statusResult = await this.db
      .prepare(`
        SELECT status, COUNT(*) as count 
        FROM risks 
        GROUP BY status
      `)
      .all<{ status: string; count: number }>();

    const byStatus: Record<string, number> = {};
    (statusResult.results || []).forEach(row => {
      byStatus[row.status] = row.count;
    });

    // Get risk level counts (calculated from probability * impact)
    const levelResult = await this.db
      .prepare(`
        SELECT 
          CASE 
            WHEN (probability * impact) >= 20 THEN 'critical'
            WHEN (probability * impact) >= 12 THEN 'high'
            WHEN (probability * impact) >= 6 THEN 'medium'
            ELSE 'low'
          END as level,
          COUNT(*) as count
        FROM risks
        WHERE probability IS NOT NULL AND impact IS NOT NULL
        GROUP BY level
      `)
      .all<{ level: string; count: number }>();

    const byLevel: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    (levelResult.results || []).forEach(row => {
      byLevel[row.level] = row.count;
    });

    // Get category counts
    const categoryResult = await this.db
      .prepare(`
        SELECT category, COUNT(*) as count 
        FROM risks 
        GROUP BY category
      `)
      .all<{ category: string; count: number }>();

    const byCategory: Record<string, number> = {};
    (categoryResult.results || []).forEach(row => {
      byCategory[row.category] = row.count;
    });

    // Get aggregated stats
    const statsResult = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          AVG(probability * impact) as avgScore,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCount,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedCount,
          SUM(CASE WHEN review_date < date('now') AND status = 'active' THEN 1 ELSE 0 END) as overdueCount
        FROM risks
      `)
      .first<{
        total: number;
        avgScore: number;
        activeCount: number;
        closedCount: number;
        overdueCount: number;
      }>();

    return {
      total: statsResult?.total || 0,
      byStatus,
      byLevel,
      byCategory,
      averageScore: statsResult?.avgScore || 0,
      activeCount: statsResult?.activeCount || 0,
      closedCount: statsResult?.closedCount || 0,
      reviewOverdueCount: statsResult?.overdueCount || 0
    };
  }

  /**
   * Save risk (create or update)
   */
  async save(risk: Risk): Promise<Risk> {
    if (risk.id === 0) {
      return this.create(risk);
    } else {
      return this.update(risk);
    }
  }

  /**
   * Delete risk
   */
  async delete(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM risks WHERE id = ?').bind(id).run();
  }

  /**
   * Create new risk
   */
  private async create(risk: Risk): Promise<Risk> {
    const result = await this.db.prepare(`
      INSERT INTO risks (
        title, description, category, subcategory,
        probability, impact, status,
        organization_id, owner_id, created_by,
        review_date, source, affected_assets,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      risk.title,
      risk.description,
      risk.category.value,
      null, // subcategory
      risk.score.probability,
      risk.score.impact,
      risk.status.value,
      risk.organizationId,
      risk.ownerId,
      risk.createdBy,
      risk.reviewDate?.toISOString(),
      'Risk Management v2', // source
      null, // affected_assets
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    const createdRisk = await this.findById(result.meta.last_row_id);
    if (!createdRisk) {
      throw new Error('Failed to create risk');
    }

    return createdRisk;
  }

  /**
   * Update existing risk
   */
  private async update(risk: Risk): Promise<Risk> {
    await this.db.prepare(`
      UPDATE risks SET
        title = ?,
        description = ?,
        category = ?,
        probability = ?,
        impact = ?,
        status = ?,
        organization_id = ?,
        owner_id = ?,
        review_date = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      risk.title,
      risk.description,
      risk.category.value,
      risk.score.probability,
      risk.score.impact,
      risk.status.value,
      risk.organizationId,
      risk.ownerId,
      risk.reviewDate?.toISOString(),
      new Date().toISOString(),
      risk.id
    ).run();

    const updatedRisk = await this.findById(risk.id);
    if (!updatedRisk) {
      throw new Error('Failed to update risk');
    }

    return updatedRisk;
  }

  /**
   * Map database row to Risk entity
   */
  private toEntity(row: ProductionRiskDbRow): Risk {
    const category = RiskCategory.create(row.category);
    const probability = row.probability || 1;
    const impact = row.impact || 1;
    const score = RiskScore.create(probability, impact);
    const status = RiskStatus.create(row.status);

    return Risk.reconstitute(
      row.id,
      {
        riskId: `RISK-${String(row.id).padStart(6, '0')}`, // Generate from ID
        title: row.title,
        description: row.description || '',
        category,
        score,
        status,
        organizationId: row.organization_id || 1,
        ownerId: row.owner_id || 1,
        createdBy: row.created_by || 1,
        riskType: 'operational', // default
        mitigationPlan: undefined,
        contingencyPlan: undefined,
        reviewDate: row.review_date ? new Date(row.review_date) : undefined,
        lastReviewDate: undefined,
        tags: [],
        metadata: {}
      },
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  /**
   * Map sort column from domain to database
   */
  private mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      score: '(probability * impact)',
      title: 'title',
      status: 'status',
      category: 'category'
    };

    return columnMap[sortBy] || 'created_at';
  }
}
