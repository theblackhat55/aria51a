// ARIA Platform v6.0 - Advanced LLM-Powered Risk Assessment
// Provides intelligent risk analysis using OpenAI/Anthropic/Gemini with service criticality context

import { CloudflareBindings } from './types';

export interface LLMRiskAssessmentRequest {
  title: string;
  description: string;
  services: string[];
  threat_source: string;
  service_criticalities?: { [serviceName: string]: 'critical' | 'high' | 'medium' | 'low' };
}

export interface LLMRiskAssessmentResponse {
  probability: number; // 1-5 scale
  impact: number; // 1-5 scale
  risk_score: number; // probability * impact
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  service_impact_analysis: string;
  recommendations: string[];
  confidence_level: number; // 0.0-1.0
  ai_provider: string;
  assessment_type: 'llm_powered' | 'algorithm_based';
}

export class LLMRiskAssessmentEngine {
  private env: CloudflareBindings;
  private aiProviders: AIProvider[];

  constructor(env: CloudflareBindings) {
    this.env = env;
    this.aiProviders = [
      { name: 'openai', priority: 1, enabled: true },
      { name: 'anthropic', priority: 2, enabled: true },
      { name: 'gemini', priority: 3, enabled: true }
    ];
  }

  async performLLMRiskAssessment(request: LLMRiskAssessmentRequest): Promise<LLMRiskAssessmentResponse> {
    try {
      // Get service criticality data from database
      const serviceCriticalities = await this.getServiceCriticalities(request.services);
      
      // Build comprehensive prompt for LLM
      const prompt = this.buildRiskAssessmentPrompt(request, serviceCriticalities);
      
      // Call LLM with intelligent prompt
      const aiResponse = await this.callLLMProvider(prompt);
      
      // Parse and validate LLM response
      const assessment = this.parseLLMResponse(aiResponse);
      
      // Add confidence scoring based on data completeness
      assessment.confidence_level = this.calculateConfidenceLevel(request, serviceCriticalities);
      assessment.assessment_type = 'llm_powered';
      
      return assessment;
    } catch (error) {
      console.error('LLM Risk Assessment Error:', error);
      // Fallback to algorithm-based assessment
      return this.fallbackAssessment(request);
    }
  }

  private buildRiskAssessmentPrompt(
    request: LLMRiskAssessmentRequest, 
    serviceCriticalities: { [key: string]: string }
  ): string {
    const serviceAnalysis = this.buildServiceCriticalityAnalysis(request.services, serviceCriticalities);
    
    return `You are a senior cybersecurity and enterprise risk management expert. Analyze the following risk scenario and provide a comprehensive assessment.

**RISK INFORMATION:**
Title: ${request.title}
Description: ${request.description}
Threat Source: ${request.threat_source}

**ASSOCIATED SERVICES & CRITICALITY:**
${serviceAnalysis}

**ASSESSMENT FRAMEWORK:**
Probability Scale (1-5):
1 = Very Low (0-10% chance in next 12 months)
2 = Low (11-25% chance)
3 = Medium (26-50% chance)  
4 = High (51-75% chance)
5 = Very High (76-100% chance)

Impact Scale (1-5):
1 = Very Low (minimal business disruption, <$10K impact)
2 = Low (limited disruption, $10K-$100K impact)
3 = Medium (moderate disruption, $100K-$1M impact)
4 = High (significant disruption, $1M-$10M impact)
5 = Very High (severe/catastrophic disruption, >$10M impact)

**CRITICAL ANALYSIS FACTORS:**
1. Service Criticality Impact: How does the criticality of affected services influence the overall risk?
2. Threat Source Context: How does "${request.threat_source}" affect probability and impact?
3. Cascading Effects: What secondary impacts could occur through service dependencies?
4. Business Continuity: How would this risk affect business operations?
5. Recovery Complexity: How difficult would recovery be given the service criticalities?

**REQUIRED RESPONSE FORMAT (JSON):**
{
  "probability": <1-5 integer>,
  "probability_reasoning": "<detailed reasoning for probability score>",
  "impact": <1-5 integer>,
  "impact_reasoning": "<detailed reasoning for impact score, emphasizing service criticality effects>",
  "risk_score": <probability * impact>,
  "risk_level": "<critical|high|medium|low based on risk_score: 20-25=critical, 12-19=high, 6-11=medium, 1-5=low>",
  "service_impact_analysis": "<analysis of how service criticalities affect the overall risk>",
  "recommendations": ["<specific actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "key_concerns": ["<top concern 1>", "<concern 2>", "<concern 3>"]
}

Provide a thorough, professional risk assessment that considers the specific service criticalities and their business impact.`;
  }

