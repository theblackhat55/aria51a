/**
 * Enhanced ARIA Chatbot Service
 * Unified chatbot with streaming, context management, and real-time data integration
 */

import { D1Database } from '@cloudflare/workers-types';

// Response streaming interface
export interface StreamChunk {
  type: 'text' | 'data' | 'action' | 'error' | 'end';
  content: string;
  metadata?: any;
}

// Context management
export interface ConversationContext {
  sessionId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  recentMessages: Message[];
  platformData?: PlatformData;
  semanticMemory?: Map<string, any>;
  activeIntents?: string[];
  lastActivity?: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface PlatformData {
  risks?: any[];
  compliance?: any[];
  threats?: any[];
  incidents?: any[];
  assets?: any[];
  controls?: any[];
}

// API Provider configuration
export interface APIProviderConfig {
  openai?: { apiKey: string; model?: string };
  anthropic?: { apiKey: string; model?: string };
  google?: { apiKey: string; model?: string };
  cloudflare?: { enabled: boolean };
}

// Cache configuration
interface CacheEntry {
  response: string;
  timestamp: number;
  hits: number;
}

export class EnhancedChatbotService {
  private db: D1Database;
  private responseCache: Map<string, CacheEntry>;
  private contextStore: Map<string, ConversationContext>;
  private apiConfig: APIProviderConfig;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly MAX_CONTEXT_MESSAGES = 20;
  
  constructor(db: D1Database) {
    this.db = db;
    this.responseCache = new Map();
    this.contextStore = new Map();
    this.apiConfig = {};
  }

