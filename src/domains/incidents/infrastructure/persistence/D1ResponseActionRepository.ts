/**
 * D1ResponseActionRepository - Cloudflare D1 implementation of IResponseActionRepository
 * 
 * Handles all database operations for ResponseAction entity using Cloudflare D1.
 * 
 * Part of the Incident Response Domain (Infrastructure Layer).
 */

import { IResponseActionRepository, ListResponseActionsOptions, ResponseActionStatistics } from '../../core/repositories/IResponseActionRepository';
import { ResponseAction } from '../../core/entities/ResponseAction';
import { ResponseActionMapper } from '../../application/mappers/ResponseActionMapper';

export class D1ResponseActionRepository implements IResponseActionRepository {
  constructor(private db: D1Database) {}

  async findById(id: number, organizationId: number): Promise<ResponseAction | null> {
    const result = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE id = ? AND organization_id = ?`
      )
      .bind(id, organizationId)
      .first();

    return result ? ResponseActionMapper.toDomain(result) : null;
  }

  async list(options: ListResponseActionsOptions): Promise<{ actions: ResponseAction[]; total: number }> {
    const conditions: string[] = ['organization_id = ?'];
    const params: any[] = [options.organizationId];

    if (options.incidentId) {
      conditions.push('incident_id = ?');
      params.push(options.incidentId);
    }

    if (options.actionType) {
      conditions.push('action_type = ?');
      params.push(options.actionType);
    }

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.performedBy) {
      conditions.push('performed_by = ?');
      params.push(options.performedBy);
    }

    if (options.dateFrom) {
      conditions.push('performed_at >= ?');
      params.push(options.dateFrom.toISOString());
    }

    if (options.dateTo) {
      conditions.push('performed_at <= ?');
      params.push(options.dateTo.toISOString());
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM response_actions WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    const total = countResult?.count ?? 0;

    // Get paginated results
    const sortBy = options.sortBy ?? 'performed_at';
    const sortOrder = options.sortOrder ?? 'desc';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const { results } = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    return {
      actions: results.map(r => ResponseActionMapper.toDomain(r)),
      total
    };
  }

  async save(action: ResponseAction): Promise<ResponseAction> {
    const data = ResponseActionMapper.toPersistence(action);

    const result = await this.db
      .prepare(
        `INSERT INTO response_actions (
          incident_id, action_type, description, performed_by, performed_at,
          status, outcome, evidence_urls, duration_minutes, cost,
          tools_used, affected_systems, notes, reviewed_by, reviewed_at,
          review_comments, organization_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.incident_id, data.action_type, data.description, data.performed_by, data.performed_at,
        data.status, data.outcome, data.evidence_urls, data.duration_minutes, data.cost,
        data.tools_used, data.affected_systems, data.notes, data.reviewed_by, data.reviewed_at,
        data.review_comments, data.organization_id, data.created_at, data.updated_at
      )
      .run();

    const created = await this.db
      .prepare('SELECT * FROM response_actions WHERE id = ? AND organization_id = ?')
      .bind(result.meta.last_row_id, data.organization_id)
      .first();

    return ResponseActionMapper.toDomain(created!);
  }

  async update(action: ResponseAction): Promise<ResponseAction> {
    const data = ResponseActionMapper.toPersistence(action);

    await this.db
      .prepare(
        `UPDATE response_actions SET
          action_type = ?, description = ?, status = ?, outcome = ?,
          evidence_urls = ?, duration_minutes = ?, cost = ?, tools_used = ?,
          affected_systems = ?, notes = ?, reviewed_by = ?, reviewed_at = ?,
          review_comments = ?, updated_at = ?
         WHERE id = ? AND organization_id = ?`
      )
      .bind(
        data.action_type, data.description, data.status, data.outcome,
        data.evidence_urls, data.duration_minutes, data.cost, data.tools_used,
        data.affected_systems, data.notes, data.reviewed_by, data.reviewed_at,
        data.review_comments, new Date().toISOString(),
        data.id, data.organization_id
      )
      .run();

    return action;
  }

