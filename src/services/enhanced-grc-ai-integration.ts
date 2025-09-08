/**
 * Enhanced GRC-AI Integration Service
 * 
 * Advanced integration between Governance, Risk, Compliance and AI/ML modules:
 * - Automatic mapping of AI risk findings to compliance frameworks
 * - AI assessment of existing control effectiveness
 * - GRC performance analytics with AI insights
 * - Intelligent compliance gap analysis
 * - Automated control recommendations based on ML findings
 */

import { D1Database } from '@cloudflare/workers-types';
import { LiveAIMLIntegration } from './live-ai-ml-integration';
import { AIThreatAnalysisService } from './ai-threat-analysis';

export interface ComplianceFrameworkMapping {
  framework: 'SOC2' | 'ISO27001' | 'NIST' | 'PCI_DSS' | 'GDPR' | 'HIPAA';
  control_id: string;
  control_name: string;
  control_category: string;
  relevance_score: number; // 0-1
  ai_rationale: string;
  implementation_guidance: string;
  risk_mitigation_impact: number; // 0-1
}

export interface AIControlEffectivenessAssessment {
  control_id: string;
  framework: string;
  current_effectiveness: number; // 0-1
  ai_assessment_reasoning: string;
  improvement_recommendations: string[];
  threat_coverage_gaps: string[];
  automation_opportunities: string[];
  cost_benefit_analysis: {
    implementation_cost: 'low' | 'medium' | 'high';
    risk_reduction_impact: number; // 0-1
    roi_estimate: string;
  };
}

export interface GRCPerformanceMetrics {
  compliance_score: number; // 0-100
  risk_posture_improvement: number; // percentage change
  control_automation_rate: number; // 0-1
  ai_driven_insights: {
    total_recommendations: number;
    accepted_recommendations: number;
    false_positive_rate: number;
    accuracy_score: number;
  };
  framework_coverage: {
    framework: string;
    coverage_percentage: number;
    critical_gaps: string[];
  }[];
}

export class EnhancedGRCAIIntegration {
  private db: D1Database;
  private aimlIntegration: LiveAIMLIntegration;
  private aiThreatService: AIThreatAnalysisService;

  constructor(db: D1Database, env: any) {
    this.db = db;
    this.aimlIntegration = new LiveAIMLIntegration(db);
    this.aiThreatService = new AIThreatAnalysisService(db, env);
  }

  /**
   * Automatically map AI risk findings to compliance frameworks
   */
  async autoMapRiskToCompliance(riskId: number): Promise<ComplianceFrameworkMapping[]> {
    console.log(`🎯 Auto-mapping risk ${riskId} to compliance frameworks`);
    
    try {
      // Get risk details with AI analysis
      const risk = await this.db.prepare(`
        SELECT r.*, 
               ara.ai_analysis,
               ara.risk_score as ai_risk_score,
               ara.mitigation_recommendations
        FROM risks r
        LEFT JOIN ai_risk_assessments ara ON r.id = ara.risk_id
        WHERE r.id = ?
      `).bind(riskId).first();

      if (!risk) {
        throw new Error(`Risk ${riskId} not found`);
      }

      // Get threat intelligence context
      const threatContext = await this.getThreatIntelligenceContext(risk);

      // Generate framework mappings using AI
      const mappings = await this.generateComplianceMapping(risk, threatContext);

      // Store mappings in database
      await this.storeComplianceMappings(riskId, mappings);

      console.log(`✅ Mapped risk ${riskId} to ${mappings.length} control recommendations`);
      return mappings;

    } catch (error) {
      console.error('Error in auto-mapping risk to compliance:', error);
      throw error;
    }
  }