  /**
   * Initialize API providers from database
   */
  async initializeAPIProviders() {
    try {
      const providers = await this.db.prepare(`
        SELECT provider_name, api_key, config, is_active 
        FROM api_providers 
        WHERE is_active = 1
      `).all();

      if (providers.results) {
        for (const provider of providers.results) {
          const config = JSON.parse(provider.config || '{}');
          
          switch (provider.provider_name) {
            case 'openai':
              this.apiConfig.openai = { 
                apiKey: provider.api_key,
                model: config.model || 'gpt-4-turbo-preview'
              };
              break;
            case 'anthropic':
              this.apiConfig.anthropic = { 
                apiKey: provider.api_key,
                model: config.model || 'claude-3-opus-20240229'
              };
              break;
            case 'google':
              this.apiConfig.google = { 
                apiKey: provider.api_key,
                model: config.model || 'gemini-pro'
              };
              break;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load API providers:', error);
    }
  }

  /**
   * Stream response with real-time data and context
   */
  async *streamResponse(
    query: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    try {
      // Check cache first
      const cachedResponse = this.getCachedResponse(query);
      if (cachedResponse) {
        yield { type: 'text', content: cachedResponse };
        yield { type: 'end', content: '' };
        return;
      }

      // Load real-time platform data
      const platformData = await this.loadPlatformData(context);
      context.platformData = platformData;

      // Detect intent and context
      const intent = await this.detectIntent(query, context);
      
      // Build enhanced prompt with context
      const enhancedPrompt = await this.buildEnhancedPrompt(query, context, intent);

      // Generate streaming response using best available provider
      const provider = this.selectBestProvider();
      
      if (provider === 'openai' && this.apiConfig.openai) {
        yield* this.streamFromOpenAI(enhancedPrompt, context);
      } else if (provider === 'anthropic' && this.apiConfig.anthropic) {
        yield* this.streamFromAnthropic(enhancedPrompt, context);
      } else {
        // Fallback to intelligent rule-based response with real data
        yield* this.generateIntelligentFallback(query, context, intent);
      }

      // Update context with this interaction
      this.updateContext(context, query);

    } catch (error) {
      console.error('Streaming error:', error);
      yield { 
        type: 'error', 
        content: 'I encountered an error. Please try again.',
        metadata: { error: error.message }
      };
      yield { type: 'end', content: '' };
    }
  }

  /**
   * Load real-time platform data from database
   */
  private async loadPlatformData(context: ConversationContext): Promise<PlatformData> {
    const data: PlatformData = {};

    try {
      // Load risks
      const risks = await this.db.prepare(`
        SELECT id, title, description, risk_score, status, category, owner
        FROM risks 
        WHERE status != 'closed'
        ORDER BY risk_score DESC
        LIMIT 10
      `).all();
      data.risks = risks.results || [];

      // Load compliance data
      const compliance = await this.db.prepare(`
        SELECT 
          f.name as framework,
          COUNT(c.id) as total_controls,
          COUNT(CASE WHEN c.implementation_status = 'implemented' THEN 1 END) as implemented,
          ROUND(
            COUNT(CASE WHEN c.implementation_status = 'implemented' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(c.id), 0), 1
          ) as compliance_percentage
        FROM compliance_frameworks f
        LEFT JOIN compliance_controls c ON f.id = c.framework_id
        WHERE f.is_active = 1
        GROUP BY f.id
      `).all();
      data.compliance = compliance.results || [];

      // Load recent threats
      const threats = await this.db.prepare(`
        SELECT 
          indicator_value,
          indicator_type,
          threat_level,
          source,
          first_seen,
          last_seen
        FROM threat_indicators
        WHERE threat_level IN ('critical', 'high')
        ORDER BY last_seen DESC
        LIMIT 10
      `).all();
      data.threats = threats.results || [];

      // Load incidents
      const incidents = await this.db.prepare(`
        SELECT 
          id,
          title,
          severity,
          status,
          assigned_to,
          created_at
        FROM incidents
        WHERE status NOT IN ('closed', 'resolved')
        ORDER BY created_at DESC
        LIMIT 5
      `).all();
      data.incidents = incidents.results || [];

      // Load controls
      const controls = await this.db.prepare(`
        SELECT 
          id,
          title,
          control_type,
          effectiveness_rating,
          implementation_status
        FROM risk_controls
        WHERE is_active = 1
        LIMIT 20
      `).all();
      data.controls = controls.results || [];

    } catch (error) {
      console.error('Failed to load platform data:', error);
    }

    return data;
  }

  /**
   * Detect user intent from query
   */
  private async detectIntent(query: string, context: ConversationContext): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // Risk-related intents
    if (lowerQuery.match(/risk|threat|vulnerability|exposure|hazard/)) {
      return 'risk_analysis';
    }
    
    // Compliance intents
    if (lowerQuery.match(/compliance|regulation|audit|framework|iso|soc|gdpr|hipaa/)) {
      return 'compliance_check';
    }
    
    // Incident response
    if (lowerQuery.match(/incident|breach|alert|emergency|attack/)) {
      return 'incident_response';
    }
    
    // Reporting intents
    if (lowerQuery.match(/report|dashboard|metric|statistic|chart|graph/)) {
      return 'reporting';
    }
    
    // Threat intelligence
    if (lowerQuery.match(/ioc|indicator|campaign|malware|apt|threat intel/)) {
      return 'threat_intelligence';
    }
    
    // Control recommendations
    if (lowerQuery.match(/control|mitigation|remediation|recommendation|suggest/)) {
      return 'control_recommendation';
    }
    
    return 'general';
  }

  /**
   * Build enhanced prompt with context and real data
   */
  private async buildEnhancedPrompt(
    query: string,
    context: ConversationContext,
    intent: string
  ): Promise<string> {
    const { platformData } = context;
    
    let systemPrompt = `You are ARIA, an advanced AI security assistant for risk management and compliance.
    
Current Platform State:
- Active Risks: ${platformData?.risks?.length || 0} (${platformData?.risks?.filter(r => r.risk_score >= 80).length || 0} critical)
- Compliance Frameworks: ${platformData?.compliance?.length || 0} active
- Recent Threats: ${platformData?.threats?.length || 0} high/critical indicators
- Open Incidents: ${platformData?.incidents?.length || 0}
- Active Controls: ${platformData?.controls?.length || 0}

User Context:
- Name: ${context.userName || 'User'}
- Role: ${context.userRole || 'Unknown'}
- Current Intent: ${intent}
- Session: ${context.sessionId}

Recent Conversation:
${context.recentMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

Instructions:
1. Provide specific, actionable responses using the real platform data
2. Reference actual risks, compliance status, and threats when relevant
3. Use markdown formatting for clarity
4. Include specific recommendations based on current state
5. Be concise but comprehensive`;

    // Add intent-specific context
    switch (intent) {
      case 'risk_analysis':
        if (platformData?.risks?.length > 0) {
          const topRisk = platformData.risks[0];
          systemPrompt += `\n\nTop Risk: "${topRisk.title}" with score ${topRisk.risk_score}`;
        }
        break;
        
      case 'compliance_check':
        if (platformData?.compliance?.length > 0) {
          const complianceStatus = platformData.compliance
            .map(c => `${c.framework}: ${c.compliance_percentage}%`)
            .join(', ');
          systemPrompt += `\n\nCompliance Status: ${complianceStatus}`;
        }
        break;
        
      case 'threat_intelligence':
        if (platformData?.threats?.length > 0) {
          systemPrompt += `\n\nRecent Critical Threats: ${platformData.threats.length} indicators detected`;
        }
        break;
    }

    return `${systemPrompt}\n\nUser Query: ${query}\n\nProvide a helpful, data-driven response:`;
  }

  /**
   * Stream response from OpenAI
   */
  private async *streamFromOpenAI(
    prompt: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    if (!this.apiConfig.openai?.apiKey) {
      yield* this.generateIntelligentFallback(prompt, context, 'general');
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiConfig.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.apiConfig.openai.model || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: prompt },
            ...context.recentMessages.slice(-5)
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'end', content: '' };
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield { type: 'text', content };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      yield* this.generateIntelligentFallback(prompt, context, 'general');
    }
  }