  async delete(id: number, organizationId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM response_actions WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .run();

    return result.meta.changes > 0;
  }

  async findByIncident(incidentId: number, organizationId: number): Promise<ResponseAction[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE incident_id = ? AND organization_id = ?
         ORDER BY performed_at DESC`
      )
      .bind(incidentId, organizationId)
      .all();

    return results.map(r => ResponseActionMapper.toDomain(r));
  }

  async findByPerformer(userId: number, organizationId: number): Promise<ResponseAction[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE performed_by = ? AND organization_id = ?
         ORDER BY performed_at DESC`
      )
      .bind(userId, organizationId)
      .all();

    return results.map(r => ResponseActionMapper.toDomain(r));
  }

  async findByType(actionType: string, organizationId: number): Promise<ResponseAction[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE action_type = ? AND organization_id = ?
         ORDER BY performed_at DESC`
      )
      .bind(actionType, organizationId)
      .all();

    return results.map(r => ResponseActionMapper.toDomain(r));
  }

  async findPending(organizationId: number): Promise<ResponseAction[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE organization_id = ?
         AND status IN ('pending', 'in_progress')
         ORDER BY performed_at DESC`
      )
      .bind(organizationId)
      .all();

    return results.map(r => ResponseActionMapper.toDomain(r));
  }

  async findRequiringReview(organizationId: number): Promise<ResponseAction[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM response_actions 
         WHERE organization_id = ?
         AND status = 'completed'
         AND reviewed_by IS NULL
         ORDER BY performed_at DESC`
      )
      .bind(organizationId)
      .all();

    return results.map(r => ResponseActionMapper.toDomain(r));
  }

  async getStatistics(organizationId: number, incidentId?: number, dateFrom?: Date, dateTo?: Date): Promise<ResponseActionStatistics> {
    let dateFilter = '';
    const params: any[] = [organizationId];

    if (incidentId) {
      dateFilter += ' AND incident_id = ?';
      params.push(incidentId);
    }

    if (dateFrom) {
      dateFilter += ' AND performed_at >= ?';
      params.push(dateFrom.toISOString());
    }

    if (dateTo) {
      dateFilter += ' AND performed_at <= ?';
      params.push(dateTo.toISOString());
    }

    const stats = await this.db
      .prepare(
        `SELECT 
          COUNT(*) as total_actions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_actions,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_actions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_actions,
          AVG(duration_minutes) as avg_duration,
          SUM(COALESCE(cost, 0)) as total_cost
         FROM response_actions
         WHERE organization_id = ?${dateFilter}`
      )
      .bind(...params)
      .first<any>();

    const { results: byType } = await this.db
      .prepare(
        `SELECT action_type, COUNT(*) as count
         FROM response_actions
         WHERE organization_id = ?${dateFilter}
         GROUP BY action_type`
      )
      .bind(...params)
      .all<{ action_type: string; count: number }>();

    const { results: byStatus } = await this.db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM response_actions
         WHERE organization_id = ?${dateFilter}
         GROUP BY status`
      )
      .bind(...params)
      .all<{ status: string; count: number }>();

    return {
      totalActions: stats?.total_actions ?? 0,
      completedActions: stats?.completed_actions ?? 0,
      inProgressActions: stats?.in_progress_actions ?? 0,
      failedActions: stats?.failed_actions ?? 0,
      averageDuration: stats?.avg_duration ?? null,
      totalCost: stats?.total_cost ?? 0,
      byActionType: Object.fromEntries(byType.map(r => [r.action_type, r.count])),
      byStatus: Object.fromEntries(byStatus.map(r => [r.status, r.count]))
    };
  }

  async getIncidentTimeline(incidentId: number, organizationId: number): Promise<ResponseAction[]> {
    return this.findByIncident(incidentId, organizationId);
  }

  async count(organizationId: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM response_actions WHERE organization_id = ?')
      .bind(organizationId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }
}
