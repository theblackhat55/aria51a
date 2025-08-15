// RAG API Routes
// Provides endpoints for RAG system management and querying

import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { ragServer } from '../rag/rag-server';
import { mcpServer } from '../mcp/mcp-server';
import { vectorStore } from '../vector-store/local-vector-store';

export function createRAGAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Initialize RAG system
  app.post('/initialize', async (c) => {
    try {
      await ragServer.initialize();
      await mcpServer.initialize();

      return c.json({
        success: true,
        message: 'RAG system initialized successfully',
        data: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('RAG initialization error:', error);
      return c.json({
        success: false,
        message: 'Failed to initialize RAG system',
        error: error.message
      }, 500);
    }
  });

  // RAG system health check
  app.get('/health', async (c) => {
    try {
      const isHealthy = await ragServer.isHealthy();
      const mcpHealthy = await mcpServer.isHealthy();
      
      return c.json({
        success: true,
        data: {
          status: isHealthy && mcpHealthy ? 'healthy' : 'degraded',
          rag_server: isHealthy,
          mcp_server: mcpHealthy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        data: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }, 500);
    }
  });

  // Get RAG system statistics
  app.get('/stats', async (c) => {
    try {
      const stats = await ragServer.getStats();
      
      // Get additional stats from database
      const db = c.env.DB;
      const dbStats = await db.prepare(`
        SELECT 
          COUNT(DISTINCT id) as total_documents,
          COUNT(DISTINCT source_type) as source_types,
          AVG(token_count) as avg_tokens,
          MAX(created_at) as last_updated
        FROM vector_documents
      `).first();

      const queryStats = await db.prepare(`
        SELECT 
          COUNT(*) as total_queries,
          AVG(response_time_ms) as avg_response_time,
          AVG(results_count) as avg_results
        FROM rag_queries 
        WHERE created_at >= datetime('now', '-7 days')
      `).first();

      return c.json({
        success: true,
        data: {
          ...stats,
          database: dbStats,
          queries: queryStats,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Stats error:', error);
      return c.json({
        success: false,
        message: 'Failed to get RAG statistics',
        error: error.message
      }, 500);
    }
  });

  // Perform RAG query
  app.post('/query', async (c) => {
    try {
      const body = await c.req.json();
      const { query, sourceTypes, limit, threshold, includeMetadata } = body;

      if (!query || typeof query !== 'string') {
        return c.json({
          success: false,
          message: 'Query text is required'
        }, 400);
      }

      const startTime = Date.now();

      // Perform RAG query
      const result = await ragServer.query({
        query,
        sourceTypes,
        limit: limit || 10,
        threshold: threshold || 0.3,
        includeMetadata: includeMetadata || false
      });

      const totalTime = Date.now() - startTime;

      // Store query in database for analytics
      const db = c.env.DB;
      await db.prepare(`
        INSERT INTO rag_queries (
          query_text, source_types_json, limit_count, threshold_score,
          response_time_ms, results_count, embedding_time_ms, search_time_ms,
          user_id, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        query,
        JSON.stringify(sourceTypes || []),
        limit || 10,
        threshold || 0.3,
        totalTime,
        result.sources.length,
        result.metadata.embeddingTime,
        result.metadata.searchTime,
        null, // TODO: Get user ID from auth
        null  // TODO: Get session ID
      ).run();

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('RAG query error:', error);
      return c.json({
        success: false,
        message: 'RAG query failed',
        error: error.message
      }, 500);
    }
  });

  // Index GRC entity
  app.post('/index/entity', async (c) => {
    try {
      const body = await c.req.json();
      const { entity, entityType } = body;

      if (!entity || !entityType) {
        return c.json({
          success: false,
          message: 'Entity and entityType are required'
        }, 400);
      }

      const result = await ragServer.indexGRCEntity(entity, entityType);

      // Store indexing results in database
      if (result.success) {
        const db = c.env.DB;
        await db.prepare(`
          UPDATE rag_system_stats 
          SET metric_value = metric_value + ? 
          WHERE stat_date = DATE('now') AND metric_name = 'total_documents'
        `).bind(result.chunksCreated).run();
      }

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Entity indexing error:', error);
      return c.json({
        success: false,
        message: 'Failed to index entity',
        error: error.message
      }, 500);
    }
  });

  // Index uploaded document
  app.post('/index/document', async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json({
          success: false,
          message: 'File is required'
        }, 400);
      }

      const startTime = Date.now();
      const db = c.env.DB;

      // Create upload record
      const uploadResult = await db.prepare(`
        INSERT INTO document_uploads (filename, file_size, file_type, status)
        VALUES (?, ?, ?, 'processing')
      `).bind(file.name, file.size, file.type).run();

      try {
        // Index the document
        const result = await ragServer.indexDocument(file);
        const processingTime = Date.now() - startTime;

        // Update upload record
        await db.prepare(`
          UPDATE document_uploads 
          SET chunks_created = ?, processing_time_ms = ?, status = 'completed'
          WHERE id = ?
        `).bind(result.chunksCreated, processingTime, uploadResult.meta.last_row_id).run();

        return c.json({
          success: true,
          data: {
            ...result,
            uploadId: uploadResult.meta.last_row_id,
            filename: file.name
          }
        });
      } catch (error) {
        // Update upload record with error
        await db.prepare(`
          UPDATE document_uploads 
          SET status = 'failed', error_message = ?
          WHERE id = ?
        `).bind(error.message, uploadResult.meta.last_row_id).run();

        throw error;
      }
    } catch (error) {
      console.error('Document indexing error:', error);
      return c.json({
        success: false,
        message: 'Failed to index document',
        error: error.message
      }, 500);
    }
  });

  // Execute MCP tool
  app.post('/mcp/execute', async (c) => {
    try {
      const body = await c.req.json();
      const { toolName, parameters } = body;

      if (!toolName) {
        return c.json({
          success: false,
          message: 'Tool name is required'
        }, 400);
      }

      const startTime = Date.now();

      const result = await mcpServer.executeTool({
        name: toolName,
        parameters: parameters || {}
      });

      const executionTime = Date.now() - startTime;

      // Store execution in database
      const db = c.env.DB;
      await db.prepare(`
        INSERT INTO mcp_tool_executions (
          tool_name, parameters_json, execution_time_ms, success, 
          error_message, result_size, user_id, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        toolName,
        JSON.stringify(parameters || {}),
        executionTime,
        result.success,
        result.error || null,
        JSON.stringify(result.data || {}).length,
        null, // TODO: Get user ID from auth
        null  // TODO: Get session ID
      ).run();

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('MCP tool execution error:', error);
      return c.json({
        success: false,
        message: 'MCP tool execution failed',
        error: error.message
      }, 500);
    }
  });

  // Get available MCP tools
  app.get('/mcp/tools', async (c) => {
    try {
      const context = await mcpServer.getContext();

      return c.json({
        success: true,
        data: {
          tools: context.tools,
          systemPrompt: context.systemPrompt,
          organizationContext: context.organizationContext
        }
      });
    } catch (error) {
      console.error('MCP tools error:', error);
      return c.json({
        success: false,
        message: 'Failed to get MCP tools',
        error: error.message
      }, 500);
    }
  });

  // Get indexed documents
  app.get('/documents', async (c) => {
    try {
      const { sourceType, limit, offset } = c.req.query();

      const db = c.env.DB;
      let query = `
        SELECT id, title, source_type, source_id, chunk_index, total_chunks, 
               token_count, created_at, updated_at
        FROM vector_documents
      `;
      const params: any[] = [];

      if (sourceType) {
        query += ' WHERE source_type = ?';
        params.push(sourceType);
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit as string) || 50);
      }

      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset as string) || 0);
      }

      const results = await db.prepare(query).bind(...params).all();

      return c.json({
        success: true,
        data: {
          documents: results.results,
          total: results.results?.length || 0
        }
      });
    } catch (error) {
      console.error('Documents list error:', error);
      return c.json({
        success: false,
        message: 'Failed to get documents',
        error: error.message
      }, 500);
    }
  });

  // Delete document
  app.delete('/documents/:id', async (c) => {
    try {
      const documentId = c.req.param('id');

      const result = await vectorStore.deleteDocument(documentId);

      if (result) {
        // Also remove from database
        const db = c.env.DB;
        await db.prepare('DELETE FROM vector_documents WHERE id = ?')
          .bind(documentId).run();
      }

      return c.json({
        success: result,
        message: result ? 'Document deleted successfully' : 'Document not found'
      });
    } catch (error) {
      console.error('Document deletion error:', error);
      return c.json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      }, 500);
    }
  });

  // Clear RAG cache
  app.post('/cache/clear', async (c) => {
    try {
      await vectorStore.clear();

      // Clear database
      const db = c.env.DB;
      await db.prepare('DELETE FROM vector_documents').run();
      await db.prepare('DELETE FROM rag_queries').run();
      await db.prepare('DELETE FROM rag_query_results').run();

      // Reset stats
      await db.prepare(`
        UPDATE rag_system_stats 
        SET metric_value = 0 
        WHERE metric_name IN ('total_documents', 'total_queries')
      `).run();

      return c.json({
        success: true,
        message: 'RAG cache cleared successfully'
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      return c.json({
        success: false,
        message: 'Failed to clear RAG cache',
        error: error.message
      }, 500);
    }
  });

  // Get query analytics
  app.get('/analytics/queries', async (c) => {
    try {
      const { days } = c.req.query();
      const daysPeriod = parseInt(days as string) || 7;

      const db = c.env.DB;

      // Query volume over time
      const volumeData = await db.prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as query_count,
          AVG(response_time_ms) as avg_response_time,
          AVG(results_count) as avg_results
        FROM rag_queries 
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).bind(daysPeriod).all();

      // Popular query patterns
      const popularQueries = await db.prepare(`
        SELECT 
          query_text,
          COUNT(*) as frequency,
          AVG(response_time_ms) as avg_response_time,
          AVG(results_count) as avg_results
        FROM rag_queries
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY query_text
        ORDER BY frequency DESC
        LIMIT 10
      `).bind(daysPeriod).all();

      // Source type usage
      const sourceTypeUsage = await db.prepare(`
        SELECT 
          source_types_json,
          COUNT(*) as usage_count
        FROM rag_queries
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY source_types_json
        ORDER BY usage_count DESC
      `).bind(daysPeriod).all();

      return c.json({
        success: true,
        data: {
          period: `${daysPeriod} days`,
          volume: volumeData.results,
          popularQueries: popularQueries.results,
          sourceTypeUsage: sourceTypeUsage.results
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      return c.json({
        success: false,
        message: 'Failed to get query analytics',
        error: error.message
      }, 500);
    }
  });

  // Get MCP tool analytics
  app.get('/analytics/mcp', async (c) => {
    try {
      const { days } = c.req.query();
      const daysPeriod = parseInt(days as string) || 7;

      const db = c.env.DB;

      const toolUsage = await db.prepare(`
        SELECT 
          tool_name,
          COUNT(*) as executions,
          AVG(execution_time_ms) as avg_execution_time,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM mcp_tool_executions
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY tool_name
        ORDER BY executions DESC
      `).bind(daysPeriod).all();

      return c.json({
        success: true,
        data: {
          period: `${daysPeriod} days`,
          toolUsage: toolUsage.results
        }
      });
    } catch (error) {
      console.error('MCP analytics error:', error);
      return c.json({
        success: false,
        message: 'Failed to get MCP analytics',
        error: error.message
      }, 500);
    }
  });

  return app;
}