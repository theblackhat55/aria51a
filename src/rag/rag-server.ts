// RAG Server - Main Coordination Layer
// Handles indexing, retrieval, and context generation for AI interactions

import { vectorStore, VectorDocument } from '../vector-store/local-vector-store.js';
import { embeddingService } from './embeddings.js';
import { documentProcessor } from './document-processor.js';

export interface RAGQuery {
  query: string;
  sourceTypes?: string[];
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

export interface RAGResult {
  context: string;
  sources: Array<{
    id: string;
    title: string;
    type: string;
    similarity: number;
    excerpt: string;
  }>;
  metadata: {
    query: string;
    totalSources: number;
    processingTime: number;
    embeddingTime: number;
    searchTime: number;
  };
}

export interface IndexingResult {
  success: boolean;
  documentsIndexed: number;
  chunksCreated: number;
  processingTime: number;
  errors?: string[];
}

export class RAGServer {
  private initialized = false;

  constructor() {}

  // Initialize RAG server
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await vectorStore.initialize();
    this.initialized = true;
    console.log('RAG Server initialized successfully');
  }

  // Index GRC entity (risk, incident, service, asset)
  async indexGRCEntity(
    entity: any,
    entityType: 'risk' | 'incident' | 'service' | 'asset'
  ): Promise<IndexingResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Process entity into chunks
      const processingResult = await documentProcessor.processGRCEntity(
        entity,
        entityType
      );

      // Generate embeddings for each chunk
      const documents: VectorDocument[] = [];
      for (const chunk of processingResult.chunks) {
        try {
          const embeddingResult = await embeddingService.generateEmbedding(
            chunk.content,
            { model: 'local' }
          );

          documents.push({
            id: chunk.id,
            content: chunk.content,
            embedding: embeddingResult.embedding,
            metadata: {
              source_type: entityType,
              source_id: chunk.metadata.source_id,
              title: chunk.metadata.title,
              chunk_index: chunk.metadata.chunk_index,
              created_at: new Date().toISOString(),
              token_count: chunk.metadata.token_count,
              entity_data: {
                // Store relevant entity fields for retrieval
                id: entity.id,
                status: entity.status,
                severity: entity.severity,
                risk_score: entity.risk_score,
                category: entity.category || entity.risk_category || entity.asset_type
              }
            }
          });
        } catch (error) {
          errors.push(`Failed to embed chunk ${chunk.id}: ${error.message}`);
        }
      }

      // Store documents in vector store
      await vectorStore.addDocuments(documents);

