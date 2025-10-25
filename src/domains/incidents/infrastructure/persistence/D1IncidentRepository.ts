/**
 * D1IncidentRepository - Cloudflare D1 implementation of IIncidentRepository
 * 
 * Handles all database operations for Incident aggregate using Cloudflare D1.
 * 
 * Part of the Incident Response Domain (Infrastructure Layer).
 */

import { IIncidentRepository, ListIncidentsOptions, IncidentStatistics } from '../../core/repositories/IIncidentRepository';
import { Incident } from '../../core/entities/Incident';
import { IncidentMapper } from '../../application/mappers/IncidentMapper';

export class D1IncidentRepository implements IIncidentRepository {
  constructor(private db: D1Database) {}

  async findById(id: number, organizationId: number): Promise<Incident | null> {
    const result = await this.db
      .prepare(
        `SELECT * FROM incidents 
         WHERE id = ? AND organization_id = ?`
      )
      .bind(id, organizationId)
      .first();

    return result ? IncidentMapper.toDomain(result) : null;
  }

  async list(options: ListIncidentsOptions): Promise<{ incidents: Incident[]; total: number }> {
    // Build WHERE clauses
    const conditions: string[] = ['organization_id = ?'];
    const params: any[] = [options.organizationId];

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.severity) {
      conditions.push('severity = ?');
      params.push(options.severity);
    }

    if (options.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }

    if (options.assignedTo) {
      conditions.push('assigned_to = ?');
      params.push(options.assignedTo);
    }

    if (options.slaBreached !== undefined) {
      // Calculate SLA breach in SQL
      conditions.push(
        `(CASE 
          WHEN status IN ('resolved', 'closed') THEN 0
          ELSE CASE
            WHEN severity = 'critical' AND (julianday('now') - julianday(detected_at)) * 24 > 1 THEN 1
            WHEN severity = 'high' AND (julianday('now') - julianday(detected_at)) * 24 > 4 THEN 1
            WHEN severity = 'medium' AND (julianday('now') - julianday(detected_at)) * 24 > 24 THEN 1
            WHEN severity = 'low' AND (julianday('now') - julianday(detected_at)) * 24 > 72 THEN 1
            ELSE 0
          END
        END) = ?`
      );
      params.push(options.slaBreached ? 1 : 0);
    }

    if (options.dataCompromised !== undefined) {
      conditions.push('data_compromised = ?');
      params.push(options.dataCompromised ? 1 : 0);
    }

    if (options.dateFrom) {
      conditions.push('detected_at >= ?');
      params.push(options.dateFrom.toISOString());
    }

    if (options.dateTo) {
      conditions.push('detected_at <= ?');
      params.push(options.dateTo.toISOString());
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM incidents WHERE ${whereClause}`;
    const countResult = await this.db
      .prepare(countQuery)
      .bind(...params)
      .first<{ count: number }>();

    const total = countResult?.count ?? 0;

    // Get paginated results
    const sortBy = options.sortBy ?? 'detected_at';
    const sortOrder = options.sortOrder ?? 'desc';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const selectQuery = `
      SELECT * FROM incidents 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const { results } = await this.db
      .prepare(selectQuery)
      .bind(...params, limit, offset)
      .all();

    return {
      incidents: results.map(r => IncidentMapper.toDomain(r)),
      total
    };
  }

  async save(incident: Incident): Promise<Incident> {
    const data = IncidentMapper.toPersistence(incident);

    const result = await this.db
      .prepare(
        `INSERT INTO incidents (
          title, description, severity, status, category, impact,
          assigned_to, detected_at, contained_at, resolved_at, closed_at,
          source_ip, target_asset, affected_systems, estimated_cost, actual_cost,
          data_compromised, customers_affected, root_cause, resolution, lessons_learned,
          related_risks, related_assets, organization_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.title, data.description, data.severity, data.status, data.category, data.impact,
        data.assigned_to, data.detected_at, data.contained_at, data.resolved_at, data.closed_at,
        data.source_ip, data.target_asset, data.affected_systems, data.estimated_cost, data.actual_cost,
        data.data_compromised, data.customers_affected, data.root_cause, data.resolution, data.lessons_learned,
        data.related_risks, data.related_assets, data.organization_id, data.created_at, data.updated_at
      )
      .run();

    // Fetch the created incident
    const created = await this.db
      .prepare('SELECT * FROM incidents WHERE id = ? AND organization_id = ?')
      .bind(result.meta.last_row_id, data.organization_id)
      .first();

    return IncidentMapper.toDomain(created!);
  }

  async update(incident: Incident): Promise<Incident> {
    const data = IncidentMapper.toPersistence(incident);

    await this.db
      .prepare(
        `UPDATE incidents SET
          title = ?, description = ?, severity = ?, status = ?, category = ?, impact = ?,
          assigned_to = ?, detected_at = ?, contained_at = ?, resolved_at = ?, closed_at = ?,
          source_ip = ?, target_asset = ?, affected_systems = ?, estimated_cost = ?, actual_cost = ?,
          data_compromised = ?, customers_affected = ?, root_cause = ?, resolution = ?, lessons_learned = ?,
          related_risks = ?, related_assets = ?, updated_at = ?
         WHERE id = ? AND organization_id = ?`
      )
      .bind(
        data.title, data.description, data.severity, data.status, data.category, data.impact,
        data.assigned_to, data.detected_at, data.contained_at, data.resolved_at, data.closed_at,
        data.source_ip, data.target_asset, data.affected_systems, data.estimated_cost, data.actual_cost,
        data.data_compromised, data.customers_affected, data.root_cause, data.resolution, data.lessons_learned,
        data.related_risks, data.related_assets, new Date().toISOString(),
        data.id, data.organization_id
      )
      .run();

    return incident;
  }

  async delete(id: number, organizationId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM incidents WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .run();

    return result.meta.changes > 0;
  }

  async findByAssignedUser(userId: number, organizationId: number): Promise<Incident[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM incidents 
         WHERE assigned_to = ? AND organization_id = ?
         ORDER BY detected_at DESC`
      )
      .bind(userId, organizationId)
      .all();

    return results.map(r => IncidentMapper.toDomain(r));
  }

