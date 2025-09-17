/**
 * Unified AI Chatbot Service
 * Uses the existing AI providers engine with proper priority fallback
 * Cloudflare AI -> OpenAI -> Anthropic -> Google -> Fallback
 */

import { D1Database } from '@cloudflare/workers-types';
import { AIService, CloudflareAIProvider, type AIMessage } from './ai-providers';

export interface StreamChunk {
  type: 'content' | 'metadata' | 'error' | 'done';
  content?: string;
  metadata?: any;
  error?: string;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  messages: AIMessage[];
  platformData?: any;
}

export class UnifiedAIChatbotService {
  private db: D1Database;
  private env: any;
  private aiService: AIService | null = null;
  private contexts: Map<string, ConversationContext> = new Map();
  private providerPriority: string[] = [];
  
  constructor(db: D1Database, env?: any) {
    this.db = db;
    this.env = env;
  }

  /**
   * Initialize AI Service with providers from database
   * Priority: Cloudflare AI (free) -> OpenAI -> Anthropic -> Google -> Azure
   */
  async initialize() {
    try {
      const configs: any = {};
      
      // 1. First, try Cloudflare AI (it's free with Workers and works without API key)
      if (this.env?.AI) {
        configs['cloudflare-ai'] = {
          type: 'cloudflare',
          apiKey: 'not-required', // Cloudflare AI uses the binding directly
          model: '@cf/meta/llama-3.1-8b-instruct',
          accountId: this.env.CLOUDFLARE_ACCOUNT_ID,
          apiToken: this.env.CLOUDFLARE_API_TOKEN
        };
        this.providerPriority.push('cloudflare-ai');
        console.log('✅ Cloudflare AI available via binding');
      }

      // 2. Load other providers from database
      const providers = await this.db.prepare(`
        SELECT 
          provider_name, 
          api_key, 
          config, 
          is_active,
          CASE 
            WHEN provider_name = 'openai' THEN 1
            WHEN provider_name = 'anthropic' THEN 2
            WHEN provider_name = 'google' THEN 3
            WHEN provider_name = 'azure' THEN 4
            ELSE 5
          END as priority_order
        FROM api_providers 
        WHERE is_active = 1
        ORDER BY priority_order
      `).all();

      if (providers.results) {
        for (const provider of providers.results) {
          // Skip dummy keys
          if (!provider.api_key || provider.api_key === 'dummy_key' || provider.api_key.includes('your-')) {
            continue;
          }

          const configData = typeof provider.config === 'string' 
            ? JSON.parse(provider.config) 
            : provider.config || {};

          const providerName = provider.provider_name.toLowerCase();
          
          switch (providerName) {
            case 'openai':
              configs['openai'] = {
                type: 'openai',
                apiKey: provider.api_key,
                model: configData.model || 'gpt-3.5-turbo',
                maxTokens: 500,
                temperature: 0.7
              };
              this.providerPriority.push('openai');
              break;
              
            case 'anthropic':
              configs['anthropic'] = {
                type: 'anthropic',
                apiKey: provider.api_key,
                model: configData.model || 'claude-3-haiku-20240307',
                maxTokens: 500,
                temperature: 0.7
              };
              this.providerPriority.push('anthropic');
              break;
              
            case 'google':
            case 'gemini':
              configs['gemini'] = {
                type: 'gemini',
                apiKey: provider.api_key,
                model: configData.model || 'gemini-pro',
                maxTokens: 500,
                temperature: 0.7
              };
              this.providerPriority.push('gemini');
              break;
              
            case 'azure':
            case 'azure-openai':
              configs['azure'] = {
                type: 'azure-openai',
                apiKey: provider.api_key,
                baseUrl: configData.endpoint || configData.baseUrl,
                deployment: configData.deployment || 'gpt-35-turbo',
                apiVersion: configData.apiVersion || '2024-02-15-preview',
                maxTokens: 500,
                temperature: 0.7
              };
              this.providerPriority.push('azure');
              break;
          }
        }
      }

      // 3. Also check environment variables as fallback
      if (!configs['openai'] && this.env?.OPENAI_API_KEY && !this.env.OPENAI_API_KEY.includes('your-')) {
        configs['openai-env'] = {
          type: 'openai',
          apiKey: this.env.OPENAI_API_KEY,
          model: 'gpt-3.5-turbo',
          maxTokens: 500,
          temperature: 0.7
        };
        this.providerPriority.push('openai-env');
      }

      if (!configs['anthropic'] && this.env?.ANTHROPIC_API_KEY && !this.env.ANTHROPIC_API_KEY.includes('your-')) {
        configs['anthropic-env'] = {
          type: 'anthropic',
          apiKey: this.env.ANTHROPIC_API_KEY,
          model: 'claude-3-haiku-20240307',
          maxTokens: 500,
          temperature: 0.7
        };
        this.providerPriority.push('anthropic-env');
      }

      // Create AI Service with all available providers
      if (Object.keys(configs).length > 0) {
        this.aiService = new AIService(configs);
        console.log(`✅ AI Service initialized with providers: ${this.providerPriority.join(', ')}`);
      } else {
        console.warn('⚠️ No AI providers configured - will use fallback responses');
      }

    } catch (error) {
      console.error('Failed to initialize AI providers:', error);
    }
  }

