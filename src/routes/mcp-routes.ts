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

  return app;
}
