/**
 * AI Providers Integration Service
 * Implements real connections to OpenAI, Anthropic, Google Gemini, and Azure OpenAI
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
  finish_reason?: string;
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface RiskAnalysisRequest {
  title: string;
  description: string;
  category?: string;
  affectedServices?: string[];
  existingControls?: string[];
}

export interface RiskAnalysisResponse {
  controlSuggestions: Array<{
    framework: string;
    controlId: string;
    controlName: string;
    relevance: number;
    rationale: string;
  }>;
  riskAssessment: {
    likelihood: number;
    impact: number;
    riskScore: number;
    reasoning: string;
  };
  mitigationStrategies: string[];
  complianceMapping: Array<{
    framework: string;
    requirements: string[];
  }>;
}

// OpenAI Provider
export class OpenAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      model: config.model || 'gpt-4',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7
    };
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        finish_reason: data.choices[0]?.finish_reason
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, please respond with "OpenAI connection successful"' }
      ]);
      
      return {
        success: true,
        message: 'OpenAI connection successful',
        model: this.config.model
      };
    } catch (error) {
      return {
        success: false,
        message: `OpenAI connection failed: ${error.message}`
      };
    }
  }
}

// Anthropic Claude Provider
export class AnthropicProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.anthropic.com/v1',
      model: config.model || 'claude-3-sonnet-20240229',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7
    };
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    try {
      // Convert messages to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      const response = await fetch(`${this.config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: conversationMessages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: systemMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return {
        content: data.content[0]?.text || '',
        usage: data.usage,
        model: data.model,
        finish_reason: data.stop_reason
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic request failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, please respond with "Anthropic connection successful"' }
      ]);
      
      return {
        success: true,
        message: 'Anthropic connection successful',
        model: this.config.model
      };
    } catch (error) {
      return {
        success: false,
        message: `Anthropic connection failed: ${error.message}`
      };
    }
  }
}

// Google Gemini Provider
export class GeminiProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta',
      model: config.model || 'gemini-1.5-pro',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7
    };
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    try {
      // Convert messages to Gemini format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      // Add system instruction if present
      const systemMessage = messages.find(m => m.role === 'system')?.content;
      const requestBody: any = {
        contents,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature
        }
      };

      if (systemMessage) {
        requestBody.systemInstruction = {
          parts: [{ text: systemMessage }]
        };
      }

      const response = await fetch(
        `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        content,
        usage: data.usageMetadata ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount
        } : undefined,
        model: this.config.model,
        finish_reason: data.candidates?.[0]?.finishReason
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini request failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, please respond with "Gemini connection successful"' }
      ]);
      
      return {
        success: true,
        message: 'Gemini connection successful',
        model: this.config.model
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini connection failed: ${error.message}`
      };
    }
  }
}

// Cloudflare Workers AI Provider (Llama3 as fallback)
export class CloudflareAIProvider {
  private config: AIProviderConfig & { accountId?: string; apiToken?: string };

  constructor(config: AIProviderConfig & { accountId?: string; apiToken?: string }) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.cloudflare.com/client/v4',
      model: config.model || '@cf/meta/llama-3.1-8b-instruct',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7
    };
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const url = `${this.config.baseUrl}/accounts/${this.config.accountId}/ai/run/${this.config.model}`;
      
      // Convert messages to Cloudflare format
      const prompt = messages.map(m => {
        if (m.role === 'system') return `System: ${m.content}`;
        if (m.role === 'assistant') return `Assistant: ${m.content}`;
        return `User: ${m.content}`;
      }).join('\n\n');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken || this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cloudflare AI error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return {
        content: data.result?.response || data.result?.content || '',
        usage: {
          prompt_tokens: data.result?.usage?.input_tokens,
          completion_tokens: data.result?.usage?.output_tokens,
          total_tokens: data.result?.usage?.total_tokens
        },
        model: this.config.model,
        finish_reason: data.result?.finish_reason
      };
    } catch (error) {
      console.error('Cloudflare AI error:', error);
      throw new Error(`Cloudflare AI request failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, please respond with "Cloudflare AI connection successful"' }
      ]);
      
      return {
        success: true,
        message: 'Cloudflare AI connection successful',
        model: this.config.model
      };
    } catch (error) {
      return {
        success: false,
        message: `Cloudflare AI connection failed: ${error.message}`
      };
    }
  }
}

// Azure OpenAI Provider
export class AzureOpenAIProvider {
  private config: AIProviderConfig & { deployment?: string; apiVersion?: string };

  constructor(config: AIProviderConfig & { deployment?: string; apiVersion?: string }) {
    this.config = {
      ...config,
      deployment: config.deployment || 'gpt-4',
      apiVersion: config.apiVersion || '2024-02-15-preview',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7
    };
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const url = `${this.config.baseUrl}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: this.config.deployment,
        finish_reason: data.choices[0]?.finish_reason
      };
    } catch (error) {
      console.error('Azure OpenAI API error:', error);
      throw new Error(`Azure OpenAI request failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, please respond with "Azure OpenAI connection successful"' }
      ]);
      
      return {
        success: true,
        message: 'Azure OpenAI connection successful',
        model: this.config.deployment
      };
    } catch (error) {
      return {
        success: false,
        message: `Azure OpenAI connection failed: ${error.message}`
      };
    }
  }
}

// Main AI Service Manager
export class AIService {
  private providers: Map<string, OpenAIProvider | AnthropicProvider | GeminiProvider | AzureOpenAIProvider | CloudflareAIProvider> = new Map();

  constructor(configs: Record<string, AIProviderConfig & { type: 'openai' | 'anthropic' | 'gemini' | 'azure-openai' | 'cloudflare'; deployment?: string; apiVersion?: string; accountId?: string; apiToken?: string }>) {
    for (const [name, config] of Object.entries(configs)) {
      // For cloudflare, we can work without API key (using binding)
      if (!config.apiKey && config.type !== 'cloudflare') continue;

      switch (config.type) {
        case 'openai':
          this.providers.set(name, new OpenAIProvider(config));
          break;
        case 'anthropic':
          this.providers.set(name, new AnthropicProvider(config));
          break;
        case 'gemini':
          this.providers.set(name, new GeminiProvider(config));
          break;
        case 'azure-openai':
          this.providers.set(name, new AzureOpenAIProvider(config));
          break;
        case 'cloudflare':
          this.providers.set(name, new CloudflareAIProvider(config));
          break;
      }
    }
  }

  getProvider(name: string) {
    return this.providers.get(name);
  }

  async testAllConnections(): Promise<Record<string, { success: boolean; message: string; model?: string }>> {
    const results: Record<string, { success: boolean; message: string; model?: string }> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.testConnection();
      } catch (error) {
        results[name] = {
          success: false,
          message: `Test failed: ${error.message}`
        };
      }
    }
    
    return results;
  }

  async analyzeRisk(request: RiskAnalysisRequest, providerName?: string): Promise<RiskAnalysisResponse> {
    const provider = providerName ? this.providers.get(providerName) : this.providers.values().next().value;
    
    if (!provider) {
      throw new Error('No AI provider available');
    }

    const systemPrompt = `You are an expert cybersecurity risk analyst. Analyze the provided risk information and return a comprehensive assessment in JSON format.

    Required JSON structure:
    {
      "controlSuggestions": [
        {
          "framework": "SOC2|ISO27001|NIST",
          "controlId": "string",
          "controlName": "string", 
          "relevance": 1-10,
          "rationale": "string"
        }
      ],
      "riskAssessment": {
        "likelihood": 1-5,
        "impact": 1-5,
        "riskScore": 1-25,
        "reasoning": "string"
      },
      "mitigationStrategies": ["string"],
      "complianceMapping": [
        {
          "framework": "string",
          "requirements": ["string"]
        }
      ]
    }`;

    const userPrompt = `Analyze this risk:

    Title: ${request.title}
    Description: ${request.description}
    Category: ${request.category || 'Not specified'}
    Affected Services: ${request.affectedServices?.join(', ') || 'Not specified'}
    Existing Controls: ${request.existingControls?.join(', ') || 'None specified'}

    Provide a comprehensive risk analysis with control suggestions from SOC2, ISO27001, and NIST frameworks.`;

    try {
      const response = await provider.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Try to parse JSON response
      try {
        const analysis = JSON.parse(response.content);
        return analysis;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.createFallbackAnalysis(request);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error(`Risk analysis failed: ${error.message}`);
    }
  }

  private createFallbackAnalysis(request: RiskAnalysisRequest): RiskAnalysisResponse {
    // Provide a reasonable fallback analysis if AI fails
    return {
      controlSuggestions: [
        {
          framework: 'SOC2',
          controlId: 'CC6.1',
          controlName: 'Risk Assessment Process',
          relevance: 8,
          rationale: 'Recommended based on risk management best practices'
        }
      ],
      riskAssessment: {
        likelihood: 3,
        impact: 3,
        riskScore: 9,
        reasoning: 'Medium risk based on standard assessment criteria'
      },
      mitigationStrategies: [
        'Implement regular security assessments',
        'Establish monitoring and alerting procedures',
        'Create incident response procedures'
      ],
      complianceMapping: [
        {
          framework: 'SOC2',
          requirements: ['CC6.1 - Risk Assessment', 'CC7.1 - Risk Mitigation']
        }
      ]
    };
  }
}

/**
 * Factory function to create AI service from environment/config
 */