      return {
        success: true,
        documentsIndexed: 1,
        chunksCreated: documents.length,
        processingTime: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        documentsIndexed: 0,
        chunksCreated: 0,
        processingTime: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  // Index uploaded document
  async indexDocument(
    file: File | { name: string; content: string }
  ): Promise<IndexingResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Process document into chunks
      const processingResult = await documentProcessor.processDocument(file);

      // Generate embeddings for each chunk
      const documents: VectorDocument[] = [];
      for (const chunk of processingResult.chunks) {
        try {
          const embeddingResult = await embeddingService.generateEmbedding(
            chunk.content,
            { model: 'local' }
          );

          documents.push({
            id: chunk.id,
            content: chunk.content,
            embedding: embeddingResult.embedding,
            metadata: {
              source_type: 'document',
              source_id: chunk.metadata.source_id,
              title: chunk.metadata.title,
              chunk_index: chunk.metadata.chunk_index,
              created_at: new Date().toISOString(),
              token_count: chunk.metadata.token_count,
              file_info: {
                name: file instanceof File ? file.name : file.name,
                size: file instanceof File ? file.size : file.content.length,
                type: file instanceof File ? file.type : 'text/plain'
              }
            }
          });
        } catch (error) {
          errors.push(`Failed to embed chunk ${chunk.id}: ${error.message}`);
        }
      }

      // Store documents in vector store
      await vectorStore.addDocuments(documents);

      return {
        success: true,
        documentsIndexed: 1,
        chunksCreated: documents.length,
        processingTime: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        documentsIndexed: 0,
        chunksCreated: 0,
        processingTime: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  // Perform RAG query to retrieve relevant context
  async query(ragQuery: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    
    try {
      // Generate embedding for query
      const embeddingStart = Date.now();
      const queryEmbedding = await embeddingService.generateEmbedding(
        ragQuery.query,
        { model: 'local' }
      );
      const embeddingTime = Date.now() - embeddingStart;

      // Search vector store
      const searchStart = Date.now();
      const searchResults = await vectorStore.search(queryEmbedding.embedding, {
        limit: ragQuery.limit || 10,
        threshold: ragQuery.threshold || 0.3,
        sourceTypes: ragQuery.sourceTypes
      });
      const searchTime = Date.now() - searchStart;

      // Build context and sources
      const context = this.buildContext(searchResults);
      const sources = searchResults.map(result => ({
        id: result.document.id,
        title: result.document.metadata.title,
        type: result.document.metadata.source_type,
        similarity: result.similarity,
        excerpt: this.createExcerpt(result.document.content, 150)
      }));

      return {
        context,
        sources,
        metadata: {
          query: ragQuery.query,
          totalSources: searchResults.length,
          processingTime: Date.now() - startTime,
          embeddingTime,
          searchTime
        }
      };

    } catch (error) {
      console.error('RAG query failed:', error);
      return {
        context: '',
        sources: [],
        metadata: {
          query: ragQuery.query,
          totalSources: 0,
          processingTime: Date.now() - startTime,
          embeddingTime: 0,
          searchTime: 0
        }
      };
    }
  }

  // Get specialized context for specific risk analysis
  async getRiskContext(riskId?: string): Promise<RAGResult> {
    return this.query({
      query: riskId ? `Risk analysis for risk ${riskId}` : 'Risk analysis and assessment',
      sourceTypes: ['risk', 'incident', 'document'],
      limit: 8,
      threshold: 0.2
    });
  }

  // Get compliance-related context
  async getComplianceContext(framework?: string): Promise<RAGResult> {
    const query = framework 
      ? `Compliance requirements for ${framework}`
      : 'Compliance requirements and standards';
      
    return this.query({
      query,
      sourceTypes: ['document', 'risk', 'service'],
      limit: 10,
      threshold: 0.25
    });
  }

  // Get incident-related context
  async getIncidentContext(incidentId?: string): Promise<RAGResult> {
    const query = incidentId
      ? `Incident analysis for incident ${incidentId}`
      : 'Incident management and response';

    return this.query({
      query,
      sourceTypes: ['incident', 'risk', 'document'],
      limit: 8,
      threshold: 0.3
    });
  }

  // Re-index all GRC data
  async reindexAllData(): Promise<{
    totalProcessed: number;
    totalErrors: number;
    processingTime: number;
    details: IndexingResult[];
  }> {
    const startTime = Date.now();
    const results: IndexingResult[] = [];

    try {
      // Clear existing vectors
      await vectorStore.clear();

      // Note: In a real implementation, you would fetch actual data from your database
      // For now, we'll return a placeholder result
      console.log('Re-indexing would fetch and process all GRC data from database');

      return {
        totalProcessed: 0,
        totalErrors: 0,
        processingTime: Date.now() - startTime,
        details: results
      };

    } catch (error) {
      console.error('Re-indexing failed:', error);
      return {
        totalProcessed: 0,
        totalErrors: 1,
        processingTime: Date.now() - startTime,
        details: [{
          success: false,
          documentsIndexed: 0,
          chunksCreated: 0,
          processingTime: 0,
          errors: [error.message]
        }]
      };
    }
  }

  // Get RAG server statistics
  async getStats(): Promise<{
    vectorStore: any;
    embeddings: any;
    totalQueries: number;
    averageResponseTime: number;
  }> {
    const vectorStats = await vectorStore.getStats();
    const embeddingStats = embeddingService.getCacheStats();

    return {
      vectorStore: vectorStats,
      embeddings: embeddingStats,
      totalQueries: 0, // TODO: Track queries
      averageResponseTime: 0 // TODO: Track response times
    };
  }

  // Remove entity from index
  async removeEntity(entityType: string, entityId: string): Promise<boolean> {
    try {
      const documents = await vectorStore.getDocumentsBySource(entityType, entityId);
      
      for (const doc of documents) {
        await vectorStore.deleteDocument(doc.id);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove entity from index:', error);
      return false;
    }
  }

  // Build context string from search results
  private buildContext(searchResults: Array<{ document: VectorDocument; similarity: number }>): string {
    if (searchResults.length === 0) {
      return 'No relevant context found in the knowledge base.';
    }

    const contextParts: string[] = [];
    
    for (const result of searchResults) {
      const doc = result.document;
      const similarity = Math.round(result.similarity * 100);
      
      contextParts.push(
        `[${doc.metadata.source_type.toUpperCase()}] ${doc.metadata.title} (${similarity}% relevant)\n${doc.content}\n`
      );
    }

    return contextParts.join('\n---\n\n');
  }

  // Create excerpt from text
  private createExcerpt(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      // Check if core services are operational
      return this.initialized && 
             this.embeddingService !== null && 
             this.documentProcessor !== null;
    } catch (error) {
      console.error('RAG health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const ragServer = new RAGServer();