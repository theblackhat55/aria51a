/**
 * Enhanced AI Chat Routes with Streaming Support
 * Unified endpoints for both AI page and widget chatbot
 */

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { UnifiedAIChatbotService } from '../services/unified-ai-chatbot-service';
import type { CloudflareBindings } from '../types';

export function createEnhancedAIChatRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Initialize chatbot service with unified AI providers
  let chatbotService: UnifiedAIChatbotService;
  
  app.use('*', async (c, next) => {
    if (!chatbotService) {
      chatbotService = new UnifiedAIChatbotService(c.env.DB, c.env);
      await chatbotService.initialize();
      console.log('✅ Unified AI Chatbot Service initialized');
    }
    await next();
  });

  /**
   * Streaming chat endpoint - used by both AI page and widget
   */
  app.post('/chat-stream', async (c) => {
    const user = c.get('user');
    const { message, sessionId } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }
    
    // Generate session ID if not provided
    const session = sessionId || `session-${user.id}-${Date.now()}`;
    
    // Get or create context
    const context = await chatbotService.getOrCreateContext(session, user.id);
    context.userName = user.name || user.username;
    context.userRole = user.role;
    
    // Set up SSE headers
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'connected', sessionId: session })}\n\n`
            )
          );
          
          // Stream the response
          for await (const chunk of chatbotService.streamResponse(message, context)) {
            const data = JSON.stringify(chunk);
            controller.enqueue(
              new TextEncoder().encode(`data: ${data}\n\n`)
            );
            
            // Yield control to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          // Send completion signal
          controller.enqueue(
            new TextEncoder().encode('data: [DONE]\n\n')
          );
          
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ 
                type: 'error', 
                content: 'An error occurred while processing your request.' 
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      }
    });
    
    return new Response(stream);
  });

  /**
   * Non-streaming chat endpoint (fallback/compatibility)
   */
  app.post('/chat', async (c) => {
    const user = c.get('user');
    const { message, sessionId } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }
    
    const session = sessionId || `session-${user.id}-${Date.now()}`;
    const context = await chatbotService.getOrCreateContext(session, user.id);
    context.userName = user.name || user.username;
    context.userRole = user.role;
    
    // Collect full response
    let fullResponse = '';
    
    for await (const chunk of chatbotService.streamResponse(message, context)) {
      if (chunk.type === 'text') {
        fullResponse += chunk.content;
      }
    }
    
    return c.json({
      response: fullResponse,
      sessionId: session,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get conversation history
   */
  app.get('/history/:sessionId', async (c) => {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId');
    
    // Verify session belongs to user
    if (!sessionId.includes(`-${user.id}-`)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const context = await chatbotService.getOrCreateContext(sessionId, user.id);
    
    return c.json({
      sessionId,
      messages: context.recentMessages,
      metadata: {
        userName: context.userName,
        userRole: context.userRole,
        lastActivity: context.lastActivity
      }
    });
  });

  /**
   * Clear conversation history
   */
  app.post('/clear/:sessionId', async (c) => {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId');
    
    // Verify session belongs to user
    if (!sessionId.includes(`-${user.id}-`)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const context = await chatbotService.getOrCreateContext(sessionId, user.id);
    context.recentMessages = [];
    context.semanticMemory?.clear();
    context.activeIntents = [];
    
    return c.json({ success: true, message: 'Conversation cleared' });
  });

  /**
   * Quick action endpoints for specific queries
   */
  app.post('/quick-action/risk-analysis', async (c) => {
    const user = c.get('user');
    const sessionId = `session-${user.id}-${Date.now()}`;
    
    return handleQuickAction(c, chatbotService, user, sessionId, 
      'Analyze my current risk landscape and provide recommendations');
  });

  app.post('/quick-action/compliance-check', async (c) => {
    const user = c.get('user');
    const sessionId = `session-${user.id}-${Date.now()}`;
    
    return handleQuickAction(c, chatbotService, user, sessionId,
      'Check our compliance status across all frameworks');
  });

  app.post('/quick-action/threat-analysis', async (c) => {
    const user = c.get('user');
    const sessionId = `session-${user.id}-${Date.now()}`;
    
    return handleQuickAction(c, chatbotService, user, sessionId,
      'Analyze recent threat indicators and provide insights');
  });

  app.post('/quick-action/recommendations', async (c) => {
    const user = c.get('user');
    const sessionId = `session-${user.id}-${Date.now()}`;
    
    return handleQuickAction(c, chatbotService, user, sessionId,
      'Provide security recommendations based on our current posture');
  });

  return app;
}

/**
 * Handle quick action requests
 */
async function handleQuickAction(
  c: any,
  chatbotService: EnhancedChatbotService,
  user: any,
  sessionId: string,
  query: string
) {
  const context = await chatbotService.getOrCreateContext(sessionId, user.id);
  context.userName = user.name || user.username;
  context.userRole = user.role;
  
  // Set up streaming response
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`
          )
        );
        
        for await (const chunk of chatbotService.streamResponse(query, context)) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify(chunk)}\n\n`
            )
          );
        }
        
        controller.enqueue(
          new TextEncoder().encode('data: [DONE]\n\n')
        );
      } catch (error) {
        console.error('Quick action error:', error);
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'error', 
              content: 'Failed to process quick action.' 
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream);
}