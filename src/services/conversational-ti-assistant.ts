/**
 * ARIA5 Conversational Threat Intelligence Assistant
 * 
 * Phase 4.3: Interactive AI assistant for natural language threat intelligence queries
 * 
 * Features:
 * - Natural language query processing
 * - Context-aware threat intelligence responses
 * - Multi-turn conversation management
 * - Integration with TI data sources
 * - Intelligent query routing and response generation
 * - Conversational memory and context preservation
 * 
 * @author ARIA5 Security
 * @version 2.0.0
 */

import { AIContextualAnalysisEngine } from './ai-contextual-analysis-engine';
import { NLPThreatProcessingEngine } from './nlp-threat-processing-engine';
import { ThreatIntelligenceService } from './threat-intelligence';
import { 
  ThreatIndicator, 
  ThreatActor, 
  RiskAssessment,
  AnalysisResult 
} from '../types/threat-intelligence';

// Conversation Management Types
export interface ConversationContext {
  sessionId: string;
  userId: string;
  conversationHistory: ConversationTurn[];
  currentIntent: QueryIntent;
  contextualEntities: ExtractedEntity[];
  threadTopics: string[];
  lastQueryTimestamp: Date;
  preferredResponseFormat: ResponseFormat;
}

export interface ConversationTurn {
  turnId: string;
  timestamp: Date;
  userQuery: string;
  assistantResponse: string;
  confidence: number;
  queryIntent: QueryIntent;
  extractedEntities: ExtractedEntity[];
  responseTime: number;
  feedback?: UserFeedback;
}

export interface QueryIntent {
  primary: IntentType;
  secondary?: IntentType[];
  confidence: number;
  parameters: Record<string, any>;
}

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  context: string;
  linkedData?: any;
}

export interface UserFeedback {
  rating: number; // 1-5 scale
  comments?: string;
  timestamp: Date;
  helpful: boolean;
}

// Query and Response Types
export interface ThreatQuery {
  query: string;
  sessionId: string;
  userId: string;
  context?: Record<string, any>;
  preferredFormat?: ResponseFormat;
  maxResults?: number;
  includeRecommendations?: boolean;
}

export interface ThreatResponse {
  sessionId: string;
  responseId: string;
  response: string;
  confidence: number;
  intent: QueryIntent;
  data: ThreatResponseData;
  recommendations: string[];
  sources: string[];
  followUpSuggestions: string[];
  timestamp: Date;
  responseTime: number;
}

export interface ThreatResponseData {
  indicators?: ThreatIndicator[];
  threats?: ThreatActor[];
  risks?: RiskAssessment[];
  analysis?: AnalysisResult[];
  statistics?: Record<string, any>;
  visualizations?: VisualizationData[];
}

export interface VisualizationData {
  type: 'chart' | 'graph' | 'timeline' | 'heatmap' | 'network';
  title: string;
  data: any;
  config: Record<string, any>;
}

// Enums
export enum IntentType {
  // Query Types
  THREAT_LOOKUP = 'threat_lookup',
  INDICATOR_SEARCH = 'indicator_search',
  RISK_ASSESSMENT = 'risk_assessment',
  THREAT_ANALYSIS = 'threat_analysis',
  
  // Information Types
  THREAT_ACTOR_INFO = 'threat_actor_info',
  CAMPAIGN_INFO = 'campaign_info',
  TECHNIQUE_INFO = 'technique_info',
  VULNERABILITY_INFO = 'vulnerability_info',
  
  // Operational Types
  INCIDENT_INVESTIGATION = 'incident_investigation',
  HUNTING_GUIDANCE = 'hunting_guidance',
  MITIGATION_ADVICE = 'mitigation_advice',
  COMPLIANCE_CHECK = 'compliance_check',
  
  // Analytical Types
  TREND_ANALYSIS = 'trend_analysis',
  CORRELATION_ANALYSIS = 'correlation_analysis',
  PREDICTION_REQUEST = 'prediction_request',
  COMPARISON_REQUEST = 'comparison_request',
  
