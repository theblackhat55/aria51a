import { Hono } from 'hono'

const app = new Hono()

// Document Management Dashboard
app.get('/', async (c) => {
  const search = c.req.query('search') || ''
  const type = c.req.query('type') || ''
  const status = c.req.query('status') || 'active'
  
  const documents = await getDocuments({ search, type, status })
  const documentStats = await getDocumentStats()
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-file-alt mr-3 text-blue-600"></i>Document Management
          </h2>
          <p class="text-gray-600 mt-1">Manage and organize your documents, policies, and compliance artifacts</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-get="/documents/upload"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-primary">
            <i class="fas fa-upload mr-2"></i>Upload Document
          </button>
          <button 
            hx-get="/documents/bulk-operations"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-tasks mr-2"></i>Bulk Operations
          </button>
          <button 
            hx-get="/documents"
            hx-target="#main-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      <!-- Document Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        ${renderDocumentStats(documentStats)}
      </div>

      <!-- Filters and Search -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Documents</label>
            <input 
              type="text" 
              name="search" 
              value="${search}"
              placeholder="Search by name, content, or tags..." 
              class="form-input"
              hx-get="/documents/grid"
              hx-target="#documents-grid"
              hx-trigger="keyup changed delay:300ms"
              hx-include="[name='type'], [name='status'], [name='sort']">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select 
              name="type" 
              class="form-select"
              hx-get="/documents/grid"
              hx-target="#documents-grid"
              hx-trigger="change"
              hx-include="[name='search'], [name='status'], [name='sort']">
              <option value="">All Types</option>
              <option value="policy" ${type === 'policy' ? 'selected' : ''}>Policy</option>
              <option value="procedure" ${type === 'procedure' ? 'selected' : ''}>Procedure</option>
              <option value="report" ${type === 'report' ? 'selected' : ''}>Report</option>
              <option value="evidence" ${type === 'evidence' ? 'selected' : ''}>Evidence</option>
              <option value="certificate" ${type === 'certificate' ? 'selected' : ''}>Certificate</option>
              <option value="contract" ${type === 'contract' ? 'selected' : ''}>Contract</option>
              <option value="training" ${type === 'training' ? 'selected' : ''}>Training Material</option>
              <option value="audit" ${type === 'audit' ? 'selected' : ''}>Audit Document</option>
              <option value="other" ${type === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              class="form-select"
              hx-get="/documents/grid"
              hx-target="#documents-grid"
              hx-trigger="change"
              hx-include="[name='search'], [name='type'], [name='sort']">
              <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
              <option value="archived" ${status === 'archived' ? 'selected' : ''}>Archived</option>
              <option value="draft" ${status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="expired" ${status === 'expired' ? 'selected' : ''}>Expired</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select 
              name="sort" 
              class="form-select"
              hx-get="/documents/grid"
              hx-target="#documents-grid"
              hx-trigger="change"
              hx-include="[name='search'], [name='type'], [name='status']">
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="size_desc">Largest First</option>
              <option value="modified_desc">Recently Modified</option>
            </select>
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">${documents.length} documents found</span>
          </div>
          <div class="flex items-center space-x-2">
            <button 
              hx-get="/documents/export"
              hx-trigger="click"
              class="btn-outline">
              <i class="fas fa-download mr-2"></i>Export List
            </button>
            <div class="flex items-center space-x-1 border rounded-lg p-1">
              <button class="p-2 rounded text-gray-600 hover:bg-gray-100" title="Grid View">
                <i class="fas fa-th-large"></i>
              </button>
              <button class="p-2 rounded text-gray-600 hover:bg-gray-100" title="List View">
                <i class="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Grid -->
      <div id="documents-grid">
        ${renderDocumentsGrid(documents)}
      </div>
    </div>
  `)
})

// Documents grid content (for HTMX updates)
app.get('/grid', async (c) => {
  const search = c.req.query('search') || ''
  const type = c.req.query('type') || ''
  const status = c.req.query('status') || 'active'
  const sort = c.req.query('sort') || 'created_desc'
  
  const documents = await getDocuments({ search, type, status, sort })
  return c.html(renderDocumentsGrid(documents))
})

// Upload Document modal
app.get('/upload', async (c) => {
  const documentTypes = await getDocumentTypes()
  const complianceFrameworks = await getComplianceFrameworks()
  
  return c.html(`
    <div class="modal-header">
      <h3 class="text-lg font-semibold text-gray-900">Upload Document</h3>
    </div>
    <form hx-post="/documents/upload" hx-target="#main-content" hx-swap="outerHTML" hx-encoding="multipart/form-data">
      <div class="modal-body space-y-4">
        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select File *</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input type="file" name="file" required class="hidden" id="file-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md">
            <div id="file-drop-zone" class="cursor-pointer" onclick="document.getElementById('file-input').click()">
              <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
              <p class="text-gray-600">Click to select file or drag and drop</p>
              <p class="text-xs text-gray-500 mt-1">PDF, DOC, XLS, PPT, TXT, MD (Max 50MB)</p>
            </div>
            <div id="file-preview" class="hidden mt-4 p-3 bg-gray-50 rounded border text-left">
              <div class="flex items-center space-x-3">
                <i class="fas fa-file text-gray-500"></i>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900" id="file-name"></p>
                  <p class="text-xs text-gray-500" id="file-size"></p>
                </div>
                <button type="button" onclick="clearFileSelection()" class="text-red-500 hover:text-red-700">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
            <input type="text" name="name" required class="form-input" 
              placeholder="e.g., Information Security Policy v2.1">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
            <select name="type" required class="form-select">
              <option value="">Select Type</option>
              ${documentTypes.map(type => `<option value="${type.value}">${type.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows="3" class="form-textarea" 
            placeholder="Brief description of the document's purpose and content..."></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Owner/Author</label>
            <input type="text" name="owner" class="form-input" 
              placeholder="Document owner or author">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select name="department" class="form-select">
              <option value="">Select Department</option>
              <option value="IT">Information Technology</option>
              <option value="HR">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal & Compliance</option>
              <option value="Operations">Operations</option>
              <option value="Security">Security</option>
              <option value="Quality">Quality Assurance</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Compliance Framework</label>
            <select name="compliance_framework" class="form-select">
              <option value="">None Selected</option>
              ${complianceFrameworks.map(framework => `<option value="${framework.value}">${framework.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Classification Level</label>
            <select name="classification" class="form-select">
              <option value="public">Public</option>
              <option value="internal" selected>Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <input type="text" name="version" class="form-input" 
              placeholder="e.g., v1.0, 2024.1" value="v1.0">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
            <input type="date" name="review_date" class="form-input">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input type="text" name="tags" class="form-input" 
            placeholder="Separate tags with commas (e.g., security, policy, ISO27001)">
          <p class="text-xs text-gray-500 mt-1">Use tags to improve searchability and organization</p>
        </div>

        <div class="flex items-center">
          <input type="checkbox" name="auto_extract" id="auto-extract" class="mr-2" checked>
          <label for="auto-extract" class="text-sm text-gray-700">
            Automatically extract metadata and content for search
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Upload Document
        </button>
      </div>
    </form>

    <script>
      // File input handling
      document.getElementById('file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          document.getElementById('file-name').textContent = file.name;
          document.getElementById('file-size').textContent = formatFileSize(file.size);
          document.getElementById('file-preview').classList.remove('hidden');
          
          // Auto-populate document name if empty
          const nameInput = document.querySelector('input[name="name"]');
          if (!nameInput.value) {
            nameInput.value = file.name.replace(/\.[^/.]+$/, "");
          }
        }
      });

      function clearFileSelection() {
        document.getElementById('file-input').value = '';
        document.getElementById('file-preview').classList.add('hidden');
      }

      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }
    </script>
  `)
})

// Upload Document
app.post('/upload', async (c) => {
  try {
    const formData = await c.req.parseBody()
    
    // In a real implementation, handle file upload to R2 or file system
    const document = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      description: formData.description,
      owner: formData.owner,
      department: formData.department,
      compliance_framework: formData.compliance_framework,
      classification: formData.classification,
      version: formData.version,
      review_date: formData.review_date,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      auto_extract: formData.auto_extract === 'on',
      file_size: 1024 * 1024, // Mock file size
      file_type: 'application/pdf', // Mock file type
      upload_date: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      status: 'active',
      download_count: 0
    }

    // Mock file upload - in real implementation, save to R2 or file system
    await createDocument(document)

    return c.html(`
      <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">Document Uploaded Successfully</h3>
            <p class="text-sm text-green-700 mt-1">
              "${document.name}" has been uploaded and is now available in the document library.
            </p>
          </div>
        </div>
      </div>
      <script>
        setTimeout(() => {
          htmx.ajax('GET', '/documents', {target: '#main-content'});
          closeModal();
        }, 2000);
      </script>
    `)
  } catch (error) {
    return c.html(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-red-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Upload Failed</h3>
            <p class="text-sm text-red-700 mt-1">${error.message}</p>
          </div>
        </div>
      </div>
    `)
  }
})

