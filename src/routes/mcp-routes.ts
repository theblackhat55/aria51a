/**
 * MCP Server Routes for ARIA5.1
 * 
 * Provides HTTP endpoints for MCP server functionality
 */

import { Hono } from 'hono';
import { createMCPServer } from '../mcp-server/mcp-server';
import type { CloudflareBindings } from '../types';

export function createMCPRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  /**
   * MCP Health Check
   */
  app.get('/health', async (c) => {
    try {
      const mcpServer = createMCPServer(c.env as any);
      const health = await mcpServer.healthCheck();
      
      return c.json({
        status: health.status,
        services: health.services,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return c.json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * List all available MCP tools
   */
  app.get('/tools', async (c) => {
    try {
      const mcpServer = createMCPServer(c.env as any);
      const tools = mcpServer.listTools();
      
      return c.json({
        tools,
        count: tools.length
      });
    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Execute MCP tool
   */
  app.post('/tools/:toolName', async (c) => {
    try {
      const toolName = c.req.param('toolName');
      const args = await c.req.json();
      
      const mcpServer = createMCPServer(c.env as any);
      const result = await mcpServer.executeTool(toolName, args);
      
      return c.json(result);
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * List all available MCP resources
   */
  app.get('/resources', async (c) => {
    try {
      const mcpServer = createMCPServer(c.env as any);
      const resources = mcpServer.listResources();
      
      return c.json({
        resources,
        count: resources.length
      });
    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Fetch MCP resource
   */
  app.get('/resources/*', async (c) => {
    try {
      const uri = c.req.path.replace('/mcp/resources/', '');
      
      const mcpServer = createMCPServer(c.env as any);
      const resource = await mcpServer.fetchResource(uri);
      
      return c.json(resource);
    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 404);
    }
  });

  /**
   * Semantic search endpoint (unified interface)
   */
  app.post('/search', async (c) => {
    try {
      const { query, type, filters, topK } = await c.req.json();
      
      const mcpServer = createMCPServer(c.env as any);
      
      // Route to appropriate tool based on type
      const toolMap: Record<string, string> = {
        'risks': 'search_risks_semantic',
        'threats': 'search_threats_semantic',
        'compliance': 'search_compliance_semantic',
        'documents': 'search_documents_semantic'
      };
      
      const toolName = toolMap[type] || 'search_risks_semantic';
      
      const result = await mcpServer.executeTool(toolName, {
        query,
        topK: topK || 10,
        filters
      });
      
      return c.json(result);
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Hybrid search endpoint (combines semantic + keyword)
   */
  app.post('/search/hybrid', async (c) => {
    try {
      const { query, namespace, filters, topK, config } = await c.req.json();
      
      // Import HybridSearchService
      const { HybridSearchService } = await import('../mcp-server/services/hybrid-search-service');
      const hybridSearch = new HybridSearchService(c.env as any, config);
      
      const results = await hybridSearch.search({
        query,
        namespace: namespace || 'risks',
        filters,
        topK: topK || 10,
        config
      });
      
      return c.json({
        success: true,
        results,
        count: results.length,
        method: 'hybrid',
        config: hybridSearch.getConfig()
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * List all available MCP prompts
   */
  app.get('/prompts', async (c) => {
    try {
      const mcpServer = createMCPServer(c.env as any);
      const prompts = mcpServer.listPrompts();
      
      return c.json({
        prompts,
        count: prompts.length
      });
    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Get prompt template by name
   */
  app.get('/prompts/:promptName', async (c) => {
    try {
      const promptName = c.req.param('promptName');
      const mcpServer = createMCPServer(c.env as any);
      
      // Get prompt details
      const prompts = mcpServer.listPrompts();
      const prompt = prompts.find(p => p.name === promptName);
      
      if (!prompt) {
        return c.json({
          error: `Prompt not found: ${promptName}`
        }, 404);
      }
      
      return c.json(prompt);
    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Execute prompt with arguments
   */
  app.post('/prompts/:promptName/execute', async (c) => {
    try {
      const promptName = c.req.param('promptName');
      const args = await c.req.json();
      
      const mcpServer = createMCPServer(c.env as any);
      const promptText = mcpServer.getPrompt(promptName, args);
      
      return c.json({
        success: true,
        prompt: promptName,
        generatedPrompt: promptText,
        arguments: args
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Vectorize statistics
   */
  app.get('/stats', async (c) => {
    try {
      const mcpServer = createMCPServer(c.env as any);
      const vectorize = mcpServer.getVectorizeService();
      const stats = await vectorize.getVectorizeStats();
      
      return c.json(stats);
    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Batch indexing endpoint (Admin only)
   * Triggers indexing of existing data into Vectorize
   */
  app.post('/admin/batch-index', async (c) => {
    try {
      const { namespace, batchSize, dryRun } = await c.req.json();
      
      // Import BatchIndexer
      const { BatchIndexer } = await import('../mcp-server/scripts/batch-indexer');
      const indexer = new BatchIndexer(c.env as any);
      
      let result;
      switch (namespace) {
        case 'risks':
          result = await indexer.indexRisks({ batchSize, dryRun });
          break;
        case 'incidents':
          result = await indexer.indexIncidents({ batchSize, dryRun });
          break;
        case 'compliance':
          result = await indexer.indexComplianceControls({ batchSize, dryRun });
          break;
        case 'documents':
          result = await indexer.indexDocuments({ batchSize, dryRun });
          break;
        case 'all':
        default:
          result = await indexer.indexAll({ batchSize, dryRun });
          break;
      }
      
      return c.json({
        success: true,
        namespace: namespace || 'all',
        result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  });

  return app;
}
