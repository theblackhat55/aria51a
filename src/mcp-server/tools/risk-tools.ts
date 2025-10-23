/**
 * Risk Management MCP Tools
 * 
 * Provides semantic search and analysis tools for risks in ARIA5.1
 */

import type { MCPTool, MCPEnvironment } from '../types/mcp-types';
import { VectorizeService } from '../services/vectorize-service';

/**
 * Search risks using semantic understanding
 */
export const searchRisksSemantic: MCPTool = {
  name: 'search_risks_semantic',
  description: 'Search risk register using semantic understanding of natural language queries. Finds risks by meaning, not just keywords.',
  
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query to search for risks (e.g., "authentication vulnerabilities", "ransomware threats")'
      },
      topK: {
        type: 'number',
        description: 'Number of results to return (default: 10)',
        default: 10
      },
      filters: {
        type: 'object',
        description: 'Optional filters to apply',
        properties: {
          category: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by risk category (cybersecurity, compliance, operational, etc.)'
          },
          severity: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by severity (critical, high, medium, low)'
          },
          status: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by status (active, mitigated, accepted, closed)'
          }
        }
      },
      includeRelated: {
        type: 'boolean',
        description: 'Include related threats, controls, and incidents',
        default: false
      }
    },
    required: ['query']
  },

  async execute(args: any, env: MCPEnvironment): Promise<any> {
    try {
      const vectorize = new VectorizeService(env);
      
      // Perform semantic search in vectors
      const semanticResults = await vectorize.searchNamespace(
        args.query,
        'risks',
        {
          topK: args.topK || 10,
          filters: args.filters
        }
      );

      // Get full risk details from database
      const riskIds = semanticResults
        .map(r => parseInt(r.metadata.recordId))
        .filter(id => !isNaN(id));

      if (riskIds.length === 0) {
        return {
          risks: [],
          total: 0,
          query: args.query,
          message: 'No risks found matching your query'
        };
      }

      // Fetch full risk data
      const risks = await env.DB.prepare(`
        SELECT 
          id, risk_id, title, description, category, subcategory,
          probability, impact, risk_score, status, owner_id, 
          review_date, created_at, updated_at
        FROM risks
        WHERE id IN (${riskIds.map(() => '?').join(',')})
        ORDER BY risk_score DESC
      `).bind(...riskIds).all();

      // Enrich with semantic scores
      const enrichedRisks = risks.results.map(risk => {
        const semanticMatch = semanticResults.find(
          r => parseInt(r.metadata.recordId) === risk.id
        );
        
        return {
          ...risk,
          semantic_score: semanticMatch?.score || 0,
          relevance: semanticMatch?.score ? `${(semanticMatch.score * 100).toFixed(1)}%` : 'N/A'
        };
      });

      // Optionally include related data
      let relatedData: any = {};
      if (args.includeRelated && riskIds.length > 0) {
        relatedData = await fetchRelatedData(env, riskIds);
      }

      return {
        risks: enrichedRisks,
        total: enrichedRisks.length,
        query: args.query,
        semanticSearch: true,
        filters: args.filters || {},
        ...relatedData
      };

    } catch (error) {
      console.error('Risk semantic search error:', error);
      throw new Error(`Failed to search risks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

/**
 * Fetch related data for risks (threats, controls, incidents)
 */
async function fetchRelatedData(env: MCPEnvironment, riskIds: number[]): Promise<any> {
  const [threats, controls, incidents] = await Promise.all([
    // Related threat indicators
    env.DB.prepare(`
      SELECT DISTINCT ti.* 
      FROM threat_indicators ti
      WHERE ti.risk_ids LIKE '%' || ? || '%'
      LIMIT 10
    `).bind(riskIds[0]).all().catch(() => ({ results: [] })),
    
    // Related controls
    env.DB.prepare(`
      SELECT DISTINCT fc.*
      FROM framework_controls fc
      JOIN soa s ON fc.id = s.control_id
      WHERE s.risk_id IN (${riskIds.map(() => '?').join(',')})
      LIMIT 10
    `).bind(...riskIds).all().catch(() => ({ results: [] })),
    
    // Related incidents
    env.DB.prepare(`
      SELECT * FROM incidents
      WHERE risk_id IN (${riskIds.map(() => '?').join(',')})
      AND status != 'closed'
      LIMIT 10
    `).bind(...riskIds).all().catch(() => ({ results: [] }))
  ]);

  return {
    related_threats: threats.results || [],
    related_controls: controls.results || [],
    related_incidents: incidents.results || []
  };
}
