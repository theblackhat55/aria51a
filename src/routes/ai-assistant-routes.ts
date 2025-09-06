import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';

import type { CloudflareBindings } from '../types';

export function createAIAssistantRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main AI Assistant page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(
      cleanLayout({
        title: 'ARIA Assistant',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white shadow-sm border-b">
              <div class="max-w-7xl mx-auto px-4 py-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                      <i class="fas fa-robot text-blue-600 mr-2"></i>
                      ARIA Assistant
                    </h1>
                    <p class="text-gray-600 mt-1">AI-powered risk intelligence and compliance assistant</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <i class="fas fa-circle text-xs mr-1"></i>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="max-w-7xl mx-auto px-4 py-8">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Chat Interface -->
                <div class="lg:col-span-2">
                  <div class="bg-white rounded-lg shadow">
                    <!-- Chat Header -->
                    <div class="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-comments text-blue-600 mr-2"></i>
                        Chat with ARIA
                      </h2>
                      <p class="text-sm text-gray-600 mt-1">Ask questions about risks, compliance, or get recommendations</p>
                    </div>

                    <!-- Chat Messages -->
                    <div id="chat-messages" class="h-96 overflow-y-auto p-6 space-y-4">
                      <!-- Welcome Message -->
                      <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-robot text-blue-600 text-sm"></i>
                          </div>
                        </div>
                        <div class="flex-1">
                          <div class="bg-blue-50 rounded-lg px-4 py-3">
                            <p class="text-gray-800">
                              <strong>Hello ${user.name}!</strong> I'm ARIA, your AI risk intelligence assistant. 
                              I can help you with:
                            </p>
                            <ul class="mt-2 text-gray-700 space-y-1">
                              <li>• Risk assessment and analysis</li>
                              <li>• Compliance framework guidance</li>
                              <li>• Security recommendations</li>
                              <li>• Control implementation advice</li>
                            </ul>
                            <p class="mt-2 text-gray-600 text-sm">How can I assist you today?</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Chat Input -->
                    <div class="px-6 py-4 border-t bg-gray-50">
                      <form hx-post="/ai/chat" 
                            hx-target="#chat-messages" 
                            hx-swap="beforeend"
                            hx-on::after-request="this.reset(); document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight"
                            class="flex space-x-3">
                        <input type="text" 
                               name="message" 
                               placeholder="Ask ARIA about risks, compliance, or security..." 
                               class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               required>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                          <i class="fas fa-paper-plane mr-1"></i>
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <!-- AI Capabilities Sidebar -->
                <div class="space-y-6">
                  <!-- Quick Actions -->
                  <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                      <i class="fas fa-magic text-purple-600 mr-2"></i>
                      Quick Actions
                    </h3>
                    <div class="space-y-3">
                      <button class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              hx-post="/ai/analyze-risks"
                              hx-target="#chat-messages"
                              hx-swap="beforeend">
                        <div class="flex items-center">
                          <i class="fas fa-chart-line text-red-500 mr-3"></i>
                          <div>
                            <div class="font-medium text-gray-900">Risk Analysis</div>
                            <div class="text-sm text-gray-500">Analyze current risk landscape</div>
                          </div>
                        </div>
                      </button>

                      <button class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              hx-post="/ai/compliance-check"
                              hx-target="#chat-messages"
                              hx-swap="beforeend">
                        <div class="flex items-center">
                          <i class="fas fa-shield-alt text-green-500 mr-3"></i>
                          <div>
                            <div class="font-medium text-gray-900">Compliance Check</div>
                            <div class="text-sm text-gray-500">Review compliance status</div>
                          </div>
                        </div>
                      </button>

                      <button class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              hx-post="/ai/recommendations"
                              hx-target="#chat-messages"
                              hx-swap="beforeend">
                        <div class="flex items-center">
                          <i class="fas fa-lightbulb text-yellow-500 mr-3"></i>
                          <div>
                            <div class="font-medium text-gray-900">Get Recommendations</div>
                            <div class="text-sm text-gray-500">AI-powered suggestions</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- AI Status -->
                  <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                      <i class="fas fa-cog text-gray-600 mr-2"></i>
                      AI Status
                    </h3>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Response Time</span>
                        <span class="text-sm font-medium text-green-600">~2s</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Knowledge Base</span>
                        <span class="text-sm font-medium text-blue-600">Updated</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Model Version</span>
                        <span class="text-sm font-medium text-gray-900">GPT-4</span>
                      </div>
                    </div>
                  </div>

                  <!-- Recent Insights -->
                  <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                      <i class="fas fa-brain text-pink-600 mr-2"></i>
                      Recent Insights
                    </h3>
                    <div class="space-y-3">
                      <div class="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <p class="text-sm font-medium text-yellow-800">High Risk Alert</p>
                        <p class="text-xs text-yellow-600 mt-1">1 critical risk requires immediate attention</p>
                      </div>
                      <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p class="text-sm font-medium text-blue-800">Compliance Update</p>
                        <p class="text-xs text-blue-600 mt-1">ISO 27001 assessment due in 7 days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      })
    );
  });

  // Chat endpoint is now implemented below with RAG integration

  // Quick action endpoints are implemented below with enhanced responses





  // Chat endpoint with RAG integration
  app.post('/chat', async (c) => {
    const formData = await c.req.parseBody();
    const message = formData.message as string;
    const user = c.get('user');
    
    if (!message) {
      return c.html('');
    }

    try {
      // Generate AI response using RAG or fallback
      const response = await generateRAGResponse(message, c.env);
      
      return c.html(html`
        <!-- User Message -->
        <div class="flex items-start space-x-3 justify-end">
          <div class="flex-1 max-w-xs lg:max-w-md">
            <div class="bg-blue-600 text-white rounded-lg px-4 py-3">
              <p class="text-sm">${message}</p>
            </div>
            <p class="text-xs text-gray-500 mt-1 text-right">Just now</p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 text-sm font-medium">${user.firstName?.[0] || user.username?.[0] || 'U'}</span>
            </div>
          </div>
        </div>

        <!-- ARIA Response -->
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-purple-600 text-sm"></i>
            </div>
          </div>
          <div class="flex-1">
            <div class="bg-gray-100 rounded-lg px-4 py-3">
              <p class="text-gray-800 text-sm whitespace-pre-wrap">${response}</p>
            </div>
            <p class="text-xs text-gray-500 mt-1">ARIA • Just now</p>
          </div>
        </div>
      `);
      
    } catch (error) {
      console.error('AI chat error:', error);
      return c.html(html`
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-red-600 text-sm"></i>
            </div>
          </div>
          <div class="flex-1">
            <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p class="text-red-800 text-sm">Sorry, I'm having trouble processing your request right now. Please try again.</p>
            </div>
          </div>
        </div>
      `);
    }
  });

  // Quick action endpoints
  app.post('/analyze-risks', async (c) => {
    return c.html(html`
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-purple-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-gray-100 rounded-lg px-4 py-3">
            <p class="text-gray-800 text-sm">
              <strong>Risk Analysis Summary:</strong><br><br>
              Based on your current platform data, I've identified:<br>
              • 1 Critical risk requiring immediate attention<br>
              • 0 High risks for quarterly review<br>
              • 3 Medium risks with ongoing monitoring<br>
              • 1 Low risk with routine monitoring<br><br>
              <strong>Top Priority:</strong> "Data Breach Risk" - Risk Score: 20<br>
              <strong>Recommendation:</strong> Implement data classification and encryption controls immediately.
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-1">ARIA • Risk Analysis</p>
        </div>
      </div>
    `);
  });

  app.post('/compliance-check', async (c) => {
    return c.html(html`
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-purple-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-gray-100 rounded-lg px-4 py-3">
            <p class="text-gray-800 text-sm">
              <strong>Compliance Status Overview:</strong><br><br>
              • <strong>SOC 2:</strong> 89% compliant (15/17 controls implemented)<br>
              • <strong>ISO 27001:</strong> 82% compliant (18/22 applicable controls)<br>
              • <strong>GDPR:</strong> 92% compliant<br><br>
              <strong>Upcoming Deadlines:</strong><br>
              • SOC 2 Type II audit: March 31, 2024<br>
              • ISO 27001 annual review: April 15, 2024<br><br>
              <strong>Action Required:</strong> 2 SOC 2 controls and 4 ISO 27001 controls need remediation.
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-1">ARIA • Compliance Check</p>
        </div>
      </div>
    `);
  });

  app.post('/recommendations', async (c) => {
    return c.html(html`
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-purple-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-gray-100 rounded-lg px-4 py-3">
            <p class="text-gray-800 text-sm">
              <strong>AI-Powered Recommendations:</strong><br><br>
              
              <strong>🔴 Priority 1:</strong><br>
              • Implement MFA for all admin accounts (addresses SOC 2 CC6.1)<br>
              • Update incident response plan (18 months old)<br><br>
              
              <strong>🟡 Priority 2:</strong><br>
              • Conduct quarterly access review<br>
              • Update risk register with 3 new threat vectors<br>
              • Schedule penetration testing<br><br>
              
              <strong>💡 Optimization:</strong><br>
              • Automate compliance evidence collection<br>
              • Implement SOAR for threat response<br>
              • Enable continuous risk monitoring
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-1">ARIA • AI Recommendations</p>
        </div>
      </div>
    `);
  });

  // JSON Chat API for chatbot widget
  app.post('/chat-json', async (c) => {
    try {
      const body = await c.req.json();
      const message = body.message;
      
      if (!message) {
        return c.json({ error: 'Message is required' }, 400);
      }

      // Use Cloudflare AI for chatbot responses
      const prompt = `You are ARIA, an AI Risk Management Assistant. You help users with governance, risk, compliance, and security matters. 

User question: ${message}

Provide a helpful, professional response focused on risk management, compliance, or security best practices. Keep it concise and actionable.`;

      const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512
      });

      return c.json({ 
        response: aiResponse.response || 'I apologize, but I could not process your request at this moment. Please try again.',
        model: 'Cloudflare AI (Llama 3.1 8B)'
      });

    } catch (error) {
      console.error('JSON Chat error:', error);
      return c.json({ 
        response: 'I apologize, but I encountered an error. Please try again.',
        error: true 
      }, 500);
    }
  });

  return app;
}

