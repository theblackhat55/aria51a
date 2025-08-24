// Document Management System Frontend
class DocumentManager {
  constructor() {
    this.documents = [];
    this.currentFilter = {
      type: '',
      status: 'active',
      search: ''
    };
  }

  async showDocuments() {
    updateActiveNavigation('documents');
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Document Management</h2>
            <p class="text-gray-600 mt-1">Manage and organize your documents</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="documentManager.showUploadModal()" class="btn-primary">
              <i class="fas fa-upload mr-2"></i>Upload Document
            </button>
            <button onclick="documentManager.refreshDocuments()" class="btn-secondary">
              <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text" 
                id="document-search" 
                placeholder="Search documents..." 
                class="form-input"
                onkeyup="documentManager.handleSearch(event)"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select id="document-type-filter" class="form-select" onchange="documentManager.applyFilters()">
                <option value="">All Types</option>
                <option value="policy">Policy</option>
                <option value="procedure">Procedure</option>
                <option value="report">Report</option>
                <option value="evidence">Evidence</option>
                <option value="certificate">Certificate</option>
                <option value="contract">Contract</option>
                <option value="training">Training</option>
                <option value="audit">Audit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="document-status-filter" class="form-select" onchange="documentManager.applyFilters()">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="documentManager.clearFilters()" class="btn-secondary w-full">
                <i class="fas fa-times mr-2"></i>Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Documents Grid -->
        <div id="documents-container" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <!-- Documents will be loaded here -->
        </div>

        <!-- Pagination -->
        <div id="documents-pagination" class="flex justify-center">
          <!-- Pagination will be added here -->
        </div>
      </div>
    `;

    // Load initial documents
    await this.loadDocuments();
  }

  async loadDocuments(page = 1, limit = 12) {
    try {
      const token = localStorage.getItem('aria_token');
      if (!token) return;

      showLoading('documents-container');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        status: this.currentFilter.status
      });

      if (this.currentFilter.type) params.append('type', this.currentFilter.type);
      if (this.currentFilter.search) params.append('search', this.currentFilter.search);

      const response = await axios.get(`/api/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.documents = response.data.data;
        this.renderDocuments();
      } else {
        showToast('Failed to load documents', 'error');
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      showToast('Failed to load documents', 'error');
    }
  }

  renderDocuments() {
    const container = document.getElementById('documents-container');
    if (!container) return;

    if (this.documents.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p class="text-gray-600 mb-4">Upload your first document to get started</p>
          <button onclick="documentManager.showUploadModal()" class="btn-primary">
            <i class="fas fa-upload mr-2"></i>Upload Document
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.documents.map(doc => `
      <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-lg ${this.getDocumentTypeColor(doc.document_type)} flex items-center justify-center">
                <i class="${this.getDocumentTypeIcon(doc.document_type)} text-xl"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-medium text-gray-900 truncate">${doc.title || doc.original_file_name}</h3>
              <p class="text-sm text-gray-500">${doc.original_file_name}</p>
            </div>
          </div>
          <div class="flex-shrink-0">
            <div class="dropdown relative">
              <button class="text-gray-400 hover:text-gray-600 p-1" onclick="documentManager.toggleDocumentMenu(${doc.id})">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div id="doc-menu-${doc.id}" class="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden">
                <a href="#" onclick="documentManager.viewDocument(${doc.id})" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <i class="fas fa-eye mr-2"></i>View
                </a>
                <a href="#" onclick="documentManager.downloadDocument(${doc.id})" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <i class="fas fa-download mr-2"></i>Download
                </a>
                ${doc.uploaded_by === currentUser?.id || currentUser?.role === 'admin' ? `
                  <a href="#" onclick="documentManager.editDocument(${doc.id})" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <i class="fas fa-edit mr-2"></i>Edit
                  </a>
                  <a href="#" onclick="documentManager.shareDocument(${doc.id})" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <i class="fas fa-share mr-2"></i>Share
                  </a>
                  <hr class="my-1">
                  <a href="#" onclick="documentManager.deleteDocument(${doc.id})" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <i class="fas fa-trash mr-2"></i>Delete
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        ${doc.description ? `<p class="text-gray-600 text-sm mb-4 line-clamp-2">${doc.description}</p>` : ''}

        <div class="flex items-center justify-between text-sm text-gray-500">
          <div class="flex items-center space-x-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getDocumentTypeBadge(doc.document_type)}">
              ${doc.document_type}
            </span>
            <span>${this.formatFileSize(doc.file_size)}</span>
          </div>
          <div class="text-right">
            <div class="text-xs">${doc.first_name} ${doc.last_name}</div>
            <div class="text-xs">${this.formatDate(doc.upload_date)}</div>
          </div>
        </div>

        ${doc.tags ? `
          <div class="mt-3 flex flex-wrap gap-1">
            ${JSON.parse(doc.tags).map(tag => `
              <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
                ${tag}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Setup click outside to close dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    });
  }

  getDocumentTypeIcon(type) {
    const icons = {
      policy: 'fas fa-file-contract',
      procedure: 'fas fa-file-alt',
      report: 'fas fa-chart-line',
      evidence: 'fas fa-file-signature',
      certificate: 'fas fa-certificate',
      contract: 'fas fa-handshake',
      training: 'fas fa-graduation-cap',
      audit: 'fas fa-search',
      other: 'fas fa-file'
    };
    return icons[type] || icons.other;
  }

  getDocumentTypeColor(type) {
    const colors = {
      policy: 'bg-blue-100 text-blue-600',
      procedure: 'bg-green-100 text-green-600',
      report: 'bg-purple-100 text-purple-600',
      evidence: 'bg-yellow-100 text-yellow-600',
      certificate: 'bg-red-100 text-red-600',
      contract: 'bg-indigo-100 text-indigo-600',
      training: 'bg-pink-100 text-pink-600',
      audit: 'bg-orange-100 text-orange-600',
      other: 'bg-gray-100 text-gray-600'
    };
    return colors[type] || colors.other;
  }

  getDocumentTypeBadge(type) {
    const badges = {
      policy: 'bg-blue-100 text-blue-800',
      procedure: 'bg-green-100 text-green-800',
      report: 'bg-purple-100 text-purple-800',
      evidence: 'bg-yellow-100 text-yellow-800',
      certificate: 'bg-red-100 text-red-800',
      contract: 'bg-indigo-100 text-indigo-800',
      training: 'bg-pink-100 text-pink-800',
      audit: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return badges[type] || badges.other;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  toggleDocumentMenu(docId) {
    const menu = document.getElementById(`doc-menu-${docId}`);
    if (menu) {
      // Close all other menus
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.add('hidden');
      });
      menu.classList.toggle('hidden');
    }
  }

  showUploadModal() {
    const modalHTML = `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">File</label>
          <div id="file-drop-zone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <div id="drop-zone-content">
              <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
              <p class="text-gray-600">Click to select file or drag and drop</p>
              <p class="text-sm text-gray-500">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)</p>
            </div>
            <input type="file" id="document-file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" id="document-title" class="form-input" placeholder="Document title">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select id="document-type" class="form-select">
              <option value="other">Other</option>
              <option value="policy">Policy</option>
              <option value="procedure">Procedure</option>
              <option value="report">Report</option>
              <option value="evidence">Evidence</option>
              <option value="certificate">Certificate</option>
              <option value="contract">Contract</option>
              <option value="training">Training</option>
              <option value="audit">Audit</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="document-description" rows="3" class="form-textarea" placeholder="Optional description"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <select id="document-visibility" class="form-select">
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input type="text" id="document-tags" class="form-input" placeholder="tag1, tag2, tag3">
          </div>
        </div>
      </div>
    `;

    showModal('Upload Document', modalHTML, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal()' },
      { text: 'Upload', class: 'btn-primary', onclick: 'documentManager.uploadDocument()' }
    ]);

    // Setup file drop zone
    this.setupFileDropZone();
  }

  setupFileDropZone() {
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('document-file');
    const dropContent = document.getElementById('drop-zone-content');

    if (!dropZone || !fileInput) return;

    // Click to select file
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-400', 'bg-blue-50');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-400', 'bg-blue-50');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-400', 'bg-blue-50');
      
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  handleFileSelect(file) {
    const dropContent = document.getElementById('drop-zone-content');
    const titleInput = document.getElementById('document-title');
    
    if (dropContent) {
      dropContent.innerHTML = `
        <div class="flex items-center justify-center space-x-3">
          <i class="fas fa-file text-2xl text-blue-600"></i>
          <div class="text-left">
            <p class="font-medium text-gray-900">${file.name}</p>
            <p class="text-sm text-gray-500">${this.formatFileSize(file.size)}</p>
          </div>
        </div>
      `;
    }

    // Auto-fill title if empty
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
    }
  }

  async uploadDocument() {
    try {
      const fileInput = document.getElementById('document-file');
      const title = document.getElementById('document-title')?.value;
      const type = document.getElementById('document-type')?.value;
      const description = document.getElementById('document-description')?.value;
      const visibility = document.getElementById('document-visibility')?.value;
      const tagsInput = document.getElementById('document-tags')?.value;

      if (!fileInput?.files[0]) {
        showToast('Please select a file', 'error');
        return;
      }

      const file = fileInput.files[0];
      const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      // In a real implementation, you would upload the file to R2 or similar storage
      // For now, we'll simulate the upload with metadata
      const documentData = {
        file_name: file.name,
        original_file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        title: title || file.name,
        description,
        document_type: type,
        visibility,
        tags
      };

      const token = localStorage.getItem('aria_token');
      const response = await axios.post('/api/documents', documentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast('Document uploaded successfully', 'success');
        closeModal();
        this.loadDocuments(); // Refresh list
      } else {
        showToast('Failed to upload document', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload document', 'error');
    }
  }

  async viewDocument(docId) {
    try {
      const token = localStorage.getItem('aria_token');
      const response = await axios.get(`/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const doc = response.data.data;
        this.showDocumentModal(doc);
      } else {
        showToast('Failed to load document', 'error');
      }
    } catch (error) {
      console.error('View document error:', error);
      showToast('Failed to load document', 'error');
    }
  }

  showDocumentModal(doc) {
    const modalHTML = `
      <div class="space-y-4">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="w-16 h-16 rounded-lg ${this.getDocumentTypeColor(doc.document_type)} flex items-center justify-center">
              <i class="${this.getDocumentTypeIcon(doc.document_type)} text-2xl"></i>
            </div>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-medium text-gray-900">${doc.title || doc.original_file_name}</h3>
            <p class="text-gray-600">${doc.original_file_name}</p>
            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getDocumentTypeBadge(doc.document_type)}">
                ${doc.document_type}
              </span>
              <span>${this.formatFileSize(doc.file_size)}</span>
              <span>v${doc.version}</span>
            </div>
          </div>
        </div>

        ${doc.description ? `
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">Description</h4>
            <p class="text-gray-700">${doc.description}</p>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 class="font-medium text-gray-900 mb-1">Uploaded by</h4>
            <p class="text-gray-600">${doc.first_name} ${doc.last_name}</p>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-1">Upload date</h4>
            <p class="text-gray-600">${this.formatDate(doc.upload_date)}</p>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-1">Visibility</h4>
            <p class="text-gray-600 capitalize">${doc.visibility}</p>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-1">Status</h4>
            <p class="text-gray-600 capitalize">${doc.status}</p>
          </div>
        </div>

        ${doc.tags ? `
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">Tags</h4>
            <div class="flex flex-wrap gap-2">
              ${JSON.parse(doc.tags).map(tag => `
                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
                  ${tag}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="pt-4 border-t border-gray-200">
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-3">Document preview not available</p>
            <p class="text-xs text-gray-400">In a full implementation, document preview would be shown here using PDF.js or similar viewers</p>
          </div>
        </div>
      </div>
    `;

    showModal(`Document: ${doc.title || doc.original_file_name}`, modalHTML, [
      { text: 'Download', class: 'btn-secondary', onclick: `documentManager.downloadDocument(${doc.id})` },
      { text: 'Close', class: 'btn-primary', onclick: 'closeModal()' }
    ]);
  }

  downloadDocument(docId) {
    // In a real implementation, this would trigger a file download
    showToast('Download functionality would be implemented with actual file storage', 'info');
  }

  async deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('aria_token');
      const response = await axios.delete(`/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast('Document deleted successfully', 'success');
        this.loadDocuments(); // Refresh list
      } else {
        showToast('Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Delete document error:', error);
      showToast('Failed to delete document', 'error');
    }
  }

  handleSearch(event) {
    if (event.key === 'Enter' || event.type === 'input') {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.currentFilter.search = event.target.value;
        this.loadDocuments();
      }, 500);
    }
  }

  applyFilters() {
    const typeFilter = document.getElementById('document-type-filter')?.value;
    const statusFilter = document.getElementById('document-status-filter')?.value;

    this.currentFilter.type = typeFilter || '';
    this.currentFilter.status = statusFilter || 'active';
    
    this.loadDocuments();
  }

  clearFilters() {
    this.currentFilter = {
      type: '',
      status: 'active',
      search: ''
    };

    // Reset form elements
    const searchInput = document.getElementById('document-search');
    const typeFilter = document.getElementById('document-type-filter');
    const statusFilter = document.getElementById('document-status-filter');

    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = '';
    if (statusFilter) statusFilter.value = 'active';

    this.loadDocuments();
  }

  async refreshDocuments() {
    await this.loadDocuments();
    showToast('Documents refreshed', 'success');
  }
}

// Global document manager instance
const documentManager = new DocumentManager();