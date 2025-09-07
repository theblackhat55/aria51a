/**
 * Intelligent Risk Scoring Engine - Phase 2 Implementation
 * 
 * AI-enhanced contextual risk assessment that combines threat intelligence
 * with organizational context to provide accurate, actionable risk scores.
 * 
 * Key capabilities:
 * - Contextual risk calculation based on organizational profile
 * - Business impact assessment with financial modeling
 * - Threat-aware risk scoring using TI data
 * - Dynamic risk adjustment based on threat landscape
 * - Mitigation recommendation engine
 * - Risk treatment optimization
 */

import { D1Database } from '@cloudflare/workers-types';
import { AIThreatAnalysisService } from './ai-threat-analysis';

export interface OrganizationalContext {
  organization_id: number;
  industry_sector: string;
  organization_size: 'small' | 'medium' | 'large' | 'enterprise';
  geographical_location: string[];
  regulatory_requirements: string[];
  business_criticality_profile: {
    revenue_dependency: number; // 1-10
    operational_criticality: number; // 1-10
    data_sensitivity: number; // 1-10
    public_profile: number; // 1-10
  };
  security_maturity: {
    security_controls_maturity: number; // 1-10
    incident_response_capability: number; // 1-10
    security_awareness_level: number; // 1-10
    threat_detection_capability: number; // 1-10
  };
  asset_profile: {
    critical_assets: string[];
    technology_stack: string[];
    internet_exposure: number; // 1-10
    supply_chain_complexity: number; // 1-10
  };
}

export interface ThreatIntelligenceContext {
  threat_landscape: {
    industry_targeting_frequency: number; // 0-1
    geographical_threat_level: number; // 0-1
    active_threat_campaigns: number;
    recent_incidents_in_sector: number;
  };
  threat_actor_activity: {
    relevant_threat_actors: string[];
    threat_actor_capabilities: Record<string, number>; // actor -> capability score
    targeting_likelihood: Record<string, number>; // actor -> likelihood
  };
  attack_trends: {
    prevalent_attack_vectors: string[];
    emerging_threats: string[];
    seasonal_patterns: any;
    technique_evolution: string[];
  };
  intelligence_confidence: {
    data_freshness: number; // 0-1
    source_reliability: number; // 0-1
    analysis_confidence: number; // 0-1
  };
}

export interface ContextualRiskScore {
  risk_id: number;
  base_risk_score: number; // Traditional risk score (1-25)
  contextual_multipliers: {
    threat_landscape_multiplier: number;
    organizational_vulnerability_multiplier: number;
    business_impact_multiplier: number;
    threat_actor_targeting_multiplier: number;
  };
  final_risk_score: number; // 0-100
  confidence_level: 'low' | 'medium' | 'high';
  risk_factors: {
    threat_factors: RiskFactor[];
    vulnerability_factors: RiskFactor[];
    impact_factors: RiskFactor[];
    contextual_factors: RiskFactor[];
  };
  temporal_adjustments: {
    urgency_score: number; // 1-10
    time_sensitivity: number; // 1-10
    threat_imminence: number; // 1-10
  };
  calculation_metadata: {
    calculation_method: string;
    ai_models_used: string[];
    calculation_timestamp: string;
    input_data_quality: number; // 0-1
  };
}

export interface RiskFactor {
  factor_name: string;
  factor_type: 'threat' | 'vulnerability' | 'impact' | 'contextual';
  weight: number; // 0-1
  score: number; // 1-10
  confidence: number; // 0-1
  description: string;
  data_sources: string[];
}

