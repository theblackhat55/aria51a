// AI Provider Integration Service for ARIA5.1
// Supports OpenAI, Anthropic, Google Gemini, and Azure OpenAI
// Designed for Cloudflare Workers compatibility

export interface AIProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'azure' | 'local';
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface RiskAnalysisRequest {
  riskData: any;
  context?: string;
  analysisType: 'assessment' | 'mitigation' | 'prediction' | 'recommendation';
}

export interface ComplianceAnalysisRequest {
  frameworkData: any;
  controlData: any;
  analysisType: 'gap' | 'mapping' | 'assessment' | 'recommendation';
}

export class AIProviderService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider?: string;

  constructor() {
    // Initialize with default configurations
  }

  /**
   * Register an AI provider
   */
  registerProvider(id: string, provider: AIProvider): void {
    this.providers.set(id, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = id;
    }
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(providerId: string): void {
    if (this.providers.has(providerId)) {
      this.defaultProvider = providerId;
    }
  }

  /**
   * Get available providers
   */
  getProviders(): { id: string; name: string; type: string; model: string }[] {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.name,
      type: provider.type,
      model: provider.model
    }));
  }

  /**
   * Test provider connection
   */
  async testProvider(providerId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, message: 'Provider not found' };
    }

    const startTime = Date.now();
    
    try {
      const response = await this.generateCompletion(
        'Test connection. Respond with "Connection successful."',
        providerId
      );
      
      const latency = Date.now() - startTime;
      
      if (response.content.toLowerCase().includes('connection successful')) {
        return { success: true, message: 'Connection successful', latency };
      } else {
        return { success: false, message: 'Unexpected response from provider' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Generate AI completion
   */
  async generateCompletion(
    prompt: string, 
    providerId?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<AIResponse> {
    const provider = this.providers.get(providerId || this.defaultProvider || '');
    if (!provider) {
      throw new Error('No AI provider available');
    }

    switch (provider.type) {
      case 'openai':
        return this.callOpenAI(provider, prompt, options);
      case 'anthropic':
        return this.callAnthropic(provider, prompt, options);
      case 'google':
        return this.callGoogleGemini(provider, prompt, options);
      case 'azure':
        return this.callAzureOpenAI(provider, prompt, options);
      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }

  /**
   * Analyze risk using AI
   */
  async analyzeRisk(request: RiskAnalysisRequest, providerId?: string): Promise<AIResponse> {
    const systemPrompt = `You are an expert cybersecurity risk analyst. Analyze the provided risk data and provide detailed insights based on the analysis type requested.

Analysis Type: ${request.analysisType}

Guidelines:
- For 'assessment': Evaluate the risk level, likelihood, and potential impact
- For 'mitigation': Suggest specific mitigation strategies and controls
- For 'prediction': Forecast how this risk might evolve over time
- For 'recommendation': Provide actionable recommendations for risk management

Provide a structured analysis with:
1. Executive Summary
2. Detailed Analysis
3. Risk Score (1-25 scale)
4. Recommended Actions
5. Timeline for Implementation

Context: ${request.context || 'No additional context provided'}`;

    const prompt = `Risk Data:
${JSON.stringify(request.riskData, null, 2)}

Please provide a comprehensive risk analysis.`;

    return this.generateCompletion(prompt, providerId, { 
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.3 
    });
  }

  /**
   * Analyze compliance using AI
   */
  async analyzeCompliance(request: ComplianceAnalysisRequest, providerId?: string): Promise<AIResponse> {
    const systemPrompt = `You are an expert compliance and governance consultant. Analyze the provided compliance data and provide detailed insights based on the analysis type requested.

Analysis Type: ${request.analysisType}

Guidelines:
- For 'gap': Identify compliance gaps and missing controls
- For 'mapping': Map controls to framework requirements
- For 'assessment': Evaluate current compliance status
- For 'recommendation': Provide specific compliance improvement recommendations

Provide a structured analysis with:
1. Compliance Status Overview
2. Gap Analysis
3. Control Effectiveness Assessment
4. Recommended Improvements
5. Implementation Roadmap`;

    const prompt = `Framework Data:
${JSON.stringify(request.frameworkData, null, 2)}

Control Data:
${JSON.stringify(request.controlData, null, 2)}

Please provide a comprehensive compliance analysis.`;

    return this.generateCompletion(prompt, providerId, {
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.2
    });
  }

  /**
   * Generate security recommendations
   */
  async generateSecurityRecommendations(
    securityData: any,
    focusAreas: string[],
    providerId?: string
  ): Promise<AIResponse> {
    const systemPrompt = `You are a cybersecurity expert specializing in security architecture and risk management. Generate actionable security recommendations based on the provided data.

Focus Areas: ${focusAreas.join(', ')}

Provide recommendations in the following format:
1. Immediate Actions (0-30 days)
2. Short-term Improvements (1-3 months)
3. Long-term Strategic Initiatives (3-12 months)
4. Budget Considerations
5. Risk Prioritization`;

    const prompt = `Security Context Data:
${JSON.stringify(securityData, null, 2)}

Please generate comprehensive security recommendations focusing on the specified areas.`;

    return this.generateCompletion(prompt, providerId, {
      systemPrompt,
      maxTokens: 1500,
      temperature: 0.4
    });
  }

  /**
   * OpenAI API integration
   */
  private async callOpenAI(
    provider: AIProvider, 
    prompt: string, 
    options?: any
  ): Promise<AIResponse> {
    const messages = [
      ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content: prompt }
    ];

    const response = await fetch(`${provider.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: options?.maxTokens || provider.maxTokens || 1000,
        temperature: options?.temperature || provider.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: provider.model,
      provider: provider.name
    };
  }

  /**
   * Anthropic Claude API integration
   */
  private async callAnthropic(
    provider: AIProvider, 
    prompt: string, 
    options?: any
  ): Promise<AIResponse> {
    const messages = [
      { role: 'user', content: `${options?.systemPrompt || ''}\n\n${prompt}` }
    ];

    const response = await fetch(`${provider.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: options?.maxTokens || provider.maxTokens || 1000,
        temperature: options?.temperature || provider.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      model: provider.model,
      provider: provider.name
    };
  }

  /**
   * Google Gemini API integration
   */
  private async callGoogleGemini(
    provider: AIProvider, 
    prompt: string, 
    options?: any
  ): Promise<AIResponse> {
    const fullPrompt = options?.systemPrompt ? 
      `${options.systemPrompt}\n\nUser: ${prompt}` : 
      prompt;

    const response = await fetch(
      `${provider.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: options?.maxTokens || provider.maxTokens || 1000,
            temperature: options?.temperature || provider.temperature || 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Google Gemini API');
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      } : undefined,
      model: provider.model,
      provider: provider.name
    };
  }

  /**
   * Azure OpenAI API integration
   */
  private async callAzureOpenAI(
    provider: AIProvider, 
    prompt: string, 
    options?: any
  ): Promise<AIResponse> {
    const messages = [
      ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content: prompt }
    ];

    // Azure OpenAI requires specific URL format: 
    // https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
    const response = await fetch(`${provider.baseUrl}/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'api-key': provider.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens: options?.maxTokens || provider.maxTokens || 1000,
        temperature: options?.temperature || provider.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: provider.model,
      provider: provider.name
    };
  }
}

// AI Provider Management for Database Storage
export class AIProviderManager {
  private db: any; // DatabaseService instance
  private service: AIProviderService;

  constructor(db: any) {
    this.db = db;
    this.service = new AIProviderService();
  }

  /**
   * Load AI providers from database and register them
   */
  async loadProvidersFromDatabase(organizationId: number = 1): Promise<void> {
    try {
      const providers = await this.db.getAIConfigurations(organizationId);
      
      for (const config of providers) {
        if (config.is_active && config.api_key_encrypted) {
          // In production, decrypt the API key
          const provider: AIProvider = {
            name: `${config.provider} (${config.model_name})`,
            type: config.provider as any,
            apiKey: config.api_key_encrypted, // In production: await decrypt(config.api_key_encrypted)
            baseUrl: config.endpoint_url,
            model: config.model_name,
            maxTokens: config.max_tokens,
            temperature: config.temperature
          };

          this.service.registerProvider(`${config.provider}-${config.id}`, provider);
        }
      }
    } catch (error) {
      console.error('Failed to load AI providers from database:', error);
    }
  }

  /**
   * Save AI provider configuration to database
   */
  async saveProviderConfiguration(
    organizationId: number,
    config: {
      provider: string;
      apiKey: string;
      endpointUrl?: string;
      modelName: string;
      maxTokens?: number;
      temperature?: number;
    },
    userId: number
  ): Promise<number> {
    // In production, encrypt the API key before saving
    const encryptedKey = config.apiKey; // In production: await encrypt(config.apiKey)
    
    const result = await this.db.saveAIConfiguration({
      organization_id: organizationId,
      provider: config.provider,
      api_key_encrypted: encryptedKey,
      endpoint_url: config.endpointUrl,
      model_name: config.modelName,
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      is_active: true
    }, userId);

    // Reload providers to include the new one
    await this.loadProvidersFromDatabase(organizationId);

    return result;
  }

  /**
   * Test all configured providers
   */
  async testAllProviders(): Promise<Array<{ id: string; success: boolean; message: string; latency?: number }>> {
    const providers = this.service.getProviders();
    const results = [];

    for (const provider of providers) {
      try {
        const result = await this.service.testProvider(provider.id);
        results.push({ id: provider.id, ...result });
      } catch (error) {
        results.push({
          id: provider.id,
          success: false,
          message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  /**
   * Get the AI service instance
   */
  getService(): AIProviderService {
    return this.service;
  }
}

// Enhanced database methods for AI configurations
export interface AIConfigurationDB {
  id?: number;
  organization_id: number;
  provider: string;
  api_key_encrypted: string;
  endpoint_url?: string;
  model_name: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}