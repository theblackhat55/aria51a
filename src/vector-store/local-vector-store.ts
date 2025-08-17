// Local Vector Store Implementation
// Pure JavaScript implementation without external vector database dependencies

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source_type: 'risk' | 'incident' | 'service' | 'asset' | 'document';
    source_id: string;
    title: string;
    chunk_index?: number;
    created_at: string;
    [key: string]: any;
  };
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

export class LocalVectorStore {
  private vectors: Map<string, VectorDocument> = new Map();
  private initialized = false;

  constructor() {}

  // Initialize vector store
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load persisted vectors from database if available
    await this.loadPersistedVectors();
    this.initialized = true;
  }

  // Add document with embedding to vector store
  async addDocument(document: VectorDocument): Promise<void> {
    await this.initialize();
    
    this.vectors.set(document.id, {
      ...document,
      metadata: {
        ...document.metadata,
        created_at: new Date().toISOString()
      }
    });

    // Persist to database
    await this.persistVector(document);
  }

  // Add multiple documents in batch
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    await this.initialize();
    
    for (const doc of documents) {
      await this.addDocument(doc);
    }
  }

  // Semantic search using cosine similarity
  async search(queryEmbedding: number[], options: {
    limit?: number;
    threshold?: number;
    sourceTypes?: string[];
    metadata?: Record<string, any>;
  } = {}): Promise<SearchResult[]> {
    await this.initialize();

    const { limit = 10, threshold = 0.5, sourceTypes, metadata } = options;
    const results: SearchResult[] = [];

    for (const [id, document] of this.vectors) {
      // Filter by source type if specified
      if (sourceTypes && !sourceTypes.includes(document.metadata.source_type)) {
        continue;
      }

      // Filter by metadata if specified
      if (metadata) {
        const matchesMetadata = Object.entries(metadata).every(
          ([key, value]) => document.metadata[key] === value
        );
        if (!matchesMetadata) continue;
      }

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
      
      if (similarity >= threshold) {
        results.push({ document, similarity });
      }
    }

    // Sort by similarity (descending) and limit
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Get document by ID
  async getDocument(id: string): Promise<VectorDocument | null> {
    await this.initialize();
    return this.vectors.get(id) || null;
  }

  // Delete document
  async deleteDocument(id: string): Promise<boolean> {
    await this.initialize();
    
    const deleted = this.vectors.delete(id);
    if (deleted) {
      await this.removePersistedVector(id);
    }
    return deleted;
  }

  // Get all documents for a specific source
  async getDocumentsBySource(sourceType: string, sourceId?: string): Promise<VectorDocument[]> {
    await this.initialize();
    
    const results: VectorDocument[] = [];
    for (const [id, document] of this.vectors) {
      if (document.metadata.source_type === sourceType) {
        if (!sourceId || document.metadata.source_id === sourceId) {
          results.push(document);
        }
      }
    }
    return results;
  }

  // Update document
  async updateDocument(id: string, updates: Partial<VectorDocument>): Promise<boolean> {
    await this.initialize();
    
    const existingDoc = this.vectors.get(id);
    if (!existingDoc) return false;

    const updatedDoc = {
      ...existingDoc,
      ...updates,
      metadata: {
        ...existingDoc.metadata,
        ...updates.metadata,
        updated_at: new Date().toISOString()
      }
    };

    this.vectors.set(id, updatedDoc);
    await this.persistVector(updatedDoc);
    return true;
  }

  // Get statistics
  async getStats(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    averageEmbeddingLength: number;
  }> {
    await this.initialize();

    const documentsByType: Record<string, number> = {};
    let totalEmbeddingLength = 0;

    for (const [id, document] of this.vectors) {
      const sourceType = document.metadata.source_type;
      documentsByType[sourceType] = (documentsByType[sourceType] || 0) + 1;
      totalEmbeddingLength += document.embedding.length;
    }

    return {
      totalDocuments: this.vectors.size,
      documentsByType,
      averageEmbeddingLength: this.vectors.size > 0 ? totalEmbeddingLength / this.vectors.size : 0
    };
  }

  // Clear all vectors
  async clear(): Promise<void> {
    await this.initialize();
    this.vectors.clear();
    await this.clearPersistedVectors();
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }

  // Database persistence methods
  private async loadPersistedVectors(): Promise<void> {
    try {
      // In a real implementation, you would pass the database connection
      // For now, we'll skip database loading as it requires D1 context
      console.log('Loading persisted vectors from database...');
    } catch (error) {
      console.warn('Failed to load persisted vectors:', error);
    }
  }

  private async persistVector(document: VectorDocument): Promise<void> {
    try {
      // In a real implementation, you would save to D1 database
      // This would be called from the API layer with database access
      console.log('Persisting vector to database:', document.id);
    } catch (error) {
      console.warn('Failed to persist vector:', error);
    }
  }

  private async removePersistedVector(id: string): Promise<void> {
    try {
      // In a real implementation, you would delete from D1 database
      console.log('Removing persisted vector:', id);
    } catch (error) {
      console.warn('Failed to remove persisted vector:', error);
    }
  }

  private async clearPersistedVectors(): Promise<void> {
    try {
      // In a real implementation, you would clear D1 database
      console.log('Clearing all persisted vectors');
    } catch (error) {
      console.warn('Failed to clear persisted vectors:', error);
    }
  }

  // Database integration methods (to be called from API layer)
  async persistToDatabase(database: any): Promise<void> {
    try {
      for (const [id, document] of this.vectors) {
        await database.prepare(`
          INSERT OR REPLACE INTO vector_documents (
            id, content, embedding_json, source_type, source_id, title,
            chunk_index, total_chunks, token_count, metadata_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          document.id,
          document.content,
          JSON.stringify(document.embedding),
          document.metadata.source_type,
          document.metadata.source_id,
          document.metadata.title,
          document.metadata.chunk_index || 0,
          document.metadata.total_chunks || 1,
          document.metadata.token_count || 0,
          JSON.stringify(document.metadata)
        ).run();
      }
    } catch (error) {
      console.error('Failed to persist vectors to database:', error);
      throw error;
    }
  }

  async loadFromDatabase(database: any): Promise<void> {
    try {
      const results = await database.prepare(`
        SELECT id, content, embedding_json, source_type, source_id, title,
               chunk_index, total_chunks, token_count, metadata_json, created_at
        FROM vector_documents
        ORDER BY created_at ASC
      `).all();

      this.vectors.clear();

      for (const row of results.results || []) {
        const document: VectorDocument = {
          id: row.id,
          content: row.content,
          embedding: JSON.parse(row.embedding_json),
          metadata: {
            source_type: row.source_type,
            source_id: row.source_id,
            title: row.title,
            chunk_index: row.chunk_index,
            total_chunks: row.total_chunks,
            token_count: row.token_count,
            created_at: row.created_at,
            ...JSON.parse(row.metadata_json || '{}')
          }
        };

        this.vectors.set(document.id, document);
      }

      console.log(`Loaded ${this.vectors.size} vectors from database`);
    } catch (error) {
      console.error('Failed to load vectors from database:', error);
      throw error;
    }
  }
}

// Singleton instance
export const vectorStore = new LocalVectorStore();