  async findSLABreached(organizationId: number): Promise<Incident[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM incidents 
         WHERE organization_id = ?
         AND status NOT IN ('resolved', 'closed')
         AND (
           (severity = 'critical' AND (julianday('now') - julianday(detected_at)) * 24 > 1) OR
           (severity = 'high' AND (julianday('now') - julianday(detected_at)) * 24 > 4) OR
           (severity = 'medium' AND (julianday('now') - julianday(detected_at)) * 24 > 24) OR
           (severity = 'low' AND (julianday('now') - julianday(detected_at)) * 24 > 72)
         )
         ORDER BY detected_at DESC`
      )
      .bind(organizationId)
      .all();

    return results.map(r => IncidentMapper.toDomain(r));
  }

  async findActive(organizationId: number): Promise<Incident[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM incidents 
         WHERE organization_id = ?
         AND status NOT IN ('resolved', 'closed')
         ORDER BY detected_at DESC`
      )
      .bind(organizationId)
      .all();

    return results.map(r => IncidentMapper.toDomain(r));
  }

  async findByRelatedRisk(riskId: number, organizationId: number): Promise<Incident[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM incidents 
         WHERE organization_id = ?
         AND related_risks LIKE ?
         ORDER BY detected_at DESC`
      )
      .bind(organizationId, `%"${riskId}"%`)
      .all();

    return results.map(r => IncidentMapper.toDomain(r));
  }

  async findByRelatedAsset(assetId: string, organizationId: number): Promise<Incident[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM incidents 
         WHERE organization_id = ?
         AND (related_assets LIKE ? OR target_asset = ?)
         ORDER BY detected_at DESC`
      )
      .bind(organizationId, `%"${assetId}"%`, assetId)
      .all();

    return results.map(r => IncidentMapper.toDomain(r));
  }

  async getStatistics(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<IncidentStatistics> {
    let dateFilter = '';
    const params: any[] = [organizationId];

    if (dateFrom) {
      dateFilter += ' AND detected_at >= ?';
      params.push(dateFrom.toISOString());
    }

    if (dateTo) {
      dateFilter += ' AND detected_at <= ?';
      params.push(dateTo.toISOString());
    }

    // Get basic counts
    const stats = await this.db
      .prepare(
        `SELECT 
          COUNT(*) as total_incidents,
          SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as active_incidents,
          SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as closed_incidents,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_incidents,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_incidents
         FROM incidents
         WHERE organization_id = ?${dateFilter}`
      )
      .bind(...params)
      .first<any>();

    // Get SLA breached count
    const slaBreached = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM incidents 
         WHERE organization_id = ?${dateFilter}
         AND status NOT IN ('resolved', 'closed')
         AND (
           (severity = 'critical' AND (julianday('now') - julianday(detected_at)) * 24 > 1) OR
           (severity = 'high' AND (julianday('now') - julianday(detected_at)) * 24 > 4) OR
           (severity = 'medium' AND (julianday('now') - julianday(detected_at)) * 24 > 24) OR
           (severity = 'low' AND (julianday('now') - julianday(detected_at)) * 24 > 72)
         )`
      )
      .bind(...params)
      .first<{ count: number }>();

    // Get time to contain average
    const timeToContain = await this.db
      .prepare(
        `SELECT AVG((julianday(contained_at) - julianday(detected_at)) * 24) as avg_hours
         FROM incidents
         WHERE organization_id = ?${dateFilter}
         AND contained_at IS NOT NULL`
      )
      .bind(...params)
      .first<{ avg_hours: number | null }>();

    // Get time to resolve average
    const timeToResolve = await this.db
      .prepare(
        `SELECT AVG((julianday(resolved_at) - julianday(detected_at)) * 24) as avg_hours
         FROM incidents
         WHERE organization_id = ?${dateFilter}
         AND resolved_at IS NOT NULL`
      )
      .bind(...params)
      .first<{ avg_hours: number | null }>();

    // Get by category
    const { results: byCategory } = await this.db
      .prepare(
        `SELECT category, COUNT(*) as count
         FROM incidents
         WHERE organization_id = ?${dateFilter}
         GROUP BY category`
      )
      .bind(...params)
      .all<{ category: string; count: number }>();

    // Get by status
    const { results: byStatus } = await this.db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM incidents
         WHERE organization_id = ?${dateFilter}
         GROUP BY status`
      )
      .bind(...params)
      .all<{ status: string; count: number }>();

    return {
      totalIncidents: stats?.total_incidents ?? 0,
      activeIncidents: stats?.active_incidents ?? 0,
      closedIncidents: stats?.closed_incidents ?? 0,
      criticalIncidents: stats?.critical_incidents ?? 0,
      highIncidents: stats?.high_incidents ?? 0,
      slaBreachedCount: slaBreached?.count ?? 0,
      averageTimeToContain: timeToContain?.avg_hours ?? null,
      averageTimeToResolve: timeToResolve?.avg_hours ?? null,
      byCategory: Object.fromEntries(byCategory.map(r => [r.category, r.count])),
      byStatus: Object.fromEntries(byStatus.map(r => [r.status, r.count]))
    };
  }

  async exists(id: number, organizationId: number): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT 1 FROM incidents WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .first();

    return result !== null;
  }

  async count(organizationId: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM incidents WHERE organization_id = ?')
      .bind(organizationId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }
}
