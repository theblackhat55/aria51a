/**
 * Risk Table Template
 * 
 * Risk register table with HTMX interactions
 * Follows ARIA5 design patterns
 */

import { html } from 'hono/html';
import {
  getRiskLevel,
  renderScoreBadge,
  renderStatusBadge,
  renderRiskLevelBadge,
  renderCategoryBadge,
  renderRiskIdBadge,
  renderEmptyState
} from './riskComponents';

export interface RiskRow {
  id: number;
  riskId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: string;
  organizationId: number;
  ownerId: number;
  ownerName?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Render risk table
 */
export function renderRiskTable(risks: RiskRow[]) {
  if (risks.length === 0) {
    return html`
      <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          ${renderTableHeader()}
          <tbody class="bg-white divide-y divide-gray-200">
            <tr>
              <td colspan="10" class="px-6 py-8 text-center text-gray-500">
                ${renderEmptyState(
                  'No risks found.',
                  'Create your first risk',
                  '/risk-v2/ui/create'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const riskRows = risks.map(risk => renderRiskRow(risk)).join('');

  return html`
    <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        ${renderTableHeader()}
        <tbody class="bg-white divide-y divide-gray-200">
          ${riskRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render table header
 */
function renderTableHeader() {
  return html`
    <thead class="bg-gray-50">
      <tr>
        <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
          Risk ID
        </th>
        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0 max-w-xs">
          Title
        </th>
        <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
          Category
        </th>
        <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden sm:table-cell">
          Owner
        </th>
        <th class="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
          Prob
        </th>
        <th class="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
          Impact
        </th>
        <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
          Score
        </th>
        <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
          Status
        </th>
        <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden md:table-cell">
          Review
        </th>
        <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
          Actions
        </th>
      </tr>
    </thead>
  `;
}

/**
 * Render single risk row
 */
function renderRiskRow(risk: RiskRow): string {
  const createdDate = new Date(risk.createdAt).toLocaleDateString();
  const nextReview = risk.reviewDate 
    ? new Date(risk.reviewDate).toLocaleDateString() 
    : 'Not set';
  
  return `
    <tr class="hover:bg-gray-50 transition-colors">
      <!-- Risk ID -->
      <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${renderRiskIdBadge(risk.id, risk.riskId)}
      </td>

      <!-- Title -->
      <td class="px-4 py-4 text-sm text-gray-900">
        <div class="max-w-xs truncate">
          <div class="font-medium">${risk.title}</div>
        </div>
      </td>

      <!-- Category -->
      <td class="px-3 py-4 whitespace-nowrap text-sm">
        ${renderCategoryBadge(risk.category)}
      </td>

      <!-- Owner -->
      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
        ${(risk.ownerName || 'Unassigned').substring(0, 12)}
      </td>

      <!-- Probability -->
      <td class="px-2 py-4 whitespace-nowrap text-center">
        <div class="flex items-center justify-center">
          ${renderScoreBadge(risk.probability)}
        </div>
      </td>

      <!-- Impact -->
      <td class="px-2 py-4 whitespace-nowrap text-center">
        <div class="flex items-center justify-center">
          ${renderScoreBadge(risk.impact)}
        </div>
      </td>

      <!-- Risk Score -->
      <td class="px-3 py-4 whitespace-nowrap text-center">
        <div class="flex items-center justify-center">
          ${renderRiskLevelBadge(risk.riskScore)}
        </div>
      </td>

      <!-- Status -->
      <td class="px-3 py-4 whitespace-nowrap">
        ${renderStatusBadge(risk.status)}
      </td>

      <!-- Review Date -->
      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
        <div class="text-xs">${nextReview.substring(0, 10)}</div>
      </td>

      <!-- Actions -->
      <td class="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
        <div class="flex items-center justify-center space-x-1">
          <!-- View -->
          <button class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors" 
                  hx-get="/risk-v2/ui/view/${risk.id}" 
                  hx-target="#modal-container" 
                  hx-swap="innerHTML"
                  title="View Details">
            <i class="fas fa-eye text-xs"></i>
          </button>

          <!-- Edit -->
          <button class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors" 
                  hx-get="/risk-v2/ui/edit/${risk.id}" 
                  hx-target="#modal-container" 
                  hx-swap="innerHTML"
                  title="Edit Risk">
            <i class="fas fa-edit text-xs"></i>
          </button>

          <!-- Change Status -->
          <button class="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors" 
                  hx-get="/risk-v2/ui/status/${risk.id}" 
                  hx-target="#modal-container" 
                  hx-swap="innerHTML"
                  title="Change Status">
            <i class="fas fa-exchange-alt text-xs"></i>
          </button>

          <!-- Delete -->
          <button class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors" 
                  hx-delete="/risk-v2/${risk.id}" 
                  hx-confirm="Are you sure you want to permanently delete this risk? This action cannot be undone." 
                  hx-target="closest tr" 
                  hx-swap="outerHTML"
                  title="Delete Risk">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render pagination controls
 */
export function renderPagination(pagination: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}) {
  const { page, limit, total, totalPages, hasNext, hasPrevious } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return html`
    <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        ${hasPrevious ? html`
          <button hx-get="/risk-v2/ui/table?page=${page - 1}"
                  hx-target="#risk-table"
                  hx-include="#risk-filters"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
        ` : html`
          <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-300 bg-gray-50 cursor-not-allowed">
            Previous
          </span>
        `}
        ${hasNext ? html`
          <button hx-get="/risk-v2/ui/table?page=${page + 1}"
                  hx-target="#risk-table"
                  hx-include="#risk-filters"
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        ` : html`
          <span class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-300 bg-gray-50 cursor-not-allowed">
            Next
          </span>
        `}
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing <span class="font-medium">${start}</span> to <span class="font-medium">${end}</span> of{' '}
            <span class="font-medium">${total}</span> results
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            ${hasPrevious ? html`
              <button hx-get="/risk-v2/ui/table?page=${page - 1}"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <i class="fas fa-chevron-left"></i>
              </button>
            ` : html`
              <span class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-300 cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
              </span>
            `}
            
            <!-- Page numbers (show current and nearby pages) -->
            ${renderPageNumbers(page, totalPages)}
            
            ${hasNext ? html`
              <button hx-get="/risk-v2/ui/table?page=${page + 1}"
                      hx-target="#risk-table"
                      hx-include="#risk-filters"
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <i class="fas fa-chevron-right"></i>
              </button>
            ` : html`
              <span class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-300 cursor-not-allowed">
                <i class="fas fa-chevron-right"></i>
              </span>
            `}
          </nav>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render page numbers
 */
function renderPageNumbers(currentPage: number, totalPages: number): string {
  const pages: (number | string)[] = [];
  const maxVisible = 7;
  
  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show first, last, current, and nearby pages with ellipsis
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    pages.push(totalPages);
  }
  
  return pages.map(page => {
    if (page === '...') {
      return '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>';
    }
    
    if (page === currentPage) {
      return `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">${page}</span>`;
    }
    
    return `<button hx-get="/risk-v2/ui/table?page=${page}" hx-target="#risk-table" hx-include="#risk-filters" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">${page}</button>`;
  }).join('');
}
