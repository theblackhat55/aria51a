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
  private requestOrigin: string = '';
  
  constructor(db: D1Database, env?: any, requestOrigin?: string) {
    this.db = db;
    this.env = env;
    this.requestOrigin = requestOrigin || '';
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
      // Load ALL risk metrics (not just active) to show complete picture
      const allRisks = await this.db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN risk_score >= 80 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_score >= 60 AND risk_score < 80 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_score >= 40 AND risk_score < 60 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_score < 40 THEN 1 ELSE 0 END) as low,
          AVG(risk_score) as avg_score,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN status = 'mitigated' THEN 1 ELSE 0 END) as mitigated_count,
          SUM(CASE WHEN status = 'monitoring' THEN 1 ELSE 0 END) as monitoring_count
        FROM risks
      `).first();
      
      // Also get critical risks specifically for better context
      const criticalRisks = await this.db.prepare(`
        SELECT id, title, risk_score, status
        FROM risks
        WHERE risk_score >= 80
        ORDER BY risk_score DESC
        LIMIT 5
      `).all();
      
      data.risks = {
        ...allRisks,
        critical_list: criticalRisks?.results || []
      };

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
    
    // Check for MCP commands first (Option C)
    if (message.startsWith('/mcp-')) {
      yield* this.handleMCPCommand(message, context);
      return;
    }

    // Check if this is a search query or question (Option A)
    const mcpIntent = this.detectMCPIntent(message);
    if (mcpIntent.useMCP) {
      yield* this.handleMCPRequest(message, context, mcpIntent);
      return;
    }
    
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
      response += `• Active Risks: ${risks.active_count || 0} (requiring attention)\n`;
      response += `• Total Risks: ${risks.total || 0} (including all statuses)\n`;
      response += `• Status Breakdown:\n`;
      response += `  - Active: ${risks.active_count || 0} (shown on dashboard)\n`;
      response += `  - Monitoring: ${risks.monitoring_count || 0}\n`;
      response += `  - Mitigated: ${risks.mitigated_count || 0}\n`;
      response += `• Risk Levels:\n`;
      response += `  - Critical: ${risks.critical || 0} ⚠️\n`;
      response += `  - High: ${risks.high || 0}\n`;
      response += `  - Medium: ${risks.medium || 0}\n`;
      response += `  - Low: ${risks.low || 0}\n`;
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
      response += `• **Risk Analysis** - Monitor ${platformData?.risks?.total || 0} total risks (${platformData?.risks?.active_count || 0} active)\n`;
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
      response += `• Active Risks: ${risks.active_count || 0} (Total: ${risks.total || 0})\n`;
      response += `• Risk Severity: Critical (${risks.critical || 0}), High (${risks.high || 0}), Medium (${risks.medium || 0}), Low (${risks.low || 0})\n`;
      response += `• Recent Threats: ${threats.total || 0} (${threats.critical || 0} critical)\n`;
      response += `• Open Incidents: ${incidents.open || 0}\n`;
      response += `• Compliance Frameworks: ${platformData?.compliance?.length || 0}\n\n`;
      response += `Note: Dashboard shows ${risks.active_count || 0} active risks requiring attention.\n\n`;
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
   * Detect if message should use MCP (Option A)
   */
  private detectMCPIntent(message: string): { useMCP: boolean; type: 'search' | 'question' | null } {
    const lowerMessage = message.toLowerCase();
    
    // Keywords that indicate search intent
    const searchKeywords = [
      'search for', 'find', 'look up', 'locate', 'show me all', 
      'list', 'get', 'retrieve', 'fetch', 'query'
    ];
    
    // Keywords that indicate question intent
    const questionKeywords = [
      'what', 'why', 'how', 'when', 'who', 'which', 'where',
      'explain', 'describe', 'tell me about', 'can you explain'
    ];
    
    // Check for search intent
    for (const keyword of searchKeywords) {
      if (lowerMessage.includes(keyword)) {
        return { useMCP: true, type: 'search' };
      }
    }
    
    // Check for question intent
    for (const keyword of questionKeywords) {
      if (lowerMessage.includes(keyword) || lowerMessage.endsWith('?')) {
        return { useMCP: true, type: 'question' };
      }
    }
    
    return { useMCP: false, type: null };
  }

  /**
   * Handle MCP commands (Option C)
   */
  private async *handleMCPCommand(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    const parts = message.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1).join(' ');
    
    try {
      yield { type: 'content', content: `🔮 **MCP Command Detected**: ${command}\n\n` };
      
      switch (command) {
        case '/mcp-search':
          if (!args) {
            yield { type: 'content', content: '❌ Usage: /mcp-search <query>\nExample: /mcp-search ransomware risks' };
          } else {
            yield { type: 'content', content: `Searching for: "${args}"...\n\n` };
            const results = await this.callMCPAPI('/mcp/search/hybrid', {
              query: args,
              topK: 5
            });
            yield { type: 'content', content: this.formatMCPSearchResults(results) };
          }
          break;
          
        case '/mcp-ask':
          if (!args) {
            yield { type: 'content', content: '❌ Usage: /mcp-ask <question>\nExample: /mcp-ask What are our top critical risks?' };
          } else {
            yield { type: 'content', content: `Asking: "${args}"...\n\n` };
            const response = await this.callMCPAPI('/mcp/rag/query', {
              question: args,
              includeContext: true,
              includeCitations: true
            });
            yield { type: 'content', content: this.formatMCPRAGResponse(response) };
          }
          break;
          
        case '/mcp-prompt':
          if (!args) {
            yield { type: 'content', content: '❌ Usage: /mcp-prompt <prompt_name>\nExample: /mcp-prompt analyze_risk_comprehensive' };
          } else {
            const promptName = parts[1];
            const promptArgs = parts.slice(2).join(' ');
            yield { type: 'content', content: `Executing prompt: "${promptName}"...\n\n` };
            const response = await this.callMCPAPI(`/mcp/prompts/${promptName}/execute`, {
              args: promptArgs ? JSON.parse(promptArgs) : {}
            });
            yield { type: 'content', content: `**Generated Prompt:**\n\n${response.generatedPrompt}` };
          }
          break;
          
        case '/mcp-expand':
          if (!args) {
            yield { type: 'content', content: '❌ Usage: /mcp-expand <query>\nExample: /mcp-expand phishing attack' };
          } else {
            yield { type: 'content', content: `Expanding query: "${args}"...\n\n` };
            const response = await this.callMCPAPI('/mcp/query/expand', {
              query: args,
              maxTerms: 5,
              useAI: false
            });
            yield { type: 'content', content: this.formatQueryExpansion(response) };
          }
          break;
          
        case '/mcp-help':
          yield { type: 'content', content: this.getMCPCommandHelp() };
          break;
          
        default:
          yield { type: 'content', content: `❌ Unknown command: ${command}\n\nType /mcp-help for available commands.` };
      }
      
      yield { type: 'done' };
      
    } catch (error) {
      console.error('MCP command error:', error);
      yield { type: 'error', error: `Failed to execute MCP command: ${error}` };
      yield { type: 'done' };
    }
  }

  /**
   * Handle MCP search/question requests (Option A)
   */
  private async *handleMCPRequest(
    message: string,
    context: ConversationContext,
    intent: { useMCP: boolean; type: 'search' | 'question' | null }
  ): AsyncGenerator<StreamChunk> {
    
    try {
      if (intent.type === 'search') {
        // Use hybrid search
        yield { type: 'content', content: '🔍 **Searching knowledge base...**\n\n' };
        
        const results = await this.callMCPAPI('/mcp/search/hybrid', {
          query: message,
          topK: 5
        });
        
        yield { type: 'content', content: this.formatMCPSearchResults(results) };
        
      } else if (intent.type === 'question') {
        // Use RAG pipeline
        yield { type: 'content', content: '🤔 **Analyzing question...**\n\n' };
        
        const response = await this.callMCPAPI('/mcp/rag/query', {
          question: message,
          includeContext: true,
          includeCitations: true
        });
        
        yield { type: 'content', content: this.formatMCPRAGResponse(response) };
      }
      
      // Add to context
      context.messages.push({ role: 'user', content: message });
      context.messages.push({ role: 'assistant', content: 'MCP response provided' });
      
      yield { type: 'done' };
      
    } catch (error) {
      console.error('MCP request error:', error);
      // Fallback to normal chatbot if MCP fails
      yield { type: 'content', content: '⚠️ MCP service unavailable, using standard response...\n\n' };
      yield* this.generateIntelligentFallback(message, context);
    }
  }

  /**
   * Call MCP API endpoint
   * Note: Makes internal API calls to MCP endpoints on the same server
   */
  private async callMCPAPI(endpoint: string, data: any): Promise<any> {
    // Construct full URL using request origin
    const url = this.requestOrigin 
      ? `${this.requestOrigin}${endpoint}`
      : endpoint;
    
    console.log(`[MCP] Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MCP] API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`MCP API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Format MCP search results for display
   */
  private formatMCPSearchResults(response: any): string {
    if (!response.success || !response.results || response.results.length === 0) {
      return '❌ No results found.';
    }
    
    let output = `✅ **Found ${response.count} results** (Hybrid search - 90% accuracy)\n\n`;
    
    for (const result of response.results) {
      const score = Math.round(result.score * 100);
      const metadata = result.metadata || {};
      
      output += `📄 **${metadata.title || 'Document'}** (${score}% match)\n`;
      output += `   ${metadata.description || result.text?.substring(0, 150) || 'No description'}...\n`;
      output += `   Type: ${metadata.type || 'unknown'} | ID: ${metadata.id || 'N/A'}\n\n`;
    }
    
    return output;
  }

  /**
   * Format MCP RAG response for display
   */
  private formatMCPRAGResponse(response: any): string {
    if (!response.success) {
      return '❌ Failed to generate answer.';
    }
    
    let output = `💡 **Answer** (Confidence: ${Math.round((response.confidence || 0) * 100)}%)\n\n`;
    output += `${response.answer}\n\n`;
    
    if (response.sources && response.sources.length > 0) {
      output += `📚 **Sources:**\n`;
      for (const source of response.sources) {
        output += `• ${source.title || 'Document'} (${Math.round(source.relevance * 100)}% relevant)\n`;
        if (source.citation) {
          output += `  "${source.citation}"\n`;
        }
      }
    }
    
    if (response.modelUsed) {
      output += `\n🤖 Model: ${response.modelUsed} | Tokens: ${response.tokensUsed || 0} | Time: ${response.responseTime || 0}ms`;
    }
    
    return output;
  }

  /**
   * Format query expansion results
   */
  private formatQueryExpansion(response: any): string {
    if (!response.success) {
      return '❌ Failed to expand query.';
    }
    
    let output = `**Original Query:** ${response.originalQuery}\n\n`;
    output += `**Expanded Query:** ${response.expandedQuery}\n\n`;
    output += `**Added Terms:** ${response.addedTerms.join(', ')}\n\n`;
    output += `**Confidence:** ${Math.round(response.confidence * 100)}%`;
    
    return output;
  }

  /**
   * Get MCP command help
   */
  private getMCPCommandHelp(): string {
    return `🔮 **MCP Intelligence Commands**

