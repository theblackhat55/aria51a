/**
 * Threat Intelligence MCP Tools
 * 
 * Provides semantic search and correlation capabilities for security incidents,
 * threats, and their relationships with assets and risks.
 */

import type { MCPTool, MCPEnvironment, SemanticSearchOptions } from '../types/mcp-types';
import { VectorizeService } from '../services/vectorize-service';

/**
 * Search Incidents/Threats using Semantic Understanding
 * 
 * Searches security incidents using natural language queries with semantic understanding.
 * Supports filtering by severity, status, type, and time ranges.
 * 
 * Example Queries:
 * - "ransomware attacks in the last quarter"
 * - "phishing incidents affecting critical assets"
 * - "unresolved high-severity security events"
 */
export const searchThreatsSemantic: MCPTool = {
  name: 'search_threats_semantic',
  description: 'Search security incidents and threats using semantic understanding. Supports natural language queries about incident types, attack patterns, severity levels, and temporal filters.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query about security incidents or threats (e.g., "ransomware attacks", "credential theft incidents")'
      },
      topK: {
        type: 'number',
        default: 10,
        description: 'Maximum number of results to return (1-50)'
      },
      filters: {
        type: 'object',
        properties: {
          severity: {
            type: 'array',
            items: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            description: 'Filter by incident severity levels'
          },
          status: {
            type: 'array',
            items: { type: 'string', enum: ['open', 'investigating', 'contained', 'resolved', 'closed'] },
            description: 'Filter by incident status'
          },
          type: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by incident type (e.g., malware, phishing, data-breach, dos)'
          },
          dateRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      includeRelated: {
        type: 'boolean',
        default: false,
        description: 'Include related risks, assets, and root cause analysis'
      }
    },
    required: ['query']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { query, topK = 10, filters = {}, includeRelated = false } = args;
    
    try {
      // Initialize Vectorize service
      const vectorize = new VectorizeService(env);
      
      // Perform semantic search in incidents namespace
      const searchOptions: SemanticSearchOptions = {
        query,
        topK: Math.min(Math.max(topK, 1), 50), // Clamp between 1-50
        namespace: 'incidents',
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
      
      // Extract incident IDs from semantic results
      const incidentIds = semanticResults
        .filter(result => result.metadata && result.metadata.recordId)
        .map(result => parseInt(result.metadata.recordId as string));
      
      if (incidentIds.length === 0) {
        return {
          incidents: [],
          total: 0,
          query,
          message: 'No incidents found matching the semantic query'
        };
      }
      
      // Build SQL query with filters
      let sqlQuery = `
        SELECT 
          i.id,
          i.title,
          i.description,
          i.type,
          i.severity,
          i.status,
          i.detection_date,
          i.resolution_date,
          i.root_cause,
          i.impact_description,
          i.lessons_learned,
          i.risk_id,
          i.created_at,
          i.updated_at,
          u_reporter.name as reported_by_name,
          u_assigned.name as assigned_to_name
        FROM incidents i
        LEFT JOIN users u_reporter ON i.reported_by = u_reporter.id
        LEFT JOIN users u_assigned ON i.assigned_to = u_assigned.id
        WHERE i.id IN (${incidentIds.join(',')})
      `;
      
      // Apply filters
      const conditions: string[] = [];
      
      if (filters.severity && filters.severity.length > 0) {
        const severityList = filters.severity.map((s: string) => `'${s}'`).join(',');
        conditions.push(`i.severity IN (${severityList})`);
      }
      
      if (filters.status && filters.status.length > 0) {
        const statusList = filters.status.map((s: string) => `'${s}'`).join(',');
        conditions.push(`i.status IN (${statusList})`);
      }
      
      if (filters.type && filters.type.length > 0) {
        const typeList = filters.type.map((t: string) => `'${t}'`).join(',');
        conditions.push(`i.type IN (${typeList})`);
      }
      
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          conditions.push(`i.detection_date >= '${filters.dateRange.start}'`);
        }
        if (filters.dateRange.end) {
          conditions.push(`i.detection_date <= '${filters.dateRange.end}'`);
        }
      }
      
      if (conditions.length > 0) {
        sqlQuery += ` AND ${conditions.join(' AND ')}`;
      }
      
      sqlQuery += ` ORDER BY i.severity DESC, i.detection_date DESC`;
      
      // Execute query
      const incidentsResult = await env.DB.prepare(sqlQuery).all();
      
      // Enrich with semantic scores
      const enrichedIncidents = incidentsResult.results.map((incident: any) => {
        const semanticMatch = semanticResults.find(
          r => r.metadata && parseInt(r.metadata.recordId as string) === incident.id
        );
        
        return {
          ...incident,
          semantic_score: semanticMatch?.score || 0,
          relevance: `${((semanticMatch?.score || 0) * 100).toFixed(1)}%`
        };
      });
      
      // Sort by semantic score
      enrichedIncidents.sort((a, b) => b.semantic_score - a.semantic_score);
      
      // Include related data if requested
      if (includeRelated && enrichedIncidents.length > 0) {
        for (const incident of enrichedIncidents) {
          // Fetch related risk if exists
          if (incident.risk_id) {
            const riskResult = await env.DB.prepare(`
              SELECT id, title, description, likelihood, impact, risk_level
              FROM risks WHERE id = ?
            `).bind(incident.risk_id).first();
            
            incident.related_risk = riskResult;
          }
          
          // Fetch affected assets based on incident description (semantic search)
          if (incident.description) {
            const assetSearchResults = await vectorize.searchNamespace(
              incident.description,
              'assets',
              { topK: 5, returnMetadata: true }
            );
            
            if (assetSearchResults.length > 0) {
              const assetIds = assetSearchResults.map(r => 
                parseInt(r.metadata?.recordId as string)
              ).filter(id => !isNaN(id));
              
              if (assetIds.length > 0) {
                const assetsResult = await env.DB.prepare(`
                  SELECT id, name, type, criticality, status
                  FROM assets WHERE id IN (${assetIds.join(',')})
                `).all();
                
                incident.potentially_affected_assets = assetsResult.results;
              }
            }
          }
        }
      }
      
      return {
        incidents: enrichedIncidents,
        total: enrichedIncidents.length,
        query,
        filters: filters,
        semantic_search_enabled: true
      };
      
    } catch (error: any) {
      console.error('Error in searchThreatsSemantic:', error);
      return {
        error: true,
        message: error.message || 'Failed to search incidents',
        incidents: [],
        total: 0
      };
    }
  }
};