// View Document Details
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const document = await getDocumentById(id)
  
  if (!document) {
    return c.html(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4">
        <p class="text-red-700">Document not found</p>
      </div>
    `)
  }

  return c.html(`
    <div class="modal-header">
      <h3 class="text-lg font-semibold text-gray-900">Document Details</h3>
    </div>
    <div class="modal-body space-y-4">
      <!-- Document Info -->
      <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
        <div class="flex-shrink-0">
          <div class="w-16 h-16 rounded-lg ${getDocumentTypeColor(document.type)} flex items-center justify-center">
            <i class="fas ${getDocumentTypeIcon(document.type)} text-white text-xl"></i>
          </div>
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900">${document.name}</h4>
          <p class="text-sm text-gray-600">${document.description || 'No description available'}</p>
          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span><i class="fas fa-calendar mr-1"></i>Uploaded: ${formatDate(document.upload_date)}</span>
            <span><i class="fas fa-file mr-1"></i>${formatFileSize(document.file_size)}</span>
            <span><i class="fas fa-download mr-1"></i>${document.download_count} downloads</span>
          </div>
        </div>
      </div>

      <!-- Document Metadata -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Type</label>
            <p class="text-sm text-gray-900">${document.type}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Owner</label>
            <p class="text-sm text-gray-900">${document.owner || 'Not specified'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Department</label>
            <p class="text-sm text-gray-900">${document.department || 'Not specified'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Classification</label>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassificationColor(document.classification)}">
              ${document.classification}
            </span>
          </div>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Version</label>
            <p class="text-sm text-gray-900">${document.version || 'Not specified'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Compliance Framework</label>
            <p class="text-sm text-gray-900">${document.compliance_framework || 'None'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Review Date</label>
            <p class="text-sm text-gray-900">${document.review_date || 'Not set'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}">
              ${document.status}
            </span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      ${document.tags && document.tags.length > 0 ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div class="flex flex-wrap gap-2">
            ${document.tags.map(tag => `
              <span class="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                ${tag}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    <div class="modal-footer">
      <button 
        hx-get="/documents/${document.id}/download"
        hx-trigger="click"
        class="btn-primary">
        <i class="fas fa-download mr-2"></i>Download
      </button>
      <button 
        hx-get="/documents/${document.id}/edit"
        hx-target="#modal-content"
        hx-trigger="click"
        class="btn-secondary">
        <i class="fas fa-edit mr-2"></i>Edit
      </button>
      <button type="button" onclick="closeModal()" class="btn-outline">Close</button>
    </div>
  `)
})

// Mock data functions
async function getDocuments(filters: any = {}) {
  // Mock document data
  const allDocuments = [
    {
      id: '1',
      name: 'Information Security Policy v2.1',
      type: 'policy',
      description: 'Comprehensive information security policy covering all organizational security requirements',
      owner: 'Jane Smith',
      department: 'Security',
      classification: 'internal',
      compliance_framework: 'ISO 27001',
      version: 'v2.1',
      review_date: '2025-06-01',
      tags: ['security', 'policy', 'iso27001'],
      upload_date: '2024-09-01T10:00:00Z',
      last_modified: '2024-09-01T10:00:00Z',
      file_size: 2048000,
      file_type: 'application/pdf',
      status: 'active',
      download_count: 15
    },
    {
      id: '2',
      name: 'Data Protection Impact Assessment Template',
      type: 'procedure',
      description: 'Standard template for conducting data protection impact assessments',
      owner: 'Legal Team',
      department: 'Legal',
      classification: 'internal',
      compliance_framework: 'GDPR',
      version: 'v1.3',
      review_date: '2025-03-15',
      tags: ['gdpr', 'privacy', 'assessment', 'template'],
      upload_date: '2024-08-15T14:30:00Z',
      last_modified: '2024-08-20T09:15:00Z',
      file_size: 1536000,
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: 'active',
      download_count: 8
    },
    {
      id: '3',
      name: 'Q3 2024 Compliance Report',
      type: 'report',
      description: 'Quarterly compliance status report covering all frameworks',
      owner: 'Compliance Officer',
      department: 'Legal',
      classification: 'confidential',
      compliance_framework: 'Multiple',
      version: 'v1.0',
      review_date: null,
      tags: ['compliance', 'report', 'q3', '2024'],
      upload_date: '2024-10-01T08:00:00Z',
      last_modified: '2024-10-01T08:00:00Z',
      file_size: 3072000,
      file_type: 'application/pdf',
      status: 'active',
      download_count: 22
    }
  ]
  
  return allDocuments.filter(doc => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!doc.name.toLowerCase().includes(searchLower) &&
          !doc.description?.toLowerCase().includes(searchLower) &&
          !doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))) {
        return false
      }
    }
    if (filters.type && doc.type !== filters.type) return false
    if (filters.status && doc.status !== filters.status) return false
    return true
  })
}