  /**
   * Assess control effectiveness using AI analysis
   */
  async assessControlEffectiveness(frameworkType: string): Promise<AIControlEffectivenessAssessment[]> {
    console.log(`🔍 Assessing control effectiveness for ${frameworkType}`);

    try {
      // Get existing controls for framework
      const controls = await this.db.prepare(`
        SELECT fc.*, cr.implementation_status, cr.effectiveness_rating
        FROM framework_controls fc
        LEFT JOIN control_implementations cr ON fc.id = cr.control_id
        WHERE fc.framework = ?
      `).bind(frameworkType).all();

      const assessments: AIControlEffectivenessAssessment[] = [];

      for (const control of controls.results || []) {
        // Get threat landscape that control should address
        const threatLandscape = await this.getRelevantThreatLandscape(control);

        // Generate AI assessment
        const assessment = await this.generateControlEffectivenessAssessment(
          control as any, 
          threatLandscape
        );
        
        assessments.push(assessment);

        // Store assessment in database
        await this.storeControlAssessment(assessment);
      }

      console.log(`✅ Assessed ${assessments.length} controls for ${frameworkType}`);
      return assessments;

    } catch (error) {
      console.error('Error assessing control effectiveness:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive GRC performance metrics with AI insights
   */
  async generateGRCPerformanceMetrics(): Promise<GRCPerformanceMetrics> {
    console.log('📊 Generating GRC performance metrics with AI insights');

    try {
      const [
        complianceScore,
        riskPostureData,
        controlAutomation,
        aiInsights,
        frameworkCoverage
      ] = await Promise.all([
        this.calculateComplianceScore(),
        this.calculateRiskPostureImprovement(),
        this.calculateControlAutomationRate(),
        this.getAIDrivenInsights(),
        this.calculateFrameworkCoverage()
      ]);

      const metrics: GRCPerformanceMetrics = {
        compliance_score: complianceScore,
        risk_posture_improvement: riskPostureData.improvement_percentage,
        control_automation_rate: controlAutomation,
        ai_driven_insights: aiInsights,
        framework_coverage: frameworkCoverage
      };

      // Store metrics for historical tracking
      await this.storeGRCMetrics(metrics);

      console.log('✅ Generated comprehensive GRC metrics');
      return metrics;

    } catch (error) {
      console.error('Error generating GRC metrics:', error);
      throw error;
    }
  }

  /**
   * Generate compliance mapping using AI analysis
   */
  private async generateComplianceMapping(
    risk: any, 
    threatContext: any
  ): Promise<ComplianceFrameworkMapping[]> {
    
    const mappingPrompt = `
    Analyze this risk and threat context to recommend relevant compliance controls:

    RISK DETAILS:
    - Title: ${risk.title}
    - Description: ${risk.description}
    - Category: ${risk.category}
    - Risk Score: ${risk.probability * risk.impact}/25
    - AI Risk Score: ${risk.ai_risk_score || 'N/A'}

    THREAT CONTEXT:
    ${JSON.stringify(threatContext, null, 2)}

    TASK: Map this risk to specific compliance framework controls.
    For each relevant control, provide:
    1. Framework (SOC2, ISO27001, NIST, PCI_DSS, GDPR, HIPAA)
    2. Control ID and name
    3. Relevance score (0-1)
    4. Implementation guidance
    5. Risk mitigation impact (0-1)

    Respond with a JSON array of control mappings.
    `;

    try {
      // Use advanced AI model for complex compliance mapping
      const response = await this.aiThreatService.executeAIAnalysis(
        'openai-gpt4', 
        mappingPrompt, 
        'compliance_mapping'
      );

      // Parse AI response to extract mappings
      const mappings = this.parseComplianceMappingResponse(response);
      return mappings;

    } catch (error) {
      console.warn('AI mapping failed, using fallback logic:', error);
      return this.generateFallbackMapping(risk);
    }
  }

  /**
   * Generate control effectiveness assessment using AI
   */
  private async generateControlEffectivenessAssessment(
    control: any,
    threatLandscape: any
  ): Promise<AIControlEffectivenessAssessment> {
    
    const assessmentPrompt = `
    Assess the effectiveness of this security control against current threat landscape:

    CONTROL:
    - Framework: ${control.framework}
    - Control ID: ${control.control_id}
    - Control Name: ${control.control_name}
    - Implementation Status: ${control.implementation_status}
    - Current Rating: ${control.effectiveness_rating}/5

    THREAT LANDSCAPE:
    ${JSON.stringify(threatLandscape, null, 2)}

    TASK: Provide comprehensive effectiveness assessment including:
    1. Current effectiveness score (0-1)
    2. Assessment reasoning
    3. Improvement recommendations
    4. Threat coverage gaps
    5. Automation opportunities
    6. Cost-benefit analysis

    Respond with detailed JSON assessment.
    `;

    try {
      const response = await this.aiThreatService.executeAIAnalysis(
        'openai-gpt4',
        assessmentPrompt,
        'control_effectiveness'
      );

      return this.parseControlAssessmentResponse(control, response);

    } catch (error) {
      console.warn('AI assessment failed, using fallback:', error);
      return this.generateFallbackAssessment(control);
    }
  }

  /**
   * Get threat intelligence context for risk mapping
   */
  private async getThreatIntelligenceContext(risk: any): Promise<any> {
    try {
      // Get related IOCs and threat indicators
      const relatedThreats = await this.db.prepare(`
        SELECT ti.*, tc.campaign_name, tc.threat_actor
        FROM threat_indicators ti
        LEFT JOIN threat_campaigns tc ON ti.campaign_id = tc.id
        WHERE ti.risk_category = ? OR ti.target_sector LIKE ?
        ORDER BY ti.last_seen DESC
        LIMIT 10
      `).bind(risk.category, `%${risk.business_context || ''}%`).all();

      // Get ML correlation insights
      const correlationInsights = await this.aimlIntegration.performLiveCorrelationAnalysis();

      return {
        related_threats: relatedThreats.results || [],
        correlation_clusters: correlationInsights.clusters || [],
        threat_predictions: correlationInsights.predictions || []
      };

    } catch (error) {
      console.warn('Error getting threat context:', error);
      return { related_threats: [], correlation_clusters: [], threat_predictions: [] };
    }
  }

  /**
   * Get relevant threat landscape for control assessment
   */
  private async getRelevantThreatLandscape(control: any): Promise<any> {
    try {
      // Get threats relevant to this control domain
      const domainThreats = await this.db.prepare(`
        SELECT ti.*, ba.anomaly_type, ba.severity_score
        FROM threat_indicators ti
        LEFT JOIN behavioral_anomalies ba ON ti.id = ba.indicator_id
        WHERE ti.mitre_technique LIKE ? OR ti.attack_vector LIKE ?
        ORDER BY ti.confidence_score DESC
        LIMIT 15
      `).bind(`%${control.control_category}%`, `%${control.control_category}%`).all();

      return {
        domain_threats: domainThreats.results || [],
        control_category: control.control_category,
        implementation_maturity: control.effectiveness_rating || 0
      };

    } catch (error) {
      console.warn('Error getting threat landscape:', error);
      return { domain_threats: [], control_category: control.control_category };
    }
  }

  /**
   * Parse AI compliance mapping response
   */
  private parseComplianceMappingResponse(response: any): ComplianceFrameworkMapping[] {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (Array.isArray(parsed)) {
        return parsed.map(mapping => ({
          framework: mapping.framework,
          control_id: mapping.control_id,
          control_name: mapping.control_name,
          control_category: mapping.control_category || 'General',
          relevance_score: Math.min(1, Math.max(0, mapping.relevance_score || 0.5)),
          ai_rationale: mapping.ai_rationale || 'AI-generated mapping',
          implementation_guidance: mapping.implementation_guidance || 'Standard implementation',
          risk_mitigation_impact: Math.min(1, Math.max(0, mapping.risk_mitigation_impact || 0.3))
        }));
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing compliance mapping:', error);
      return [];
    }
  }

  /**
   * Parse control effectiveness assessment response
   */
  private parseControlAssessmentResponse(control: any, response: any): AIControlEffectivenessAssessment {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      return {
        control_id: control.control_id,
        framework: control.framework,
        current_effectiveness: Math.min(1, Math.max(0, parsed.current_effectiveness || 0.5)),
        ai_assessment_reasoning: parsed.ai_assessment_reasoning || 'AI-generated assessment',
        improvement_recommendations: Array.isArray(parsed.improvement_recommendations) 
          ? parsed.improvement_recommendations 
          : ['Regular monitoring and updates recommended'],
        threat_coverage_gaps: Array.isArray(parsed.threat_coverage_gaps)
          ? parsed.threat_coverage_gaps
          : ['No specific gaps identified'],
        automation_opportunities: Array.isArray(parsed.automation_opportunities)
          ? parsed.automation_opportunities
          : ['Consider automation tools'],
        cost_benefit_analysis: {
          implementation_cost: parsed.cost_benefit_analysis?.implementation_cost || 'medium',
          risk_reduction_impact: Math.min(1, Math.max(0, parsed.cost_benefit_analysis?.risk_reduction_impact || 0.4)),
          roi_estimate: parsed.cost_benefit_analysis?.roi_estimate || 'Moderate ROI expected'
        }
      };
    } catch (error) {
      console.warn('Error parsing assessment response:', error);
      return this.generateFallbackAssessment(control);
    }
  }

  /**
   * Generate fallback compliance mapping when AI fails
   */
  private generateFallbackMapping(risk: any): ComplianceFrameworkMapping[] {
    const mappings: ComplianceFrameworkMapping[] = [];
    
    // Basic category-based mapping
    if (risk.category?.toLowerCase().includes('data')) {
      mappings.push({
        framework: 'GDPR',
        control_id: 'Art.32',
        control_name: 'Security of Processing',
        control_category: 'Data Protection',
        relevance_score: 0.8,
        ai_rationale: 'Data-related risk requires GDPR compliance',
        implementation_guidance: 'Implement appropriate technical and organizational measures',
        risk_mitigation_impact: 0.7
      });
    }

    if (risk.category?.toLowerCase().includes('access') || risk.category?.toLowerCase().includes('auth')) {
      mappings.push({
        framework: 'SOC2',
        control_id: 'CC6.1',
        control_name: 'Logical and Physical Access Controls',
        control_category: 'Access Control',
        relevance_score: 0.9,
        ai_rationale: 'Access control risk maps to SOC2 CC6.1',
        implementation_guidance: 'Implement multi-factor authentication and access reviews',
        risk_mitigation_impact: 0.8
      });
    }

    return mappings;
  }

  /**
   * Generate fallback control assessment when AI fails
   */
  private generateFallbackAssessment(control: any): AIControlEffectivenessAssessment {
    return {
      control_id: control.control_id,
      framework: control.framework,
      current_effectiveness: (control.effectiveness_rating || 3) / 5,
      ai_assessment_reasoning: 'Basic assessment based on implementation status',
      improvement_recommendations: ['Regular review and testing', 'Monitor effectiveness metrics'],
      threat_coverage_gaps: ['Assessment requires detailed analysis'],
      automation_opportunities: ['Consider automated monitoring tools'],
      cost_benefit_analysis: {
        implementation_cost: 'medium',
        risk_reduction_impact: 0.5,
        roi_estimate: 'Standard ROI for security controls'
      }
    };
  }

  /**
   * Calculate overall compliance score
   */
  private async calculateComplianceScore(): Promise<number> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_controls,
        SUM(CASE WHEN effectiveness_rating >= 4 THEN 1 ELSE 0 END) as effective_controls
      FROM control_implementations
      WHERE implementation_status != 'not_implemented'
    `).first();

    const total = Number(result?.total_controls) || 0;
    const effective = Number(result?.effective_controls) || 0;
    
    return total > 0 ? (effective / total) * 100 : 0;
  }

  /**
   * Calculate risk posture improvement
   */
  private async calculateRiskPostureImprovement(): Promise<{improvement_percentage: number}> {
    // Get current vs historical risk scores
    const currentScore = await this.db.prepare(`
      SELECT AVG(probability * impact) as avg_risk_score
      FROM risks 
      WHERE status = 'active' AND created_at >= date('now', '-30 days')
    `).first();

    const historicalScore = await this.db.prepare(`
      SELECT AVG(probability * impact) as avg_risk_score
      FROM risks 
      WHERE status = 'active' AND created_at < date('now', '-30 days')
    `).first();

    const current = Number(currentScore?.avg_risk_score) || 0;
    const historical = Number(historicalScore?.avg_risk_score) || current;
    
    const improvement = historical > 0 ? ((historical - current) / historical) * 100 : 0;
    
    return { improvement_percentage: improvement };
  }

  /**
   * Calculate control automation rate
   */
  private async calculateControlAutomationRate(): Promise<number> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_controls,
        SUM(CASE WHEN automation_status = 'automated' THEN 1 ELSE 0 END) as automated_controls
      FROM control_implementations
    `).first();

    const total = Number(result?.total_controls) || 0;
    const automated = Number(result?.automated_controls) || 0;
    
    return total > 0 ? automated / total : 0;
  }

