// DMT Risk Assessment System v2.0 - AI Risk Intelligence Module
// Advanced AI-powered risk scoring, trend analysis, and predictive modeling

import { CloudflareBindings, Risk } from './types';

export interface AIRiskAnalysis {
  risk_id: number;
  ai_risk_score: number;
  confidence_level: number;
  risk_trend: 'increasing' | 'stable' | 'decreasing';
  threat_multiplier: number;
  industry_factor: number;
  external_threat_level: number;
  predicted_impact_date?: string;
  risk_velocity: number;
  contributing_factors: string[];
  recommendations: string[];
  analysis_timestamp: string;
}

export interface RiskPrediction {
  risk_id: number;
  current_score: number;
  predicted_score: number;
  prediction_confidence: number;
  trend_direction: string;
  escalation_probability: number;
  time_to_escalation_days?: number;
  mitigation_effectiveness: number;
}

export interface ComplianceGapAnalysis {
  framework: string;
  total_requirements: number;
  compliant_requirements: number;
  non_compliant_requirements: number;
  partially_compliant_requirements: number;
  overall_compliance_score: number;
  gap_severity: 'critical' | 'high' | 'medium' | 'low';
  gaps_identified: ComplianceGap[];
  recommendations: string[];
  next_assessment_date: string;
}

export interface ComplianceGap {
  requirement_id: string;
  requirement_text: string;
  current_status: string;
  target_status: string;
  gap_type: 'implementation' | 'performance' | 'documentation' | 'critical';
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  priority_score: number;
  estimated_effort: 'low' | 'medium' | 'high';
  remediation_plan?: string;
}

export class AIRiskIntelligence {
  private db: D1Database;
  private ai: any; // Cloudflare AI binding

  constructor(bindings: CloudflareBindings) {
    this.db = bindings.DB;
    this.ai = bindings.AI;
  }

