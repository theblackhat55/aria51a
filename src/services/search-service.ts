/**
 * Full-Text Search Service using SQLite FTS5
 * Provides comprehensive search across all platform content
 */

export interface SearchResult {
  id: string;
  type: 'risk' | 'asset' | 'compliance' | 'document' | 'incident';
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata: Record<string, any>;
  url: string;
}

export interface SearchOptions {
  type?: 'risk' | 'asset' | 'compliance' | 'document' | 'incident';
  limit?: number;
  offset?: number;
  highlight?: boolean;
  sortBy?: 'relevance' | 'date' | 'title';
  filters?: Record<string, any>;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  facets: Record<string, Array<{ value: string; count: number }>>;
}

export class SearchService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Initialize full-text search tables
   */
  async initializeTables(): Promise<void> {
    try {
      // Create FTS5 virtual table for unified search
      await this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
          id UNINDEXED,
          type UNINDEXED,
          title,
          content,
          metadata UNINDEXED,
          created_at UNINDEXED,
          updated_at UNINDEXED
        );
      `);

      // Create metadata table for additional filtering
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS search_metadata (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          status TEXT,
          owner TEXT,
          category TEXT,
          tags TEXT,
          url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for better performance
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_search_metadata_type ON search_metadata(type);
        CREATE INDEX IF NOT EXISTS idx_search_metadata_status ON search_metadata(status);
        CREATE INDEX IF NOT EXISTS idx_search_metadata_owner ON search_metadata(owner);
        CREATE INDEX IF NOT EXISTS idx_search_metadata_category ON search_metadata(category);
      `);

      console.log('Search tables initialized successfully');
    } catch (error) {
      console.error('Error initializing search tables:', error);
      throw error;
    }
  }

  /**
   * Index a document for search
   */
  async indexDocument(
    id: string,
    type: 'risk' | 'asset' | 'compliance' | 'document' | 'incident',
    title: string,
    content: string,
    metadata: Record<string, any> = {},
    url: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Insert into FTS5 table
      await this.db.prepare(`
        INSERT OR REPLACE INTO search_index (id, type, title, content, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        type,
        title,
        content,
        JSON.stringify(metadata),
        now,
        now
      ).run();

      // Insert into metadata table
      await this.db.prepare(`
        INSERT OR REPLACE INTO search_metadata (id, type, status, owner, category, tags, url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        type,
        metadata.status || null,
        metadata.owner || null,
        metadata.category || null,
        metadata.tags ? JSON.stringify(metadata.tags) : null,
        url,
        now,
        now
      ).run();

      console.log(`Indexed document: ${id} (${type})`);
    } catch (error) {
      console.error(`Error indexing document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search across all indexed content
   */
  async search(query: string, options: SearchOptions = {}): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = Date.now();
    
    try {
      const {
        type,
        limit = 50,
        offset = 0,
        highlight = true,
        sortBy = 'relevance',
        filters = {}
      } = options;

      // Prepare FTS5 query
      let ftsQuery = query;
      
      // Handle special search operators
      if (query.includes('"')) {
        // Exact phrase search
        ftsQuery = query;
      } else if (query.includes(' AND ') || query.includes(' OR ')) {
        // Boolean search
        ftsQuery = query;
      } else {
        // Default: prefix matching for each term
        const terms = query.split(/\s+/).filter(term => term.length > 0);
        ftsQuery = terms.map(term => `${term}*`).join(' ');
      }

      // Build SQL query
      let sql = `
        SELECT 
          s.id,
          s.type,
          s.title,
          s.content,
          s.metadata,
          m.status,
          m.owner,
          m.category,
          m.tags,
          m.url,
          m.created_at,
          m.updated_at,
          bm25(search_index) as score
        FROM search_index s
        LEFT JOIN search_metadata m ON s.id = m.id
        WHERE search_index MATCH ?
      `;

      const bindings: any[] = [ftsQuery];

      // Add type filter
      if (type) {
        sql += ` AND s.type = ?`;
        bindings.push(type);
      }

      // Add additional filters
      if (filters.status) {
        sql += ` AND m.status = ?`;
        bindings.push(filters.status);
      }

      if (filters.owner) {
        sql += ` AND m.owner = ?`;
        bindings.push(filters.owner);
      }

      if (filters.category) {
        sql += ` AND m.category = ?`;
        bindings.push(filters.category);
      }

      // Add sorting
      switch (sortBy) {
        case 'relevance':
          sql += ` ORDER BY bm25(search_index)`;
          break;
        case 'date':
          sql += ` ORDER BY m.updated_at DESC`;
          break;
        case 'title':
          sql += ` ORDER BY s.title ASC`;
          break;
      }

      // Add pagination
      sql += ` LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);

      // Execute search
      const searchResults = await this.db.prepare(sql).bind(...bindings).all();

      // Process results
      const results: SearchResult[] = searchResults.results.map((row: any) => {
        const metadata = row.metadata ? JSON.parse(row.metadata) : {};
        
        // Generate excerpt with highlighting
        let excerpt = this.generateExcerpt(row.content, query, highlight);
        
        return {
          id: row.id,
          type: row.type,
          title: highlight ? this.highlightText(row.title, query) : row.title,
          content: row.content,
          excerpt,
          score: Math.abs(row.score), // BM25 scores are negative
          metadata: {
            ...metadata,
            status: row.status,
            owner: row.owner,
            category: row.category,
            tags: row.tags ? JSON.parse(row.tags) : [],
            created_at: row.created_at,
            updated_at: row.updated_at
          },
          url: row.url
        };
      });

      // Get total count for pagination
      const countSql = `
        SELECT COUNT(*) as total
        FROM search_index s
        LEFT JOIN search_metadata m ON s.id = m.id
        WHERE search_index MATCH ?
        ${type ? 'AND s.type = ?' : ''}
        ${filters.status ? 'AND m.status = ?' : ''}
        ${filters.owner ? 'AND m.owner = ?' : ''}
        ${filters.category ? 'AND m.category = ?' : ''}
      `;

      const countBindings = [ftsQuery];
      if (type) countBindings.push(type);
      if (filters.status) countBindings.push(filters.status);
      if (filters.owner) countBindings.push(filters.owner);
      if (filters.category) countBindings.push(filters.category);

      const totalResult = await this.db.prepare(countSql).bind(...countBindings).first();
      const totalResults = totalResult?.total || 0;

      // Generate facets
      const facets = await this.generateFacets(ftsQuery, options);

      const searchTime = Date.now() - startTime;

      return {
        results,
        stats: {
          totalResults,
          searchTime,
          facets
        }
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Generate search suggestions/autocomplete
   */
  async suggest(query: string, limit: number = 10): Promise<string[]> {
    try {
      if (query.length < 2) return [];

      const sql = `
        SELECT DISTINCT title
        FROM search_index
        WHERE title MATCH ?
        ORDER BY bm25(search_index)
        LIMIT ?
      `;

      const result = await this.db.prepare(sql).bind(`${query}*`, limit).all();
      return result.results.map((row: any) => row.title);
    } catch (error) {
      console.error('Suggestion error:', error);
      return [];
    }
  }

  /**
   * Bulk index risks
   */
  async indexRisks(risks: any[]): Promise<number> {
    let indexed = 0;
    
    for (const risk of risks) {
      try {
        const content = `${risk.description || ''} ${risk.threat_source || ''} ${risk.mitigation_actions || ''}`.trim();
        
        await this.indexDocument(
          risk.id,
          'risk',
          risk.title,
          content,
          {
            category: risk.category,
            owner: risk.owner,
            status: risk.status,
            likelihood: risk.likelihood,
            impact: risk.impact,
            risk_score: risk.risk_score,
            treatment_strategy: risk.treatment_strategy
          },
          `/risk/view/${risk.id}`
        );
        indexed++;
      } catch (error) {
        console.error(`Failed to index risk ${risk.id}:`, error);
      }
    }
    
    return indexed;
  }

  /**
   * Bulk index assets
   */
  async indexAssets(assets: any[]): Promise<number> {
    let indexed = 0;
    
    for (const asset of assets) {
      try {
        const content = `${asset.location || ''} ${asset.ip_address || ''} ${asset.description || ''}`.trim();
        
        await this.indexDocument(
          asset.id,
          'asset',
          asset.name,
          content,
          {
            type: asset.type,
            owner: asset.owner,
            status: asset.compliance_status,
            location: asset.location,
            risk_score: asset.risk_score,
            confidentiality: asset.confidentiality,
            integrity: asset.integrity,
            availability: asset.availability
          },
          `/operations/asset/${asset.id}`
        );
        indexed++;
      } catch (error) {
        console.error(`Failed to index asset ${asset.id}:`, error);
      }
    }
    
    return indexed;
  }

  /**
   * Generate excerpt with highlighting
   */
  private generateExcerpt(content: string, query: string, highlight: boolean): string {
    const maxLength = 200;
    
    if (content.length <= maxLength) {
      return highlight ? this.highlightText(content, query) : content;
    }

    // Find the best excerpt around query terms
    const terms = query.toLowerCase().split(/\s+/);
    let bestPosition = 0;
    let bestScore = 0;

    for (let i = 0; i < content.length - maxLength; i += 50) {
      const snippet = content.substring(i, i + maxLength).toLowerCase();
      let score = 0;
      
      for (const term of terms) {
        const matches = (snippet.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = i;
      }
    }

    let excerpt = content.substring(bestPosition, bestPosition + maxLength);
    
    // Trim to word boundaries
    if (bestPosition > 0) {
      const firstSpace = excerpt.indexOf(' ');
      if (firstSpace > 0) excerpt = '...' + excerpt.substring(firstSpace);
    }
    
    if (bestPosition + maxLength < content.length) {
      const lastSpace = excerpt.lastIndexOf(' ');
      if (lastSpace > 0) excerpt = excerpt.substring(0, lastSpace) + '...';
    }

    return highlight ? this.highlightText(excerpt, query) : excerpt;
  }

  /**
   * Highlight search terms in text
   */
  private highlightText(text: string, query: string): string {
    if (!query) return text;

    const terms = query.split(/\s+/).filter(term => term.length > 1);
    let highlightedText = text;

    for (const term of terms) {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    return highlightedText;
  }

  /**
   * Generate search facets for filtering
   */
  private async generateFacets(query: string, options: SearchOptions): Promise<Record<string, Array<{ value: string; count: number }>>> {
    const facets: Record<string, Array<{ value: string; count: number }>> = {};

    try {
      // Type facets
      const typeSql = `
        SELECT s.type, COUNT(*) as count
        FROM search_index s
        WHERE search_index MATCH ?
        GROUP BY s.type
        ORDER BY count DESC
      `;
      const typeResult = await this.db.prepare(typeSql).bind(query).all();
      facets.type = typeResult.results.map((row: any) => ({ value: row.type, count: row.count }));

      // Status facets
      const statusSql = `
        SELECT m.status, COUNT(*) as count
        FROM search_index s
        LEFT JOIN search_metadata m ON s.id = m.id
        WHERE search_index MATCH ? AND m.status IS NOT NULL
        GROUP BY m.status
        ORDER BY count DESC
      `;
      const statusResult = await this.db.prepare(statusSql).bind(query).all();
      facets.status = statusResult.results.map((row: any) => ({ value: row.status, count: row.count }));

      // Category facets
      const categorySql = `
        SELECT m.category, COUNT(*) as count
        FROM search_index s
        LEFT JOIN search_metadata m ON s.id = m.id
        WHERE search_index MATCH ? AND m.category IS NOT NULL
        GROUP BY m.category
        ORDER BY count DESC
        LIMIT 10
      `;
      const categoryResult = await this.db.prepare(categorySql).bind(query).all();
      facets.category = categoryResult.results.map((row: any) => ({ value: row.category, count: row.count }));

    } catch (error) {
      console.error('Error generating facets:', error);
    }

    return facets;
  }

  /**
   * Delete document from search index
   */
  async removeDocument(id: string): Promise<void> {
    try {
      await this.db.prepare(`DELETE FROM search_index WHERE id = ?`).bind(id).run();
      await this.db.prepare(`DELETE FROM search_metadata WHERE id = ?`).bind(id).run();
    } catch (error) {
      console.error(`Error removing document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Rebuild entire search index
   */
  async rebuildIndex(): Promise<{ risks: number; assets: number; total: number }> {
    try {
      // Clear existing index
      await this.db.exec(`DELETE FROM search_index`);
      await this.db.exec(`DELETE FROM search_metadata`);

      let totalIndexed = 0;

      // Index sample data (in production, fetch from actual tables)
      const sampleRisks = [
        {
          id: 'RISK-001',
          title: 'Data Breach Through SQL Injection',
          description: 'Potential for unauthorized database access through application vulnerabilities',
          category: 'Security',
          owner: 'Security Team',
          status: 'active',
          likelihood: 3,
          impact: 5,
          risk_score: 15,
          treatment_strategy: 'mitigate'
        }
      ];

      const sampleAssets = [
        {
          id: 'ASSET-001',
          name: 'Production Database Server',
          type: 'Server',
          owner: 'Database Team',
          location: 'Data Center A',
          compliance_status: 'Compliant',
          risk_score: 6,
          confidentiality: 9,
          integrity: 8,
          availability: 7
        }
      ];

      const risksIndexed = await this.indexRisks(sampleRisks);
      const assetsIndexed = await this.indexAssets(sampleAssets);
      totalIndexed = risksIndexed + assetsIndexed;

      return {
        risks: risksIndexed,
        assets: assetsIndexed,
        total: totalIndexed
      };
    } catch (error) {
      console.error('Error rebuilding index:', error);
      throw error;
    }
  }

  /**
   * Test search functionality
   */
  async testSearch(): Promise<{ success: boolean; message: string; resultCount?: number }> {
    try {
      // Initialize tables
      await this.initializeTables();

      // Index test document
      await this.indexDocument(
        'test-001',
        'risk',
        'Test Risk for Search',
        'This is a test document for verifying search functionality works correctly',
        { category: 'Test', owner: 'System', status: 'active' },
        '/test/risk/001'
      );

      // Perform test search
      const searchResult = await this.search('test search');
      
      if (searchResult.results.length > 0) {
        return {
          success: true,
          message: 'Search functionality working correctly',
          resultCount: searchResult.results.length
        };
      } else {
        return {
          success: false,
          message: 'Search returned no results for test query'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Search test failed: ${error.message}`
      };
    }
  }
}

/**
 * Factory function to create search service
 */
export function createSearchService(db: D1Database): SearchService {
  return new SearchService(db);
}

/**
 * Default export
 */
export default SearchService;