  // General Types
  GENERAL_QUESTION = 'general_question',
  CLARIFICATION = 'clarification',
  HELP_REQUEST = 'help_request'
}

export enum EntityType {
  IP_ADDRESS = 'ip_address',
  DOMAIN = 'domain',
  URL = 'url',
  FILE_HASH = 'file_hash',
  EMAIL = 'email',
  CVE = 'cve',
  THREAT_ACTOR = 'threat_actor',
  MALWARE = 'malware',
  TECHNIQUE = 'technique',
  CAMPAIGN = 'campaign',
  DATE_RANGE = 'date_range',
  ORGANIZATION = 'organization',
  INDUSTRY = 'industry',
  COUNTRY = 'country'
}

export enum ResponseFormat {
  CONVERSATIONAL = 'conversational',
  STRUCTURED = 'structured',
  TECHNICAL = 'technical',
  EXECUTIVE = 'executive',
  JSON = 'json'
}

/**
 * Conversational Threat Intelligence Assistant
 * 
 * Provides natural language interface for threat intelligence queries
 * with context-aware responses and conversation management
 */
export class ConversationalTIAssistant {
  private aiEngine: AIContextualAnalysisEngine;
  private nlpEngine: NLPThreatProcessingEngine;
  private tiService: ThreatIntelligenceService;
  private conversationSessions: Map<string, ConversationContext>;
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;
  private responseGenerator: ResponseGenerator;

  constructor(
    aiEngine: AIContextualAnalysisEngine,
    nlpEngine: NLPThreatProcessingEngine,
    tiService: ThreatIntelligenceService
  ) {
    this.aiEngine = aiEngine;
    this.nlpEngine = nlpEngine;
    this.tiService = tiService;
    this.conversationSessions = new Map();
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.responseGenerator = new ResponseGenerator(aiEngine);
  }

