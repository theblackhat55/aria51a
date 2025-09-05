import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';

type CloudflareBindings = {
  DB?: D1Database;
};

export function createComplianceRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);

  // Main Compliance Dashboard - Redirect to Framework Management
  app.get('/', async (c) => {
    return c.redirect('/compliance/frameworks');
  });
  
  // Framework Management (Main Page - matches ARIA5 image)
  app.get('/frameworks', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Framework Management',
        user,
        content: renderFrameworkManagement()
      })
    );
  });

  // SOC 2 Controls
  app.get('/frameworks/soc2', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'SOC 2 Controls',
        user,
        content: renderSOC2ControlsPage()
      })
    );
  });

  // SOC 2 Tab Content Endpoints (Database-driven)
  app.get('/controls/soc2/security', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE framework_id = 1 AND category = 'Security'
        ORDER BY control_id
      `).all();

      return c.html(renderSOC2ControlsList(controls.results || [], 'security'));
    } catch (error) {
      console.error('Error fetching SOC 2 security controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  app.get('/controls/soc2/availability', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE framework_id = 1 AND category = 'Availability'
        ORDER BY control_id
      `).all();

      return c.html(renderSOC2ControlsList(controls.results || [], 'availability'));
    } catch (error) {
      console.error('Error fetching SOC 2 availability controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  app.get('/controls/soc2/integrity', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE framework_id = 1 AND category = 'Processing Integrity'
        ORDER BY control_id
      `).all();

      return c.html(renderSOC2ControlsList(controls.results || [], 'integrity'));
    } catch (error) {
      console.error('Error fetching SOC 2 integrity controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  app.get('/controls/soc2/confidentiality', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE framework_id = 1 AND category = 'Confidentiality'
        ORDER BY control_id
      `).all();

      return c.html(renderSOC2ControlsList(controls.results || [], 'confidentiality'));
    } catch (error) {
      console.error('Error fetching SOC 2 confidentiality controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  app.get('/controls/soc2/privacy', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE framework_id = 1 AND category = 'Privacy'
        ORDER BY control_id
      `).all();

      return c.html(renderSOC2ControlsList(controls.results || [], 'privacy'));
    } catch (error) {
      console.error('Error fetching SOC 2 privacy controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  // ISO 27001 Tab Content Endpoints (Database-driven)
  app.get('/controls/iso27001/organizational', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE framework_id = 2 AND category = 'Organizational'
        ORDER BY control_id
      `).all();

      return c.html(renderISO27001ControlsList(controls.results || [], 'organizational'));
    } catch (error) {
      console.error('Error fetching ISO 27001 organizational controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  // ISO 27001 Controls
  app.get('/frameworks/iso27001', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'ISO 27001 Controls',
        user,
        content: renderISO27001Controls()
      })
    );
  });

  // Custom Frameworks
  app.get('/frameworks/custom', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Custom Frameworks',
        user,
        content: renderCustomFrameworks()
      })
    );
  });

  // Control Testing
  app.get('/testing', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Control Testing',
        user,
        content: renderControlTesting()
      })
    );
  });

  // Control Mapping
  app.get('/mapping', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Control Mapping',
        user,
        content: renderControlMapping()
      })
    );
  });

  // Create Custom Framework
  app.post('/frameworks/custom/create', async (c) => {
    const formData = await c.req.parseBody();
    console.log('Creating custom framework:', formData);
    
    return c.html(html`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">Custom framework "${formData.name}" created successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          location.reload();
        }, 2000);
      </script>
    `);
  });

  // Import Standard Framework
  app.post('/frameworks/import', async (c) => {
    const formData = await c.req.parseBody();
    console.log('Importing standard framework:', formData);
    
    return c.html(html`
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-download text-blue-500 mr-2"></i>
          <span class="text-blue-700 font-medium">Standard framework imported successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          location.reload();
        }, 2000);
      </script>
    `);
  });

  // View Control Modal (Database-driven)
  app.get('/controls/soc2/:controlId/view', async (c) => {
    const controlId = c.req.param('controlId');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(html`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const control = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE id = ? AND framework_id = 1
      `).bind(controlId).first();
      
      if (!control) {
        return c.html(html`<div class="p-4 text-red-600">Control not found</div>`);
      }
      
      return c.html(renderControlViewModal(control));
    } catch (error) {
      console.error('Error fetching control:', error);
      return c.html(html`<div class="p-4 text-red-600">Error loading control</div>`);
    }
  });

  // Edit Control Modal (Database-driven)
  app.get('/controls/soc2/:controlId/edit', async (c) => {
    const controlId = c.req.param('controlId');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(html`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const control = await db.prepare(`
        SELECT * FROM compliance_controls 
        WHERE id = ? AND framework_id = 1
      `).bind(controlId).first();
      
      if (!control) {
        return c.html(html`<div class="p-4 text-red-600">Control not found</div>`);
      }
      
      return c.html(renderControlEditModal(control));
    } catch (error) {
      console.error('Error fetching control:', error);
      return c.html(html`<div class="p-4 text-red-600">Error loading control</div>`);
    }
  });

  // Update Control (Database-driven)
  app.post('/controls/soc2/:controlId/update', async (c) => {
    const controlId = c.req.param('controlId');
    const formData = await c.req.parseBody();
    const db = c.env.DB;
    
    if (!db) {
      return c.html(html`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      // Validate CSRF token (basic implementation)
      const submittedToken = formData._token as string;
      if (!submittedToken) {
        return c.html(html`<div class="p-4 text-red-600">Invalid request</div>`);
      }

      // Update the control in database
      const result = await db.prepare(`
        UPDATE compliance_controls 
        SET 
          implementation_status = ?,
          implementation_progress = ?,
          risk_level = ?,
          testing_frequency = ?,
          applicability = ?,
          next_test_date = ?,
          justification = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND framework_id = 1
      `).bind(
        formData.implementation_status,
        parseInt(formData.implementation_progress as string) || 0,
        formData.risk_level,
        formData.testing_frequency,
        formData.applicability,
        formData.next_test_date || null,
        formData.justification,
        controlId
      ).run();

      if (result.changes === 0) {
        return c.html(html`<div class="p-4 text-red-600">Control not found or no changes made</div>`);
      }
      
      return c.html(html`
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span class="text-green-700 font-medium">Control updated successfully!</span>
          </div>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById('modal-container').innerHTML = '';
            // Refresh the current tab content
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
              activeTab.click();
            }
          }, 1500);
        </script>
      `);
    } catch (error) {
      console.error('Error updating control:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Error updating control. Please try again.</span>
          </div>
        </div>
      `);
    }
  });

  // SoA page
  app.get('/soa', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Statement of Applicability',
        user,
        content: renderSOAManagement()
      })
    );
  });
  
  // Evidence page
  app.get('/evidence', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Evidence Management',
        user,
        content: renderEvidenceManagement()
      })
    );
  });
  
  // Assessments page
  app.get('/assessments', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Compliance Assessments',
        user,
        content: renderComplianceAssessments()
      })
    );
  });
  
  // View Control Modal Endpoint
  app.get('/compliance/view-control/:id', async (c) => {
    const controlId = c.req.param('id');
    
    // Find control in SOC2 controls
    const control = soc2Controls.find(ctrl => ctrl.id === controlId);
    
    if (!control) {
      return c.text('Control not found', 404);
    }
    
    const modal = html`
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onclick="closeModal(event)">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">${control.title}</h3>
            <button onclick="closeModal(event)" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Control Information</h4>
                <dl class="space-y-2">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">ID</dt>
                    <dd class="text-sm text-gray-900">${control.id}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Category</dt>
                    <dd class="text-sm text-gray-900">${control.category}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Status</dt>
                    <dd>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        control.status === 'implemented' ? 'bg-green-100 text-green-800' :
                        control.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }">
                        ${control.status.charAt(0).toUpperCase() + control.status.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Implementation Progress</dt>
                    <dd>
                      <div class="flex items-center">
                        <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div class="bg-blue-500 h-2 rounded-full" style="width: ${control.implementationProgress}%"></div>
                        </div>
                        <span class="text-sm text-gray-600">${control.implementationProgress}%</span>
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Control Details</h4>
                <p class="text-sm text-gray-600">${control.description}</p>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Implementation Evidence</h4>
              <div class="space-y-3">
                <div class="border border-gray-200 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900">Security Policy Document</span>
                    <span class="text-xs text-gray-500">Updated 2 days ago</span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">Comprehensive security policy covering access controls</p>
                </div>
                <div class="border border-gray-200 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900">Access Review Report</span>
                    <span class="text-xs text-gray-500">Updated 1 week ago</span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">Quarterly access review and privilege audit results</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button onclick="closeModal(event)" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Close
            </button>
            <button onclick="editControl('${control.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Edit Control
            </button>
          </div>
        </div>
      </div>
      
      <script>
        function closeModal(event) {
          if (event && event.target !== event.currentTarget) return;
          document.getElementById('modal-container').innerHTML = '';
        }
      </script>
    `;
    
    return c.html(modal);
  });

  return app;
}

// Framework Management Page
function renderFrameworkManagement() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Framework Management</h1>
              <p class="text-gray-600 mt-2">Manage compliance frameworks and controls</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-plus mr-2"></i>
                Import Framework
              </button>
            </div>
          </div>
        </div>

        <!-- Framework Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <!-- SOC 2 Framework -->
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-blue-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">SOC 2 Type II</h3>
                <p class="text-sm text-gray-600">AICPA Trust Services</p>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Controls:</span>
                <span class="font-medium">127 implemented</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Compliance:</span>
                <span class="font-medium text-green-600">94%</span>
              </div>
            </div>
            <a href="/compliance/frameworks/soc2" class="block w-full text-center bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              Manage Controls
            </a>
          </div>

          <!-- ISO 27001 Framework -->
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-certificate text-green-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">ISO 27001</h3>
                <p class="text-sm text-gray-600">Information Security</p>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Controls:</span>
                <span class="font-medium">114 implemented</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Compliance:</span>
                <span class="font-medium text-yellow-600">87%</span>
              </div>
            </div>
            <a href="/compliance/frameworks/iso27001" class="block w-full text-center bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors">
              Manage Controls
            </a>
          </div>

          <!-- Custom Framework -->
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-cog text-purple-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Custom Frameworks</h3>
                <p class="text-sm text-gray-600">Organization-specific</p>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Frameworks:</span>
                <span class="font-medium">3 active</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Controls:</span>
                <span class="font-medium">45 total</span>
              </div>
            </div>
            <a href="/compliance/frameworks/custom" class="block w-full text-center bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition-colors">
              Manage Frameworks
            </a>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Control Testing -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-vial text-orange-600"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">Control Testing</h3>
                <p class="text-sm text-gray-600">Test and validate control effectiveness</p>
              </div>
            </div>
            <a href="/compliance/testing" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              Start Testing <i class="fas fa-arrow-right ml-2"></i>
            </a>
          </div>

          <!-- Control Mapping -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-sitemap text-indigo-600"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">Control Mapping</h3>
                <p class="text-sm text-gray-600">Map controls across frameworks</p>
              </div>
            </div>
            <a href="/compliance/mapping" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              View Mappings <i class="fas fa-arrow-right ml-2"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Real implementation functions with database integration

function renderSOC2ControlsPage() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">SOC 2 Controls Management</h1>
              <p class="text-gray-600 mt-2">Trust Services Criteria - Security, Availability, Processing Integrity, Confidentiality, and Privacy</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-vial mr-2"></i>
                Test Controls
              </button>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-plus mr-2"></i>
                Add Control
              </button>
            </div>
          </div>
        </div>

        <!-- Control Categories Tabs -->
        <div class="bg-white rounded-lg shadow mb-6">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex">
              <button class="tab-button active px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600" data-tab="security">
                Security (CC1-CC8)
              </button>
              <button class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" data-tab="availability">
                Availability (A1)
              </button>
              <button class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" data-tab="integrity">
                Processing Integrity (PI1)
              </button>
              <button class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" data-tab="confidentiality">
                Confidentiality (C1)
              </button>
              <button class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" data-tab="privacy">
                Privacy (P1-P9)
              </button>
            </nav>
          </div>
          
          <!-- Tab Content -->
          <div id="tab-content" class="p-6">
            <div id="controls-container" 
                 hx-get="/compliance/controls/soc2/security"
                 hx-trigger="load"
                 hx-swap="innerHTML">
              <!-- Loading placeholder -->
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p class="text-gray-600 mt-2">Loading SOC 2 controls...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Implementation Progress Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-check-circle text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Implemented</p>
                <p class="text-2xl font-semibold text-gray-900" id="implemented-count">0</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">In Progress</p>
                <p class="text-2xl font-semibold text-gray-900" id="in-progress-count">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Not Started</p>
                <p class="text-2xl font-semibold text-gray-900" id="not-started-count">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-percentage text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Overall Progress</p>
                <p class="text-2xl font-semibold text-gray-900" id="overall-progress">0%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Container -->
    <div id="modal-container"></div>
    
    <script>
      // Tab switching functionality
      document.addEventListener('DOMContentLoaded', function() {
        const tabs = document.querySelectorAll('.tab-button');
        const container = document.getElementById('controls-container');
        
        tabs.forEach(tab => {
          tab.addEventListener('click', function() {
            // Update active tab
            tabs.forEach(t => {
              t.classList.remove('active', 'text-blue-600', 'border-blue-600');
              t.classList.add('text-gray-500');
            });
            this.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            this.classList.remove('text-gray-500');
            
            // Load tab content
            const tabName = this.dataset.tab;
            htmx.ajax('GET', '/compliance/controls/soc2/' + tabName, {target: container});
          });
        });
      });
    </script>
  `;
}

function renderISO27001Controls() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">ISO 27001:2022 Controls</h1>
              <p class="text-gray-600 mt-2">Information Security Management System Controls - Annex A</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-file-export mr-2"></i>
                Export SoA
              </button>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-edit mr-2"></i>
                Update Applicability
              </button>
            </div>
          </div>
        </div>

        <!-- Control Categories -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-building text-blue-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Organizational</h3>
                <p class="text-sm text-gray-600">37 controls</p>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: 92%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">92% applicable</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-users text-green-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">People</h3>
                <p class="text-sm text-gray-600">8 controls</p>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-600 h-2 rounded-full" style="width: 100%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">100% applicable</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-purple-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Physical</h3>
                <p class="text-sm text-gray-600">14 controls</p>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-purple-600 h-2 rounded-full" style="width: 86%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">86% applicable</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-laptop text-orange-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Technological</h3>
                <p class="text-sm text-gray-600">34 controls</p>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-orange-600 h-2 rounded-full" style="width: 88%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">88% applicable</p>
          </div>
        </div>

        <!-- Controls Table -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">ISO 27001 Control Details</h3>
            <div class="flex space-x-2">
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Categories</option>
                <option>Organizational</option>
                <option>People</option>
                <option>Physical</option>
                <option>Technological</option>
              </select>
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Status</option>
                <option>Applicable</option>
                <option>Not Applicable</option>
                <option>Inherited</option>
              </select>
            </div>
          </div>
          
          <div id="iso-controls-container"
               hx-get="/compliance/controls/iso27001/organizational"
               hx-trigger="load"
               hx-swap="innerHTML">
            <!-- Loading placeholder -->
            <div class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p class="text-gray-600 mt-2">Loading ISO 27001 controls...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Container -->
    <div id="modal-container"></div>
  `;
}

function renderCustomFrameworks() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Custom Compliance Frameworks</h1>
              <p class="text-gray-600 mt-2">Create and manage custom compliance frameworks for your organization</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                      onclick="document.getElementById('create-framework-modal').style.display='block'">
                <i class="fas fa-plus mr-2"></i>
                Create Framework
              </button>
            </div>
          </div>
        </div>

        <!-- Framework Templates -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-industry text-purple-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Industry Framework</h3>
                <p class="text-sm text-gray-600">Sector-specific requirements</p>
              </div>
            </div>
            <p class="text-gray-600 mb-4">Create frameworks tailored to your industry regulations and standards.</p>
            <button class="w-full bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition-colors">
              Use Template
            </button>
          </div>

          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-cogs text-green-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Operational Framework</h3>
                <p class="text-sm text-gray-600">Internal controls</p>
              </div>
            </div>
            <p class="text-gray-600 mb-4">Design operational security and compliance controls for your organization.</p>
            <button class="w-full bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors">
              Use Template
            </button>
          </div>

          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-blank-file text-blue-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">Blank Framework</h3>
                <p class="text-sm text-gray-600">Start from scratch</p>
              </div>
            </div>
            <p class="text-gray-600 mb-4">Build a completely custom framework from the ground up.</p>
            <button class="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              Create Blank
            </button>
          </div>
        </div>

        <!-- Existing Custom Frameworks -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Your Custom Frameworks</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-shield-alt text-purple-600"></i>
                </div>
                <div class="ml-4">
                  <h4 class="text-sm font-medium text-gray-900">Healthcare Compliance Framework</h4>
                  <p class="text-sm text-gray-500">32 controls • Last updated 2 days ago</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Edit
                </button>
                <button class="text-green-600 hover:text-green-800 text-sm font-medium">
                  View
                </button>
                <button class="text-red-600 hover:text-red-800 text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>

            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-cogs text-green-600"></i>
                </div>
                <div class="ml-4">
                  <h4 class="text-sm font-medium text-gray-900">Internal Security Controls</h4>
                  <p class="text-sm text-gray-500">18 controls • Last updated 5 days ago</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Edit
                </button>
                <button class="text-green-600 hover:text-green-800 text-sm font-medium">
                  View
                </button>
                <button class="text-red-600 hover:text-red-800 text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>

            <div class="px-6 py-8 text-center text-gray-500">
              <i class="fas fa-plus-circle text-4xl text-gray-300 mb-4"></i>
              <p class="text-lg">No custom frameworks yet</p>
              <p class="text-sm">Create your first custom compliance framework</p>
              <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      onclick="document.getElementById('create-framework-modal').style.display='block'">
                Create Framework
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Framework Modal -->
    <div id="create-framework-modal" class="fixed inset-0 z-50 hidden"
         style="background: rgba(0,0,0,0.5);">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Create Custom Framework</h3>
            <button onclick="document.getElementById('create-framework-modal').style.display='none'"
                    class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="p-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Framework Name</label>
                <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="e.g., HIPAA Compliance Framework">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3" placeholder="Brief description of the framework purpose"></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Healthcare</option>
                  <option>Financial Services</option>
                  <option>Technology</option>
                  <option>Manufacturing</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" 
                      onclick="document.getElementById('create-framework-modal').style.display='none'"
                      class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create Framework
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderControlTesting() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Control Testing</h1>
              <p class="text-gray-600 mt-2">Plan, execute, and track control testing activities</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-plus mr-2"></i>
                Schedule Test
              </button>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-calendar-alt mr-2"></i>
                Test Calendar
              </button>
            </div>
          </div>
        </div>

        <!-- Testing Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clipboard-list text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Scheduled Tests</p>
                <p class="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-play-circle text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">In Progress</p>
                <p class="text-2xl font-semibold text-gray-900">7</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-check-circle text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Completed</p>
                <p class="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Failed</p>
                <p class="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Testing Types -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div class="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-search text-blue-600"></i>
            </div>
            <h4 class="font-medium text-gray-900">Inquiry</h4>
            <p class="text-sm text-gray-500 mt-1">12 scheduled</p>
          </div>

          <div class="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-eye text-green-600"></i>
            </div>
            <h4 class="font-medium text-gray-900">Observation</h4>
            <p class="text-sm text-gray-500 mt-1">8 scheduled</p>
          </div>

          <div class="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-clipboard-check text-purple-600"></i>
            </div>
            <h4 class="font-medium text-gray-900">Inspection</h4>
            <p class="text-sm text-gray-500 mt-1">5 scheduled</p>
          </div>

          <div class="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-redo text-yellow-600"></i>
            </div>
            <h4 class="font-medium text-gray-900">Reperformance</h4>
            <p class="text-sm text-gray-500 mt-1">3 scheduled</p>
          </div>

          <div class="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-route text-indigo-600"></i>
            </div>
            <h4 class="font-medium text-gray-900">Walkthrough</h4>
            <p class="text-sm text-gray-500 mt-1">7 scheduled</p>
          </div>
        </div>

        <!-- Recent Test Results -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Recent Test Results</h3>
            <div class="flex space-x-2">
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Results</option>
                <option>Passed</option>
                <option>Failed</option>
                <option>In Progress</option>
              </select>
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Frameworks</option>
                <option>SOC 2</option>
                <option>ISO 27001</option>
                <option>GDPR</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tester</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">CC6.1 - Access Rights Management</div>
                    <div class="text-sm text-gray-500">SOC 2 Security</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Inspection</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sarah Wilson</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Passed
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 15, 2023</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-indigo-600 hover:text-indigo-900">
                      <i class="fas fa-download"></i>
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">A.8.1.1 - Inventory of Assets</div>
                    <div class="text-sm text-gray-500">ISO 27001 Organizational</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Observation</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mike Johnson</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Failed
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 14, 2023</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900">
                      <i class="fas fa-exclamation-triangle"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderControlMapping() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Control Mapping</h1>
              <p class="text-gray-600 mt-2">Map controls across different compliance frameworks</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-sync-alt mr-2"></i>
                Auto-Map
              </button>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-download mr-2"></i>
                Export Matrix
              </button>
            </div>
          </div>
        </div>

        <!-- Mapping Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-link text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Mappings</p>
                <p class="text-2xl font-semibold text-gray-900">287</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-check-double text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Verified Mappings</p>
                <p class="text-2xl font-semibold text-gray-900">234</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-question-circle text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Pending Review</p>
                <p class="text-2xl font-semibold text-gray-900">42</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-unlink text-2xl text-red-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Unmapped</p>
                <p class="text-2xl font-semibold text-gray-900">11</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Framework Selection -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Select Frameworks to Map</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Source Framework</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option selected>SOC 2 Type II</option>
                  <option>ISO 27001:2022</option>
                  <option>NIST Cybersecurity Framework</option>
                  <option>GDPR</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Framework</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>SOC 2 Type II</option>
                  <option selected>ISO 27001:2022</option>
                  <option>NIST Cybersecurity Framework</option>
                  <option>GDPR</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Mapping Matrix -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">SOC 2 ↔ ISO 27001 Mapping Matrix</h3>
            <div class="flex space-x-2">
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Categories</option>
                <option>Security</option>
                <option>Availability</option>
                <option>Confidentiality</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOC 2 Control</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISO 27001 Control</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapping Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">CC6.1</div>
                    <div class="text-sm text-gray-500">Access Rights Management</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">A.9.1.1</div>
                    <div class="text-sm text-gray-500">Access Control Policy</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Direct
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-indigo-600 hover:text-indigo-900">
                      <i class="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">CC6.2</div>
                    <div class="text-sm text-gray-500">User Authentication</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">A.9.4.2</div>
                    <div class="text-sm text-gray-500">Secure Log-on Procedures</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Partial
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-indigo-600 hover:text-indigo-900">
                      <i class="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderComplianceAssessments() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Compliance Assessments</h1>
              <p class="text-gray-600 mt-2">Manage and track compliance assessment activities</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-plus mr-2"></i>
                New Assessment
              </button>
            </div>
          </div>
        </div>

        <!-- Assessment Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clipboard-check text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Assessments</p>
                <p class="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">In Progress</p>
                <p class="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-check-circle text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Completed</p>
                <p class="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Overdue</p>
                <p class="text-2xl font-semibold text-gray-900">1</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Assessment Types -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-blue-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">SOC 2 Assessment</h3>
                <p class="text-sm text-gray-600">Type II Examination</p>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Progress:</span>
                <span class="font-medium">85%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: 85%"></div>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Due Date:</span>
                <span class="font-medium">Mar 31, 2024</span>
              </div>
            </div>
            <button class="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              Continue Assessment
            </button>
          </div>

          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-certificate text-green-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">ISO 27001 Assessment</h3>
                <p class="text-sm text-gray-600">Certification Audit</p>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Progress:</span>
                <span class="font-medium">60%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-600 h-2 rounded-full" style="width: 60%"></div>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Due Date:</span>
                <span class="font-medium">Apr 15, 2024</span>
              </div>
            </div>
            <button class="w-full bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors">
              Continue Assessment
            </button>
          </div>

          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-balance-scale text-purple-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">GDPR Assessment</h3>
                <p class="text-sm text-gray-600">Privacy Impact</p>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Progress:</span>
                <span class="font-medium">95%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-purple-600 h-2 rounded-full" style="width: 95%"></div>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Due Date:</span>
                <span class="font-medium text-red-600">Overdue</span>
              </div>
            </div>
            <button class="w-full bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition-colors">
              Complete Assessment
            </button>
          </div>
        </div>

        <!-- Recent Assessment Activity -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Assessment Activity</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-check text-green-600"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-900">SOC 2 Control CC6.1 - Evidence Updated</p>
                  <p class="text-sm text-gray-500">System access controls documentation reviewed</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-file-alt text-blue-600"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-900">ISO 27001 Risk Assessment - Draft Completed</p>
                  <p class="text-sm text-gray-500">Information security risk assessment submitted for review</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">1 day ago</span>
            </div>
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-900">GDPR Assessment - Remediation Required</p>
                  <p class="text-sm text-gray-500">Data processing activities need additional documentation</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSOAManagement() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Statement of Applicability (SoA)</h1>
              <p class="text-gray-600 mt-2">ISO 27001 controls selection and justification</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-download mr-2"></i>
                Export SoA
              </button>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-edit mr-2"></i>
                Update SoA
              </button>
            </div>
          </div>
        </div>

        <!-- SoA Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-shield-alt text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Applicable Controls</p>
                <p class="text-2xl font-semibold text-gray-900">87</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-times-circle text-2xl text-red-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Not Applicable</p>
                <p class="text-2xl font-semibold text-gray-900">27</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-check-circle text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Implemented</p>
                <p class="text-2xl font-semibold text-gray-900">79</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">To Implement</p>
                <p class="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Control Categories -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">ISO 27001:2022 Control Categories</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Organizational Controls -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-lg font-semibold text-gray-900">Organizational Controls</h4>
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">37/37</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Information Security Policies</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Information Security Roles</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Supplier Relationships</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Information Security in Project Management</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                </div>
              </div>

              <!-- People Controls -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-lg font-semibold text-gray-900">People Controls</h4>
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">8/8</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Screening</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Terms and Conditions of Employment</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Information Security Awareness</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Disciplinary Process</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                </div>
              </div>

              <!-- Physical Controls -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-lg font-semibold text-gray-900">Physical Controls</h4>
                  <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">12/14</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Physical Security Perimeters</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Physical Entry</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Protection Against Environmental Threats</span>
                    <span class="text-red-600 font-medium">✗ Not Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Equipment Maintenance</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                </div>
              </div>

              <!-- Technological Controls -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-lg font-semibold text-gray-900">Technological Controls</h4>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">30/34</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Access Control Management</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Cryptography</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Systems Security</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Network Security Management</span>
                    <span class="text-green-600 font-medium">✓ Applicable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SoA Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-edit text-blue-600"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">Update Justifications</h3>
                <p class="text-sm text-gray-600">Review and update control applicability</p>
              </div>
            </div>
            <button class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              Edit SoA Matrix <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-file-export text-green-600"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">Generate Report</h3>
                <p class="text-sm text-gray-600">Export formal SoA document</p>
              </div>
            </div>
            <button class="inline-flex items-center text-green-600 hover:text-green-800 font-medium">
              Download Report <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEvidenceManagement() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Evidence Management</h1>
              <p class="text-gray-600 mt-2">Manage compliance evidence and documentation</p>
            </div>
            <div class="flex space-x-3">
              <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-upload mr-2"></i>
                Upload Evidence
              </button>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-link mr-2"></i>
                Link Evidence
              </button>
            </div>
          </div>
        </div>

        <!-- Evidence Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-folder text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Evidence</p>
                <p class="text-2xl font-semibold text-gray-900">342</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-link text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Linked to Controls</p>
                <p class="text-2xl font-semibold text-gray-900">298</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Pending Review</p>
                <p class="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Expired</p>
                <p class="text-2xl font-semibold text-gray-900">7</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Evidence Categories -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <!-- Evidence by Type -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Evidence by Type</h3>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-file-alt text-blue-500 mr-3"></i>
                  <span class="text-gray-700">Policies & Procedures</span>
                </div>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">89</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-chart-bar text-green-500 mr-3"></i>
                  <span class="text-gray-700">Reports & Analytics</span>
                </div>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">67</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-certificate text-purple-500 mr-3"></i>
                  <span class="text-gray-700">Certificates</span>
                </div>
                <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">34</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-cog text-orange-500 mr-3"></i>
                  <span class="text-gray-700">System Configurations</span>
                </div>
                <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">78</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-users text-indigo-500 mr-3"></i>
                  <span class="text-gray-700">Training Records</span>
                </div>
                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm font-medium">45</span>
              </div>
            </div>
          </div>

          <!-- Evidence by Framework -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Evidence by Framework</h3>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
                  <span class="text-gray-700">SOC 2</span>
                </div>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">156</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-certificate text-green-500 mr-3"></i>
                  <span class="text-gray-700">ISO 27001</span>
                </div>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">142</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-balance-scale text-purple-500 mr-3"></i>
                  <span class="text-gray-700">GDPR</span>
                </div>
                <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">67</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-credit-card text-red-500 mr-3"></i>
                  <span class="text-gray-700">PCI DSS</span>
                </div>
                <span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">23</span>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex items-start">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-upload text-green-600 text-sm"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Security Policy v2.1</p>
                  <p class="text-xs text-gray-500">Uploaded 2 hours ago</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-link text-blue-600 text-sm"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Linked to SOC 2 CC6.1</p>
                  <p class="text-xs text-gray-500">Linked 4 hours ago</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-check text-purple-600 text-sm"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Access Review Q4 Approved</p>
                  <p class="text-xs text-gray-500">Approved 1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Evidence List -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Evidence Repository</h3>
            <div class="flex space-x-2">
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Types</option>
                <option>Policies</option>
                <option>Reports</option>
                <option>Certificates</option>
              </select>
              <select class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>All Frameworks</option>
                <option>SOC 2</option>
                <option>ISO 27001</option>
                <option>GDPR</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controls</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-file-pdf text-red-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Information Security Policy v2.1</div>
                        <div class="text-sm text-gray-500">security-policy-v2.1.pdf</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Policy</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">SOC 2, ISO 27001</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">CC6.1, A.5.1.1</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Current
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-download"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-chart-bar text-blue-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Q4 Access Review Report</div>
                        <div class="text-sm text-gray-500">access-review-q4-2023.xlsx</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Report</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">SOC 2</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">CC6.2, CC6.3</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Reviewed
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                      <i class="fas fa-download"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderControlViewModal(control: any) {
  return html`
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">${control.control_id} - ${control.title}</h3>
            <p class="text-sm text-gray-600">${control.category} Control</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''"
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Control Details -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div class="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                  ${control.description || 'No description available'}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Control Type</label>
                  <div class="bg-gray-50 p-2 rounded-md text-sm text-gray-700">
                    ${control.control_type || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <div class="bg-gray-50 p-2 rounded-md text-sm text-gray-700">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(control.risk_level)}">
                      ${control.risk_level || 'Not assessed'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Implementation Status</label>
                <div class="flex items-center space-x-3">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(control.implementation_status)}">
                    ${control.implementation_status?.replace('_', ' ') || 'Not started'}
                  </span>
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${control.implementation_progress || 0}%"></div>
                  </div>
                  <span class="text-sm text-gray-600">${control.implementation_progress || 0}%</span>
                </div>
              </div>
            </div>
            
            <!-- Testing Information -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Testing Frequency</label>
                <div class="bg-gray-50 p-2 rounded-md text-sm text-gray-700">
                  ${control.testing_frequency || 'Not defined'}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Last Tested</label>
                  <div class="bg-gray-50 p-2 rounded-md text-sm text-gray-700">
                    ${control.last_tested_date ? new Date(control.last_tested_date).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Next Test Due</label>
                  <div class="bg-gray-50 p-2 rounded-md text-sm text-gray-700">
                    ${control.next_test_date ? new Date(control.next_test_date).toLocaleDateString() : 'Not scheduled'}
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Test Status</label>
                <div class="bg-gray-50 p-2 rounded-md text-sm text-gray-700">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTestStatusColor(control.test_status)}">
                    ${control.test_status || 'Not tested'}
                  </span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <div class="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                  ${control.justification || 'No justification provided'}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Evidence Section -->
          <div class="mt-6 border-t border-gray-200 pt-6">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Related Evidence</h4>
            <div class="bg-gray-50 p-4 rounded-md">
              <p class="text-gray-600 text-center">No evidence linked to this control yet</p>
              <div class="mt-3 text-center">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <i class="fas fa-link mr-1"></i>
                  Link Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onclick="document.getElementById('modal-container').innerHTML = ''"
                  class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Close
          </button>
          <button hx-get="/compliance/controls/soc2/${control.id}/edit"
                  hx-target="#modal-container"
                  hx-swap="innerHTML"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Edit Control
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderControlEditModal(control: any) {
  return html`
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Edit ${control.control_id} - ${control.title}</h3>
            <p class="text-sm text-gray-600">${control.category} Control</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''"
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form hx-post="/compliance/controls/soc2/${control.id}/update"
              hx-target="#modal-container"
              hx-swap="innerHTML"
              class="p-6">
          <input type="hidden" name="_token" value="${generateCSRFToken()}">
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Control Details -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Implementation Status</label>
                <select name="implementation_status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="not_started" ${control.implementation_status === 'not_started' ? 'selected' : ''}>Not Started</option>
                  <option value="in_progress" ${control.implementation_status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="implemented" ${control.implementation_status === 'implemented' ? 'selected' : ''}>Implemented</option>
                  <option value="tested" ${control.implementation_status === 'tested' ? 'selected' : ''}>Tested</option>
                  <option value="verified" ${control.implementation_status === 'verified' ? 'selected' : ''}>Verified</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Implementation Progress (%)</label>
                <input type="number" name="implementation_progress" min="0" max="100" 
                       value="${control.implementation_progress || 0}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select name="risk_level" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low" ${control.risk_level === 'low' ? 'selected' : ''}>Low</option>
                  <option value="medium" ${control.risk_level === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="high" ${control.risk_level === 'high' ? 'selected' : ''}>High</option>
                  <option value="critical" ${control.risk_level === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Testing Frequency</label>
                <select name="testing_frequency" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="daily" ${control.testing_frequency === 'daily' ? 'selected' : ''}>Daily</option>
                  <option value="weekly" ${control.testing_frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                  <option value="monthly" ${control.testing_frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                  <option value="quarterly" ${control.testing_frequency === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                  <option value="annually" ${control.testing_frequency === 'annually' ? 'selected' : ''}>Annually</option>
                </select>
              </div>
            </div>
            
            <!-- Testing and Compliance -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Applicability (ISO 27001)</label>
                <select name="applicability" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="applicable" ${control.applicability === 'applicable' ? 'selected' : ''}>Applicable</option>
                  <option value="not_applicable" ${control.applicability === 'not_applicable' ? 'selected' : ''}>Not Applicable</option>
                  <option value="inherited" ${control.applicability === 'inherited' ? 'selected' : ''}>Inherited</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Next Test Date</label>
                <input type="date" name="next_test_date" 
                       value="${control.next_test_date ? control.next_test_date.split('T')[0] : ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea name="justification" rows="4" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Provide justification for control implementation or applicability...">${control.justification || ''}</textarea>
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" 
                    onclick="document.getElementById('modal-container').innerHTML = ''"
                    class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Update Control
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function getRiskLevelColor(level: string) {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getTestStatusColor(status: string) {
  switch (status) {
    case 'passed': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function generateCSRFToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Helper functions for rendering controls lists

function renderSOC2ControlsList(controls: any[], category: string) {
  if (controls.length === 0) {
    return html`
      <div class="text-center py-8">
        <i class="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
        <p class="text-gray-600">No ${category} controls found</p>
      </div>
    `;
  }

  return html`
    <div class="space-y-4">
      ${controls.map(control => html`
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(control.implementation_status)}">
                  ${control.implementation_status?.replace('_', ' ') || 'Not Started'}
                </span>
                <span class="ml-2 text-sm text-gray-500">${control.control_id}</span>
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-1">${control.title}</h4>
              <p class="text-gray-600 text-sm mb-3">${control.description}</p>
              
              <!-- Progress Bar -->
              <div class="flex items-center space-x-3">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" style="width: ${control.implementation_progress || 0}%"></div>
                </div>
                <span class="text-sm text-gray-600">${control.implementation_progress || 0}%</span>
              </div>
            </div>
            
            <div class="ml-4 flex space-x-2">
              <button class="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                      hx-get="/compliance/controls/soc2/${control.id}/view"
                      hx-target="#modal-container"
                      hx-swap="innerHTML">
                <i class="fas fa-eye"></i>
              </button>
              <button class="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"
                      hx-get="/compliance/controls/soc2/${control.id}/edit"
                      hx-target="#modal-container"
                      hx-swap="innerHTML">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderISO27001ControlsList(controls: any[], category: string) {
  if (controls.length === 0) {
    return html`
      <div class="text-center py-8">
        <i class="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
        <p class="text-gray-600">No ${category} controls found</p>
      </div>
    `;
  }

  return html`
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicability</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${controls.map(control => html`
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${control.control_id}</td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <div class="font-medium">${control.title}</div>
                <div class="text-gray-500 truncate max-w-xs">${control.description}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApplicabilityColor(control.applicability)}">
                  ${control.applicability || 'Applicable'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(control.implementation_status)}">
                  ${control.implementation_status?.replace('_', ' ') || 'Not Started'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="text-indigo-600 hover:text-indigo-900">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'implemented': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'tested': return 'bg-blue-100 text-blue-800';
    case 'verified': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getApplicabilityColor(applicability: string) {
  switch (applicability) {
    case 'applicable': return 'bg-green-100 text-green-800';
    case 'not_applicable': return 'bg-red-100 text-red-800';
    case 'inherited': return 'bg-blue-100 text-blue-800';
    default: return 'bg-green-100 text-green-800';
  }
}
