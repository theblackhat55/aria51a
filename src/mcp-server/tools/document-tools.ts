/**
 * Document Management MCP Tools
 * 
 * Provides semantic search and management capabilities for uploaded documents,
 * including indexing, chunking, and retrieval operations.
 */

import type { MCPTool, MCPEnvironment, SemanticSearchOptions } from '../types/mcp-types';
import { VectorizeService } from '../services/vectorize-service';
import { DocumentProcessor } from '../services/document-processor';

/**
 * Search Documents using Semantic Understanding
 * 
 * Searches uploaded documents using natural language queries with semantic understanding.
 * Supports filtering by document type, organization, and embedding status.
 * 
 * Example Queries:
 * - "security policies for data classification"
 * - "incident response procedures for ransomware"
 * - "risk assessment methodologies"
 */
export const searchDocumentsSemantic: MCPTool = {
  name: 'search_documents_semantic',
  description: 'Search uploaded documents using semantic understanding. Supports natural language queries across document content, returning relevant passages with context.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query to search across document content (e.g., "data protection policies", "access control procedures")'
      },
      topK: {
        type: 'number',
        default: 10,
        description: 'Maximum number of document chunks to return (1-50)'
      },
      filters: {
        type: 'object',
        properties: {
          document_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by document types (e.g., ["policy", "procedure", "standard"])'
          },
          organization_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'Filter by organization IDs'
          },
          embedding_status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
            description: 'Filter by embedding status'
          },
          date_range: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      group_by_document: {
        type: 'boolean',
        default: false,
        description: 'Group results by parent document instead of individual chunks'
      }
    },
    required: ['query']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { 
      query, 
      topK = 10, 
      filters = {}, 
      group_by_document = false 
    } = args;
    
    try {
      // Initialize Vectorize service
      const vectorize = new VectorizeService(env);
      
      // Perform semantic search in documents namespace
      const searchOptions: SemanticSearchOptions = {
        query,
        topK: Math.min(Math.max(topK, 1), 50),
        namespace: 'documents',
        filters: filters
      };
      
      const semanticResults = await vectorize.searchNamespace(
        searchOptions.query,
        searchOptions.namespace,
        {
          topK: searchOptions.topK,
          returnMetadata: true
        }
      );
      
      if (semanticResults.length === 0) {
        return {
          chunks: [],
          documents: [],
          total: 0,
          query,
          message: 'No document content found matching the semantic query'
        };
      }
      
      // Extract chunk IDs from semantic results
      const chunkIds = semanticResults
        .filter(result => result.metadata && result.metadata.recordId)
        .map(result => parseInt(result.metadata.recordId as string));
      
      // Fetch chunk details with parent document info
      const chunksResult = await env.DB.prepare(`
        SELECT 
          dc.id,
          dc.document_id,
          dc.chunk_index,
          dc.content,
          dc.metadata as chunk_metadata,
          rd.title as document_title,
          rd.document_type,
          rd.file_path,
          rd.uploaded_by,
          rd.organization_id,
          rd.created_at as document_created_at,
          u.name as uploaded_by_name
        FROM document_chunks dc
        JOIN rag_documents rd ON dc.document_id = rd.id
        LEFT JOIN users u ON rd.uploaded_by = u.id
        WHERE dc.id IN (${chunkIds.join(',')})
      `).all();
      
      // Apply additional filters
      let filteredChunks = chunksResult.results as any[];
      
      if (filters.document_types && filters.document_types.length > 0) {
        filteredChunks = filteredChunks.filter(chunk => 
          filters.document_types.includes(chunk.document_type)
        );
      }
      
      if (filters.organization_ids && filters.organization_ids.length > 0) {
        filteredChunks = filteredChunks.filter(chunk => 
          filters.organization_ids.includes(chunk.organization_id)
        );
      }
      
      if (filters.date_range) {
        if (filters.date_range.start) {
          filteredChunks = filteredChunks.filter(chunk => 
            new Date(chunk.document_created_at) >= new Date(filters.date_range.start)
          );
        }
        if (filters.date_range.end) {
          filteredChunks = filteredChunks.filter(chunk => 
            new Date(chunk.document_created_at) <= new Date(filters.date_range.end)
          );
        }
      }
      
      // Enrich with semantic scores
      const enrichedChunks = filteredChunks.map(chunk => {
        const semanticMatch = semanticResults.find(
          r => r.metadata && parseInt(r.metadata.recordId as string) === chunk.id
        );
        
        return {
          ...chunk,
          semantic_score: semanticMatch?.score || 0,
          relevance: `${((semanticMatch?.score || 0) * 100).toFixed(1)}%`,
          // Truncate content for preview
          content_preview: chunk.content.substring(0, 300) + (chunk.content.length > 300 ? '...' : ''),
          content_length: chunk.content.length
        };
      });
      
      // Sort by semantic score
      enrichedChunks.sort((a, b) => b.semantic_score - a.semantic_score);
      
      // Group by document if requested
      if (group_by_document) {
        const documentMap = new Map<number, any>();
        
        enrichedChunks.forEach(chunk => {
          if (!documentMap.has(chunk.document_id)) {
            documentMap.set(chunk.document_id, {
              document_id: chunk.document_id,
              document_title: chunk.document_title,
              document_type: chunk.document_type,
              file_path: chunk.file_path,
              organization_id: chunk.organization_id,
              uploaded_by_name: chunk.uploaded_by_name,
              document_created_at: chunk.document_created_at,
              matching_chunks: [],
              max_relevance: 0,
              avg_relevance: 0
            });
          }
          
          const doc = documentMap.get(chunk.document_id)!;
          doc.matching_chunks.push({
            chunk_id: chunk.id,
            chunk_index: chunk.chunk_index,
            content_preview: chunk.content_preview,
            relevance: chunk.relevance,
            semantic_score: chunk.semantic_score
          });
          
          doc.max_relevance = Math.max(doc.max_relevance, chunk.semantic_score);
        });
        
        // Calculate average relevance for each document
        const documents = Array.from(documentMap.values()).map(doc => {
          const avgScore = doc.matching_chunks.reduce((sum: number, c: any) => sum + c.semantic_score, 0) / doc.matching_chunks.length;
          doc.avg_relevance = `${(avgScore * 100).toFixed(1)}%`;
          doc.chunk_count = doc.matching_chunks.length;
          return doc;
        });
        
        // Sort documents by max relevance
        documents.sort((a, b) => b.max_relevance - a.max_relevance);
        
        return {
          documents,
          total_documents: documents.length,
          total_chunks: enrichedChunks.length,
          query,
          grouped_by_document: true
        };
      }
      
      return {
        chunks: enrichedChunks,
        total: enrichedChunks.length,
        query,
        filters: filters,
        semantic_search_enabled: true
      };
      
    } catch (error: any) {
      console.error('Error in searchDocumentsSemantic:', error);
      return {
        error: true,
        message: error.message || 'Failed to search documents',
        chunks: [],
        total: 0
      };
    }
  }
};

