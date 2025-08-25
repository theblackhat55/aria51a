// ARIA API Routes with RAG Integration
// Enhanced AI assistant with context-aware responses using RAG and MCP

import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { ragServer } from '../rag/rag-server';
import { mcpServer } from '../mcp/mcp-server';

export function createARIAAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Enhanced ARIA query with RAG context
  app.post('/query', async (c) => {
    try {
      const body = await c.req.json();
      const { query, provider, settings } = body;
      
      // Enhanced debug logging (secure)
      console.log('🔍 ARIA Request Debug:');
      console.log('- Query length:', query?.length || 0);
      console.log('- Provider:', provider);
      console.log('- Settings keys:', Object.keys(settings || {}));
      console.log('- Settings structure:', typeof settings);

      if (!query || typeof query !== 'string') {
        return c.json({
          success: false,
          message: 'Query text is required'
        }, 400);
      }

      const startTime = Date.now();

      // Step 1: Get RAG context for the query
      const ragContext = await ragServer.query({
        query,
        sourceTypes: ['risk', 'incident', 'service', 'asset', 'document'],
        limit: 8,
        threshold: 0.25
      });

      // Step 2: Get MCP context and tools
      const mcpContext = await mcpServer.getContext();

      // Step 3: Determine which MCP tools to use based on query
      const relevantTools = await determineRelevantTools(query, mcpContext.tools);

      // Step 4: Execute relevant tools to gather additional context
      const toolResults = await executeRelevantTools(relevantTools, query);

      // Step 5: Build enhanced prompt with context
      const enhancedPrompt = buildEnhancedPrompt(
        query,
        ragContext,
        toolResults,
        mcpContext.systemPrompt,
        mcpContext.organizationContext
      );

      // Step 6: Call the appropriate LLM provider
      const aiResponse = await callLLMProvider(enhancedPrompt, provider, settings);

      const responseTime = Date.now() - startTime;

      // Step 7: Store query analytics
      const db = c.env.DB;
      await db.prepare(`
        INSERT INTO rag_queries (
          query_text, source_types_json, limit_count, threshold_score,
          response_time_ms, results_count, embedding_time_ms, search_time_ms,
          user_id, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        query,
        JSON.stringify(['risk', 'incident', 'service', 'asset', 'document']),
        8,
        0.25,
        responseTime,
        ragContext.sources.length,
        ragContext.metadata.embeddingTime,
        ragContext.metadata.searchTime,
        null, // TODO: Get user ID from auth
        null  // TODO: Get session ID
      ).run();

      return c.json({
        success: true,
        data: {
          response: aiResponse.response,
          provider: aiResponse.provider,
          tokens_used: aiResponse.tokens_used,
          context_sources: ragContext.sources.length,
          tools_used: toolResults.length,
          response_time: responseTime,
          sources: ragContext.sources,
          tool_results: toolResults
        }
      });

    } catch (error) {
      console.error('ARIA query error:', error);
      
      // Fallback to basic response without RAG context
      try {
        const fallbackResponse = await callLLMProvider(
          `As ARIA, an AI Risk Intelligence Assistant, please respond to this query: ${body.query}`,
          body.provider,
          body.settings
        );

        return c.json({
          success: true,
          data: {
            response: fallbackResponse.response + '\n\n(Note: Advanced context features temporarily unavailable)',
            provider: fallbackResponse.provider,
            tokens_used: fallbackResponse.tokens_used,
            context_sources: 0,
            tools_used: 0,
            response_time: Date.now() - Date.now(),
            sources: [],
            tool_results: []
          }
        });
      } catch (fallbackError) {
        return c.json({
          success: false,
          message: 'ARIA query failed',
          error: error.message
        }, 500);
      }
    }
  });

  // Get ARIA capabilities and status
  app.get('/capabilities', async (c) => {
    try {
      const ragStats = await ragServer.getStats();
      const mcpContext = await mcpServer.getContext();

      return c.json({
        success: true,
        data: {
          ragEnabled: ragStats.vectorStore.totalDocuments > 0,
          mcpToolsAvailable: mcpContext.tools.length,
          knowledgeBaseSources: ragStats.vectorStore.documentsByType,
          systemPrompt: mcpContext.systemPrompt,
          organizationContext: mcpContext.organizationContext,
          availableTools: mcpContext.tools.map(tool => ({
            name: tool.name,
            description: tool.description
          }))
        }
      });
    } catch (error) {
      console.error('ARIA capabilities error:', error);
      return c.json({
        success: false,
        message: 'Failed to get ARIA capabilities',
        error: error.message
      }, 500);
    }
  });

  // ARIA system information endpoint
  app.get('/info', async (c) => {
    try {
      return c.json({
        success: true,
        data: {
          name: 'ARIA - AI Risk Intelligence Assistant',
          version: '2.0.0',
          description: 'Enhanced AI assistant with RAG context and MCP tool integration',
          features: [
            'Multi-provider AI support (OpenAI, Gemini, Anthropic, Local)',
            'RAG-enhanced context retrieval',
            'MCP tool integration',
            'GRC-specific knowledge base',
            'Real-time analytics'
          ],
          providers: ['openai', 'gemini', 'anthropic', 'local'],
          tools_available: 6, // We have 6 MCP tools
          status: 'active',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: 'Failed to get ARIA info',
        message: error.message
      }, 500);
    }
  });

  // Generate AI Analytics Report
  app.post('/generate-report', async (c) => {
    try {
      const body = await c.req.json();
      const { reportType, timeframe, includeCharts, provider, settings } = body;
      
      console.log('Generating AI Analytics Report:', { reportType, timeframe });
      
      // Get data from database based on report type
      const db = c.env.DB;
      let reportData = {};
      
      switch (reportType) {
        case 'risk_overview':
          reportData = await generateRiskOverviewData(db, timeframe);
          break;
        case 'compliance_status':
          reportData = await generateComplianceStatusData(db, timeframe);
          break;
        case 'incident_analysis':
          reportData = await generateIncidentAnalysisData(db, timeframe);
          break;
        case 'kri_trends':
          reportData = await generateKRITrendsData(db, timeframe);
          break;
        case 'security_metrics':
          reportData = await generateSecurityMetricsData(db, timeframe);
          break;
        default:
          reportData = await generateExecutiveSummaryData(db, timeframe);
      }
      
      // Generate AI-powered narrative and insights
      const reportPrompt = buildReportPrompt(reportType, reportData, timeframe);
      const aiInsights = await callLLMProvider(reportPrompt, provider, settings);
      
      // Structure the final report
      const report = {
        metadata: {
          title: getReportTitle(reportType),
          generated_at: new Date().toISOString(),
          timeframe: timeframe,
          report_type: reportType,
          ai_provider: aiInsights.provider
        },
        executive_summary: aiInsights.response,
        data: reportData,
        charts: includeCharts ? generateChartConfigs(reportData, reportType) : null,
        recommendations: extractRecommendations(aiInsights.response)
      };
      
      return c.json({
        success: true,
        data: report
      });
      
    } catch (error) {
      console.error('Report generation error:', error);
      return c.json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      }, 500);
    }
  });

  return app;
}

// Helper function to determine relevant MCP tools based on query
async function determineRelevantTools(query: string, availableTools: any[]): Promise<string[]> {
  const queryLower = query.toLowerCase();
  const relevantTools: string[] = [];

  // Risk-related queries
  if (queryLower.includes('risk') || queryLower.includes('threat') || queryLower.includes('vulnerability')) {
    relevantTools.push('analyze_risk_context');
  }

  // Compliance-related queries
  if (queryLower.includes('compliance') || queryLower.includes('standard') || queryLower.includes('regulation')) {
    relevantTools.push('get_compliance_context');
  }

  // Incident-related queries
  if (queryLower.includes('incident') || queryLower.includes('breach') || queryLower.includes('attack')) {
    relevantTools.push('analyze_incident_patterns');
  }

  // Service-related queries
  if (queryLower.includes('service') || queryLower.includes('system') || queryLower.includes('application')) {
    relevantTools.push('get_service_context');
  }

  // Recommendation queries
  if (queryLower.includes('recommend') || queryLower.includes('suggest') || queryLower.includes('improve')) {
    relevantTools.push('generate_risk_recommendations');
  }

  // Always include knowledge base search
  if (relevantTools.length === 0 || queryLower.includes('search') || queryLower.includes('find')) {
    relevantTools.push('search_knowledge_base');
  }

  return relevantTools;
}

// Helper function to execute relevant MCP tools
async function executeRelevantTools(toolNames: string[], query: string): Promise<any[]> {
  const results: any[] = [];

  for (const toolName of toolNames) {
    try {
      let parameters: any = {};

      // Set parameters based on tool type
      switch (toolName) {
        case 'search_knowledge_base':
          parameters = { query, limit: 5 };
          break;
        case 'analyze_risk_context':
          parameters = { include_related: true };
          break;
        case 'get_compliance_context':
          // Extract framework from query if mentioned
          const frameworks = ['soc2', 'iso27001', 'pci-dss', 'gdpr', 'hipaa'];
          const mentionedFramework = frameworks.find(fw => 
            query.toLowerCase().includes(fw.replace('-', '').replace('_', ''))
          );
          if (mentionedFramework) {
            parameters.framework = mentionedFramework;
          }
          break;
        case 'analyze_incident_patterns':
          parameters = { time_period: 'month' };
          break;
        case 'get_service_context':
          parameters = { include_dependencies: true };
          break;
        case 'generate_risk_recommendations':
          parameters = { context: query, urgency_level: 'medium' };
          break;
      }

      const result = await mcpServer.executeTool({
        name: toolName,
        parameters
      });

      if (result.success) {
        results.push({
          tool: toolName,
          result: result.data,
          sources: result.sources
        });
      }
    } catch (error) {
      console.warn(`Failed to execute tool ${toolName}:`, error);
    }
  }

  return results;
}

// Helper function to build enhanced prompt with context
function buildEnhancedPrompt(
  originalQuery: string,
  ragContext: any,
  toolResults: any[],
  systemPrompt: string,
  organizationContext: string
): string {
  let prompt = systemPrompt + '\n\n';

  // Add organization context
  if (organizationContext) {
    prompt += `Organization Context:\n${organizationContext}\n\n`;
  }

  // Add RAG context
  if (ragContext.context && ragContext.sources.length > 0) {
    prompt += `Relevant Knowledge Base Information:\n${ragContext.context}\n\n`;
  }

  // Add tool results
  if (toolResults.length > 0) {
    prompt += 'Additional Analysis Results:\n';
    for (const toolResult of toolResults) {
      prompt += `\n${toolResult.tool.replace(/_/g, ' ').toUpperCase()}:\n`;
      prompt += JSON.stringify(toolResult.result, null, 2) + '\n';
    }
    prompt += '\n';
  }

  // Add the user query
  prompt += `User Query: ${originalQuery}\n\n`;

  // Add instructions
  prompt += `Instructions:
1. Use the provided context to give accurate, specific answers based on the organization's actual data
2. Cite specific sources when making claims or recommendations
3. If the context doesn't contain relevant information, clearly state this limitation
4. Provide actionable insights and recommendations when appropriate
5. Maintain a professional, helpful tone suitable for risk management professionals\n\n`;

  return prompt;
}

// Helper function to call LLM provider with priority fallback
async function callLLMProvider(prompt: string, preferredProvider: string, settings: any): Promise<any> {
  const providers = ['openai', 'gemini', 'anthropic', 'local'];
  const aiSettings = settings || {};

  // Try preferred provider first, then fallback to others
  const tryOrder = preferredProvider ? [preferredProvider, ...providers.filter(p => p !== preferredProvider)] : providers;

  console.log(`🔍 ARIA Debug - AI Settings:`, JSON.stringify(aiSettings, null, 2));
  console.log(`🔍 ARIA Debug - Try Order:`, tryOrder);

  for (const provider of tryOrder) {
    try {
      const providerSettings = aiSettings[provider];
      console.log(`🔍 ARIA Debug - ${provider} settings:`, JSON.stringify(providerSettings, null, 2));
      
      if (!providerSettings || providerSettings.priority <= 0 || !providerSettings?.apiKey) {
        console.log(`❌ ARIA Debug - ${provider} skipped: priority=${providerSettings?.priority}, hasApiKey=${!!providerSettings?.apiKey}`);
        continue;
      }
      
      console.log(`✅ ARIA Debug - Trying ${provider} with model: ${providerSettings.model}`);

      const response = await callSpecificProvider(prompt, provider, providerSettings);
      return {
        response: response.content,
        provider: provider,
        tokens_used: response.tokens || 0
      };
    } catch (error) {
      console.warn(`Provider ${provider} failed:`, error);
      continue;
    }
  }

  // If all providers fail, return a basic response
  throw new Error('All AI providers failed to respond');
}

// Helper function to call specific AI provider
async function callSpecificProvider(prompt: string, provider: string, settings: any): Promise<any> {
  switch (provider) {
    case 'openai':
      return await callOpenAI(prompt, settings);
    case 'gemini':
      return await callGemini(prompt, settings);
    case 'anthropic':
      return await callAnthropic(prompt, settings);
    case 'local':
      return await callLocalLLM(prompt, settings);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// OpenAI API integration
async function callOpenAI(prompt: string, settings: any): Promise<any> {
  // Validate and fix model name
  let model = settings.model || 'gpt-4o';
  
  // Fix common invalid model names
  const validModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  if (!validModels.includes(model)) {
    console.log(`🔧 Invalid OpenAI model '${model}', using 'gpt-4o' instead`);
    model = 'gpt-4o';
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are ARIA, an AI Risk Intelligence Assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: settings.maxTokens || 1500,
      temperature: settings.temperature || 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0
  };
}

// Google Gemini API integration
async function callGemini(prompt: string, settings: any): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-pro'}:generateContent?key=${settings.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: settings.maxTokens || 1500,
          temperature: settings.temperature || 0.7
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    tokens: data.usageMetadata?.totalTokenCount || 0
  };
}

// Anthropic Claude API integration
async function callAnthropic(prompt: string, settings: any): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': settings.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: settings.model || 'claude-3-sonnet-20240229',
      max_tokens: settings.maxTokens || 1500,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: settings.temperature || 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    tokens: data.usage?.total_tokens || 0
  };
}

// Local LLM integration (placeholder)
async function callLocalLLM(prompt: string, settings: any): Promise<any> {
  // This would call a local LLM endpoint
  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.authToken && { 'Authorization': `Bearer ${settings.authToken}` })
    },
    body: JSON.stringify({
      prompt,
      max_tokens: settings.maxTokens || 1500,
      temperature: settings.temperature || 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`Local LLM error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.response || data.text || data.content,
    tokens: data.tokens || 0
  };
}

// Report generation helper functions
async function generateRiskOverviewData(db: any, timeframe: string): Promise<any> {
  const timeCondition = getTimeCondition(timeframe);
  
  const riskStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_risks,
      AVG(risk_score) as avg_risk_score,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_risks,
      COUNT(CASE WHEN risk_score >= 15 THEN 1 END) as high_risks,
      COUNT(CASE WHEN risk_score BETWEEN 8 AND 14 THEN 1 END) as medium_risks,
      COUNT(CASE WHEN risk_score < 8 THEN 1 END) as low_risks
    FROM risks 
    ${timeCondition}
  `).first();
  
  const risksByCategory = await db.prepare(`
    SELECT 
      rc.name as category,
      COUNT(r.id) as count,
      AVG(r.risk_score) as avg_score
    FROM risks r
    JOIN risk_categories rc ON r.category_id = rc.id
    ${timeCondition}
    GROUP BY rc.name
    ORDER BY count DESC
  `).all();
  
  return {
    overview: riskStats,
    by_category: risksByCategory.results || [],
    timeframe: timeframe
  };
}

async function generateComplianceStatusData(db: any, timeframe: string): Promise<any> {
  const timeCondition = getTimeCondition(timeframe, 'ca');
  
  const complianceStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_assessments,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started
    FROM compliance_assessments ca
    ${timeCondition}
  `).first();
  
  const frameworkStatus = await db.prepare(`
    SELECT 
      framework_type,
      COUNT(*) as assessments,
      AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END) as completion_rate
    FROM compliance_assessments ca
    ${timeCondition}
    GROUP BY framework_type
  `).all();
  
  return {
    overview: complianceStats,
    frameworks: frameworkStatus.results || [],
    timeframe: timeframe
  };
}

async function generateIncidentAnalysisData(db: any, timeframe: string): Promise<any> {
  const timeCondition = getTimeCondition(timeframe, 'i');
  
  const incidentStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_incidents,
      COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
      COUNT(CASE WHEN severity = 'high' THEN 1 END) as high,
      COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium,
      COUNT(CASE WHEN severity = 'low' THEN 1 END) as low,
      AVG(CASE WHEN resolution_time_hours IS NOT NULL THEN resolution_time_hours END) as avg_resolution_time
    FROM incidents i
    ${timeCondition}
  `).first();
  
  const incidentTrends = await db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as incidents,
      COUNT(CASE WHEN severity IN ('critical', 'high') THEN 1 END) as high_severity
    FROM incidents i
    ${timeCondition}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all();
  
  return {
    overview: incidentStats,
    trends: incidentTrends.results || [],
    timeframe: timeframe
  };
}

async function generateKRITrendsData(db: any, timeframe: string): Promise<any> {
  const timeCondition = getTimeCondition(timeframe, 'kr');
  
  const kriStats = await db.prepare(`
    SELECT 
      COUNT(DISTINCT kri_id) as total_kris,
      COUNT(*) as total_readings,
      AVG(value) as avg_value,
      COUNT(CASE WHEN status = 'red' THEN 1 END) as red_alerts,
      COUNT(CASE WHEN status = 'amber' THEN 1 END) as amber_warnings
    FROM kri_readings kr
    ${timeCondition}
  `).first();
  
  const kriTrends = await db.prepare(`
    SELECT 
      k.name as kri_name,
      COUNT(kr.id) as readings_count,
      AVG(kr.value) as avg_value,
      MAX(kr.value) as max_value,
      MIN(kr.value) as min_value
    FROM kri_readings kr
    JOIN kris k ON kr.kri_id = k.id
    ${timeCondition}
    GROUP BY k.id, k.name
    ORDER BY readings_count DESC
    LIMIT 10
  `).all();
  
  return {
    overview: kriStats,
    trends: kriTrends.results || [],
    timeframe: timeframe
  };
}

async function generateSecurityMetricsData(db: any, timeframe: string): Promise<any> {
  const timeCondition = getTimeCondition(timeframe, 'sa');
  
  const securityStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_alerts,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
      COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating,
      AVG(CASE WHEN resolved_at IS NOT NULL THEN 
        (julianday(resolved_at) - julianday(created_at)) * 24 
      END) as avg_resolution_hours
    FROM security_alerts sa
    ${timeCondition}
  `).first();
  
  return {
    overview: securityStats || { total_alerts: 0, resolved: 0, investigating: 0, avg_resolution_hours: 0 },
    timeframe: timeframe
  };
}