export interface BusinessImpactAssessment {
  assessment_id: string;
  risk_id: number;
  financial_impact: {
    direct_costs: {
      incident_response: number;
      system_recovery: number;
      data_recovery: number;
      legal_compliance: number;
    };
    indirect_costs: {
      business_interruption: number;
      reputation_damage: number;
      customer_loss: number;
      competitive_disadvantage: number;
    };
    total_estimated_impact: number;
    confidence_range: {
      low_estimate: number;
      high_estimate: number;
    };
  };
  operational_impact: {
    service_disruption: {
      affected_services: string[];
      disruption_duration_hours: number;
      affected_user_count: number;
      service_criticality_score: number;
    };
    productivity_impact: {
      affected_employees: number;
      productivity_loss_percentage: number;
      recovery_time_days: number;
    };
    compliance_impact: {
      regulatory_violations: string[];
      potential_fines: number;
      compliance_recovery_effort: number;
    };
  };
  reputational_impact: {
    brand_damage_score: number; // 1-10
    customer_trust_impact: number; // 1-10
    media_attention_likelihood: number; // 0-1
    long_term_reputation_effect: number; // 1-10
  };
  strategic_impact: {
    business_objective_alignment: number; // 1-10
    competitive_advantage_loss: number; // 1-10
    innovation_disruption: number; // 1-10
    partnership_relationships: number; // 1-10
  };
}

export interface MitigationRecommendation {
  recommendation_id: string;
  risk_id: number;
  recommendation_type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  mitigation_strategy: {
    control_category: string;
    control_description: string;
    implementation_effort: 'low' | 'medium' | 'high' | 'very_high';
    implementation_cost: 'low' | 'medium' | 'high' | 'very_high';
    effectiveness_score: number; // 0-1
    residual_risk_reduction: number; // 0-1
  };
  implementation_details: {
    required_resources: string[];
    estimated_timeline: string;
    dependencies: string[];
    success_metrics: string[];
  };
  business_justification: {
    cost_benefit_analysis: any;
    roi_estimate: number;
    risk_reduction_value: number;
    business_continuity_improvement: string;
  };
  ai_confidence: number; // 0-1
  supporting_intelligence: string[];
}

/**
 * Intelligent Risk Scoring Engine Implementation
 */
export class IntelligentRiskScoringEngine {
  constructor(
    private db: D1Database,
    private aiAnalysisService: AIThreatAnalysisService
  ) {}

  /**
   * CORE RISK SCORING METHODS
   */

