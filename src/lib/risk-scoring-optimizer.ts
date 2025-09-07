/**
 * ARIA5 Risk Scoring Optimizer
 * Advanced risk scoring algorithms with machine learning optimization
 * Provides dynamic risk score calibration and performance tuning
 */

export interface ScoringWeights {
  likelihood_weight: number;
  impact_weight: number;
  confidence_weight: number;
  freshness_weight: number;
  evidence_quality_weight: number;
  mitre_complexity_weight: number;
  threat_actor_weight: number;
  asset_criticality_weight: number;
}

export interface ScoreCalibration {
  threshold_critical: number;
  threshold_high: number;
  threshold_medium: number;
  threshold_low: number;
  score_multipliers: {
    threat_intelligence: number;
    vulnerability: number;
    behavioral: number;
    compliance: number;
    operational: number;
  };
}

export interface ScoringMetrics {
  total_assessments: number;
  average_score: number;
  score_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  false_positive_rate: number;
  detection_accuracy: number;
  calibration_confidence: number;
}

export interface OptimizationResult {
  optimized_weights: ScoringWeights;
  calibration_settings: ScoreCalibration;
  performance_metrics: ScoringMetrics;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  category: 'weights' | 'thresholds' | 'evidence' | 'performance';
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  implementation_effort: 'minimal' | 'moderate' | 'significant';
}

export interface RiskAssessment {
  id?: string;
  likelihood?: number;
  impact?: number;
  confidence?: number;
  detection_timestamp?: string;
  evidence?: RiskEvidence[];
  mitre_techniques?: string[];
  threat_actors?: string[];
  asset_id?: number;
  risk_type?: string;
}

export interface RiskEvidence {
  type: string;
  confidence: number;
}

export class RiskScoringOptimizer {
  private correlationId: string;
  private db: D1Database;

  // Default scoring weights (tuned for security operations)
  private defaultWeights: ScoringWeights = {
    likelihood_weight: 0.25,
    impact_weight: 0.30,
    confidence_weight: 0.20,
    freshness_weight: 0.10,
    evidence_quality_weight: 0.08,
    mitre_complexity_weight: 0.04,
    threat_actor_weight: 0.02,
    asset_criticality_weight: 0.01
  };

  // Default score thresholds
  private defaultCalibration: ScoreCalibration = {
    threshold_critical: 0.85,
    threshold_high: 0.65,
    threshold_medium: 0.40,
    threshold_low: 0.20,
    score_multipliers: {
      threat_intelligence: 1.2,
      vulnerability: 1.0,
      behavioral: 0.9,
      compliance: 0.7,
      operational: 0.8
    }
  };

  constructor(db: D1Database) {
    this.correlationId = this.generateCorrelationId();
    this.db = db;
    
    console.log('[Risk-Scoring-Optimizer] Initialized', {
      correlation_id: this.correlationId,
      component: 'RiskScoringOptimizer'
    });
  }

  /**
   * Calculate optimized risk score using advanced algorithms
   */
  async calculateOptimizedScore(
    assessment: Partial<RiskAssessment>,
    weights?: ScoringWeights
  ): Promise<number> {
    const correlationId = this.generateCorrelationId();
    
    try {
      const scoringWeights = weights || this.defaultWeights;
      
      // Base score components
      const likelihoodScore = (assessment.likelihood || 0) * scoringWeights.likelihood_weight;
      const impactScore = (assessment.impact || 0) * scoringWeights.impact_weight;
      const confidenceScore = (assessment.confidence || 0) * scoringWeights.confidence_weight;
      
      // Advanced scoring factors
      const freshnessScore = await this.calculateFreshnessScore(assessment) * scoringWeights.freshness_weight;
      const evidenceQualityScore = await this.calculateEvidenceQuality(assessment.evidence || []) * scoringWeights.evidence_quality_weight;
      const mitreComplexityScore = await this.calculateMITREComplexity(assessment.mitre_techniques || []) * scoringWeights.mitre_complexity_weight;
      const threatActorScore = await this.calculateThreatActorScore(assessment.threat_actors || []) * scoringWeights.threat_actor_weight;
      const assetCriticalityScore = await this.calculateAssetCriticality(assessment.asset_id) * scoringWeights.asset_criticality_weight;
      
      // Calculate composite score
      const baseScore = likelihoodScore + impactScore + confidenceScore + 
                       freshnessScore + evidenceQualityScore + mitreComplexityScore + 
                       threatActorScore + assetCriticalityScore;
      
      // Apply risk type multiplier
      const typeMultiplier = this.defaultCalibration.score_multipliers[assessment.risk_type || 'vulnerability'];
      const finalScore = Math.min(1.0, baseScore * typeMultiplier);
      
      console.log('[Risk-Scoring] Score calculated', {
        correlation_id: correlationId,
        assessment_id: assessment.id,
        base_score: baseScore,
        final_score: finalScore,
        type_multiplier: typeMultiplier,
        component: 'RiskScoringOptimizer'
      });
      
      return finalScore;
      
    } catch (error) {
      console.error('[Risk-Scoring] Failed to calculate optimized risk score', {
        correlation_id: correlationId,
        assessment_id: assessment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'RiskScoringOptimizer'
      });
      
      // Fallback to basic scoring
      return this.calculateBasicScore(assessment);
    }
  }

