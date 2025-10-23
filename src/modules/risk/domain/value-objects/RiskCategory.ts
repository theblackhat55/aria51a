/**
 * RiskCategory Value Object
 * Represents the category/type of risk
 */

import { ValueObject } from '../../../../core/domain/entities/ValueObject';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

export type RiskCategoryType =
  | 'strategic'
  | 'operational'
  | 'financial'
  | 'compliance'
  | 'reputational'
  | 'technology'
  | 'cybersecurity'
  | 'environmental'
  | 'legal'
  | 'human_resources'
  | 'supply_chain'
  | 'market'
  | 'credit'
  | 'liquidity'
  | 'other';

interface RiskCategoryProps {
  value: RiskCategoryType;
}

export class RiskCategory extends ValueObject<RiskCategoryProps> {
  private static readonly VALID_CATEGORIES: RiskCategoryType[] = [
    'strategic',
    'operational',
    'financial',
    'compliance',
    'reputational',
    'technology',
    'cybersecurity',
    'environmental',
    'legal',
    'human_resources',
    'supply_chain',
    'market',
    'credit',
    'liquidity',
    'other'
  ];

  private static readonly CATEGORY_DISPLAY: Record<RiskCategoryType, string> = {
    strategic: 'Strategic',
    operational: 'Operational',
    financial: 'Financial',
    compliance: 'Compliance',
    reputational: 'Reputational',
    technology: 'Technology',
    cybersecurity: 'Cybersecurity',
    environmental: 'Environmental',
    legal: 'Legal',
    human_resources: 'Human Resources',
    supply_chain: 'Supply Chain',
    market: 'Market',
    credit: 'Credit',
    liquidity: 'Liquidity',
    other: 'Other'
  };

  private static readonly CATEGORY_COLORS: Record<RiskCategoryType, string> = {
    strategic: 'bg-purple-100 text-purple-800',
    operational: 'bg-blue-100 text-blue-800',
    financial: 'bg-green-100 text-green-800',
    compliance: 'bg-yellow-100 text-yellow-800',
    reputational: 'bg-pink-100 text-pink-800',
    technology: 'bg-indigo-100 text-indigo-800',
    cybersecurity: 'bg-red-100 text-red-800',
    environmental: 'bg-teal-100 text-teal-800',
    legal: 'bg-gray-100 text-gray-800',
    human_resources: 'bg-orange-100 text-orange-800',
    supply_chain: 'bg-amber-100 text-amber-800',
    market: 'bg-cyan-100 text-cyan-800',
    credit: 'bg-lime-100 text-lime-800',
    liquidity: 'bg-emerald-100 text-emerald-800',
    other: 'bg-slate-100 text-slate-800'
  };

  private static readonly CATEGORY_ICONS: Record<RiskCategoryType, string> = {
    strategic: '🎯',
    operational: '⚙️',
    financial: '💰',
    compliance: '📋',
    reputational: '👥',
    technology: '💻',
    cybersecurity: '🔒',
    environmental: '🌍',
    legal: '⚖️',
    human_resources: '👤',
    supply_chain: '🚚',
    market: '📈',
    credit: '💳',
    liquidity: '💧',
    other: '📌'
  };

  private constructor(props: RiskCategoryProps) {
    super(props);
  }

  /**
   * Create from string value
   */
  static create(value: string): RiskCategory {
    const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_') as RiskCategoryType;

    if (!RiskCategory.VALID_CATEGORIES.includes(normalizedValue)) {
      throw ValidationException.fromField(
        'category',
        `Invalid category. Must be one of: ${RiskCategory.VALID_CATEGORIES.join(', ')}`,
        value
      );
    }

    return new RiskCategory({ value: normalizedValue });
  }