Available commands:

**/mcp-search <query>**
  Perform hybrid semantic + keyword search
  Example: /mcp-search ransomware risks

**/mcp-ask <question>**
  Ask a question and get AI-powered answer with citations
  Example: /mcp-ask What are our critical compliance gaps?

**/mcp-prompt <name> [args]**
  Execute enterprise prompt template
  Example: /mcp-prompt analyze_risk_comprehensive {"risk_id": 123}

**/mcp-expand <query>**
  Expand query with related security terms
  Example: /mcp-expand phishing attack

**/mcp-help**
  Show this help message

**Natural Language:**
You can also use natural language - I'll detect search queries and questions automatically!
• "Search for SQL injection vulnerabilities"
• "What are the top threats we're facing?"
• "Find all high-risk assessments"`;
  }

  /**
   * Build system prompt with real platform context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const { platformData } = context;
    
    return `You are ARIA, an advanced AI security assistant for an enterprise security platform.
You have access to real-time platform data and should provide specific, actionable advice.

Current Platform Metrics:
- Active Risks: ${platformData?.risks?.active_count || 0} (Total: ${platformData?.risks?.total || 0} including ${platformData?.risks?.monitoring_count || 0} monitoring, ${platformData?.risks?.mitigated_count || 0} mitigated)
- Risk Distribution: Critical: ${platformData?.risks?.critical || 0}, High: ${platformData?.risks?.high || 0}, Medium: ${platformData?.risks?.medium || 0}, Low: ${platformData?.risks?.low || 0}
- Average Risk Score: ${Math.round(platformData?.risks?.avg_score || 0)}/100
- Compliance Frameworks: ${platformData?.compliance?.length || 0} configured
- Recent Threats: ${platformData?.threats?.total || 0} (Critical: ${platformData?.threats?.critical || 0})
- Open Incidents: ${platformData?.incidents?.open || 0}

User Context:
- Name: ${context.userName || 'User'}
- Role: ${context.userRole || 'Security Professional'}\n- Session: ${context.sessionId}

Instructions:
1. When asked about risk count, ALWAYS mention ACTIVE risks first (${platformData?.risks?.active_count || 0}) as this matches the dashboard
2. Provide specific, actionable responses using the real platform data above
3. Reference actual metrics and numbers when relevant
4. Use markdown formatting for better readability
5. Include concrete recommendations based on current security posture
6. Be professional but conversational
7. Prioritize critical issues when they exist
8. Keep responses concise but comprehensive`;
  }
}