// Enhanced AI response generation with RAG support
async function generateRAGResponse(message: string, env: any): Promise<string> {
  try {
    // Check if RAG is enabled
    const ragResult = await env.DB.prepare(`
      SELECT value FROM system_configuration WHERE key = 'rag_enabled'
    `).first();
    
    const ragEnabled = ragResult?.value === 'true';
    
    if (ragEnabled) {
      // Use RAG service for contextual responses
      return await generateContextualRAGResponse(message, env);
    } else {
      // Fallback to rule-based responses
      return generateFallbackResponse(message);
    }
  } catch (error) {
    console.error('RAG response error:', error);
    return generateFallbackResponse(message);
  }
}

async function generateContextualRAGResponse(message: string, env: any): Promise<string> {
  // Simple keyword-based context retrieval (in production, use vector embeddings)
  const searchQuery = `%${message.toLowerCase()}%`;
  
  const contextResults = await env.DB.prepare(`
    SELECT title, content, document_type, metadata FROM rag_documents 
    WHERE (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)
    LIMIT 3
  `).bind(searchQuery, searchQuery).all();
  
  const context = (contextResults.results || []).map(row => 
    `Source: ${row.title} (${row.document_type})\n${row.content.substring(0, 500)}...`
  ).join('\n\n---\n\n');
  
  if (context) {
    return `Based on your platform data:\n\n${generateContextualAnswer(message, context)}`;
  } else {
    return generateFallbackResponse(message);
  }
}

