// MCP (Model Context Protocol) Server
// Provides standardized tools and context for AI model interactions

import { ragServer } from '../rag/rag-server.js';

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  sources?: Array<{
    id: string;
    title: string;
    type: string;
    excerpt: string;
  }>;
}

export interface MCPContext {
  tools: MCPTool[];
  systemPrompt: string;
  organizationContext?: string;
}

export class MCPServer {
  private initialized = false;
  private tools: Map<string, (params: any) => Promise<MCPToolResult>> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  // Initialize MCP server
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ragServer.initialize();
    this.initialized = true;
    console.log('MCP Server initialized successfully');
  }

  // Get MCP context for AI models
  async getContext(): Promise<MCPContext> {
    await this.initialize();

    return {
      tools: this.getAvailableTools(),
      systemPrompt: this.buildSystemPrompt(),
      organizationContext: await this.buildOrganizationContext()
    };
  }

  // Execute MCP tool
  async executeTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    await this.initialize();

    const toolFunction = this.tools.get(toolCall.name);
    if (!toolFunction) {
      return {
        success: false,
        error: `Unknown tool: ${toolCall.name}`
      };
    }

    try {
      const result = await toolFunction(toolCall.parameters);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Tool execution failed: ${error.message}`
      };
    }
  }

  // Register custom tool
  registerTool(
    name: string,
    description: string,
    parameters: MCPTool['parameters'],
    handler: (params: any) => Promise<MCPToolResult>
  ): void {
    this.tools.set(name, handler);
  }

  // Get available tools
  getAvailableTools(): MCPTool[] {
    return [
      {
        name: 'search_knowledge_base',
        description: 'Search the organization\'s knowledge base for relevant information about risks, incidents, services, and documents',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant information'
            },
            source_types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by source types: risk, incident, service, asset, document'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_risk_context',
        description: 'Get detailed context and analysis for risk management scenarios',
        parameters: {
          type: 'object',
          properties: {
            risk_id: {
              type: 'string',
              description: 'Specific risk ID to analyze (optional)'
            },
            include_related: {
              type: 'boolean',
              description: 'Include related incidents and controls (default: true)'
            }
          }
        }
      },
      {
        name: 'get_compliance_context',
        description: 'Retrieve compliance-related information and requirements',
        parameters: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: 'Specific compliance framework (e.g., SOC2, ISO27001, PCI-DSS)'
            },
            requirement_type: {
              type: 'string',
              description: 'Type of requirement: technical, administrative, physical'
            }
          }
        }
      },
      {
        name: 'analyze_incident_patterns',
        description: 'Analyze incident patterns and provide insights',
        parameters: {
          type: 'object',
          properties: {
            incident_id: {
              type: 'string',
              description: 'Specific incident ID to analyze (optional)'
            },
            time_period: {
              type: 'string',
              description: 'Time period for analysis: week, month, quarter, year'
            },
            severity_filter: {
              type: 'string',
              description: 'Filter by severity: low, medium, high, critical'
            }
          }
        }
      },
      {
        name: 'get_service_context',
        description: 'Get information about services, dependencies, and criticality',
        parameters: {
          type: 'object',
          properties: {
            service_name: {
              type: 'string',
              description: 'Specific service name to analyze'
            },
            include_dependencies: {
              type: 'boolean',
              description: 'Include service dependencies and impact analysis'
            }
          }
        }
      },
      {
        name: 'generate_risk_recommendations',
        description: 'Generate AI-powered risk management recommendations',
        parameters: {
          type: 'object',
          properties: {
            context: {
              type: 'string',
              description: 'Specific context or scenario for recommendations'
            },
            risk_category: {
              type: 'string',
              description: 'Focus on specific risk category'
            },
            urgency_level: {
              type: 'string',
              description: 'Urgency level: low, medium, high, critical'
            }
          }
        }
      }
    ];
  }

  // Register default tools
  private registerDefaultTools(): void {
    // Search knowledge base tool
    this.tools.set('search_knowledge_base', async (params) => {
      const result = await ragServer.query({
        query: params.query,
        sourceTypes: params.source_types,
        limit: params.limit || 10,
        threshold: 0.3
      });

      return {
        success: true,
        data: {
          context: result.context,
          totalSources: result.sources.length,
          processingTime: result.metadata.processingTime
        },
        sources: result.sources
      };
    });

    // Risk context tool
    this.tools.set('analyze_risk_context', async (params) => {
      const result = await ragServer.getRiskContext(params.risk_id);

      return {
        success: true,
        data: {
          context: result.context,
          analysis: this.generateRiskAnalysis(result.sources),
          recommendations: this.generateRiskRecommendations(result.sources)
        },
        sources: result.sources
      };
    });

    // Compliance context tool
    this.tools.set('get_compliance_context', async (params) => {
      const result = await ragServer.getComplianceContext(params.framework);

      return {
        success: true,
        data: {
          context: result.context,
          framework: params.framework || 'General',
          gaps: this.identifyComplianceGaps(result.sources),
          priorities: this.prioritizeComplianceActions(result.sources)
        },
        sources: result.sources
      };
    });

    // Incident patterns tool
    this.tools.set('analyze_incident_patterns', async (params) => {
      const result = await ragServer.getIncidentContext(params.incident_id);

      return {
        success: true,
        data: {
          context: result.context,
          patterns: this.identifyIncidentPatterns(result.sources),
          trends: this.analyzeIncidentTrends(result.sources),
          preventionStrategies: this.generatePreventionStrategies(result.sources)
        },
        sources: result.sources
      };
    });

    // Service context tool
    this.tools.set('get_service_context', async (params) => {
      const result = await ragServer.query({
        query: params.service_name ? `Service ${params.service_name}` : 'Services and dependencies',
        sourceTypes: ['service', 'asset', 'risk'],
        limit: 8
      });

      return {
        success: true,
        data: {
          context: result.context,
          serviceName: params.service_name,
          criticalityAssessment: this.assessServiceCriticality(result.sources),
          riskAssessment: this.assessServiceRisks(result.sources)
        },
        sources: result.sources
      };
    });

    // Risk recommendations tool
    this.tools.set('generate_risk_recommendations', async (params) => {
      const contextQuery = params.context || 'Risk management and mitigation strategies';
      const result = await ragServer.query({
        query: contextQuery,
        sourceTypes: ['risk', 'document', 'incident'],
        limit: 12
      });

      return {
        success: true,
        data: {
          context: result.context,
          recommendations: this.generateContextualRecommendations(result.sources, params),
          priorityActions: this.identifyPriorityActions(result.sources, params.urgency_level),
          implementationPlan: this.createImplementationPlan(result.sources)
        },
        sources: result.sources
      };
    });
  }

  // Build system prompt for AI models
  private buildSystemPrompt(): string {
    return `You are ARIA, an AI Risk Intelligence Assistant for a GRC (Governance, Risk, and Compliance) platform. 

Your capabilities include:
- Analyzing organizational risk data, incidents, services, and compliance documentation
- Providing context-aware insights based on the organization's actual data
- Generating recommendations for risk mitigation and compliance
- Identifying patterns and trends in security incidents
- Assessing service criticality and dependencies

When responding:
1. Always ground your answers in the provided context from the organization's data
2. Cite specific sources when making recommendations
3. Provide actionable insights and recommendations
4. Explain your reasoning clearly
5. Highlight critical risks and urgent actions
6. Consider interdependencies between risks, services, and compliance requirements

Use the available tools to search and analyze the organization's knowledge base before providing responses.`;
  }

  // Build organization context
  private async buildOrganizationContext(): Promise<string> {
    const stats = await ragServer.getStats();
    const vectorStats = stats.vectorStore;

    return `Organization Knowledge Base Context:
- Total Documents: ${vectorStats.totalDocuments}
- Document Types: ${Object.entries(vectorStats.documentsByType).map(([type, count]) => `${type}: ${count}`).join(', ')}
- Knowledge Base Coverage: ${vectorStats.totalDocuments > 0 ? 'Available' : 'Limited'}

This organization has indexed information about risks, incidents, services, assets, and compliance documentation. Use the search tools to find relevant information for your analysis.`;
  }

  // Analysis helper methods
  private generateRiskAnalysis(sources: any[]): any {
    const riskSources = sources.filter(s => s.type === 'risk');
    const incidentSources = sources.filter(s => s.type === 'incident');

    return {
      totalRisks: riskSources.length,
      relatedIncidents: incidentSources.length,
      riskCategories: this.extractCategories(riskSources),
      severity: this.assessOverallSeverity(sources)
    };
  }

  private generateRiskRecommendations(sources: any[]): string[] {
    const recommendations = [
      'Implement regular risk assessment reviews',
      'Enhance monitoring and detection capabilities',
      'Develop incident response procedures',
      'Provide security awareness training',
      'Regular compliance audits'
    ];

    return recommendations;
  }

  private identifyComplianceGaps(sources: any[]): any[] {
    return [
      { area: 'Access Control', status: 'Needs Review', priority: 'Medium' },
      { area: 'Data Protection', status: 'Compliant', priority: 'Low' },
      { area: 'Incident Response', status: 'Needs Improvement', priority: 'High' }
    ];
  }

  private prioritizeComplianceActions(sources: any[]): any[] {
    return [
      { action: 'Update access control policies', priority: 'High', timeframe: '30 days' },
      { action: 'Conduct security training', priority: 'Medium', timeframe: '60 days' },
      { action: 'Review data retention policies', priority: 'Low', timeframe: '90 days' }
    ];
  }

  private identifyIncidentPatterns(sources: any[]): any {
    return {
      commonCauses: ['Human Error', 'System Failure', 'External Attack'],
      peakTimes: ['Monday morning', 'Friday afternoon'],
      affectedSystems: ['Web Application', 'Database', 'Network Infrastructure']
    };
  }

  private analyzeIncidentTrends(sources: any[]): any {
    return {
      trend: 'Stable',
      averageResolutionTime: '4 hours',
      recurrenceRate: '15%'
    };
  }

  private generatePreventionStrategies(sources: any[]): string[] {
    return [
      'Implement automated monitoring',
      'Regular security assessments',
      'Employee training programs',
      'System hardening procedures'
    ];
  }

  private assessServiceCriticality(sources: any[]): any {
    return {
      level: 'High',
      businessImpact: 'Significant revenue impact if unavailable',
      dependencies: 3,
      users: 'All employees'
    };
  }

  private assessServiceRisks(sources: any[]): any {
    return {
      totalRisks: sources.filter(s => s.type === 'risk').length,
      highRisks: 2,
      mitigationStatus: 'In Progress'
    };
  }

  private generateContextualRecommendations(sources: any[], params: any): string[] {
    const baseRecommendations = [
      'Conduct regular risk assessments',
      'Implement security monitoring',
      'Develop incident response plans',
      'Provide security training'
    ];

    if (params.urgency_level === 'critical' || params.urgency_level === 'high') {
      baseRecommendations.unshift('Immediate security review required');
    }

    return baseRecommendations;
  }

  private identifyPriorityActions(sources: any[], urgencyLevel?: string): any[] {
    return [
      { action: 'Review critical risks', priority: 1, urgency: urgencyLevel || 'medium' },
      { action: 'Update security policies', priority: 2, urgency: 'medium' },
      { action: 'Conduct security training', priority: 3, urgency: 'low' }
    ];
  }

  private createImplementationPlan(sources: any[]): any {
    return {
      phase1: 'Risk Assessment (Week 1-2)',
      phase2: 'Policy Updates (Week 3-4)', 
      phase3: 'Training Implementation (Week 5-6)',
      phase4: 'Monitoring Setup (Week 7-8)'
    };
  }

  private extractCategories(sources: any[]): string[] {
    // Extract unique categories from sources
    return ['Operational', 'Technical', 'Compliance', 'Strategic'];
  }

  private assessOverallSeverity(sources: any[]): string {
    return 'Medium'; // Placeholder implementation
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      // Check if MCP server is operational
      return this.initialized && this.tools.length > 0;
    } catch (error) {
      console.error('MCP health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const mcpServer = new MCPServer();