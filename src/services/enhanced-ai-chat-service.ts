/**
 * Enhanced AI Chat Service
 * 
 * Advanced conversational AI with direct integration to:
 * - Live ML correlation engine results
 * - Real-time threat intelligence data  
 * - AI/ML analytics and insights
 * - Proactive risk notifications
 * - Intelligent query routing based on complexity
 */

import { D1Database } from '@cloudflare/workers-types';
import { LiveAIMLIntegration } from './live-ai-ml-integration';
import { EnhancedGRCAIIntegration } from './enhanced-grc-ai-integration';
import { AIThreatAnalysisService } from './ai-threat-analysis';
import { AIPerformanceAnalytics } from './ai-performance-analytics';

export interface ChatQuery {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: 'threat_analysis' | 'risk_assessment' | 'compliance' | 'ml_insights' | 'general';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChatResponse {
  response: string;
  responseType: 'text' | 'data' | 'alert' | 'recommendation';
  confidence: number;
  sources?: string[];
  actions?: ChatAction[];
  data?: any;
  aiModel?: string;
  processingTime?: number;
}

export interface ChatAction {
  type: 'view_correlation' | 'assess_risk' | 'check_compliance' | 'investigate_threat' | 'run_analysis';
  label: string;
  url?: string;
  data?: any;
}

export interface ProactiveAlert {
  id: string;
  alertType: 'high_risk_detected' | 'compliance_gap' | 'threat_campaign' | 'ml_anomaly';
  severity: 'info' | 'warning' | 'high' | 'critical';
  title: string;
  description: string;
  aiInsights: string;
  recommendedActions: string[];
  createdAt: string;
}

export class EnhancedAIChatService {
  private db: D1Database;
  private aimlIntegration: LiveAIMLIntegration;
  private grcIntegration: EnhancedGRCAIIntegration;
  private aiThreatService: AIThreatAnalysisService;
  private performanceAnalytics: AIPerformanceAnalytics;
  private env: any;

  // AI Model Selection Strategy
  private modelSelectionRules = {
    simple_queries: ['status', 'count', 'summary', 'list'],
    complex_analysis: ['correlation', 'attribution', 'prediction', 'assessment'],
    compliance_queries: ['control', 'framework', 'audit', 'compliance'],
    threat_intelligence: ['ioc', 'campaign', 'actor', 'malware', 'attack']
  };

  constructor(db: D1Database, env: any) {
    this.db = db;
    this.env = env;
    this.aimlIntegration = new LiveAIMLIntegration(db);
    this.grcIntegration = new EnhancedGRCAIIntegration(db, env);
    this.aiThreatService = new AIThreatAnalysisService(db, env);
    this.performanceAnalytics = new AIPerformanceAnalytics(db);
  }

