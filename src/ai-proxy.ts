// Secure AI Proxy Service - Server-side API key management
// Handles all AI provider communications securely

import { Hono } from 'hono';
import { CloudflareBindings } from './types';
import { authMiddleware } from './auth';

export interface AIProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIProxyRequest {
  message: string;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'auto';
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProxyResponse {
  success: boolean;
  data?: {
    response: string;
    provider: string;
    model: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  error?: string;
}

export function createAIProxyAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Get user's AI provider configuration (no API keys returned)
  app.get('/config', authMiddleware, async (c) => {
    try {
      const userId = c.get('user')?.id;
      
      // Get user's AI provider preferences from database
      const userConfig = await c.env.DB.prepare(`
        SELECT provider_configs FROM users WHERE id = ?
      `).bind(userId).first();

      let providerConfigs = {};
      if (userConfig?.provider_configs) {
        try {
          providerConfigs = JSON.parse(userConfig.provider_configs);
        } catch (e) {
          console.log('Failed to parse provider configs, using defaults');
        }
      }

      // Return configuration without API keys (security)
      const safeConfig = {
        openai: {
          enabled: !!(c.env.OPENAI_API_KEY && providerConfigs.openai?.priority > 0),
          priority: providerConfigs.openai?.priority || 1,
          model: providerConfigs.openai?.model || 'gpt-4o',
          maxTokens: providerConfigs.openai?.maxTokens || 1500,
          temperature: providerConfigs.openai?.temperature || 0.7
        },
        anthropic: {
          enabled: !!(c.env.ANTHROPIC_API_KEY && providerConfigs.anthropic?.priority > 0),
          priority: providerConfigs.anthropic?.priority || 2,
          model: providerConfigs.anthropic?.model || 'claude-3-5-sonnet-20241022',
          maxTokens: providerConfigs.anthropic?.maxTokens || 1500,
          temperature: providerConfigs.anthropic?.temperature || 0.7
        },
        gemini: {
          enabled: !!(c.env.GEMINI_API_KEY && providerConfigs.gemini?.priority > 0),
          priority: providerConfigs.gemini?.priority || 3,
          model: providerConfigs.gemini?.model || 'gemini-pro',
          maxTokens: providerConfigs.gemini?.maxTokens || 1500,
          temperature: providerConfigs.gemini?.temperature || 0.7
        }
      };

      return c.json({
        success: true,
        data: safeConfig
      });
    } catch (error) {
      console.error('AI config error:', error);
      return c.json({
        success: false,
        error: 'Failed to load AI configuration'
      }, 500);
    }
  });

  // Save user's AI provider preferences (no API keys stored)
  app.post('/config', authMiddleware, async (c) => {
    try {
      const userId = c.get('user')?.id;
      const { providerConfigs } = await c.req.json();

      // Validate and sanitize configuration (remove any API keys if sent)
      const sanitizedConfigs = {};
      for (const [provider, config] of Object.entries(providerConfigs)) {
        if (typeof config === 'object' && config !== null) {
          sanitizedConfigs[provider] = {
            priority: parseInt(config.priority) || 0,
            model: config.model || '',
            maxTokens: parseInt(config.maxTokens) || 1500,
            temperature: parseFloat(config.temperature) || 0.7
          };
          // Explicitly remove any API keys
          delete sanitizedConfigs[provider].apiKey;
        }
      }

      // Save to database
      await c.env.DB.prepare(`
        UPDATE users SET provider_configs = ? WHERE id = ?
      `).bind(JSON.stringify(sanitizedConfigs), userId).run();

      return c.json({
        success: true,
        message: 'AI provider configuration saved successfully'
      });
    } catch (error) {
      console.error('AI config save error:', error);
      return c.json({
        success: false,
        error: 'Failed to save AI configuration'
      }, 500);
    }
  });

  // Main AI chat endpoint - secure proxy
  app.post('/chat', authMiddleware, async (c) => {
    try {
      const userId = c.get('user')?.id;
      const { message, provider, context, maxTokens, temperature }: AIProxyRequest = await c.req.json();

      if (!message?.trim()) {
        return c.json({
          success: false,
          error: 'Message is required'
        }, 400);
      }

      // Get user's provider configuration
      const userConfig = await c.env.DB.prepare(`
        SELECT provider_configs FROM users WHERE id = ?
      `).bind(userId).first();

      let providerConfigs = {};
      if (userConfig?.provider_configs) {
        try {
          providerConfigs = JSON.parse(userConfig.provider_configs);
        } catch (e) {
          console.log('Using default provider configs');
        }
      }

      // Determine which provider to use
      const selectedProvider = await selectOptimalProvider(c.env, provider, providerConfigs);
      
      if (!selectedProvider) {
        return c.json({
          success: false,
          error: 'No AI providers are configured. Please contact your administrator to set up API keys.'
        }, 503);
      }

      // Make secure API call
      const response = await makeAIRequest(c.env, selectedProvider, {
        message,
        context,
        maxTokens: maxTokens || providerConfigs[selectedProvider.name]?.maxTokens || 1500,
        temperature: temperature || providerConfigs[selectedProvider.name]?.temperature || 0.7,
        model: providerConfigs[selectedProvider.name]?.model || selectedProvider.defaultModel
      });

      // Log usage for monitoring
      await logAIUsage(c.env, userId, selectedProvider.name, response.usage);

      return c.json({
        success: true,
        data: {
          response: response.content,
          provider: selectedProvider.name,
          model: response.model,
          usage: response.usage
        }
      });

    } catch (error) {
      console.error('AI chat error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to process AI request'
      }, 500);
    }
  });