/**
 * Index New Document
 * 
 * Processes and indexes a new document by chunking the content and generating
 * embeddings for semantic search.
 */
export const indexDocument: MCPTool = {
  name: 'index_document',
  description: 'Process and index a new document for semantic search by chunking content and generating embeddings.',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'number',
        description: 'ID of the document to index (must exist in rag_documents table)'
      },
      chunking_strategy: {
        type: 'string',
        enum: ['semantic', 'paragraph', 'fixed'],
        default: 'semantic',
        description: 'Chunking strategy to use for document processing'
      },
      chunk_size: {
        type: 'number',
        default: 512,
        description: 'Target chunk size in tokens (for fixed strategy)'
      },
      chunk_overlap: {
        type: 'number',
        default: 50,
        description: 'Number of overlapping tokens between chunks'
      }
    },
    required: ['document_id']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { 
      document_id, 
      chunking_strategy = 'semantic',
      chunk_size = 512,
      chunk_overlap = 50
    } = args;
    
    try {
      // Fetch document details
      const documentResult = await env.DB.prepare(`
        SELECT id, title, content, document_type, file_path, uploaded_by, organization_id
        FROM rag_documents
        WHERE id = ?
      `).bind(document_id).first();
      
      if (!documentResult) {
        return {
          error: true,
          message: `Document with ID ${document_id} not found`
        };
      }
      
      if (!documentResult.content) {
        return {
          error: true,
          message: 'Document has no content to index'
        };
      }
      
      // Update status to processing
      await env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'processing', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(document_id).run();
      
      // Initialize document processor and vectorize service
      const documentProcessor = new DocumentProcessor();
      const vectorize = new VectorizeService(env);
      
      // Process document into chunks
      const chunks = await documentProcessor.processDocument(
        document_id,
        documentResult.content as string,
        {
          title: documentResult.title as string,
          document_type: documentResult.document_type as string,
          file_path: documentResult.file_path as string,
          organization_id: documentResult.organization_id as number
        },
        {
          chunkSize: chunk_size,
          chunkOverlap: chunk_overlap,
          strategy: chunking_strategy as any,
          preserveContext: true
        }
      );
      
      // Store document chunks and generate embeddings
      const storeResult = await vectorize.storeDocumentChunks(document_id, chunks);
      
      // Update document status
      await env.DB.prepare(`
        UPDATE rag_documents 
        SET 
          embedding_status = 'completed',
          chunk_count = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(chunks.length, document_id).run();
      
      return {
        success: true,
        document_id,
        document_title: documentResult.title,
        chunks_created: chunks.length,
        vectors_indexed: storeResult.vectorsIndexed,
        chunking_strategy,
        processing_time_ms: storeResult.processingTime,
        message: `Successfully indexed document with ${chunks.length} chunks`
      };
      
    } catch (error: any) {
      console.error('Error in indexDocument:', error);
      
      // Update status to failed
      await env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(document_id).run();
      
      return {
        error: true,
        message: error.message || 'Failed to index document',
        document_id
      };
    }
  }
};

/**
 * Get Document Context
 * 
 * Retrieves full document context given a chunk ID, including surrounding chunks
 * and document metadata.
 */
export const getDocumentContext: MCPTool = {
  name: 'get_document_context',
  description: 'Retrieve full document context for a specific chunk, including surrounding chunks and document metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      chunk_id: {
        type: 'number',
        description: 'ID of the document chunk to get context for'
      },
      context_window: {
        type: 'number',
        default: 2,
        description: 'Number of surrounding chunks to include before and after (0-10)'
      },
      include_full_document: {
        type: 'boolean',
        default: false,
        description: 'Include full document content (warning: may be large)'
      }
    },
    required: ['chunk_id']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { chunk_id, context_window = 2, include_full_document = false } = args;
    
    try {
      // Fetch target chunk
      const chunkResult = await env.DB.prepare(`
        SELECT 
          dc.id,
          dc.document_id,
          dc.chunk_index,
          dc.content,
          dc.metadata as chunk_metadata,
          rd.title as document_title,
          rd.document_type,
          rd.file_path,
          rd.chunk_count as total_chunks,
          rd.uploaded_by,
          rd.organization_id,
          rd.created_at as document_created_at,
          u.name as uploaded_by_name
        FROM document_chunks dc
        JOIN rag_documents rd ON dc.document_id = rd.id
        LEFT JOIN users u ON rd.uploaded_by = u.id
        WHERE dc.id = ?
      `).bind(chunk_id).first();
      
      if (!chunkResult) {
        return {
          error: true,
          message: `Chunk with ID ${chunk_id} not found`
        };
      }
      
      // Calculate surrounding chunk range
      const minIndex = Math.max(0, (chunkResult.chunk_index as number) - context_window);
      const maxIndex = Math.min(
        (chunkResult.total_chunks as number) - 1,
        (chunkResult.chunk_index as number) + context_window
      );
      
      // Fetch surrounding chunks
      const surroundingChunksResult = await env.DB.prepare(`
        SELECT id, chunk_index, content, metadata
        FROM document_chunks
        WHERE document_id = ?
          AND chunk_index >= ?
          AND chunk_index <= ?
        ORDER BY chunk_index ASC
      `).bind(chunkResult.document_id, minIndex, maxIndex).all();
      
      const context: any = {
        target_chunk: {
          id: chunkResult.id,
          chunk_index: chunkResult.chunk_index,
          content: chunkResult.content,
          metadata: chunkResult.chunk_metadata
        },
        surrounding_chunks: (surroundingChunksResult.results as any[]).map(chunk => ({
          id: chunk.id,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          is_target: chunk.id === chunk_id
        })),
        document_metadata: {
          document_id: chunkResult.document_id,
          title: chunkResult.document_title,
          document_type: chunkResult.document_type,
          file_path: chunkResult.file_path,
          total_chunks: chunkResult.total_chunks,
          uploaded_by: chunkResult.uploaded_by_name,
          organization_id: chunkResult.organization_id,
          created_at: chunkResult.document_created_at
        },
        context_stats: {
          context_window_used: context_window,
          chunks_returned: surroundingChunksResult.results.length,
          chunk_position: `${(chunkResult.chunk_index as number) + 1} of ${chunkResult.total_chunks}`
        }
      };
      
      // Include full document if requested
      if (include_full_document) {
        const fullDocResult = await env.DB.prepare(`
          SELECT content
          FROM rag_documents
          WHERE id = ?
        `).bind(chunkResult.document_id).first();
        
        if (fullDocResult && fullDocResult.content) {
          context.full_document_content = fullDocResult.content;
          context.full_document_length = (fullDocResult.content as string).length;
        }
      }
      
      return context;
      
    } catch (error: any) {
      console.error('Error in getDocumentContext:', error);
      return {
        error: true,
        message: error.message || 'Failed to retrieve document context'
      };
    }
  }
};

/**
 * Batch Index Documents
 * 
 * Process and index multiple documents in batch for efficiency.
 */
export const batchIndexDocuments: MCPTool = {
  name: 'batch_index_documents',
  description: 'Process and index multiple documents in batch for improved efficiency.',
  inputSchema: {
    type: 'object',
    properties: {
      document_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of document IDs to index'
      },
      chunking_strategy: {
        type: 'string',
        enum: ['semantic', 'paragraph', 'fixed'],
        default: 'semantic'
      },
      chunk_size: {
        type: 'number',
        default: 512
      },
      chunk_overlap: {
        type: 'number',
        default: 50
      }
    },
    required: ['document_ids']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { document_ids, chunking_strategy = 'semantic', chunk_size = 512, chunk_overlap = 50 } = args;
    
    try {
      if (!Array.isArray(document_ids) || document_ids.length === 0) {
        return {
          error: true,
          message: 'document_ids must be a non-empty array'
        };
      }
      
      const results = [];
      let successCount = 0;
      let failCount = 0;
      
      // Process each document
      for (const doc_id of document_ids) {
        try {
          const result = await indexDocument.execute(
            { document_id: doc_id, chunking_strategy, chunk_size, chunk_overlap },
            env
          );
          
          if (result.error) {
            failCount++;
          } else {
            successCount++;
          }
          
          results.push({
            document_id: doc_id,
            status: result.error ? 'failed' : 'success',
            ...result
          });
          
        } catch (error: any) {
          failCount++;
          results.push({
            document_id: doc_id,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      return {
        batch_results: results,
        statistics: {
          total_documents: document_ids.length,
          successful: successCount,
          failed: failCount,
          success_rate: `${((successCount / document_ids.length) * 100).toFixed(1)}%`
        },
        chunking_strategy
      };
      
    } catch (error: any) {
      console.error('Error in batchIndexDocuments:', error);
      return {
        error: true,
        message: error.message || 'Failed to batch index documents'
      };
    }
  }
};

// Export all document tools
export const documentTools = [
  searchDocumentsSemantic,
  indexDocument,
  getDocumentContext,
  batchIndexDocuments
];