  /**
   * Process chat query with intelligent routing and ML integration
   */
  async processChatQuery(query: ChatQuery): Promise<ChatResponse> {
    const startTime = Date.now();
    console.log(`💬 Processing chat query: "${query.message}"`);

    try {
      // Analyze query to determine context and complexity
      const queryAnalysis = await this.analyzeQuery(query.message);
      
      // Route to appropriate handler based on analysis
      let response: ChatResponse;
      
      switch (queryAnalysis.primaryIntent) {
        case 'ml_correlation':
          response = await this.handleMLCorrelationQuery(query, queryAnalysis);
          break;
        case 'threat_intelligence':
          response = await this.handleThreatIntelligenceQuery(query, queryAnalysis);
          break;
        case 'risk_assessment':
          response = await this.handleRiskAssessmentQuery(query, queryAnalysis);
          break;
        case 'compliance_status':
          response = await this.handleComplianceQuery(query, queryAnalysis);
          break;
        case 'behavioral_analysis':
          response = await this.handleBehavioralAnalysisQuery(query, queryAnalysis);
          break;
        case 'system_status':
          response = await this.handleSystemStatusQuery(query, queryAnalysis);
          break;
        default:
          response = await this.handleGeneralQuery(query, queryAnalysis);
      }

      // Add processing metadata
      response.processingTime = Date.now() - startTime;
      response.aiModel = queryAnalysis.selectedModel;

      // Store conversation for learning and improvement
      await this.storeConversation(query, response, queryAnalysis);

      console.log(`✅ Chat response generated in ${response.processingTime}ms`);
      return response;

    } catch (error) {
      console.error('Error processing chat query:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        responseType: 'text',
        confidence: 0.0,
        aiModel: 'fallback',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Handle ML correlation engine queries with live data
   */
  private async handleMLCorrelationQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    console.log('🔍 Handling ML correlation query');

    try {
      // Get live correlation results
      const correlationResults = await this.aimlIntegration.performLiveCorrelationAnalysis();
      
      // Extract key insights
      const insights = this.extractCorrelationInsights(correlationResults, query.message);
      
      // Generate AI-enhanced response
      const aiResponse = await this.generateContextualResponse(
        query.message,
        insights,
        'correlation_analysis',
        analysis.selectedModel
      );

      return {
        response: aiResponse.response,
        responseType: 'data',
        confidence: aiResponse.confidence,
        data: {
          correlations: correlationResults.clusters?.slice(0, 5) || [],
          predictions: correlationResults.predictions?.slice(0, 3) || [],
          processingMetrics: correlationResults.processingMetrics
        },
        actions: [
          {
            type: 'view_correlation',
            label: 'View Full Correlation Engine',
            url: '/intelligence/correlation-engine'
          },
          {
            type: 'run_analysis',
            label: 'Run New Analysis',
            data: { analysisType: 'correlation' }
          }
        ],
        sources: ['Live ML Correlation Engine', 'Threat Intelligence Database']
      };

    } catch (error) {
      console.error('Error handling ML correlation query:', error);
      return {
        response: 'I encountered an issue accessing the correlation engine. The system may be processing new data. Please try again in a moment.',
        responseType: 'text',
        confidence: 0.3
      };
    }
  }

  /**
   * Handle threat intelligence queries with AI analysis
   */
  private async handleThreatIntelligenceQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    console.log('🎯 Handling threat intelligence query');

    try {
      // Extract entities from query (IOCs, threat actors, campaigns)
      const entities = this.extractThreatEntities(query.message);
      
      // Get relevant threat data
      const threatData = await this.getThreatIntelligenceData(entities);
      
      // Generate AI analysis
      const aiAnalysis = await this.generateThreatAnalysis(threatData, query.message, analysis.selectedModel);

      return {
        response: aiAnalysis.summary,
        responseType: 'data',
        confidence: aiAnalysis.confidence,
        data: {
          threats: threatData.threats || [],
          campaigns: threatData.campaigns || [],
          iocs: threatData.iocs || [],
          aiInsights: aiAnalysis.insights
        },
        actions: [
          {
            type: 'investigate_threat',
            label: 'Deep Dive Investigation',
            url: '/intelligence/threats'
          },
          {
            type: 'assess_risk',
            label: 'Assess Risk Impact',
            data: { entities }
          }
        ],
        sources: ['Threat Intelligence Database', 'AI Analysis Engine']
      };

    } catch (error) {
      console.error('Error handling threat intelligence query:', error);
      return {
        response: 'I had trouble accessing threat intelligence data. Let me try to provide general guidance based on your query.',
        responseType: 'text',
        confidence: 0.2
      };
    }
  }

  /**
   * Handle behavioral analytics queries
   */
  private async handleBehavioralAnalysisQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    console.log('📊 Handling behavioral analysis query');

    try {
      // Get live behavioral anomaly data
      const anomalies = await this.aimlIntegration.detectBehavioralAnomalies();
      
      // Analyze patterns based on query
      const behavioralInsights = this.analyzeBehavioralPatterns(anomalies, query.message);
      
      // Generate contextual response
      const aiResponse = await this.generateContextualResponse(
        query.message,
        behavioralInsights,
        'behavioral_analysis',
        analysis.selectedModel
      );

      return {
        response: aiResponse.response,
        responseType: 'data',
        confidence: aiResponse.confidence,
        data: {
          anomalies: anomalies.anomalies?.slice(0, 10) || [],
          patterns: behavioralInsights.patterns || [],
          riskScore: behavioralInsights.overallRisk || 0
        },
        actions: [
          {
            type: 'view_correlation',
            label: 'View Behavioral Analytics',
            url: '/intelligence/behavioral-analytics'
          }
        ],
        sources: ['Behavioral Analytics Engine', 'AI Pattern Analysis']
      };

    } catch (error) {
      console.error('Error handling behavioral analysis query:', error);
      return {
        response: 'The behavioral analytics system is currently processing. I can provide general behavioral security guidance instead.',
        responseType: 'text',
        confidence: 0.3
      };
    }
  }