  /**
   * Get or create conversation context
   */
  async getOrCreateContext(sessionId: string, userId: string): Promise<ConversationContext> {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        sessionId,
        userId,
        messages: [],
        platformData: await this.loadPlatformData()
      });
    }
    return this.contexts.get(sessionId)!;
  }

  /**
   * Load real-time platform data
   */
  async loadPlatformData() {
    const data: any = {};
    
    try {
      // Load risk metrics
      const risks = await this.db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN risk_score >= 80 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_score >= 60 AND risk_score < 80 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_score >= 40 AND risk_score < 60 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_score < 40 THEN 1 ELSE 0 END) as low,
          AVG(risk_score) as avg_score
        FROM risks WHERE status = 'active'
      `).first();
      data.risks = risks;

      // Load compliance status
      const compliance = await this.db.prepare(`
        SELECT framework, compliance_percentage, total_controls, implemented
        FROM compliance_frameworks
        ORDER BY compliance_percentage DESC
      `).all();
      data.compliance = compliance.results;

      // Load threat indicators
      const threats = await this.db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN threat_level = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN threat_level = 'high' THEN 1 ELSE 0 END) as high
        FROM threat_indicators
        WHERE last_seen > datetime('now', '-7 days')
      `).first();
      data.threats = threats;

      // Load incidents
      const incidents = await this.db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END) as investigating
        FROM incidents
      `).first();
      data.incidents = incidents;

    } catch (error) {
      console.error('Failed to load platform data:', error);
    }

    return data;
  }

  /**
   * Stream response using priority-based provider selection
   */
  async *streamResponse(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    
    // Add user message to context
    context.messages.push({ role: 'user', content: message });
    
    // Keep only last 10 messages
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    // Refresh platform data
    context.platformData = await this.loadPlatformData();

    // Build system prompt with platform context
    const systemMessage: AIMessage = {
      role: 'system',
      content: this.buildSystemPrompt(context)
    };

    // Try each provider in priority order
    for (const providerName of this.providerPriority) {
      const provider = this.aiService?.getProvider(providerName);
      
      if (provider) {
        try {
          console.log(`Attempting ${providerName}...`);
          
          // Special handling for Cloudflare AI with native binding
          if (providerName === 'cloudflare-ai' && this.env?.AI) {
            yield* this.streamFromCloudflareBinding(message, context);
            return;
          }
          
          // Use the regular provider
          const messages = [systemMessage, ...context.messages];
          const response = await provider.chat(messages);
          
          // Stream the response
          const words = response.content.split(' ');
          for (const word of words) {
            yield { type: 'content', content: word + ' ' };
            await new Promise(resolve => setTimeout(resolve, 30)); // Small delay for streaming effect
          }
          
          // Add assistant response to context
          context.messages.push({ role: 'assistant', content: response.content });
          
          yield { type: 'done' };
          return;
          
        } catch (error) {
          console.error(`${providerName} failed:`, error);
          // Continue to next provider
        }
      }
    }

    // If all providers fail, use intelligent fallback
    console.log('All AI providers failed, using fallback...');
    yield* this.generateIntelligentFallback(message, context);
  }

  /**
   * Stream directly from Cloudflare AI binding
   */
  private async *streamFromCloudflareBinding(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Use Cloudflare AI binding directly
      const response = await this.env.AI.run(
        '@cf/meta/llama-3.1-8b-instruct',
        {
          messages: [
            { role: 'system', content: systemPrompt },
            ...context.messages
          ],
          stream: true,
          max_tokens: 500
        }
      );

      let fullResponse = '';
      
      // Handle streaming response
      if (response && typeof response[Symbol.asyncIterator] === 'function') {
        for await (const chunk of response) {
          if (chunk.response) {
            fullResponse += chunk.response;
            yield { type: 'content', content: chunk.response };
          }
        }
      } else if (response?.response) {
        // Non-streaming response
        fullResponse = response.response;
        const words = fullResponse.split(' ');
        for (const word of words) {
          yield { type: 'content', content: word + ' ' };
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

      // Add to context
      context.messages.push({ role: 'assistant', content: fullResponse });
      yield { type: 'done' };
      
    } catch (error) {
      console.error('Cloudflare AI binding error:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent fallback using real platform data
   */
  private async *generateIntelligentFallback(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    
    const { platformData } = context;
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Analyze intent and generate appropriate response
    if (lowerMessage.includes('risk') || lowerMessage.includes('threat')) {
      const risks = platformData?.risks || {};
      response = `Based on current platform data:\n\n`;
      response += `📊 **Risk Overview:**\n`;
      response += `• Total Active Risks: ${risks.total || 0}\n`;
      response += `• Critical: ${risks.critical || 0} ⚠️\n`;
      response += `• High: ${risks.high || 0}\n`;
      response += `• Medium: ${risks.medium || 0}\n`;
      response += `• Low: ${risks.low || 0}\n`;
      response += `• Average Risk Score: ${Math.round(risks.avg_score || 0)}/100\n\n`;
      
      if ((risks.critical || 0) > 0) {
        response += `⚠️ **Immediate Action Required:** You have ${risks.critical} critical risks requiring immediate attention.\n\n`;
      }
      
      response += `**Recommendations:**\n`;
      response += `1. Focus on critical risks immediately\n`;
      response += `2. Review and update risk mitigation plans\n`;
      response += `3. Schedule risk assessment reviews\n`;
      response += `4. Implement additional controls for high-risk areas\n`;
      
    } else if (lowerMessage.includes('compliance') || lowerMessage.includes('framework')) {
      const compliance = platformData?.compliance || [];
      response = `📋 **Compliance Status Report:**\n\n`;
      
      if (compliance.length > 0) {
        for (const framework of compliance) {
          const icon = framework.compliance_percentage >= 80 ? '✅' : 
                       framework.compliance_percentage >= 60 ? '⚠️' : '❌';
          response += `${icon} **${framework.framework}**: ${framework.compliance_percentage}% (${framework.implemented}/${framework.total_controls} controls)\n`;
        }
        
        const avgCompliance = Math.round(
          compliance.reduce((sum: number, f: any) => sum + f.compliance_percentage, 0) / compliance.length
        );
        response += `\n**Overall Compliance**: ${avgCompliance}%\n`;
      } else {
        response += `No compliance frameworks configured yet.\n`;
      }
      
      response += `\n**Next Steps:**\n`;
      response += `1. Complete implementation of pending controls\n`;
      response += `2. Document evidence for implemented controls\n`;
      response += `3. Schedule compliance audits\n`;
      response += `4. Review framework requirements\n`;
      
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      response = `👋 Hello ${context.userName || 'there'}! I'm ARIA, your AI security assistant.\n\n`;
      response += `I have access to your real-time platform data and can help you with:\n\n`;
      response += `• **Risk Analysis** - View and manage ${platformData?.risks?.total || 0} active risks\n`;
      response += `• **Compliance Monitoring** - Track ${platformData?.compliance?.length || 0} framework requirements\n`;
      response += `• **Threat Intelligence** - Monitor ${platformData?.threats?.total || 0} recent threats\n`;
      response += `• **Incident Response** - Handle ${platformData?.incidents?.open || 0} open incidents\n`;
      response += `• **Security Recommendations** - Get actionable advice\n\n`;
      response += `What aspect of your security posture would you like to explore?\n`;
      
    } else if (lowerMessage.includes('incident')) {
      const incidents = platformData?.incidents || {};
      response = `🚨 **Incident Status:**\n\n`;
      response += `• Total Incidents: ${incidents.total || 0}\n`;
      response += `• Open: ${incidents.open || 0}\n`;
      response += `• Investigating: ${incidents.investigating || 0}\n\n`;
      
      if ((incidents.open || 0) > 0) {
        response += `**Action Required:** You have ${incidents.open} open incidents requiring response.\n\n`;
      }
      
      response += `**Incident Response Steps:**\n`;
      response += `1. Triage open incidents by severity\n`;
      response += `2. Assign response teams\n`;
      response += `3. Document investigation findings\n`;
      response += `4. Implement containment measures\n`;
      
    } else {
      // General response with overview
      const risks = platformData?.risks || {};
      const threats = platformData?.threats || {};
      const incidents = platformData?.incidents || {};
      
      response = `I understand you're asking about: "${message}"\n\n`;
      response += `Here's your current security status:\n\n`;
      response += `📊 **Security Overview:**\n`;
      response += `• Active Risks: ${risks.total || 0} (${risks.critical || 0} critical)\n`;
      response += `• Recent Threats: ${threats.total || 0} (${threats.critical || 0} critical)\n`;
      response += `• Open Incidents: ${incidents.open || 0}\n`;
      response += `• Compliance Frameworks: ${platformData?.compliance?.length || 0}\n\n`;
      response += `How can I assist you with your specific security concern?\n`;
    }

    // Stream the response word by word
    const words = response.split(' ');
    for (const word of words) {
      yield { type: 'content', content: word + ' ' };
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Add to context
    context.messages.push({ role: 'assistant', content: response });
    yield { type: 'done' };
  }

  /**
   * Build system prompt with real platform context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const { platformData } = context;
    
    return `You are ARIA, an advanced AI security assistant for an enterprise security platform.
You have access to real-time platform data and should provide specific, actionable advice.

Current Platform Metrics:
- Active Risks: ${platformData?.risks?.total || 0} (Critical: ${platformData?.risks?.critical || 0}, High: ${platformData?.risks?.high || 0})
- Average Risk Score: ${Math.round(platformData?.risks?.avg_score || 0)}/100
- Compliance Frameworks: ${platformData?.compliance?.length || 0} configured
- Recent Threats: ${platformData?.threats?.total || 0} (Critical: ${platformData?.threats?.critical || 0})
- Open Incidents: ${platformData?.incidents?.open || 0}

User Context:
- Name: ${context.userName || 'User'}
- Role: ${context.userRole || 'Security Professional'}
- Session: ${context.sessionId}

Instructions:
1. Provide specific, actionable responses using the real platform data above
2. Reference actual metrics and numbers when relevant
3. Use markdown formatting for better readability
4. Include concrete recommendations based on current security posture
5. Be professional but conversational
6. Prioritize critical issues when they exist
7. Keep responses concise but comprehensive`;
  }
}