  // Test AI provider connections (admin only)
  app.post('/test-connections', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      if (user?.role !== 'admin') {
        return c.json({
          success: false,
          error: 'Admin access required'
        }, 403);
      }

      const results = {};
      
      // Test OpenAI
      if (c.env.OPENAI_API_KEY) {
        try {
          await testOpenAIConnection(c.env.OPENAI_API_KEY);
          results.openai = { status: 'connected', error: null };
        } catch (error) {
          results.openai = { status: 'failed', error: error.message };
        }
      } else {
        results.openai = { status: 'not_configured', error: 'API key not set' };
      }

      // Test Anthropic
      if (c.env.ANTHROPIC_API_KEY) {
        try {
          await testAnthropicConnection(c.env.ANTHROPIC_API_KEY);
          results.anthropic = { status: 'connected', error: null };
        } catch (error) {
          results.anthropic = { status: 'failed', error: error.message };
        }
      } else {
        results.anthropic = { status: 'not_configured', error: 'API key not set' };
      }

      // Test Gemini
      if (c.env.GEMINI_API_KEY) {
        try {
          await testGeminiConnection(c.env.GEMINI_API_KEY);
          results.gemini = { status: 'connected', error: null };
        } catch (error) {
          results.gemini = { status: 'failed', error: error.message };
        }
      } else {
        results.gemini = { status: 'not_configured', error: 'API key not set' };
      }

      return c.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Connection test error:', error);
      return c.json({
        success: false,
        error: 'Failed to test connections'
      }, 500);
    }
  });

  return app;
}

// Helper function to select optimal provider based on priority and availability
async function selectOptimalProvider(env: CloudflareBindings, requestedProvider: string | undefined, userConfigs: any) {
  const providers = [
    {
      name: 'openai',
      apiKey: env.OPENAI_API_KEY,
      priority: userConfigs.openai?.priority || 1,
      defaultModel: 'gpt-4o'
    },
    {
      name: 'anthropic',
      apiKey: env.ANTHROPIC_API_KEY,
      priority: userConfigs.anthropic?.priority || 2,
      defaultModel: 'claude-3-5-sonnet-20241022'
    },
    {
      name: 'gemini',
      apiKey: env.GEMINI_API_KEY,
      priority: userConfigs.gemini?.priority || 3,
      defaultModel: 'gemini-pro'
    }
  ];

  // Filter available providers (have API keys and priority > 0)
  const availableProviders = providers.filter(p => 
    p.apiKey && p.priority > 0
  );

  if (availableProviders.length === 0) {
    return null;
  }

  // If specific provider requested, use it if available
  if (requestedProvider && requestedProvider !== 'auto') {
    const requested = availableProviders.find(p => p.name === requestedProvider);
    if (requested) {
      return requested;
    }
  }

  // Sort by priority and return the highest priority provider
  availableProviders.sort((a, b) => a.priority - b.priority);
  return availableProviders[0];
}

// Secure API request functions
async function makeAIRequest(env: CloudflareBindings, provider: any, params: any) {
  switch (provider.name) {
    case 'openai':
      return await makeOpenAIRequest(env.OPENAI_API_KEY, params);
    case 'anthropic':
      return await makeAnthropicRequest(env.ANTHROPIC_API_KEY, params);
    case 'gemini':
      return await makeGeminiRequest(env.GEMINI_API_KEY, params);
    default:
      throw new Error('Unsupported provider');
  }
}

async function makeOpenAIRequest(apiKey: string, params: any) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        {
          role: 'system',
          content: params.context || 'You are ARIA, an AI Risk Assistant. Provide helpful, accurate information about risk management, compliance, and security.'
        },
        {
          role: 'user',
          content: params.message
        }
      ],
      max_tokens: params.maxTokens,
      temperature: params.temperature
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || 'No response',
    model: data.model,
    usage: data.usage
  };
}

async function makeAnthropicRequest(apiKey: string, params: any) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      system: params.context || 'You are ARIA, an AI Risk Assistant. Provide helpful, accurate information about risk management, compliance, and security.',
      messages: [
        {
          role: 'user',
          content: params.message
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || 'No response',
    model: data.model,
    usage: data.usage
  };
}

async function makeGeminiRequest(apiKey: string, params: any) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${params.context || 'You are ARIA, an AI Risk Assistant. Provide helpful, accurate information about risk management, compliance, and security.'}\n\nUser: ${params.message}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: params.temperature,
        maxOutputTokens: params.maxTokens
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0]?.content?.parts[0]?.text || 'No response',
    model: params.model,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0
    }
  };
}

// Connection test functions
async function testOpenAIConnection(apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI connection failed: ${response.status}`);
  }
}

async function testAnthropicConnection(apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic connection failed: ${response.status}`);
  }
}

async function testGeminiConnection(apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  
  if (!response.ok) {
    throw new Error(`Gemini connection failed: ${response.status}`);
  }
}

// Usage logging for monitoring and billing protection
async function logAIUsage(env: CloudflareBindings, userId: string, provider: string, usage: any) {
  try {
    await env.DB.prepare(`
      INSERT INTO ai_usage_logs (user_id, provider, model, prompt_tokens, completion_tokens, total_tokens, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      userId,
      provider,
      usage?.model || 'unknown',
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
      usage?.total_tokens || 0
    ).run();
  } catch (error) {
    console.error('Failed to log AI usage:', error);
    // Don't throw - usage logging failure shouldn't break the main functionality
  }
}