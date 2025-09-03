// AI Governance Charts and Interactive Components

// Initialize AI Governance charts
function initializeAIGovernanceCharts(data) {
  // Risk Level Distribution Chart
  const riskCtx = document.getElementById('ai-risk-chart');
  if (riskCtx) {
    new Chart(riskCtx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [
            data.riskLevelBreakdown.critical,
            data.riskLevelBreakdown.high,
            data.riskLevelBreakdown.medium,
            data.riskLevelBreakdown.low
          ],
          backgroundColor: [
            '#EF4444', // Critical - Red
            '#F97316', // High - Orange
            '#EAB308', // Medium - Yellow
            '#22C55E'  // Low - Green
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // System Status Chart
  const statusCtx = document.getElementById('ai-status-chart');
  if (statusCtx) {
    new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: ['Development', 'Testing', 'Production', 'Retired'],
        datasets: [{
          label: 'AI Systems',
          data: [
            data.statusBreakdown.development,
            data.statusBreakdown.testing,
            data.statusBreakdown.production,
            data.statusBreakdown.retired
          ],
          backgroundColor: [
            '#3B82F6', // Development - Blue
            '#8B5CF6', // Testing - Purple
            '#10B981', // Production - Green
            '#6B7280'  // Retired - Gray
          ],
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.y} systems`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}

// Modal functions
function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) {
    modalContainer.innerHTML = '';
  }
}

// Global modal functionality
document.addEventListener('DOMContentLoaded', function() {
  // Handle HTMX modal responses
  document.body.addEventListener('htmx:beforeSwap', function(event) {
    // If the response is for modal-content, wrap it in modal structure
    if (event.detail.target.id === 'modal-content') {
      const modalContainer = document.getElementById('modal-container');
      if (modalContainer && !modalContainer.querySelector('.modal-overlay')) {
        modalContainer.innerHTML = `
          <div class="modal-overlay fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="modal-dialog bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div id="modal-content">
                ${event.detail.xhr.responseText}
              </div>
            </div>
          </div>
        `;
        event.detail.shouldSwap = false;
        
        // Add click outside to close
        const overlay = modalContainer.querySelector('.modal-overlay');
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            closeModal();
          }
        });
        
        // Add escape key to close
        document.addEventListener('keydown', function escapeHandler(e) {
          if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
          }
        });
      }
    }
  });
});

// AI System status color helpers
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'production': return 'bg-green-100 text-green-800';
    case 'testing': return 'bg-blue-100 text-blue-800';
    case 'development': return 'bg-yellow-100 text-yellow-800';
    case 'retired': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getRiskLevelColor(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Toast notifications
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast-message max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ease-in-out`;
  
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }[type] || 'bg-blue-50 border-blue-200';
  
  const iconClass = {
    success: 'fas fa-check-circle text-green-500',
    error: 'fas fa-exclamation-circle text-red-500',
    warning: 'fas fa-exclamation-triangle text-yellow-500',
    info: 'fas fa-info-circle text-blue-500'
  }[type] || 'fas fa-info-circle text-blue-500';
  
  toast.innerHTML = `
    <div class="flex p-4 ${bgColor} border rounded-lg">
      <div class="flex-shrink-0">
        <i class="${iconClass}"></i>
      </div>
      <div class="ml-3">
        <p class="text-sm text-gray-700">${message}</p>
      </div>
      <div class="ml-auto pl-3">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// Loading states
function showLoading(target) {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (element) {
    element.innerHTML = `
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
        <span class="ml-2 text-gray-600">Loading...</span>
      </div>
    `;
  }
}

// HTMX Event Handlers
document.body.addEventListener('htmx:beforeRequest', function(event) {
  // Show loading for long operations
  if (event.detail.target.id === 'main-content') {
    document.querySelector('.htmx-indicator')?.classList.remove('hidden');
  }
});

document.body.addEventListener('htmx:afterRequest', function(event) {
  // Hide loading
  document.querySelector('.htmx-indicator')?.classList.add('hidden');
  
  // Reinitialize charts if they exist
  setTimeout(() => {
    const chartData = window.aiGovernanceData;
    if (chartData && typeof initializeAIGovernanceCharts === 'function') {
      initializeAIGovernanceCharts(chartData);
    }
  }, 100);
});

// Export functions for global use
window.closeModal = closeModal;
window.showToast = showToast;
window.showLoading = showLoading;
window.initializeAIGovernanceCharts = initializeAIGovernanceCharts;