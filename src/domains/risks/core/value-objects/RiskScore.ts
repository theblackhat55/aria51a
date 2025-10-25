/**
 * RiskScore - Value object for calculating and representing risk scores
 * Formula: Risk Score = Probability × Impact
 */

import { ValueObject } from '@/shared/domain/ValueObject';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low' | 'very_low';

export interface RiskScoreProps {
  probability: number;
  impact: number;
}

export class RiskScore extends ValueObject<number> {
  private readonly _probability: number;
  private readonly _impact: number;

  private constructor(probability: number, impact: number) {
    const score = probability * impact;
    super(score);
    this._probability = probability;
    this._impact = impact;
  }

  /**
   * Create a RiskScore from probability and impact values
   * @param probability - Must be between 1 and 5
   * @param impact - Must be between 1 and 5
   */
  static calculate(probability: number, impact: number): RiskScore {
    // Validation
    if (!Number.isInteger(probability) || probability < 1 || probability > 5) {
      throw new Error('Probability must be an integer between 1 and 5');
    }
    if (!Number.isInteger(impact) || impact < 1 || impact > 5) {
      throw new Error('Impact must be an integer between 1 and 5');
    }

    return new RiskScore(probability, impact);
  }

  /**
   * Create a RiskScore from a raw score value
   * Note: This doesn't validate probability/impact components
   */
  static fromScore(score: number): RiskScore {
    if (score < 1 || score > 25) {
      throw new Error('Risk score must be between 1 and 25');
    }
    
    // Approximate probability and impact from score
    // This is a reconstruction and may not match original values
    const probability = Math.ceil(Math.sqrt(score));
    const impact = Math.ceil(score / probability);
    
    return new RiskScore(probability, impact);
  }

  get score(): number {
    return this.value;
  }

  get probability(): number {
    return this._probability;
  }

  get impact(): number {
    return this._impact;
  }

  /**
   * Get risk severity level based on score
   * Critical: 20-25 (Very high probability and impact)
   * High: 15-19
   * Medium: 8-14
   * Low: 4-7
   * Very Low: 1-3
   */
  get severity(): RiskSeverity {
    if (this.value >= 20) return 'critical';
    if (this.value >= 15) return 'high';
    if (this.value >= 8) return 'medium';
    if (this.value >= 4) return 'low';
    return 'very_low';
  }

  /**
   * Get display color for risk severity
   */
  get color(): string {
    const colors: Record<RiskSeverity, string> = {
      critical: '#DC2626',  // Red-600
      high: '#EA580C',      // Orange-600
      medium: '#F59E0B',    // Amber-500
      low: '#10B981',       // Green-500
      very_low: '#6B7280'   // Gray-500
    };
    return colors[this.severity];
  }

  /**
   * Get human-readable severity label
   */
  get severityLabel(): string {
    const labels: Record<RiskSeverity, string> = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      very_low: 'Very Low'
    };
    return labels[this.severity];
  }

  /**
   * Get probability label
   */
  get probabilityLabel(): string {
    const labels: Record<number, string> = {
      1: 'Very Rare',
      2: 'Unlikely',
      3: 'Possible',
      4: 'Likely',
      5: 'Almost Certain'
    };
    return labels[this._probability] || 'Unknown';
  }

  /**
   * Get impact label
   */
  get impactLabel(): string {
    const labels: Record<number, string> = {
      1: 'Negligible',
      2: 'Minor',
      3: 'Moderate',
      4: 'Major',
      5: 'Catastrophic'
    };
    return labels[this._impact] || 'Unknown';
  }

  /**
   * Check if risk requires immediate attention (critical or high)
   */
  requiresImmediateAttention(): boolean {
    return this.severity === 'critical' || this.severity === 'high';
  }

  /**
   * Check if risk is within acceptable levels
   */
  isAcceptable(): boolean {
    return this.severity === 'low' || this.severity === 'very_low';
  }

  /**
   * Compare with another risk score
   */
  isHigherThan(other: RiskScore): boolean {
    return this.value > other.value;
  }

  isLowerThan(other: RiskScore): boolean {
    return this.value < other.value;
  }

  /**
   * Get percentage representation (0-100%)
   * where 25 is 100%
   */
  get percentage(): number {
    return Math.round((this.value / 25) * 100);
  }

  /**
   * Serialize to JSON
   */
  toJSON(): {
    score: number;
    probability: number;
    impact: number;
    severity: RiskSeverity;
    probabilityLabel: string;
    impactLabel: string;
    severityLabel: string;
    color: string;
    percentage: number;
  } {
    return {
      score: this.score,
      probability: this.probability,
      impact: this.impact,
      severity: this.severity,
      probabilityLabel: this.probabilityLabel,
      impactLabel: this.impactLabel,
      severityLabel: this.severityLabel,
      color: this.color,
      percentage: this.percentage
    };
  }
}