async function generateExecutiveSummaryData(db: any, timeframe: string): Promise<any> {
  // Combine key metrics from all areas
  const riskData = await generateRiskOverviewData(db, timeframe);
  const complianceData = await generateComplianceStatusData(db, timeframe);
  const incidentData = await generateIncidentAnalysisData(db, timeframe);
  
  return {
    risks: riskData,
    compliance: complianceData,
    incidents: incidentData,
    timeframe: timeframe
  };
}

function getTimeCondition(timeframe: string, tableAlias: string = ''): string {
  const alias = tableAlias ? `${tableAlias}.` : '';
  
  switch (timeframe) {
    case 'last_7_days':
      return `WHERE ${alias}created_at >= datetime('now', '-7 days')`;
    case 'last_30_days':
      return `WHERE ${alias}created_at >= datetime('now', '-30 days')`;
    case 'last_90_days':
      return `WHERE ${alias}created_at >= datetime('now', '-90 days')`;
    case 'last_year':
      return `WHERE ${alias}created_at >= datetime('now', '-1 year')`;
    default:
      return `WHERE ${alias}created_at >= datetime('now', '-30 days')`;
  }
}

function buildReportPrompt(reportType: string, data: any, timeframe: string): string {
  const basePrompt = `You are ARIA, an AI Risk Intelligence Assistant. Generate a comprehensive business intelligence report based on the following data.

Report Type: ${reportType.replace('_', ' ').toUpperCase()}
Timeframe: ${timeframe.replace('_', ' ')}
Data: ${JSON.stringify(data, null, 2)}

Please provide:
1. Executive Summary (2-3 paragraphs)
2. Key Findings (bullet points)
3. Risk Assessment and Trends
4. Strategic Recommendations (actionable items)
5. Areas of Concern (if any)

Format the response in clear, business-appropriate language suitable for executives and risk managers. Focus on actionable insights and strategic implications.`;

  return basePrompt;
}

