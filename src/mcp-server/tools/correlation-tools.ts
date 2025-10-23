/**
 * Cross-Namespace Correlation MCP Tools
 * 
 * Provides advanced correlation capabilities across multiple data namespaces,
 * enabling comprehensive security intelligence analysis.
 */

import type { MCPTool, MCPEnvironment } from '../types/mcp-types';
import { VectorizeService } from '../services/vectorize-service';

/**
 * Correlate Across Namespaces
 * 
 * Performs semantic search across multiple namespaces (risks, incidents, compliance, documents)
 * to find related information and identify patterns.
 * 
 * Example Use Cases:
 * - "Find all risks, incidents, and compliance controls related to ransomware"
 * - "Show me everything related to data encryption requirements"
 * - "Correlate phishing incidents with related risks and controls"
 */
export const correlateAcrossNamespaces: MCPTool = {
  name: 'correlate_across_namespaces',
  description: 'Perform cross-namespace semantic search to correlate risks, threats, compliance controls, and documents. Provides comprehensive security intelligence view.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query to search across all namespaces (e.g., "ransomware threats and controls", "data breach incidents")'
      },
      namespaces: {
        type: 'array',
        items: { type: 'string', enum: ['risks', 'incidents', 'compliance', 'documents', 'assets'] },
        default: ['risks', 'incidents', 'compliance', 'documents'],
        description: 'Namespaces to search across. Default: all namespaces'
      },
      topK_per_namespace: {
        type: 'number',
        default: 5,
        description: 'Maximum results to return per namespace (1-20)'
      },
      relevance_threshold: {
        type: 'number',
        default: 0.5,
        description: 'Minimum semantic relevance score to include results (0.0-1.0)'
      },
      include_relationships: {
        type: 'boolean',
        default: true,
        description: 'Include relationship connections between correlated items'
      }
    },
    required: ['query']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { 
      query, 
      namespaces = ['risks', 'incidents', 'compliance', 'documents'],
      topK_per_namespace = 5,
      relevance_threshold = 0.5,
      include_relationships = true
    } = args;
    
    try {
      const vectorize = new VectorizeService(env);
      const correlations: any = {
        query,
        namespaces_searched: namespaces,
        results: {}
      };
      
      // Search across each namespace
      for (const namespace of namespaces) {
        try {
          const searchResults = await vectorize.searchNamespace(
            query,
            namespace,
            {
              topK: Math.min(Math.max(topK_per_namespace, 1), 20),
              returnMetadata: true
            }
          );
          
          // Filter by relevance threshold
          const relevantResults = searchResults.filter(
            result => result.score >= relevance_threshold
          );
          
          if (relevantResults.length === 0) {
            correlations.results[namespace] = {
              count: 0,
              items: [],
              message: `No results above relevance threshold (${relevance_threshold})`
            };
            continue;
          }
          
          // Extract record IDs
          const recordIds = relevantResults.map(r => 
            parseInt(r.metadata?.recordId as string)
          ).filter(id => !isNaN(id));
          
          // Fetch full records based on namespace
          let items: any[] = [];
          
          switch (namespace) {
            case 'risks':
              if (recordIds.length > 0) {
                const risksResult = await env.DB.prepare(`
                  SELECT id, title, description, category, risk_level, likelihood, impact, status
                  FROM risks WHERE id IN (${recordIds.join(',')})
                `).all();
                items = risksResult.results as any[];
              }
              break;
              
            case 'incidents':
              if (recordIds.length > 0) {
                const incidentsResult = await env.DB.prepare(`
                  SELECT id, title, description, type, severity, status, detection_date, risk_id
                  FROM incidents WHERE id IN (${recordIds.join(',')})
                `).all();
                items = incidentsResult.results as any[];
              }
              break;
              
            case 'compliance':
              if (recordIds.length > 0) {
                const controlsResult = await env.DB.prepare(`
                  SELECT 
                    fc.id, fc.control_id, fc.control_name, fc.description,
                    fc.category, fc.priority, fc.framework_id,
                    cf.name as framework_name
                  FROM framework_controls fc
                  JOIN compliance_frameworks cf ON fc.framework_id = cf.id
                  WHERE fc.id IN (${recordIds.join(',')})
                `).all();
                items = controlsResult.results as any[];
              }
              break;
              
            case 'documents':
              if (recordIds.length > 0) {
                const chunksResult = await env.DB.prepare(`
                  SELECT 
                    dc.id, dc.document_id, dc.chunk_index, dc.content,
                    rd.title as document_title, rd.document_type
                  FROM document_chunks dc
                  JOIN rag_documents rd ON dc.document_id = rd.id
                  WHERE dc.id IN (${recordIds.join(',')})
                `).all();
                items = chunksResult.results as any[];
              }
              break;
              
            case 'assets':
              if (recordIds.length > 0) {
                const assetsResult = await env.DB.prepare(`
                  SELECT id, name, type, category, criticality, status, location
                  FROM assets WHERE id IN (${recordIds.join(',')})
                `).all();
                items = assetsResult.results as any[];
              }
              break;
          }
          
          // Enrich with semantic scores
          const enrichedItems = items.map(item => {
            const semanticMatch = relevantResults.find(
              r => parseInt(r.metadata?.recordId as string) === item.id
            );
            
            return {
              ...item,
              semantic_score: semanticMatch?.score || 0,
              relevance: `${((semanticMatch?.score || 0) * 100).toFixed(1)}%`,
              namespace
            };
          });
          
          // Sort by semantic score
          enrichedItems.sort((a, b) => b.semantic_score - a.semantic_score);
          
          correlations.results[namespace] = {
            count: enrichedItems.length,
            items: enrichedItems,
            avg_relevance: (enrichedItems.reduce((sum, item) => sum + item.semantic_score, 0) / enrichedItems.length).toFixed(3)
          };
          
        } catch (error: any) {
          console.error(`Error searching ${namespace}:`, error);
          correlations.results[namespace] = {
            count: 0,
            items: [],
            error: error.message
          };
        }
      }
      
      // Calculate overall statistics
      const totalResults = Object.values(correlations.results)
        .reduce((sum: number, ns: any) => sum + (ns.count || 0), 0);
      
      correlations.statistics = {
        total_results: totalResults,
        namespaces_with_results: Object.values(correlations.results)
          .filter((ns: any) => ns.count > 0).length,
        relevance_threshold
      };
      
      // Find relationships if requested
      if (include_relationships && totalResults > 0) {
        correlations.relationships = await this.findRelationships(correlations.results, env);
      }
      
      return correlations;
      
    } catch (error: any) {
      console.error('Error in correlateAcrossNamespaces:', error);
      return {
        error: true,
        message: error.message || 'Failed to correlate across namespaces'
      };
    }
  },
  
  /**
   * Find explicit relationships between correlated items
   */
  async findRelationships(results: any, env: MCPEnvironment): Promise<any[]> {
    const relationships = [];
    
    try {
      // Find incident-risk relationships
      if (results.incidents && results.risks && results.incidents.count > 0 && results.risks.count > 0) {
        const incidentIds = results.incidents.items.map((i: any) => i.id);
        const riskIds = results.risks.items.map((r: any) => r.id);
        
        const linkResult = await env.DB.prepare(`
          SELECT i.id as incident_id, i.title as incident_title, r.id as risk_id, r.title as risk_title
          FROM incidents i
          JOIN risks r ON i.risk_id = r.id
          WHERE i.id IN (${incidentIds.join(',')}) AND r.id IN (${riskIds.join(',')})
        `).all();
        
        (linkResult.results as any[]).forEach(link => {
          relationships.push({
            type: 'incident_to_risk',
            from: { id: link.incident_id, title: link.incident_title, namespace: 'incidents' },
            to: { id: link.risk_id, title: link.risk_title, namespace: 'risks' },
            relationship: 'realizes'
          });
        });
      }
      
      // Find risk-control implicit relationships (semantic)
      // This would require additional logic to match risks with controls
      // based on semantic similarity of their related items
      
    } catch (error: any) {
      console.error('Error finding relationships:', error);
    }
    
    return relationships;
  }
};

