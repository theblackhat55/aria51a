/**
 * ARIA 5.1 MCP Hybrid Search Service
 * 
 * Combines semantic search (vector embeddings) with traditional keyword search
 * for optimal search accuracy and relevance.
 * 
 * Phase 4.2 Implementation
 */

import type { MCPEnvironment } from '../types/mcp-types';
import { VectorizeService } from './vectorize-service';

export interface HybridSearchConfig {
  semanticWeight: number;  // 0-1, default 0.85
  keywordWeight: number;   // 0-1, default 0.15
  minSemanticScore: number; // Minimum semantic score to include, default 0.3
  minKeywordScore: number;  // Minimum keyword score to include, default 0.2
  resultFusion: 'RRF' | 'weighted' | 'cascade'; // Result fusion strategy
  rrfK: number; // Reciprocal Rank Fusion constant, default 60
}

export interface HybridSearchResult {
  id: string;
  score: number;
  semanticScore: number;
  keywordScore: number;
  fusionMethod: string;
  metadata: Record<string, any>;
  content?: string;
}

export interface SearchQuery {
  query: string;
  namespace: string;
  topK?: number;
  filters?: Record<string, any>;
  config?: Partial<HybridSearchConfig>;
}

/**
 * Hybrid Search Service
 * 
 * Implements hybrid search combining:
 * 1. Semantic Search: Vector embeddings via Cloudflare Workers AI
 * 2. Keyword Search: Traditional SQL LIKE/FTS queries
 * 3. Result Fusion: Multiple strategies to combine results
 */
export class HybridSearchService {
  private env: MCPEnvironment;
  private vectorize: VectorizeService;
  private defaultConfig: HybridSearchConfig;

  constructor(env: MCPEnvironment, config?: Partial<HybridSearchConfig>) {
    this.env = env;
    this.vectorize = new VectorizeService(env);
    
    this.defaultConfig = {
      semanticWeight: 0.85,
      keywordWeight: 0.15,
      minSemanticScore: 0.3,
      minKeywordScore: 0.2,
      resultFusion: 'RRF',
      rrfK: 60,
      ...config
    };
  }

