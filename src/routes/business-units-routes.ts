/**
 * Business Units and Services Management Routes
 * 
 * Native integration for:
 * - Business Units CRUD (Admin → Settings)
 * - Services Management (Operations → Service Management)
 * - Integration with Smart Assessment Wizard
 */

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';

type CloudflareBindings = {
  DB?: D1Database;
  AI?: any;
  R2?: R2Bucket;
};

export function createBusinessUnitsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);

  /**
   * BUSINESS UNITS MANAGEMENT
   * Admin → Settings → Business Units
   */
  
  // Business Units Management Page
  app.get('/settings/business-units', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(cleanLayout({
        title: 'Business Units',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Get all business units with hierarchical structure
      const businessUnitsResult = await db.prepare(`
        SELECT 
          bu.*,
          parent.name as parent_name,
          (SELECT COUNT(*) FROM business_unit_services bus WHERE bus.business_unit_id = bu.id) as service_count
        FROM business_units bu
        LEFT JOIN business_units parent ON bu.parent_id = parent.id
        ORDER BY bu.parent_id IS NULL DESC, bu.name
      `).all();
      
      const businessUnits = businessUnitsResult.results || [];

      return c.html(cleanLayout({
        title: 'Business Units Management',
        user,
        content: renderBusinessUnitsManagement(businessUnits)
      }));
    } catch (error) {
      console.error('Error loading business units:', error);
      return c.html(cleanLayout({
        title: 'Business Units Management',
        user,
        content: html`<div class="p-4 text-red-600">Error loading business units</div>`
      }));
    }
  });

  // Create Business Unit
  app.post('/settings/business-units/create', async (c) => {
    const db = c.env.DB;
    const formData = await c.req.parseBody();
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      const result = await db.prepare(`
        INSERT INTO business_units (
          name, description, parent_id, head_of_unit, email, phone, 
          location, risk_tolerance, compliance_requirements, 
          budget_allocation, employee_count, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        formData.name as string,
        formData.description as string || '',
        formData.parent_id ? parseInt(formData.parent_id as string) : null,
        formData.head_of_unit as string || '',
        formData.email as string || '',
        formData.phone as string || '',
        formData.location as string || '',
        formData.risk_tolerance as string || 'medium',
        formData.compliance_requirements as string || '[]',
        formData.budget_allocation ? parseFloat(formData.budget_allocation as string) : null,
        formData.employee_count ? parseInt(formData.employee_count as string) : 0,
        formData.status as string || 'active',
        c.get('user')?.id || 1
      ).run();

      return c.json({ 
        success: true, 
        id: result.meta.last_row_id,
        message: 'Business unit created successfully'
      });
    } catch (error) {
      console.error('Error creating business unit:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Update Business Unit
  app.post('/settings/business-units/:id/update', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const formData = await c.req.parseBody();
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      await db.prepare(`
        UPDATE business_units SET 
          name = ?, description = ?, parent_id = ?, head_of_unit = ?, 
          email = ?, phone = ?, location = ?, risk_tolerance = ?, 
          compliance_requirements = ?, budget_allocation = ?, 
          employee_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        formData.name as string,
        formData.description as string || '',
        formData.parent_id ? parseInt(formData.parent_id as string) : null,
        formData.head_of_unit as string || '',
        formData.email as string || '',
        formData.phone as string || '',
        formData.location as string || '',
        formData.risk_tolerance as string || 'medium',
        formData.compliance_requirements as string || '[]',
        formData.budget_allocation ? parseFloat(formData.budget_allocation as string) : null,
        formData.employee_count ? parseInt(formData.employee_count as string) : 0,
        formData.status as string || 'active',
        id
      ).run();

      return c.json({ 
        success: true, 
        message: 'Business unit updated successfully'
      });
    } catch (error) {
      console.error('Error updating business unit:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Delete Business Unit
  app.post('/settings/business-units/:id/delete', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      // Check if business unit has child units or services
      const childUnits = await db.prepare('SELECT COUNT(*) as count FROM business_units WHERE parent_id = ?').bind(id).first();
      const services = await db.prepare('SELECT COUNT(*) as count FROM business_unit_services WHERE business_unit_id = ?').bind(id).first();
      
      if (childUnits?.count > 0) {
        return c.json({ success: false, error: 'Cannot delete business unit with child units' });
      }
      
      if (services?.count > 0) {
        return c.json({ success: false, error: 'Cannot delete business unit with associated services' });
      }

      await db.prepare('DELETE FROM business_units WHERE id = ?').bind(id).run();
      
      return c.json({ 
        success: true, 
        message: 'Business unit deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting business unit:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Get Business Unit for editing
  app.get('/settings/business-units/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      const businessUnit = await db.prepare('SELECT * FROM business_units WHERE id = ?').bind(id).first();
      
      if (!businessUnit) {
        return c.json({ success: false, error: 'Business unit not found' });
      }

      return c.json({ success: true, data: businessUnit });
    } catch (error) {
      console.error('Error fetching business unit:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  /**
   * SERVICES MANAGEMENT
   * Operations → Service Management
   */
  
  // Services Management Page
  app.get('/operations/services', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(cleanLayout({
        title: 'Service Management',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Get all services with business unit and owner information
      const servicesResult = await db.prepare(`
        SELECT 
          s.*,
          bu.name as business_unit_name,
          owner.username as owner_name,
          tech.username as technical_contact_name,
          (SELECT COUNT(*) FROM service_dependencies WHERE service_id = s.id) as dependency_count
        FROM services s
        LEFT JOIN business_units bu ON s.business_unit_id = bu.id
        LEFT JOIN users owner ON s.owner_id = owner.id
        LEFT JOIN users tech ON s.technical_contact_id = tech.id
        ORDER BY s.criticality DESC, s.name
      `).all();
      
      const services = servicesResult.results || [];

      // Get business units for dropdown
      const businessUnitsResult = await db.prepare('SELECT id, name FROM business_units WHERE status = ? ORDER BY name').bind('active').all();
      const businessUnits = businessUnitsResult.results || [];

      // Get users for owner dropdowns
      const usersResult = await db.prepare('SELECT id, username, first_name, last_name FROM users WHERE is_active = 1 ORDER BY username').all();
      const users = usersResult.results || [];

      return c.html(cleanLayout({
        title: 'Service Management',
        user,
        content: renderServicesManagement(services, businessUnits, users)
      }));
    } catch (error) {
      console.error('Error loading services:', error);
      return c.html(cleanLayout({
        title: 'Service Management',
        user,
        content: html`<div class="p-4 text-red-600">Error loading services</div>`
      }));
    }
  });

  // Create Service
  app.post('/operations/services/create', async (c) => {
    const db = c.env.DB;
    const formData = await c.req.parseBody();
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      const result = await db.prepare(`
        INSERT INTO services (
          name, description, service_type, criticality, availability_requirement,
          business_unit_id, owner_id, technical_contact_id, vendor, version,
          environment, data_classification, compliance_frameworks, risk_score,
          last_assessment_date, next_assessment_due, backup_frequency,
          recovery_time_objective, recovery_point_objective, monitoring_enabled,
          documentation_url, runbook_url, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        formData.name as string,
        formData.description as string || '',
        formData.service_type as string || 'application',
        formData.criticality as string || 'medium',
        formData.availability_requirement as string || '99%',
        formData.business_unit_id ? parseInt(formData.business_unit_id as string) : null,
        formData.owner_id ? parseInt(formData.owner_id as string) : null,
        formData.technical_contact_id ? parseInt(formData.technical_contact_id as string) : null,
        formData.vendor as string || '',
        formData.version as string || '',
        formData.environment as string || 'production',
        formData.data_classification as string || 'internal',
        formData.compliance_frameworks as string || '[]',
        formData.risk_score ? parseFloat(formData.risk_score as string) : 0.00,
        formData.last_assessment_date as string || null,
        formData.next_assessment_due as string || null,
        formData.backup_frequency as string || '',
        formData.recovery_time_objective ? parseInt(formData.recovery_time_objective as string) : null,
        formData.recovery_point_objective ? parseInt(formData.recovery_point_objective as string) : null,
        formData.monitoring_enabled === 'true' ? 1 : 0,
        formData.documentation_url as string || '',
        formData.runbook_url as string || '',
        formData.status as string || 'active',
        c.get('user')?.id || 1
      ).run();

      return c.json({ 
        success: true, 
        id: result.meta.last_row_id,
        message: 'Service created successfully'
      });
    } catch (error) {
      console.error('Error creating service:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Update Service
  app.post('/operations/services/:id/update', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const formData = await c.req.parseBody();
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      await db.prepare(`
        UPDATE services SET 
          name = ?, description = ?, service_type = ?, criticality = ?, 
          availability_requirement = ?, business_unit_id = ?, owner_id = ?, 
          technical_contact_id = ?, vendor = ?, version = ?, environment = ?, 
          data_classification = ?, compliance_frameworks = ?, risk_score = ?,
          last_assessment_date = ?, next_assessment_due = ?, backup_frequency = ?,
          recovery_time_objective = ?, recovery_point_objective = ?, 
          monitoring_enabled = ?, documentation_url = ?, runbook_url = ?, 
          status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        formData.name as string,
        formData.description as string || '',
        formData.service_type as string || 'application',
        formData.criticality as string || 'medium',
        formData.availability_requirement as string || '99%',
        formData.business_unit_id ? parseInt(formData.business_unit_id as string) : null,
        formData.owner_id ? parseInt(formData.owner_id as string) : null,
        formData.technical_contact_id ? parseInt(formData.technical_contact_id as string) : null,
        formData.vendor as string || '',
        formData.version as string || '',
        formData.environment as string || 'production',
        formData.data_classification as string || 'internal',
        formData.compliance_frameworks as string || '[]',
        formData.risk_score ? parseFloat(formData.risk_score as string) : 0.00,
        formData.last_assessment_date as string || null,
        formData.next_assessment_due as string || null,
        formData.backup_frequency as string || '',
        formData.recovery_time_objective ? parseInt(formData.recovery_time_objective as string) : null,
        formData.recovery_point_objective ? parseInt(formData.recovery_point_objective as string) : null,
        formData.monitoring_enabled === 'true' ? 1 : 0,
        formData.documentation_url as string || '',
        formData.runbook_url as string || '',
        formData.status as string || 'active',
        id
      ).run();

      return c.json({ 
        success: true, 
        message: 'Service updated successfully'
      });
    } catch (error) {
      console.error('Error updating service:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Delete Service
  app.post('/operations/services/:id/delete', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      // Check if service has dependencies
      const dependencies = await db.prepare('SELECT COUNT(*) as count FROM service_dependencies WHERE service_id = ? OR depends_on_service_id = ?').bind(id, id).first();
      
      if (dependencies?.count > 0) {
        return c.json({ success: false, error: 'Cannot delete service with dependencies. Remove dependencies first.' });
      }

      await db.prepare('DELETE FROM services WHERE id = ?').bind(id).run();
      
      return c.json({ 
        success: true, 
        message: 'Service deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Get Service for editing
  app.get('/operations/services/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      const service = await db.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
      
      if (!service) {
        return c.json({ success: false, error: 'Service not found' });
      }

      return c.json({ success: true, data: service });
    } catch (error) {
      console.error('Error fetching service:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  /**
   * API ENDPOINTS FOR ASSESSMENT INTEGRATION
   */
  
  // Get Business Units for Assessment Wizard
  app.get('/api/business-units', async (c) => {
    const db = c.env.DB;
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      const result = await db.prepare(`
        SELECT id, name, description, head_of_unit, risk_tolerance, status
        FROM business_units 
        WHERE status = 'active' 
        ORDER BY name
      `).all();

      return c.json({ success: true, data: result.results || [] });
    } catch (error) {
      console.error('Error fetching business units:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  // Get Services for Assessment Wizard
  app.get('/api/services', async (c) => {
    const db = c.env.DB;
    
    if (!db) {
      return c.json({ success: false, error: 'Database not available' });
    }

    try {
      const result = await db.prepare(`
        SELECT 
          s.id, s.name, s.description, s.service_type, s.criticality, 
          s.data_classification, s.compliance_frameworks, s.status,
          bu.name as business_unit_name
        FROM services s
        LEFT JOIN business_units bu ON s.business_unit_id = bu.id
        WHERE s.status = 'active' 
        ORDER BY s.criticality DESC, s.name
      `).all();

      return c.json({ success: true, data: result.results || [] });
    } catch (error) {
      console.error('Error fetching services:', error);
      return c.json({ success: false, error: error.message });
    }
  });

  return app;
}

/**
 * RENDER FUNCTIONS
 */

// Business Units Management Interface
function renderBusinessUnitsManagement(businessUnits: any[]) {
  return html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Business Units Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage organizational structure and business unit hierarchy</p>
        </div>
        <button onclick="openBusinessUnitModal()" 
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>
          Add Business Unit
        </button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-building text-blue-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Units</p>
              <p class="text-3xl font-bold text-gray-900">${businessUnits.length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Active Units</p>
              <p class="text-3xl font-bold text-gray-900">${businessUnits.filter(bu => bu.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-sitemap text-purple-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Parent Units</p>
              <p class="text-3xl font-bold text-gray-900">${businessUnits.filter(bu => !bu.parent_id).length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-cogs text-orange-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Services</p>
              <p class="text-3xl font-bold text-gray-900">${businessUnits.reduce((sum, bu) => sum + (bu.service_count || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Business Units Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Business Units</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Tolerance</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${businessUnits.length === 0 ? html`
                <tr>
                  <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-building text-gray-300 text-3xl mb-2"></i>
                    <div>No business units found. Create your first business unit above.</div>
                  </td>
                </tr>
              ` : raw(businessUnits.map((bu: any) => {
                const statusColor = bu.status === 'active' ? 'bg-green-100 text-green-800' : 
                                   bu.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                                   'bg-yellow-100 text-yellow-800';
                const riskColor = bu.risk_tolerance === 'low' ? 'text-green-600' :
                                  bu.risk_tolerance === 'medium' ? 'text-yellow-600' : 
                                  'text-red-600';
                
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900">${bu.name}</div>
                        <div class="text-sm text-gray-500">${bu.description || ''}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${bu.parent_name || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">${bu.head_of_unit || '-'}</div>
                      <div class="text-sm text-gray-500">${bu.email || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium ${riskColor}">${bu.risk_tolerance || 'medium'}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${bu.service_count || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                        ${bu.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button onclick="editBusinessUnit(${bu.id})" class="text-blue-600 hover:text-blue-900">
                          <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button onclick="deleteBusinessUnit(${bu.id}, '${bu.name}')" class="text-red-600 hover:text-red-900">
                          <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join(''))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Business Unit Modal -->
    <div id="businessUnitModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div class="flex justify-between items-center p-6 border-b">
          <h3 id="modalTitle" class="text-lg font-semibold text-gray-900">Add Business Unit</h3>
          <button onclick="closeBusinessUnitModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="businessUnitForm" class="p-6 space-y-4">
          <input type="hidden" id="businessUnitId" name="id" value="">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input type="text" id="name" name="name" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Parent Unit</label>
              <select id="parent_id" name="parent_id"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">None (Top Level)</option>
                ${businessUnits.filter(bu => bu.status === 'active').map(bu => 
                  `<option value="${bu.id}">${bu.name}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea id="description" name="description" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Head of Unit</label>
              <input type="text" id="head_of_unit" name="head_of_unit"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" id="email" name="email"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input type="tel" id="phone" name="phone"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input type="text" id="location" name="location"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
              <select id="risk_tolerance" name="risk_tolerance"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Employee Count</label>
              <input type="number" id="employee_count" name="employee_count" min="0"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select id="status" name="status"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="restructuring">Restructuring</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Budget Allocation</label>
            <input type="number" id="budget_allocation" name="budget_allocation" step="0.01" min="0"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </form>
        
        <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button type="button" onclick="closeBusinessUnitModal()"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onclick="saveBusinessUnit()"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <i class="fas fa-save mr-2"></i>
            <span id="saveButtonText">Save Business Unit</span>
          </button>
        </div>
      </div>
    </div>

    <script>
      let editingBusinessUnitId = null;

      function openBusinessUnitModal(isEdit = false) {
        document.getElementById('businessUnitModal').classList.remove('hidden');
        document.getElementById('modalTitle').textContent = isEdit ? 'Edit Business Unit' : 'Add Business Unit';
        document.getElementById('saveButtonText').textContent = isEdit ? 'Update Business Unit' : 'Save Business Unit';
        if (!isEdit) {
          document.getElementById('businessUnitForm').reset();
          editingBusinessUnitId = null;
        }
      }

      function closeBusinessUnitModal() {
        document.getElementById('businessUnitModal').classList.add('hidden');
        editingBusinessUnitId = null;
      }

      async function editBusinessUnit(id) {
        editingBusinessUnitId = id;
        
        try {
          const response = await fetch(\`/admin/settings/business-units/\${id}\`);
          const result = await response.json();
          
          if (result.success) {
            const bu = result.data;
            document.getElementById('businessUnitId').value = bu.id;
            document.getElementById('name').value = bu.name;
            document.getElementById('description').value = bu.description || '';
            document.getElementById('parent_id').value = bu.parent_id || '';
            document.getElementById('head_of_unit').value = bu.head_of_unit || '';
            document.getElementById('email').value = bu.email || '';
            document.getElementById('phone').value = bu.phone || '';
            document.getElementById('location').value = bu.location || '';
            document.getElementById('risk_tolerance').value = bu.risk_tolerance || 'medium';
            document.getElementById('employee_count').value = bu.employee_count || '';
            document.getElementById('budget_allocation').value = bu.budget_allocation || '';
            document.getElementById('status').value = bu.status || 'active';
            
            openBusinessUnitModal(true);
          } else {
            alert('Error loading business unit: ' + result.error);
          }
        } catch (error) {
          alert('Error loading business unit: ' + error.message);
        }
      }

      async function saveBusinessUnit() {
        const form = document.getElementById('businessUnitForm');
        const formData = new FormData(form);
        
        const url = editingBusinessUnitId 
          ? \`/admin/settings/business-units/\${editingBusinessUnitId}/update\`
          : '/admin/settings/business-units/create';
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            closeBusinessUnitModal();
            location.reload(); // Reload to show changes
          } else {
            alert('Error saving business unit: ' + result.error);
          }
        } catch (error) {
          alert('Error saving business unit: ' + error.message);
        }
      }

      async function deleteBusinessUnit(id, name) {
        if (!confirm(\`Are you sure you want to delete the business unit "\${name}"? This action cannot be undone.\`)) {
          return;
        }
        
        try {
          const response = await fetch(\`/admin/settings/business-units/\${id}/delete\`, {
            method: 'POST'
          });
          
          const result = await response.json();
          
          if (result.success) {
            location.reload(); // Reload to show changes
          } else {
            alert('Error deleting business unit: ' + result.error);
          }
        } catch (error) {
          alert('Error deleting business unit: ' + error.message);
        }
      }
    </script>
  `;
}

// Services Management Interface
function renderServicesManagement(services: any[], businessUnits: any[], users: any[]) {
  return html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Service Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage IT services and system infrastructure</p>
        </div>
        <button onclick="openServiceModal()" 
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>
          Add Service
        </button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-server text-blue-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Services</p>
              <p class="text-3xl font-bold text-gray-900">${services.length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Critical</p>
              <p class="text-3xl font-bold text-gray-900">${services.filter(s => s.criticality === 'critical').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-fire text-orange-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">High</p>
              <p class="text-3xl font-bold text-gray-900">${services.filter(s => s.criticality === 'high').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Active</p>
              <p class="text-3xl font-bold text-gray-900">${services.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-sitemap text-purple-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Dependencies</p>
              <p class="text-3xl font-bold text-gray-900">${services.reduce((sum, s) => sum + (s.dependency_count || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Services Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Services</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${services.length === 0 ? html`
                <tr>
                  <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-server text-gray-300 text-3xl mb-2"></i>
                    <div>No services found. Create your first service above.</div>
                  </td>
                </tr>
              ` : raw(services.map((service: any) => {
                const criticalityColors = {
                  'critical': 'bg-red-100 text-red-800',
                  'high': 'bg-orange-100 text-orange-800',
                  'medium': 'bg-yellow-100 text-yellow-800',
                  'low': 'bg-green-100 text-green-800'
                };
                const statusColor = service.status === 'active' ? 'bg-green-100 text-green-800' : 
                                   service.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                                   'bg-yellow-100 text-yellow-800';
                
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900">${service.name}</div>
                        <div class="text-sm text-gray-500">${service.description || ''}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${service.service_type}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${criticalityColors[service.criticality] || 'bg-gray-100 text-gray-800'}">
                        ${service.criticality}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${service.business_unit_name || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${service.owner_name || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                        ${service.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button onclick="editService(${service.id})" class="text-blue-600 hover:text-blue-900">
                          <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button onclick="deleteService(${service.id}, '${service.name}')" class="text-red-600 hover:text-red-900">
                          <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join(''))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Service Modal -->
    <div id="serviceModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center p-6 border-b">
          <h3 id="serviceModalTitle" class="text-lg font-semibold text-gray-900">Add Service</h3>
          <button onclick="closeServiceModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="serviceForm" class="p-6 space-y-4">
          <input type="hidden" id="serviceId" name="id" value="">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
              <input type="text" id="serviceName" name="name" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select id="serviceType" name="service_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="application">Application</option>
                <option value="database">Database</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="network">Network</option>
                <option value="security">Security</option>
                <option value="backup">Backup</option>
                <option value="monitoring">Monitoring</option>
                <option value="communication">Communication</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea id="serviceDescription" name="description" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Criticality *</label>
              <select id="criticality" name="criticality" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select id="availability_requirement" name="availability_requirement"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="99%">99%</option>
                <option value="99.5%">99.5%</option>
                <option value="99.9%">99.9%</option>
                <option value="99.95%">99.95%</option>
                <option value="99.99%">99.99%</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Environment</label>
              <select id="environment" name="environment"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="production" selected>Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Business Unit</label>
              <select id="business_unit_id" name="business_unit_id"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Business Unit</option>
                ${businessUnits.map(bu => 
                  `<option value="${bu.id}">${bu.name}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Owner</label>
              <select id="owner_id" name="owner_id"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Owner</option>
                ${users.map(user => 
                  `<option value="${user.id}">${user.username} (${user.first_name} ${user.last_name})</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Technical Contact</label>
              <select id="technical_contact_id" name="technical_contact_id"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Contact</option>
                ${users.map(user => 
                  `<option value="${user.id}">${user.username} (${user.first_name} ${user.last_name})</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
              <input type="text" id="vendor" name="vendor"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Version</label>
              <input type="text" id="version" name="version"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Data Classification</label>
              <select id="data_classification" name="data_classification"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="public">Public</option>
                <option value="internal" selected>Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Documentation URL</label>
              <input type="url" id="documentation_url" name="documentation_url"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Runbook URL</label>
              <input type="url" id="runbook_url" name="runbook_url"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">RTO (minutes)</label>
              <input type="number" id="recovery_time_objective" name="recovery_time_objective" min="0"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">RPO (minutes)</label>
              <input type="number" id="recovery_point_objective" name="recovery_point_objective" min="0"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select id="serviceStatus" name="status"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deprecated">Deprecated</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div class="flex items-center pt-6">
              <input type="checkbox" id="monitoring_enabled" name="monitoring_enabled" checked
                     class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <label for="monitoring_enabled" class="ml-2 block text-sm text-gray-900">
                Monitoring Enabled
              </label>
            </div>
          </div>
        </form>
        
        <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button type="button" onclick="closeServiceModal()"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onclick="saveService()"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <i class="fas fa-save mr-2"></i>
            <span id="saveServiceButtonText">Save Service</span>
          </button>
        </div>
      </div>
    </div>

    <script>
      let editingServiceId = null;

      function openServiceModal(isEdit = false) {
        document.getElementById('serviceModal').classList.remove('hidden');
        document.getElementById('serviceModalTitle').textContent = isEdit ? 'Edit Service' : 'Add Service';
        document.getElementById('saveServiceButtonText').textContent = isEdit ? 'Update Service' : 'Save Service';
        if (!isEdit) {
          document.getElementById('serviceForm').reset();
          editingServiceId = null;
        }
      }

      function closeServiceModal() {
        document.getElementById('serviceModal').classList.add('hidden');
        editingServiceId = null;
      }

      async function editService(id) {
        editingServiceId = id;
        
        try {
          const response = await fetch(\`/admin/operations/services/\${id}\`);
          const result = await response.json();
          
          if (result.success) {
            const service = result.data;
            document.getElementById('serviceId').value = service.id;
            document.getElementById('serviceName').value = service.name;
            document.getElementById('serviceDescription').value = service.description || '';
            document.getElementById('serviceType').value = service.service_type || 'application';
            document.getElementById('criticality').value = service.criticality || 'medium';
            document.getElementById('availability_requirement').value = service.availability_requirement || '99%';
            document.getElementById('business_unit_id').value = service.business_unit_id || '';
            document.getElementById('owner_id').value = service.owner_id || '';
            document.getElementById('technical_contact_id').value = service.technical_contact_id || '';
            document.getElementById('vendor').value = service.vendor || '';
            document.getElementById('version').value = service.version || '';
            document.getElementById('environment').value = service.environment || 'production';
            document.getElementById('data_classification').value = service.data_classification || 'internal';
            document.getElementById('recovery_time_objective').value = service.recovery_time_objective || '';
            document.getElementById('recovery_point_objective').value = service.recovery_point_objective || '';
            document.getElementById('documentation_url').value = service.documentation_url || '';
            document.getElementById('runbook_url').value = service.runbook_url || '';
            document.getElementById('serviceStatus').value = service.status || 'active';
            document.getElementById('monitoring_enabled').checked = service.monitoring_enabled === 1;
            
            openServiceModal(true);
          } else {
            alert('Error loading service: ' + result.error);
          }
        } catch (error) {
          alert('Error loading service: ' + error.message);
        }
      }

      async function saveService() {
        const form = document.getElementById('serviceForm');
        const formData = new FormData(form);
        
        // Handle checkbox
        formData.set('monitoring_enabled', document.getElementById('monitoring_enabled').checked);
        
        const url = editingServiceId 
          ? \`/admin/operations/services/\${editingServiceId}/update\`
          : '/admin/operations/services/create';
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            closeServiceModal();
            location.reload(); // Reload to show changes
          } else {
            alert('Error saving service: ' + result.error);
          }
        } catch (error) {
          alert('Error saving service: ' + error.message);
        }
      }

      async function deleteService(id, name) {
        if (!confirm(\`Are you sure you want to delete the service "\${name}"? This action cannot be undone.\`)) {
          return;
        }
        
        try {
          const response = await fetch(\`/admin/operations/services/\${id}/delete\`, {
            method: 'POST'
          });
          
          const result = await response.json();
          
          if (result.success) {
            location.reload(); // Reload to show changes
          } else {
            alert('Error deleting service: ' + result.error);
          }
        } catch (error) {
          alert('Error deleting service: ' + error.message);
        }
      }
    </script>
  `;
}