  /**
   * Stream response from Anthropic
   */
  private async *streamFromAnthropic(
    prompt: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    if (!this.apiConfig.anthropic?.apiKey) {
      yield* this.generateIntelligentFallback(prompt, context, 'general');
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiConfig.anthropic.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.apiConfig.anthropic.model || 'claude-3-opus-20240229',
          messages: [
            { role: 'user', content: prompt },
            ...context.recentMessages.slice(-5)
          ],
          stream: true,
          max_tokens: 800
        })
      });

      // Similar streaming logic for Anthropic
      // ... (implementation similar to OpenAI)
      
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      yield* this.generateIntelligentFallback(prompt, context, 'general');
    }
  }

  /**
   * Generate intelligent fallback response with real data
   */
  private async *generateIntelligentFallback(
    query: string,
    context: ConversationContext,
    intent: string
  ): AsyncGenerator<StreamChunk> {
    const { platformData } = context;
    let response = '';

    switch (intent) {
      case 'risk_analysis':
        const totalRisks = platformData?.risks?.length || 0;
        const criticalRisks = platformData?.risks?.filter(r => r.risk_score >= 80).length || 0;
        const highRisks = platformData?.risks?.filter(r => r.risk_score >= 60 && r.risk_score < 80).length || 0;
        
        response = `📊 **Risk Analysis Summary**\n\n`;
        response += `Based on real-time platform data:\n\n`;
        response += `**Current Risk Landscape:**\n`;
        response += `• Total Active Risks: ${totalRisks}\n`;
        response += `• Critical Risks: ${criticalRisks}\n`;
        response += `• High Risks: ${highRisks}\n\n`;
        
        if (platformData?.risks?.[0]) {
          const topRisk = platformData.risks[0];
          response += `**Top Priority Risk:**\n`;
          response += `• Title: "${topRisk.title}"\n`;
          response += `• Score: ${topRisk.risk_score}/100\n`;
          response += `• Category: ${topRisk.category}\n`;
          response += `• Owner: ${topRisk.owner || 'Unassigned'}\n\n`;
        }
        
        response += `**Recommended Actions:**\n`;
        response += `1. Focus on critical risks immediately\n`;
        response += `2. Implement additional controls for high-risk areas\n`;
        response += `3. Schedule risk review meetings with owners\n`;
        response += `4. Update risk treatment plans\n`;
        break;

      case 'compliance_check':
        response = `✅ **Compliance Status Report**\n\n`;
        response += `Real-time compliance metrics:\n\n`;
        
        if (platformData?.compliance?.length > 0) {
          response += `**Framework Compliance:**\n`;
          for (const framework of platformData.compliance) {
            const status = framework.compliance_percentage >= 80 ? '🟢' : 
                         framework.compliance_percentage >= 60 ? '🟡' : '🔴';
            response += `${status} ${framework.framework}: ${framework.compliance_percentage}% (${framework.implemented}/${framework.total_controls} controls)\n`;
          }
          response += `\n`;
        }
        
        response += `**Key Observations:**\n`;
        response += `• Frameworks tracked: ${platformData?.compliance?.length || 0}\n`;
        response += `• Average compliance: ${Math.round(
          platformData?.compliance?.reduce((sum, f) => sum + f.compliance_percentage, 0) / 
          (platformData?.compliance?.length || 1)
        )}%\n\n`;
        
        response += `**Recommendations:**\n`;
        response += `1. Prioritize frameworks below 80% compliance\n`;
        response += `2. Document evidence for implemented controls\n`;
        response += `3. Schedule compliance assessments\n`;
        break;

      case 'threat_intelligence':
        response = `🛡️ **Threat Intelligence Report**\n\n`;
        response += `Current threat landscape analysis:\n\n`;
        
        if (platformData?.threats?.length > 0) {
          response += `**Active Threat Indicators:**\n`;
          response += `• Critical/High IOCs: ${platformData.threats.length}\n`;
          response += `• Most Recent: ${new Date(platformData.threats[0].last_seen).toLocaleDateString()}\n\n`;
          
          response += `**Top Threat Types:**\n`;
          const threatTypes = [...new Set(platformData.threats.map(t => t.indicator_type))];
          threatTypes.slice(0, 5).forEach(type => {
            response += `• ${type}\n`;
          });
          response += `\n`;
        }
        
        response += `**Recommended Actions:**\n`;
        response += `1. Review and validate threat indicators\n`;
        response += `2. Update security controls based on threats\n`;
        response += `3. Implement threat hunting procedures\n`;
        response += `4. Share threat intelligence with team\n`;
        break;

      default:
        response = `🤖 **ARIA Intelligence Assistant**\n\n`;
        response += `I'm here to help with your security and compliance needs.\n\n`;
        response += `**Current Platform Overview:**\n`;
        response += `• Active Risks: ${platformData?.risks?.length || 0}\n`;
        response += `• Compliance Frameworks: ${platformData?.compliance?.length || 0}\n`;
        response += `• Recent Threats: ${platformData?.threats?.length || 0}\n`;
        response += `• Open Incidents: ${platformData?.incidents?.length || 0}\n\n`;
        response += `How can I assist you today? Try asking about:\n`;
        response += `• Risk analysis and mitigation\n`;
        response += `• Compliance status and gaps\n`;
        response += `• Threat intelligence insights\n`;
        response += `• Security control recommendations\n`;
    }

    // Stream the response character by character for effect
    for (const char of response) {
      yield { type: 'text', content: char };
      // Add small delay for streaming effect (optional)
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    yield { type: 'end', content: '' };
  }

  /**
   * Select best available API provider
   */
  private selectBestProvider(): string {
    // Priority order based on availability and performance
    if (this.apiConfig.openai?.apiKey) return 'openai';
    if (this.apiConfig.anthropic?.apiKey) return 'anthropic';
    if (this.apiConfig.google?.apiKey) return 'google';
    if (this.apiConfig.cloudflare?.enabled) return 'cloudflare';
    return 'fallback';
  }

  /**
   * Get cached response if available
   */
  private getCachedResponse(query: string): string | null {
    const normalized = query.toLowerCase().trim();
    const cached = this.responseCache.get(normalized);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      cached.hits++;
      return cached.response;
    }
    
    return null;
  }

  /**
   * Cache response for future use
   */
  private cacheResponse(query: string, response: string): void {
    const normalized = query.toLowerCase().trim();
    this.responseCache.set(normalized, {
      response,
      timestamp: Date.now(),
      hits: 0
    });
    
    // Clean old cache entries
    if (this.responseCache.size > 100) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) {
        this.responseCache.delete(oldestKey);
      }
    }
  }

  /**
   * Update conversation context
   */
  private updateContext(context: ConversationContext, query: string): void {
    // Add message to context
    context.recentMessages.push({
      role: 'user',
      content: query,
      timestamp: new Date()
    });
    
    // Limit context size
    if (context.recentMessages.length > this.MAX_CONTEXT_MESSAGES) {
      context.recentMessages = context.recentMessages.slice(-this.MAX_CONTEXT_MESSAGES);
    }
    
    // Update last activity
    context.lastActivity = new Date();
    
    // Store updated context
    this.contextStore.set(context.sessionId, context);
  }

  /**
   * Get or create conversation context
   */
  async getOrCreateContext(sessionId: string, userId: string): Promise<ConversationContext> {
    let context = this.contextStore.get(sessionId);
    
    if (!context) {
      // Load user details from database
      const user = await this.db.prepare(
        'SELECT username, role FROM users WHERE id = ?'
      ).bind(userId).first();
      
      context = {
        sessionId,
        userId,
        userName: user?.username || 'User',
        userRole: user?.role || 'user',
        recentMessages: [],
        semanticMemory: new Map(),
        activeIntents: [],
        lastActivity: new Date()
      };
      
      this.contextStore.set(sessionId, context);
    }
    
    return context;
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions(): void {
    const now = Date.now();
    const SESSION_TIMEOUT = 3600000; // 1 hour
    
    for (const [sessionId, context] of this.contextStore.entries()) {
      if (context.lastActivity && now - context.lastActivity.getTime() > SESSION_TIMEOUT) {
        this.contextStore.delete(sessionId);
      }
    }
  }
}