/**
 * Correlate Threats with Assets
 * 
 * Analyzes relationships between security incidents and organizational assets.
 * Uses semantic understanding to identify potential impact and exposure.
 */
export const correlateThreatswithAssets: MCPTool = {
  name: 'correlate_threats_with_assets',
  description: 'Correlate security threats and incidents with affected assets using semantic analysis. Identifies which assets are potentially impacted by specific threat patterns.',
  inputSchema: {
    type: 'object',
    properties: {
      asset_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of asset IDs to analyze for threat exposure'
      },
      threat_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific threat types to look for (e.g., ["ransomware", "phishing", "data-breach"])'
      },
      time_range_days: {
        type: 'number',
        default: 90,
        description: 'Number of days to look back for incidents (default: 90)'
      },
      severity_threshold: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        description: 'Minimum severity level to include'
      }
    },
    required: ['asset_ids']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { 
      asset_ids, 
      threat_types = [], 
      time_range_days = 90,
      severity_threshold = 'medium' 
    } = args;
    
    try {
      // Validate asset_ids
      if (!Array.isArray(asset_ids) || asset_ids.length === 0) {
        return {
          error: true,
          message: 'asset_ids must be a non-empty array'
        };
      }
      
      // Initialize Vectorize service
      const vectorize = new VectorizeService(env);
      
      // Fetch asset details
      const assetsResult = await env.DB.prepare(`
        SELECT id, name, type, category, criticality, location, status
        FROM assets WHERE id IN (${asset_ids.join(',')})
      `).all();
      
      if (assetsResult.results.length === 0) {
        return {
          error: true,
          message: 'No assets found with provided IDs'
        };
      }
      
      // Define severity hierarchy
      const severityLevels: { [key: string]: number } = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4
      };
      const minSeverity = severityLevels[severity_threshold] || 2;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - time_range_days);
      
      // For each asset, find related incidents using semantic search
      const correlations = [];
      
      for (const asset of assetsResult.results as any[]) {
        // Build semantic query from asset properties
        const assetQuery = `${asset.name} ${asset.type} ${asset.category} ${asset.location || ''}`.trim();
        
        // Search for semantically related incidents
        const incidentSearchResults = await vectorize.searchNamespace(
          assetQuery,
          'incidents',
          { topK: 20, returnMetadata: true }
        );
        
        // Extract incident IDs
        const potentialIncidentIds = incidentSearchResults
          .filter(result => result.score > 0.5) // Only high-relevance matches
          .map(result => parseInt(result.metadata?.recordId as string))
          .filter(id => !isNaN(id));
        
        if (potentialIncidentIds.length === 0) {
          correlations.push({
            asset,
            incidents: [],
            threat_count: 0,
            max_severity: null,
            risk_summary: 'No recent incidents correlated with this asset'
          });
          continue;
        }
        
        // Fetch incident details with filters
        let incidentQuery = `
          SELECT 
            id, title, description, type, severity, status,
            detection_date, root_cause, impact_description
          FROM incidents
          WHERE id IN (${potentialIncidentIds.join(',')})
            AND detection_date >= ?
            AND detection_date <= ?
        `;
        
        // Apply threat type filter if specified
        if (threat_types.length > 0) {
          const typeList = threat_types.map((t: string) => `'${t}'`).join(',');
          incidentQuery += ` AND type IN (${typeList})`;
        }
        
        incidentQuery += ` ORDER BY severity DESC, detection_date DESC`;
        
        const incidentsResult = await env.DB.prepare(incidentQuery)
          .bind(startDate.toISOString(), endDate.toISOString())
          .all();
        
        // Filter by severity threshold
        const filteredIncidents = (incidentsResult.results as any[]).filter(incident => {
          const incidentSeverity = severityLevels[incident.severity] || 0;
          return incidentSeverity >= minSeverity;
        });
        
        // Calculate risk metrics
        const severityCounts = filteredIncidents.reduce((acc: any, inc: any) => {
          acc[inc.severity] = (acc[inc.severity] || 0) + 1;
          return acc;
        }, {});
        
        const maxSeverity = filteredIncidents.length > 0
          ? filteredIncidents[0].severity
          : null;
        
        // Generate risk summary
        let riskSummary = '';
        if (filteredIncidents.length === 0) {
          riskSummary = `No ${severity_threshold}+ severity incidents in the last ${time_range_days} days`;
        } else {
          const severityBreakdown = Object.entries(severityCounts)
            .map(([sev, count]) => `${count} ${sev}`)
            .join(', ');
          riskSummary = `${filteredIncidents.length} incidents detected: ${severityBreakdown}`;
        }
        
        correlations.push({
          asset,
          incidents: filteredIncidents,
          threat_count: filteredIncidents.length,
          severity_breakdown: severityCounts,
          max_severity: maxSeverity,
          risk_summary: riskSummary
        });
      }
      
      // Calculate overall statistics
      const totalIncidents = correlations.reduce((sum, c) => sum + c.threat_count, 0);
      const assetsAtRisk = correlations.filter(c => c.threat_count > 0).length;
      const criticalAssets = correlations.filter(c => c.max_severity === 'critical').length;
      
      return {
        correlations,
        statistics: {
          total_assets_analyzed: assetsResult.results.length,
          assets_with_threats: assetsAtRisk,
          assets_with_critical_threats: criticalAssets,
          total_incidents_found: totalIncidents,
          time_range_days,
          severity_threshold
        },
        analysis_period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      };
      
    } catch (error: any) {
      console.error('Error in correlateThreatswithAssets:', error);
      return {
        error: true,
        message: error.message || 'Failed to correlate threats with assets'
      };
    }
  }
};