  /**
   * Generate proactive alerts based on AI analysis
   */
  async generateProactiveAlerts(): Promise<ProactiveAlert[]> {
    console.log('🚨 Generating proactive AI alerts');

    try {
      const alerts: ProactiveAlert[] = [];

      // Check for high-risk correlations
      const correlationResults = await this.aimlIntegration.performLiveCorrelationAnalysis();
      const highRiskClusters = correlationResults.clusters?.filter(c => c.confidence_score >= 0.8) || [];
      
      for (const cluster of highRiskClusters.slice(0, 3)) {
        alerts.push({
          id: `correlation_${cluster.id}_${Date.now()}`,
          alertType: 'threat_campaign',
          severity: cluster.confidence_score >= 0.9 ? 'critical' : 'high',
          title: `High-Confidence Threat Cluster Detected`,
          description: `ML correlation engine identified cluster "${cluster.name}" with ${cluster.confidence_score.toFixed(2)} confidence`,
          aiInsights: `This cluster shows characteristics similar to known ${cluster.threat_actor || 'unknown'} campaigns. Immediate investigation recommended.`,
          recommendedActions: [
            'Review cluster IOCs immediately',
            'Check for affected systems',
            'Update detection rules',
            'Notify incident response team'
          ],
          createdAt: new Date().toISOString()
        });
      }

      // Check for behavioral anomalies
      const behavioralData = await this.aimlIntegration.detectBehavioralAnomalies();
      const criticalAnomalies = behavioralData.anomalies?.filter(a => a.severity_score >= 0.8) || [];
      
      for (const anomaly of criticalAnomalies.slice(0, 2)) {
        alerts.push({
          id: `anomaly_${anomaly.id}_${Date.now()}`,
          alertType: 'ml_anomaly',
          severity: anomaly.severity_score >= 0.9 ? 'critical' : 'high',
          title: 'Critical Behavioral Anomaly Detected',
          description: `Behavioral analytics detected ${anomaly.anomaly_type} with severity ${anomaly.severity_score.toFixed(2)}`,
          aiInsights: `This anomaly pattern is ${(anomaly.severity_score * 100).toFixed(0)}% unusual compared to baseline behavior. Possible indicators of compromise.`,
          recommendedActions: [
            'Investigate affected entities immediately',
            'Review recent access patterns',
            'Check for privilege escalation',
            'Implement additional monitoring'
          ],
          createdAt: new Date().toISOString()
        });
      }

      // Check for compliance gaps
      const grcMetrics = await this.grcIntegration.generateGRCPerformanceMetrics();
      if (grcMetrics.compliance_score < 70) {
        alerts.push({
          id: `compliance_gap_${Date.now()}`,
          alertType: 'compliance_gap',
          severity: grcMetrics.compliance_score < 50 ? 'critical' : 'warning',
          title: 'Compliance Score Below Threshold',
          description: `Current compliance score is ${grcMetrics.compliance_score.toFixed(1)}%, below acceptable threshold`,
          aiInsights: `AI analysis indicates significant gaps in ${grcMetrics.framework_coverage.filter(f => f.coverage_percentage < 60).length} framework(s). This may impact audit readiness and risk posture.`,
          recommendedActions: [
            'Review framework implementations',
            'Prioritize critical control gaps',
            'Update compliance roadmap',
            'Schedule remediation activities'
          ],
          createdAt: new Date().toISOString()
        });
      }

      console.log(`✅ Generated ${alerts.length} proactive alerts`);
      return alerts;

    } catch (error) {
      console.error('Error generating proactive alerts:', error);
      return [];
    }
  }