  /**
   * Process natural language threat intelligence query
   */
  async processQuery(query: ThreatQuery): Promise<ThreatResponse> {
    const startTime = Date.now();
    
    try {
      // Get or create conversation context
      const context = this.getOrCreateContext(query.sessionId, query.userId);
      
      // Extract intent and entities from query
      const intent = await this.intentClassifier.classifyIntent(query.query, context);
      const entities = await this.entityExtractor.extractEntities(query.query, context);
      
      // Update conversation context
      context.currentIntent = intent;
      context.contextualEntities = entities;
      context.lastQueryTimestamp = new Date();
      
      // Route query to appropriate handler
      const responseData = await this.routeQuery(intent, entities, query, context);
      
      // Generate conversational response
      const response = await this.responseGenerator.generateResponse(
        query,
        intent,
        entities,
        responseData,
        context
      );
      
      // Record conversation turn
      const turn: ConversationTurn = {
        turnId: this.generateTurnId(),
        timestamp: new Date(),
        userQuery: query.query,
        assistantResponse: response.response,
        confidence: response.confidence,
        queryIntent: intent,
        extractedEntities: entities,
        responseTime: Date.now() - startTime
      };
      
      context.conversationHistory.push(turn);
      
      // Generate follow-up suggestions
      response.followUpSuggestions = await this.generateFollowUpSuggestions(
        intent, entities, responseData, context
      );
      
      response.responseTime = Date.now() - startTime;
      
      return response;
      
    } catch (error) {
      console.error('Error processing conversational query:', error);
      
      return {
        sessionId: query.sessionId,
        responseId: this.generateResponseId(),
        response: "I apologize, but I encountered an error processing your query. Please try rephrasing your question or contact support if the issue persists.",
        confidence: 0,
        intent: { primary: IntentType.GENERAL_QUESTION, confidence: 0, parameters: {} },
        data: {},
        recommendations: [],
        sources: [],
        followUpSuggestions: [],
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Route query to appropriate handler based on intent
   */
  private async routeQuery(
    intent: QueryIntent,
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    switch (intent.primary) {
      case IntentType.THREAT_LOOKUP:
        return await this.handleThreatLookup(entities, query, context);
        
      case IntentType.INDICATOR_SEARCH:
        return await this.handleIndicatorSearch(entities, query, context);
        
      case IntentType.RISK_ASSESSMENT:
        return await this.handleRiskAssessment(entities, query, context);
        
      case IntentType.THREAT_ANALYSIS:
        return await this.handleThreatAnalysis(entities, query, context);
        
      case IntentType.THREAT_ACTOR_INFO:
        return await this.handleThreatActorInfo(entities, query, context);
        
      case IntentType.VULNERABILITY_INFO:
        return await this.handleVulnerabilityInfo(entities, query, context);
        
      case IntentType.INCIDENT_INVESTIGATION:
        return await this.handleIncidentInvestigation(entities, query, context);
        
      case IntentType.HUNTING_GUIDANCE:
        return await this.handleHuntingGuidance(entities, query, context);
        
      case IntentType.MITIGATION_ADVICE:
        return await this.handleMitigationAdvice(entities, query, context);
        
      case IntentType.TREND_ANALYSIS:
        return await this.handleTrendAnalysis(entities, query, context);
        
      case IntentType.CORRELATION_ANALYSIS:
        return await this.handleCorrelationAnalysis(entities, query, context);
        
      case IntentType.PREDICTION_REQUEST:
        return await this.handlePredictionRequest(entities, query, context);
        
      default:
        return await this.handleGeneralQuery(entities, query, context);
    }
  }

  /**
   * Handle threat lookup queries
   */
  private async handleThreatLookup(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const indicators: ThreatIndicator[] = [];
    const threats: ThreatActor[] = [];
    
    // Extract IOCs from entities
    const iocEntities = entities.filter(e => 
      [EntityType.IP_ADDRESS, EntityType.DOMAIN, EntityType.URL, 
       EntityType.FILE_HASH, EntityType.EMAIL].includes(e.type)
    );
    
    for (const entity of iocEntities) {
      try {
        // Look up threat indicators
        const indicator = await this.tiService.lookupIndicator(entity.value, entity.type);
        if (indicator) {
          indicators.push(indicator);
        }
      } catch (error) {
        console.error(`Error looking up indicator ${entity.value}:`, error);
      }
    }
    
    // Extract threat actor entities
    const actorEntities = entities.filter(e => 
      [EntityType.THREAT_ACTOR, EntityType.MALWARE, EntityType.CAMPAIGN].includes(e.type)
    );
    
    for (const entity of actorEntities) {
      try {
        const actor = await this.tiService.getThreatActorInfo(entity.value);
        if (actor) {
          threats.push(actor);
        }
      } catch (error) {
        console.error(`Error looking up threat actor ${entity.value}:`, error);
      }
    }
    
    return {
      indicators,
      threats,
      statistics: {
        totalIndicators: indicators.length,
        totalThreats: threats.length,
        highRiskIndicators: indicators.filter(i => i.riskScore > 80).length
      }
    };
  }

  /**
   * Handle indicator search queries
   */
  private async handleIndicatorSearch(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const searchCriteria = this.extractSearchCriteria(entities, query);
    const indicators = await this.tiService.searchIndicators(searchCriteria);
    
    // Generate analysis of results
    const analysis = await this.aiEngine.executeContextualAnalysis({
      type: 'indicator_search',
      data: indicators,
      query: query.query,
      context: 'threat_intelligence_search'
    });
    
    return {
      indicators,
      analysis: [analysis],
      statistics: {
        totalFound: indicators.length,
        byType: this.groupIndicatorsByType(indicators),
        byRiskLevel: this.groupIndicatorsByRisk(indicators)
      }
    };
  }

  /**
   * Handle risk assessment queries
   */
  private async handleRiskAssessment(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const assets = this.extractAssetEntities(entities);
    const threats = this.extractThreatEntities(entities);
    
    const risks: RiskAssessment[] = [];
    
    for (const asset of assets) {
      for (const threat of threats) {
        const risk = await this.tiService.assessRisk(asset, threat);
        if (risk) {
          risks.push(risk);
        }
      }
    }
    
    // Generate risk recommendations
    const recommendations = await this.generateRiskRecommendations(risks);
    
    return {
      risks,
      statistics: {
        totalRisks: risks.length,
        highRisks: risks.filter(r => r.riskLevel === 'HIGH').length,
        mediumRisks: risks.filter(r => r.riskLevel === 'MEDIUM').length,
        lowRisks: risks.filter(r => r.riskLevel === 'LOW').length
      }
    };
  }

  /**
   * Handle threat analysis queries
   */
  private async handleThreatAnalysis(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    // Perform comprehensive threat analysis
    const analysisResults = await this.tiService.executeComprehensiveAnalysis({
      entities: entities.map(e => e.value),
      analysisDepth: 'comprehensive',
      includeCorrelation: true,
      includeBehavioral: true,
      includeRiskScoring: true
    });
    
    // Generate contextual insights
    const contextualAnalysis = await this.aiEngine.executeContextualAnalysis({
      type: 'threat_analysis',
      data: analysisResults,
      query: query.query,
      context: 'comprehensive_threat_analysis'
    });
    
    return {
      analysis: [contextualAnalysis, ...analysisResults.correlationResults],
      indicators: analysisResults.enrichedIndicators,
      risks: analysisResults.riskAssessments,
      statistics: {
        totalIndicators: analysisResults.enrichedIndicators.length,
        correlationMatches: analysisResults.correlationResults.length,
        riskScore: analysisResults.overallRiskScore
      }
    };
  }

  /**
   * Handle threat actor information queries
   */
  private async handleThreatActorInfo(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const actorEntities = entities.filter(e => 
      [EntityType.THREAT_ACTOR, EntityType.MALWARE, EntityType.CAMPAIGN].includes(e.type)
    );
    
    const threats: ThreatActor[] = [];
    
    for (const entity of actorEntities) {
      const actor = await this.tiService.getThreatActorInfo(entity.value);
      if (actor) {
        threats.push(actor);
      }
    }
    
    // Generate detailed actor profiles
    const analysis = await this.aiEngine.executeContextualAnalysis({
      type: 'threat_actor_profile',
      data: threats,
      query: query.query,
      context: 'threat_actor_intelligence'
    });
    
    return {
      threats,
      analysis: [analysis],
      statistics: {
        totalActors: threats.length,
        activeCampaigns: threats.reduce((sum, t) => sum + (t.activeCampaigns?.length || 0), 0),
        ttps: threats.reduce((sum, t) => sum + (t.techniques?.length || 0), 0)
      }
    };
  }

  /**
   * Handle vulnerability information queries
   */
  private async handleVulnerabilityInfo(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const cveEntities = entities.filter(e => e.type === EntityType.CVE);
    const vulnerabilities: any[] = [];
    
    for (const entity of cveEntities) {
      try {
        const vuln = await this.tiService.getVulnerabilityInfo(entity.value);
        if (vuln) {
          vulnerabilities.push(vuln);
        }
      } catch (error) {
        console.error(`Error fetching vulnerability ${entity.value}:`, error);
      }
    }
    
    // Generate vulnerability analysis
    const analysis = await this.aiEngine.executeContextualAnalysis({
      type: 'vulnerability_analysis',
      data: vulnerabilities,
      query: query.query,
      context: 'vulnerability_intelligence'
    });
    
    return {
      analysis: [analysis],
      statistics: {
        totalVulnerabilities: vulnerabilities.length,
        criticalSeverity: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        highSeverity: vulnerabilities.filter(v => v.severity === 'HIGH').length,
        avgCVSSScore: vulnerabilities.reduce((sum, v) => sum + (v.cvssScore || 0), 0) / vulnerabilities.length
      }
    };
  }

  /**
   * Handle incident investigation queries
   */
  private async handleIncidentInvestigation(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    // Extract investigation context
    const iocs = entities.filter(e => 
      [EntityType.IP_ADDRESS, EntityType.DOMAIN, EntityType.URL, 
       EntityType.FILE_HASH, EntityType.EMAIL].includes(e.type)
    );
    
    // Perform IOC enrichment and correlation
    const enrichedIndicators: ThreatIndicator[] = [];
    for (const ioc of iocs) {
      const indicator = await this.tiService.lookupIndicator(ioc.value, ioc.type);
      if (indicator) {
        enrichedIndicators.push(indicator);
      }
    }
    
    // Generate investigation guidance
    const investigationGuidance = await this.aiEngine.executeContextualAnalysis({
      type: 'incident_investigation',
      data: { iocs: enrichedIndicators, query: query.query },
      query: `Provide incident investigation guidance for: ${query.query}`,
      context: 'security_incident_response'
    });
    
    return {
      indicators: enrichedIndicators,
      analysis: [investigationGuidance],
      recommendations: await this.generateInvestigationRecommendations(enrichedIndicators)
    };
  }

  /**
   * Handle hunting guidance queries
   */
  private async handleHuntingGuidance(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    // Generate hunting hypotheses and guidance
    const huntingGuidance = await this.aiEngine.executeContextualAnalysis({
      type: 'threat_hunting_guidance',
      data: entities,
      query: query.query,
      context: 'proactive_threat_hunting'
    });
    
    return {
      analysis: [huntingGuidance],
      recommendations: await this.generateHuntingRecommendations(entities, query)
    };
  }

  /**
   * Handle mitigation advice queries
   */
  private async handleMitigationAdvice(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    // Generate mitigation strategies
    const mitigationAdvice = await this.aiEngine.executeContextualAnalysis({
      type: 'mitigation_guidance',
      data: entities,
      query: query.query,
      context: 'security_mitigation_strategies'
    });
    
    return {
      analysis: [mitigationAdvice],
      recommendations: await this.generateMitigationRecommendations(entities, query)
    };
  }

  /**
   * Handle trend analysis queries
   */
  private async handleTrendAnalysis(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const dateRange = this.extractDateRange(entities);
    const trendData = await this.tiService.getTrendAnalysis(dateRange);
    
    const trendAnalysis = await this.aiEngine.executeContextualAnalysis({
      type: 'trend_analysis',
      data: trendData,
      query: query.query,
      context: 'threat_landscape_trends'
    });
    
    return {
      analysis: [trendAnalysis],
      statistics: trendData,
      visualizations: await this.generateTrendVisualizations(trendData)
    };
  }

  /**
   * Handle correlation analysis queries
   */
  private async handleCorrelationAnalysis(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const correlationResults = await this.tiService.executeAdvancedCorrelationAnalysis({
      entities: entities.map(e => e.value),
      correlationTypes: ['infrastructure', 'behavioral', 'temporal', 'attribution'],
      timeWindow: '30d'
    });
    
    return {
      analysis: correlationResults.correlationResults,
      indicators: correlationResults.enrichedIndicators,
      statistics: {
        correlationMatches: correlationResults.correlationResults.length,
        confidenceScore: correlationResults.overallConfidence
      }
    };
  }

  /**
   * Handle prediction request queries
   */
  private async handlePredictionRequest(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    // Generate predictive analysis
    const prediction = await this.aiEngine.executeContextualAnalysis({
      type: 'predictive_analysis',
      data: entities,
      query: query.query,
      context: 'threat_prediction_modeling'
    });
    
    return {
      analysis: [prediction],
      recommendations: await this.generatePredictiveRecommendations(entities, query)
    };
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(
    entities: ExtractedEntity[],
    query: ThreatQuery,
    context: ConversationContext
  ): Promise<ThreatResponseData> {
    
    const generalResponse = await this.aiEngine.executeContextualAnalysis({
      type: 'general_threat_intelligence',
      data: entities,
      query: query.query,
      context: 'general_cybersecurity_consultation'
    });
    
    return {
      analysis: [generalResponse]
    };
  }

  /**
   * Generate follow-up suggestions
   */
  private async generateFollowUpSuggestions(
    intent: QueryIntent,
    entities: ExtractedEntity[],
    responseData: ThreatResponseData,
    context: ConversationContext
  ): Promise<string[]> {
    
    const suggestions: string[] = [];
    
    // Intent-based suggestions
    switch (intent.primary) {
      case IntentType.THREAT_LOOKUP:
        if (responseData.indicators && responseData.indicators.length > 0) {
          suggestions.push("Would you like to see correlation analysis for these indicators?");
          suggestions.push("Should I check for related threat campaigns?");
          suggestions.push("Do you want mitigation recommendations for these threats?");
        }
        break;
        
      case IntentType.RISK_ASSESSMENT:
        suggestions.push("Would you like to see trend analysis for these risks?");
        suggestions.push("Should I provide mitigation strategies?");
        suggestions.push("Do you want to explore threat hunting opportunities?");
        break;
        
      case IntentType.INCIDENT_INVESTIGATION:
        suggestions.push("Would you like hunting queries for these indicators?");
        suggestions.push("Should I search for similar historical incidents?");
        suggestions.push("Do you want attribution analysis for this activity?");
        break;
    }
    
    // Entity-based suggestions
    const hasIOCs = entities.some(e => 
      [EntityType.IP_ADDRESS, EntityType.DOMAIN, EntityType.URL, 
       EntityType.FILE_HASH].includes(e.type)
    );
    
    if (hasIOCs && !suggestions.length) {
      suggestions.push("Would you like to pivot on related infrastructure?");
      suggestions.push("Should I check reputation scores for these indicators?");
    }
    
    // Conversation history based suggestions
    if (context.conversationHistory.length > 1) {
      const recentIntents = context.conversationHistory
        .slice(-3)
        .map(turn => turn.queryIntent.primary);
        
      if (!recentIntents.includes(IntentType.TREND_ANALYSIS)) {
        suggestions.push("Would you like to see recent trends for this topic?");
      }
    }
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Get or create conversation context
   */
  private getOrCreateContext(sessionId: string, userId: string): ConversationContext {
    if (!this.conversationSessions.has(sessionId)) {
      const context: ConversationContext = {
        sessionId,
        userId,
        conversationHistory: [],
        currentIntent: { primary: IntentType.GENERAL_QUESTION, confidence: 0, parameters: {} },
        contextualEntities: [],
        threadTopics: [],
        lastQueryTimestamp: new Date(),
        preferredResponseFormat: ResponseFormat.CONVERSATIONAL
      };
      this.conversationSessions.set(sessionId, context);
    }
    return this.conversationSessions.get(sessionId)!;
  }

  /**
   * Provide user feedback on response
   */
  async provideFeedback(
    sessionId: string,
    turnId: string,
    feedback: UserFeedback
  ): Promise<void> {
    const context = this.conversationSessions.get(sessionId);
    if (context) {
      const turn = context.conversationHistory.find(t => t.turnId === turnId);
      if (turn) {
        turn.feedback = feedback;
      }
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ConversationTurn[] {
    const context = this.conversationSessions.get(sessionId);
    return context ? context.conversationHistory : [];
  }

  /**
   * Clear conversation session
   */
  clearSession(sessionId: string): void {
    this.conversationSessions.delete(sessionId);
  }

  // Helper methods for data extraction and processing
  private extractSearchCriteria(entities: ExtractedEntity[], query: ThreatQuery): any {
    return {
      entities: entities.map(e => ({ type: e.type, value: e.value })),
      query: query.query,
      maxResults: query.maxResults || 100
    };
  }

  private groupIndicatorsByType(indicators: ThreatIndicator[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const indicator of indicators) {
      groups[indicator.type] = (groups[indicator.type] || 0) + 1;
    }
    return groups;
  }

  private groupIndicatorsByRisk(indicators: ThreatIndicator[]): Record<string, number> {
    const groups: Record<string, number> = { high: 0, medium: 0, low: 0 };
    for (const indicator of indicators) {
      if (indicator.riskScore > 80) groups.high++;
      else if (indicator.riskScore > 50) groups.medium++;
      else groups.low++;
    }
    return groups;
  }

  private extractAssetEntities(entities: ExtractedEntity[]): string[] {
    return entities
      .filter(e => [EntityType.IP_ADDRESS, EntityType.DOMAIN, EntityType.ORGANIZATION].includes(e.type))
      .map(e => e.value);
  }

  private extractThreatEntities(entities: ExtractedEntity[]): string[] {
    return entities
      .filter(e => [EntityType.THREAT_ACTOR, EntityType.MALWARE, EntityType.TECHNIQUE].includes(e.type))
      .map(e => e.value);
  }

  private extractDateRange(entities: ExtractedEntity[]): { start: Date; end: Date } {
    const dateEntity = entities.find(e => e.type === EntityType.DATE_RANGE);
    if (dateEntity && dateEntity.linkedData) {
      return dateEntity.linkedData;
    }
    // Default to last 30 days
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private async generateRiskRecommendations(risks: RiskAssessment[]): Promise<string[]> {
    // Implementation for risk recommendations
    return ["Implement additional monitoring", "Update security controls", "Review access policies"];
  }

  private async generateInvestigationRecommendations(indicators: ThreatIndicator[]): Promise<string[]> {
    // Implementation for investigation recommendations
    return ["Check network logs", "Analyze endpoint activity", "Review authentication events"];
  }

  private async generateHuntingRecommendations(entities: ExtractedEntity[], query: ThreatQuery): Promise<string[]> {
    // Implementation for hunting recommendations
    return ["Search for similar patterns", "Check for persistence mechanisms", "Analyze lateral movement"];
  }

  private async generateMitigationRecommendations(entities: ExtractedEntity[], query: ThreatQuery): Promise<string[]> {
    // Implementation for mitigation recommendations
    return ["Block malicious IPs", "Update signatures", "Implement compensating controls"];
  }

  private async generatePredictiveRecommendations(entities: ExtractedEntity[], query: ThreatQuery): Promise<string[]> {
    // Implementation for predictive recommendations
    return ["Monitor for emerging threats", "Prepare incident response", "Update threat models"];
  }

  private async generateTrendVisualizations(trendData: any): Promise<VisualizationData[]> {
    // Implementation for trend visualizations
    return [{
      type: 'chart',
      title: 'Threat Trends',
      data: trendData,
      config: { chartType: 'line', timeAxis: true }
    }];
  }

  private generateTurnId(): string {
    return `turn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Intent Classification Engine
 */
class IntentClassifier {
  async classifyIntent(query: string, context: ConversationContext): Promise<QueryIntent> {
    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for intent classification
    const patterns = {
      [IntentType.THREAT_LOOKUP]: [
        /look\s*up|search\s*for|find|check|what\s*is/i,
        /ip|domain|hash|url|email/i
      ],
      [IntentType.INDICATOR_SEARCH]: [
        /indicators?|iocs?|compromised?/i,
        /search|find|list|show/i
      ],
      [IntentType.RISK_ASSESSMENT]: [
        /risk|assess|evaluate|impact|likelihood/i
      ],
      [IntentType.THREAT_ANALYSIS]: [
        /analyz|correlat|investigat|deep\s*dive/i
      ],
      [IntentType.THREAT_ACTOR_INFO]: [
        /actor|group|apt|campaign|attribution/i
      ],
      [IntentType.VULNERABILITY_INFO]: [
        /cve|vulnerability|vuln|exploit/i
      ],
      [IntentType.INCIDENT_INVESTIGATION]: [
        /incident|breach|compromise|investigation/i
      ],
      [IntentType.HUNTING_GUIDANCE]: [
        /hunt|proactive|detection|search\s*for/i
      ],
      [IntentType.MITIGATION_ADVICE]: [
        /mitigat|block|prevent|protect|defend/i
      ],
      [IntentType.TREND_ANALYSIS]: [
        /trend|pattern|emerging|recent|statistics/i
      ]
    };
    
    let maxScore = 0;
    let primaryIntent = IntentType.GENERAL_QUESTION;
    
    for (const [intent, patternList] of Object.entries(patterns)) {
      let score = 0;
      for (const pattern of patternList) {
        if (pattern.test(lowerQuery)) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = intent as IntentType;
      }
    }
    
    return {
      primary: primaryIntent,
      confidence: Math.min(maxScore * 0.4, 1.0),
      parameters: {}
    };
  }
}

/**
 * Entity Extraction Engine
 */
class EntityExtractor {
  async extractEntities(query: string, context: ConversationContext): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    
    // IP Address pattern
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ipMatches = query.match(ipPattern);
    if (ipMatches) {
      for (const ip of ipMatches) {
        entities.push({
          type: EntityType.IP_ADDRESS,
          value: ip,
          confidence: 0.95,
          context: query
        });
      }
    }
    
    // Domain pattern
    const domainPattern = /\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/g;
    const domainMatches = query.match(domainPattern);
    if (domainMatches) {
      for (const domain of domainMatches) {
        entities.push({
          type: EntityType.DOMAIN,
          value: domain,
          confidence: 0.9,
          context: query
        });
      }
    }
    
    // Hash pattern (MD5, SHA1, SHA256)
    const hashPattern = /\b[a-fA-F0-9]{32,64}\b/g;
    const hashMatches = query.match(hashPattern);
    if (hashMatches) {
      for (const hash of hashMatches) {
        entities.push({
          type: EntityType.FILE_HASH,
          value: hash,
          confidence: 0.95,
          context: query
        });
      }
    }
    
    // CVE pattern
    const cvePattern = /CVE-\d{4}-\d{4,}/gi;
    const cveMatches = query.match(cvePattern);
    if (cveMatches) {
      for (const cve of cveMatches) {
        entities.push({
          type: EntityType.CVE,
          value: cve.toUpperCase(),
          confidence: 1.0,
          context: query
        });
      }
    }
    
    // URL pattern
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urlMatches = query.match(urlPattern);
    if (urlMatches) {
      for (const url of urlMatches) {
        entities.push({
          type: EntityType.URL,
          value: url,
          confidence: 0.95,
          context: query
        });
      }
    }
    
    return entities;
  }
}

/**
 * Response Generation Engine
 */
class ResponseGenerator {
  constructor(private aiEngine: AIContextualAnalysisEngine) {}
  
  async generateResponse(
    query: ThreatQuery,
    intent: QueryIntent,
    entities: ExtractedEntity[],
    responseData: ThreatResponseData,
    context: ConversationContext
  ): Promise<ThreatResponse> {
    
    // Generate contextual response using AI
    const aiResponse = await this.aiEngine.executeContextualAnalysis({
      type: 'conversational_response',
      data: {
        query: query.query,
        intent,
        entities,
        responseData,
        conversationHistory: context.conversationHistory.slice(-3) // Last 3 turns
      },
      query: `Generate a conversational response for: ${query.query}`,
      context: 'threat_intelligence_assistant'
    });
    
    return {
      sessionId: query.sessionId,
      responseId: this.generateResponseId(),
      response: aiResponse.analysis || "I found some relevant threat intelligence data for your query.",
      confidence: aiResponse.confidence || intent.confidence,
      intent,
      data: responseData,
      recommendations: aiResponse.recommendations || [],
      sources: aiResponse.sources || [],
      followUpSuggestions: [],
      timestamp: new Date(),
      responseTime: 0
    };
  }
  
  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}