async function getDocumentStats() {
  return {
    total: 45,
    thisMonth: 8,
    pendingReview: 5,
    expiring: 3
  }
}

async function getDocumentTypes() {
  return [
    { value: 'policy', label: 'Policy Document' },
    { value: 'procedure', label: 'Procedure/Process' },
    { value: 'report', label: 'Report/Analysis' },
    { value: 'evidence', label: 'Evidence/Proof' },
    { value: 'certificate', label: 'Certificate/Certification' },
    { value: 'contract', label: 'Contract/Agreement' },
    { value: 'training', label: 'Training Material' },
    { value: 'audit', label: 'Audit Document' },
    { value: 'other', label: 'Other' }
  ]
}

async function getComplianceFrameworks() {
  return [
    { value: 'iso27001', label: 'ISO 27001' },
    { value: 'gdpr', label: 'GDPR' },
    { value: 'ccpa', label: 'CCPA' },
    { value: 'hipaa', label: 'HIPAA' },
    { value: 'sox', label: 'SOX' },
    { value: 'pci', label: 'PCI DSS' },
    { value: 'nist', label: 'NIST Framework' }
  ]
}

async function createDocument(document: any) {
  console.log('Creating document:', document)
  return document
}

async function getDocumentById(id: string) {
  const documents = await getDocuments()
  return documents.find(doc => doc.id === id)
}

