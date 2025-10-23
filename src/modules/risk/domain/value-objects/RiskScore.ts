/**
 * RiskScore Value Object
 * Represents a calculated risk score based on probability and impact
 */

import { ValueObject } from '../../../../core/domain/entities/ValueObject';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

interface RiskScoreProps {
  probability: number;
  impact: number;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export class RiskScore extends ValueObject<RiskScoreProps> {
  private constructor(props: RiskScoreProps) {
    super(props);
  }

  /**
   * Create risk score from probability and impact
   */
  static create(probability: number, impact: number): RiskScore {
    // Validate inputs
    if (probability < 1 || probability > 5) {
      throw ValidationException.fromField(
        'probability',
        'Probability must be between 1 and 5',
        probability
      );
    }

    if (impact < 1 || impact > 5) {
      throw ValidationException.fromField(
        'impact',
        'Impact must be between 1 and 5',
        impact
      );
    }

    // Calculate score
    const score = probability * impact;
    const level = RiskScore.calculateLevel(score);

    return new RiskScore({ probability, impact, score, level });
  }

  /**
   * Create from existing score (for reconstruction from DB)
   */
  static fromScore(score: number, probability?: number, impact?: number): RiskScore {
    const calculatedProbability = probability || Math.ceil(Math.sqrt(score));
    const calculatedImpact = impact || Math.ceil(score / calculatedProbability);
    const level = RiskScore.calculateLevel(score);

    return new RiskScore({
      probability: calculatedProbability,
      impact: calculatedImpact,
      score,
      level
    });
  }

  /**
   * Calculate risk level from score
   */
  private static calculateLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  }

  /**
   * Get probability (1-5)
   */
  get probability(): number {
    return this.props.probability;
  }

  /**
   * Get impact (1-5)
   */
  get impact(): number {
    return this.props.impact;
  }

  /**
   * Get calculated score
   */
  get score(): number {
    return this.props.score;
  }

  /**
   * Get risk level
   */
  get level(): 'low' | 'medium' | 'high' | 'critical' {
    return this.props.level;
  }

  /**
   * Get level color for UI
   */
  get levelColor(): string {
    switch (this.props.level) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
    }
  }

  /**
   * Get level badge HTML
   */
  getLevelBadge(): string {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    return `<span class="px-2 py-1 text-xs font-semibold rounded ${colors[this.props.level]}">${this.props.level.toUpperCase()}</span>`;
  }

  /**
   * Check if risk is critical
   */
  isCritical(): boolean {
    return this.props.level === 'critical';
  }

  /**
   * Check if risk is high or critical
   */
  isHighOrCritical(): boolean {
    return this.props.level === 'high' || this.props.level === 'critical';
  }

  /**
   * Check if risk needs immediate attention
   */
  needsImmediateAttention(): boolean {
    return this.props.score >= 15;
  }

  /**
   * Update probability
   */
  updateProbability(newProbability: number): RiskScore {
    return RiskScore.create(newProbability, this.props.impact);
  }

  /**
   * Update impact
   */
  updateImpact(newImpact: number): RiskScore {
    return RiskScore.create(this.props.probability, newImpact);
  }

  /**
   * Update both probability and impact
   */
  update(newProbability: number, newImpact: number): RiskScore {
    return RiskScore.create(newProbability, newImpact);
  }

  /**
   * Convert to plain object for JSON
   */
  toJSON() {
    return {
      probability: this.props.probability,
      impact: this.props.impact,
      score: this.props.score,
      level: this.props.level
    };
  }
}
