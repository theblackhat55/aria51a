/**
 * Cloudflare-First Chatbot Service
 * Prioritizes Cloudflare AI (Llama 3) and properly reads API keys from database
 */

import { D1Database } from '@cloudflare/workers-types';

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
  messages: Array<{ role: string; content: string }>;
  platformData?: any;
}

export class CloudflareChatbotService {
  private db: D1Database;
  private env: any;
  private apiKeys: Map<string, string> = new Map();
  private contexts: Map<string, ConversationContext> = new Map();
  
  constructor(db: D1Database, env: any) {
    this.db = db;
    this.env = env;
  }

  /**
   * Initialize and load API keys from database
   */
  async initialize() {
    try {
      // Load API keys from database
      const providers = await this.db.prepare(`
        SELECT provider_name, api_key, is_active 
        FROM api_providers 
        WHERE is_active = 1
      `).all();

      if (providers.results) {
        for (const provider of providers.results) {
          if (provider.api_key && provider.api_key !== 'dummy_key') {
            this.apiKeys.set(provider.provider_name.toLowerCase(), provider.api_key);
            console.log(`Loaded API key for: ${provider.provider_name}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load API providers:', error);
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
   * Load platform data for context
   */
  async loadPlatformData() {
    const data: any = {};
    
    try {
      // Load risk summary
      const risks = await this.db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN risk_score >= 80 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_score >= 60 AND risk_score < 80 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_score >= 40 AND risk_score < 60 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_score < 40 THEN 1 ELSE 0 END) as low
        FROM risks WHERE status = 'active'
      `).first();
      data.risks = risks;

      // Load compliance summary
      const compliance = await this.db.prepare(`
        SELECT framework, compliance_percentage, total_controls, implemented
        FROM compliance_frameworks
        ORDER BY compliance_percentage DESC
      `).all();
      data.compliance = compliance.results;

      // Load recent threats
      const threats = await this.db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN threat_level = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN threat_level = 'high' THEN 1 ELSE 0 END) as high
        FROM threat_indicators
        WHERE last_seen > datetime('now', '-7 days')
      `).first();
      data.threats = threats;

    } catch (error) {
      console.error('Failed to load platform data:', error);
    }

    return data;
  }

  /**
   * Main streaming response method - Cloudflare AI first
   */
  async *streamResponse(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    
    // Add user message to context
    context.messages.push({ role: 'user', content: message });
    
    // Keep only last 10 messages for context
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    // Refresh platform data
    context.platformData = await this.loadPlatformData();

    // Try Cloudflare AI first (it's free with Workers)
    if (this.env?.AI) {
      try {
        yield* this.streamFromCloudflareAI(message, context);
        return;
      } catch (error) {
        console.error('Cloudflare AI failed, trying other providers:', error);
      }
    }

    // Try OpenAI if available
    const openaiKey = this.apiKeys.get('openai') || this.env?.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== 'dummy_key') {
      try {
        yield* this.streamFromOpenAI(message, context, openaiKey);
        return;
      } catch (error) {
        console.error('OpenAI failed:', error);
      }
    }

    // Try Anthropic if available
    const anthropicKey = this.apiKeys.get('anthropic') || this.env?.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== 'dummy_key') {
      try {
        yield* this.streamFromAnthropic(message, context, anthropicKey);
        return;
      } catch (error) {
        console.error('Anthropic failed:', error);
      }
    }

    // Fallback to intelligent response with platform data
    yield* this.generateIntelligentResponse(message, context);
  }

  /**
   * Stream from Cloudflare AI (Llama 3 or other models)
   */
  private async *streamFromCloudflareAI(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    
    const systemPrompt = this.buildSystemPrompt(context);
    
    try {
      // Use Cloudflare's AI with streaming
      const response = await this.env.AI.run(
        '@cf/meta/llama-3-8b-instruct', // Or '@cf/mistral/mistral-7b-instruct-v0.1'
        {
          messages: [
            { role: 'system', content: systemPrompt },
            ...context.messages
          ],
          stream: true,
          max_tokens: 500
        }
      );

      // Stream the response
      for await (const chunk of response) {
        if (chunk.response) {
          yield { type: 'content', content: chunk.response };
        }
      }

      // Add assistant message to context
      const fullResponse = response.response || '';
      context.messages.push({ role: 'assistant', content: fullResponse });
      
    } catch (error) {
      console.error('Cloudflare AI error:', error);
      throw error;
    }
  }

  /**
   * Stream from OpenAI
   */
  private async *streamFromOpenAI(
    message: string,
    context: ConversationContext,
    apiKey: string
  ): AsyncGenerator<StreamChunk> {
    
    const systemPrompt = this.buildSystemPrompt(context);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...context.messages
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

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
              context.messages.push({ role: 'assistant', content: fullResponse });
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                yield { type: 'content', content };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw error;
    }
  }

  /**
   * Stream from Anthropic
   */
  private async *streamFromAnthropic(
    message: string,
    context: ConversationContext,
    apiKey: string
  ): AsyncGenerator<StreamChunk> {
    
    const systemPrompt = this.buildSystemPrompt(context);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          system: systemPrompt,
          messages: context.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          max_tokens: 500,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                fullResponse += data.delta.text;
                yield { type: 'content', content: data.delta.text };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      context.messages.push({ role: 'assistant', content: fullResponse });
      
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent fallback response using platform data
   */
  private async *generateIntelligentResponse(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<StreamChunk> {
    
    const { platformData } = context;
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Determine intent and generate appropriate response
    if (lowerMessage.includes('risk') || lowerMessage.includes('threat')) {
      const risks = platformData?.risks || {};
      response = `Based on current platform data:\n\n`;
      response += `**Risk Overview:**\n`;
      response += `• Total Active Risks: ${risks.total || 0}\n`;
      response += `• Critical: ${risks.critical || 0}\n`;
      response += `• High: ${risks.high || 0}\n`;
      response += `• Medium: ${risks.medium || 0}\n`;
      response += `• Low: ${risks.low || 0}\n\n`;
      
      if (risks.critical > 0) {
        response += `⚠️ **Action Required:** You have ${risks.critical} critical risks that need immediate attention.\n\n`;
      }
      
      response += `**Recommendations:**\n`;
      response += `1. Focus on critical risks first\n`;
      response += `2. Review and update risk mitigation plans\n`;
      response += `3. Schedule risk assessment reviews\n`;
      
    } else if (lowerMessage.includes('compliance') || lowerMessage.includes('framework')) {
      const compliance = platformData?.compliance || [];
      response = `**Compliance Status:**\n\n`;
      
      if (compliance.length > 0) {
        for (const framework of compliance) {
          const icon = framework.compliance_percentage >= 80 ? '✅' : 
                       framework.compliance_percentage >= 60 ? '⚠️' : '❌';
          response += `${icon} **${framework.framework}**: ${framework.compliance_percentage}% (${framework.implemented}/${framework.total_controls} controls)\n`;
        }
      } else {
        response += `No compliance frameworks configured yet.\n`;
      }
      
      response += `\n**Next Steps:**\n`;
      response += `1. Complete implementation of remaining controls\n`;
      response += `2. Document evidence for implemented controls\n`;
      response += `3. Schedule compliance audits\n`;
      
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      response = `Hello ${context.userName || 'there'}! I'm ARIA, your AI security assistant.\n\n`;
      response += `I can help you with:\n`;
      response += `• **Risk Analysis** - View and manage security risks\n`;
      response += `• **Compliance Status** - Check framework compliance\n`;
      response += `• **Threat Intelligence** - Monitor active threats\n`;
      response += `• **Incident Response** - Handle security incidents\n`;
      response += `• **Security Recommendations** - Get actionable advice\n\n`;
      response += `What would you like to know about your security posture?\n`;
      
    } else {
      // General response
      response = `I understand you're asking about "${message}".\n\n`;
      response += `Here's a quick overview of your security status:\n\n`;
      
      const risks = platformData?.risks || {};
      const threats = platformData?.threats || {};
      
      response += `📊 **Current Status:**\n`;
      response += `• Active Risks: ${risks.total || 0}\n`;
      response += `• Recent Threats: ${threats.total || 0}\n`;
      response += `• Compliance Frameworks: ${platformData?.compliance?.length || 0}\n\n`;
      
      response += `How can I assist you with your security management today?\n`;
    }

    // Stream the response character by character for effect
    const words = response.split(' ');
    for (const word of words) {
      yield { type: 'content', content: word + ' ' };
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
    }

    // Add to context
    context.messages.push({ role: 'assistant', content: response });
  }

  /**
   * Build system prompt with platform context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const { platformData } = context;
    
    return `You are ARIA, an AI security assistant for an enterprise security platform. 
You have access to real-time platform data and should provide specific, actionable advice.

Current Platform Status:
- Active Risks: ${platformData?.risks?.total || 0} (Critical: ${platformData?.risks?.critical || 0})
- Compliance Frameworks: ${platformData?.compliance?.length || 0} configured
- Recent Threats: ${platformData?.threats?.total || 0} detected

User Context:
- Name: ${context.userName || 'User'}
- Role: ${context.userRole || 'Unknown'}
- Session: ${context.sessionId}

Instructions:
1. Provide specific, actionable responses using real platform data
2. Use markdown formatting for clarity
3. Include recommendations based on current security posture
4. Be concise but comprehensive
5. Reference actual metrics when available`;
  }
}