/**
 * Advanced Search Service for ARIA5.1
 * 
 * Provides comprehensive search capabilities across all ARIA5 data:
 * - Full-text search with ranking and relevance
 * - Faceted search with filters and aggregations
 * - Real-time indexing and updates
 * - Advanced query syntax and operators
 * - Cross-entity relationship search
 * 
 * Features:
 * - SQLite FTS5 for full-text search
 * - Multi-entity search (risks, compliance, users, files)
 * - Intelligent query parsing and suggestions
 * - Search analytics and optimization
 * - Integration with all ARIA5 modules
 */

export interface SearchQuery {
  query: string;
  entities?: ('risks' | 'compliance' | 'users' | 'files' | 'notifications')[];
  filters?: SearchFilters;
  sort?: SearchSort;
  facets?: string[];
  highlight?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  dateRange?: {
    from?: string;
    to?: string;
    field?: string; // created_at, updated_at, etc.
  };
  status?: string[];
  severity?: string[];
  category?: string[];
  tags?: string[];
  assignedTo?: number[];
  createdBy?: number[];
  riskScore?: {
    min?: number;
    max?: number;
  };
  complianceFramework?: string[];
  fileTypes?: string[];
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
  scoreBoost?: number;
}

export interface SearchResult {
  id: string;
  entity: string;
  title: string;
  content: string;
  url: string;
  score: number;
  highlights?: string[];
  metadata: Record<string, any>;
  relatedEntities?: SearchResultEntity[];
}

export interface SearchResultEntity {
  type: string;
  id: string;
  title: string;
  url: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  took: number; // milliseconds
  facets?: Record<string, any>;
  suggestions?: string[];
  error?: string;
}

export interface SearchIndex {
  entity: string;
  entityId: string;
  title: string;
  content: string;
  tags: string;
  metadata: string; // JSON
  created_at: string;
  updated_at: string;
  boost: number;
}

export interface SearchAnalytics {
  query: string;
  entity?: string;
  resultsCount: number;
  clickedResult?: string;
  userId?: number;
  timestamp: string;
  took: number;
}

export class AdvancedSearchService {
  private db: any;
  private isInitialized = false;
  private queryCache = new Map<string, { result: SearchResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(database?: any) {
    this.db = database;
    if (this.db) {
      this.initializeSearch();
    }
  }

  /**
   * Initialize search tables and FTS5 indexes
   */
  private async initializeSearch(): Promise<void> {
    try {
      // Create search index table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS search_index (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          tags TEXT,
          metadata TEXT, -- JSON
          created_at DATETIME NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          boost REAL DEFAULT 1.0,
          UNIQUE(entity, entity_id)
        )
      `).run();

      // Create FTS5 virtual table for full-text search
      await this.db.prepare(`
        CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
          entity,
          entity_id,
          title,
          content,
          tags,
          content='search_index',
          content_rowid='id'
        )
      `).run();

      // Create FTS triggers to keep index synchronized
      await this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS search_index_insert AFTER INSERT ON search_index BEGIN
          INSERT INTO search_fts(rowid, entity, entity_id, title, content, tags)
          VALUES (NEW.id, NEW.entity, NEW.entity_id, NEW.title, NEW.content, NEW.tags);
        END
      `).run();

