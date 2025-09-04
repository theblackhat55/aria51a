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