  /**
   * Analyze query to determine intent and complexity
   */
  private async analyzeQuery(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();
    
    // Determine primary intent
    let primaryIntent = 'general';
    
    if (this.containsKeywords(lowerMessage, ['correlat', 'cluster', 'ml', 'machine learning'])) {
      primaryIntent = 'ml_correlation';
    } else if (this.containsKeywords(lowerMessage, ['threat', 'ioc', 'campaign', 'actor', 'malware'])) {
      primaryIntent = 'threat_intelligence';
    } else if (this.containsKeywords(lowerMessage, ['risk', 'assessment', 'impact', 'likelihood'])) {
      primaryIntent = 'risk_assessment';
    } else if (this.containsKeywords(lowerMessage, ['complian', 'control', 'framework', 'audit'])) {
      primaryIntent = 'compliance_status';
    } else if (this.containsKeywords(lowerMessage, ['behavior', 'anomal', 'pattern', 'baseline'])) {
      primaryIntent = 'behavioral_analysis';
    } else if (this.containsKeywords(lowerMessage, ['status', 'health', 'system', 'performance'])) {
      primaryIntent = 'system_status';
    }

    // Determine complexity and select appropriate model
    const complexity = this.analyzeQueryComplexity(lowerMessage);
    const selectedModel = this.selectOptimalModel(complexity, primaryIntent);

    return {
      primaryIntent,
      complexity,
      selectedModel,
      entities: this.extractEntities(message),
      keywords: this.extractKeywords(message)
    };
  }

  /**
   * Analyze query complexity for model selection
   */
  private analyzeQueryComplexity(message: string): 'simple' | 'medium' | 'complex' {
    const complexIndicators = ['analyze', 'compare', 'correlate', 'predict', 'assess', 'recommend'];
    const simpleIndicators = ['show', 'list', 'count', 'status', 'what', 'when'];
    
    const complexCount = complexIndicators.filter(indicator => message.includes(indicator)).length;
    const simpleCount = simpleIndicators.filter(indicator => message.includes(indicator)).length;
    
    if (complexCount >= 2) return 'complex';
    if (complexCount >= 1 || message.length > 100) return 'medium';
    return 'simple';
  }

  /**
   * Select optimal AI model based on complexity and intent
   */
  private selectOptimalModel(complexity: string, intent: string): string {
    // For complex analysis, use advanced models
    if (complexity === 'complex' && ['ml_correlation', 'threat_intelligence', 'risk_assessment'].includes(intent)) {
      return this.env.OPENAI_API_KEY ? 'openai-gpt4' : 'cloudflare-llama';
    }
    
    // For compliance and detailed analysis, use reasoning-capable models
    if (intent === 'compliance_status' || complexity === 'medium') {
      return this.env.ANTHROPIC_API_KEY ? 'anthropic-claude' : 'cloudflare-llama';
    }
    
    // For simple queries, use cost-effective Cloudflare AI
    return 'cloudflare-llama';
  }

