/**
 * ARIA5.1 MCP Server - Core Implementation
 * 
 * Provides Model Context Protocol server with tools, resources, and prompts
 * for semantic search and RAG capabilities across the ARIA platform.
 */

import type { MCPEnvironment, MCPTool, MCPResource, MCPPrompt } from './types/mcp-types';
import { VectorizeService } from './services/vectorize-service';
import { DocumentProcessor } from './services/document-processor';

// Import tools
import { searchRisksSemantic } from './tools/risk-tools';
import { threatTools } from './tools/threat-tools';
import { complianceTools } from './tools/compliance-tools';
import { documentTools } from './tools/document-tools';
import { correlationTools } from './tools/correlation-tools';

// Import resources
import { riskRegisterResource, complianceFrameworkResource } from './resources/platform-resources';
import { nistCsfResource } from './resources/nist-csf-resource';
import { iso27001Resource } from './resources/iso27001-resource';

export class MCPServer {
  private env: MCPEnvironment;
  private vectorize: VectorizeService;
  private documentProcessor: DocumentProcessor;
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private prompts: Map<string, MCPPrompt> = new Map();

  constructor(env: MCPEnvironment) {
    this.env = env;
    this.vectorize = new VectorizeService(env);
    this.documentProcessor = new DocumentProcessor();
    
    this.registerTools();
    this.registerResources();
    this.registerPrompts();
  }

  /**
   * Register all MCP tools
   */
  private registerTools(): void {
    // Risk management tools (1 tool)
    this.tools.set('search_risks_semantic', searchRisksSemantic);
    
    // Threat intelligence tools (3 tools)
    threatTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
    
    // Compliance tools (3 tools)
    complianceTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
    
    // Document management tools (4 tools)
    documentTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
    
    // Cross-namespace correlation tools (2 tools)
    correlationTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
    
    console.log(`✅ Registered ${this.tools.size} MCP tools`);
  }

  /**
   * Register all MCP resources
   */
  private registerResources(): void {
    this.resources.set('risk_register://current', riskRegisterResource);
    this.resources.set('compliance://frameworks', complianceFrameworkResource);
    this.resources.set('compliance://nist-csf', nistCsfResource);
    this.resources.set('compliance://iso-27001', iso27001Resource);
    
    console.log(`✅ Registered ${this.resources.size} MCP resources`);
  }

  /**
   * Register all MCP prompts
   */
  private registerPrompts(): void {
    // Risk analysis prompts
    this.prompts.set('analyze_risk_with_context', {
      name: 'analyze_risk_with_context',
      description: 'Analyze risk with full platform context',
      arguments: [
        { name: 'risk_id', description: 'Risk ID to analyze', required: true, type: 'number' }
      ],
      template: (args) => `Analyze risk ID ${args.risk_id} with current platform context including related threats, controls, and incidents. Provide comprehensive risk assessment with recommendations.`
    });
    
    console.log(`✅ Registered ${this.prompts.size} MCP prompts`);
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    console.log(`🔧 Executing tool: ${toolName}`);
    
    try {
      const result = await tool.execute(args, this.env);
      return {
        success: true,
        tool: toolName,
        result
      };
    } catch (error) {
      console.error(`❌ Tool execution error (${toolName}):`, error);
      return {
        success: false,
        tool: toolName,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch a resource by URI
   */
  async fetchResource(uri: string): Promise<any> {
    const resource = this.resources.get(uri);
    
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }
    
    console.log(`📚 Fetching resource: ${uri}`);
    
    try {
      return await resource.fetch(this.env);
    } catch (error) {
      console.error(`❌ Resource fetch error (${uri}):`, error);
      throw error;
    }
  }

  /**
   * Get prompt by name
   */
  getPrompt(promptName: string, args: Record<string, any>): string {
    const prompt = this.prompts.get(promptName);
    
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptName}`);
    }
    
    return prompt.template(args);
  }

  /**
   * List all available tools
   */
  listTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }

  /**
   * List all available resources
   */
  listResources(): Array<{ uri: string; name: string; description: string }> {
    return Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description
    }));
  }

  /**
   * List all available prompts
   */
  listPrompts(): Array<{ name: string; description: string }> {
    return Array.from(this.prompts.values()).map(prompt => ({
      name: prompt.name,
      description: prompt.description
    }));
  }

  /**
   * Get VectorizeService instance
   */
  getVectorizeService(): VectorizeService {
    return this.vectorize;
  }

  /**
   * Get DocumentProcessor instance
   */
  getDocumentProcessor(): DocumentProcessor {
    return this.documentProcessor;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    const health = {
      status: 'healthy',
      services: {
        database: false,
        vectorize: false,
        workersAI: false
      }
    };

    try {
      // Check database
      await this.env.DB.prepare('SELECT 1').first();
      health.services.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Check Vectorize stats
      await this.vectorize.getVectorizeStats();
      health.services.vectorize = true;
    } catch (error) {
      console.error('Vectorize health check failed:', error);
    }

    try {
      // Check Workers AI
      await this.vectorize.generateEmbedding({ text: 'health check' });
      health.services.workersAI = true;
    } catch (error) {
      console.error('Workers AI health check failed:', error);
    }

    health.status = Object.values(health.services).every(s => s) ? 'healthy' : 'degraded';
    
    return health;
  }
}

/**
 * Create and initialize MCP Server
 */
export function createMCPServer(env: MCPEnvironment): MCPServer {
  return new MCPServer(env);
}