// Helper functions
function renderDocumentStats(stats: any) {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-lg">
          <i class="fas fa-file-alt text-blue-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Documents</p>
          <p class="text-2xl font-bold text-gray-900">${stats.total}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-green-100 rounded-lg">
          <i class="fas fa-plus text-green-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Added This Month</p>
          <p class="text-2xl font-bold text-gray-900">${stats.thisMonth}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-yellow-100 rounded-lg">
          <i class="fas fa-clock text-yellow-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Pending Review</p>
          <p class="text-2xl font-bold text-gray-900">${stats.pendingReview}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-red-100 rounded-lg">
          <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Expiring Soon</p>
          <p class="text-2xl font-bold text-gray-900">${stats.expiring}</p>
        </div>
      </div>
    </div>
  `
}

function renderDocumentsGrid(documents: any[]) {
  if (!documents.length) {
    return `
      <div class="col-span-full bg-white rounded-lg shadow text-center py-12">
        <i class="fas fa-file-alt text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
        <p class="text-gray-500 mb-6">Upload your first document to get started.</p>
        <button 
          hx-get="/documents/upload"
          hx-target="#modal-content"
          hx-trigger="click"
          class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Upload Document
        </button>
      </div>
    `
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${documents.map(doc => `
        <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
          <!-- Document Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 rounded-lg ${getDocumentTypeColor(doc.type)} flex items-center justify-center">
                  <i class="fas ${getDocumentTypeIcon(doc.type)} text-white"></i>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-gray-900 truncate" title="${doc.name}">
                  ${doc.name}
                </h4>
                <p class="text-xs text-gray-500">${doc.type}</p>
              </div>
            </div>
            <div class="flex-shrink-0">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}">
                ${doc.status}
              </span>
            </div>
          </div>

          <!-- Document Info -->
          <div class="space-y-2 mb-4">
            ${doc.description ? `<p class="text-sm text-gray-600 line-clamp-2">${doc.description}</p>` : ''}
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span><i class="fas fa-user mr-1"></i>${doc.owner || 'Unknown'}</span>
              <span><i class="fas fa-calendar mr-1"></i>${formatDate(doc.upload_date)}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span><i class="fas fa-file mr-1"></i>${formatFileSize(doc.file_size)}</span>
              <span><i class="fas fa-download mr-1"></i>${doc.download_count} downloads</span>
            </div>
          </div>

          <!-- Tags -->
          ${doc.tags && doc.tags.length > 0 ? `
            <div class="mb-4">
              <div class="flex flex-wrap gap-1">
                ${doc.tags.slice(0, 3).map(tag => `
                  <span class="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    ${tag}
                  </span>
                `).join('')}
                ${doc.tags.length > 3 ? `<span class="text-xs text-gray-500">+${doc.tags.length - 3} more</span>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <button 
              hx-get="/documents/${doc.id}"
              hx-target="#modal-content"
              hx-trigger="click"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium">
              <i class="fas fa-eye mr-1"></i>View
            </button>
            <div class="flex items-center space-x-2">
              <button 
                hx-get="/documents/${doc.id}/download"
                hx-trigger="click"
                class="text-gray-600 hover:text-gray-700"
                title="Download">
                <i class="fas fa-download"></i>
              </button>
              <button 
                hx-get="/documents/${doc.id}/edit"
                hx-target="#modal-content"
                hx-trigger="click"
                class="text-gray-600 hover:text-gray-700"
                title="Edit">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

// Utility functions
function getDocumentTypeColor(type: string): string {
  switch (type) {
    case 'policy': return 'bg-purple-500'
    case 'procedure': return 'bg-blue-500'
    case 'report': return 'bg-green-500'
    case 'evidence': return 'bg-yellow-500'
    case 'certificate': return 'bg-orange-500'
    case 'contract': return 'bg-red-500'
    case 'training': return 'bg-indigo-500'
    case 'audit': return 'bg-pink-500'
    default: return 'bg-gray-500'
  }
}

function getDocumentTypeIcon(type: string): string {
  switch (type) {
    case 'policy': return 'fa-shield-alt'
    case 'procedure': return 'fa-cogs'
    case 'report': return 'fa-chart-bar'
    case 'evidence': return 'fa-clipboard-check'
    case 'certificate': return 'fa-certificate'
    case 'contract': return 'fa-handshake'
    case 'training': return 'fa-graduation-cap'
    case 'audit': return 'fa-search'
    default: return 'fa-file'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'archived': return 'bg-gray-100 text-gray-800'
    case 'draft': return 'bg-yellow-100 text-yellow-800'
    case 'expired': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'public': return 'bg-green-100 text-green-800'
    case 'internal': return 'bg-blue-100 text-blue-800'
    case 'confidential': return 'bg-yellow-100 text-yellow-800'
    case 'restricted': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export default app