function getReportTitle(reportType: string): string {
  const titles = {
    'risk_overview': 'Risk Management Overview Report',
    'compliance_status': 'Compliance Status Report',
    'incident_analysis': 'Security Incident Analysis Report',
    'kri_trends': 'Key Risk Indicators Trend Report',
    'security_metrics': 'Security Metrics Dashboard Report',
    'executive_summary': 'Executive Summary Report'
  };
  
  return titles[reportType] || 'Business Intelligence Report';
}

function generateChartConfigs(data: any, reportType: string): any {
  // Generate Chart.js configurations based on report type and data
  const charts = [];
  
  switch (reportType) {
    case 'risk_overview':
      if (data.overview) {
        charts.push({
          type: 'doughnut',
          title: 'Risk Distribution',
          data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
              data: [data.overview.high_risks, data.overview.medium_risks, data.overview.low_risks],
              backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
            }]
          }
        });
      }
      
      if (data.by_category && data.by_category.length > 0) {
        charts.push({
          type: 'bar',
          title: 'Risks by Category',
          data: {
            labels: data.by_category.map(item => item.category),
            datasets: [{
              label: 'Risk Count',
              data: data.by_category.map(item => item.count),
              backgroundColor: '#6366f1'
            }]
          }
        });
      }
      break;
      
    case 'incident_analysis':
      if (data.overview) {
        charts.push({
          type: 'doughnut',
          title: 'Incidents by Severity',
          data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
              data: [data.overview.critical, data.overview.high, data.overview.medium, data.overview.low],
              backgroundColor: ['#dc2626', '#ea580c', '#d97706', '#65a30d']
            }]
          }
        });
      }
      break;
  }
  
  return charts;
}

function extractRecommendations(aiResponse: string): string[] {
  // Extract recommendation bullets from AI response
  const lines = aiResponse.split('\n');
  const recommendations = [];
  let inRecommendations = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes('recommendation')) {
      inRecommendations = true;
      continue;
    }
    
    if (inRecommendations && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
      recommendations.push(line.replace(/^[•\-*\s]+/, '').trim());
    } else if (inRecommendations && line.trim() === '') {
      continue;
    } else if (inRecommendations && !line.startsWith(' ')) {
      break;
    }
  }
  
  return recommendations;
}

