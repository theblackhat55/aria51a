/**
 * Risk Management Main Page Template
 * 
 * Main page layout for /risk-v2 with statistics, filters, and table
 * Follows ARIA5 design patterns
 */

import { html } from 'hono/html';
import { renderLoadingCard } from './riskComponents';

/**
 * Render main risk management page
 */
export function renderRiskManagementPage() {
  return html`
    <div class="min-h-screen bg-gray-50">
      <!-- Page Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Risk Management v2</h1>
              <p class="mt-1 text-sm text-gray-600">
                Clean Architecture implementation with enhanced features
              </p>
            </div>
            <div class="flex space-x-3">
              <button hx-get="/risk-v2/ui/import"
                      hx-target="#modal-container"
                      hx-swap="innerHTML"
                      class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-upload mr-2"></i>Import
              </button>
              <button hx-post="/risk-v2/ui/export"
                      hx-trigger="click"
                      class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-download mr-2"></i>Export  
              </button>
              <button hx-get="/risk-v2/ui/create"
                      hx-target="#modal-container"
                      hx-swap="innerHTML"
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <i class="fas fa-plus mr-2"></i>Add Risk
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Statistics Cards -->
        <div id="risk-stats" 
             hx-get="/risk-v2/ui/stats" 
             hx-trigger="load"
             hx-swap="innerHTML"
             class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <!-- Loading placeholders -->
          ${renderLoadingCard()}
          ${renderLoadingCard()}
          ${renderLoadingCard()}
          ${renderLoadingCard()}
          ${renderLoadingCard()}
        </div>

        <!-- Filters Section -->
        <div class="bg-white rounded-lg shadow mb-6 p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="risk-filters">
            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input type="text" 
                     name="search"
                     placeholder="Search risks..."
                     hx-get="/risk-v2/ui/table"
                     hx-trigger="input changed delay:500ms"
                     hx-target="#risk-table"
                     hx-include="#risk-filters"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" 
                      hx-get="/risk-v2/ui/table"
                      hx-trigger="change"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="mitigated">Mitigated</option>
                <option value="monitoring">Monitoring</option>
                <option value="accepted">Accepted</option>
                <option value="transferred">Transferred</option>
                <option value="avoided">Avoided</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select name="category" 
                      hx-get="/risk-v2/ui/table"
                      hx-trigger="change"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                <option value="strategic">Strategic</option>
                <option value="operational">Operational</option>
                <option value="financial">Financial</option>
                <option value="compliance">Compliance</option>
                <option value="reputational">Reputational</option>
                <option value="technology">Technology</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="environmental">Environmental</option>
                <option value="legal">Legal</option>
                <option value="human_resources">Human Resources</option>
                <option value="supply_chain">Supply Chain</option>
                <option value="market">Market</option>
                <option value="credit">Credit</option>
                <option value="liquidity">Liquidity</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Risk Level Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select name="riskLevel" 
                      hx-get="/risk-v2/ui/table"
                      hx-trigger="change"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <!-- Additional Filter Row -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <!-- Sort By -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select name="sortBy" 
                      hx-get="/risk-v2/ui/table"
                      hx-trigger="change"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="score">Risk Score</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
            </div>

            <!-- Sort Order -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <select name="sortOrder" 
                      hx-get="/risk-v2/ui/table"
                      hx-trigger="change"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <!-- Page Size -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
              <select name="limit" 
                      hx-get="/risk-v2/ui/table"
                      hx-trigger="change"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="10">10 per page</option>
                <option value="20" selected>20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

            <!-- Quick Filters -->
            <div class="flex items-end space-x-2">
              <button hx-get="/risk-v2/critical"
                      hx-target="#risk-table"
                      class="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 border border-red-200">
                Critical
              </button>
              <button hx-get="/risk-v2/needs-attention"
                      hx-target="#risk-table"
                      class="flex-1 bg-orange-50 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 border border-orange-200">
                Attention
              </button>
            </div>
          </div>
        </div>

        <!-- Risk Register Table -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Risk Register</h3>
          </div>
          
          <div id="risk-table"
               hx-get="/risk-v2/ui/table"
               hx-trigger="load"
               hx-swap="innerHTML">
            <!-- Loading placeholder -->
            <div class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="text-gray-600 mt-2">Loading risks...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Container -->
    <div id="modal-container"></div>
  `;
}
