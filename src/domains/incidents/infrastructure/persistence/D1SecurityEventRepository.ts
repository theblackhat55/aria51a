/**
 * D1SecurityEventRepository - Cloudflare D1 implementation of ISecurityEventRepository
 * 
 * Handles all database operations for SecurityEvent entity using Cloudflare D1.
 * 
 * Part of the Incident Response Domain (Infrastructure Layer).
 */

import { ISecurityEventRepository, ListSecurityEventsOptions, SecurityEventStatistics, CorrelationCandidate } from '../../core/repositories/ISecurityEventRepository';
import { SecurityEvent } from '../../core/entities/SecurityEvent';
import { SecurityEventMapper } from '../../application/mappers/SecurityEventMapper';

export class D1SecurityEventRepository implements ISecurityEventRepository {
  constructor(private db: D1Database) {}

  async findById(id: number, organizationId: number): Promise<SecurityEvent | null> {
    const result = await this.db
      .prepare('SELECT * FROM security_events WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .first();

    return result ? SecurityEventMapper.toDomain(result) : null;
  }

  async list(options: ListSecurityEventsOptions): Promise<{ events: SecurityEvent[]; total: number }> {
    const conditions: string[] = ['organization_id = ?'];
    const params: any[] = [options.organizationId];

    if (options.eventType) {
      conditions.push('event_type = ?');
      params.push(options.eventType);
    }

    if (options.severity) {
      conditions.push('severity = ?');
      params.push(options.severity);
    }

    if (options.source) {
      conditions.push('source = ?');
      params.push(options.source);
    }

    if (options.sourceSystem) {
      conditions.push('source_system = ?');
      params.push(options.sourceSystem);
    }

    if (options.sourceIp) {
      conditions.push('source_ip = ?');
      params.push(options.sourceIp);
    }

    if (options.destinationIp) {
      conditions.push('destination_ip = ?');
      params.push(options.destinationIp);
    }

    if (options.userId) {
      conditions.push('user_id = ?');
      params.push(options.userId);
    }

    if (options.assetId) {
      conditions.push('asset_id = ?');
      params.push(options.assetId);
    }

    if (options.incidentId !== undefined) {
      if (options.incidentId === null) {
        conditions.push('incident_id IS NULL');
      } else {
        conditions.push('incident_id = ?');
        params.push(options.incidentId);
      }
    }

    if (options.falsePositive !== undefined) {
      conditions.push('false_positive = ?');
      params.push(options.falsePositive ? 1 : 0);
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

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM security_events WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    const total = countResult?.count ?? 0;

    const sortBy = options.sortBy ?? 'detected_at';
    const sortOrder = options.sortOrder ?? 'desc';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    return {
      events: results.map(r => SecurityEventMapper.toDomain(r)),
      total
    };
  }

  async save(event: SecurityEvent): Promise<SecurityEvent> {
    const data = SecurityEventMapper.toPersistence(event);

    const result = await this.db
      .prepare(
        `INSERT INTO security_events (
          event_type, severity, source, source_system, source_ip, destination_ip,
          source_port, destination_port, protocol, user_id, asset_id, asset_name,
          description, raw_log, detected_at, signature, confidence, false_positive,
          incident_id, correlated_events, metadata, hash, organization_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.event_type, data.severity, data.source, data.source_system, data.source_ip, data.destination_ip,
        data.source_port, data.destination_port, data.protocol, data.user_id, data.asset_id, data.asset_name,
        data.description, data.raw_log, data.detected_at, data.signature, data.confidence, data.false_positive,
        data.incident_id, data.correlated_events, data.metadata, data.hash, data.organization_id, data.created_at, data.updated_at
      )
      .run();

    const created = await this.db
      .prepare('SELECT * FROM security_events WHERE id = ? AND organization_id = ?')
      .bind(result.meta.last_row_id, data.organization_id)
      .first();

    return SecurityEventMapper.toDomain(created!);
  }

  async update(event: SecurityEvent): Promise<SecurityEvent> {
    const data = SecurityEventMapper.toPersistence(event);

    await this.db
      .prepare(
        `UPDATE security_events SET
          severity = ?, description = ?, confidence = ?, false_positive = ?,
          incident_id = ?, correlated_events = ?, metadata = ?, updated_at = ?
         WHERE id = ? AND organization_id = ?`
      )
      .bind(
        data.severity, data.description, data.confidence, data.false_positive,
        data.incident_id, data.correlated_events, data.metadata, new Date().toISOString(),
        data.id, data.organization_id
      )
      .run();

    return event;
  }

  async delete(id: number, organizationId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM security_events WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .run();

    return result.meta.changes > 0;
  }

  async bulkSave(events: SecurityEvent[]): Promise<SecurityEvent[]> {
    const saved: SecurityEvent[] = [];
    for (const event of events) {
      saved.push(await this.save(event));
    }
    return saved;
  }

  async findByHash(hash: string, organizationId: number): Promise<SecurityEvent | null> {
    const result = await this.db
      .prepare('SELECT * FROM security_events WHERE hash = ? AND organization_id = ?')
      .bind(hash, organizationId)
      .first();

    return result ? SecurityEventMapper.toDomain(result) : null;
  }

  async findByIncident(incidentId: number, organizationId: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE incident_id = ? AND organization_id = ?
         ORDER BY detected_at DESC`
      )
      .bind(incidentId, organizationId)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async findUncorrelated(organizationId: number, limit?: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE organization_id = ?
         AND incident_id IS NULL
         AND false_positive = 0
         ORDER BY detected_at DESC
         LIMIT ?`
      )
      .bind(organizationId, limit ?? 50)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async findBySourceSystem(sourceSystem: string, organizationId: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE source_system = ? AND organization_id = ?
         ORDER BY detected_at DESC`
      )
      .bind(sourceSystem, organizationId)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async findByIpAddress(ip: string, organizationId: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE (source_ip = ? OR destination_ip = ?) AND organization_id = ?
         ORDER BY detected_at DESC`
      )
      .bind(ip, ip, organizationId)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async findByUser(userId: number, organizationId: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE user_id = ? AND organization_id = ?
         ORDER BY detected_at DESC`
      )
      .bind(userId, organizationId)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async findByAsset(assetId: string, organizationId: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE asset_id = ? AND organization_id = ?
         ORDER BY detected_at DESC`
      )
      .bind(assetId, organizationId)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async findSimilarEvents(event: SecurityEvent, timeWindowMinutes?: number, limit?: number): Promise<CorrelationCandidate[]> {
    const window = timeWindowMinutes ?? 60;
    const json = event.toJSON();
    
    // Simple similarity based on source IP, event type, and time proximity
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE organization_id = ?
         AND id != ?
         AND (
           source_ip = ? OR 
           event_type = ? OR 
           asset_id = ?
         )
         AND ABS((julianday(detected_at) - julianday(?)) * 24 * 60) <= ?
         ORDER BY detected_at DESC
         LIMIT ?`
      )
      .bind(
        json.organizationId,
        json.id,
        json.sourceIp ?? '',
        json.eventType,
        json.assetId ?? '',
        json.detectedAt,
        window,
        limit ?? 10
      )
      .all();

    return results.map(r => {
      const similarEvent = SecurityEventMapper.toDomain(r);
      const matchingFields: string[] = [];
      let matches = 0;

      if (similarEvent.sourceIp === event.sourceIp) {
        matchingFields.push('source_ip');
        matches++;
      }
      if (similarEvent.eventType === event.eventType) {
        matchingFields.push('event_type');
        matches++;
      }
      if (similarEvent.assetId === event.assetId) {
        matchingFields.push('asset_id');
        matches++;
      }

      return {
        event: similarEvent,
        similarityScore: (matches / 3) * 100,
        matchingFields
      };
    });
  }

  async findCorrelatedEvents(eventId: number, organizationId: number): Promise<SecurityEvent[]> {
    const event = await this.findById(eventId, organizationId);
    if (!event || !event.incidentId) {
      return [];
    }

    return this.findByIncident(event.incidentId, organizationId);
  }

  async markAsFalsePositive(id: number, organizationId: number): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE security_events SET false_positive = 1, updated_at = ? 
         WHERE id = ? AND organization_id = ?`
      )
      .bind(new Date().toISOString(), id, organizationId)
      .run();

    return result.meta.changes > 0;
  }

  async findHighConfidenceUncorrelated(organizationId: number, minConfidence?: number): Promise<SecurityEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE organization_id = ?
         AND incident_id IS NULL
         AND false_positive = 0
         AND confidence >= ?
         ORDER BY confidence DESC, detected_at DESC
         LIMIT 50`
      )
      .bind(organizationId, minConfidence ?? 70)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async getStatistics(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<SecurityEventStatistics> {
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

    const stats = await this.db
      .prepare(
        `SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_severity,
          SUM(CASE WHEN false_positive = 1 THEN 1 ELSE 0 END) as false_positives,
          SUM(CASE WHEN incident_id IS NOT NULL THEN 1 ELSE 0 END) as correlated,
          SUM(CASE WHEN incident_id IS NULL THEN 1 ELSE 0 END) as uncorrelated,
          AVG(confidence) as avg_confidence
         FROM security_events
         WHERE organization_id = ?${dateFilter}`
      )
      .bind(...params)
      .first<any>();

    const { results: byType } = await this.db
      .prepare(
        `SELECT event_type, COUNT(*) as count
         FROM security_events
         WHERE organization_id = ?${dateFilter}
         GROUP BY event_type
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(...params)
      .all<{ event_type: string; count: number }>();

    const { results: bySeverity } = await this.db
      .prepare(
        `SELECT severity, COUNT(*) as count
         FROM security_events
         WHERE organization_id = ?${dateFilter}
         GROUP BY severity`
      )
      .bind(...params)
      .all<{ severity: string; count: number }>();

    const { results: bySource } = await this.db
      .prepare(
        `SELECT source, COUNT(*) as count
         FROM security_events
         WHERE organization_id = ?${dateFilter}
         GROUP BY source`
      )
      .bind(...params)
      .all<{ source: string; count: number }>();

    const { results: topSourceIps } = await this.db
      .prepare(
        `SELECT source_ip as ip, COUNT(*) as count
         FROM security_events
         WHERE organization_id = ?${dateFilter}
         AND source_ip IS NOT NULL
         GROUP BY source_ip
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(...params)
      .all<{ ip: string; count: number }>();

    const { results: topDestIps } = await this.db
      .prepare(
        `SELECT destination_ip as ip, COUNT(*) as count
         FROM security_events
         WHERE organization_id = ?${dateFilter}
         AND destination_ip IS NOT NULL
         GROUP BY destination_ip
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(...params)
      .all<{ ip: string; count: number }>();

    return {
      totalEvents: stats?.total_events ?? 0,
      highSeverityEvents: stats?.high_severity ?? 0,
      criticalSeverityEvents: stats?.critical_severity ?? 0,
      falsePositives: stats?.false_positives ?? 0,
      correlatedEvents: stats?.correlated ?? 0,
      uncorrelatedEvents: stats?.uncorrelated ?? 0,
      averageConfidence: stats?.avg_confidence ?? null,
      byEventType: Object.fromEntries(byType.map(r => [r.event_type, r.count])),
      bySeverity: Object.fromEntries(bySeverity.map(r => [r.severity, r.count])),
      bySource: Object.fromEntries(bySource.map(r => [r.source, r.count])),
      topSourceIps: topSourceIps,
      topDestinationIps: topDestIps
    };
  }

  async getAssetTimeline(assetId: string, organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<SecurityEvent[]> {
    let dateFilter = '';
    const params: any[] = [assetId, organizationId];

    if (dateFrom) {
      dateFilter += ' AND detected_at >= ?';
      params.push(dateFrom.toISOString());
    }

    if (dateTo) {
      dateFilter += ' AND detected_at <= ?';
      params.push(dateTo.toISOString());
    }

    const { results } = await this.db
      .prepare(
        `SELECT * FROM security_events 
         WHERE asset_id = ? AND organization_id = ?${dateFilter}
         ORDER BY detected_at ASC`
      )
      .bind(...params)
      .all();

    return results.map(r => SecurityEventMapper.toDomain(r));
  }

  async count(organizationId: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM security_events WHERE organization_id = ?')
      .bind(organizationId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }

  async countUncorrelated(organizationId: number): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM security_events 
         WHERE organization_id = ? AND incident_id IS NULL AND false_positive = 0`
      )
      .bind(organizationId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }
}
