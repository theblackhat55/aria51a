/**
 * Risk UI Routes - /risk-v2/ui/* endpoints
 * 
 * HTMX-powered UI routes that serve HTML templates
 * Follows ARIA5 design patterns
 */

import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { getCookie } from 'hono/cookie';

// Layout
import { cleanLayout } from '../../../../templates/layout-clean';

// Templates
import {
  renderRiskManagementPage,
  renderRiskStatistics,
  renderRiskTable,
  renderCreateRiskModal,
  renderViewRiskModal,
  renderEditRiskModal,
  renderStatusChangeModal,
  renderImportRisksModal,
  renderRiskScoreDisplay,
  type RiskStatistics,
  type RiskRow
} from '../templates';

// Application handlers
import { ListRisksHandler } from '../../application/handlers/ListRisksHandler';
import { GetRiskStatisticsHandler } from '../../application/handlers/GetRiskStatisticsHandler';
import { GetRiskByIdHandler } from '../../application/handlers/GetRiskByIdHandler';
import { ListRisksQuery } from '../../application/queries/ListRisksQuery';
import { GetRiskStatisticsQuery } from '../../application/queries/GetRiskStatisticsQuery';
import { GetRiskByIdQuery } from '../../application/queries/GetRiskByIdQuery';

// Infrastructure
import { D1RiskRepository } from '../../infrastructure/repositories/D1RiskRepository';

// Types
interface CloudflareBindings {
  DB: D1Database;
}

/**
 * Create Risk UI Routes
 * 
 * @returns Hono app with all /risk-v2/ui/* routes
 */
/**
 * Helper function to fetch owner name from users table
 */
async function getOwnerName(db: D1Database, ownerId: number | null): Promise<string | undefined> {
  if (!ownerId) return undefined;
  
  try {
    const result = await db
      .prepare('SELECT first_name, last_name FROM users WHERE id = ?')
      .bind(ownerId)
      .first();
    
    if (result) {
      const firstName = (result as any).first_name || '';
      const lastName = (result as any).last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Unknown User';
    }
  } catch (error) {
    console.error(`Error fetching owner name for ID ${ownerId}:`, error);
  }
  
  return undefined;
}

