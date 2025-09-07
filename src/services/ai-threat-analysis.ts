/**
 * AI Threat Analysis Service - Phase 2 Implementation
 * 
 * Advanced AI-driven threat intelligence analysis using multiple LLM models:
 * - Cloudflare Workers AI (Llama 3) - Primary cost-effective analysis
 * - OpenAI GPT-4 - Advanced reasoning for complex attribution
 * - Anthropic Claude - Fallback for detailed context analysis
 * 
 * Key capabilities:
 * - IOC enrichment and contextualization
 * - Threat campaign analysis and attribution
 * - AI-driven risk scoring and assessment
 * - Enhanced correlation and pattern recognition
 */

import { D1Database } from '@cloudflare/workers-types';

// Core interfaces for AI analysis
export interface IOCAnalysisRequest {
  ioc_id: string;
  ioc_type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'file_path' | 'registry_key';
  ioc_value: string;
  existing_context?: any;
  analysis_depth: 'basic' | 'detailed' | 'comprehensive';
}

export interface AIAnalysisResult {
  id: string;
  ioc_id: string;
  analysis_type: string;
  ai_model: string;
  confidence_score: number; // 0-1
  processing_time_ms: number;
  analysis_result: {
    threat_classification: 'benign' | 'suspicious' | 'malicious' | 'unknown';
    threat_family?: string;
    threat_actor?: string;
    campaign_attribution?: string;
    context_summary: string;
    technical_details: any;
    risk_factors: string[];
    mitigation_recommendations: string[];
    confidence_reasoning: string;
    attribution_evidence: string[];
  };
  created_at: string;
}

export interface ThreatCampaignAnalysis {
  campaign_id: string;
  campaign_name: string;
  attribution: {
    threat_actor: string;
    confidence: number;
    attribution_reasoning: string;
    evidence_strength: 'weak' | 'moderate' | 'strong';
  };
  timeline: {
    first_seen: string;
    last_seen: string;
    peak_activity?: string;
    activity_pattern: string;
  };
  infrastructure_analysis: {
    c2_servers: string[];
    hosting_patterns: string[];
    domain_patterns: string[];
    infrastructure_overlap: any[];
  };
  ttps: {
    mitre_techniques: string[];
    tactics: string[];
    tools_used: string[];
    delivery_methods: string[];
  };
  impact_assessment: {
    targeted_sectors: string[];
    geographic_focus: string[];
    potential_impact: 'low' | 'medium' | 'high' | 'critical';
    business_risk: string;
  };
}

export interface AIRiskAssessment {
  risk_id: number;
  threat_context: {
    threat_level: 'low' | 'medium' | 'high' | 'critical';
    attack_sophistication: number; // 1-10
    threat_persistence: number; // 1-10
    geographical_relevance: number; // 1-10
  };
  business_impact: {
    confidentiality_impact: number; // 1-10
    integrity_impact: number; // 1-10
    availability_impact: number; // 1-10
    financial_impact_estimate: string;
    operational_impact: string;
    reputational_impact: string;
  };
  contextual_factors: {
    industry_targeting: boolean;
    asset_exposure: number; // 1-10
    control_effectiveness: number; // 1-10
    threat_landscape_alignment: number; // 1-10
  };
  ai_risk_score: number; // 0-100
  confidence_level: 'low' | 'medium' | 'high';
  recommendations: {
    immediate_actions: string[];
    strategic_improvements: string[];
    monitoring_enhancements: string[];
    risk_treatment_options: string[];
  };
}

export interface AIModelConfiguration {
  primary_model: 'cloudflare-llama3';
  advanced_model: 'openai-gpt4';
  fallback_model: 'anthropic-claude';
  rate_limits: {
    cloudflare_rpm: number;
    openai_rpm: number;
    anthropic_rpm: number;
  };
  cost_optimization: {
    use_primary_for_basic: boolean;
    escalate_to_advanced: boolean;
    fallback_on_error: boolean;
  };
}