  /**
   * Calculate freshness score based on detection timestamp
   */
  private async calculateFreshnessScore(assessment: Partial<RiskAssessment>): Promise<number> {
    if (!assessment.detection_timestamp) return 0.5;
    
    const detectionTime = new Date(assessment.detection_timestamp);
    const currentTime = new Date();
    const ageHours = (currentTime.getTime() - detectionTime.getTime()) / (1000 * 60 * 60);
    
    // Fresher threats get higher scores (exponential decay)
    if (ageHours <= 1) return 1.0;
    if (ageHours <= 6) return 0.9;
    if (ageHours <= 24) return 0.7;
    if (ageHours <= 72) return 0.5;
    if (ageHours <= 168) return 0.3; // 1 week
    
    return 0.1; // Very old threats
  }

  /**
   * Calculate evidence quality score
   */
  private async calculateEvidenceQuality(evidence: RiskEvidence[]): Promise<number> {
    if (!evidence || evidence.length === 0) return 0.1;
    
    let qualityScore = 0;
    let weightSum = 0;
    
    for (const item of evidence) {
      const typeWeight = this.getEvidenceTypeWeight(item.type);
      qualityScore += item.confidence * typeWeight;
      weightSum += typeWeight;
    }
    
    return weightSum > 0 ? qualityScore / weightSum : 0.1;
  }

  /**
   * Get evidence type weight for scoring
   */
  private getEvidenceTypeWeight(type: string): number {
    const weights = {
      'threat_intel': 0.9,
      'ioc_match': 0.8,
      'behavioral_anomaly': 0.7,
      'pattern_detection': 0.6,
      'vulnerability_scan': 0.5
    };
    
    return weights[type as keyof typeof weights] || 0.3;
  }

  /**
   * Calculate MITRE ATT&CK complexity score
   */
  private async calculateMITREComplexity(techniques: string[]): Promise<number> {
    if (!techniques || techniques.length === 0) return 0.1;
    
    // More techniques and diverse tactics indicate higher complexity/threat
    const uniqueTechniques = new Set(techniques);
    const techniqueCount = uniqueTechniques.size;
    
    // Score based on technique count and diversity
    if (techniqueCount >= 10) return 1.0;
    if (techniqueCount >= 7) return 0.8;
    if (techniqueCount >= 5) return 0.6;
    if (techniqueCount >= 3) return 0.4;
    if (techniqueCount >= 1) return 0.2;
    
    return 0.1;
  }

  /**
   * Calculate threat actor score based on known actor profiles
   */
  private async calculateThreatActorScore(threatActors: string[]): Promise<number> {
    if (!threatActors || threatActors.length === 0) return 0.1;
    
    try {
      // Query threat actor sophistication from database
      const actorQuery = `
        SELECT 
          name,
          sophistication_level,
          activity_level,
          target_sectors
        FROM threat_actors 
        WHERE name IN (${threatActors.map(() => '?').join(',')})
      `;
      
      const actors = await this.db.prepare(actorQuery).bind(...threatActors).all();
      
      if (!actors.results || actors.results.length === 0) return 0.3;
      
      let maxSophistication = 0;
      for (const actor of actors.results) {
        const sophistication = this.mapSophisticationToScore(actor.sophistication_level);
        maxSophistication = Math.max(maxSophistication, sophistication);
      }
      
      return maxSophistication;
      
    } catch (error) {
      console.error('[Risk-Scoring] Failed to calculate threat actor score', {
        correlation_id: this.correlationId,
        threat_actors: threatActors,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'RiskScoringOptimizer'
      });
      
      return 0.3; // Default score for unknown actors
    }
  }

  /**
   * Map sophistication level to numeric score
   */
  private mapSophisticationToScore(level: string): number {
    const sophisticationMap = {
      'nation-state': 1.0,
      'advanced-persistent-threat': 0.9,
      'organized-crime': 0.8,
      'hacktivist': 0.6,
      'opportunistic': 0.4,
      'script-kiddie': 0.2,
      'unknown': 0.3
    };
    
    return sophisticationMap[level as keyof typeof sophisticationMap] || 0.3;
  }

