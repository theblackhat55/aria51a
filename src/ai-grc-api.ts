// AI GRC API Routes - Asset, Service & Dynamic Risk Intelligence
// RESTful API endpoints for AI-powered risk analysis

import { Hono } from 'hono';
import { CloudflareBindings } from './types';
import { AIGRCEngine, DEFAULT_AI_GRC_CONFIG } from './ai-grc-engine';
import { authMiddleware, requireRole } from './auth';

export function createAIGRCAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Initialize AI GRC Engine
  const initializeAIGRCEngine = (env: CloudflareBindings) => {
    return new AIGRCEngine(env, DEFAULT_AI_GRC_CONFIG);
  };

  // ====================
  // ASSET RISK ANALYSIS
  // ====================

  // Analyze single asset risk
  app.post('/assets/:assetId/analyze', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const assetId = c.req.param('assetId');
      const aiEngine = initializeAIGRCEngine(c.env);
      
      console.log(`🔍 Starting AI risk analysis for asset: ${assetId}`);
      
      const analysis = await aiEngine.analyzeAssetRisk(assetId);
      
      return c.json({
        success: true,
        data: analysis,
        message: 'Asset risk analysis completed successfully'
      });
    } catch (error) {
      console.error('Asset analysis error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to analyze asset risk'
      }, 500);
    }
  });

  // Get asset risk analysis results
  app.get('/assets/:assetId/analysis', authMiddleware, async (c) => {
    try {
      const assetId = c.req.param('assetId');
      
      const analysis = await c.env.DB.prepare(`
        SELECT 
          aaa.*,
          a.name as asset_name,
          a.asset_type,
          a.risk_score as defender_risk_score
        FROM ai_asset_analysis aaa
        JOIN assets a ON aaa.asset_id = a.asset_id
        WHERE aaa.asset_id = ?
        ORDER BY aaa.analysis_timestamp DESC
        LIMIT 1
      `).bind(assetId).first();

      if (!analysis) {
        return c.json({
          success: false,
          error: 'No analysis found for this asset'
        }, 404);
      }

      // Parse JSON fields
      const result = {
        ...analysis,
        contributing_factors: JSON.parse(analysis.contributing_factors || '{}'),
        vulnerabilities_summary: JSON.parse(analysis.vulnerabilities_summary || '{}'),
        incidents_summary: JSON.parse(analysis.incidents_summary || '{}'),
        recommendations: JSON.parse(analysis.recommendations || '[]')
      };

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get asset analysis error:', error);
      return c.json({
        success: false,
        error: 'Failed to retrieve asset analysis'
      }, 500);
    }
  });

  // Bulk asset analysis
  app.post('/assets/analyze-bulk', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const { asset_ids, priority = 'normal' } = await c.req.json();
      
      if (!asset_ids || !Array.isArray(asset_ids)) {
        return c.json({
          success: false,
          error: 'asset_ids must be an array'
        }, 400);
      }

      const user = c.get('user');
      const queuePriority = priority === 'high' ? 2 : priority === 'low' ? 8 : 5;

      // Add to analysis queue
      for (const assetId of asset_ids) {
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO ai_analysis_queue 
          (analysis_type, entity_type, entity_id, priority, requested_by)
          VALUES (?, ?, ?, ?, ?)
        `).bind('asset_risk', 'asset', assetId, queuePriority, user.id).run();
      }

      return c.json({
        success: true,
        data: {
          queued_count: asset_ids.length,
          priority: priority,
          estimated_completion: new Date(Date.now() + asset_ids.length * 30000).toISOString()
        },
        message: 'Asset analyses queued successfully'
      });
    } catch (error) {
      console.error('Bulk asset analysis error:', error);
      return c.json({
        success: false,
        error: 'Failed to queue asset analyses'
      }, 500);
    }
  });

  // Get asset risk dashboard
  app.get('/assets/risk-dashboard', authMiddleware, async (c) => {
    try {
      // Get risk distribution based on risk_score ranges
      const riskDistribution = await c.env.DB.prepare(`
        SELECT 
          CASE 
            WHEN risk_score >= 9.0 THEN 'critical'
            WHEN risk_score >= 7.0 THEN 'high'
            WHEN risk_score >= 4.0 THEN 'medium'
            ELSE 'low'
          END as ai_risk_level,
          COUNT(*) as count
        FROM assets
        GROUP BY 
          CASE 
            WHEN risk_score >= 9.0 THEN 'critical'
            WHEN risk_score >= 7.0 THEN 'high'
            WHEN risk_score >= 4.0 THEN 'medium'
            ELSE 'low'
          END
      `).all();

      // Get top risk assets
      const topRiskAssets = await c.env.DB.prepare(`
        SELECT 
          asset_id,
          name,
          asset_type,
          risk_score as ai_risk_score,
          CASE 
            WHEN risk_score >= 9.0 THEN 'critical'
            WHEN risk_score >= 7.0 THEN 'high'
            WHEN risk_score >= 4.0 THEN 'medium'
            ELSE 'low'
          END as ai_risk_level,
          vulnerability_count,
          critical_vulnerabilities as critical_vulnerability_count,
          0 as incident_count,
          updated_at as last_ai_analysis
        FROM assets
        ORDER BY risk_score DESC
        LIMIT 10
      `).all();

      // Get recent analyses (simplified using assets table)
      const recentAnalyses = await c.env.DB.prepare(`
        SELECT 
          asset_id,
          name as asset_name,
          risk_score as ai_risk_score,
          CASE 
            WHEN risk_score >= 9.0 THEN 'critical'
            WHEN risk_score >= 7.0 THEN 'high'
            WHEN risk_score >= 4.0 THEN 'medium'
            ELSE 'low'
          END as risk_level,
          updated_at as analysis_timestamp,
          'stable' as trend
        FROM assets
        ORDER BY updated_at DESC
        LIMIT 20
      `).all();

      // Get vulnerability summary (simplified)
      const vulnerabilitySummary = await c.env.DB.prepare(`
        SELECT 
          'active' as status,
          CASE 
            WHEN critical_vulnerabilities > 0 THEN 'critical'
            WHEN vulnerability_count > 10 THEN 'high'
            WHEN vulnerability_count > 5 THEN 'medium'
            ELSE 'low'
          END as severity,
          COUNT(*) as count
        FROM assets
        WHERE vulnerability_count > 0
        GROUP BY 
          CASE 
            WHEN critical_vulnerabilities > 0 THEN 'critical'
            WHEN vulnerability_count > 10 THEN 'high'
            WHEN vulnerability_count > 5 THEN 'medium'
            ELSE 'low'
          END
      `).all();

      return c.json({
        success: true,
        data: {
          risk_distribution: riskDistribution.results || [],
          top_risk_assets: topRiskAssets.results || [],
          recent_analyses: recentAnalyses.results || [],
          vulnerability_summary: vulnerabilitySummary.results || []
        }
      });
    } catch (error) {
      console.error('Asset risk dashboard error:', error);
      return c.json({
        success: false,
        error: 'Failed to load asset risk dashboard'
      }, 500);
    }
  });

  // ====================
  // SERVICE RISK ANALYSIS
  // ====================

  // Analyze single service risk
  app.post('/services/:serviceId/analyze', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const serviceId = c.req.param('serviceId');
      const aiEngine = initializeAIGRCEngine(c.env);
      
      console.log(`🔍 Starting AI risk analysis for service: ${serviceId}`);
      
      const analysis = await aiEngine.analyzeServiceRisk(serviceId);
      
      return c.json({
        success: true,
        data: analysis,
        message: 'Service risk analysis completed successfully'
      });
    } catch (error) {
      console.error('Service analysis error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to analyze service risk'
      }, 500);
    }
  });

  // Get service risk analysis results
  app.get('/services/:serviceId/analysis', authMiddleware, async (c) => {
    try {
      const serviceId = c.req.param('serviceId');
      
      const analysis = await c.env.DB.prepare(`
        SELECT 
          asa.*,
          s.name as service_name,
          s.service_type,
          s.criticality,
          s.risk_rating as base_risk_rating
        FROM ai_service_analysis asa
        JOIN services s ON asa.service_id = s.service_id
        WHERE asa.service_id = ?
        ORDER BY asa.analysis_timestamp DESC
        LIMIT 1
      `).bind(serviceId).first();

      if (!analysis) {
        return c.json({
          success: false,
          error: 'No analysis found for this service'
        }, 404);
      }

      // Parse JSON fields
      const result = {
        ...analysis,
        contributing_factors: JSON.parse(analysis.contributing_factors || '{}'),
        risk_dependencies: JSON.parse(analysis.risk_dependencies || '[]'),
        asset_risks: JSON.parse(analysis.asset_risks || '[]'),
        recommendations: JSON.parse(analysis.recommendations || '[]'),
        mitigation_strategies: JSON.parse(analysis.mitigation_strategies || '[]')
      };

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get service analysis error:', error);
      return c.json({
        success: false,
        error: 'Failed to retrieve service analysis'
      }, 500);
    }
  });

  // Get service risk dashboard
  app.get('/services/risk-dashboard', authMiddleware, async (c) => {
    try {
      // Get service risk distribution
      const riskDistribution = await c.env.DB.prepare(`
        SELECT 
          ai_risk_level,
          COUNT(*) as count
        FROM services
        WHERE ai_risk_level IS NOT NULL
        GROUP BY ai_risk_level
      `).all();

      // Get critical services
      const criticalServices = await c.env.DB.prepare(`
        SELECT 
          service_id,
          name,
          service_type,
          criticality,
          ai_risk_score,
          ai_risk_level,
          dependency_risk_score,
          sla_compliance_score,
          last_ai_analysis
        FROM services
        WHERE ai_risk_level IN ('critical', 'high')
        ORDER BY ai_risk_score DESC
      `).all();

      // Get service dependencies at risk
      const dependenciesAtRisk = await c.env.DB.prepare(`
        SELECT 
          s.service_id,
          s.name as service_name,
          ds.service_id as depends_on_service_id,
          deps.name as depends_on_service_name,
          sd.dependency_type,
          deps.ai_risk_score,
          deps.ai_risk_level
        FROM services s
        JOIN service_dependencies sd ON s.id = sd.service_id
        JOIN services deps ON sd.depends_on_service_id = deps.id
        WHERE deps.ai_risk_level IN ('critical', 'high')
        ORDER BY deps.ai_risk_score DESC
      `).all();

      return c.json({
        success: true,
        data: {
          risk_distribution: riskDistribution.results || [],
          critical_services: criticalServices.results || [],
          dependencies_at_risk: dependenciesAtRisk.results || []
        }
      });
    } catch (error) {
      console.error('Service risk dashboard error:', error);
      return c.json({
        success: false,
        error: 'Failed to load service risk dashboard'
      }, 500);
    }
  });

  // ====================
  // AI RISK ASSESSMENT FOR FORMS
  // ====================

  // LLM-powered risk assessment for form creation/editing (ARIA Platform v6.0)
  app.post('/risk-assessment', authMiddleware, async (c) => {
    try {
      const { title, description, services, threat_source } = await c.req.json();
      
      if (!title && !description) {
        return c.json({
          success: false,
          error: 'Title or description is required for AI assessment'
        }, 400);
      }

      console.log('🧠 Generating LLM-powered AI risk assessment for:', { title, description, services, threat_source });

      // Try LLM-powered assessment first
      try {
        const { LLMRiskAssessmentEngine } = await import('./ai-risk-llm-assessment.js');
        const llmEngine = new LLMRiskAssessmentEngine(c.env);
        
        const llmRequest = {
          title: title || '',
          description: description || '',
          services: Array.isArray(services) ? services : (services ? [services] : []),
          threat_source: threat_source || 'unknown'
        };

        const llmAssessment = await llmEngine.performLLMRiskAssessment(llmRequest);
        
        console.log('✅ LLM assessment completed successfully');
        return c.json({
          success: true,
          data: {
            probability: llmAssessment.probability,
            impact: llmAssessment.impact,
            ai_probability: llmAssessment.probability, // Backward compatibility
            ai_impact: llmAssessment.impact, // Backward compatibility
            risk_score: llmAssessment.risk_score,
            risk_level: llmAssessment.risk_level,
            reasoning: llmAssessment.reasoning,
            service_analysis: llmAssessment.service_impact_analysis,
            recommendations: llmAssessment.recommendations,
            mitigation_suggestions: llmAssessment.recommendations,
            confidence: Math.round(llmAssessment.confidence_level * 100),
            confidence_level: llmAssessment.confidence_level,
            ai_provider: llmAssessment.ai_provider,
            assessment_type: llmAssessment.assessment_type,
            analysis_timestamp: new Date().toISOString()
          },
          message: `${llmAssessment.assessment_type === 'llm_powered' ? 'LLM-powered' : 'Algorithm-based'} AI risk assessment completed successfully`
        });
      } catch (llmError) {
        console.warn('LLM assessment failed, falling back to algorithm-based:', llmError);
        // Fall back to algorithm-based assessment
      }

      // Fallback: Algorithm-based assessment (original implementation)
      const riskContext = {
        title: title || 'Untitled Risk',
        description: description || '',
        threat_source: threat_source || 'unknown',
        associated_services: services || [],
        service_count: Array.isArray(services) ? services.length : 0
      };

      // AI analysis based on risk characteristics
      let aiProbability = 3; // Default medium
      let aiImpact = 3; // Default medium
      let reasoning = 'Based on standard risk assessment patterns';

      // Analyze threat source impact
      const threatSourceMultipliers = {
        'external_threat_actor': { prob: 1.2, impact: 1.3 },
        'insider_threat': { prob: 1.1, impact: 1.4 },
        'system_failure': { prob: 1.0, impact: 1.1 },
        'natural_disaster': { prob: 0.8, impact: 1.5 },
        'cyber_attack': { prob: 1.3, impact: 1.4 },
        'human_error': { prob: 1.2, impact: 1.0 },
        'third_party': { prob: 1.1, impact: 1.2 },
        'regulatory_change': { prob: 0.9, impact: 1.1 },
        'unknown': { prob: 1.0, impact: 1.0 }
      };

      const threatMultiplier = threatSourceMultipliers[threat_source] || threatSourceMultipliers['unknown'];

      // Text analysis for risk keywords
      const riskText = `${title} ${description}`.toLowerCase();
      
      // High-risk keywords
      const criticalKeywords = ['critical', 'severe', 'catastrophic', 'breach', 'failure', 'outage', 'loss', 'compromise'];
      const highKeywords = ['significant', 'major', 'important', 'disruption', 'impact', 'vulnerable', 'exploit'];
      const mediumKeywords = ['moderate', 'potential', 'possible', 'minor', 'temporary', 'limited'];

      let keywordScore = 3; // Default medium
      if (criticalKeywords.some(keyword => riskText.includes(keyword))) {
        keywordScore = 5;
        reasoning += '. Critical risk keywords detected';
      } else if (highKeywords.some(keyword => riskText.includes(keyword))) {
        keywordScore = 4;
        reasoning += '. High-impact keywords detected';
      } else if (mediumKeywords.some(keyword => riskText.includes(keyword))) {
        keywordScore = 3;
        reasoning += '. Standard risk indicators present';
      }

      // Service dependency impact
      let serviceImpactMultiplier = 1.0;
      if (riskContext.service_count > 5) {
        serviceImpactMultiplier = 1.3;
        reasoning += '. Multiple service dependencies increase impact';
      } else if (riskContext.service_count > 2) {
        serviceImpactMultiplier = 1.2;
        reasoning += '. Service dependencies present';
      } else if (riskContext.service_count > 0) {
        serviceImpactMultiplier = 1.1;
        reasoning += '. Limited service impact';
      }

      // Calculate AI suggestions
      aiProbability = Math.min(5, Math.max(1, Math.round(keywordScore * threatMultiplier.prob)));
      aiImpact = Math.min(5, Math.max(1, Math.round(keywordScore * threatMultiplier.impact * serviceImpactMultiplier)));

      // Calculate risk score
      const riskScore = aiProbability * aiImpact;
      
      // Determine risk level
      let riskLevel = 'low';
      if (riskScore >= 20) riskLevel = 'critical';
      else if (riskScore >= 12) riskLevel = 'high';
      else if (riskScore >= 6) riskLevel = 'medium';

      // Generate additional insights
      const insights = [];
      
      if (threat_source === 'cyber_attack' || threat_source === 'external_threat_actor') {
        insights.push('Consider implementing additional security controls and monitoring');
      }
      
      if (riskContext.service_count > 3) {
        insights.push('High service dependency requires comprehensive business continuity planning');
      }
      
      if (riskScore >= 15) {
        insights.push('This risk requires immediate attention and senior management oversight');
      }

      // Mitigation suggestions based on threat source
      const mitigationSuggestions = {
        'cyber_attack': ['Implement multi-factor authentication', 'Regular security assessments', 'Incident response planning'],
        'system_failure': ['Redundancy planning', 'Regular system maintenance', 'Backup and recovery procedures'],
        'human_error': ['Staff training programs', 'Process documentation', 'Quality assurance checks'],
        'natural_disaster': ['Business continuity planning', 'Geographic redundancy', 'Emergency response procedures'],
        'insider_threat': ['Access controls', 'Background checks', 'Activity monitoring'],
        'third_party': ['Vendor risk assessments', 'Service level agreements', 'Regular audits']
      };

      const suggestions = mitigationSuggestions[threat_source] || ['Regular risk assessments', 'Monitoring and review', 'Stakeholder communication'];

      return c.json({
        success: true,
        data: {
          ai_probability: aiProbability,
          ai_impact: aiImpact,
          risk_score: riskScore,
          risk_level: riskLevel,
          reasoning: reasoning,
          confidence: Math.min(95, 70 + (riskText.length > 50 ? 20 : 10) + (riskContext.service_count > 0 ? 5 : 0)),
          insights: insights,
          mitigation_suggestions: suggestions,
          analysis_timestamp: new Date().toISOString(),
          threat_source_analysis: {
            source: threat_source,
            probability_multiplier: threatMultiplier.prob,
            impact_multiplier: threatMultiplier.impact
          },
          service_impact_analysis: {
            services_count: riskContext.service_count,
            impact_multiplier: serviceImpactMultiplier
          },
          assessment_type: 'algorithm_based'
        },
        message: 'Algorithm-based risk assessment completed (LLM unavailable)'
      });
    } catch (error) {
      console.error('AI risk assessment error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to generate AI risk assessment'
      }, 500);
    }
  });

  // ====================
  // DYNAMIC RISK ANALYSIS
  // ====================

  // Perform dynamic risk assessment
  app.post('/risks/:riskId/dynamic-analysis', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const riskId = c.req.param('riskId');
      const aiEngine = initializeAIGRCEngine(c.env);
      
      console.log(`🔍 Starting dynamic AI risk assessment for risk: ${riskId}`);
      
      const assessment = await aiEngine.performDynamicRiskAssessment(riskId);
      
      return c.json({
        success: true,
        data: assessment,
        message: 'Dynamic risk assessment completed successfully'
      });
    } catch (error) {
      console.error('Dynamic risk analysis error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to perform dynamic risk assessment'
      }, 500);
    }
  });

  // Get dynamic risk analysis results
  app.get('/risks/:riskId/dynamic-analysis', authMiddleware, async (c) => {
    try {
      const riskId = c.req.param('riskId');
      
      const analysis = await c.env.DB.prepare(`
        SELECT 
          adra.*,
          r.title as risk_title,
          r.probability,
          r.impact,
          r.risk_score
        FROM ai_dynamic_risk_analysis adra
        JOIN risks r ON adra.risk_id = r.id
        WHERE adra.risk_id = ?
        ORDER BY adra.analysis_timestamp DESC
        LIMIT 1
      `).bind(riskId).first();

      if (!analysis) {
        return c.json({
          success: false,
          error: 'No dynamic analysis found for this risk'
        }, 404);
      }

      // Parse JSON fields
      const result = {
        ...analysis,
        dynamic_multipliers: JSON.parse(analysis.dynamic_multipliers || '{}'),
        real_time_factors: JSON.parse(analysis.real_time_factors || '{}'),
        predictive_analysis: JSON.parse(analysis.predictive_analysis || '{}'),
        recommendations: JSON.parse(analysis.recommendations || '{}')
      };

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get dynamic risk analysis error:', error);
      return c.json({
        success: false,
        error: 'Failed to retrieve dynamic risk analysis'
      }, 500);
    }
  });

  // Bulk dynamic risk analysis
  app.post('/risks/dynamic-analysis-bulk', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const { risk_ids, priority = 'normal' } = await c.req.json();
      
      if (!risk_ids || !Array.isArray(risk_ids)) {
        return c.json({
          success: false,
          error: 'risk_ids must be an array'
        }, 400);
      }

      const user = c.get('user');
      const queuePriority = priority === 'high' ? 1 : priority === 'low' ? 7 : 4;

      // Add to analysis queue
      for (const riskId of risk_ids) {
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO ai_analysis_queue 
          (analysis_type, entity_type, entity_id, priority, requested_by)
          VALUES (?, ?, ?, ?, ?)
        `).bind('dynamic_risk', 'risk', riskId.toString(), queuePriority, user.id).run();
      }

      return c.json({
        success: true,
        data: {
          queued_count: risk_ids.length,
          priority: priority,
          estimated_completion: new Date(Date.now() + risk_ids.length * 45000).toISOString()
        },
        message: 'Dynamic risk analyses queued successfully'
      });
    } catch (error) {
      console.error('Bulk dynamic risk analysis error:', error);
      return c.json({
        success: false,
        error: 'Failed to queue dynamic risk analyses'
      }, 500);
    }
  });

  // ====================
  // VULNERABILITY MANAGEMENT
  // ====================

  // Get vulnerability summary
  app.get('/vulnerabilities/summary', authMiddleware, async (c) => {
    try {
      const summary = await c.env.DB.prepare(`
        SELECT 
          dv.severity,
          av.status,
          COUNT(*) as count,
          AVG(dv.cvss_score) as avg_cvss
        FROM defender_vulnerabilities dv
        JOIN asset_vulnerabilities av ON dv.id = av.vulnerability_id
        GROUP BY dv.severity, av.status
        ORDER BY 
          CASE dv.severity 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
            ELSE 5 
          END,
          av.status
      `).all();

      const topVulnerabilities = await c.env.DB.prepare(`
        SELECT 
          dv.cve_id,
          dv.title,
          dv.severity,
          dv.cvss_score,
          COUNT(av.id) as affected_assets,
          dv.exploit_available
        FROM defender_vulnerabilities dv
        JOIN asset_vulnerabilities av ON dv.id = av.vulnerability_id
        WHERE av.status = 'active'
        GROUP BY dv.id
        ORDER BY dv.cvss_score DESC, affected_assets DESC
        LIMIT 20
      `).all();

      return c.json({
        success: true,
        data: {
          summary: summary.results || [],
          top_vulnerabilities: topVulnerabilities.results || []
        }
      });
    } catch (error) {
      console.error('Vulnerability summary error:', error);
      return c.json({
        success: false,
        error: 'Failed to load vulnerability summary'
      }, 500);
    }
  });

  // ====================
  // AI ANALYSIS QUEUE MANAGEMENT
  // ====================

  // Get analysis queue status
  app.get('/ai-analysis/queue', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const queueStatus = await c.env.DB.prepare(`
        SELECT 
          analysis_type,
          status,
          COUNT(*) as count,
          AVG(
            CASE 
              WHEN status = 'completed' AND completed_at IS NOT NULL 
              THEN (julianday(completed_at) - julianday(started_at)) * 24 * 60
              ELSE NULL 
            END
          ) as avg_processing_time_minutes
        FROM ai_analysis_queue
        GROUP BY analysis_type, status
        ORDER BY analysis_type, status
      `).all();

      const pendingItems = await c.env.DB.prepare(`
        SELECT 
          id,
          analysis_type,
          entity_type,
          entity_id,
          priority,
          scheduled_for,
          retry_count
        FROM ai_analysis_queue
        WHERE status = 'pending'
        ORDER BY priority ASC, scheduled_for ASC
        LIMIT 50
      `).all();

      return c.json({
        success: true,
        data: {
          queue_status: queueStatus.results || [],
          pending_items: pendingItems.results || []
        }
      });
    } catch (error) {
      console.error('AI analysis queue error:', error);
      return c.json({
        success: false,
        error: 'Failed to load analysis queue'
      }, 500);
    }
  });

  // Process analysis queue (manual trigger)
  app.post('/ai-analysis/process-queue', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const { batch_size = 5 } = await c.req.json();
      
      // Get pending items
      const pendingItems = await c.env.DB.prepare(`
        SELECT * FROM ai_analysis_queue
        WHERE status = 'pending' AND retry_count < max_retries
        ORDER BY priority ASC, scheduled_for ASC
        LIMIT ?
      `).bind(batch_size).all();

      if (!pendingItems.results || pendingItems.results.length === 0) {
        return c.json({
          success: true,
          data: { processed: 0 },
          message: 'No pending analyses to process'
        });
      }

      const aiEngine = initializeAIGRCEngine(c.env);
      let processed = 0;

      // Process each item
      for (const item of pendingItems.results) {
        try {
          // Mark as processing
          await c.env.DB.prepare(`
            UPDATE ai_analysis_queue 
            SET status = 'processing', started_at = datetime('now')
            WHERE id = ?
          `).bind(item.id).run();

          // Perform analysis based on type
          let result;
          switch (item.analysis_type) {
            case 'asset_risk':
              result = await aiEngine.analyzeAssetRisk(item.entity_id);
              break;
            case 'service_risk':
              result = await aiEngine.analyzeServiceRisk(item.entity_id);
              break;
            case 'dynamic_risk':
              result = await aiEngine.performDynamicRiskAssessment(item.entity_id);
              break;
            default:
              throw new Error(`Unsupported analysis type: ${item.analysis_type}`);
          }

          // Mark as completed
          await c.env.DB.prepare(`
            UPDATE ai_analysis_queue 
            SET status = 'completed', completed_at = datetime('now')
            WHERE id = ?
          `).bind(item.id).run();

          processed++;
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error);
          
          // Mark as failed or retry
          const newRetryCount = item.retry_count + 1;
          if (newRetryCount >= item.max_retries) {
            await c.env.DB.prepare(`
              UPDATE ai_analysis_queue 
              SET status = 'failed', error_message = ?, retry_count = ?
              WHERE id = ?
            `).bind(error.message, newRetryCount, item.id).run();
          } else {
            await c.env.DB.prepare(`
              UPDATE ai_analysis_queue 
              SET status = 'pending', retry_count = ?, 
                  scheduled_for = datetime('now', '+' || (retry_count * 5) || ' minutes')
              WHERE id = ?
            `).bind(newRetryCount, item.id).run();
          }
        }
      }

      return c.json({
        success: true,
        data: { processed },
        message: `Processed ${processed} analyses successfully`
      });
    } catch (error) {
      console.error('Process queue error:', error);
      return c.json({
        success: false,
        error: 'Failed to process analysis queue'
      }, 500);
    }
  });

  // ====================
  // CONFIGURATION MANAGEMENT
  // ====================

  // Get AI GRC configuration
  app.get('/ai-config', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const configs = await c.env.DB.prepare(`
        SELECT * FROM ai_grc_config 
        WHERE is_active = 1
        ORDER BY config_type, config_name
      `).all();

      const result = {};
      for (const config of (configs.results || [])) {
        if (!result[config.config_type]) {
          result[config.config_type] = {};
        }
        result[config.config_type][config.config_name] = JSON.parse(config.config_value);
      }

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get AI config error:', error);
      return c.json({
        success: false,
        error: 'Failed to load AI configuration'
      }, 500);
    }
  });

  // Update AI GRC configuration
  app.put('/ai-config/:configType/:configName', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const configType = c.req.param('configType');
      const configName = c.req.param('configName');
      const { config_value } = await c.req.json();
      const user = c.get('user');

      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO ai_grc_config 
        (config_type, config_name, config_value, created_by, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(configType, configName, JSON.stringify(config_value), user.id).run();

      return c.json({
        success: true,
        message: 'AI configuration updated successfully'
      });
    } catch (error) {
      console.error('Update AI config error:', error);
      return c.json({
        success: false,
        error: 'Failed to update AI configuration'
      }, 500);
    }
  });

  return app;
}