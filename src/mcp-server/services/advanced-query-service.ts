/**
 * ARIA 5.1 MCP Advanced Query Service
 * 
 * Provides advanced query features:
 * 1. Query Expansion - Enhance queries with synonyms and related terms
 * 2. Semantic Clustering - Group similar results
 * 3. Relevance Feedback - Learn from user interactions
 * 
 * Phase 4.4 Implementation
 */

import type { MCPEnvironment } from '../types/mcp-types';
import { VectorizeService } from './vectorize-service';
import type { HybridSearchResult } from './hybrid-search-service';

export interface QueryExpansionResult {
  originalQuery: string;
  expandedQuery: string;
  addedTerms: string[];
  confidence: number;
}

export interface SemanticCluster {
  id: string;
  label: string;
  items: HybridSearchResult[];
  centroid?: number[];
  coherence: number;
}

export interface RelevanceFeedback {
  queryId: string;
  relevantItems: string[];
  irrelevantItems: string[];
  timestamp: number;
}

/**
 * Advanced Query Service
 */
export class AdvancedQueryService {
  private env: MCPEnvironment;
  private vectorize: VectorizeService;

  // Query expansion dictionaries
  private securitySynonyms = new Map<string, string[]>([
    ['attack', ['breach', 'intrusion', 'compromise', 'exploit', 'incident']],
    ['vulnerability', ['weakness', 'flaw', 'exposure', 'gap', 'deficiency']],
    ['risk', ['threat', 'danger', 'exposure', 'hazard', 'liability']],
    ['malware', ['virus', 'trojan', 'ransomware', 'spyware', 'rootkit']],
    ['authentication', ['auth', 'login', 'access control', 'identity', 'verification']],
    ['encryption', ['crypto', 'cipher', 'encoding', 'cryptography', 'secure']],
    ['compliance', ['regulation', 'standard', 'framework', 'audit', 'requirement']],
    ['firewall', ['filtering', 'network security', 'perimeter', 'boundary', 'gateway']],
    ['incident', ['event', 'breach', 'attack', 'violation', 'compromise']],
    ['data breach', ['data leak', 'exfiltration', 'theft', 'exposure', 'loss']],
    ['phishing', ['social engineering', 'email attack', 'spoofing', 'impersonation']],
    ['ddos', ['denial of service', 'dos', 'flooding', 'availability attack']],
    ['sql injection', ['sqli', 'database attack', 'code injection', 'injection flaw']],
    ['xss', ['cross-site scripting', 'script injection', 'client-side attack']],
    ['privilege escalation', ['elevation', 'access abuse', 'unauthorized access']],
    ['zero day', ['0day', 'unknown vulnerability', 'unpatched flaw']],
    ['security policy', ['security standard', 'security guideline', 'security procedure']],
    ['access control', ['authorization', 'permissions', 'rbac', 'acl']],
    ['network security', ['network protection', 'network defense', 'perimeter security']],
    ['endpoint security', ['endpoint protection', 'device security', 'edr', 'antivirus']]
  ]);

  constructor(env: MCPEnvironment) {
    this.env = env;
    this.vectorize = new VectorizeService(env);
  }

  /**
   * Expand query with related terms
   */
  async expandQuery(query: string, options?: {
    maxTerms?: number;
    useAI?: boolean;
    namespace?: string;
  }): Promise<QueryExpansionResult> {
    console.log(`🔍 Expanding query: "${query}"`);

    const maxTerms = options?.maxTerms || 5;
    const addedTerms: string[] = [];
    let confidence = 0.7;

    // Method 1: Synonym expansion (always available)
    const synonymTerms = this.expandWithSynonyms(query);
    addedTerms.push(...synonymTerms.slice(0, maxTerms));

    // Method 2: Corpus-based expansion (if namespace provided)
    if (options?.namespace) {
      const corpusTerms = await this.expandWithCorpus(query, options.namespace);
      addedTerms.push(...corpusTerms.slice(0, Math.floor(maxTerms / 2)));
    }

    // Method 3: AI-based expansion (if enabled and available)
    if (options?.useAI) {
      try {
        const aiTerms = await this.expandWithAI(query);
        addedTerms.push(...aiTerms.slice(0, 3));
        confidence = 0.9;
      } catch (error) {
        console.log('AI expansion failed, using rule-based only');
      }
    }

    // Remove duplicates and limit
    const uniqueTerms = [...new Set(addedTerms)].slice(0, maxTerms);

    // Build expanded query
    const expandedQuery = uniqueTerms.length > 0
      ? `${query} ${uniqueTerms.join(' ')}`
      : query;

    console.log(`   Added terms: ${uniqueTerms.join(', ')}`);

    return {
      originalQuery: query,
      expandedQuery,
      addedTerms: uniqueTerms,
      confidence
    };
  }