  /**
   * Calculate enhanced AI-powered risk score using multiple data sources
   */
  async calculateAIRiskScore(risk: Risk): Promise<AIRiskAnalysis> {
    try {
      // Get base risk score
      const baseScore = (risk.probability || 1) * (risk.impact || 1);
      
      // Get external threat intelligence
      const threatIntel = await this.getRelevantThreatIntelligence(risk.category_id);
      const threatMultiplier = threatIntel.reduce((max, threat) => 
        Math.max(max, threat.threat_level * threat.relevance_score), 1.0
      );

      // Calculate industry benchmark factor
      const industryFactor = await this.getIndustryRiskBenchmark(risk.category_id);
      
      // Analyze historical risk trends
      const trendAnalysis = await this.analyzeRiskTrend(risk.id);
      
      // Calculate AI-enhanced risk score
      const aiRiskScore = Math.min(
        baseScore * (1 + threatMultiplier * 0.3) * industryFactor,
        25 // Cap at maximum score
      );

      // Determine risk velocity (rate of change)
      const riskVelocity = trendAnalysis.velocity || 0;
      
      // Predict future impact date if risk is escalating
      let predictedImpactDate: string | undefined;
      if (trendAnalysis.trend === 'increasing' && riskVelocity > 0.1) {
        const daysToEscalation = Math.ceil(30 / (riskVelocity * 10));
        predictedImpactDate = new Date(Date.now() + daysToEscalation * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      // Generate AI-powered recommendations
      const recommendations = await this.generateRiskRecommendations(risk, aiRiskScore, trendAnalysis);
      
      // Calculate confidence level based on data quality
      const confidenceLevel = this.calculateConfidenceLevel(risk, threatIntel.length, trendAnalysis);

      const analysis: AIRiskAnalysis = {
        risk_id: risk.id,
        ai_risk_score: Math.round(aiRiskScore * 100) / 100,
        confidence_level: Math.round(confidenceLevel * 100) / 100,
        risk_trend: trendAnalysis.trend as 'increasing' | 'stable' | 'decreasing',
        threat_multiplier: Math.round(threatMultiplier * 100) / 100,
        industry_factor: Math.round(industryFactor * 100) / 100,
        external_threat_level: Math.round(threatIntel.reduce((sum, t) => sum + t.threat_level, 0) / Math.max(threatIntel.length, 1) * 100) / 100,
        predicted_impact_date: predictedImpactDate,
        risk_velocity: Math.round(riskVelocity * 1000) / 1000,
        contributing_factors: this.extractContributingFactors(risk, threatIntel, trendAnalysis),
        recommendations,
        analysis_timestamp: new Date().toISOString()
      };

      // Store analysis in database
      await this.storeAIAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      console.error('AI Risk Score calculation failed:', error);
      // Return fallback analysis
      return {
        risk_id: risk.id,
        ai_risk_score: (risk.probability || 1) * (risk.impact || 1),
        confidence_level: 0.5,
        risk_trend: 'stable',
        threat_multiplier: 1.0,
        industry_factor: 1.0,
        external_threat_level: 0.0,
        risk_velocity: 0.0,
        contributing_factors: ['Insufficient data for AI analysis'],
        recommendations: ['Update risk assessment with more detailed information'],
        analysis_timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze risk trends and predict future trajectory
   */
  async analyzeRiskTrend(riskId: number): Promise<{ trend: string; velocity: number; confidence: number }> {
    try {
      // Get historical risk data
      const historicalData = await this.db.prepare(`
        SELECT 
          DATE(updated_at) as date,
          risk_score,
          ai_risk_score
        FROM risks 
        WHERE id = ? 
        ORDER BY updated_at DESC 
        LIMIT 30
      `).bind(riskId).all();

      if (historicalData.results.length < 2) {
        return { trend: 'stable', velocity: 0, confidence: 0.3 };
      }

      // Calculate trend using simple linear regression
      const scores = historicalData.results.map((r: any) => r.ai_risk_score || r.risk_score || 0);
      const trendSlope = this.calculateTrendSlope(scores);
      
      let trend: string;
      if (trendSlope > 0.1) trend = 'increasing';
      else if (trendSlope < -0.1) trend = 'decreasing';
      else trend = 'stable';

      const velocity = Math.abs(trendSlope);
      const confidence = Math.min(historicalData.results.length / 10, 1.0);

      // Store trend analysis
      await this.db.prepare(`
        INSERT INTO risk_trend_analysis (risk_id, analysis_date, previous_score, current_score, trend_direction, velocity, predicted_score, prediction_confidence)
        VALUES (?, DATE('now'), ?, ?, ?, ?, ?, ?)
      `).bind(
        riskId,
        scores[scores.length - 1] || 0,
        scores[0] || 0,
        trend,
        velocity,
        scores[0] + trendSlope * 7, // 7-day prediction
        confidence
      ).run();

      return { trend, velocity, confidence };
    } catch (error) {
      console.error('Risk trend analysis failed:', error);
      return { trend: 'stable', velocity: 0, confidence: 0.2 };
    }
  }

  /**
   * Generate comprehensive compliance gap analysis
   */
  async generateComplianceGapAnalysis(framework: string): Promise<ComplianceGapAnalysis> {
    try {
      // Get compliance requirements for the framework
      const requirements = await this.db.prepare(`
        SELECT 
          cr.*,
          cr.compliance_status as implementation_status,
          CASE 
            WHEN cr.compliance_status = 'compliant' THEN 90
            WHEN cr.compliance_status = 'partially_compliant' THEN 60
            WHEN cr.compliance_status = 'non_compliant' THEN 20
            ELSE 0
          END as effectiveness_score,
          cr.updated_at as last_assessment_date
        FROM compliance_requirements cr
        WHERE cr.framework = ?
      `).bind(framework).all();

      if (!requirements.results.length) {
        throw new Error(`No requirements found for framework: ${framework}`);
      }

      const totalRequirements = requirements.results.length;
      let compliantCount = 0;
      let nonCompliantCount = 0;
      let partiallyCompliantCount = 0;
      const gaps: ComplianceGap[] = [];

      // Analyze each requirement
      for (const req of requirements.results as any[]) {
        const status = req.compliance_status || 'unknown';
        const effectivenessScore = req.effectiveness_score || 0;
        
        if (status === 'compliant' && effectivenessScore >= 80) {
          compliantCount++;
        } else if (status === 'non_compliant' || effectivenessScore < 50) {
          nonCompliantCount++;
          gaps.push(this.createComplianceGap(req, 'critical'));
        } else {
          partiallyCompliantCount++;
          gaps.push(this.createComplianceGap(req, 'performance'));
        }
      }

      // Calculate overall compliance score
      const complianceScore = Math.round((compliantCount / totalRequirements) * 100);
      
      // Determine gap severity
      let gapSeverity: 'critical' | 'high' | 'medium' | 'low';
      if (complianceScore < 50) gapSeverity = 'critical';
      else if (complianceScore < 70) gapSeverity = 'high';
      else if (complianceScore < 85) gapSeverity = 'medium';
      else gapSeverity = 'low';

      // Generate AI-powered recommendations
      const recommendations = await this.generateComplianceRecommendations(framework, gaps, complianceScore);

      // Calculate next assessment date
      const nextAssessmentDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const analysis: ComplianceGapAnalysis = {
        framework,
        total_requirements: totalRequirements,
        compliant_requirements: compliantCount,
        non_compliant_requirements: nonCompliantCount,
        partially_compliant_requirements: partiallyCompliantCount,
        overall_compliance_score: complianceScore,
        gap_severity: gapSeverity,
        gaps_identified: gaps.sort((a, b) => b.priority_score - a.priority_score), // Sort by priority
        recommendations,
        next_assessment_date: nextAssessmentDate
      };

      // Store gap analysis
      await this.storeComplianceGapAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Compliance gap analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate risk heat map data for visualization
   */
  async generateRiskHeatMapData(): Promise<any[]> {
    try {
      const risks = await this.db.prepare(`
        SELECT 
          r.*,
          rc.name as category_name,
          COALESCE(r.ai_risk_score, r.risk_score) as display_score
        FROM risks r
        LEFT JOIN risk_categories rc ON r.category_id = rc.id
        WHERE r.status = 'active'
      `).all();

      const heatMapData = [];

      for (const risk of risks.results as any[]) {
        const probability = risk.probability || 1;
        const impact = risk.impact || 1;
        const score = risk.display_score || (probability * impact);
        
        // Calculate heat intensity (0.0 to 1.0)
        const heatIntensity = Math.min(score / 25, 1.0);
        
        // Determine grid position (5x5 grid)
        const gridX = Math.min(Math.ceil(probability), 5);
        const gridY = Math.min(Math.ceil(impact), 5);

        const dataPoint = {
          risk_id: risk.id,
          title: risk.title,
          category: risk.category_name || 'Unknown',
          probability,
          impact,
          risk_score: score,
          ai_risk_score: risk.ai_risk_score,
          trend: risk.risk_trend || 'stable',
          heat_intensity: heatIntensity,
          grid_x: gridX,
          grid_y: gridY,
          color: this.getHeatMapColor(heatIntensity),
          size: Math.max(10, score * 2) // Visual size based on score
        };

        heatMapData.push(dataPoint);

        // Store heat map data
        await this.db.prepare(`
          INSERT OR REPLACE INTO risk_heat_map_data 
          (risk_id, probability, impact, risk_score, ai_risk_score, category_name, trend_direction, heat_intensity, grid_position_x, grid_position_y, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          risk.id,
          probability,
          impact,
          score,
          risk.ai_risk_score,
          risk.category_name,
          risk.risk_trend,
          heatIntensity,
          gridX,
          gridY
        ).run();
      }

      return heatMapData;
    } catch (error) {
      console.error('Heat map generation failed:', error);
      return [];
    }
  }

  // Helper methods
  private async getRelevantThreatIntelligence(categoryId: number): Promise<any[]> {
    const category = await this.db.prepare('SELECT name FROM risk_categories WHERE id = ?').bind(categoryId).first();
    const categoryName = category?.name?.toLowerCase() || '';

    return await this.db.prepare(`
      SELECT * FROM threat_intelligence 
      WHERE category LIKE ? OR threat_type LIKE ?
      ORDER BY threat_level DESC, relevance_score DESC
      LIMIT 5
    `).bind(`%${categoryName}%`, `%${categoryName}%`).all().then(r => r.results || []);
  }

  private async getIndustryRiskBenchmark(categoryId: number): Promise<number> {
    // Simplified industry benchmarking - in production, this would use external data
    const benchmarks: { [key: number]: number } = {
      1: 1.2, // Cybersecurity - higher risk industry-wide
      2: 1.1, // Data Privacy - elevated risk
      3: 0.9, // Operational - standard risk
      4: 1.0, // Financial - baseline
      5: 0.8, // Strategic - lower than average
      6: 1.3  // Third-party - highest risk multiplier
    };
    
    return benchmarks[categoryId] || 1.0;
  }

  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = Array.from({length: n}, (_, i) => i).reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, value, index) => sum + (index * value), 0);
    const sumXX = Array.from({length: n}, (_, i) => i * i).reduce((a, b) => a + b, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateConfidenceLevel(risk: Risk, threatIntelCount: number, trendData: any): number {
    let confidence = 0.3; // Base confidence
    
    // Increase confidence based on data completeness
    if (risk.root_cause && risk.potential_impact) confidence += 0.2;
    if (risk.existing_controls) confidence += 0.1;
    if (threatIntelCount > 0) confidence += Math.min(threatIntelCount * 0.1, 0.3);
    if (trendData.confidence > 0.5) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private extractContributingFactors(risk: Risk, threatIntel: any[], trendData: any): string[] {
    const factors = [];
    
    if (risk.root_cause) factors.push(`Root cause: ${risk.root_cause}`);
    if (threatIntel.length > 0) factors.push(`External threats: ${threatIntel.length} relevant threats identified`);
    if (trendData.trend === 'increasing') factors.push('Risk trend: Increasing over time');
    if (risk.existing_controls) factors.push('Existing controls in place');
    else factors.push('No documented controls');
    
    return factors;
  }

  private async generateRiskRecommendations(risk: Risk, aiScore: number, trendData: any): Promise<string[]> {
    const recommendations = [];
    
    if (aiScore > 15) {
      recommendations.push('High risk identified - immediate attention required');
      recommendations.push('Consider escalating to senior management');
    }
    
    if (trendData.trend === 'increasing') {
      recommendations.push('Risk is escalating - implement additional controls');
      recommendations.push('Increase monitoring frequency');
    }
    
    if (!risk.existing_controls) {
      recommendations.push('Document and implement risk controls');
    }
    
    if (!risk.mitigation_plan) {
      recommendations.push('Develop comprehensive mitigation plan');
    }

    return recommendations.length > 0 ? recommendations : ['Continue monitoring risk status'];
  }

  private createComplianceGap(requirement: any, gapType: string): ComplianceGap {
    return {
      requirement_id: requirement.requirement_id || requirement.id.toString(),
      requirement_text: requirement.description || requirement.title,
      current_status: requirement.compliance_status || 'unknown',
      target_status: 'compliant',
      gap_type: gapType as any,
      risk_level: this.determineGapRiskLevel(requirement),
      priority_score: this.calculateGapPriority(requirement),
      estimated_effort: this.estimateRemediationEffort(requirement),
      remediation_plan: `Address ${gapType} gap for requirement ${requirement.requirement_id}`
    };
  }

  private determineGapRiskLevel(requirement: any): 'critical' | 'high' | 'medium' | 'low' {
    const score = requirement.effectiveness_score || 0;
    if (score < 30) return 'critical';
    if (score < 50) return 'high';
    if (score < 70) return 'medium';
    return 'low';
  }

  private calculateGapPriority(requirement: any): number {
    const effectivenessScore = requirement.effectiveness_score || 0;
    const isImplemented = requirement.implementation_status === 'implemented';
    return Math.round((100 - effectivenessScore) * (isImplemented ? 0.8 : 1.2));
  }

  private estimateRemediationEffort(requirement: any): 'low' | 'medium' | 'high' {
    const score = requirement.effectiveness_score || 0;
    if (score < 30) return 'high';
    if (score < 60) return 'medium';
    return 'low';
  }

  private async generateComplianceRecommendations(framework: string, gaps: ComplianceGap[], score: number): Promise<string[]> {
    const recommendations = [];
    
    if (score < 50) {
      recommendations.push(`Critical compliance gaps identified for ${framework}`);
      recommendations.push('Immediate action required to address high-risk gaps');
    }
    
    if (gaps.length > 0) {
      const criticalGaps = gaps.filter(g => g.risk_level === 'critical').length;
      if (criticalGaps > 0) {
        recommendations.push(`${criticalGaps} critical gaps require immediate attention`);
      }
    }
    
    recommendations.push('Schedule regular compliance assessments');
    recommendations.push('Implement continuous monitoring for key controls');
    
    return recommendations;
  }

  private getHeatMapColor(intensity: number): string {
    if (intensity > 0.7) return '#dc2626'; // Red
    if (intensity > 0.5) return '#ea580c'; // Orange
    if (intensity > 0.3) return '#ca8a04'; // Yellow
    return '#16a34a'; // Green
  }

  private async storeAIAnalysis(analysis: AIRiskAnalysis): Promise<void> {
    // Update the risks table with AI analysis
    await this.db.prepare(`
      UPDATE risks SET 
        ai_risk_score = ?,
        risk_trend = ?,
        predicted_impact_date = ?,
        confidence_level = ?,
        threat_multiplier = ?,
        industry_factor = ?,
        external_threat_level = ?,
        ai_analysis_timestamp = ?,
        risk_velocity = ?
      WHERE id = ?
    `).bind(
      analysis.ai_risk_score,
      analysis.risk_trend,
      analysis.predicted_impact_date || null,
      analysis.confidence_level,
      analysis.threat_multiplier,
      analysis.industry_factor,
      analysis.external_threat_level,
      analysis.analysis_timestamp,
      analysis.risk_velocity,
      analysis.risk_id
    ).run();

    // Store prediction data
    await this.db.prepare(`
      INSERT INTO ai_risk_predictions (risk_id, prediction_type, current_value, predicted_value, prediction_date, confidence_level, contributing_factors)
      VALUES (?, 'score', ?, ?, DATE('now', '+7 days'), ?, ?)
    `).bind(
      analysis.risk_id,
      analysis.ai_risk_score,
      analysis.ai_risk_score * (1 + analysis.risk_velocity),
      analysis.confidence_level,
      JSON.stringify(analysis.contributing_factors)
    ).run();
  }

  private async storeComplianceGapAnalysis(analysis: ComplianceGapAnalysis): Promise<void> {
    // Store main analysis
    const result = await this.db.prepare(`
      INSERT INTO compliance_gap_analysis 
      (framework, analysis_date, total_requirements, compliant_requirements, non_compliant_requirements, 
       partially_compliant_requirements, overall_compliance_score, gap_severity, gaps_identified, 
       recommendations, next_assessment_date, created_by)
      VALUES (?, DATE('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      analysis.framework,
      analysis.total_requirements,
      analysis.compliant_requirements,
      analysis.non_compliant_requirements,
      analysis.partially_compliant_requirements,
      analysis.overall_compliance_score,
      analysis.gap_severity,
      JSON.stringify(analysis.gaps_identified),
      JSON.stringify(analysis.recommendations),
      analysis.next_assessment_date
    ).run();

    // Store individual gap details
    const analysisId = result.meta.last_row_id;
    for (const gap of analysis.gaps_identified) {
      await this.db.prepare(`
        INSERT INTO compliance_gap_details 
        (gap_analysis_id, requirement_id, requirement_text, current_status, target_status, 
         gap_type, risk_level, priority_score, estimated_effort, remediation_plan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        analysisId,
        gap.requirement_id,
        gap.requirement_text,
        gap.current_status,
        gap.target_status,
        gap.gap_type,
        gap.risk_level,
        gap.priority_score,
        gap.estimated_effort,
        gap.remediation_plan
      ).run();
    }
  }
}