  private buildServiceCriticalityAnalysis(services: string[], serviceCriticalities: { [key: string]: string }): string {
    if (!services || services.length === 0) {
      return "No specific services identified - general business impact assessment required.";
    }

    let analysis = "";
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    services.forEach(service => {
      const criticality = serviceCriticalities[service] || 'medium';
      analysis += `- ${service}: ${criticality.toUpperCase()} criticality\n`;
      
      switch (criticality) {
        case 'critical': criticalCount++; break;
        case 'high': highCount++; break;
        case 'medium': mediumCount++; break;
        case 'low': lowCount++; break;
      }
    });

    analysis += `\n**CRITICALITY SUMMARY:**\n`;
    analysis += `Critical Services: ${criticalCount}\n`;
    analysis += `High Criticality: ${highCount}\n`;
    analysis += `Medium Criticality: ${mediumCount}\n`;
    analysis += `Low Criticality: ${lowCount}\n`;

    if (criticalCount > 0) {
      analysis += `\n⚠️ CRITICAL SERVICES AT RISK: This risk directly affects ${criticalCount} critical business service(s), requiring maximum impact consideration.`;
    }

    return analysis;
  }

  private async getServiceCriticalities(services: string[]): Promise<{ [key: string]: string }> {
    if (!services || services.length === 0) return {};

    try {
      const placeholders = services.map(() => '?').join(',');
      const result = await this.env.DB.prepare(`
        SELECT name, criticality
        FROM services 
        WHERE name IN (${placeholders})
      `).bind(...services).all();

      const criticalities: { [key: string]: string } = {};
      result.results?.forEach((row: any) => {
        criticalities[row.name] = row.criticality || 'medium';
      });

      return criticalities;
    } catch (error) {
      console.error('Error fetching service criticalities:', error);
      return {};
    }
  }