/**
 * AI Threat Analysis Service - Core Implementation
 */
export class AIThreatAnalysisService {
  private aiConfig: AIModelConfiguration;

  constructor(
    private db: D1Database,
    private env: any // Cloudflare environment with AI bindings and API keys
  ) {
    this.aiConfig = {
      primary_model: 'cloudflare-llama3',
      advanced_model: 'openai-gpt4',
      fallback_model: 'anthropic-claude',
      rate_limits: {
        cloudflare_rpm: 1000,
        openai_rpm: 100,
        anthropic_rpm: 50
      },
      cost_optimization: {
        use_primary_for_basic: true,
        escalate_to_advanced: true,
        fallback_on_error: true
      }
    };
  }

  /**
   * CORE AI ANALYSIS METHODS
   */

  /**
   * Analyze IOC using AI models for enrichment and contextualization
   */
  async analyzeIOCWithAI(request: IOCAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    console.log(`🤖 Starting AI analysis for IOC: ${request.ioc_value} (${request.ioc_type})`);

    try {
      // Step 1: Select appropriate AI model based on analysis depth
      const selectedModel = this.selectOptimalModel(request.analysis_depth);
      console.log(`🎯 Selected AI model: ${selectedModel} for ${request.analysis_depth} analysis`);

      // Step 2: Prepare analysis prompt
      const analysisPrompt = this.buildIOCAnalysisPrompt(request);

      // Step 3: Execute AI analysis
      const aiResponse = await this.executeAIAnalysis(selectedModel, analysisPrompt, request.ioc_type);

      // Step 4: Process and structure AI results  
      const analysisResult = this.processAIResponse(aiResponse, request);

      // Step 5: Store analysis results
      const analysis: AIAnalysisResult = {
        id: this.generateAnalysisId(),
        ioc_id: request.ioc_id,
        analysis_type: 'ioc_enrichment',
        ai_model: selectedModel,
        confidence_score: analysisResult.confidence_score,
        processing_time_ms: Date.now() - startTime,
        analysis_result: analysisResult,
        created_at: new Date().toISOString()
      };

      await this.storeAnalysisResult(analysis);

      // Step 6: Log processing metrics
      await this.logAIProcessingMetrics({
        operation_type: 'ioc_analysis',
        ai_model: selectedModel,
        processing_time_ms: analysis.processing_time_ms,
        token_usage: aiResponse.token_usage || 0,
        success: true,
        error_message: null
      });

      console.log(`✅ AI analysis completed for IOC ${request.ioc_value} with confidence ${analysisResult.confidence_score}`);
      return analysis;

    } catch (error) {
      console.error(`❌ AI analysis failed for IOC ${request.ioc_value}:`, error);

      // Log error metrics
      await this.logAIProcessingMetrics({
        operation_type: 'ioc_analysis', 
        ai_model: 'unknown',
        processing_time_ms: Date.now() - startTime,
        token_usage: 0,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform advanced threat campaign analysis using AI
   */
  async analyzeThreatCampaign(
    iocs: string[], 
    existingCampaignData?: any
  ): Promise<ThreatCampaignAnalysis> {
    const startTime = Date.now();
    console.log(`🎯 Starting AI campaign analysis for ${iocs.length} IOCs`);

    try {
      // Use advanced model for complex campaign attribution
      const campaignPrompt = this.buildCampaignAnalysisPrompt(iocs, existingCampaignData);
      const aiResponse = await this.executeAIAnalysis('openai-gpt4', campaignPrompt, 'campaign');

      const campaignAnalysis = this.processCampaignAnalysisResponse(aiResponse);

      // Store campaign analysis results
      await this.storeCampaignAnalysis(campaignAnalysis);

      console.log(`✅ Campaign analysis completed: ${campaignAnalysis.campaign_name}`);
      return campaignAnalysis;

    } catch (error) {
      console.error('❌ Campaign analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate AI-driven risk assessment for threats
   */
  async generateAIRiskAssessment(
    riskId: number,
    threatIntelligence: any,
    organizationalContext: any
  ): Promise<AIRiskAssessment> {
    const startTime = Date.now();
    console.log(`🎯 Generating AI risk assessment for risk ${riskId}`);

    try {
      // Build contextual risk assessment prompt
      const riskPrompt = this.buildRiskAssessmentPrompt(
        threatIntelligence, 
        organizationalContext
      );

      // Use advanced model for comprehensive risk assessment
      const aiResponse = await this.executeAIAnalysis('openai-gpt4', riskPrompt, 'risk_assessment');

      const riskAssessment = this.processRiskAssessmentResponse(aiResponse, riskId);

      // Store risk assessment
      await this.storeRiskAssessment(riskAssessment);

      console.log(`✅ AI risk assessment completed for risk ${riskId}, score: ${riskAssessment.ai_risk_score}`);
      return riskAssessment;

    } catch (error) {
      console.error(`❌ AI risk assessment failed for risk ${riskId}:`, error);
      throw error;
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  /**
   * Select optimal AI model based on analysis requirements
   */
  private selectOptimalModel(analysisDepth: string): string {
    switch (analysisDepth) {
      case 'basic':
        return this.aiConfig.primary_model;
      case 'detailed':
      case 'comprehensive':
        return this.aiConfig.advanced_model;
      default:
        return this.aiConfig.primary_model;
    }
  }

  /**
   * Build IOC analysis prompt for AI model
   */
  private buildIOCAnalysisPrompt(request: IOCAnalysisRequest): string {
    return `
You are an expert cybersecurity threat analyst. Analyze the following Indicator of Compromise (IOC) and provide a comprehensive threat intelligence assessment.

IOC Type: ${request.ioc_type}
IOC Value: ${request.ioc_value}
Analysis Depth: ${request.analysis_depth}
${request.existing_context ? `Existing Context: ${JSON.stringify(request.existing_context)}` : ''}

Please provide a structured analysis including:

1. THREAT CLASSIFICATION: Classify as benign, suspicious, malicious, or unknown
2. THREAT CONTEXT: Identify potential threat family, actor, campaign if applicable
3. TECHNICAL DETAILS: Provide relevant technical information about this IOC
4. RISK FACTORS: List specific risk factors and concerns
5. ATTRIBUTION: Any threat actor or campaign attribution with evidence
6. IMPACT ASSESSMENT: Potential impact if this threat is active
7. MITIGATION RECOMMENDATIONS: Specific actionable mitigation steps
8. CONFIDENCE ASSESSMENT: Your confidence level (0-1) and reasoning

Focus on accuracy and provide specific evidence for your assessments. If information is uncertain, clearly state limitations.

Respond in JSON format with the following structure:
{
  "threat_classification": "string",
  "threat_family": "string or null",
  "threat_actor": "string or null", 
  "campaign_attribution": "string or null",
  "context_summary": "string",
  "technical_details": {},
  "risk_factors": ["string"],
  "mitigation_recommendations": ["string"],
  "confidence_score": 0.0-1.0,
  "confidence_reasoning": "string",
  "attribution_evidence": ["string"]
}`;
  }

  /**
   * Build campaign analysis prompt for AI model
   */
  private buildCampaignAnalysisPrompt(iocs: string[], existingData?: any): string {
    return `
You are an expert cybersecurity threat analyst specializing in campaign attribution and threat actor profiling.

Analyze the following IOCs to identify potential threat campaigns and attribution:

IOCs: ${iocs.join(', ')}
${existingData ? `Existing Campaign Data: ${JSON.stringify(existingData)}` : ''}

Please provide a comprehensive threat campaign analysis including:

1. CAMPAIGN IDENTIFICATION: Name and identify the threat campaign
2. THREAT ACTOR ATTRIBUTION: Identify likely threat actors with confidence levels
3. TIMELINE ANALYSIS: Campaign timeline, activity patterns, evolution
4. INFRASTRUCTURE ANALYSIS: C2 servers, hosting patterns, domain analysis
5. TTPs MAPPING: MITRE ATT&CK techniques, tactics, tools used
6. TARGETING ANALYSIS: Sectors, geography, victim profiles
7. IMPACT ASSESSMENT: Potential business and operational impacts
8. ATTRIBUTION EVIDENCE: Specific evidence supporting attribution

Provide detailed reasoning and evidence for all assessments.

Respond in JSON format with structured campaign analysis data.`;
  }

  /**
   * Build risk assessment prompt for AI model
   */
  private buildRiskAssessmentPrompt(threatIntel: any, orgContext: any): string {
    return `
You are an expert risk analyst specializing in cybersecurity risk assessment and business impact analysis.

Threat Intelligence Data: ${JSON.stringify(threatIntel)}
Organizational Context: ${JSON.stringify(orgContext)}

Provide a comprehensive AI-driven risk assessment including:

1. THREAT CONTEXT: Sophistication, persistence, geographical relevance
2. BUSINESS IMPACT: Confidentiality, integrity, availability impacts
3. CONTEXTUAL FACTORS: Industry targeting, asset exposure, control effectiveness
4. QUANTITATIVE SCORING: Calculate overall AI risk score (0-100)
5. RECOMMENDATIONS: Immediate actions, strategic improvements, monitoring
6. CONFIDENCE ASSESSMENT: Assessment confidence with reasoning

Consider organizational context, threat landscape, and business criticality.

Respond in JSON format with structured risk assessment data.`;
  }

  /**
   * Execute AI analysis using selected model
   */
  private async executeAIAnalysis(
    model: string, 
    prompt: string, 
    analysisType: string
  ): Promise<any> {
    console.log(`🤖 Executing AI analysis with model: ${model}`);

    try {
      switch (model) {
        case 'cloudflare-llama3':
          return await this.executeCloudflareAI(prompt);
        case 'openai-gpt4':
          return await this.executeOpenAIAnalysis(prompt);
        case 'anthropic-claude':
          return await this.executeAnthropicAnalysis(prompt);
        default:
          throw new Error(`Unsupported AI model: ${model}`);
      }
    } catch (error) {
      console.error(`❌ AI execution failed with ${model}:`, error);

      // Try fallback model if configured
      if (this.aiConfig.cost_optimization.fallback_on_error && model !== this.aiConfig.fallback_model) {
        console.log(`🔄 Attempting fallback to ${this.aiConfig.fallback_model}`);
        return await this.executeAIAnalysis(this.aiConfig.fallback_model, prompt, analysisType);
      }

      throw error;
    }
  }

  /**
   * Execute Cloudflare Workers AI analysis
   */
  private async executeCloudflareAI(prompt: string): Promise<any> {
    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt: prompt,
        max_tokens: 2048,
        temperature: 0.3 // Lower temperature for more deterministic analysis
      });

      return {
        content: response.response,
        model: 'cloudflare-llama3',
        token_usage: response.token_usage || 0
      };
    } catch (error) {
      console.error('Cloudflare AI execution failed:', error);
      throw new Error(`Cloudflare AI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute OpenAI GPT-4 analysis  
   */
  private async executeOpenAIAnalysis(prompt: string): Promise<any> {
    if (!this.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert cybersecurity threat analyst. Provide accurate, structured analysis in JSON format.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: 2048,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model: 'openai-gpt4',
        token_usage: data.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('OpenAI execution failed:', error);
      throw new Error(`OpenAI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute Anthropic Claude analysis
   */
  private async executeAnthropicAnalysis(prompt: string): Promise<any> {
    if (!this.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2048,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        model: 'anthropic-claude',
        token_usage: data.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('Anthropic execution failed:', error);
      throw new Error(`Anthropic error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process AI response and extract structured data
   */
  private processAIResponse(aiResponse: any, request: IOCAnalysisRequest): any {
    try {
      // Try to parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(aiResponse.content);
      } catch (parseError) {
        // Fallback: extract key information from text response
        analysis = this.extractAnalysisFromText(aiResponse.content);
      }

      // Ensure all required fields are present with defaults
      return {
        threat_classification: analysis.threat_classification || 'unknown',
        threat_family: analysis.threat_family || null,
        threat_actor: analysis.threat_actor || null,
        campaign_attribution: analysis.campaign_attribution || null,
        context_summary: analysis.context_summary || 'AI analysis completed',
        technical_details: analysis.technical_details || {},
        risk_factors: Array.isArray(analysis.risk_factors) ? analysis.risk_factors : [],
        mitigation_recommendations: Array.isArray(analysis.mitigation_recommendations) ? analysis.mitigation_recommendations : [],
        confidence_score: typeof analysis.confidence_score === 'number' ? analysis.confidence_score : 0.5,
        confidence_reasoning: analysis.confidence_reasoning || 'Automated AI analysis',
        attribution_evidence: Array.isArray(analysis.attribution_evidence) ? analysis.attribution_evidence : []
      };
    } catch (error) {
      console.error('Error processing AI response:', error);
      
      // Return default analysis structure
      return {
        threat_classification: 'unknown',
        threat_family: null,
        threat_actor: null,
        campaign_attribution: null,
        context_summary: 'AI analysis failed to process response',
        technical_details: {},
        risk_factors: [],
        mitigation_recommendations: [],
        confidence_score: 0.1,
        confidence_reasoning: 'AI response processing failed',
        attribution_evidence: []
      };
    }
  }

  /**
   * Extract analysis data from text response (fallback)
   */
  private extractAnalysisFromText(textResponse: string): any {
    // Simple extraction logic for text responses
    const analysis = {
      threat_classification: 'unknown',
      context_summary: textResponse.substring(0, 500),
      confidence_score: 0.5,
      confidence_reasoning: 'Extracted from text response',
      risk_factors: [],
      mitigation_recommendations: []
    };

    // Extract threat classification
    if (textResponse.toLowerCase().includes('malicious')) {
      analysis.threat_classification = 'malicious';
    } else if (textResponse.toLowerCase().includes('suspicious')) {
      analysis.threat_classification = 'suspicious';
    } else if (textResponse.toLowerCase().includes('benign')) {
      analysis.threat_classification = 'benign';
    }

    return analysis;
  }

  /**
   * Store AI analysis results in database
   */
  private async storeAnalysisResult(analysis: AIAnalysisResult): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ai_threat_analyses (
          id, ioc_id, analysis_type, ai_model, analysis_result,
          confidence_score, processing_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        analysis.id,
        analysis.ioc_id,
        analysis.analysis_type,
        analysis.ai_model,
        JSON.stringify(analysis.analysis_result),
        analysis.confidence_score,
        analysis.processing_time_ms,
        analysis.created_at
      ).run();

      console.log(`💾 Stored AI analysis result: ${analysis.id}`);
    } catch (error) {
      console.error('Error storing analysis result:', error);
      throw new Error(`Failed to store analysis result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store campaign analysis results
   */
  private async storeCampaignAnalysis(analysis: ThreatCampaignAnalysis): Promise<void> {
    // Implementation for storing campaign analysis
    console.log('📊 Campaign analysis storage - to be implemented');
  }

  /**
   * Store risk assessment results
   */
  private async storeRiskAssessment(assessment: AIRiskAssessment): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ai_risk_assessments (
          risk_id, assessment_type, ai_analysis, risk_score,
          business_impact_score, mitigation_recommendations, 
          confidence_level, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        assessment.risk_id,
        'comprehensive',
        JSON.stringify(assessment),
        assessment.ai_risk_score,
        assessment.business_impact.confidentiality_impact + assessment.business_impact.integrity_impact + assessment.business_impact.availability_impact,
        JSON.stringify(assessment.recommendations),
        assessment.confidence_level,
        new Date().toISOString()
      ).run();

      console.log(`💾 Stored AI risk assessment for risk ${assessment.risk_id}`);
    } catch (error) {
      console.error('Error storing risk assessment:', error);
      throw error;
    }
  }

  /**
   * Log AI processing metrics for monitoring
   */
  private async logAIProcessingMetrics(metrics: {
    operation_type: string;
    ai_model: string;
    processing_time_ms: number;
    token_usage: number;
    success: boolean;
    error_message: string | null;
  }): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ai_processing_metrics (
          operation_type, ai_model, processing_time_ms,
          token_usage, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        metrics.operation_type,
        metrics.ai_model,
        metrics.processing_time_ms,
        metrics.token_usage,
        metrics.success,
        metrics.error_message,
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error('Error logging AI metrics:', error);
      // Don't throw - this is just logging
    }
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `ai_analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * PUBLIC QUERY METHODS
   */

  /**
   * Get AI analysis results for an IOC
   */
  async getIOCAnalysisResults(iocId: string): Promise<AIAnalysisResult[]> {
    const result = await this.db.prepare(`
      SELECT * FROM ai_threat_analyses 
      WHERE ioc_id = ? 
      ORDER BY created_at DESC
    `).bind(iocId).all();

    return (result.results || []).map(row => ({
      id: row.id as string,
      ioc_id: row.ioc_id as string,
      analysis_type: row.analysis_type as string,
      ai_model: row.ai_model as string,
      confidence_score: row.confidence_score as number,
      processing_time_ms: row.processing_time_ms as number,
      analysis_result: JSON.parse(row.analysis_result as string),
      created_at: row.created_at as string
    }));
  }

  /**
   * Get AI processing performance metrics
   */
  async getAIProcessingMetrics(timeframe: string = '24h'): Promise<any> {
    const result = await this.db.prepare(`
      SELECT 
        operation_type,
        ai_model,
        COUNT(*) as total_operations,
        AVG(processing_time_ms) as avg_processing_time,
        SUM(token_usage) as total_tokens,
        AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
      FROM ai_processing_metrics
      WHERE created_at >= datetime('now', '-1 day')
      GROUP BY operation_type, ai_model
      ORDER BY total_operations DESC
    `).all();

    return result.results || [];
  }

  /**
   * Process IOCs for AI enrichment in batch
   */
  async batchProcessIOCsForAIAnalysis(iocIds: string[]): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: AIAnalysisResult[];
  }> {
    console.log(`🚀 Starting batch AI processing for ${iocIds.length} IOCs`);
    
    const results: AIAnalysisResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const iocId of iocIds) {
      try {
        // Get IOC data from database
        const iocResult = await this.db.prepare(`
          SELECT id, type, value FROM iocs WHERE id = ?
        `).bind(iocId).first();

        if (!iocResult) {
          console.warn(`IOC ${iocId} not found, skipping`);
          failed++;
          continue;
        }

        // Create analysis request
        const request: IOCAnalysisRequest = {
          ioc_id: iocId,
          ioc_type: iocResult.type as any,
          ioc_value: iocResult.value as string,
          analysis_depth: 'detailed'
        };

        // Perform AI analysis
        const analysis = await this.analyzeIOCWithAI(request);
        results.push(analysis);
        successful++;

        console.log(`✅ AI analysis completed for IOC ${iocId}`);
      } catch (error) {
        console.error(`❌ AI analysis failed for IOC ${iocId}:`, error);
        failed++;
      }
    }

    console.log(`🏁 Batch AI processing completed: ${successful} successful, ${failed} failed`);
    
    return {
      processed: iocIds.length,
      successful,
      failed,
      results
    };
  }
}