/**
 * Analyze Incident Trends
 * 
 * Analyzes incident patterns over time to identify trends, recurring attack types,
 * and potential systemic vulnerabilities.
 */
export const analyzeIncidentTrends: MCPTool = {
  name: 'analyze_incident_trends',
  description: 'Analyze security incident trends over time to identify patterns, recurring attack types, and emerging threats.',
  inputSchema: {
    type: 'object',
    properties: {
      time_range_days: {
        type: 'number',
        default: 90,
        description: 'Number of days to analyze (default: 90)'
      },
      group_by: {
        type: 'string',
        enum: ['type', 'severity', 'status', 'week', 'month'],
        default: 'type',
        description: 'How to group the trend analysis'
      },
      include_predictions: {
        type: 'boolean',
        default: false,
        description: 'Include simple trend predictions based on historical data'
      }
    }
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { time_range_days = 90, group_by = 'type', include_predictions = false } = args;
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - time_range_days);
      
      // Fetch all incidents in range
      const incidentsResult = await env.DB.prepare(`
        SELECT 
          id, title, type, severity, status, detection_date,
          resolution_date, created_at
        FROM incidents
        WHERE detection_date >= ? AND detection_date <= ?
        ORDER BY detection_date ASC
      `).bind(startDate.toISOString(), endDate.toISOString()).all();
      
      const incidents = incidentsResult.results as any[];
      
      if (incidents.length === 0) {
        return {
          trends: [],
          total_incidents: 0,
          message: `No incidents found in the last ${time_range_days} days`
        };
      }
      
      // Group incidents based on group_by parameter
      const groups: { [key: string]: any[] } = {};
      
      incidents.forEach(incident => {
        let groupKey: string;
        
        switch (group_by) {
          case 'week':
            const weekDate = new Date(incident.detection_date);
            const weekStart = new Date(weekDate);
            weekStart.setDate(weekDate.getDate() - weekDate.getDay());
            groupKey = weekStart.toISOString().split('T')[0];
            break;
            
          case 'month':
            const monthDate = new Date(incident.detection_date);
            groupKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
            break;
            
          case 'severity':
            groupKey = incident.severity || 'unknown';
            break;
            
          case 'status':
            groupKey = incident.status || 'unknown';
            break;
            
          case 'type':
          default:
            groupKey = incident.type || 'unknown';
            break;
        }
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(incident);
      });
      
      // Calculate trend metrics for each group
      const trends = Object.entries(groups).map(([group, groupIncidents]) => {
        const severityCounts = groupIncidents.reduce((acc: any, inc) => {
          acc[inc.severity] = (acc[inc.severity] || 0) + 1;
          return acc;
        }, {});
        
        const avgResolutionTime = groupIncidents
          .filter(inc => inc.resolution_date)
          .reduce((sum, inc) => {
            const detected = new Date(inc.detection_date).getTime();
            const resolved = new Date(inc.resolution_date).getTime();
            return sum + (resolved - detected);
          }, 0) / groupIncidents.filter(inc => inc.resolution_date).length;
        
        return {
          group_name: group,
          count: groupIncidents.length,
          severity_breakdown: severityCounts,
          avg_resolution_time_hours: avgResolutionTime ? Math.round(avgResolutionTime / (1000 * 60 * 60)) : null,
          percentage: ((groupIncidents.length / incidents.length) * 100).toFixed(1) + '%'
        };
      });
      
      // Sort by count descending
      trends.sort((a, b) => b.count - a.count);
      
      // Simple trend prediction (if requested)
      let predictions = null;
      if (include_predictions && trends.length > 0) {
        const topThreat = trends[0];
        const avgPerDay = incidents.length / time_range_days;
        const projectedNext30Days = Math.round(avgPerDay * 30);
        
        predictions = {
          most_frequent_threat: topThreat.group_name,
          current_rate_per_day: avgPerDay.toFixed(2),
          projected_next_30_days: projectedNext30Days,
          trend_direction: avgPerDay > 1 ? 'increasing' : 'stable'
        };
      }
      
      return {
        trends,
        total_incidents: incidents.length,
        analysis_period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: time_range_days
        },
        grouped_by: group_by,
        predictions
      };
      
    } catch (error: any) {
      console.error('Error in analyzeIncidentTrends:', error);
      return {
        error: true,
        message: error.message || 'Failed to analyze incident trends'
      };
    }
  }
};

// Export all threat tools
export const threatTools = [
  searchThreatsSemantic,
  correlateThreatswithAssets,
  analyzeIncidentTrends
];
