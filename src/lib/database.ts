import { D1Database } from '@cloudflare/workers-types';
// import bcrypt from 'bcryptjs'; // Not compatible with Cloudflare Workers - removed

export class DatabaseService {
  constructor(private db: D1Database) {}

  // User operations
  async getUserByUsername(username: string) {
    const result = await this.db.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();
    return result;
  }

  async getUserById(id: number) {
    const result = await this.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first();
    return result;
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    // Simple comparison for demo purposes (in production, use proper hashing)
    // This is temporary until we implement Web API compatible password hashing
    return password === hash;
  }

  async updateLastLogin(userId: number) {
    await this.db.prepare(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?'
    ).bind(userId).run();
  }

  // Risk operations
  async getRisks(filters: any = {}) {
    let query = `
      SELECT r.*, u.first_name || ' ' || u.last_name as owner_name
      FROM risks r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }

    if (filters.category) {
      query += ' AND r.category = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY r.risk_score DESC, r.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async getRiskById(id: number) {
    const result = await this.db.prepare(`
      SELECT r.*, u.first_name || ' ' || u.last_name as owner_name
      FROM risks r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.id = ?
    `).bind(id).first();
    return result;
  }

  async createRisk(data: any, userId: number) {
    const result = await this.db.prepare(`
      INSERT INTO risks (
        title, description, category, owner_id, organization_id,
        probability, impact, status, review_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.title,
      data.description || '',
      data.category,
      data.owner_id || userId,
      data.organization_id || 1,
      data.probability || 3,
      data.impact || 3,
      data.status || 'active',
      data.review_date || null,
      userId
    ).run();
    
    return result.meta.last_row_id;
  }

