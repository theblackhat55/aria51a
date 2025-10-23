/**
 * Risk UI Components
 * 
 * Reusable template components for Risk UI
 * Follows ARIA5 design patterns
 */

import { html } from 'hono/html';

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 12) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

/**
 * Get risk level color classes (ARIA5 colors)
 */
export function getRiskLevelColorClass(level: string): string {
  const colorMap: Record<string, string> = {
    'Critical': 'bg-red-100 text-red-800 border-red-200',
    'High': 'bg-orange-100 text-orange-800 border-orange-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-green-100 text-green-800 border-green-200'
  };
  return colorMap[level] || colorMap['Low'];
}

/**
 * Get status display (color + icon)
 */
export function getStatusDisplay(status: string): { color: string; icon: string } {
  const statusMap: Record<string, { color: string; icon: string }> = {
    'pending': { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: 'clock' },
    'active': { color: 'bg-green-100 text-green-800 border border-green-200', icon: 'exclamation-triangle' },
    'mitigated': { color: 'bg-blue-100 text-blue-800 border border-blue-200', icon: 'shield-check' },
    'monitoring': { color: 'bg-purple-100 text-purple-800 border border-purple-200', icon: 'eye' },
    'accepted': { color: 'bg-indigo-100 text-indigo-800 border border-indigo-200', icon: 'check' },
    'transferred': { color: 'bg-teal-100 text-teal-800 border border-teal-200', icon: 'share' },
    'avoided': { color: 'bg-cyan-100 text-cyan-800 border border-cyan-200', icon: 'ban' },
    'escalated': { color: 'bg-red-100 text-red-800 border border-red-200', icon: 'arrow-up' },
    'closed': { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: 'check-circle' }
  };
  return statusMap[status?.toLowerCase()] || statusMap['active'];
}

/**
 * Render statistics card (ARIA5 style)
 */
export function renderStatCard(icon: string, iconColor: string, label: string, value: number) {
  return html`
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-${icon} text-2xl ${iconColor}"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">${label}</p>
          <p class="text-2xl font-semibold text-gray-900">${value}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render probability/impact badge
 */
export function renderScoreBadge(value: number) {
  const bgColor = value >= 4 ? 'bg-red-100' : value >= 3 ? 'bg-orange-100' : 'bg-green-100';
  const textColor = value >= 4 ? 'text-red-600' : value >= 3 ? 'text-orange-600' : 'text-green-600';
  
  return `
    <div class="w-6 h-6 rounded-full flex items-center justify-center ${bgColor}">
      <span class="text-xs font-bold ${textColor}">${value}</span>
    </div>
  `;
}

/**
 * Render status badge
 */
export function renderStatusBadge(status: string) {
  const statusDisplay = getStatusDisplay(status);
  const capitalizedStatus = status?.charAt(0).toUpperCase() + status?.slice(1);
  
  return `
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}">
      <i class="fas fa-${statusDisplay.icon} text-xs mr-1"></i>
      ${capitalizedStatus?.substring(0, 8)}
    </span>
  `;
}

/**
 * Render risk level badge
 */
export function renderRiskLevelBadge(score: number) {
  const level = getRiskLevel(score);
  const colorClass = getRiskLevelColorClass(level);
  
  return `
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}">
      ${score}
    </span>
  `;
}

/**
 * Render empty state
 */
export function renderEmptyState(message: string, linkText?: string, linkHref?: string) {
  return html`
    <div class="px-6 py-8 text-center text-gray-500">
      <i class="fas fa-exclamation-triangle text-gray-300 text-3xl mb-2"></i>
      <div>
        ${message}
        ${linkText && linkHref ? html`
          <a href="${linkHref}" 
             hx-get="${linkHref}" 
             hx-target="#modal-container" 
             hx-swap="innerHTML" 
             class="text-blue-600 hover:text-blue-800">
            ${linkText}
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render loading placeholder
 */
export function renderLoadingPlaceholder(message: string = 'Loading...') {
  return html`
    <div class="p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-600 mt-2">${message}</p>
    </div>
  `;
}

/**
 * Render loading card placeholder (for statistics)
 */
export function renderLoadingCard() {
  return html`
    <div class="bg-white rounded-lg shadow p-6 animate-pulse">
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div class="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  `;
}

/**
 * Render action button
 */
export function renderActionButton(
  icon: string,
  colorClass: string,
  hoverClass: string,
  hxMethod: string,
  hxUrl: string,
  title: string,
  hxConfirm?: string
) {
  const confirmAttr = hxConfirm ? `hx-confirm="${hxConfirm}"` : '';
  
  return `
    <button class="${colorClass} hover:${hoverClass} p-1 rounded hover:bg-opacity-10 transition-colors" 
            ${hxMethod}="${hxUrl}" 
            hx-target="#modal-container" 
            hx-swap="innerHTML"
            ${confirmAttr}
            title="${title}">
      <i class="fas fa-${icon} text-xs"></i>
    </button>
  `;
}

/**
 * Render category badge
 */
export function renderCategoryBadge(category: string) {
  return `
    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      ${category?.substring(0, 8)}${category?.length > 8 ? '...' : ''}
    </span>
  `;
}

/**
 * Render risk ID badge
 */
export function renderRiskIdBadge(id: number, riskId: string) {
  return `
    <div class="flex items-center">
      <div class="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center sm:w-8 sm:h-8 sm:mr-2">
        <span class="text-xs font-bold text-blue-600">${id}</span>
      </div>
      <span class="font-mono text-xs sm:text-sm hidden sm:inline">${riskId}</span>
    </div>
  `;
}