export function createAIService(env?: any): AIService | null {
  const configs: Record<string, any> = {};

  // OpenAI configuration
  if (env?.OPENAI_API_KEY) {
    configs.openai = {
      type: 'openai',
      name: 'OpenAI',
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || 'gpt-4',
      baseUrl: env.OPENAI_BASE_URL
    };
  }

  // Anthropic configuration
  if (env?.ANTHROPIC_API_KEY) {
    configs.anthropic = {
      type: 'anthropic',
      name: 'Anthropic',
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
    };
  }

  // Google Gemini configuration
  if (env?.GEMINI_API_KEY) {
    configs.gemini = {
      type: 'gemini',
      name: 'Gemini',
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL || 'gemini-1.5-pro'
    };
  }

  // Azure OpenAI configuration
  if (env?.AZURE_OPENAI_API_KEY && env?.AZURE_OPENAI_ENDPOINT) {
    configs.azure = {
      type: 'azure-openai',
      name: 'Azure OpenAI',
      apiKey: env.AZURE_OPENAI_API_KEY,
      baseUrl: env.AZURE_OPENAI_ENDPOINT,
      deployment: env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
      apiVersion: env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    };
  }

  // Cloudflare AI configuration (fallback - always available)
  configs.cloudflare = {
    type: 'cloudflare',
    name: 'Cloudflare Llama3 (Fallback)',
    apiKey: env?.CF_API_TOKEN || 'fallback',
    accountId: env?.CF_ACCOUNT_ID,
    apiToken: env?.CF_API_TOKEN,
    model: env?.CF_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct'
  };

  console.log(`AI Service initialized with ${Object.keys(configs).length} providers:`, Object.keys(configs));

  if (Object.keys(configs).length === 0) {
    console.warn('No AI provider configurations found. Configure at least one provider.');
    return null;
  }

  return new AIService(configs);
}

/**
 * Default export
 */
export default AIService;