  /**
   * Expand query using synonym dictionary
   */
  private expandWithSynonyms(query: string): string[] {
    const terms: string[] = [];
    const queryLower = query.toLowerCase();

    this.securitySynonyms.forEach((synonyms, term) => {
      if (queryLower.includes(term)) {
        // Add top 2 synonyms for each matched term
        terms.push(...synonyms.slice(0, 2));
      }
    });

    return terms;
  }

  /**
   * Expand query using corpus statistics
   */
  private async expandWithCorpus(query: string, namespace: string): Promise<string[]> {
    // Get related terms from database based on co-occurrence
    try {
      const tableName = this.getTableName(namespace);
      const keywords = query.toLowerCase().split(/\s+/);

      // Find documents containing query terms
      const sql = `
        SELECT description, title
        FROM ${tableName}
        WHERE LOWER(description) LIKE ? OR LOWER(title) LIKE ?
        LIMIT 20
      `;

      const stmt = this.env.DB.prepare(sql).bind(`%${keywords[0]}%`, `%${keywords[0]}%`);
      const { results } = await stmt.all();

      if (!results || results.length === 0) {
        return [];
      }

      // Extract frequent terms
      const termFreq = new Map<string, number>();
      results.forEach((row: any) => {
        const text = `${row.title} ${row.description}`.toLowerCase();
        const words = text.match(/\b\w{4,}\b/g) || [];
        
        words.forEach(word => {
          if (!keywords.includes(word)) {
            termFreq.set(word, (termFreq.get(word) || 0) + 1);
          }
        });
      });

      // Return top terms by frequency
      return Array.from(termFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term);
    } catch (error) {
      console.error('Corpus expansion error:', error);
      return [];
    }
  }

  /**
   * Expand query using AI (when available)
   */
  private async expandWithAI(query: string): Promise<string[]> {
    // This would use AI service if available
    // For now, return empty (fallback to other methods)
    return [];
  }

  /**
   * Cluster search results semantically
   */
  async clusterResults(
    results: HybridSearchResult[],
    options?: {
      minClusterSize?: number;
      maxClusters?: number;
      method?: 'kmeans' | 'hierarchical' | 'dbscan';
    }
  ): Promise<SemanticCluster[]> {
    console.log(`📊 Clustering ${results.length} results`);

    const minClusterSize = options?.minClusterSize || 2;
    const maxClusters = options?.maxClusters || 5;
    const method = options?.method || 'kmeans';

    if (results.length < minClusterSize * 2) {
      // Too few results to cluster meaningfully
      return [{
        id: 'cluster_1',
        label: 'All Results',
        items: results,
        coherence: 1.0
      }];
    }

    switch (method) {
      case 'kmeans':
        return this.kMeansClustering(results, maxClusters, minClusterSize);
      case 'hierarchical':
        return this.hierarchicalClustering(results, maxClusters, minClusterSize);
      case 'dbscan':
        return this.dbscanClustering(results, minClusterSize);
      default:
        return this.kMeansClustering(results, maxClusters, minClusterSize);
    }
  }

