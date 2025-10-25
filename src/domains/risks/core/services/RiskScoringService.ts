/**
 * RiskScoringService - Domain service for advanced risk scoring
 * 
 * Handles complex risk score calculations that involve
 * multiple entities or external context.
 */

import { Risk } from '../entities/Risk';
import { RiskScore } from '../value-objects/RiskScore';

export interface ScoringContext {
  hasActiveControls?: boolean;
  controlEffectiveness?: number; // 0-100%
  threatLevel?: number; // 1-5
  industryRiskMultiplier?: number; // 0.5-2.0
  historicalIncidents?: number;
  complianceStatus?: 'compliant' | 'non_compliant' | 'partial';
}

export interface ScoringResult {
  inherentRisk: RiskScore;
  residualRisk: RiskScore;
  controlReduction: number;
  recommendation: string;
  confidence: number;
}

/**
 * Advanced risk scoring with context
 */
export class RiskScoringService {
  /**
   * Calculate inherent risk (without controls)
   */
  calculateInherentRisk(risk: Risk): RiskScore {
    return risk.calculateScore();
  }

  /**
   * Calculate residual risk (after controls)
   */
  calculateResidualRisk(risk: Risk, context: ScoringContext): RiskScore {
    const inherentScore = this.calculateInherentRisk(risk);
    let adjustedScore = inherentScore.score;

    // Apply control effectiveness reduction
    if (context.hasActiveControls && context.controlEffectiveness) {
      const reduction = context.controlEffectiveness / 100;
      adjustedScore = adjustedScore * (1 - reduction * 0.7); // Max 70% reduction from controls
    }

    // Apply compliance status impact
    if (context.complianceStatus === 'non_compliant') {
      adjustedScore = adjustedScore * 1.3; // Increase by 30% if non-compliant
    } else if (context.complianceStatus === 'partial') {
      adjustedScore = adjustedScore * 1.1; // Increase by 10% if partially compliant
    }

    // Apply threat level multiplier
    if (context.threatLevel) {
      const threatMultiplier = context.threatLevel / 3; // Normalize to ~1.0
      adjustedScore = adjustedScore * threatMultiplier;
    }

    // Apply industry risk multiplier
    if (context.industryRiskMultiplier) {
      adjustedScore = adjustedScore * context.industryRiskMultiplier;
    }

    // Historical incident impact
    if (context.historicalIncidents && context.historicalIncidents > 0) {
      const incidentMultiplier = 1 + (context.historicalIncidents * 0.1);
      adjustedScore = adjustedScore * Math.min(incidentMultiplier, 1.5); // Max 50% increase
    }

    // Ensure score stays within valid range
    adjustedScore = Math.max(1, Math.min(25, Math.round(adjustedScore)));

    return RiskScore.fromScore(adjustedScore);
  }

  /**
   * Comprehensive risk assessment with recommendations
   */
  assessRisk(risk: Risk, context: ScoringContext = {}): ScoringResult {
    const inherentRisk = this.calculateInherentRisk(risk);
    const residualRisk = this.calculateResidualRisk(risk, context);

    const controlReduction = 
      ((inherentRisk.score - residualRisk.score) / inherentRisk.score) * 100;

    const recommendation = this.generateRecommendation(
      inherentRisk,
      residualRisk,
      context
    );

    // Calculate confidence based on context completeness
    const confidence = this.calculateConfidence(context);

    return {
      inherentRisk,
      residualRisk,
      controlReduction: Math.round(controlReduction),
      recommendation,
      confidence
    };
  }

  /**
   * Calculate risk trend over time
   */
  calculateTrend(
    currentRisk: Risk,
    historicalScores: number[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (historicalScores.length < 2) {
      return 'stable';
    }

    const currentScore = currentRisk.calculateScore().score;
    const avgHistorical = 
      historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;

    const change = currentScore - avgHistorical;

    if (change > 2) return 'increasing';
    if (change < -2) return 'decreasing';
    return 'stable';
  }

  /**
   * Compare risk with portfolio
   */
  rankInPortfolio(risk: Risk, portfolio: Risk[]): {
    rank: number;
    percentile: number;
    isTopRisk: boolean;
  } {
    const scores = portfolio
      .map(r => r.calculateScore().score)
      .sort((a, b) => b - a);

    const currentScore = risk.calculateScore().score;
    const rank = scores.findIndex(s => s <= currentScore) + 1;
    const percentile = ((portfolio.length - rank + 1) / portfolio.length) * 100;

    return {
      rank,
      percentile: Math.round(percentile),
      isTopRisk: percentile >= 90
    };
  }

  /**
   * Generate risk treatment recommendation
   */
  private generateRecommendation(
    inherentRisk: RiskScore,
    residualRisk: RiskScore,
    context: ScoringContext
  ): string {
    if (residualRisk.severity === 'critical') {
      return 'URGENT: Implement immediate controls and escalate to senior management.';
    }

    if (residualRisk.severity === 'high') {
      if (context.hasActiveControls && context.controlEffectiveness && context.controlEffectiveness < 50) {
        return 'Strengthen existing controls - current effectiveness is below acceptable threshold.';
      }
      return 'Implement additional mitigation controls within 30 days.';
    }

    if (residualRisk.severity === 'medium') {
      if (!context.hasActiveControls) {
        return 'Implement basic controls to reduce risk exposure.';
      }
      return 'Monitor regularly and review controls quarterly.';
    }

    if (residualRisk.severity === 'low') {
      return 'Current controls are adequate. Continue routine monitoring.';
    }

    return 'Risk is within acceptable tolerance. Document acceptance decision.';
  }

  /**
   * Calculate confidence score based on context completeness
   */
  private calculateConfidence(context: ScoringContext): number {
    let score = 50; // Base confidence

    if (context.hasActiveControls !== undefined) score += 10;
    if (context.controlEffectiveness !== undefined) score += 15;
    if (context.threatLevel !== undefined) score += 10;
    if (context.industryRiskMultiplier !== undefined) score += 5;
    if (context.historicalIncidents !== undefined) score += 5;
    if (context.complianceStatus !== undefined) score += 5;

    return Math.min(100, score);
  }

  /**
   * Determine optimal review frequency
   */
  determineReviewFrequency(risk: Risk): {
    days: number;
    rationale: string;
  } {
    const score = risk.calculateScore();

    if (score.severity === 'critical') {
      return {
        days: 7,
        rationale: 'Critical risks require weekly review due to potential significant impact.'
      };
    }

    if (score.severity === 'high') {
      return {
        days: 30,
        rationale: 'High risks should be reviewed monthly to ensure controls remain effective.'
      };
    }

    if (score.severity === 'medium') {
      return {
        days: 90,
        rationale: 'Medium risks require quarterly review for ongoing monitoring.'
      };
    }

    return {
      days: 180,
      rationale: 'Low risks can be reviewed semi-annually unless conditions change.'
    };
  }
}
