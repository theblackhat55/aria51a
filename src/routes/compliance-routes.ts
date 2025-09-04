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

  // Tab content endpoints
  app.get('/frameworks/soc2-tab', async (c) => {
    return c.html(renderSOC2TabContent());
  });

  app.get('/frameworks/custom-tab', async (c) => {
    return c.html(renderCustomFrameworksTabContent());
  });

  app.get('/frameworks/testing-tab', async (c) => {
    return c.html(renderControlTestingTabContent());
  });

  app.get('/frameworks/mapping-tab', async (c) => {
    return c.html(renderControlMappingTabContent());
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

  // View Control Modal
  app.get('/controls/soc2/:controlId/view', async (c) => {
    const controlId = c.req.param('controlId');
    const control = soc2Controls.find(ctrl => ctrl.id === controlId);
    
    if (!control) {
      return c.html(html`<div class="p-4 text-red-600">Control not found</div>`);
    }
    
    return c.html(renderControlViewModal(control));
  });

  // Edit Control Modal
  app.get('/controls/soc2/:controlId/edit', async (c) => {
    const controlId = c.req.param('controlId');
    const control = soc2Controls.find(ctrl => ctrl.id === controlId);
    
    if (!control) {
      return c.html(html`<div class="p-4 text-red-600">Control not found</div>`);
    }
    
    return c.html(renderControlEditModal(control));
  });

  // Update Control
  app.post('/controls/soc2/:controlId/update', async (c) => {
    const controlId = c.req.param('controlId');
    const formData = await c.req.parseBody();
    
    console.log(`Updating control ${controlId}:`, formData);
    
    return c.html(html`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">Control ${controlId} updated successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.getElementById('modal-container').innerHTML = '';
          location.reload();
        }, 2000);
      </script>
    `);
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

// Placeholder render functions for other compliance pages
function renderSOC2TabContent() {
  return html`<div class="p-4">SOC 2 Framework content loaded</div>`;
}

function renderCustomFrameworksTabContent() {
  return html`<div class="p-4">Custom Frameworks content loaded</div>`;
}

function renderControlTestingTabContent() {
  return html`<div class="p-4">Control Testing content loaded</div>`;
}

function renderControlMappingTabContent() {
  return html`<div class="p-4">Control Mapping content loaded</div>`;
}

function renderSOC2ControlsPage() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">SOC 2 Controls</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">SOC 2 controls management interface</p>
        </div>
      </div>
    </div>
  `;
}

function renderISO27001Controls() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">ISO 27001 Controls</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">ISO 27001 controls management interface</p>
        </div>
      </div>
    </div>
  `;
}

function renderCustomFrameworks() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Custom Frameworks</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">Custom frameworks management interface</p>
        </div>
      </div>
    </div>
  `;
}

function renderControlTesting() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Control Testing</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">Control testing interface</p>
        </div>
      </div>
    </div>
  `;
}

function renderControlMapping() {
  return html`
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Control Mapping</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">Control mapping interface</p>
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
  return html`<div class="p-4">Control ${control.id} view modal</div>`;
}

function renderControlEditModal(control: any) {
  return html`<div class="p-4">Control ${control.id} edit modal</div>`;
}

// Mock SOC2 controls data
const soc2Controls = [
  { id: 'CC1.1', name: 'Control Environment', description: 'Sample control description' },
  { id: 'CC2.1', name: 'Communication', description: 'Sample control description' }
];
