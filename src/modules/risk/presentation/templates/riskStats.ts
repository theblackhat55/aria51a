/**
 * Risk Statistics Template
 * 
 * Statistics cards for risk dashboard
 * Follows ARIA5 design patterns
 */

import { html } from 'hono/html';
import { renderStatCard } from './riskComponents';

export interface RiskStatistics {
  total: number;
  byStatus: Record<string, number>;
  byLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byCategory: Record<string, number>;
  averageScore: number;
  activeCount: number;
  closedCount: number;
  reviewOverdueCount: number;
}

/**
 * Render statistics cards
 */
export function renderRiskStatistics(stats: RiskStatistics) {
  return html`
    ${renderStatCard('exclamation-triangle', 'text-red-500', 'Critical Risks', stats.byLevel.critical)}
    ${renderStatCard('fire', 'text-orange-500', 'High Risks', stats.byLevel.high)}
    ${renderStatCard('exclamation-circle', 'text-yellow-500', 'Medium Risks', stats.byLevel.medium)}
    ${renderStatCard('check-circle', 'text-green-500', 'Low Risks', stats.byLevel.low)}
    ${renderStatCard('chart-line', 'text-blue-500', 'Total Risks', stats.total)}
  `;
}