  /**
   * Get AI-driven insights metrics
   */
  private async getAIDrivenInsights(): Promise<any> {
    const recommendations = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_recommendations,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_recommendations,
        AVG(confidence_score) as avg_confidence
      FROM ai_risk_assessments
      WHERE created_at >= date('now', '-30 days')
    `).first();

    return {
      total_recommendations: Number(recommendations?.total_recommendations) || 0,
      accepted_recommendations: Number(recommendations?.accepted_recommendations) || 0,
      false_positive_rate: 0.05, // Placeholder - would need feedback tracking
      accuracy_score: Number(recommendations?.avg_confidence) || 0.8
    };
  }

  /**
   * Calculate framework coverage
   */
  private async calculateFrameworkCoverage(): Promise<any[]> {
    const frameworks = ['SOC2', 'ISO27001', 'NIST', 'PCI_DSS', 'GDPR'];
    const coverage = [];

    for (const framework of frameworks) {
      const result = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_controls,
          SUM(CASE WHEN implementation_status != 'not_implemented' THEN 1 ELSE 0 END) as implemented_controls
        FROM framework_controls fc
        LEFT JOIN control_implementations ci ON fc.id = ci.control_id
        WHERE fc.framework = ?
      `).bind(framework).first();

      const total = Number(result?.total_controls) || 0;
      const implemented = Number(result?.implemented_controls) || 0;
      
