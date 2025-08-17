// API Factory - Creates all API routes
import { Hono } from 'hono';
import { CloudflareBindings } from './types';
import { createRAGAPI } from './api/rag';
import { createARIAAPI } from './api/aria';
import { createAIGRCAPI } from './ai-grc-api';

export function createAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // RAG system routes
  const ragAPI = createRAGAPI();
  app.route('/api/rag', ragAPI);

  // Enhanced ARIA routes
  const ariaAPI = createARIAAPI();
  app.route('/api/aria', ariaAPI);

  // AI GRC routes
  const aiGrcAPI = createAIGRCAPI();
  app.route('/api/ai-grc', aiGrcAPI);

  // Legacy ARIA route for backwards compatibility
  app.post('/api/aria/query', async (c) => {
    // Forward to new enhanced ARIA endpoint
    return ariaAPI.fetch(new Request(c.req.url.replace('/api/aria/query', '/api/aria/query'), {
      method: c.req.method,
      body: c.req.raw.body,
      headers: c.req.raw.headers
    }), c.env);
  });

  // Health check endpoint
  app.get('/api/health', (c) => {
    return c.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      services: {
        rag: true,
        mcp: true,
        aria: true
      }
    });
  });

  // API info endpoint
  app.get('/api/info', (c) => {
    return c.json({
      success: true,
      data: {
        name: 'DMT Risk Assessment API',
        version: '2.0.0',
        features: [
          'RAG (Retrieval-Augmented Generation)',
          'MCP (Model Context Protocol)',
          'Enhanced ARIA AI Assistant',
          'AI-Powered GRC Platform',
          'Asset Risk Analysis',
          'Service Risk Management',
          'Dynamic Risk Assessment',
          'Microsoft Defender Integration',
          'Vector Search & Embeddings',
          'Document Processing',
          'Analytics & Monitoring'
        ],
        endpoints: {
          rag: '/api/rag/*',
          aria: '/api/aria/*',
          ai_grc: '/api/ai-grc/*',
          health: '/api/health',
          info: '/api/info'
        }
      }
    });
  });

  return app;
}