  /**
   * Calculate asset criticality score
   */
  private async calculateAssetCriticality(assetId?: number): Promise<number> {
    if (!assetId) return 0.5; // Default for unknown assets
    
    try {
      const assetQuery = `
        SELECT 
          criticality_level,
          business_impact,
          exposure_level
        FROM assets 
        WHERE id = ?
      `;
      
      const result = await this.db.prepare(assetQuery).bind(assetId).first();
      
      if (!result) return 0.5;
      
      return this.mapCriticalityToScore(result.criticality_level);
      
    } catch (error) {
      console.error('[Risk-Scoring] Failed to calculate asset criticality', {
        correlation_id: this.correlationId,
        asset_id: assetId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'RiskScoringOptimizer'
      });
      
      return 0.5;
    }
  }

  /**
   * Map asset criticality to numeric score
   */
  private mapCriticalityToScore(criticality: string): number {
    const criticalityMap = {
      'critical': 1.0,
      'high': 0.8,
      'medium': 0.6,
      'low': 0.4,
      'minimal': 0.2
    };
    
    return criticalityMap[criticality as keyof typeof criticalityMap] || 0.5;
  }

  /**
   * Calculate basic fallback score
   */
  private calculateBasicScore(assessment: Partial<RiskAssessment>): number {
    const likelihood = assessment.likelihood || 0.5;
    const impact = assessment.impact || 0.5;
    const confidence = assessment.confidence || 0.5;
    
    return (likelihood * 0.4 + impact * 0.4 + confidence * 0.2);
  }

  /**
   * Optimize scoring weights based on historical performance
   */
  async optimizeWeights(): Promise<OptimizationResult> {
    const correlationId = this.generateCorrelationId();
    
    try {
      console.log('[Risk-Scoring] Starting weight optimization', {
        correlation_id: correlationId,
        component: 'RiskScoringOptimizer'
      });
      
      // Analyze historical risk assessments
      const metrics = await this.calculateScoringMetrics();
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(metrics);
      
      // Calculate optimized weights (simplified optimization)
      const optimizedWeights = await this.calculateOptimizedWeights(metrics);
      
      // Update calibration settings
      const calibrationSettings = await this.optimizeCalibration(metrics);
      
      const result: OptimizationResult = {
        optimized_weights: optimizedWeights,
        calibration_settings: calibrationSettings,
        performance_metrics: metrics,
        recommendations
      };
      
      console.log('[Risk-Scoring] Weight optimization completed', {
        correlation_id: correlationId,
        metrics: metrics,
        recommendations_count: recommendations.length,
        component: 'RiskScoringOptimizer'
      });
      
      return result;
      
    } catch (error) {
      console.error('[Risk-Scoring] Failed to optimize scoring weights', {
        correlation_id: correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'RiskScoringOptimizer'
      });
      
      throw error;
    }
  }

