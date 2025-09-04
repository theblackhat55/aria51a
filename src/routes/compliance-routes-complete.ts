import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';

export function createComplianceRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Compliance Dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Compliance Management',
        user,
        content: renderComplianceDashboard()
      })
    );
  });
  
  // Frameworks Management
  app.get('/frameworks', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Compliance Frameworks',
        user,
        content: renderFrameworksPage()
      })
    );
  });
  
  // Frameworks table for HTMX
  app.get('/frameworks/table', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const frameworks = await getFrameworks(db);
    return c.html(renderFrameworksTable(frameworks));
  });
  
  // Create framework modal
  app.get('/frameworks/create', async (c) => {
    return c.html(renderCreateFrameworkModal());
  });
  
  // Create framework
  app.post('/frameworks', async (c) => {
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    try {
      await createFramework(db, formData, user.id);
      c.header('HX-Trigger', 'frameworkCreated');
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Framework added successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Statement of Applicability (SoA)
  app.get('/soa', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Statement of Applicability',
        user,
        content: renderSoAPage()
      })
    );
  });
  
  // SoA table for HTMX
  app.get('/soa/table', async (c) => {
    const frameworkId = c.req.query('framework');
    const db = new DatabaseService(c.env.DB);
    const controls = await getSoAControls(db, frameworkId);
    return c.html(renderSoATable(controls));
  });
  
  // Update SoA control
  app.put('/soa/:id', async (c) => {
    const id = c.req.param('id');
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    
    try {
      await updateSoAControl(db, id, formData, user.id);
      return c.html(`
        <span class="text-green-600">✓ Saved</span>
      `);
    } catch (error) {
      return c.html(`
        <span class="text-red-600">✗ Error</span>
      `);
    }
  });
  
  // Evidence Management
  app.get('/evidence', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Evidence Management',
        user,
        content: renderEvidencePage()
      })
    );
  });
  
  // Evidence table for HTMX
  app.get('/evidence/table', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const evidence = await getEvidence(db);
    return c.html(renderEvidenceTable(evidence));
  });
  
  // Upload evidence modal
  app.get('/evidence/upload', async (c) => {
    return c.html(renderUploadEvidenceModal());
  });
  
  // Upload evidence
  app.post('/evidence', async (c) => {
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    try {
      await uploadEvidence(db, formData, user.id);
      c.header('HX-Trigger', 'evidenceUploaded');
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Evidence uploaded successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Compliance Assessments
  app.get('/assessments', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'Compliance Assessments',
        user,
        content: renderAssessmentsPage()
      })
    );
  });
  
  // Assessments table for HTMX
  app.get('/assessments/table', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const assessments = await getAssessments(db);
    return c.html(renderAssessmentsTable(assessments));
  });
  
  // Start assessment modal
  app.get('/assessments/start', async (c) => {
    return c.html(renderStartAssessmentModal());
  });
  
  // Start assessment
  app.post('/assessments', async (c) => {
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    try {
      const assessment = await startAssessment(db, formData, user.id);
      c.header('HX-Redirect', `/compliance/assessments/${assessment.id}`);
      return c.html('');
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Assessment details
  app.get('/assessments/:id', async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    const assessment = await getAssessmentById(db, id);
    
    return c.html(
      cleanLayout({
        title: `Assessment: ${assessment.name}`,
        user,
        content: renderAssessmentDetails(assessment)
      })
    );
  });
  
  return app;
}

// Template functions
const renderComplianceDashboard = () => html`
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Compliance Management</h2>
        <p class="text-gray-600 mt-1">Manage compliance frameworks, evidence, and assessments</p>
      </div>
    </div>
    
    <!-- Compliance Score Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Overall Compliance</p>
            <p class="text-2xl font-bold text-gray-900">78%</p>
          </div>
          <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-chart-line text-green-600"></i>
          </div>
        </div>
        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-green-600 h-2 rounded-full" style="width: 78%"></div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active Frameworks</p>
            <p class="text-2xl font-bold text-gray-900">5</p>
          </div>
          <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-book text-blue-600"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Evidence Items</p>
            <p class="text-2xl font-bold text-gray-900">234</p>
          </div>
          <div class="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-file-alt text-purple-600"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Pending Reviews</p>
            <p class="text-2xl font-bold text-gray-900">12</p>
          </div>
          <div class="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
            <i class="fas fa-clock text-orange-600"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <a href="/compliance/frameworks" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="flex items-center space-x-3">
          <i class="fas fa-book text-blue-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-gray-900">Frameworks</h3>
            <p class="text-sm text-gray-600">Manage compliance frameworks</p>
          </div>
        </div>
      </a>
      
      <a href="/compliance/soa" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="flex items-center space-x-3">
          <i class="fas fa-list-check text-green-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-gray-900">SoA</h3>
            <p class="text-sm text-gray-600">Statement of Applicability</p>
          </div>
        </div>
      </a>
      
      <a href="/compliance/evidence" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="flex items-center space-x-3">
          <i class="fas fa-file-upload text-purple-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-gray-900">Evidence</h3>
            <p class="text-sm text-gray-600">Upload and manage evidence</p>
          </div>
        </div>
      </a>
      
      <a href="/compliance/assessments" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="flex items-center space-x-3">
          <i class="fas fa-clipboard-check text-orange-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-gray-900">Assessments</h3>
            <p class="text-sm text-gray-600">Compliance assessments</p>
          </div>
        </div>
      </a>
    </div>
  </div>
`;

const renderFrameworksPage = () => html`
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Compliance Frameworks</h2>
        <p class="text-gray-600 mt-1">Manage regulatory and compliance frameworks</p>
      </div>
      <button 
        hx-get="/compliance/frameworks/create" 
        hx-target="#modal-container"
        class="btn-primary">
        <i class="fas fa-plus mr-2"></i>Add Framework
      </button>
    </div>
    
    <div class="bg-white rounded-lg shadow">
      <div id="frameworks-table-container" 
           hx-get="/compliance/frameworks/table" 
           hx-trigger="load, frameworkCreated from:body">
        <!-- Table will be loaded here -->
      </div>
    </div>
  </div>
  
  <div id="modal-container"></div>
`;

const renderFrameworksTable = (frameworks: any[]) => html`
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controls</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      ${frameworks.map(fw => html`
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${fw.name}</div>
            <div class="text-sm text-gray-500">${fw.description}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${fw.version}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fw.controlCount}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-1 mr-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-green-600 h-2 rounded-full" style="width: ${fw.compliance}%"></div>
                </div>
              </div>
              <span class="text-sm text-gray-900">${fw.compliance}%</span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fw.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              ${fw.active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <a href="/compliance/soa?framework=${fw.id}" class="text-blue-600 hover:text-blue-900 mr-3">Manage</a>
            <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

const renderSoAPage = () => html`
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Statement of Applicability</h2>
        <p class="text-gray-600 mt-1">Define control applicability and implementation status</p>
      </div>
    </div>
    
    <!-- Framework Selector -->
    <div class="bg-white rounded-lg shadow p-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Select Framework</label>
      <select 
        hx-get="/compliance/soa/table" 
        hx-trigger="change" 
        hx-target="#soa-table-container"
        name="framework"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
        <option value="">Select a framework...</option>
        <option value="iso27001">ISO 27001:2022</option>
        <option value="nist">NIST Cybersecurity Framework</option>
        <option value="gdpr">GDPR</option>
        <option value="hipaa">HIPAA</option>
        <option value="soc2">SOC 2 Type II</option>
      </select>
    </div>
    
    <!-- SoA Table -->
    <div class="bg-white rounded-lg shadow">
      <div id="soa-table-container">
        <!-- Table will be loaded here -->
      </div>
    </div>
  </div>
`;

const renderSoATable = (controls: any[]) => html`
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control ID</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control Name</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicable</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Implementation</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      ${controls.map(control => html`
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${control.id}</td>
          <td class="px-6 py-4 text-sm text-gray-900">${control.name}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <input 
              type="checkbox" 
              ${control.applicable ? 'checked' : ''}
              hx-put="/compliance/soa/${control.id}"
              hx-trigger="change"
              hx-vals='{"field": "applicable"}'
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <select 
              hx-put="/compliance/soa/${control.id}"
              hx-trigger="change"
              hx-vals='{"field": "implementation"}'
              class="text-sm rounded-md border-gray-300">
              <option value="not-started" ${control.implementation === 'not-started' ? 'selected' : ''}>Not Started</option>
              <option value="planned" ${control.implementation === 'planned' ? 'selected' : ''}>Planned</option>
              <option value="in-progress" ${control.implementation === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="implemented" ${control.implementation === 'implemented' ? 'selected' : ''}>Implemented</option>
            </select>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <button class="text-blue-600 hover:text-blue-900 text-sm">
              <i class="fas fa-paperclip mr-1"></i>
              ${control.evidenceCount || 0}
            </button>
          </td>
          <td class="px-6 py-4">
            <input 
              type="text" 
              value="${control.notes || ''}"
              hx-put="/compliance/soa/${control.id}"
              hx-trigger="blur"
              hx-vals='{"field": "notes"}'
              class="text-sm rounded-md border-gray-300 w-full">
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

const renderEvidencePage = () => html`
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Evidence Management</h2>
        <p class="text-gray-600 mt-1">Upload and manage compliance evidence</p>
      </div>
      <button 
        hx-get="/compliance/evidence/upload" 
        hx-target="#modal-container"
        class="btn-primary">
        <i class="fas fa-upload mr-2"></i>Upload Evidence
      </button>
    </div>
    
    <!-- Evidence Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-4">
        <input 
          type="text" 
          placeholder="Search evidence..."
          hx-get="/compliance/evidence/table"
          hx-trigger="keyup changed delay:500ms"
          hx-target="#evidence-table-container"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
        
        <select class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
          <option value="">All Types</option>
          <option value="document">Document</option>
          <option value="screenshot">Screenshot</option>
          <option value="report">Report</option>
          <option value="certificate">Certificate</option>
        </select>
        
        <select class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
    
    <!-- Evidence Table -->
    <div class="bg-white rounded-lg shadow">
      <div id="evidence-table-container" 
           hx-get="/compliance/evidence/table" 
           hx-trigger="load, evidenceUploaded from:body">
        <!-- Table will be loaded here -->
      </div>
    </div>
  </div>
  
  <div id="modal-container"></div>
`;

const renderAssessmentsPage = () => html`
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Compliance Assessments</h2>
        <p class="text-gray-600 mt-1">Track and manage compliance assessments</p>
      </div>
      <button 
        hx-get="/compliance/assessments/start" 
        hx-target="#modal-container"
        class="btn-primary">
        <i class="fas fa-play mr-2"></i>Start Assessment
      </button>
    </div>
    
    <!-- Assessment Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-clipboard-list text-blue-600"></i>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Total Assessments</p>
            <p class="text-lg font-semibold text-gray-900">24</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-hourglass-half text-yellow-600"></i>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">In Progress</p>
            <p class="text-lg font-semibold text-gray-900">3</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-check-circle text-green-600"></i>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Completed</p>
            <p class="text-lg font-semibold text-gray-900">21</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-percentage text-purple-600"></i>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Avg Compliance</p>
            <p class="text-lg font-semibold text-gray-900">82%</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Assessments Table -->
    <div class="bg-white rounded-lg shadow">
      <div id="assessments-table-container" 
           hx-get="/compliance/assessments/table" 
           hx-trigger="load">
        <!-- Table will be loaded here -->
      </div>
    </div>
  </div>
  
  <div id="modal-container"></div>
`;

// Database integrated functions
async function getFrameworks(db: DatabaseService) {
  try {
    const frameworks = await db.getFrameworks();
    return frameworks;
  } catch (error) {
    console.error('Database error, using fallback data:', error);
    // Fallback to mock data
    return [
      { id: 1, name: 'ISO 27001:2022', version: '2022', description: 'Information Security Management', controlCount: 93, compliance: 78, active: true },
      { id: 2, name: 'NIST CSF', version: '2.0', description: 'Cybersecurity Framework', controlCount: 108, compliance: 65, active: true },
      { id: 3, name: 'GDPR', version: 'EU 2016/679', description: 'General Data Protection Regulation', controlCount: 99, compliance: 92, active: true },
      { id: 4, name: 'HIPAA', version: '1996', description: 'Health Insurance Portability', controlCount: 78, compliance: 85, active: true },
      { id: 5, name: 'SOC 2', version: 'Type II', description: 'Service Organization Control', controlCount: 64, compliance: 71, active: false },
    ];
  }
}

async function getSoAControls(db: DatabaseService, frameworkId: string) {
  try {
    if (frameworkId) {
      const controls = await db.getControlsByFramework(parseInt(frameworkId));
      return controls;
    }
    return [];
  } catch (error) {
    console.error('Database error, using fallback data:', error);
    // Fallback to mock data
    return [
      { id: 'A.5.1', name: 'Information security policies', applicable: true, implementation: 'implemented', evidenceCount: 3, notes: 'Annual review scheduled' },
      { id: 'A.6.1', name: 'Internal organization', applicable: true, implementation: 'in-progress', evidenceCount: 2, notes: '' },
      { id: 'A.6.2', name: 'Mobile devices and teleworking', applicable: true, implementation: 'planned', evidenceCount: 0, notes: 'Q2 2024 implementation' },
      { id: 'A.7.1', name: 'Prior to employment', applicable: true, implementation: 'implemented', evidenceCount: 5, notes: '' },
      { id: 'A.8.1', name: 'Asset management', applicable: false, implementation: 'not-started', evidenceCount: 0, notes: 'Not applicable - outsourced' },
    ];
  }
}

async function getEvidence(db: DatabaseService) {
  try {
    const evidence = await db.getEvidence(1, 50); // Get first 50 evidence items
    return evidence;
  } catch (error) {
    console.error('Database error, using fallback data:', error);
    // Fallback to mock data
    return [
      { id: 1, name: 'Security Policy v2.1.pdf', type: 'document', status: 'approved', uploadedBy: 'John Smith', uploadedAt: '2024-01-15', size: '2.4 MB' },
      { id: 2, name: 'Firewall Configuration.png', type: 'screenshot', status: 'pending', uploadedBy: 'Jane Doe', uploadedAt: '2024-01-14', size: '856 KB' },
      { id: 3, name: 'Audit Report Q4 2023.pdf', type: 'report', status: 'approved', uploadedBy: 'Bob Johnson', uploadedAt: '2024-01-10', size: '5.2 MB' },
    ];
  }
}

async function getAssessments(db: DatabaseService) {
  try {
    const assessments = await db.getAssessments(1, 50); // Get first 50 assessments
    return assessments;
  } catch (error) {
    console.error('Database error, using fallback data:', error);
    // Fallback to mock data
    return [
      { id: 1, name: 'ISO 27001 Annual Assessment', framework: 'ISO 27001', status: 'completed', progress: 100, compliance: 78, startDate: '2023-10-01', completedDate: '2023-11-15' },
      { id: 2, name: 'GDPR Compliance Check', framework: 'GDPR', status: 'in-progress', progress: 65, compliance: null, startDate: '2024-01-05', completedDate: null },
      { id: 3, name: 'NIST CSF Gap Analysis', framework: 'NIST CSF', status: 'planned', progress: 0, compliance: null, startDate: '2024-02-01', completedDate: null },
    ];
  }
}

async function createFramework(db: DatabaseService, data: any, userId: number) {
  try {
    const framework = await db.createFramework({
      name: String(data.name || ''),
      version: String(data.version || '1.0'),
      description: String(data.description || ''),
      created_by: userId
    });
    return framework;
  } catch (error) {
    console.error('Error creating framework:', error);
    throw error;
  }
}

async function updateSoAControl(db: DatabaseService, id: string, data: any, userId: number) {
  try {
    const control = await db.updateControl(parseInt(id), {
      applicable: data.applicable === 'true',
      implementation_status: data.implementation,
      notes: data.notes || '',
      updated_by: userId
    });
    return control;
  } catch (error) {
    console.error('Error updating control:', error);
    throw error;
  }
}

async function uploadEvidence(db: DatabaseService, data: any, userId: number) {
  try {
    const evidence = await db.createEvidence({
      title: String(data.name || data.title || ''),
      description: String(data.description || ''),
      type: String(data.type || 'document'),
      status: 'pending',
      file_path: data.file_path || '',
      file_size: data.size || '0 KB',
      uploaded_by: userId
    });
    return evidence;
  } catch (error) {
    console.error('Error uploading evidence:', error);
    throw error;
  }
}

async function startAssessment(db: DatabaseService, data: any, userId: number) {
  try {
    const assessment = await db.createAssessment({
      name: String(data.name || ''),
      framework_id: parseInt(data.framework_id),
      assessor_id: userId,
      status: 'in-progress',
      start_date: new Date().toISOString().split('T')[0]
    });
    return assessment;
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
}

async function getAssessmentById(db: DatabaseService, id: string) {
  try {
    const assessment = await db.getAssessmentById(parseInt(id));
    if (assessment) {
      return assessment;
    }
  } catch (error) {
    console.error('Error fetching assessment:', error);
  }
  // Fallback to mock data
  return { id, name: 'Sample Assessment', framework: 'ISO 27001', status: 'in-progress' };
}

// Modal templates
const renderCreateFrameworkModal = () => html`
  <!-- Framework creation modal -->
`;

const renderUploadEvidenceModal = () => html`
  <!-- Evidence upload modal -->
`;

const renderStartAssessmentModal = () => html`
  <!-- Start assessment modal -->
`;

const renderEvidenceTable = (evidence: any[]) => html`
  <!-- Evidence table -->
`;

const renderAssessmentsTable = (assessments: any[]) => html`
  <!-- Assessments table -->
`;

const renderAssessmentDetails = (assessment: any) => html`
  <!-- Assessment details page -->
`;