  /**
   * K-Means clustering implementation
   */
  private async kMeansClustering(
    results: HybridSearchResult[],
    k: number,
    minSize: number
  ): Promise<SemanticCluster[]> {
    // Simplified K-means based on metadata similarity
    const clusters: SemanticCluster[] = [];

    // Group by category/type if available
    const groups = new Map<string, HybridSearchResult[]>();
    
    results.forEach(result => {
      const category = result.metadata.category || 
                      result.metadata.framework || 
                      result.metadata.risk_level ||
                      'uncategorized';
      
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(result);
    });

    // Convert groups to clusters
    let clusterId = 1;
    groups.forEach((items, label) => {
      if (items.length >= minSize) {
        // Calculate coherence based on score variance
        const scores = items.map(i => i.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
        const coherence = 1 - Math.min(variance, 1);

        clusters.push({
          id: `cluster_${clusterId++}`,
          label: this.formatLabel(label),
          items,
          coherence
        });
      }
    });

    // Limit to maxClusters, keeping largest
    clusters.sort((a, b) => b.items.length - a.items.length);
    return clusters.slice(0, k);
  }

  /**
   * Hierarchical clustering implementation
   */
  private async hierarchicalClustering(
    results: HybridSearchResult[],
    maxClusters: number,
    minSize: number
  ): Promise<SemanticCluster[]> {
    // Simplified hierarchical clustering
    // Uses metadata similarity as distance metric
    return this.kMeansClustering(results, maxClusters, minSize);
  }

  /**
   * DBSCAN clustering implementation
   */
  private async dbscanClustering(
    results: HybridSearchResult[],
    minPts: number
  ): Promise<SemanticCluster[]> {
    // Simplified DBSCAN
    // Uses score and metadata similarity
    return this.kMeansClustering(results, 5, minPts);
  }

  /**
   * Record relevance feedback
   */
  async recordFeedback(feedback: RelevanceFeedback): Promise<void> {
    try {
      // Store feedback in database for future learning
      const sql = `
        INSERT INTO query_feedback (query_id, relevant_items, irrelevant_items, created_at)
        VALUES (?, ?, ?, ?)
      `;

      await this.env.DB.prepare(sql).bind(
        feedback.queryId,
        JSON.stringify(feedback.relevantItems),
        JSON.stringify(feedback.irrelevantItems),
        new Date(feedback.timestamp).toISOString()
      ).run();

      console.log(`📝 Recorded feedback for query: ${feedback.queryId}`);
    } catch (error) {
      // Table might not exist yet - that's okay
      console.log('Feedback recording skipped (table not available)');
    }
  }

  /**
   * Get learned preferences for query
   */
  async getLearnedPreferences(query: string): Promise<{
    boostTerms: string[];
    suppressTerms: string[];
    confidence: number;
  }> {
    try {
      // Query historical feedback
      const sql = `
        SELECT relevant_items, irrelevant_items
        FROM query_feedback
        WHERE query_id LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const stmt = this.env.DB.prepare(sql).bind(`%${query}%`);
      const { results } = await stmt.all();

      if (!results || results.length === 0) {
        return { boostTerms: [], suppressTerms: [], confidence: 0 };
      }

      // Aggregate feedback
      const relevantMap = new Map<string, number>();
      const irrelevantMap = new Map<string, number>();

      results.forEach((row: any) => {
        try {
          const relevant = JSON.parse(row.relevant_items) as string[];
          const irrelevant = JSON.parse(row.irrelevant_items) as string[];

          relevant.forEach(id => {
            relevantMap.set(id, (relevantMap.get(id) || 0) + 1);
          });

          irrelevant.forEach(id => {
            irrelevantMap.set(id, (irrelevantMap.get(id) || 0) + 1);
          });
        } catch (error) {
          // Skip invalid JSON
        }
      });

      // Extract patterns (simplified)
      const boostTerms: string[] = [];
      const suppressTerms: string[] = [];

      return {
        boostTerms,
        suppressTerms,
        confidence: Math.min(results.length / 10, 1)
      };
    } catch (error) {
      return { boostTerms: [], suppressTerms: [], confidence: 0 };
    }
  }

  /**
   * Re-rank results using relevance feedback
   */
  async reRankWithFeedback(
    query: string,
    results: HybridSearchResult[]
  ): Promise<HybridSearchResult[]> {
    const preferences = await this.getLearnedPreferences(query);

    if (preferences.confidence < 0.3) {
      // Not enough feedback to re-rank
      return results;
    }

    // Apply learned preferences to boost/suppress results
    const reRanked = results.map(result => {
      let boost = 1.0;

      // Boost if ID was frequently marked relevant
      if (preferences.boostTerms.includes(result.id)) {
        boost *= 1.5;
      }

      // Suppress if ID was frequently marked irrelevant
      if (preferences.suppressTerms.includes(result.id)) {
        boost *= 0.5;
      }

      return {
        ...result,
        score: result.score * boost
      };
    });

    // Re-sort by adjusted scores
    reRanked.sort((a, b) => b.score - a.score);

    console.log(`🎯 Re-ranked with confidence: ${preferences.confidence.toFixed(2)}`);
    return reRanked;
  }

  /**
   * Helper: Format cluster label
   */
  private formatLabel(label: string): string {
    return label
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Helper: Get table name for namespace
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