  async updateRisk(id: number, data: any) {
    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (['title', 'description', 'category', 'probability', 'impact', 'status'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = datetime("now")');
    params.push(id);

    await this.db.prepare(`
      UPDATE risks SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return true;
  }

  async deleteRisk(id: number) {
    await this.db.prepare('DELETE FROM risks WHERE id = ?').bind(id).run();
    return true;
  }

  async getRiskStatistics() {
    const stats = await this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN risk_score >= 20 THEN 1 END) as critical,
        COUNT(CASE WHEN risk_score >= 15 AND risk_score < 20 THEN 1 END) as high,
        COUNT(CASE WHEN review_date < date('now') THEN 1 END) as overdue,
        AVG(risk_score) as avgScore
      FROM risks
      WHERE status = 'active'
    `).first();
    
    return stats;
  }

  // Compliance operations
  async getFrameworks() {
    const result = await this.db.prepare(`
      SELECT 
        cf.*,
        COUNT(DISTINCT fc.id) as controlCount,
        COALESCE(
          ROUND(
            COUNT(DISTINCT CASE WHEN s.implementation_status = 'implemented' THEN fc.id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT CASE WHEN s.is_applicable = 1 THEN fc.id END), 0)
          , 1), 0
        ) as compliance
      FROM compliance_frameworks cf
      LEFT JOIN framework_controls fc ON cf.id = fc.framework_id
      LEFT JOIN soa s ON fc.id = s.control_id
      GROUP BY cf.id
      ORDER BY cf.name
    `).all();
    
    return result.results;
  }

  async createFramework(data: any) {
    const result = await this.db.prepare(`
      INSERT INTO compliance_frameworks (name, version, description, regulatory_body)
      VALUES (?, ?, ?, ?)
    `).bind(
      data.name,
      data.version || '',
      data.description || '',
      data.regulatory_body || ''
    ).run();
    
    return result.meta.last_row_id;
  }

  async getFrameworkControls(frameworkId: number) {
    const result = await this.db.prepare(`
      SELECT 
        fc.*,
        s.is_applicable,
        s.implementation_status,
        s.justification,
        s.implementation_notes,
        (SELECT COUNT(*) FROM evidence WHERE control_ids LIKE '%' || fc.id || '%') as evidenceCount
      FROM framework_controls fc
      LEFT JOIN soa s ON fc.id = s.control_id
      WHERE fc.framework_id = ?
      ORDER BY fc.control_id
    `).bind(frameworkId).all();
    
    return result.results;
  }

  async updateSoAControl(controlId: number, organizationId: number, field: string, value: any) {
    // Check if SoA record exists
    const existing = await this.db.prepare(
      'SELECT id FROM soa WHERE control_id = ? AND organization_id = ?'
    ).bind(controlId, organizationId).first();

    if (existing) {
      // Update existing record
      await this.db.prepare(
        `UPDATE soa SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(value, existing.id).run();
    } else {
      // Create new record
      await this.db.prepare(`
        INSERT INTO soa (organization_id, control_id, ${field})
        VALUES (?, ?, ?)
      `).bind(organizationId, controlId, value).run();
    }

    return true;
  }

  // Evidence operations
  async getEvidence(filters: any = {}) {
    let query = `
      SELECT e.*, u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM evidence e
      LEFT JOIN users u ON e.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.type) {
      query += ' AND e.type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (e.name LIKE ? OR e.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async uploadEvidence(data: any, userId: number) {
    const result = await this.db.prepare(`
      INSERT INTO evidence (
        name, description, type, file_path, file_size,
        control_ids, risk_ids, uploaded_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description || '',
      data.type || 'document',
      data.file_path || '',
      data.file_size || 0,
      JSON.stringify(data.control_ids || []),
      JSON.stringify(data.risk_ids || []),
      userId,
      'pending'
    ).run();
    
    return result.meta.last_row_id;
  }

  // Assessment operations
  async getAssessments(organizationId: number) {
    const result = await this.db.prepare(`
      SELECT 
        ca.*,
        cf.name as framework_name,
        u.first_name || ' ' || u.last_name as assessor_name,
        (SELECT COUNT(*) FROM assessment_responses WHERE assessment_id = ca.id) as response_count
      FROM compliance_assessments ca
      LEFT JOIN compliance_frameworks cf ON ca.framework_id = cf.id
      LEFT JOIN users u ON ca.assessor_id = u.id
      WHERE ca.organization_id = ?
      ORDER BY ca.created_at DESC
    `).bind(organizationId).all();
    
    return result.results;
  }

  async createAssessment(data: any, userId: number) {
    const result = await this.db.prepare(`
      INSERT INTO compliance_assessments (
        name, framework_id, organization_id, assessor_id,
        status, start_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.framework_id,
      data.organization_id || 1,
      userId,
      'in_progress',
      new Date().toISOString().split('T')[0]
    ).run();
    
    return result.meta.last_row_id;
  }

  async getAssessmentById(id: number) {
    const result = await this.db.prepare(`
      SELECT 
        ca.*,
        cf.name as framework_name,
        u.first_name || ' ' || u.last_name as assessor_name
      FROM compliance_assessments ca
      LEFT JOIN compliance_frameworks cf ON ca.framework_id = cf.id
      LEFT JOIN users u ON ca.assessor_id = u.id
      WHERE ca.id = ?
    `).bind(id).first();
    
    return result;
  }

  // Incident operations
  async getIncidents(filters: any = {}) {
    let query = `
      SELECT 
        i.*,
        r.first_name || ' ' || r.last_name as reported_by_name,
        a.first_name || ' ' || a.last_name as assigned_to_name
      FROM incidents i
      LEFT JOIN users r ON i.reported_by = r.id
      LEFT JOIN users a ON i.assigned_to = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND i.status = ?';
      params.push(filters.status);
    }

    if (filters.severity) {
      query += ' AND i.severity = ?';
      params.push(filters.severity);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async createIncident(data: any, userId: number) {
    const result = await this.db.prepare(`
      INSERT INTO incidents (
        title, description, type, severity, status,
        risk_id, reported_by, assigned_to, organization_id,
        detection_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.title,
      data.description || '',
      data.type || 'security',
      data.severity || 'medium',
      'open',
      data.risk_id || null,
      userId,
      data.assigned_to || null,
      data.organization_id || 1,
      new Date().toISOString()
    ).run();
    
    return result.meta.last_row_id;
  }

  // Audit log operations
  async createAuditLog(userId: number, action: string, entityType: string, entityId: number, oldValues?: any, newValues?: any) {
    await this.db.prepare(`
      INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    ).run();
  }

  async getAuditLogs(filters: any = {}) {
    let query = `
      SELECT 
        al.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(filters.entity_type);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 100';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }
}