/**
 * Compliance MCP Tools
 * 
 * Provides semantic search and analysis capabilities for compliance frameworks,
 * controls, assessments, and regulatory requirements.
 */

import type { MCPTool, MCPEnvironment, SemanticSearchOptions } from '../types/mcp-types';
import { VectorizeService } from '../services/vectorize-service';

/**
 * Search Compliance Controls and Frameworks using Semantic Understanding
 * 
 * Searches compliance frameworks and controls using natural language queries.
 * Supports filtering by framework, category, priority, and control type.
 * 
 * Example Queries:
 * - "access control requirements for sensitive data"
 * - "encryption standards for PII protection"
 * - "incident response requirements under GDPR"
 */
export const searchComplianceSemantic: MCPTool = {
  name: 'search_compliance_semantic',
  description: 'Search compliance controls and frameworks using semantic understanding. Supports natural language queries about regulatory requirements, control objectives, and compliance standards.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query about compliance requirements (e.g., "data encryption requirements", "access control standards")'
      },
      topK: {
        type: 'number',
        default: 10,
        description: 'Maximum number of results to return (1-50)'
      },
      filters: {
        type: 'object',
        properties: {
          framework_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'Filter by specific compliance framework IDs'
          },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by control categories (e.g., "Access Control", "Data Protection")'
          },
          priorities: {
            type: 'array',
            items: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            description: 'Filter by control priority levels'
          },
          control_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by control type (e.g., "preventive", "detective", "corrective")'
          }
        }
      },
      include_frameworks: {
        type: 'boolean',
        default: true,
        description: 'Include parent framework information for each control'
      },
      include_assessments: {
        type: 'boolean',
        default: false,
        description: 'Include related compliance assessment data'
      }
    },
    required: ['query']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { 
      query, 
      topK = 10, 
      filters = {}, 
      include_frameworks = true,
      include_assessments = false 
    } = args;
    
    try {
      // Initialize Vectorize service
      const vectorize = new VectorizeService(env);
      
      // Perform semantic search in compliance namespace
      const searchOptions: SemanticSearchOptions = {
        query,
        topK: Math.min(Math.max(topK, 1), 50),
        namespace: 'compliance',
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
      
      // Extract control IDs from semantic results
      const controlIds = semanticResults
        .filter(result => result.metadata && result.metadata.recordId)
        .map(result => parseInt(result.metadata.recordId as string));
      
      if (controlIds.length === 0) {
        return {
          controls: [],
          total: 0,
          query,
          message: 'No compliance controls found matching the semantic query'
        };
      }
      
      // Build SQL query for controls
      let sqlQuery = `
        SELECT 
          fc.id,
          fc.control_id,
          fc.control_name,
          fc.description,
          fc.category,
          fc.priority,
          fc.control_type,
          fc.framework_id,
          fc.created_at
        FROM framework_controls fc
        WHERE fc.id IN (${controlIds.join(',')})
      `;
      
      // Apply filters
      const conditions: string[] = [];
      
      if (filters.framework_ids && filters.framework_ids.length > 0) {
        conditions.push(`fc.framework_id IN (${filters.framework_ids.join(',')})`);
      }
      
      if (filters.categories && filters.categories.length > 0) {
        const categoryList = filters.categories.map((c: string) => `'${c}'`).join(',');
        conditions.push(`fc.category IN (${categoryList})`);
      }
      
      if (filters.priorities && filters.priorities.length > 0) {
        const priorityList = filters.priorities.map((p: string) => `'${p}'`).join(',');
        conditions.push(`fc.priority IN (${priorityList})`);
      }
      
      if (filters.control_types && filters.control_types.length > 0) {
        const typeList = filters.control_types.map((t: string) => `'${t}'`).join(',');
        conditions.push(`fc.control_type IN (${typeList})`);
      }
      
      if (conditions.length > 0) {
        sqlQuery += ` AND ${conditions.join(' AND ')}`;
      }
      
      sqlQuery += ` ORDER BY fc.priority DESC`;
      
      // Execute query
      const controlsResult = await env.DB.prepare(sqlQuery).all();
      
      // Enrich with semantic scores
      const enrichedControls = controlsResult.results.map((control: any) => {
        const semanticMatch = semanticResults.find(
          r => r.metadata && parseInt(r.metadata.recordId as string) === control.id
        );
        
        return {
          ...control,
          semantic_score: semanticMatch?.score || 0,
          relevance: `${((semanticMatch?.score || 0) * 100).toFixed(1)}%`
        };
      });
      
      // Sort by semantic score
      enrichedControls.sort((a, b) => b.semantic_score - a.semantic_score);
      
      // Include framework information if requested
      if (include_frameworks && enrichedControls.length > 0) {
        const frameworkIds = [...new Set(enrichedControls.map(c => c.framework_id))];
        
        const frameworksResult = await env.DB.prepare(`
          SELECT id, name, version, description, regulatory_body, industry, is_active
          FROM compliance_frameworks
          WHERE id IN (${frameworkIds.join(',')})
        `).all();
        
        const frameworksMap = new Map(
          (frameworksResult.results as any[]).map(f => [f.id, f])
        );
        
        enrichedControls.forEach(control => {
          control.framework = frameworksMap.get(control.framework_id);
        });
      }
      
      // Include assessment data if requested
      if (include_assessments && enrichedControls.length > 0) {
        const frameworkIds = [...new Set(enrichedControls.map(c => c.framework_id))];
        
        const assessmentsResult = await env.DB.prepare(`
          SELECT 
            ca.id,
            ca.name,
            ca.framework_id,
            ca.status,
            ca.start_date,
            ca.end_date,
            ca.compliance_score,
            ca.findings_count,
            u.name as assessor_name
          FROM compliance_assessments ca
          LEFT JOIN users u ON ca.assessor_id = u.id
          WHERE ca.framework_id IN (${frameworkIds.join(',')})
            AND ca.status IN ('in_progress', 'completed')
          ORDER BY ca.start_date DESC
        `).all();
        
        const assessmentsByFramework = new Map<number, any[]>();
        (assessmentsResult.results as any[]).forEach(assessment => {
          if (!assessmentsByFramework.has(assessment.framework_id)) {
            assessmentsByFramework.set(assessment.framework_id, []);
          }
          assessmentsByFramework.get(assessment.framework_id)!.push(assessment);
        });
        
        enrichedControls.forEach(control => {
          control.related_assessments = assessmentsByFramework.get(control.framework_id) || [];
        });
      }
      
      return {
        controls: enrichedControls,
        total: enrichedControls.length,
        query,
        filters: filters,
        semantic_search_enabled: true
      };
      
    } catch (error: any) {
      console.error('Error in searchComplianceSemantic:', error);
      return {
        error: true,
        message: error.message || 'Failed to search compliance controls',
        controls: [],
        total: 0
      };
    }
  }
};