      coverage.push({
        framework: framework,
        coverage_percentage: total > 0 ? (implemented / total) * 100 : 0,
        critical_gaps: [] // Would need additional analysis
      });
    }

    return coverage;
  }

  /**
   * Store compliance mappings in database
   */
  private async storeComplianceMappings(riskId: number, mappings: ComplianceFrameworkMapping[]): Promise<void> {
    for (const mapping of mappings) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO risk_compliance_mappings (
          risk_id, framework, control_id, control_name, relevance_score,
          ai_rationale, implementation_guidance, risk_mitigation_impact, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        riskId,
        mapping.framework,
        mapping.control_id,
        mapping.control_name,
        mapping.relevance_score,
        mapping.ai_rationale,
        mapping.implementation_guidance,
        mapping.risk_mitigation_impact,
        new Date().toISOString()
      ).run();
    }
  }

  /**
   * Store control assessment in database
   */
  private async storeControlAssessment(assessment: AIControlEffectivenessAssessment): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO ai_control_assessments (
        control_id, framework, current_effectiveness, ai_assessment_reasoning,
        improvement_recommendations, threat_coverage_gaps, automation_opportunities,
        cost_benefit_analysis, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assessment.control_id,
      assessment.framework,
      assessment.current_effectiveness,
      assessment.ai_assessment_reasoning,
      JSON.stringify(assessment.improvement_recommendations),
      JSON.stringify(assessment.threat_coverage_gaps),
      JSON.stringify(assessment.automation_opportunities),
      JSON.stringify(assessment.cost_benefit_analysis),
      new Date().toISOString()
    ).run();
  }

  /**
   * Store GRC metrics for historical tracking
   */
  private async storeGRCMetrics(metrics: GRCPerformanceMetrics): Promise<void> {
    await this.db.prepare(`
      INSERT INTO grc_performance_metrics (
        compliance_score, risk_posture_improvement, control_automation_rate,
        ai_driven_insights, framework_coverage, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      metrics.compliance_score,
      metrics.risk_posture_improvement,
      metrics.control_automation_rate,
      JSON.stringify(metrics.ai_driven_insights),
      JSON.stringify(metrics.framework_coverage),
      new Date().toISOString()
    ).run();
  }
}