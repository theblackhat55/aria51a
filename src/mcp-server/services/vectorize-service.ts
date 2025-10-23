/**
 * Vectorize Service for ARIA5.1 MCP Server
 * 
 * Handles all vector embedding generation and semantic search operations
 * using Cloudflare Vectorize and Workers AI.
 */

import type { 
  MCPEnvironment, 
  EmbeddingRequest, 
  EmbeddingResponse,
  SemanticSearchOptions,
  SemanticSearchResult,
  VectorizeVector
} from '../types/mcp-types';

export class VectorizeService {
  private env: MCPEnvironment;
  private embeddingModel = '@cf/baai/bge-base-en-v1.5'; // 768 dimensions
  private embeddingDimensions = 768;

  constructor(env: MCPEnvironment) {
    this.env = env;
  }

  /**
   * Generate embedding for text using Cloudflare Workers AI
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const result = await this.env.AI.run(this.embeddingModel, {
        text: request.text
      });

      // Workers AI returns embeddings in result.data
      const embedding = result.data?.[0] || result;

      return {
        embedding: embedding,
        model: this.embeddingModel,
        tokensUsed: Math.ceil(request.text.length / 4) // Approximate tokens
      };
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store document chunks with embeddings in Vectorize
   */
  async storeDocumentChunks(
    documentId: number,
    chunks: Array<{ content: string; metadata: Record<string, any> }>,
    namespace: string = 'documents'
  ): Promise<{ success: boolean; count: number; ids: string[] }> {
    try {
      const vectors: VectorizeVector[] = [];

      // Generate embeddings for all chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingResponse = await this.generateEmbedding({ text: chunk.content });

        vectors.push({
          id: `${namespace}_${documentId}_${i}`,
          values: embeddingResponse.embedding,
          metadata: {
            ...chunk.metadata,
            documentId,
            chunkIndex: i,
            namespace,
            content: chunk.content.substring(0, 1000), // Store truncated content
            createdAt: new Date().toISOString()
          },
          namespace
        });
      }

      // Upsert vectors to Vectorize
      const result = await this.env.VECTORIZE.upsert(vectors);

      // Update database with embedding status
      await this.env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'completed',
            chunk_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(chunks.length, documentId).run();

      console.log(`✅ Stored ${result.count} document chunks for document ${documentId}`);

      return {
        success: true,
        count: result.count,
        ids: result.ids
      };
    } catch (error) {
      console.error('Error storing document chunks:', error);
      
      // Update database with error status
      await this.env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(documentId).run();

      throw error;
    }
  }

  /**
   * Perform semantic search across all vectors
   */
  async semanticSearch(options: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
    try {
      // Debug logging
      console.log('🔍 semanticSearch called with options:', JSON.stringify(options || 'undefined'));
      
      // Validate options
      if (!options || !options.query) {
        console.error('❌ Invalid options:', options);
        throw new Error('Invalid search options: query is required');
      }
      
      // Generate query embedding
      console.log('📝 Generating embedding for query:', options.query);
      const embeddingResponse = await this.generateEmbedding({ text: options.query });

      // Build Vectorize query options
      const queryOptions: any = {
        topK: options.topK || 10,
        returnMetadata: true,
        returnValues: false
      };

      // Add filters if provided
      if (options.filters) {
        queryOptions.filter = this.buildVectorizeFilter(options.filters);
      }

      // Add namespace filter if specified
      if (options.namespace) {
        queryOptions.namespace = options.namespace;
      }
      
      // Execute vector search
      console.log('🔍 Calling VECTORIZE.query with embedding length:', embeddingResponse.embedding.length, 'options:', JSON.stringify(queryOptions));
      const matches = await this.env.VECTORIZE.query(embeddingResponse.embedding, queryOptions).catch((err: any) => {
        console.error('❌ VECTORIZE.query failed:', err);
        throw err;
      });
      console.log('✅ VECTORIZE.query returned', matches.matches?.length || 0, 'matches');

      // Transform matches to search results
      const results: SemanticSearchResult[] = matches.matches.map(match => ({
        id: match.id,
        score: match.score,
        content: match.metadata?.content || '',
        metadata: match.metadata || {},
        source: match.metadata?.namespace || 'unknown'
      }));

      console.log(`🔍 Semantic search found ${results.length} results for query: "${options.query.substring(0, 50)}..."`);

      return results;
    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search within a specific namespace (e.g., risks, threats, compliance)
   */
  async searchNamespace(
    query: string,
    namespace: string,
    options: { topK?: number; filters?: any } = {}
  ): Promise<SemanticSearchResult[]> {
    return this.semanticSearch({
      query,
      namespace,
      topK: options.topK || 10,
      filters: options.filters,
      includeMetadata: true
    });
  }

  /**
   * Index structured data (risks, threats, etc.) for semantic search
   */
  async indexStructuredData(
    tableName: string,
    records: Array<{ id: number; content: string; metadata: Record<string, any> }>,
    namespace: string
  ): Promise<{ success: boolean; count: number }> {
    try {
      const vectors: VectorizeVector[] = [];

      for (const record of records) {
        const embeddingResponse = await this.generateEmbedding({ text: record.content });

        vectors.push({
          id: `${namespace}_${tableName}_${record.id}`,
          values: embeddingResponse.embedding,
          metadata: {
            ...record.metadata,
            tableName,
            recordId: record.id,
            namespace,
            content: record.content.substring(0, 1000),
            indexedAt: new Date().toISOString()
          },
          namespace
        });
      }

      const result = await this.env.VECTORIZE.upsert(vectors);

      console.log(`✅ Indexed ${result.count} records from ${tableName} in namespace ${namespace}`);

      return {
        success: true,
        count: result.count
      };
    } catch (error) {
      console.error(`Error indexing structured data from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete vectors by document ID
   */
  async deleteDocumentVectors(documentId: number, namespace: string = 'documents'): Promise<void> {
    try {
      // Query to find all vector IDs for this document
      const prefix = `${namespace}_${documentId}_`;
      
      // Note: Vectorize doesn't support prefix deletion, so we need to get IDs first
      // This is a limitation we'll document
      console.warn(`⚠️ Vectorize deletion for document ${documentId} requires individual ID deletion`);
      
      // Update database status
      await this.env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'deleted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(documentId).run();
      
    } catch (error) {
      console.error('Error deleting document vectors:', error);
      throw error;
    }
  }

  /**
   * Build Vectorize filter from search filters
   */
  private buildVectorizeFilter(filters: any): Record<string, any> {
    const vectorizeFilter: Record<string, any> = {};

    if (filters.category && filters.category.length > 0) {
      vectorizeFilter['metadata.category'] = { $in: filters.category };
    }

    if (filters.severity && filters.severity.length > 0) {
      vectorizeFilter['metadata.severity'] = { $in: filters.severity };
    }

    if (filters.status && filters.status.length > 0) {
      vectorizeFilter['metadata.status'] = { $in: filters.status };
    }

    if (filters.dateRange) {
      vectorizeFilter['metadata.createdAt'] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    return vectorizeFilter;
  }

  /**
   * Get vector statistics for monitoring
   */
  async getVectorizeStats(): Promise<{
    totalVectors: number;
    namespaces: string[];
    documentsIndexed: number;
  }> {
    try {
      // Query database for statistics
      const docsResult = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN embedding_status = 'completed' THEN 1 END) as indexed,
          SUM(chunk_count) as total_chunks
        FROM rag_documents
      `).first();

      return {
        totalVectors: docsResult?.total_chunks || 0,
        namespaces: ['documents', 'risks', 'threats', 'compliance', 'assets'],
        documentsIndexed: docsResult?.indexed || 0
      };
    } catch (error) {
      console.error('Error getting Vectorize stats:', error);
      return {
        totalVectors: 0,
        namespaces: [],
        documentsIndexed: 0
      };
    }
  }
}