/**
 * Get Compliance Gap Analysis
 * 
 * Analyzes compliance gaps by comparing required controls against
 * implemented controls and current risk posture.
 */
export const getComplianceGapAnalysis: MCPTool = {
  name: 'get_compliance_gap_analysis',
  description: 'Analyze compliance gaps for a specific framework by comparing required controls with current implementation status and risk coverage.',
  inputSchema: {
    type: 'object',
    properties: {
      framework_id: {
        type: 'number',
        description: 'Compliance framework ID to analyze'
      },
      control_categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Specific control categories to analyze'
      },
      risk_threshold: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        description: 'Minimum risk level to consider in gap analysis'
      }
    },
    required: ['framework_id']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { framework_id, control_categories = [], risk_threshold = 'medium' } = args;
    
    try {
      // Fetch framework details
      const frameworkResult = await env.DB.prepare(`
        SELECT id, name, version, description, regulatory_body, industry
        FROM compliance_frameworks WHERE id = ?
      `).bind(framework_id).first();
      
      if (!frameworkResult) {
        return {
          error: true,
          message: `Framework with ID ${framework_id} not found`
        };
      }
      
      // Fetch all controls for this framework
      let controlsQuery = `
        SELECT id, control_id, control_name, description, category, priority, control_type
        FROM framework_controls
        WHERE framework_id = ?
      `;
      
      if (control_categories.length > 0) {
        const categoryList = control_categories.map((c: string) => `'${c}'`).join(',');
        controlsQuery += ` AND category IN (${categoryList})`;
      }
      
      controlsQuery += ` ORDER BY priority DESC, category`;
      
      const controlsResult = await env.DB.prepare(controlsQuery)
        .bind(framework_id)
        .all();
      
      const controls = controlsResult.results as any[];
      
      if (controls.length === 0) {
        return {
          framework: frameworkResult,
          gaps: [],
          total_controls: 0,
          message: 'No controls found for this framework'
        };
      }
      
      // Fetch recent compliance assessments
      const assessmentsResult = await env.DB.prepare(`
        SELECT id, name, status, compliance_score, findings_count, start_date, end_date
        FROM compliance_assessments
        WHERE framework_id = ?
        ORDER BY start_date DESC
        LIMIT 5
      `).bind(framework_id).all();
      
      // Analyze gaps by comparing controls with risks
      const vectorize = new VectorizeService(env);
      const gaps = [];
      
      for (const control of controls) {
        // Search for related risks using semantic search
        const controlQuery = `${control.control_name} ${control.description}`.trim();
        
        const riskSearchResults = await vectorize.searchNamespace(
          controlQuery,
          'risks',
          { topK: 5, returnMetadata: true }
        );
        
        // Check if any high-relevance risks exist (score > 0.6)
        const relatedRisks = riskSearchResults.filter(r => r.score > 0.6);
        
        if (relatedRisks.length > 0) {
          // Fetch risk details
          const riskIds = relatedRisks.map(r => parseInt(r.metadata?.recordId as string));
          
          const risksResult = await env.DB.prepare(`
            SELECT id, title, description, risk_level, status, likelihood, impact
            FROM risks
            WHERE id IN (${riskIds.join(',')})
          `).all();
          
          const highRisks = (risksResult.results as any[]).filter(risk => {
            const riskLevels: { [key: string]: number } = {
              low: 1, medium: 2, high: 3, critical: 4
            };
            const thresholdLevel = riskLevels[risk_threshold] || 2;
            const currentLevel = riskLevels[risk.risk_level] || 0;
            return currentLevel >= thresholdLevel;
          });
          
          if (highRisks.length > 0) {
            gaps.push({
              control,
              gap_type: 'risk_coverage',
              severity: highRisks[0].risk_level,
              related_risks: highRisks,
              gap_description: `${highRisks.length} ${risk_threshold}+ severity risk(s) identified that relate to this control`,
              recommendation: `Review and strengthen implementation of ${control.control_name} to address identified risks`
            });
          }
        } else {
          // No related risks found - potential control without coverage
          gaps.push({
            control,
            gap_type: 'no_risk_mapping',
            severity: 'unknown',
            gap_description: 'No risks mapped to this control requirement',
            recommendation: `Assess whether this control is implemented and document related risks`
          });
        }
      }
      
      // Calculate gap statistics
      const gapsByType = gaps.reduce((acc: any, gap) => {
        acc[gap.gap_type] = (acc[gap.gap_type] || 0) + 1;
        return acc;
      }, {});
      
      const gapsBySeverity = gaps.reduce((acc: any, gap) => {
        const severity = gap.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});
      
      return {
        framework: frameworkResult,
        gaps,
        statistics: {
          total_controls: controls.length,
          total_gaps: gaps.length,
          gaps_by_type: gapsByType,
          gaps_by_severity: gapsBySeverity,
          compliance_coverage: ((controls.length - gaps.length) / controls.length * 100).toFixed(1) + '%'
        },
        recent_assessments: assessmentsResult.results,
        risk_threshold
      };
      
    } catch (error: any) {
      console.error('Error in getComplianceGapAnalysis:', error);
      return {
        error: true,
        message: error.message || 'Failed to perform compliance gap analysis'
      };
    }
  }
};