/**
 * Security Intelligence Dashboard Query
 * 
 * Provides comprehensive security intelligence view for a specific topic,
 * aggregating data across all relevant namespaces with statistics and trends.
 */
export const getSecurityIntelligence: MCPTool = {
  name: 'get_security_intelligence',
  description: 'Get comprehensive security intelligence dashboard for a specific topic, including risks, threats, compliance status, and documentation.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Security topic to analyze (e.g., "ransomware", "data protection", "cloud security")'
      },
      time_range_days: {
        type: 'number',
        default: 90,
        description: 'Time range for incident and trend analysis (default: 90 days)'
      },
      include_trends: {
        type: 'boolean',
        default: true,
        description: 'Include trend analysis and statistics'
      }
    },
    required: ['topic']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { topic, time_range_days = 90, include_trends = true } = args;
    
    try {
      // Use correlateAcrossNamespaces to get base data
      const correlation = await correlateAcrossNamespaces.execute(
        {
          query: topic,
          namespaces: ['risks', 'incidents', 'compliance', 'documents'],
          topK_per_namespace: 10,
          relevance_threshold: 0.6,
          include_relationships: true
        },
        env
      );
      
      if (correlation.error) {
        return correlation;
      }
      
      const intelligence: any = {
        topic,
        timestamp: new Date().toISOString(),
        overview: {
          total_related_items: correlation.statistics.total_results,
          namespaces_covered: correlation.statistics.namespaces_with_results
        },
        data: correlation.results
      };
      
      // Calculate risk score summary
      if (correlation.results.risks && correlation.results.risks.count > 0) {
        const riskLevels = correlation.results.risks.items.reduce((acc: any, risk: any) => {
          acc[risk.risk_level] = (acc[risk.risk_level] || 0) + 1;
          return acc;
        }, {});
        
        intelligence.risk_summary = {
          total_risks: correlation.results.risks.count,
          by_level: riskLevels,
          highest_risk: correlation.results.risks.items[0] || null
        };
      }
      
      // Calculate incident summary
      if (correlation.results.incidents && correlation.results.incidents.count > 0) {
        const recentIncidents = correlation.results.incidents.items.filter((inc: any) => {
          const incDate = new Date(inc.detection_date);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - time_range_days);
          return incDate >= cutoff;
        });
        
        const severityCounts = recentIncidents.reduce((acc: any, inc: any) => {
          acc[inc.severity] = (acc[inc.severity] || 0) + 1;
          return acc;
        }, {});
        
        intelligence.incident_summary = {
          total_incidents: correlation.results.incidents.count,
          recent_incidents: recentIncidents.length,
          time_range_days,
          by_severity: severityCounts
        };
      }
      
      // Calculate compliance coverage
      if (correlation.results.compliance && correlation.results.compliance.count > 0) {
        const frameworks = new Set(
          correlation.results.compliance.items.map((c: any) => c.framework_name)
        );
        
        intelligence.compliance_summary = {
          total_controls: correlation.results.compliance.count,
          frameworks_involved: Array.from(frameworks),
          top_control: correlation.results.compliance.items[0] || null
        };
      }
      
      // Add relationships
      if (correlation.relationships && correlation.relationships.length > 0) {
        intelligence.relationships = correlation.relationships;
      }
      
      // Add trend analysis if requested
      if (include_trends && correlation.results.incidents && correlation.results.incidents.count > 0) {
        intelligence.trends = {
          message: 'Trend analysis would be calculated based on historical data',
          incident_trend: recentIncidents ? 'increasing' : 'stable'
        };
      }
      
      return intelligence;
      
    } catch (error: any) {
      console.error('Error in getSecurityIntelligence:', error);
      return {
        error: true,
        message: error.message || 'Failed to generate security intelligence'
      };
    }
  }
};

// Export all correlation tools
export const correlationTools = [
  correlateAcrossNamespaces,
  getSecurityIntelligence
];
