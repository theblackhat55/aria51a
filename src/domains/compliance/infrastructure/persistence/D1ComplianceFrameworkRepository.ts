/**
 * D1ComplianceFrameworkRepository - Cloudflare D1 implementation
 */

import { ComplianceFramework } from '../../core/entities/ComplianceFramework';
import { IComplianceFrameworkRepository, ListFrameworksOptions } from '../../core/repositories/IComplianceFrameworkRepository';
import { FrameworkType } from '../../core/value-objects/FrameworkType';
import { ComplianceFrameworkMapper } from '../mappers/ComplianceFrameworkMapper';

interface FrameworkDBRecord {
  id: number;
  name: string;
  type: string;
  version: string;
  description: string;
  scope: string | null;
  target_completion_date: string | null;
  certification_date: string | null;
  expiry_date: string | null;
  is_active: number;
  total_controls: number;
  implemented_controls: number;
  organization_id: number;
  owner_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export class D1ComplianceFrameworkRepository implements IComplianceFrameworkRepository {
  constructor(private db: D1Database) {}

  async findById(id: number, organizationId: number): Promise<ComplianceFramework | null> {
    const result = await this.db
      .prepare('SELECT * FROM compliance_frameworks WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .first<FrameworkDBRecord>();

    return result ? ComplianceFrameworkMapper.toDomain(result) : null;
  }

  async list(options: ListFrameworksOptions): Promise<{ frameworks: ComplianceFramework[]; total: number }> {
    // Build WHERE clauses
    const conditions: string[] = ['organization_id = ?'];
    const params: any[] = [options.organizationId];

    if (options.type) {
      conditions.push('type = ?');
      params.push(options.type);
    }

    if (options.isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(options.isActive ? 1 : 0);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM compliance_frameworks WHERE ${whereClause}`;
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
      SELECT * FROM compliance_frameworks 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const { results } = await this.db
      .prepare(selectQuery)
      .bind(...params, limit, offset)
      .all<FrameworkDBRecord>();

    return {
      frameworks: ComplianceFrameworkMapper.toDomainList(results),
      total
    };
  }

  async save(framework: ComplianceFramework): Promise<ComplianceFramework> {
    const data = ComplianceFrameworkMapper.toPersistence(framework);
    
    const result = await this.db
      .prepare(`
        INSERT INTO compliance_frameworks (
          name, type, version, description, scope,
          target_completion_date, certification_date, expiry_date,
          is_active, total_controls, implemented_controls,
          organization_id, owner_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.name, data.type, data.version, data.description, data.scope,
        data.target_completion_date, data.certification_date, data.expiry_date,
        data.is_active, data.total_controls, data.implemented_controls,
        data.organization_id, data.owner_id, data.created_by
      )
      .run();

    const id = result.meta.last_row_id as number;
    const saved = await this.findById(id, framework.organizationId);
    if (!saved) {
      throw new Error('Failed to retrieve saved framework');
    }
    return saved;
  }

  async update(framework: ComplianceFramework): Promise<ComplianceFramework> {
    const data = ComplianceFrameworkMapper.toPersistence(framework);

    await this.db
      .prepare(`
        UPDATE compliance_frameworks SET
          name = ?, type = ?, version = ?, description = ?, scope = ?,
          target_completion_date = ?, certification_date = ?, expiry_date = ?,
          is_active = ?, total_controls = ?, implemented_controls = ?,
          owner_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND organization_id = ?
      `)
      .bind(
        data.name, data.type, data.version, data.description, data.scope,
        data.target_completion_date, data.certification_date, data.expiry_date,
        data.is_active, data.total_controls, data.implemented_controls,
        data.owner_id, framework.id, framework.organizationId
      )
      .run();

    const updated = await this.findById(framework.id, framework.organizationId);
    if (!updated) {
      throw new Error('Failed to retrieve updated framework');
    }
    return updated;
  }

  async delete(id: number, organizationId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM compliance_frameworks WHERE id = ? AND organization_id = ?')
      .bind(id, organizationId)
      .run();
  }

  async getStatistics(organizationId: number): Promise<any> {
    // Simplified statistics
    const totalResult = await this.db
      .prepare('SELECT COUNT(*) as total FROM compliance_frameworks WHERE organization_id = ?')
      .bind(organizationId)
      .first<{ total: number }>();

    return {
      total: totalResult?.total ?? 0,
      byType: {},
      certified: 0,
      expired: 0,
      averageCompletion: 0
    };
  }

  async findByType(organizationId: number, type: FrameworkType): Promise<ComplianceFramework[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM compliance_frameworks WHERE organization_id = ? AND type = ?')
      .bind(organizationId, type)
      .all<FrameworkDBRecord>();

    return ComplianceFrameworkMapper.toDomainList(results);
  }

  async findActive(organizationId: number): Promise<ComplianceFramework[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM compliance_frameworks WHERE organization_id = ? AND is_active = 1')
      .bind(organizationId)
      .all<FrameworkDBRecord>();

    return ComplianceFrameworkMapper.toDomainList(results);
  }
}