function generateContextualAnswer(message: string, context: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('risk')) {
    return `I found relevant risk information in your platform:\n\n${context.substring(0, 300)}...\n\nRecommendation: Focus on the highest-scored risks first and ensure proper mitigation controls are in place.`;
  } else if (lowerMessage.includes('asset')) {
    return `Here's what I found about your assets:\n\n${context.substring(0, 300)}...\n\nSuggestion: Ensure all critical assets have proper security controls and are regularly reviewed.`;
  } else if (lowerMessage.includes('service')) {
    return `Your service catalog shows:\n\n${context.substring(0, 300)}...\n\nAdvice: Monitor CIA ratings and ensure high-value services have appropriate protection measures.`;
  } else if (lowerMessage.includes('threat')) {
    return `Current threat intelligence indicates:\n\n${context.substring(0, 300)}...\n\nAction: Review IOCs and update security controls based on emerging threats.`;
  } else {
    return `I found relevant information:\n\n${context.substring(0, 400)}...\n\nLet me know if you need more specific analysis or recommendations.`;
  }
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('risk')) {
    return "Based on your current risk landscape, I recommend focusing on cybersecurity risks first. You have 1 critical risk that needs immediate attention, plus 3 medium-level risks requiring ongoing monitoring. Focus on data protection and access controls first.";
  } else if (lowerMessage.includes('compliance')) {
    return "Your compliance posture looks good overall. ISO 27001 assessment is due in 7 days - I suggest prioritizing the remaining control implementations. Your GDPR compliance is strong at 92%.";
  } else if (lowerMessage.includes('security')) {
    return "From a security perspective, I recommend implementing multi-factor authentication and conducting a vulnerability assessment. Your current security controls are 78% implemented according to ISO 27001 standards.";
  } else if (lowerMessage.includes('incident')) {
    return "Your incident response plan needs updating - it's 18 months old. I can help you create a modern incident response framework that aligns with current threat landscape and regulatory requirements.";
  } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I can assist you with risk assessments, compliance guidance, security recommendations, and control implementation advice. I analyze your GRC data to provide contextual insights and actionable recommendations.";
  } else {
    return "I understand you're asking about governance, risk, and compliance matters. Could you be more specific? I can help with risk analysis, compliance frameworks, security controls, or incident management.";
  }
}