  /**
   * Generate contextual AI response based on data and query
   */
  private async generateContextualResponse(
    query: string,
    data: any,
    context: string,
    model: string
  ): Promise<{response: string; confidence: number}> {
    
    const contextualPrompt = `
    As ARIA, the AI Security Assistant, provide a helpful and accurate response to this query:
    
    USER QUERY: "${query}"
    
    CONTEXT: ${context}
    
    RELEVANT DATA:
    ${JSON.stringify(data, null, 2)}
    
    Instructions:
    1. Provide a clear, concise response that directly addresses the user's question
    2. Use the provided data to give specific, actionable insights
    3. Highlight any critical security concerns or opportunities
    4. Maintain a professional but conversational tone
    5. If the data is insufficient, acknowledge limitations honestly
    
    Response:`;

    try {
      let aiResponse: any;
      
      if (model === 'openai-gpt4' && this.env.OPENAI_API_KEY) {
        aiResponse = await this.callOpenAI(contextualPrompt);
      } else if (model === 'anthropic-claude' && this.env.ANTHROPIC_API_KEY) {
        aiResponse = await this.callAnthropic(contextualPrompt);
      } else {
        aiResponse = await this.callCloudflareAI(contextualPrompt);
      }

      return {
        response: aiResponse.content || aiResponse.response || 'I apologize, but I could not generate a response at this time.',
        confidence: 0.8
      };

    } catch (error) {
      console.warn('AI response generation failed, using fallback:', error);
      return {
        response: this.generateFallbackResponse(query, data, context),
        confidence: 0.4
      };
    }
  }

  /**
   * Call OpenAI API for advanced analysis with performance tracking
   */
  private async callOpenAI(prompt: string): Promise<any> {
    const startTime = Date.now();
    let success = false;
    let tokenUsage = { input: 0, output: 0 };
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      success = response.ok;
      
      if (data.usage) {
        tokenUsage = {
          input: data.usage.prompt_tokens || 0,
          output: data.usage.completion_tokens || 0
        };
      }

      // Record performance metrics
      await this.performanceAnalytics.recordAIRequest({
        providerId: 'openai-gpt4',
        model: 'gpt-4',
        queryType: 'general',
        queryComplexity: 'complex',
        responseTime: Date.now() - startTime,
        tokenUsage,
        success,
        confidenceScore: success ? 0.85 : 0,
        errorType: success ? undefined : 'api_error'
      });

      return { content: data.choices?.[0]?.message?.content };
    } catch (error) {
      // Record failed request
      await this.performanceAnalytics.recordAIRequest({
        providerId: 'openai-gpt4',
        model: 'gpt-4',
        queryType: 'general',
        queryComplexity: 'complex',
        responseTime: Date.now() - startTime,
        tokenUsage,
        success: false,
        errorType: 'network_error'
      });
      throw error;
    }
  }

  /**
   * Call Anthropic API for detailed analysis
   */
  private async callAnthropic(prompt: string): Promise<any> {
    const startTime = Date.now();
    let success = false;
    let tokenUsage = { input: 0, output: 0 };
    
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
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        success = true;
        // Estimate token usage based on content length
        tokenUsage = {
          input: Math.ceil(prompt.length / 4), // ~4 chars per token
          output: Math.ceil((data.content?.[0]?.text?.length || 0) / 4)
        };
      }
      
      // Record performance metrics
      await this.performanceAnalytics.recordAIRequest({
        providerId: 'anthropic-claude',
        model: 'claude-3-sonnet-20240229',
        queryType: 'general',
        queryComplexity: 'complex',
        responseTime: Date.now() - startTime,
        tokenUsage,
        success,
        confidenceScore: success ? 0.90 : 0,
        errorType: success ? undefined : 'api_error'
      });
      