  /**
   * Create from category ID (for backward compatibility)
   */
  static fromId(id: number): RiskCategory {
    const mapping: Record<number, RiskCategoryType> = {
      1: 'strategic',
      2: 'operational',
      3: 'financial',
      4: 'compliance',
      5: 'reputational',
      6: 'technology',
      7: 'cybersecurity',
      8: 'environmental',
      9: 'legal',
      10: 'human_resources',
      11: 'supply_chain',
      12: 'market',
      13: 'credit',
      14: 'liquidity',
      15: 'other'
    };

    const category = mapping[id] || 'other';
    return new RiskCategory({ value: category });
  }

  /**
   * Get category value
   */
  get value(): RiskCategoryType {
    return this.props.value;
  }

  /**
   * Get display name
   */
  get displayName(): string {
    return RiskCategory.CATEGORY_DISPLAY[this.props.value];
  }

  /**
   * Get category color class
   */
  get colorClass(): string {
    return RiskCategory.CATEGORY_COLORS[this.props.value];
  }

  /**
   * Get category icon
   */
  get icon(): string {
    return RiskCategory.CATEGORY_ICONS[this.props.value];
  }

  /**
   * Get category badge HTML
   */
  getBadge(): string {
    return `<span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${this.colorClass}">${this.icon} ${this.displayName}</span>`;
  }

  /**
   * Check if category is security-related
   */
  isSecurityRelated(): boolean {
    return ['cybersecurity', 'technology', 'compliance'].includes(this.props.value);
  }

  /**
   * Check if category is financial
   */
  isFinancialRelated(): boolean {
    return ['financial', 'credit', 'liquidity', 'market'].includes(this.props.value);
  }

  /**
   * Check if category requires regulatory compliance
   */
  requiresComplianceTracking(): boolean {
    return ['compliance', 'legal', 'environmental', 'financial'].includes(this.props.value);
  }

  /**
   * Get related categories
   */
  getRelatedCategories(): RiskCategoryType[] {
    const related: Record<RiskCategoryType, RiskCategoryType[]> = {
      cybersecurity: ['technology', 'compliance'],
      technology: ['cybersecurity', 'operational'],
      financial: ['credit', 'liquidity', 'market'],
      compliance: ['legal', 'cybersecurity'],
      operational: ['supply_chain', 'technology', 'human_resources'],
      strategic: ['market', 'reputational'],
      reputational: ['strategic', 'compliance'],
      environmental: ['compliance', 'legal'],
      legal: ['compliance', 'environmental'],
      human_resources: ['operational', 'reputational'],
      supply_chain: ['operational', 'market'],
      market: ['strategic', 'financial'],
      credit: ['financial'],
      liquidity: ['financial'],
      other: []
    };

    return related[this.props.value] || [];
  }

  /**
   * Get all possible categories
   */
  static getAllCategories(): RiskCategoryType[] {
    return [...RiskCategory.VALID_CATEGORIES];
  }

  /**
   * Get category options for dropdown (grouped)
   */
  static getCategoryOptions(): Array<{ value: RiskCategoryType; label: string; icon: string }> {
    return RiskCategory.VALID_CATEGORIES.map(category => ({
      value: category,
      label: RiskCategory.CATEGORY_DISPLAY[category],
      icon: RiskCategory.CATEGORY_ICONS[category]
    }));
  }

  /**
   * Get category ID (for backward compatibility)
   */
  toId(): number {
    const mapping: Record<RiskCategoryType, number> = {
      strategic: 1,
      operational: 2,
      financial: 3,
      compliance: 4,
      reputational: 5,
      technology: 6,
      cybersecurity: 7,
      environmental: 8,
      legal: 9,
      human_resources: 10,
      supply_chain: 11,
      market: 12,
      credit: 13,
      liquidity: 14,
      other: 15
    };

    return mapping[this.props.value];
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.props.value;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      value: this.props.value,
      displayName: this.displayName,
      icon: this.icon,
      isSecurityRelated: this.isSecurityRelated(),
      requiresCompliance: this.requiresComplianceTracking()
    };
  }
}