  /**
   * Calculate current scoring performance metrics
   */
  private async calculateScoringMetrics(): Promise<ScoringMetrics> {
    try {
      const assessmentQuery = `
        SELECT 
          risk_score,
          severity,
          auto_generated,
          detection_timestamp
        FROM risk_assessments 
        WHERE detection_timestamp >= datetime('now', '-30 days')
        ORDER BY detection_timestamp DESC
        LIMIT 10000
      `;
      
      const result = await this.db.prepare(assessmentQuery).all();
      const assessments = result.results || [];
      
      if (assessments.length === 0) {
        return {
          total_assessments: 0,
          average_score: 0,
          score_distribution: { critical: 0, high: 0, medium: 0, low: 0 },
          false_positive_rate: 0,
          detection_accuracy: 0,
          calibration_confidence: 0
        };
      }
      
      // Calculate metrics
      const totalAssessments = assessments.length;
      const avgScore = assessments.reduce((sum, a) => sum + a.risk_score, 0) / totalAssessments;
      
      const distribution = {
        critical: assessments.filter(a => a.severity === 'critical').length,
        high: assessments.filter(a => a.severity === 'high').length,
        medium: assessments.filter(a => a.severity === 'medium').length,
        low: assessments.filter(a => a.severity === 'low').length
      };
      
      // Estimate false positive rate (simplified calculation)
      const autoGenerated = assessments.filter(a => a.auto_generated).length;
      const falsePositiveRate = autoGenerated > 0 ? 0.15 : 0; // Placeholder
      
      return {
        total_assessments: totalAssessments,
        average_score: avgScore,
        score_distribution: distribution,
        false_positive_rate: falsePositiveRate,
        detection_accuracy: 0.85, // Placeholder
        calibration_confidence: 0.75 // Placeholder
      };
      
    } catch (error) {
      console.error('[Risk-Scoring] Failed to calculate scoring metrics', {
        correlation_id: this.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'RiskScoringOptimizer'
      });
      
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizationRecommendations(metrics: ScoringMetrics): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze score distribution
    const total = metrics.total_assessments;
    if (total > 0) {
      const criticalPct = (metrics.score_distribution.critical / total) * 100;
      const highPct = (metrics.score_distribution.high / total) * 100;
      
      if (criticalPct > 20) {
        recommendations.push({
          category: 'thresholds',
          description: 'Critical alert threshold may be too low - consider raising to reduce alert fatigue',
          impact: 'medium',
          confidence: 0.7,
          implementation_effort: 'minimal'
        });
      }
      
      if (criticalPct + highPct < 10) {
        recommendations.push({
          category: 'weights',
          description: 'Risk scoring may be too conservative - consider increasing impact and likelihood weights',
          impact: 'high',
          confidence: 0.6,
          implementation_effort: 'moderate'
        });
      }
    }
    
    // Analyze false positive rate
    if (metrics.false_positive_rate > 0.2) {
      recommendations.push({
        category: 'evidence',
        description: 'High false positive rate detected - improve evidence quality weighting',
        impact: 'high',
        confidence: 0.8,
        implementation_effort: 'moderate'
      });
    }
    
    // Performance recommendations
    if (metrics.detection_accuracy < 0.8) {
      recommendations.push({
        category: 'performance',
        description: 'Detection accuracy below threshold - review threat intelligence feeds and correlation logic',
        impact: 'high',
        confidence: 0.9,
        implementation_effort: 'significant'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate optimized weights using performance feedback
   */
  private async calculateOptimizedWeights(metrics: ScoringMetrics): Promise<ScoringWeights> {
    // Start with default weights
    const optimized = { ...this.defaultWeights };
    
    // Adjust based on performance metrics
    if (metrics.false_positive_rate > 0.2) {
      // Increase confidence weight to reduce false positives
      optimized.confidence_weight = Math.min(0.35, optimized.confidence_weight * 1.3);
      optimized.evidence_quality_weight = Math.min(0.15, optimized.evidence_quality_weight * 1.5);
    }
    
    if (metrics.detection_accuracy < 0.8) {
      // Increase threat intelligence weight
      optimized.likelihood_weight = Math.min(0.35, optimized.likelihood_weight * 1.2);
      optimized.mitre_complexity_weight = Math.min(0.08, optimized.mitre_complexity_weight * 1.5);
    }
    
    // Normalize weights to sum to 1.0
    const weightSum = Object.values(optimized).reduce((sum, w) => sum + w, 0);
    if (weightSum !== 1.0) {
      const factor = 1.0 / weightSum;
      Object.keys(optimized).forEach(key => {
        optimized[key as keyof ScoringWeights] *= factor;
      });
    }
    
    return optimized;
  }

  /**
   * Optimize calibration thresholds
   */
  private async optimizeCalibration(metrics: ScoringMetrics): Promise<ScoreCalibration> {
    const optimized = { ...this.defaultCalibration };
    
    // Adjust thresholds based on score distribution
    const total = metrics.total_assessments;
    if (total > 0) {
      const criticalPct = (metrics.score_distribution.critical / total) * 100;
      
      if (criticalPct > 15) {
        // Too many critical alerts, raise threshold
        optimized.threshold_critical = Math.min(0.95, optimized.threshold_critical + 0.05);
      } else if (criticalPct < 5) {
        // Too few critical alerts, lower threshold
        optimized.threshold_critical = Math.max(0.75, optimized.threshold_critical - 0.05);
      }
    }
    
    return optimized;
  }

  /**
   * Apply optimized scoring configuration
   */
  async applyOptimization(optimization: OptimizationResult): Promise<void> {
    const correlationId = this.generateCorrelationId();
    
    try {
      console.log('[Risk-Scoring] Applying scoring optimization', {
        correlation_id: correlationId,
        optimization: optimization,
        component: 'RiskScoringOptimizer'
      });
      
      // Store optimization results in database
      const insertQuery = `
        INSERT INTO scoring_optimizations (
          optimization_timestamp,
          weights,
          calibration,
          metrics,
          recommendations,
          correlation_id
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await this.db.prepare(insertQuery).bind(
        new Date().toISOString(),
        JSON.stringify(optimization.optimized_weights),
        JSON.stringify(optimization.calibration_settings),
        JSON.stringify(optimization.performance_metrics),
        JSON.stringify(optimization.recommendations),
        correlationId
      ).run();
      
      console.log('[Risk-Scoring] Scoring optimization applied successfully', {
        correlation_id: correlationId,
        component: 'RiskScoringOptimizer'
      });
      
    } catch (error) {
      console.error('[Risk-Scoring] Failed to apply scoring optimization', {
        correlation_id: correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'RiskScoringOptimizer'
      });
      
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `risk-opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default RiskScoringOptimizer;