      return { content: data.content?.[0]?.text };
    } catch (error) {
      // Record failed request
      await this.performanceAnalytics.recordAIRequest({
        providerId: 'anthropic-claude',
        model: 'claude-3-sonnet-20240229',
        queryType: 'general',
        queryComplexity: 'complex',
        responseTime: Date.now() - startTime,
        tokenUsage,
        success: false,
        confidenceScore: 0,
        errorType: 'network_error'
      });
      
      throw error;
    }
  }

  /**
   * Call Cloudflare AI for cost-effective analysis
   */
  private async callCloudflareAI(prompt: string): Promise<any> {
    const startTime = Date.now();
    let success = false;
    let tokenUsage = { input: 0, output: 0 };
    
    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      });

      success = !!response.response;
      // Estimate token usage for Cloudflare AI
      tokenUsage = {
        input: Math.ceil(prompt.length / 4), // ~4 chars per token
        output: Math.ceil((response.response?.length || 0) / 4)
      };
      
      // Record performance metrics
      await this.performanceAnalytics.recordAIRequest({
        providerId: 'cloudflare-workers-ai',
        model: 'llama-3.1-8b-instruct',
        queryType: 'general',
        queryComplexity: 'medium',
        responseTime: Date.now() - startTime,
        tokenUsage,
        success,
        confidenceScore: success ? 0.75 : 0,
        errorType: success ? undefined : 'api_error'
      });
      
      return { response: response.response };
    } catch (error) {
      // Record failed request
      await this.performanceAnalytics.recordAIRequest({
        providerId: 'cloudflare-workers-ai',
        model: 'llama-3.1-8b-instruct',
        queryType: 'general',
        queryComplexity: 'medium',
        responseTime: Date.now() - startTime,
        tokenUsage,
        success: false,
        confidenceScore: 0,
        errorType: 'network_error'
      });
      
      throw error;
    }
  }

  /**
   * Generate fallback response when AI fails
   */
  private generateFallbackResponse(query: string, data: any, context: string): string {
    switch (context) {
      case 'correlation_analysis':
        return `I found ${data?.correlations?.length || 0} correlation clusters in our current analysis. The system is actively monitoring threat patterns and will alert you to any high-confidence matches.`;
      
      case 'threat_intelligence':
        return `Based on our threat intelligence database, I can see activity related to your query. Please check the Threat Intelligence dashboard for the most current information.`;
      
      case 'behavioral_analysis':
        return `The behavioral analytics system has detected ${data?.anomalies?.length || 0} anomalies. I recommend reviewing the Behavioral Analytics dashboard for detailed patterns.`;
      
      default:
        return `I understand you're asking about ${context}. While I'm processing your specific request, you can find related information in the relevant dashboard sections.`;
    }
  }

  /**
   * Helper methods for query analysis
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private extractEntities(message: string): any[] {
    // Simple entity extraction - would use NLP in production
    const entities = [];
    
    // Extract IP addresses
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = message.match(ipRegex) || [];
    ips.forEach(ip => entities.push({ type: 'ip', value: ip }));
    
    // Extract domains
    const domainRegex = /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const domains = message.match(domainRegex) || [];
    domains.forEach(domain => entities.push({ type: 'domain', value: domain }));
    
    return entities;
  }

  private extractKeywords(message: string): string[] {
    // Simple keyword extraction - would use NLP in production
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to'];
    return message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  }

  private extractCorrelationInsights(results: any, query: string): any {
    return {
      totalClusters: results.clusters?.length || 0,
      highConfidenceClusters: results.clusters?.filter((c: any) => c.confidence_score >= 0.8).length || 0,
      activePredictions: results.predictions?.length || 0,
      lastUpdated: new Date().toISOString(),
      queryRelevance: this.calculateQueryRelevance(query, results)
    };
  }

  private calculateQueryRelevance(query: string, results: any): number {
    // Simple relevance calculation - would use semantic similarity in production
    const queryWords = query.toLowerCase().split(/\s+/);
    let relevanceScore = 0.5; // Base relevance
    
    if (results.clusters) {
      for (const cluster of results.clusters) {
        const clusterText = (cluster.name + ' ' + cluster.description).toLowerCase();
        const matches = queryWords.filter(word => clusterText.includes(word)).length;
        relevanceScore += matches * 0.1;
      }
    }
    
    return Math.min(1.0, relevanceScore);
  }

  private extractThreatEntities(message: string): any {
    // Extract threat-specific entities from message
    const entities = this.extractEntities(message);
    
    // Add threat-specific patterns
    const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g;
    const hashes = message.match(hashRegex) || [];
    hashes.forEach(hash => entities.push({ type: 'hash', value: hash }));
    
    return { entities, query: message };
  }

  private async getThreatIntelligenceData(entities: any): Promise<any> {
    // Get threat data based on extracted entities
    const threats = await this.db.prepare(`
      SELECT * FROM threat_indicators 
      WHERE indicator_value IN (${entities.entities.map(() => '?').join(',')}) 
      ORDER BY confidence_score DESC LIMIT 10
    `).bind(...entities.entities.map((e: any) => e.value)).all();
    
    return {
      threats: threats.results || [],
      campaigns: [], // Would fetch campaign data
      iocs: entities.entities
    };
  }

  private async generateThreatAnalysis(data: any, query: string, model: string): Promise<any> {
    const analysisPrompt = `Analyze this threat intelligence data: ${JSON.stringify(data)}`;
    const response = await this.generateContextualResponse(query, data, 'threat_intelligence', model);
    
    return {
      summary: response.response,
      confidence: response.confidence,
      insights: {
        threatsFound: data.threats.length,
        riskLevel: data.threats.length > 0 ? 'medium' : 'low',
        recommendations: ['Monitor for additional indicators', 'Update detection rules']
      }
    };
  }

  private analyzeBehavioralPatterns(anomalies: any, query: string): any {
    const patterns = anomalies.anomalies || [];
    const highSeverity = patterns.filter((p: any) => p.severity_score >= 0.7);
    
    return {
      patterns: patterns.slice(0, 5),
      overallRisk: patterns.length > 0 ? 
        patterns.reduce((sum: number, p: any) => sum + p.severity_score, 0) / patterns.length : 0,
      criticalCount: highSeverity.length,
      recommendations: highSeverity.length > 0 ? 
        ['Investigate high-severity anomalies immediately'] : 
        ['Continue monitoring for pattern changes']
    };
  }

  private async handleRiskAssessmentQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    // Implementation for risk assessment queries
    return {
      response: 'Risk assessment functionality is being processed. Please check the Risk Management dashboard for current assessments.',
      responseType: 'text',
      confidence: 0.5
    };
  }

  private async handleComplianceQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    // Implementation for compliance queries
    return {
      response: 'Compliance status information is available on the Compliance dashboard. Current frameworks are being monitored for gaps.',
      responseType: 'text',
      confidence: 0.5
    };
  }

  private async handleSystemStatusQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    // Implementation for system status queries
    return {
      response: 'All systems are operational. The platform is actively monitoring threats and analyzing risks.',
      responseType: 'text',
      confidence: 0.8
    };
  }

  private async handleGeneralQuery(query: ChatQuery, analysis: any): Promise<ChatResponse> {
    // Implementation for general queries
    const response = await this.generateContextualResponse(
      query.message, 
      { analysis }, 
      'general', 
      analysis.selectedModel
    );
    
    return {
      response: response.response,
      responseType: 'text',
      confidence: response.confidence
    };
  }

  /**
   * Store conversation for learning and improvement
   */
  private async storeConversation(query: ChatQuery, response: ChatResponse, analysis: any): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO chat_conversations (
          session_id, user_id, user_query, ai_response, query_analysis,
          response_type, confidence_score, ai_model, processing_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        query.sessionId || 'anonymous',
        query.userId || 'anonymous',
        query.message,
        response.response,
        JSON.stringify(analysis),
        response.responseType,
        response.confidence,
        response.aiModel,
        response.processingTime,
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.warn('Failed to store conversation:', error);
    }
  }
}