  /**
   * Perform hybrid search combining semantic and keyword approaches
   */
  async search(query: SearchQuery): Promise<HybridSearchResult[]> {
    const config = { ...this.defaultConfig, ...query.config };
    const topK = query.topK || 10;

    console.log(`🔍 Hybrid search: "${query.query}" in namespace: ${query.namespace}`);
    console.log(`   Config: semantic=${config.semanticWeight}, keyword=${config.keywordWeight}, fusion=${config.resultFusion}`);

    // Parallel execution for speed
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query.query, query.namespace, query.filters, topK * 2),
      this.keywordSearch(query.query, query.namespace, query.filters, topK * 2)
    ]);

    console.log(`   Semantic results: ${semanticResults.length}, Keyword results: ${keywordResults.length}`);

    // Fuse results based on strategy
    const fusedResults = this.fuseResults(
      semanticResults,
      keywordResults,
      config
    );

    // Return top K results
    return fusedResults.slice(0, topK);
  }

  /**
   * Semantic search using vector embeddings
   */
  private async semanticSearch(
    query: string,
    namespace: string,
    filters?: Record<string, any>,
    topK: number = 20
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    try {
      // Generate embedding for query
      const embedding = await this.vectorize.generateEmbedding({ text: query });

      // Query Vectorize index
      const results = await this.vectorize.queryVectors({
        vector: embedding.embedding,
        namespace,
        topK,
        filter: filters
      });

      return results.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata || {}
      })) || [];
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Keyword search using SQL queries
   */
  private async keywordSearch(
    query: string,
    namespace: string,
    filters?: Record<string, any>,
    topK: number = 20
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    try {
      // Build keyword search query based on namespace
      const results = await this.buildKeywordQuery(query, namespace, filters, topK);
      return results;
    } catch (error) {
      console.error('Keyword search error:', error);
      return [];
    }
  }

  /**
   * Build keyword search SQL query
   */
  private async buildKeywordQuery(
    query: string,
    namespace: string,
    filters?: Record<string, any>,
    topK: number = 20
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const keywords = this.extractKeywords(query);
    const searchPattern = `%${keywords.join('%')}%`;

    let sql = '';
    let bindings: any[] = [];

    switch (namespace) {
      case 'risks':
        sql = `
          SELECT 
            id,
            title,
            description,
            category,
            risk_level,
            (
              CASE 
                WHEN LOWER(title) LIKE LOWER(?) THEN 10.0
                WHEN LOWER(description) LIKE LOWER(?) THEN 5.0
                WHEN LOWER(category) LIKE LOWER(?) THEN 3.0
                ELSE 1.0
              END
            ) as score
          FROM risks
          WHERE 
            LOWER(title) LIKE LOWER(?) OR
            LOWER(description) LIKE LOWER(?) OR
            LOWER(category) LIKE LOWER(?)
          ORDER BY score DESC
          LIMIT ?
        `;
        bindings = [
          searchPattern, searchPattern, searchPattern,
          searchPattern, searchPattern, searchPattern,
          topK
        ];
        break;

      case 'incidents':
        sql = `
          SELECT 
            id,
            title,
            description,
            severity,
            status,
            (
              CASE 
                WHEN LOWER(title) LIKE LOWER(?) THEN 10.0
                WHEN LOWER(description) LIKE LOWER(?) THEN 5.0
                ELSE 1.0
              END
            ) as score
          FROM incidents
          WHERE 
            LOWER(title) LIKE LOWER(?) OR
            LOWER(description) LIKE LOWER(?)
          ORDER BY score DESC
          LIMIT ?
        `;
        bindings = [
          searchPattern, searchPattern,
          searchPattern, searchPattern,
          topK
        ];
        break;

      case 'compliance':
        sql = `
          SELECT 
            id,
            control_id,
            control_name,
            description,
            framework,
            (
              CASE 
                WHEN LOWER(control_name) LIKE LOWER(?) THEN 10.0
                WHEN LOWER(description) LIKE LOWER(?) THEN 5.0
                WHEN LOWER(framework) LIKE LOWER(?) THEN 3.0
                ELSE 1.0
              END
            ) as score
          FROM compliance_controls
          WHERE 
            LOWER(control_name) LIKE LOWER(?) OR
            LOWER(description) LIKE LOWER(?) OR
            LOWER(framework) LIKE LOWER(?)
          ORDER BY score DESC
          LIMIT ?
        `;
        bindings = [
          searchPattern, searchPattern, searchPattern,
          searchPattern, searchPattern, searchPattern,
          topK
        ];
        break;

      case 'documents':
        sql = `
          SELECT 
            id,
            title,
            content,
            doc_type,
            (
              CASE 
                WHEN LOWER(title) LIKE LOWER(?) THEN 10.0
                WHEN LOWER(content) LIKE LOWER(?) THEN 5.0
                ELSE 1.0
              END
            ) as score
          FROM documents
          WHERE 
            LOWER(title) LIKE LOWER(?) OR
            LOWER(content) LIKE LOWER(?)
          ORDER BY score DESC
          LIMIT ?
        `;
        bindings = [
          searchPattern, searchPattern,
          searchPattern, searchPattern,
          topK
        ];
        break;

      default:
        return [];
    }

    try {
      const stmt = this.env.DB.prepare(sql).bind(...bindings);
      const { results } = await stmt.all();

      // Normalize scores to 0-1 range
      const maxScore = Math.max(...(results?.map((r: any) => r.score) || [1]), 1);

      return results?.map((row: any) => ({
        id: String(row.id),
        score: row.score / maxScore, // Normalize to 0-1
        metadata: row
      })) || [];
    } catch (error) {
      console.error('Keyword query error:', error);
      return [];
    }
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Fuse semantic and keyword results
   */
  private fuseResults(
    semanticResults: Array<{ id: string; score: number; metadata: any }>,
    keywordResults: Array<{ id: string; score: number; metadata: any }>,
    config: HybridSearchConfig
  ): HybridSearchResult[] {
    switch (config.resultFusion) {
      case 'RRF':
        return this.reciprocalRankFusion(semanticResults, keywordResults, config);
      case 'weighted':
        return this.weightedFusion(semanticResults, keywordResults, config);
      case 'cascade':
        return this.cascadeFusion(semanticResults, keywordResults, config);
      default:
        return this.reciprocalRankFusion(semanticResults, keywordResults, config);
    }
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   * 
   * Formula: RRF_score(d) = Σ 1/(k + rank(d))
   * Where k is a constant (typically 60)
   */
  private reciprocalRankFusion(
    semanticResults: Array<{ id: string; score: number; metadata: any }>,
    keywordResults: Array<{ id: string; score: number; metadata: any }>,
    config: HybridSearchConfig
  ): HybridSearchResult[] {
    const k = config.rrfK;
    const scores = new Map<string, { semantic: number; keyword: number; metadata: any }>();

    // Calculate RRF scores for semantic results
    semanticResults.forEach((result, rank) => {
      if (result.score >= config.minSemanticScore) {
        scores.set(result.id, {
          semantic: 1 / (k + rank + 1),
          keyword: 0,
          metadata: result.metadata
        });
      }
    });

    // Calculate RRF scores for keyword results
    keywordResults.forEach((result, rank) => {
      if (result.score >= config.minKeywordScore) {
        const existing = scores.get(result.id);
        if (existing) {
          existing.keyword = 1 / (k + rank + 1);
        } else {
          scores.set(result.id, {
            semantic: 0,
            keyword: 1 / (k + rank + 1),
            metadata: result.metadata
          });
        }
      }
    });

    // Combine RRF scores
    const fusedResults: HybridSearchResult[] = [];
    scores.forEach((value, id) => {
      const totalScore = value.semantic + value.keyword;
      fusedResults.push({
        id,
        score: totalScore,
        semanticScore: value.semantic,
        keywordScore: value.keyword,
        fusionMethod: 'RRF',
        metadata: value.metadata
      });
    });

    // Sort by total score
    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Weighted Fusion
   * 
   * Combines scores using weighted average
   */
  private weightedFusion(
    semanticResults: Array<{ id: string; score: number; metadata: any }>,
    keywordResults: Array<{ id: string; score: number; metadata: any }>,
    config: HybridSearchConfig
  ): HybridSearchResult[] {
    const scores = new Map<string, { semantic: number; keyword: number; metadata: any }>();

    // Collect semantic scores
    semanticResults.forEach(result => {
      if (result.score >= config.minSemanticScore) {
        scores.set(result.id, {
          semantic: result.score,
          keyword: 0,
          metadata: result.metadata
        });
      }
    });

    // Collect keyword scores
    keywordResults.forEach(result => {
      if (result.score >= config.minKeywordScore) {
        const existing = scores.get(result.id);
        if (existing) {
          existing.keyword = result.score;
        } else {
          scores.set(result.id, {
            semantic: 0,
            keyword: result.score,
            metadata: result.metadata
          });
        }
      }
    });

    // Weighted combination
    const fusedResults: HybridSearchResult[] = [];
    scores.forEach((value, id) => {
      const totalScore = 
        (value.semantic * config.semanticWeight) +
        (value.keyword * config.keywordWeight);
      
      fusedResults.push({
        id,
        score: totalScore,
        semanticScore: value.semantic,
        keywordScore: value.keyword,
        fusionMethod: 'weighted',
        metadata: value.metadata
      });
    });

    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Cascade Fusion
   * 
   * Uses semantic search primarily, fills gaps with keyword search
   */
  private cascadeFusion(
    semanticResults: Array<{ id: string; score: number; metadata: any }>,
    keywordResults: Array<{ id: string; score: number; metadata: any }>,
    config: HybridSearchConfig
  ): HybridSearchResult[] {
    const fusedResults: HybridSearchResult[] = [];
    const seenIds = new Set<string>();

    // Add high-scoring semantic results first
    semanticResults.forEach(result => {
      if (result.score >= config.minSemanticScore) {
        fusedResults.push({
          id: result.id,
          score: result.score,
          semanticScore: result.score,
          keywordScore: 0,
          fusionMethod: 'cascade',
          metadata: result.metadata
        });
        seenIds.add(result.id);
      }
    });

    // Fill with keyword results not already included
    keywordResults.forEach(result => {
      if (result.score >= config.minKeywordScore && !seenIds.has(result.id)) {
        fusedResults.push({
          id: result.id,
          score: result.score * config.keywordWeight,
          semanticScore: 0,
          keywordScore: result.score,
          fusionMethod: 'cascade',
          metadata: result.metadata
        });
        seenIds.add(result.id);
      }
    });

    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Get search configuration
   */
  getConfig(): HybridSearchConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update search configuration
   */
  updateConfig(config: Partial<HybridSearchConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get search statistics
   */
  async getStats(namespace: string): Promise<{
    semanticEnabled: boolean;
    keywordEnabled: boolean;
    config: HybridSearchConfig;
    namespaceRecords: number;
  }> {
    let recordCount = 0;

    try {
      // Get record count for namespace
      const tableName = this.getTableName(namespace);
      const result = await this.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ${tableName}`
      ).first();
      recordCount = result?.count as number || 0;
    } catch (error) {
      console.error('Stats error:', error);
    }

    return {
      semanticEnabled: true,
      keywordEnabled: true,
      config: this.defaultConfig,
      namespaceRecords: recordCount
    };
  }

  /**
   * Get table name for namespace
   */
  private getTableName(namespace: string): string {
    const tableMap: Record<string, string> = {
      'risks': 'risks',
      'incidents': 'incidents',
      'compliance': 'compliance_controls',
      'documents': 'documents'
    };
    return tableMap[namespace] || 'risks';
  }
}
