// Global UI Helpers - Single Source of Truth
// Provides: createModal, closeModal, showModal, closeUniversalModal,
// showToast, showLoading, hideLoading, updateActiveNavigation,
// showError, formatDate, getSeverityClass, getRiskScoreColor, getRiskLevel

(function () {
  // --- Utilities ---
  function formatDate(input) {
    try {
      if (!input) return '';
      const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
      if (isNaN(d.getTime())) return '';
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return '';
    }
  }

  function getSeverityClass(sev) {
    const s = String(sev || '').toLowerCase();
    if (s === 'critical') return 'bg-red-100 text-red-700';
    if (s === 'high') return 'bg-orange-100 text-orange-700';
    if (s === 'medium') return 'bg-yellow-100 text-yellow-700';
    if (s === 'low') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  }

  function getRiskLevel(score) {
    const n = Number(score) || 0;
    if (n >= 20) return 'Critical';
    if (n >= 15) return 'High';
    if (n >= 8) return 'Medium';
    return 'Low';
  }

  function getRiskScoreColor(score) {
    const n = Number(score) || 0;
    if (n >= 20) return 'text-red-600';
    if (n >= 15) return 'text-orange-600';
    if (n >= 8) return 'text-yellow-600';
    return 'text-green-600';
  }

  // --- Toasts ---
  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'fixed top-4 right-4 z-[9999] space-y-2';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type = 'info', duration = 3000) {
    const container = ensureToastContainer();
    const el = document.createElement('div');
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-blue-600'
    };
    const icon = {
      success: 'check-circle',
      error: 'exclamation-triangle',
      warning: 'exclamation-circle',
      info: 'info-circle'
    }[type] || 'info-circle';

    el.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow flex items-center min-w-[240px]`;
    el.innerHTML = `<i class="fas fa-${icon} mr-2"></i><span class="flex-1">${escapeHTML(message)}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => el.remove(), 300);
    }, Math.max(1500, duration));

    // Optional: integrate with notifications manager if present
    if (typeof window.notificationManager !== 'undefined' && window.notificationManager.isInitialized) {
      try {
        window.notificationManager.addNotificationFromToast(String(message), type, 'Toast');
      } catch (_) {}
    }
  }

  // --- Loading ---
  function showLoading(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const overlayId = `${targetId}-loading-overlay`;
    if (document.getElementById(overlayId)) return; // already present
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.className = 'w-full flex items-center justify-center py-12';
    overlay.innerHTML = '<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>';
    // Clear and show overlay
    target.innerHTML = '';
    target.appendChild(overlay);
  }

  function hideLoading(targetId) {
    const overlay = document.getElementById(`${targetId}-loading-overlay`);
    if (overlay) overlay.remove();
  }

  function showError(message) {
    showToast(message || 'An error occurred', 'error');
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = `
      <div class="max-w-lg mx-auto my-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <div class="flex items-start">
          <i class="fas fa-exclamation-triangle mt-1 mr-2"></i>
          <div>
            <div class="font-semibold mb-1">Error</div>
            <div class="text-sm">${escapeHTML(String(message || 'Unexpected error'))}</div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Navigation Highlighter ---
  function updateActiveNavigation(section) {
    try {
      document.querySelectorAll('[data-page]').forEach(el => el.classList.remove('active'));
      if (section) {
        document.querySelectorAll(`[data-page="${section}"]`).forEach(el => el.classList.add('active'));
      }
    } catch (_) {}
  }

  // --- Modal Helpers ---
  function createModal(title, contentHTML, buttons = []) {
    const wrapper = document.createElement('div');
    wrapper.className = 'fixed inset-0 bg-black bg-opacity-40 z-[9998] flex items-center justify-center';
    wrapper.id = 'universal-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-xl shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[85vh] overflow-auto';
    
    // Prevent clicks inside modal from bubbling up
    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b flex items-center justify-between';
    header.innerHTML = `
      <h3 class="font-semibold text-gray-900">${escapeHTML(title || 'Dialog')}</h3>
      <button class="text-gray-400 hover:text-gray-600" aria-label="Close" id="modal-close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Add event listener for close button
    const closeBtn = header.querySelector('#modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeUniversalModal();
      });
    }

    const body = document.createElement('div');
    body.className = 'p-6';
    body.innerHTML = contentHTML || '';

    const footer = document.createElement('div');
    footer.className = 'px-6 py-4 border-t flex justify-end space-x-3';

    (buttons || []).forEach(btn => {
      const b = document.createElement('button');
      b.className = btn.class || 'px-4 py-2 bg-blue-600 text-white rounded';
      b.textContent = btn.text || 'OK';
      if (btn.onclick) {
        if (typeof btn.onclick === 'function') {
          b.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.onclick(e);
          });
        } else if (typeof btn.onclick === 'string') {
          // For string onclick handlers, wrap them
          b.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              // Execute the string as a function
              const func = new Function('event', btn.onclick);
              func(e);
            } catch (error) {
              console.error('Error executing onclick handler:', error);
            }
          });
        }
      } else {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeUniversalModal();
        });
      }
      footer.appendChild(b);
    });

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    wrapper.appendChild(modal);

    // Add overlay click to close (click outside modal)
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper) {
        e.preventDefault();
        e.stopPropagation();
        closeUniversalModal();
      }
    });

    // Add escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeUniversalModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return wrapper;
  }

  function showModal(title, contentHTML, buttons = []) {
    closeUniversalModal(); // ensure single instance
    const m = createModal(title, contentHTML, buttons);
    document.body.appendChild(m);
    
    // Ensure all links inside the modal don't trigger navigation issues
    setTimeout(() => {
      const modalContent = m.querySelector('.bg-white');
      if (modalContent) {
        modalContent.querySelectorAll('a, button').forEach(element => {
          if (!element.hasAttribute('data-modal-handled')) {
            element.setAttribute('data-modal-handled', 'true');
            element.addEventListener('click', (e) => {
              // Allow normal links to work but prevent bubbling
              e.stopPropagation();
            });
          }
        });
      }
    }, 0);
    
    return m;
  }

  function closeModal(el) {
    try {
      if (!el) return closeUniversalModal();
      if (typeof el === 'string') {
        const node = document.querySelector(el);
        if (node) node.remove();
        return;
      }
      if (el.remove) el.remove();
    } catch (_) {}
  }

  function closeUniversalModal() {
    const overlay = document.getElementById('universal-modal-overlay');
    if (overlay) overlay.remove();
  }

  // --- Security helper ---
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Global exports ---
  window.createModal = createModal;
  window.closeModal = closeModal;
  window.showModal = showModal;
  window.closeUniversalModal = closeUniversalModal;
  window.showToast = showToast;
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
  window.updateActiveNavigation = updateActiveNavigation;
  window.showError = showError;
  window.formatDate = formatDate;
  window.getSeverityClass = getSeverityClass;
  window.getRiskScoreColor = getRiskScoreColor;
  window.getRiskLevel = getRiskLevel;
})();