/**
 * Map Risks to Compliance Controls
 * 
 * Maps identified risks to relevant compliance controls using semantic analysis,
 * helping organizations understand which controls address which risks.
 */
export const mapRisksToControls: MCPTool = {
  name: 'map_risks_to_controls',
  description: 'Map identified risks to relevant compliance controls using semantic analysis to show which controls address which risks.',
  inputSchema: {
    type: 'object',
    properties: {
      risk_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of risk IDs to map to controls'
      },
      framework_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Optional: Limit to specific framework IDs'
      },
      relevance_threshold: {
        type: 'number',
        default: 0.6,
        description: 'Minimum semantic relevance score (0.0-1.0) for mapping'
      }
    },
    required: ['risk_ids']
  },
  
  async execute(args: any, env: MCPEnvironment): Promise<any> {
    const { risk_ids, framework_ids = [], relevance_threshold = 0.6 } = args;
    
    try {
      // Validate inputs
      if (!Array.isArray(risk_ids) || risk_ids.length === 0) {
        return {
          error: true,
          message: 'risk_ids must be a non-empty array'
        };
      }
      
      // Fetch risk details
      const risksResult = await env.DB.prepare(`
        SELECT id, title, description, category, risk_level, likelihood, impact, status
        FROM risks
        WHERE id IN (${risk_ids.join(',')})
      `).all();
      
      if (risksResult.results.length === 0) {
        return {
          error: true,
          message: 'No risks found with provided IDs'
        };
      }
      
      // Initialize Vectorize service
      const vectorize = new VectorizeService(env);
      
      const mappings = [];
      
      // For each risk, find relevant controls
      for (const risk of risksResult.results as any[]) {
        // Build semantic query from risk properties
        const riskQuery = `${risk.title} ${risk.description} ${risk.category}`.trim();
        
        // Search for relevant controls
        const controlSearchResults = await vectorize.searchNamespace(
          riskQuery,
          'compliance',
          { topK: 10, returnMetadata: true }
        );
        
        // Filter by relevance threshold
        const relevantControls = controlSearchResults.filter(
          result => result.score >= relevance_threshold
        );
        
        if (relevantControls.length === 0) {
          mappings.push({
            risk,
            mapped_controls: [],
            mapping_count: 0,
            coverage_status: 'no_controls_found',
            recommendation: 'No compliance controls found that address this risk. Consider defining custom controls.'
          });
          continue;
        }
        
        // Fetch control details
        const controlIds = relevantControls.map(r => parseInt(r.metadata?.recordId as string));
        
        let controlsQuery = `
          SELECT 
            fc.id,
            fc.control_id,
            fc.control_name,
            fc.description,
            fc.category,
            fc.priority,
            fc.framework_id,
            cf.name as framework_name,
            cf.version as framework_version
          FROM framework_controls fc
          JOIN compliance_frameworks cf ON fc.framework_id = cf.id
          WHERE fc.id IN (${controlIds.join(',')})
        `;
        
        // Apply framework filter if specified
        if (framework_ids.length > 0) {
          controlsQuery += ` AND fc.framework_id IN (${framework_ids.join(',')})`;
        }
        
        const controlsResult = await env.DB.prepare(controlsQuery).all();
        
        // Enrich with semantic scores
        const enrichedControls = (controlsResult.results as any[]).map(control => {
          const semanticMatch = relevantControls.find(
            r => parseInt(r.metadata?.recordId as string) === control.id
          );
          
          return {
            ...control,
            semantic_score: semanticMatch?.score || 0,
            relevance: `${((semanticMatch?.score || 0) * 100).toFixed(1)}%`
          };
        });
        
        // Sort by semantic score
        enrichedControls.sort((a, b) => b.semantic_score - a.semantic_score);
        
        // Determine coverage status
        let coverageStatus = 'full_coverage';
        if (enrichedControls.length === 0) {
          coverageStatus = 'no_controls_found';
        } else if (enrichedControls.length < 3) {
          coverageStatus = 'partial_coverage';
        }
        
        mappings.push({
          risk,
          mapped_controls: enrichedControls,
          mapping_count: enrichedControls.length,
          coverage_status: coverageStatus,
          top_control: enrichedControls[0] || null,
          recommendation: this.generateMappingRecommendation(risk, enrichedControls)
        });
      }
      
      // Calculate overall statistics
      const totalMappings = mappings.reduce((sum, m) => sum + m.mapping_count, 0);
      const risksWithControls = mappings.filter(m => m.mapping_count > 0).length;
      const avgControlsPerRisk = totalMappings / risksResult.results.length;
      
      return {
        mappings,
        statistics: {
          total_risks_analyzed: risksResult.results.length,
          risks_with_controls: risksWithControls,
          total_control_mappings: totalMappings,
          avg_controls_per_risk: avgControlsPerRisk.toFixed(2),
          relevance_threshold
        }
      };
      
    } catch (error: any) {
      console.error('Error in mapRisksToControls:', error);
      return {
        error: true,
        message: error.message || 'Failed to map risks to controls'
      };
    }
  },
  
  // Helper method to generate recommendations
  generateMappingRecommendation(risk: any, controls: any[]): string {
    if (controls.length === 0) {
      return `Define custom controls to address this ${risk.risk_level} severity risk`;
    } else if (controls.length < 3) {
      return `Limited control coverage found. Consider implementing additional controls from ${controls[0].framework_name}`;
    } else {
      const frameworks = [...new Set(controls.map(c => c.framework_name))];
      return `Good control coverage across ${frameworks.length} framework(s): ${frameworks.join(', ')}`;
    }
  }
};

// Export all compliance tools
export const complianceTools = [
  searchComplianceSemantic,
  getComplianceGapAnalysis,
  mapRisksToControls
];