  private async callLLMProvider(prompt: string): Promise<string> {
    // Get AI provider configuration from settings
    const aiSettings = await this.getAIProviderSettings();
    
    // Try providers in priority order
    for (const provider of this.aiProviders.filter(p => p.enabled)) {
      try {
        const settings = aiSettings[provider.name];
        if (!settings?.enabled) continue;

        switch (provider.name) {
          case 'openai':
            return await this.callOpenAI(prompt, settings);
          case 'anthropic':
            return await this.callAnthropic(prompt, settings);
          case 'gemini':
            return await this.callGemini(prompt, settings);
        }
      } catch (error) {
        console.error(`${provider.name} failed, trying next provider:`, error);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  private async callOpenAI(prompt: string, settings: any): Promise<string> {
    const apiKey = await this.getProviderAPIKey('openai');
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a senior cybersecurity and enterprise risk management expert. Provide accurate, professional risk assessments in the exact JSON format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: settings.maxTokens || 1500,
        temperature: settings.temperature || 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callAnthropic(prompt: string, settings: any): Promise<string> {
    const apiKey = await this.getProviderAPIKey('anthropic');
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: settings.model || 'claude-3-5-sonnet-20241022',
        max_tokens: settings.maxTokens || 1500,
        temperature: settings.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nIMPORTANT: Respond only with valid JSON in the exact format specified above.`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  private async callGemini(prompt: string, settings: any): Promise<string> {
    const apiKey = await this.getProviderAPIKey('gemini');
    if (!apiKey) throw new Error('Gemini API key not configured');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-pro'}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nIMPORTANT: Respond only with valid JSON in the exact format specified above.`
          }]
        }],
        generationConfig: {
          maxOutputTokens: settings.maxTokens || 1500,
          temperature: settings.temperature || 0.3,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  private async getProviderAPIKey(provider: string): Promise<string | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT encrypted_key_data
        FROM user_api_keys 
        WHERE user_id = 1 AND provider = ? AND deleted_at IS NULL
      `).bind(provider).first();

      if (!result) return null;

      // In production, decrypt the key here
      return result.encrypted_key_data as string;
    } catch (error) {
      console.error(`Error retrieving ${provider} API key:`, error);
      return null;
    }
  }

  private async getAIProviderSettings(): Promise<any> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT config_data
        FROM ai_provider_configs 
        WHERE user_id = 1
      `).first();

      return result ? JSON.parse(result.config_data as string) : {
        openai: { enabled: true, model: 'gpt-4o', maxTokens: 1500, temperature: 0.3 },
        anthropic: { enabled: true, model: 'claude-3-5-sonnet-20241022', maxTokens: 1500, temperature: 0.3 },
        gemini: { enabled: true, model: 'gemini-pro', maxTokens: 1500, temperature: 0.3 }
      };
    } catch (error) {
      console.error('Error retrieving AI settings:', error);
      // Return defaults
      return {
        openai: { enabled: true, model: 'gpt-4o', maxTokens: 1500, temperature: 0.3 },
        anthropic: { enabled: true, model: 'claude-3-5-sonnet-20241022', maxTokens: 1500, temperature: 0.3 },
        gemini: { enabled: true, model: 'gemini-pro', maxTokens: 1500, temperature: 0.3 }
      };
    }
  }

  private parseLLMResponse(aiResponse: string): LLMRiskAssessmentResponse {
    try {
      const parsed = JSON.parse(aiResponse);
      
      return {
        probability: parsed.probability || 3,
        impact: parsed.impact || 3,
        risk_score: parsed.risk_score || (parsed.probability * parsed.impact),
        risk_level: parsed.risk_level || this.calculateRiskLevel(parsed.risk_score || 9),
        reasoning: `Probability (${parsed.probability}/5): ${parsed.probability_reasoning || 'Assessment based on risk factors'}\n\nImpact (${parsed.impact}/5): ${parsed.impact_reasoning || 'Impact assessment completed'}`,
        service_impact_analysis: parsed.service_impact_analysis || 'Service impact analysis completed',
        recommendations: parsed.recommendations || ['Regular monitoring and review', 'Implement mitigation controls', 'Update risk assessment periodically'],
        confidence_level: 0.9, // Will be updated by calculateConfidenceLevel
        ai_provider: 'llm',
        assessment_type: 'llm_powered'
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      throw new Error('Invalid LLM response format');
    }
  }

  private calculateRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  }

  private calculateConfidenceLevel(request: LLMRiskAssessmentRequest, serviceCriticalities: any): number {
    let confidence = 0.6; // Base confidence for LLM analysis

    // Boost confidence based on data completeness
    if (request.title && request.title.length > 10) confidence += 0.1;
    if (request.description && request.description.length > 20) confidence += 0.1;
    if (request.threat_source && request.threat_source !== 'unknown') confidence += 0.1;
    if (Object.keys(serviceCriticalities).length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private fallbackAssessment(request: LLMRiskAssessmentRequest): LLMRiskAssessmentResponse {
    // Basic algorithm-based fallback when LLM fails
    const probability = Math.min(5, Math.max(1, 3)); // Default to medium
    const impact = Math.min(5, Math.max(1, 3)); // Default to medium

    return {
      probability,
      impact,
      risk_score: probability * impact,
      risk_level: this.calculateRiskLevel(probability * impact),
      reasoning: 'Fallback assessment - LLM analysis temporarily unavailable. Basic risk assessment applied.',
      service_impact_analysis: 'Service impact requires manual assessment.',
      recommendations: ['Configure AI provider settings', 'Retry risk assessment', 'Perform manual risk analysis'],
      confidence_level: 0.3,
      ai_provider: 'fallback',
      assessment_type: 'algorithm_based'
    };
  }
}

interface AIProvider {
  name: string;
  priority: number;
  enabled: boolean;
}