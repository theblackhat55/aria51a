import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';

import type { CloudflareBindings } from '../types';

export function createAIAssistantRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main AI Assistant page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
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
                        <p class="text-xs text-yellow-600 mt-1">3 critical risks require immediate attention</p>
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

  // Chat endpoint
  app.post('/chat', async (c) => {
    const formData = await c.req.formData();
    const message = formData.get('message') as string;
    const user = c.get('user');

    // Simulate AI response (in production, integrate with OpenAI/Anthropic/Gemini)
    let response = generateAIResponse(message);

    return c.html(html`
      <!-- User Message -->
      <div class="flex items-start space-x-3 justify-end">
        <div class="flex-1 max-w-xs">
          <div class="bg-blue-600 text-white rounded-lg px-4 py-3 ml-auto">
            <p>${message}</p>
          </div>
        </div>
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-gray-600 text-sm"></i>
          </div>
        </div>
      </div>

      <!-- AI Response -->
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-blue-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-gray-100 rounded-lg px-4 py-3">
            <p class="text-gray-800">${response}</p>
          </div>
        </div>
      </div>
    `);
  });

  // Quick action endpoints
  app.post('/analyze-risks', async (c) => {
    const user = c.get('user');
    
    return c.html(html`
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-blue-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p class="text-red-800 font-medium">🔍 Risk Analysis Complete</p>
            <div class="mt-2 space-y-1 text-sm text-red-700">
              <p>• <strong>3 Critical Risks</strong> require immediate attention</p>
              <p>• <strong>7 High Risks</strong> need mitigation plans</p>
              <p>• <strong>12 Medium Risks</strong> are being monitored</p>
            </div>
            <p class="mt-2 text-sm text-red-600">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              Recommendation: Focus on cybersecurity and data protection risks first.
            </p>
          </div>
        </div>
      </div>
    `);
  });

  app.post('/compliance-check', async (c) => {
    return c.html(html`
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-blue-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p class="text-green-800 font-medium">✅ Compliance Status Overview</p>
            <div class="mt-2 space-y-1 text-sm text-green-700">
              <p>• <strong>ISO 27001:</strong> 78% compliant (Assessment due in 7 days)</p>
              <p>• <strong>GDPR:</strong> 92% compliant</p>
              <p>• <strong>SOC 2:</strong> 85% compliant</p>
              <p>• <strong>HIPAA:</strong> 88% compliant</p>
            </div>
            <p class="mt-2 text-sm text-green-600">
              <i class="fas fa-info-circle mr-1"></i>
              Next action: Complete remaining ISO 27001 controls before assessment.
            </p>
          </div>
        </div>
      </div>
    `);
  });

  app.post('/recommendations', async (c) => {
    return c.html(html`
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-blue-600 text-sm"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p class="text-blue-800 font-medium">💡 AI Recommendations</p>
            <div class="mt-2 space-y-2 text-sm text-blue-700">
              <div class="p-2 bg-white rounded border">
                <p class="font-medium">1. Implement MFA</p>
                <p class="text-xs">Deploy multi-factor authentication across all systems (Priority: High)</p>
              </div>
              <div class="p-2 bg-white rounded border">
                <p class="font-medium">2. Update Incident Response Plan</p>
                <p class="text-xs">Current plan is 18 months old, needs refresh (Priority: Medium)</p>
              </div>
              <div class="p-2 bg-white rounded border">
                <p class="font-medium">3. Conduct Vulnerability Assessment</p>
                <p class="text-xs">Last assessment was 6 months ago (Priority: High)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  return app;
}

function generateAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('risk')) {
    return "Based on your current risk landscape, I recommend focusing on cybersecurity risks first. You have 3 critical risks that need immediate attention, particularly around data protection and access controls.";
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