      await this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS search_index_update AFTER UPDATE ON search_index BEGIN
          UPDATE search_fts SET 
            entity = NEW.entity,
            entity_id = NEW.entity_id,
            title = NEW.title,
            content = NEW.content,
            tags = NEW.tags
          WHERE rowid = NEW.id;
        END
      `).run();

      await this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS search_index_delete AFTER DELETE ON search_index BEGIN
          DELETE FROM search_fts WHERE rowid = OLD.id;
        END
      `).run();

      // Search analytics table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS search_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          entity TEXT,
          results_count INTEGER NOT NULL,
          clicked_result TEXT,
          user_id INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          took INTEGER, -- milliseconds
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Create indexes for performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_search_index_entity ON search_index(entity)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_search_index_updated ON search_index(updated_at)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query)
      `).run();

      // Initialize with existing data
      await this.rebuildIndex();

      this.isInitialized = true;
      console.log('✅ Advanced search engine initialized');

    } catch (error) {
      console.error('Failed to initialize search engine:', error);
    }
  }

  /**
   * Perform advanced search across entities
   */
  async search(searchQuery: SearchQuery, userId?: number): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.db || !this.isInitialized) {
        return {
          success: false,
          results: [],
          total: 0,
          took: 0,
          error: 'Search engine not initialized'
        };
      }

      // Check cache
      const cacheKey = JSON.stringify({ searchQuery, userId });
      const cached = this.queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.result;
      }

      // Parse and build FTS query
      const ftsQuery = this.buildFTSQuery(searchQuery.query);
      
      // Build base SQL query
      let sql = `
        SELECT 
          si.entity,
          si.entity_id,
          si.title,
          si.content,
          si.tags,
          si.metadata,
          si.created_at,
          si.boost,
          sf.rank as fts_score
        FROM search_fts sf
        JOIN search_index si ON si.id = sf.rowid
        WHERE search_fts MATCH ?
      `;
      const params: any[] = [ftsQuery];

      // Apply entity filters
      if (searchQuery.entities && searchQuery.entities.length > 0) {
        sql += ` AND si.entity IN (${searchQuery.entities.map(() => '?').join(',')})`;
        params.push(...searchQuery.entities);
      }

      // Apply additional filters
      if (searchQuery.filters) {
        const filterQuery = this.buildFilterQuery(searchQuery.filters);
        if (filterQuery.sql) {
          sql += ` AND ${filterQuery.sql}`;
          params.push(...filterQuery.params);
        }
      }

      // Apply sorting
      if (searchQuery.sort) {
        sql += ` ORDER BY ${searchQuery.sort.field} ${searchQuery.sort.direction}`;
      } else {
        sql += ` ORDER BY (sf.rank * si.boost) ASC, si.created_at DESC`;
      }

      // Apply pagination
      if (searchQuery.limit) {
        sql += ` LIMIT ?`;
        params.push(searchQuery.limit);
      }
      if (searchQuery.offset) {
        sql += ` OFFSET ?`;
        params.push(searchQuery.offset);
      }

      // Execute search
      const searchResults = await this.db.prepare(sql).bind(...params).all();
      const results = searchResults.results?.map((row: any) => this.mapToSearchResult(row, searchQuery)) || [];

      // Get total count
      let countSql = `
        SELECT COUNT(*) as total
        FROM search_fts sf
        JOIN search_index si ON si.id = sf.rowid
        WHERE search_fts MATCH ?
      `;
      const countParams = [ftsQuery];

      if (searchQuery.entities && searchQuery.entities.length > 0) {
        countSql += ` AND si.entity IN (${searchQuery.entities.map(() => '?').join(',')})`;
        countParams.push(...searchQuery.entities);
      }

      if (searchQuery.filters) {
        const filterQuery = this.buildFilterQuery(searchQuery.filters);
        if (filterQuery.sql) {
          countSql += ` AND ${filterQuery.sql}`;
          countParams.push(...filterQuery.params);
        }
      }

      const countResult = await this.db.prepare(countSql).bind(...countParams).first();
      const total = countResult?.total || 0;

      // Get facets if requested
      let facets = {};
      if (searchQuery.facets && searchQuery.facets.length > 0) {
        facets = await this.getFacets(ftsQuery, searchQuery.facets, searchQuery.entities);
      }

      // Get suggestions
      const suggestions = await this.getSuggestions(searchQuery.query);

      const took = Date.now() - startTime;

      const response: SearchResponse = {
        success: true,
        results,
        total,
        took,
        facets,
        suggestions
      };

      // Cache result
      this.queryCache.set(cacheKey, { result: response, timestamp: Date.now() });

      // Track analytics
      if (userId) {
        this.trackSearch(searchQuery.query, searchQuery.entities?.[0], results.length, userId, took);
      }

      console.log('🔍 Search executed:', {
        query: searchQuery.query,
        entities: searchQuery.entities,
        results: results.length,
        total,
        took
      });

      return response;

    } catch (error) {
      console.error('Search failed:', error);
      return {
        success: false,
        results: [],
        total: 0,
        took: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Index or update an entity in search
   */
  async indexEntity(entity: string, entityId: string, data: {
    title: string;
    content: string;
    tags?: string[];
    metadata?: Record<string, any>;
    boost?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Search engine not initialized' };
      }

      const searchIndex: SearchIndex = {
        entity,
        entityId,
        title: data.title,
        content: data.content,
        tags: (data.tags || []).join(' '),
        metadata: JSON.stringify(data.metadata || {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        boost: data.boost || 1.0
      };

      // Upsert into search index
      await this.db.prepare(`
        INSERT OR REPLACE INTO search_index (
          entity, entity_id, title, content, tags, metadata, created_at, updated_at, boost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        searchIndex.entity,
        searchIndex.entityId,
        searchIndex.title,
        searchIndex.content,
        searchIndex.tags,
        searchIndex.metadata,
        searchIndex.created_at,
        searchIndex.updated_at,
        searchIndex.boost
      ).run();

      // Clear cache
      this.clearCache();

      return { success: true };

    } catch (error) {
      console.error('Search indexing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Indexing failed'
      };
    }
  }

  /**
   * Remove entity from search index
   */
  async removeFromIndex(entity: string, entityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Search engine not initialized' };
      }

      await this.db.prepare(`
        DELETE FROM search_index WHERE entity = ? AND entity_id = ?
      `).bind(entity, entityId).run();

      // Clear cache
      this.clearCache();

      return { success: true };

    } catch (error) {
      console.error('Search removal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Removal failed'
      };
    }
  }

  /**
   * Rebuild entire search index from source data
   */
  async rebuildIndex(): Promise<{ success: boolean; indexed?: number; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Search engine not initialized' };
      }

      // Clear existing index
      await this.db.prepare('DELETE FROM search_index').run();

      let indexed = 0;

      // Index risks
      try {
        const risks = await this.db.prepare(`
          SELECT id, title, description, impact, likelihood, status, category, created_at
          FROM risks WHERE deleted = FALSE
        `).all();

        for (const risk of risks.results || []) {
          await this.indexEntity('risks', risk.id.toString(), {
            title: risk.title,
            content: `${risk.description} ${risk.impact || ''} Category: ${risk.category || ''}`,
            tags: [risk.status, risk.category, `likelihood-${risk.likelihood}`].filter(Boolean),
            metadata: {
              status: risk.status,
              category: risk.category,
              likelihood: risk.likelihood,
              created_at: risk.created_at
            },
            boost: risk.status === 'open' ? 1.5 : 1.0
          });
          indexed++;
        }
      } catch (error) {
        console.warn('Failed to index risks:', error);
      }

      // Index compliance items
      try {
        const compliance = await this.db.prepare(`
          SELECT id, title, description, framework, status, category, created_at
          FROM compliance_items WHERE deleted = FALSE
        `).all();

        for (const item of compliance.results || []) {
          await this.indexEntity('compliance', item.id.toString(), {
            title: item.title,
            content: `${item.description || ''} Framework: ${item.framework || ''} Category: ${item.category || ''}`,
            tags: [item.status, item.framework, item.category].filter(Boolean),
            metadata: {
              status: item.status,
              framework: item.framework,
              category: item.category,
              created_at: item.created_at
            },
            boost: item.status === 'non_compliant' ? 1.3 : 1.0
          });
          indexed++;
        }
      } catch (error) {
        console.warn('Failed to index compliance items:', error);
      }

      // Index users
      try {
        const users = await this.db.prepare(`
          SELECT id, name, email, department, role, created_at
          FROM users
        `).all();

        for (const user of users.results || []) {
          await this.indexEntity('users', user.id.toString(), {
            title: user.name,
            content: `${user.email} ${user.department || ''} ${user.role || ''}`,
            tags: [user.role, user.department].filter(Boolean),
            metadata: {
              email: user.email,
              department: user.department,
              role: user.role,
              created_at: user.created_at
            },
            boost: 0.8
          });
          indexed++;
        }
      } catch (error) {
        console.warn('Failed to index users:', error);
      }

      // Index files
      try {
        const files = await this.db.prepare(`
          SELECT id, original_name, category, tags, mime_type, uploaded_at
          FROM file_storage WHERE is_deleted = FALSE
        `).all();

        for (const file of files.results || []) {
          await this.indexEntity('files', file.id, {
            title: file.original_name,
            content: `File type: ${file.mime_type} Category: ${file.category}`,
            tags: JSON.parse(file.tags || '[]').concat([file.category, file.mime_type]),
            metadata: {
              category: file.category,
              mime_type: file.mime_type,
              uploaded_at: file.uploaded_at
            },
            boost: 0.9
          });
          indexed++;
        }
      } catch (error) {
        console.warn('Failed to index files:', error);
      }

      // Clear cache
      this.clearCache();

      console.log(`✅ Search index rebuilt: ${indexed} items indexed`);
      return { success: true, indexed };

    } catch (error) {
      console.error('Index rebuild failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rebuild failed'
      };
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      if (!this.db || !this.isInitialized || !query || query.length < 2) {
        return [];
      }

      // Get popular search terms
      const suggestions = await this.db.prepare(`
        SELECT query, COUNT(*) as frequency
        FROM search_analytics
        WHERE query LIKE ? AND results_count > 0
        GROUP BY query
        ORDER BY frequency DESC, query
        LIMIT 5
      `).bind(`%${query}%`).all();

      return suggestions.results?.map((row: any) => row.query) || [];

    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Get search facets for filtering
   */
  async getFacets(ftsQuery: string, facetFields: string[], entities?: string[]): Promise<Record<string, any>> {
    try {
      if (!this.db || !this.isInitialized) {
        return {};
      }

      const facets: Record<string, any> = {};

      for (const field of facetFields) {
        switch (field) {
          case 'entity':
            facets.entity = await this.getEntityFacets(ftsQuery, entities);
            break;
          case 'tags':
            facets.tags = await this.getTagsFacets(ftsQuery, entities);
            break;
          case 'created_date':
            facets.created_date = await this.getDateFacets(ftsQuery, entities);
            break;
        }
      }

      return facets;

    } catch (error) {
      console.error('Failed to get facets:', error);
      return {};
    }
  }

  /**
   * Track search analytics
   */
  private async trackSearch(query: string, entity: string | undefined, resultsCount: number, userId: number, took: number): Promise<void> {
    try {
      if (!this.db) return;

      await this.db.prepare(`
        INSERT INTO search_analytics (query, entity, results_count, user_id, took)
        VALUES (?, ?, ?, ?, ?)
      `).bind(query, entity, resultsCount, userId, took).run();

    } catch (error) {
      console.error('Failed to track search analytics:', error);
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Search engine not initialized' };
      }

      const stats = await this.db.prepare(`
        SELECT 
          COUNT(DISTINCT query) as unique_queries,
          COUNT(*) as total_searches,
          AVG(results_count) as avg_results,
          AVG(took) as avg_time,
          COUNT(DISTINCT user_id) as unique_users
        FROM search_analytics
        WHERE timestamp >= datetime('now', '-30 days')
      `).first();

      const topQueries = await this.db.prepare(`
        SELECT query, COUNT(*) as frequency
        FROM search_analytics
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY query
        ORDER BY frequency DESC
        LIMIT 10
      `).all();

      const indexStats = await this.db.prepare(`
        SELECT entity, COUNT(*) as count
        FROM search_index
        GROUP BY entity
      `).all();

      return {
        success: true,
        stats: {
          uniqueQueries: stats?.unique_queries || 0,
          totalSearches: stats?.total_searches || 0,
          avgResults: Math.round((stats?.avg_results || 0) * 100) / 100,
          avgTime: Math.round((stats?.avg_time || 0) * 100) / 100,
          uniqueUsers: stats?.unique_users || 0,
          topQueries: topQueries.results || [],
          indexedEntities: indexStats.results || [],
          cacheSize: this.queryCache.size
        }
      };

    } catch (error) {
      console.error('Failed to get search statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Helper methods

  private buildFTSQuery(query: string): string {
    // Basic FTS5 query building
    // Handle quotes, AND/OR operators, wildcards
    
    let ftsQuery = query.trim();
    
    // If no quotes, add wildcard to last word for partial matching
    if (!ftsQuery.includes('"') && !ftsQuery.includes('*')) {
      const words = ftsQuery.split(/\s+/);
      if (words.length > 0) {
        words[words.length - 1] += '*';
        ftsQuery = words.join(' ');
      }
    }

    return ftsQuery;
  }

  private buildFilterQuery(filters: SearchFilters): { sql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.dateRange) {
      const field = filters.dateRange.field || 'created_at';
      if (filters.dateRange.from) {
        conditions.push(`si.${field} >= ?`);
        params.push(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        conditions.push(`si.${field} <= ?`);
        params.push(filters.dateRange.to);
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'si.tags LIKE ?');
      conditions.push(`(${tagConditions.join(' OR ')})`);
      filters.tags.forEach(tag => params.push(`%${tag}%`));
    }

    return {
      sql: conditions.join(' AND '),
      params
    };
  }

  private mapToSearchResult(row: any, searchQuery: SearchQuery): SearchResult {
    const metadata = JSON.parse(row.metadata || '{}');
    
    const result: SearchResult = {
      id: row.entity_id,
      entity: row.entity,
      title: row.title,
      content: this.truncateContent(row.content),
      url: this.getEntityUrl(row.entity, row.entity_id),
      score: -parseFloat(row.fts_score) * row.boost, // FTS5 returns negative scores
      metadata
    };

    // Add highlights if requested
    if (searchQuery.highlight) {
      result.highlights = this.generateHighlights(row.title + ' ' + row.content, searchQuery.query);
    }

    return result;
  }

  private getEntityUrl(entity: string, entityId: string): string {
    switch (entity) {
      case 'risks':
        return `/risks/${entityId}`;
      case 'compliance':
        return `/compliance/${entityId}`;
      case 'users':
        return `/users/${entityId}`;
      case 'files':
        return `/files/${entityId}`;
      default:
        return `/${entity}/${entityId}`;
    }
  }

  private truncateContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength).trim() + '...';
  }

  private generateHighlights(text: string, query: string): string[] {
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const highlights: string[] = [];
    
    for (const word of words) {
      const regex = new RegExp(`\\b\\w*${word}\\w*\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        highlights.push(...matches.slice(0, 3)); // Limit highlights
      }
    }

    return [...new Set(highlights)]; // Remove duplicates
  }

  private async getEntityFacets(ftsQuery: string, entities?: string[]): Promise<any[]> {
    let sql = `
      SELECT si.entity, COUNT(*) as count
      FROM search_fts sf
      JOIN search_index si ON si.id = sf.rowid
      WHERE search_fts MATCH ?
    `;
    const params = [ftsQuery];

    if (entities && entities.length > 0) {
      sql += ` AND si.entity IN (${entities.map(() => '?').join(',')})`;
      params.push(...entities);
    }

    sql += ` GROUP BY si.entity ORDER BY count DESC`;

    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  private async getTagsFacets(ftsQuery: string, entities?: string[]): Promise<any[]> {
    let sql = `
      SELECT si.tags, COUNT(*) as count
      FROM search_fts sf
      JOIN search_index si ON si.id = sf.rowid
      WHERE search_fts MATCH ? AND si.tags IS NOT NULL AND si.tags != ''
    `;
    const params = [ftsQuery];

    if (entities && entities.length > 0) {
      sql += ` AND si.entity IN (${entities.map(() => '?').join(',')})`;
      params.push(...entities);
    }

    sql += ` GROUP BY si.tags ORDER BY count DESC LIMIT 20`;

    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  private async getDateFacets(ftsQuery: string, entities?: string[]): Promise<any[]> {
    let sql = `
      SELECT 
        strftime('%Y-%m', si.created_at) as month,
        COUNT(*) as count
      FROM search_fts sf
      JOIN search_index si ON si.id = sf.rowid
      WHERE search_fts MATCH ?
    `;
    const params = [ftsQuery];

    if (entities && entities.length > 0) {
      sql += ` AND si.entity IN (${entities.map(() => '?').join(',')})`;
      params.push(...entities);
    }

    sql += ` GROUP BY month ORDER BY month DESC LIMIT 12`;

    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  private clearCache(): void {
    this.queryCache.clear();
  }
}

// Export helper functions for search integration
export const SearchHelpers = {
  /**
   * Index a risk entity
   */
  indexRisk: async (searchService: AdvancedSearchService, risk: any): Promise<void> => {
    await searchService.indexEntity('risks', risk.id.toString(), {
      title: risk.title,
      content: `${risk.description} ${risk.impact || ''} Category: ${risk.category || ''}`,
      tags: [risk.status, risk.category, `likelihood-${risk.likelihood}`].filter(Boolean),
      metadata: {
        status: risk.status,
        category: risk.category,
        likelihood: risk.likelihood,
        created_at: risk.created_at
      },
      boost: risk.status === 'open' ? 1.5 : 1.0
    });
  },

  /**
   * Index a compliance entity
   */
  indexCompliance: async (searchService: AdvancedSearchService, compliance: any): Promise<void> => {
    await searchService.indexEntity('compliance', compliance.id.toString(), {
      title: compliance.title,
      content: `${compliance.description || ''} Framework: ${compliance.framework || ''} Category: ${compliance.category || ''}`,
      tags: [compliance.status, compliance.framework, compliance.category].filter(Boolean),
      metadata: {
        status: compliance.status,
        framework: compliance.framework,
        category: compliance.category,
        created_at: compliance.created_at
      },
      boost: compliance.status === 'non_compliant' ? 1.3 : 1.0
    });
  },

  /**
   * Parse advanced search query
   */
  parseSearchQuery: (queryString: string): SearchQuery => {
    const query: SearchQuery = {
      query: queryString,
      entities: [],
      filters: {},
      sort: { field: 'score', direction: 'desc' },
      limit: 20,
      offset: 0,
      highlight: true
    };

    // Extract entity filters: entity:risks
    const entityMatch = queryString.match(/entity:(\w+)/g);
    if (entityMatch) {
      query.entities = entityMatch.map(match => match.split(':')[1] as any);
      query.query = queryString.replace(/entity:\w+/g, '').trim();
    }

    // Extract status filters: status:open
    const statusMatch = queryString.match(/status:(\w+)/g);
    if (statusMatch) {
      query.filters!.status = statusMatch.map(match => match.split(':')[1]);
      query.query = query.query!.replace(/status:\w+/g, '').trim();
    }

    // Extract category filters: category:security
    const categoryMatch = queryString.match(/category:(\w+)/g);
    if (categoryMatch) {
      query.filters!.category = categoryMatch.map(match => match.split(':')[1]);
      query.query = query.query!.replace(/category:\w+/g, '').trim();
    }

    return query;
  }
};