export function createRiskUIRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // ===== Main Page =====

  /**
   * GET /risk-v2/ui and /risk-v2/ui/
   * Main risk management page
   */
  app.get('/', async (c) => {
    // Get user from aria_user cookie (stored by login)
    const userCookie = getCookie(c, 'aria_user');
    let user = null;
    
    if (userCookie) {
      try {
        user = JSON.parse(decodeURIComponent(userCookie));
      } catch (e) {
        console.error('Failed to parse user cookie:', e);
      }
    }
    
    // Wrap the risk management page in the cleanLayout
    return c.html(
      cleanLayout({
        title: 'Risk Management v2',
        content: renderRiskManagementPage(),
        user: user
      })
    );
  });

  // ===== HTMX Endpoints =====

  /**
   * GET /risk-v2/ui/stats
   * Statistics cards (HTMX endpoint)
   */
  app.get('/stats', async (c) => {
    try {
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskStatisticsHandler(repository);
      const query = new GetRiskStatisticsQuery();
      
      const stats = await handler.execute(query);
      
      return c.html(renderRiskStatistics(stats as RiskStatistics));
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      // Return fallback stats
      const fallbackStats: RiskStatistics = {
        total: 0,
        byStatus: {},
        byLevel: { low: 0, medium: 0, high: 0, critical: 0 },
        byCategory: {},
        averageScore: 0,
        activeCount: 0,
        closedCount: 0,
        reviewOverdueCount: 0
      };
      return c.html(renderRiskStatistics(fallbackStats));
    }
  });

  /**
   * GET /risk-v2/ui/table
   * Risk table with filters (HTMX endpoint)
   */
  app.get('/table', async (c) => {
    try {
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new ListRisksHandler(repository);
      
      // Parse query parameters
      const search = c.req.query('search');
      const status = c.req.query('status');
      const category = c.req.query('category');
      const riskLevel = c.req.query('riskLevel');
      const sortBy = c.req.query('sortBy') || 'createdAt';
      const sortOrder = c.req.query('sortOrder') || 'desc';
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      
      // Build query
      const queryParams: any = {
        page,
        limit,
        sortBy,
        sortOrder
      };
      
      if (search) queryParams.search = search;
      if (status) queryParams.status = status;
      if (category) queryParams.category = category;
      if (riskLevel) queryParams.riskLevel = riskLevel;
      
      const query = new ListRisksQuery(queryParams);
      const result = await handler.execute(query);
      
      // Fetch owner names from users table
      const ownerIds = [...new Set(result.items.map(item => item.ownerId).filter(id => id !== null))];
      const ownerMap = new Map<number, string>();
      
      if (ownerIds.length > 0) {
        const placeholders = ownerIds.map(() => '?').join(',');
        const ownerQuery = `SELECT id, first_name, last_name FROM users WHERE id IN (${placeholders})`;
        const ownersResult = await c.env.DB.prepare(ownerQuery).bind(...ownerIds).all();
        
        if (ownersResult.success && ownersResult.results) {
          ownersResult.results.forEach((owner: any) => {
            const fullName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
            ownerMap.set(owner.id, fullName || 'Unknown User');
          });
        }
      }
      
      // Convert to RiskRow format
      const risks: RiskRow[] = result.items.map(item => ({
        id: item.id,
        riskId: item.riskId,
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
        probability: item.probability,
        impact: item.impact,
        riskScore: item.riskScore,
        riskLevel: item.riskLevel,
        organizationId: item.organizationId,
        ownerId: item.ownerId,
        ownerName: item.ownerId ? ownerMap.get(item.ownerId) : undefined,
        reviewDate: item.reviewDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      return c.html(renderRiskTable(risks));
    } catch (error: any) {
      console.error('Error fetching risks:', error);
      return c.html(renderRiskTable([]));
    }
  });

  /**
   * GET /risk-v2/ui/create
   * Create risk modal (HTMX endpoint)
   */
  app.get('/create', async (c) => {
    return c.html(renderCreateRiskModal());
  });

  /**
   * GET /risk-v2/ui/view/:id
   * View risk modal (HTMX endpoint)
   */
  app.get('/view/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskByIdHandler(repository);
      const query = new GetRiskByIdQuery(id);
      
      const risk = await handler.execute(query);
      
      if (!risk) {
        return c.html('<div class="p-6 text-center text-red-600">Risk not found</div>');
      }
      
      // Fetch owner name
      const ownerName = await getOwnerName(c.env.DB, risk.ownerId);
      
      // Convert to RiskRow format
      const riskRow: RiskRow = {
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        ownerName: ownerName,
        reviewDate: risk.reviewDate,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      };
      
      return c.html(renderViewRiskModal(riskRow));
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.html('<div class="p-6 text-center text-red-600">Error loading risk details</div>');
    }
  });

  /**
   * GET /risk-v2/ui/edit/:id
   * Edit risk modal (HTMX endpoint)
   */
  app.get('/edit/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskByIdHandler(repository);
      const query = new GetRiskByIdQuery(id);
      
      const risk = await handler.execute(query);
      
      if (!risk) {
        return c.html('<div class="p-6 text-center text-red-600">Risk not found</div>');
      }
      
      // Fetch owner name
      const ownerName = await getOwnerName(c.env.DB, risk.ownerId);
      
      // Convert to RiskRow format
      const riskRow: RiskRow = {
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        ownerName: ownerName,
        reviewDate: risk.reviewDate,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      };
      
      return c.html(renderEditRiskModal(riskRow));
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.html('<div class="p-6 text-center text-red-600">Error loading risk for editing</div>');
    }
  });

  /**
   * GET /risk-v2/ui/status/:id
   * Change status modal (HTMX endpoint)
   */
  app.get('/status/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskByIdHandler(repository);
      const query = new GetRiskByIdQuery(id);
      
      const risk = await handler.execute(query);
      
      if (!risk) {
        return c.html('<div class="p-6 text-center text-red-600">Risk not found</div>');
      }
      
      // Fetch owner name
      const ownerName = await getOwnerName(c.env.DB, risk.ownerId);
      
      // Convert to RiskRow format
      const riskRow: RiskRow = {
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        ownerName: ownerName,
        reviewDate: risk.reviewDate,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      };
      
      return c.html(renderStatusChangeModal(riskRow));
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.html('<div class="p-6 text-center text-red-600">Error loading risk for status change</div>');
    }
  });

  /**
   * POST /risk-v2/ui/calculate-score
   * Calculate risk score (HTMX endpoint for live calculation)
   */
  app.post('/calculate-score', async (c) => {
    try {
      const body = await c.req.parseBody();
      const probability = parseInt(body.probability as string) || 0;
      const impact = parseInt(body.impact as string) || 0;
      
      if (!probability || !impact) {
        return c.html(`
          <input type="text" 
                 value="TBD" 
                 readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
        `);
      }
      
      return c.html(renderRiskScoreDisplay(probability, impact));
    } catch (error: any) {
      console.error('Error calculating score:', error);
      return c.html(`
        <input type="text" 
               value="Error" 
               readonly
               class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-red-600">
      `);
    }
  });

  /**
   * GET /risk-v2/ui/import
   * Import modal
   */
  app.get('/import', async (c) => {
    return c.html(renderImportRisksModal());
  });

  /**
   * GET /risk-v2/ui/import/template
   * Download CSV template
   */
  app.get('/import/template', async (c) => {
    const template = `risk_id,title,description,category,subcategory,probability,impact,status,owner_id,organization_id,review_date,source,tags,mitigation_plan
RISK-SAMPLE-001,Sample Risk 1,This is a sample risk for testing import,cybersecurity,data_breach,4,5,active,1,1,2025-02-28,Import Template,"security,high-priority","Implement MFA and encryption"
RISK-SAMPLE-002,Sample Risk 2,Another sample risk entry,operational,insider_threat,3,4,monitoring,2,1,2025-03-15,Import Template,"internal,monitoring","Regular audits and access reviews"`;
    
    return c.body(template, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="risk_import_template.csv"'
    });
  });

  /**
   * POST /risk-v2/ui/import
   * Handle CSV import
   */
  app.post('/import', async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const skipDuplicates = formData.get('skipDuplicates') === 'true';
      const validateOnly = formData.get('validateOnly') === 'true';

      if (!file) {
        return c.html(`
          <div class="p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-red-800"><i class="fas fa-exclamation-circle mr-2"></i>No file uploaded</p>
          </div>
        `);
      }

      // Read CSV content
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 2) {
        return c.html(`
          <div class="p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-red-800"><i class="fas fa-exclamation-circle mr-2"></i>CSV file is empty or invalid</p>
          </div>
        `);
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredColumns = ['risk_id', 'title', 'description', 'category', 'probability', 'impact', 'status'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        return c.html(`
          <div class="p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-red-800"><i class="fas fa-exclamation-circle mr-2"></i>Missing required columns: ${missingColumns.join(', ')}</p>
          </div>
        `);
      }

      // Parse rows
      const risks = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });

        // Validate required fields
        if (!row.risk_id || !row.title || !row.description) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Validate probability and impact
        const probability = parseInt(row.probability);
        const impact = parseInt(row.impact);
        
        if (isNaN(probability) || probability < 1 || probability > 5) {
          errors.push(`Row ${i + 1}: Invalid probability (must be 1-5)`);
          continue;
        }
        
        if (isNaN(impact) || impact < 1 || impact > 5) {
          errors.push(`Row ${i + 1}: Invalid impact (must be 1-5)`);
          continue;
        }

        risks.push({
          risk_id: row.risk_id,
          title: row.title,
          description: row.description,
          category: row.category,
          subcategory: row.subcategory || null,
          probability,
          impact,
          status: row.status || 'active',
          owner_id: row.owner_id ? parseInt(row.owner_id) : null,
          organization_id: row.organization_id ? parseInt(row.organization_id) : 1,
          review_date: row.review_date || null,
          source: row.source || 'CSV Import',
          tags: row.tags || null,
          mitigation_plan: row.mitigation_plan || null
        });
      }

      // Return validation results
      if (validateOnly) {
        return c.html(`
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 class="font-medium text-blue-900 mb-2">Validation Results</h4>
            <p class="text-blue-800">✓ ${risks.length} valid risks found</p>
            ${errors.length > 0 ? `<p class="text-red-600 mt-2">✗ ${errors.length} errors found:</p><ul class="list-disc ml-6 text-sm text-red-600">${errors.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
          </div>
        `);
      }

      // Insert risks into database
      let inserted = 0;
      let skipped = 0;
      const insertErrors = [];

      for (const risk of risks) {
        try {
          // Check for duplicates
          if (skipDuplicates) {
            const existing = await c.env.DB
              .prepare('SELECT id FROM risks WHERE risk_id = ?')
              .bind(risk.risk_id)
              .first();
            
            if (existing) {
              skipped++;
              continue;
            }
          }

          // Insert risk
          await c.env.DB
            .prepare(`
              INSERT INTO risks (
                risk_id, title, description, category, subcategory,
                probability, impact, status, owner_id, organization_id,
                review_date, source, tags, mitigation_plan, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              risk.risk_id, risk.title, risk.description, risk.category, risk.subcategory,
              risk.probability, risk.impact, risk.status, risk.owner_id, risk.organization_id,
              risk.review_date, risk.source, risk.tags, risk.mitigation_plan, 1
            )
            .run();
          
          inserted++;
        } catch (error: any) {
          insertErrors.push(`${risk.risk_id}: ${error.message}`);
        }
      }

      // Return results
      return c.html(`
        <div class="space-y-3">
          <div class="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 class="font-medium text-green-900 mb-2">
              <i class="fas fa-check-circle mr-2"></i>Import Completed
            </h4>
            <p class="text-green-800">✓ ${inserted} risks imported successfully</p>
            ${skipped > 0 ? `<p class="text-yellow-600">⊘ ${skipped} duplicates skipped</p>` : ''}
            ${errors.length > 0 ? `<p class="text-red-600">✗ ${errors.length} validation errors</p>` : ''}
            ${insertErrors.length > 0 ? `<p class="text-red-600">✗ ${insertErrors.length} import errors</p>` : ''}
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''; window.location.reload();"
                  class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            <i class="fas fa-sync mr-2"></i>Refresh Page
          </button>
        </div>
      `);

    } catch (error: any) {
      console.error('Import error:', error);
      return c.html(`
        <div class="p-4 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-800"><i class="fas fa-exclamation-circle mr-2"></i>Import failed: ${error.message}</p>
        </div>
      `);
    }
  });

  /**
   * POST /risk-v2/ui/export
   * Export risks to CSV
   */
  app.post('/export', async (c) => {
    try {
      const formData = await c.req.formData();
      const format = formData.get('format') || 'csv';
      const status = formData.get('status') as string | null;
      const category = formData.get('category') as string | null;
      const riskLevel = formData.get('riskLevel') as string | null;

      // Build query
      let query = 'SELECT * FROM risks WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      
      query += ' ORDER BY created_at DESC';

      // Fetch risks
      const result = await c.env.DB.prepare(query).bind(...params).all();
      const risks = result.results || [];

      // Filter by risk level if specified
      let filteredRisks = risks;
      if (riskLevel) {
        filteredRisks = risks.filter((risk: any) => {
          const score = risk.probability * risk.impact;
          const level = score >= 20 ? 'Critical' : score >= 12 ? 'High' : score >= 6 ? 'Medium' : 'Low';
          return level === riskLevel;
        });
      }

      // Generate CSV
      const headers = [
        'risk_id', 'title', 'description', 'category', 'subcategory',
        'probability', 'impact', 'risk_score', 'risk_level', 'status',
        'owner_id', 'organization_id', 'review_date', 'source', 'tags',
        'mitigation_plan', 'created_at', 'updated_at'
      ];

      const csvRows = [headers.join(',')];

      for (const risk of filteredRisks) {
        const row: any = risk;
        const score = row.probability * row.impact;
        const level = score >= 20 ? 'Critical' : score >= 12 ? 'High' : score >= 6 ? 'Medium' : 'Low';

        const values = [
          row.risk_id || '',
          `"${(row.title || '').replace(/"/g, '""')}"`,
          `"${(row.description || '').replace(/"/g, '""')}"`,
          row.category || '',
          row.subcategory || '',
          row.probability || '',
          row.impact || '',
          score,
          level,
          row.status || '',
          row.owner_id || '',
          row.organization_id || '',
          row.review_date || '',
          row.source || '',
          `"${(row.tags || '').replace(/"/g, '""')}"`,
          `"${(row.mitigation_plan || '').replace(/"/g, '""')}"`,
          row.created_at || '',
          row.updated_at || ''
        ];

        csvRows.push(values.join(','));
      }

      const csv = csvRows.join('\n');
      const filename = `risks_export_${new Date().toISOString().split('T')[0]}.csv`;

      return c.body(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      });

    } catch (error: any) {
      console.error('Export error:', error);
      return c.json({ 
        success: false, 
        message: `Export failed: ${error.message}` 
      }, 500);
    }
  });

  return app;
}