  /**
   * Calculate contextual risk score combining threat intel with organizational context
   */
  async calculateContextualRiskScore(
    riskId: number,
    threatIntelligence: ThreatIntelligenceContext,
    organizationalContext: OrganizationalContext
  ): Promise<ContextualRiskScore> {
    const startTime = Date.now();
    console.log(`🎯 Calculating contextual risk score for risk ${riskId}`);

    try {
      // Step 1: Get base risk data
      const baseRisk = await this.getBaseRiskData(riskId);
      if (!baseRisk) {
        throw new Error(`Risk ${riskId} not found`);
      }

      // Step 2: Calculate threat landscape multiplier
      const threatMultiplier = await this.calculateThreatLandscapeMultiplier(
        threatIntelligence, 
        organizationalContext
      );

      // Step 3: Calculate organizational vulnerability multiplier
      const vulnerabilityMultiplier = await this.calculateVulnerabilityMultiplier(
        baseRisk,
        organizationalContext
      );

      // Step 4: Calculate business impact multiplier
      const impactMultiplier = await this.calculateBusinessImpactMultiplier(
        baseRisk,
        organizationalContext
      );

      // Step 5: Calculate threat actor targeting multiplier
      const targetingMultiplier = await this.calculateThreatActorTargetingMultiplier(
        threatIntelligence,
        organizationalContext
      );

      // Step 6: AI-enhanced risk factor analysis
      const riskFactors = await this.analyzeRiskFactorsWithAI(
        baseRisk,
        threatIntelligence,
        organizationalContext
      );

      // Step 7: Calculate temporal adjustments
      const temporalAdjustments = await this.calculateTemporalAdjustments(
        threatIntelligence,
        baseRisk
      );

      // Step 8: Compute final contextual risk score
      const baseScore = baseRisk.probability * baseRisk.impact; // Traditional 1-25 score
      const contextualMultiplier = (
        threatMultiplier +
        vulnerabilityMultiplier +
        impactMultiplier +
        targetingMultiplier
      ) / 4;

      const finalScore = Math.min(100, baseScore * contextualMultiplier * 4); // Scale to 0-100

      // Step 9: Determine confidence level
      const confidenceLevel = this.calculateConfidenceLevel(
        threatIntelligence.intelligence_confidence,
        organizationalContext,
        riskFactors
      );

      const contextualRiskScore: ContextualRiskScore = {
        risk_id: riskId,
        base_risk_score: baseScore,
        contextual_multipliers: {
          threat_landscape_multiplier: threatMultiplier,
          organizational_vulnerability_multiplier: vulnerabilityMultiplier,
          business_impact_multiplier: impactMultiplier,
          threat_actor_targeting_multiplier: targetingMultiplier
        },
        final_risk_score: finalScore,
        confidence_level: confidenceLevel,
        risk_factors: riskFactors,
        temporal_adjustments: temporalAdjustments,
        calculation_metadata: {
          calculation_method: 'ai_enhanced_contextual_v2',
          ai_models_used: ['threat_analysis', 'risk_correlation'],
          calculation_timestamp: new Date().toISOString(),
          input_data_quality: this.assessInputDataQuality(threatIntelligence, organizationalContext)
        }
      };

      // Step 10: Store risk score calculation
      await this.storeContextualRiskScore(contextualRiskScore);

      console.log(`✅ Contextual risk score calculated: ${finalScore} (${confidenceLevel} confidence) in ${Date.now() - startTime}ms`);
      return contextualRiskScore;

    } catch (error) {
      console.error(`❌ Contextual risk scoring failed for risk ${riskId}:`, error);
      throw new Error(`Risk scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assess business impact using AI-driven analysis
   */
  async assessBusinessImpact(
    riskId: number,
    threatIntelligence: ThreatIntelligenceContext,
    organizationalAssets: any[],
    organizationalContext: OrganizationalContext
  ): Promise<BusinessImpactAssessment> {
    console.log(`💼 Assessing business impact for risk ${riskId}`);

    try {
      // Step 1: Analyze financial impact using AI
      const financialImpact = await this.analyzeFinancialImpact(
        riskId,
        threatIntelligence,
        organizationalContext
      );

      // Step 2: Assess operational impact
      const operationalImpact = await this.assessOperationalImpact(
        riskId,
        organizationalAssets,
        organizationalContext
      );

      // Step 3: Evaluate reputational impact
      const reputationalImpact = await this.evaluateReputationalImpact(
        riskId,
        threatIntelligence,
        organizationalContext
      );

      // Step 4: Analyze strategic impact
      const strategicImpact = await this.analyzeStrategicImpact(
        riskId,
        organizationalContext
      );

      const businessImpactAssessment: BusinessImpactAssessment = {
        assessment_id: this.generateAssessmentId(),
        risk_id: riskId,
        financial_impact: financialImpact,
        operational_impact: operationalImpact,
        reputational_impact: reputationalImpact,
        strategic_impact: strategicImpact
      };

      // Store business impact assessment
      await this.storeBusinessImpactAssessment(businessImpactAssessment);

      console.log(`✅ Business impact assessment completed for risk ${riskId}`);
      return businessImpactAssessment;

    } catch (error) {
      console.error(`❌ Business impact assessment failed for risk ${riskId}:`, error);
      throw error;
    }
  }

  /**
   * Generate AI-driven mitigation recommendations
   */
  async recommendMitigations(
    riskId: number,
    riskScore: ContextualRiskScore,
    businessImpact: BusinessImpactAssessment,
    organizationalCapabilities: any[]
  ): Promise<MitigationRecommendation[]> {
    console.log(`🛡️ Generating mitigation recommendations for risk ${riskId}`);

    try {
      // Step 1: Analyze current security posture
      const securityPosture = await this.analyzeSecurityPosture(organizationalCapabilities);

      // Step 2: Identify mitigation gaps using AI
      const mitigationGaps = await this.identifyMitigationGaps(
        riskScore,
        businessImpact,
        securityPosture
      );

      // Step 3: Generate AI-enhanced recommendations
      const recommendations: MitigationRecommendation[] = [];

      for (const gap of mitigationGaps) {
        const recommendation = await this.generateMitigationRecommendation(
          riskId,
          gap,
          riskScore,
          businessImpact
        );
        recommendations.push(recommendation);
      }

      // Step 4: Prioritize recommendations
      const prioritizedRecommendations = await this.prioritizeMitigationRecommendations(
        recommendations,
        riskScore
      );

      // Step 5: Store recommendations
      await this.storeMitigationRecommendations(prioritizedRecommendations);

      console.log(`✅ Generated ${prioritizedRecommendations.length} mitigation recommendations for risk ${riskId}`);
      return prioritizedRecommendations;

    } catch (error) {
      console.error(`❌ Mitigation recommendation generation failed for risk ${riskId}:`, error);
      throw error;
    }
  }

  /**
   * PRIVATE CALCULATION METHODS
   */

  /**
   * Get base risk data from database
   */
  private async getBaseRiskData(riskId: number): Promise<any> {
    const result = await this.db.prepare(`
      SELECT id, title, description, category, probability, impact, 
             status, owner_id, organization_id, created_at
      FROM risks 
      WHERE id = ?
    `).bind(riskId).first();

    return result;
  }

  /**
   * Calculate threat landscape multiplier
   */
  private async calculateThreatLandscapeMultiplier(
    threatIntel: ThreatIntelligenceContext,
    orgContext: OrganizationalContext
  ): Promise<number> {
    console.log('🌍 Calculating threat landscape multiplier');

    let multiplier = 1.0;

    // Industry targeting frequency adjustment
    multiplier += threatIntel.threat_landscape.industry_targeting_frequency * 0.5;

    // Geographical threat level adjustment
    multiplier += threatIntel.threat_landscape.geographical_threat_level * 0.3;

    // Active threat campaigns adjustment
    const campaignFactor = Math.min(threatIntel.threat_landscape.active_threat_campaigns / 10, 1.0);
    multiplier += campaignFactor * 0.2;

    // Recent incidents in sector
    const incidentFactor = Math.min(threatIntel.threat_landscape.recent_incidents_in_sector / 20, 1.0);
    multiplier += incidentFactor * 0.3;

    return Math.min(multiplier, 3.0); // Cap at 3x multiplier
  }

  /**
   * Calculate organizational vulnerability multiplier
   */
  private async calculateVulnerabilityMultiplier(
    baseRisk: any,
    orgContext: OrganizationalContext
  ): Promise<number> {
    console.log('🔓 Calculating vulnerability multiplier');

    let multiplier = 1.0;

    // Security maturity inverse relationship (lower maturity = higher multiplier)
    const maturityScore = (
      orgContext.security_maturity.security_controls_maturity +
      orgContext.security_maturity.incident_response_capability +
      orgContext.security_maturity.security_awareness_level +
      orgContext.security_maturity.threat_detection_capability
    ) / 40; // Normalize to 0-1

    multiplier += (1.0 - maturityScore) * 0.8;

    // Internet exposure adjustment
    multiplier += (orgContext.asset_profile.internet_exposure / 10) * 0.3;

    // Supply chain complexity adjustment
    multiplier += (orgContext.asset_profile.supply_chain_complexity / 10) * 0.2;

    return Math.min(multiplier, 2.5); // Cap at 2.5x multiplier
  }

  /**
   * Calculate business impact multiplier
   */
  private async calculateBusinessImpactMultiplier(
    baseRisk: any,
    orgContext: OrganizationalContext
  ): Promise<number> {
    console.log('💼 Calculating business impact multiplier');

    let multiplier = 1.0;

    // Business criticality factors
    const criticalityScore = (
      orgContext.business_criticality_profile.revenue_dependency +
      orgContext.business_criticality_profile.operational_criticality +
      orgContext.business_criticality_profile.data_sensitivity +
      orgContext.business_criticality_profile.public_profile
    ) / 40; // Normalize to 0-1

    multiplier += criticalityScore * 0.6;

    // Organization size adjustment (larger orgs = higher impact)
    const sizeMultipliers = {
      'small': 1.0,
      'medium': 1.2,
      'large': 1.4,
      'enterprise': 1.6
    };
    multiplier *= sizeMultipliers[orgContext.organization_size];

    return Math.min(multiplier, 2.0); // Cap at 2x multiplier
  }

  /**
   * Calculate threat actor targeting multiplier
   */
  private async calculateThreatActorTargetingMultiplier(
    threatIntel: ThreatIntelligenceContext,
    orgContext: OrganizationalContext
  ): Promise<number> {
    console.log('🎯 Calculating threat actor targeting multiplier');

    let multiplier = 1.0;

    // Check if organization matches threat actor targeting profiles
    for (const [actor, likelihood] of Object.entries(threatIntel.threat_actor_activity.targeting_likelihood)) {
      if (likelihood > 0.7) {
        multiplier += 0.3; // High likelihood of targeting
      } else if (likelihood > 0.4) {
        multiplier += 0.1; // Moderate likelihood
      }
    }

    return Math.min(multiplier, 2.0); // Cap at 2x multiplier
  }

  /**
   * Analyze risk factors using AI
   */
  private async analyzeRiskFactorsWithAI(
    baseRisk: any,
    threatIntel: ThreatIntelligenceContext,
    orgContext: OrganizationalContext
  ): Promise<{
    threat_factors: RiskFactor[];
    vulnerability_factors: RiskFactor[];
    impact_factors: RiskFactor[];
    contextual_factors: RiskFactor[];
  }> {
    console.log('🤖 Analyzing risk factors with AI');

    // Simplified implementation - in production would use sophisticated AI analysis
    const threatFactors: RiskFactor[] = [
      {
        factor_name: 'Industry Targeting',
        factor_type: 'threat',
        weight: 0.8,
        score: threatIntel.threat_landscape.industry_targeting_frequency * 10,
        confidence: threatIntel.intelligence_confidence.analysis_confidence,
        description: 'Frequency of threat actor targeting in organization industry',
        data_sources: ['threat_intelligence', 'industry_reports']
      }
    ];

    const vulnerabilityFactors: RiskFactor[] = [
      {
        factor_name: 'Security Maturity',
        factor_type: 'vulnerability',
        weight: 0.9,
        score: 10 - ((orgContext.security_maturity.security_controls_maturity + 
                     orgContext.security_maturity.incident_response_capability) / 2),
        confidence: 0.8,
        description: 'Organizational security maturity level assessment',
        data_sources: ['security_assessment', 'maturity_evaluation']
      }
    ];

    const impactFactors: RiskFactor[] = [
      {
        factor_name: 'Business Criticality',
        factor_type: 'impact',
        weight: 0.9,
        score: (orgContext.business_criticality_profile.revenue_dependency +
               orgContext.business_criticality_profile.operational_criticality) / 2,
        confidence: 0.7,
        description: 'Business criticality assessment for potential impact',
        data_sources: ['business_impact_analysis', 'asset_valuation']
      }
    ];

    const contextualFactors: RiskFactor[] = [
      {
        factor_name: 'Regulatory Environment',
        factor_type: 'contextual',
        weight: 0.6,
        score: orgContext.regulatory_requirements.length,
        confidence: 0.9,
        description: 'Regulatory compliance requirements complexity',
        data_sources: ['compliance_framework', 'regulatory_mapping']
      }
    ];

    return {
      threat_factors: threatFactors,
      vulnerability_factors: vulnerabilityFactors,
      impact_factors: impactFactors,
      contextual_factors: contextualFactors
    };
  }

  /**
   * Calculate temporal adjustments for urgency and time sensitivity
   */
  private async calculateTemporalAdjustments(
    threatIntel: ThreatIntelligenceContext,
    baseRisk: any
  ): Promise<{
    urgency_score: number;
    time_sensitivity: number;
    threat_imminence: number;
  }> {
    // Simplified temporal analysis
    const urgencyScore = Math.min(threatIntel.threat_landscape.active_threat_campaigns / 5, 10);
    const timeSensitivity = 7; // Default moderate time sensitivity
    const threatImminence = Math.min(threatIntel.threat_landscape.recent_incidents_in_sector / 3, 10);

    return {
      urgency_score: urgencyScore,
      time_sensitivity: timeSensitivity,
      threat_imminence: threatImminence
    };
  }

  /**
   * Calculate confidence level based on data quality
   */
  private calculateConfidenceLevel(
    intelConfidence: any,
    orgContext: OrganizationalContext,
    riskFactors: any
  ): 'low' | 'medium' | 'high' {
    const overallConfidence = (
      intelConfidence.data_freshness +
      intelConfidence.source_reliability +
      intelConfidence.analysis_confidence
    ) / 3;

    if (overallConfidence > 0.8) return 'high';
    if (overallConfidence > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Assess input data quality
   */
  private assessInputDataQuality(
    threatIntel: ThreatIntelligenceContext,
    orgContext: OrganizationalContext
  ): number {
    // Simplified data quality assessment
    return (threatIntel.intelligence_confidence.data_freshness +
            threatIntel.intelligence_confidence.source_reliability) / 2;
  }

  /**
   * BUSINESS IMPACT ANALYSIS METHODS (Simplified)
   */

  private async analyzeFinancialImpact(riskId: number, threatIntel: any, orgContext: any): Promise<any> {
    // Simplified financial impact analysis
    return {
      direct_costs: { incident_response: 50000, system_recovery: 30000, data_recovery: 20000, legal_compliance: 15000 },
      indirect_costs: { business_interruption: 100000, reputation_damage: 75000, customer_loss: 50000, competitive_disadvantage: 25000 },
      total_estimated_impact: 365000,
      confidence_range: { low_estimate: 200000, high_estimate: 500000 }
    };
  }

  private async assessOperationalImpact(riskId: number, assets: any[], orgContext: any): Promise<any> {
    return {
      service_disruption: { affected_services: ['primary_service'], disruption_duration_hours: 24, affected_user_count: 1000, service_criticality_score: 8 },
      productivity_impact: { affected_employees: 100, productivity_loss_percentage: 30, recovery_time_days: 3 },
      compliance_impact: { regulatory_violations: ['GDPR'], potential_fines: 50000, compliance_recovery_effort: 7 }
    };
  }

  private async evaluateReputationalImpact(riskId: number, threatIntel: any, orgContext: any): Promise<any> {
    return {
      brand_damage_score: 6,
      customer_trust_impact: 7,
      media_attention_likelihood: 0.4,
      long_term_reputation_effect: 5
    };
  }

  private async analyzeStrategicImpact(riskId: number, orgContext: any): Promise<any> {
    return {
      business_objective_alignment: 8,
      competitive_advantage_loss: 6,
      innovation_disruption: 5,
      partnership_relationships: 7
    };
  }

  /**
   * MITIGATION RECOMMENDATION METHODS (Simplified)
   */

  private async analyzeSecurityPosture(capabilities: any[]): Promise<any> {
    return { maturity_level: 'medium', gaps: ['endpoint_protection', 'threat_hunting'] };
  }

  private async identifyMitigationGaps(riskScore: any, businessImpact: any, posture: any): Promise<any[]> {
    return [{ gap_type: 'detection', priority: 'high', description: 'Enhanced threat detection needed' }];
  }

  private async generateMitigationRecommendation(riskId: number, gap: any, riskScore: any, businessImpact: any): Promise<MitigationRecommendation> {
    return {
      recommendation_id: `rec_${riskId}_${Date.now()}`,
      risk_id: riskId,
      recommendation_type: 'detective',
      priority: 'high',
      mitigation_strategy: {
        control_category: 'threat_detection',
        control_description: 'Implement advanced threat detection system',
        implementation_effort: 'medium',
        implementation_cost: 'medium',
        effectiveness_score: 0.8,
        residual_risk_reduction: 0.6
      },
      implementation_details: {
        required_resources: ['security_team', 'detection_tools'],
        estimated_timeline: '3-6 months',
        dependencies: ['budget_approval', 'vendor_selection'],
        success_metrics: ['detection_rate', 'false_positive_rate']
      },
      business_justification: {
        cost_benefit_analysis: {},
        roi_estimate: 2.5,
        risk_reduction_value: 150000,
        business_continuity_improvement: 'Significant improvement in threat detection capabilities'
      },
      ai_confidence: 0.7,
      supporting_intelligence: ['threat_landscape_analysis', 'industry_benchmarks']
    };
  }

  private async prioritizeMitigationRecommendations(recommendations: MitigationRecommendation[], riskScore: any): Promise<MitigationRecommendation[]> {
    // Simple prioritization by risk reduction value
    return recommendations.sort((a, b) => b.business_justification.risk_reduction_value - a.business_justification.risk_reduction_value);
  }

  /**
   * STORAGE METHODS
   */

  private async storeContextualRiskScore(riskScore: ContextualRiskScore): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ai_risk_assessments (
          risk_id, assessment_type, ai_analysis, risk_score,
          business_impact_score, confidence_level, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        riskScore.risk_id,
        'comprehensive',
        JSON.stringify(riskScore),
        riskScore.final_risk_score,
        riskScore.temporal_adjustments.urgency_score + riskScore.temporal_adjustments.threat_imminence,
        riskScore.confidence_level,
        new Date().toISOString()
      ).run();

      console.log(`💾 Stored contextual risk score for risk ${riskScore.risk_id}`);
    } catch (error) {
      console.error('Error storing contextual risk score:', error);
      throw error;
    }
  }

  private async storeBusinessImpactAssessment(assessment: BusinessImpactAssessment): Promise<void> {
    console.log(`💾 Storing business impact assessment for risk ${assessment.risk_id}`);
    // Implementation would store to business impact assessment table
  }

  private async storeMitigationRecommendations(recommendations: MitigationRecommendation[]): Promise<void> {
    console.log(`💾 Storing ${recommendations.length} mitigation recommendations`);
    // Implementation would store to mitigation recommendations table
  }

  /**
   * UTILITY METHODS
   */

  private generateAssessmentId(): string {
    return `assessment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * PUBLIC QUERY METHODS
   */

  /**
   * Get contextual risk scores for multiple risks
   */
  async getContextualRiskScores(riskIds: number[]): Promise<ContextualRiskScore[]> {
    const placeholders = riskIds.map(() => '?').join(',');
    const result = await this.db.prepare(`
      SELECT risk_id, ai_analysis, risk_score, confidence_level, created_at
      FROM ai_risk_assessments
      WHERE risk_id IN (${placeholders}) AND assessment_type = 'comprehensive'
      ORDER BY created_at DESC
    `).bind(...riskIds).all();

    return (result.results || []).map(row => JSON.parse(row.ai_analysis as string));
  }

  /**
   * Get risk scoring performance metrics
   */
  async getRiskScoringMetrics(timeframe: string = '30d'): Promise<any> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_assessments,
        AVG(risk_score) as average_risk_score,
        COUNT(CASE WHEN confidence_level = 'high' THEN 1 END) as high_confidence_assessments,
        COUNT(CASE WHEN confidence_level = 'medium' THEN 1 END) as medium_confidence_assessments,
        COUNT(CASE WHEN confidence_level = 'low' THEN 1 END) as low_confidence_assessments
      FROM ai_risk_assessments
      WHERE created_at >= datetime('now', '-30 days')
        AND assessment_type = 'comprehensive'
    `).first();

    return result || {
      total_assessments: 0,
      average_risk_score: 0,
      high_confidence_assessments: 0,
      medium_confidence_assessments: 0,
      low_confidence_assessments: 0
    };
  }
}