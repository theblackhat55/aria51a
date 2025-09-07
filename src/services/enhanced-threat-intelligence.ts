/**
 * Enhanced Threat Intelligence Service
 * 
 * Builds upon existing ThreatIntelligenceService to add:
 * - Dynamic risk creation from IOCs and campaigns
 * - TI-to-GRC integration capabilities  
 * - Risk lifecycle management
 * - AI-driven threat analysis
 * 
 * Phase 1: TI-Risk Integration Implementation
 */

import { D1Database } from '@cloudflare/workers-types';
import { ThreatIntelligenceService, ThreatIndicator } from './threat-intelligence';

export interface DynamicRisk {
  id: number;
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  source_type: 'ti_automated' | 'manual';
  dynamic_state: 'detected' | 'draft' | 'validated' | 'active' | 'retired';
  confidence_score: number;
  source_iocs: string[];
  source_campaigns: string[];
  ti_enrichment_summary?: string;
  created_from_ti: boolean;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskCreationRule {
  id: number;
  rule_name: string;
  description?: string;
  conditions: any;
  confidence_threshold: number;
  auto_promote_to_draft: boolean;
  target_category: string;
  target_impact: number;
  target_probability: number;
  enabled: boolean;
  priority: number;
}

export interface TIProcessingResult {
  processed_iocs: number;
  risks_created: number;
  risks_updated: number;
  rules_matched: string[];
  processing_time_ms: number;
  errors: string[];
}

export interface TIPipelineStats {
  total_risks_created: number;
  detected: number;
  draft: number;
  validated: number;
  active: number;
  retired: number;
  high_confidence_pending: number;
  processing_rate_24h: number;
}

export class EnhancedThreatIntelligenceService {
  private threatIntelService: ThreatIntelligenceService;

  constructor(private db: D1Database) {
    this.threatIntelService = new ThreatIntelligenceService(db);
  }

  /**
   * PHASE 1 CORE: Process IOCs for automated risk creation
   * 
   * This is the main integration point between TI and GRC
   */
  async processIOCsForRiskCreation(): Promise<TIProcessingResult> {
    const startTime = Date.now();
    const result: TIProcessingResult = {
      processed_iocs: 0,
      risks_created: 0,
      risks_updated: 0,
      rules_matched: [],
      processing_time_ms: 0,
      errors: []
    };

    try {
      console.log('🚀 Starting TI-Risk processing pipeline...');

      // Get IOCs eligible for risk creation
      const eligibleIOCs = await this.getIOCsEligibleForRiskCreation();
      console.log(`📊 Found ${eligibleIOCs.length} IOCs eligible for risk processing`);

      // Get active risk creation rules
      const rules = await this.getRiskCreationRules();
      console.log(`📋 Using ${rules.length} active risk creation rules`);

      // Process each eligible IOC
      for (const ioc of eligibleIOCs) {
        try {
          const ruleEvaluation = await this.evaluateRiskCreationRules(ioc, rules);
          
          if (ruleEvaluation.create) {
            console.log(`✅ Creating risk from IOC ${ioc.value} (${ruleEvaluation.matchedRules.join(', ')})`);
            
            const riskData = await this.mapIOCToRiskData(ioc, ruleEvaluation);
            const riskId = await this.createRiskFromTI(riskData, ruleEvaluation.autoPromote);
            
            // Link IOC to created risk
            await this.linkIOCToRisk(ioc.id, riskId, ruleEvaluation.confidence);
            
            // Log initial risk state
            await this.logRiskStateTransition(
              riskId,
              null,
              ruleEvaluation.autoPromote ? 'draft' : 'detected',
              `Auto-created from IOC ${ioc.value} using rules: ${ruleEvaluation.matchedRules.join(', ')}`,
              true,
              ruleEvaluation.confidence,
              ioc.id
            );

            result.risks_created++;
            result.rules_matched.push(...ruleEvaluation.matchedRules);

            // Log processing activity
            await this.logProcessingActivity(
              'risk_creation',
              ioc.id.toString(),
              'ioc',
              'created',
              {
                risk_id: riskId,
                rules_matched: ruleEvaluation.matchedRules,
                confidence: ruleEvaluation.confidence,
                auto_promoted: ruleEvaluation.autoPromote
              },
              true
            );

          } else {
            console.log(`⏭️  Skipping IOC ${ioc.value} - no rules matched`);
          }

          result.processed_iocs++;

        } catch (iocError) {
          console.error(`❌ Error processing IOC ${ioc.id}:`, iocError);
          result.errors.push(`IOC ${ioc.id}: ${iocError.message}`);
          
          await this.logProcessingActivity(
            'risk_creation',
            ioc.id.toString(),
            'ioc',
            'failed',
            { error: iocError.message },
            false,
            iocError.message
          );
        }
      }

      // Update campaigns with associated risks
      await this.updateCampaignRiskAssociations();

      result.processing_time_ms = Date.now() - startTime;
      console.log(`✅ TI-Risk processing completed in ${result.processing_time_ms}ms`);
      console.log(`📈 Results: ${result.risks_created} risks created from ${result.processed_iocs} IOCs`);

      return result;

    } catch (error) {
      result.processing_time_ms = Date.now() - startTime;
      result.errors.push(`System error: ${error.message}`);
      console.error('❌ TI-Risk processing pipeline failed:', error);
      
      await this.logProcessingActivity(
        'ioc_processing',
        'system',
        'pipeline',
        'failed',
        { error: error.message, processing_time_ms: result.processing_time_ms },
        false,
        error.message
      );

      throw error;
    }
  }

  /**
   * Get IOCs that are eligible for risk creation
   */
  private async getIOCsEligibleForRiskCreation(): Promise<any[]> {
    const result = await this.db.prepare(`
      SELECT 
        i.*,
        tc.name as campaign_name,
        tc.threat_actor,
        tc.status as campaign_status,
        tc.severity as campaign_severity
      FROM iocs i
      LEFT JOIN threat_campaigns tc ON i.campaign_id = tc.id
      WHERE i.is_active = 1
        AND i.risk_id IS NULL
        AND i.auto_risk_created = 0
        AND i.confidence >= 50
        AND i.threat_level IN ('medium', 'high', 'critical')
      ORDER BY 
        CASE i.threat_level 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2  
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        i.confidence DESC,
        i.created_at DESC
    `).all();

    return result.results as any[] || [];
  }

  /**
   * Evaluate IOCs against risk creation rules
   */
  private async evaluateRiskCreationRules(ioc: any, rules: RiskCreationRule[]): Promise<{
    create: boolean;
    autoPromote: boolean;
    matchedRules: string[];
    confidence: number;
  }> {
    const matchedRules: string[] = [];
    let shouldCreate = false;
    let shouldAutoPromote = false;
    let maxConfidence = ioc.confidence / 100;

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const conditions = rule.conditions;
      let ruleMatches = true;

      // Evaluate confidence threshold
      if (conditions.confidence_min && ioc.confidence < conditions.confidence_min) {
        ruleMatches = false;
      }

      if (conditions.confidence_max && ioc.confidence > conditions.confidence_max) {
        ruleMatches = false;
      }

      // Evaluate threat level
      if (conditions.threat_level && !conditions.threat_level.includes(ioc.threat_level)) {
        ruleMatches = false;
      }

      // Evaluate IOC types
      if (conditions.ioc_types && !conditions.ioc_types.includes(ioc.ioc_type)) {
        ruleMatches = false;
      }

      // Evaluate tags (if IOC has tags)
      if (conditions.tags && ioc.tags) {
        try {
          const iocTags = JSON.parse(ioc.tags);
          const hasRequiredTag = conditions.tags.some((tag: string) => 
            iocTags.some((iocTag: string) => 
              iocTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasRequiredTag) ruleMatches = false;
        } catch (e) {
          // Handle case where tags are not valid JSON
          const iocTagsString = ioc.tags.toLowerCase();
          const hasRequiredTag = conditions.tags.some((tag: string) =>
            iocTagsString.includes(tag.toLowerCase())
          );
          if (!hasRequiredTag) ruleMatches = false;
        }
      }

      // Evaluate campaign status (if IOC is part of campaign)
      if (conditions.campaign_status && ioc.campaign_id) {
        if (ioc.campaign_status !== conditions.campaign_status) {
          ruleMatches = false;
        }
      }

      // Evaluate source patterns
      if (conditions.source_patterns && ioc.source) {
        const sourceMatches = conditions.source_patterns.some((pattern: string) =>
          ioc.source.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!sourceMatches) ruleMatches = false;
      }

      // If rule matches, record it
      if (ruleMatches) {
        matchedRules.push(rule.rule_name);
        shouldCreate = true;
        maxConfidence = Math.max(maxConfidence, rule.confidence_threshold);
        
        if (rule.auto_promote_to_draft) {
          shouldAutoPromote = true;
        }
      }
    }

    return {
      create: shouldCreate,
      autoPromote: shouldAutoPromote,
      matchedRules,
      confidence: maxConfidence
    };
  }

  /**
   * Map IOC data to risk structure
   */
  private async mapIOCToRiskData(ioc: any, ruleEvaluation: any): Promise<any> {
    // Generate risk title based on IOC type and context
    const title = this.generateRiskTitle(ioc);
    
    // Generate comprehensive risk description
    const description = this.generateRiskDescription(ioc);

    // Calculate risk probability and impact
    const probability = this.calculateTIProbability(ioc);
    const impact = this.calculateTIImpact(ioc);

    // Determine category based on IOC characteristics
    const category = this.determineRiskCategory(ioc);

    return {
      title,
      description,
      category,
      probability,
      impact,
      source_type: 'ti_automated',
      confidence_score: ruleEvaluation.confidence,
      owner_id: 2, // Default to security manager - would be configurable
      organization_id: 1 // Default organization - would be configurable
    };
  }

  /**
   * Generate risk title based on IOC characteristics
   */
  private generateRiskTitle(ioc: any): string {
    const typeLabels = {
      'ip': 'Malicious IP Address',
      'domain': 'Malicious Domain', 
      'url': 'Malicious URL',
      'hash': 'Malicious File Hash',
      'email': 'Malicious Email Address',
      'registry_key': 'Malicious Registry Key',
      'file_path': 'Malicious File Path'
    };

    const typeLabel = typeLabels[ioc.ioc_type as keyof typeof typeLabels] || 'Threat Indicator';
    const severityLabel = ioc.threat_level.charAt(0).toUpperCase() + ioc.threat_level.slice(1);
    
    if (ioc.campaign_name) {
      return `${severityLabel} ${typeLabel} - ${ioc.campaign_name} Campaign`;
    } else {
      return `${severityLabel} ${typeLabel} Detected`;
    }
  }

  /**
   * Generate comprehensive risk description
   */
  private generateRiskDescription(ioc: any): string {
    let description = `A ${ioc.threat_level} severity threat indicator has been identified through threat intelligence analysis.\n\n`;
    
    description += `**Indicator Details:**\n`;
    description += `• Type: ${ioc.ioc_type.toUpperCase()}\n`;
    description += `• Value: ${ioc.value}\n`;
    description += `• Threat Level: ${ioc.threat_level}\n`;
    description += `• Confidence: ${ioc.confidence}%\n`;
    description += `• Source: ${ioc.source}\n`;
    description += `• First Seen: ${new Date(ioc.first_seen).toLocaleDateString()}\n`;
    
    if (ioc.last_seen && ioc.last_seen !== ioc.first_seen) {
      description += `• Last Seen: ${new Date(ioc.last_seen).toLocaleDateString()}\n`;
    }

    if (ioc.campaign_name) {
      description += `\n**Campaign Information:**\n`;
      description += `• Campaign: ${ioc.campaign_name}\n`;
      if (ioc.threat_actor) {
        description += `• Threat Actor: ${ioc.threat_actor}\n`;
      }
      if (ioc.campaign_severity) {
        description += `• Campaign Severity: ${ioc.campaign_severity}\n`;
      }
    }

    if (ioc.tags) {
      try {
        const tags = JSON.parse(ioc.tags);
        if (tags.length > 0) {
          description += `\n**Tags:** ${tags.join(', ')}\n`;
        }
      } catch (e) {
        description += `\n**Tags:** ${ioc.tags}\n`;
      }
    }

    if (ioc.notes) {
      description += `\n**Additional Notes:**\n${ioc.notes}\n`;
    }

    description += `\n**Recommended Actions:**\n`;
    description += `• Review and validate this threat indicator\n`;
    description += `• Check for any related indicators in your environment\n`;
    description += `• Implement appropriate blocking or monitoring measures\n`;
    description += `• Consider threat hunting for related activity\n`;

    if (ioc.threat_level === 'critical') {
      description += `• **IMMEDIATE ACTION REQUIRED** - This is a critical threat\n`;
    }

    return description;
  }

  /**
   * Calculate risk probability based on TI characteristics
   */
  private calculateTIProbability(ioc: any): number {
    let probability = 2; // Base probability

    // Adjust based on confidence
    if (ioc.confidence >= 95) probability = 5;
    else if (ioc.confidence >= 85) probability = 4;
    else if (ioc.confidence >= 70) probability = 3;
    else if (ioc.confidence >= 50) probability = 2;

    // Adjust based on threat level
    switch (ioc.threat_level) {
      case 'critical':
        probability = Math.min(5, probability + 2);
        break;
      case 'high':
        probability = Math.min(5, probability + 1);
        break;
      case 'medium':
        // No adjustment for medium
        break;
      case 'low':
        probability = Math.max(1, probability - 1);
        break;
    }

    // Increase if part of active campaign
    if (ioc.campaign_id && ioc.campaign_status === 'active') {
      probability = Math.min(5, probability + 1);
    }

    // Increase if recently seen
    if (ioc.last_seen) {
      const lastSeenDate = new Date(ioc.last_seen);
      const daysSinceLastSeen = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastSeen <= 7) {
        probability = Math.min(5, probability + 1);
      }
    }

    return Math.max(1, Math.min(5, probability));
  }

  /**
   * Calculate risk impact based on TI characteristics
   */
  private calculateTIImpact(ioc: any): number {
    let impact = 3; // Base impact for cyber threats

    // Adjust based on threat level
    switch (ioc.threat_level) {
      case 'critical':
        impact = 5;
        break;
      case 'high':
        impact = 4;
        break;
      case 'medium':
        impact = 3;
        break;
      case 'low':
        impact = 2;
        break;
    }

    // Adjust based on IOC type
    switch (ioc.ioc_type) {
      case 'hash': // Malware can have high impact
      case 'url':  // Malicious URLs can be high impact
        impact = Math.min(5, impact + 1);
        break;
      case 'ip':
      case 'domain': // Network indicators
        // Keep base impact
        break;
    }

    // Increase if targeting critical sectors
    if (ioc.tags) {
      try {
        const tags = JSON.parse(ioc.tags);
        const criticalSectorTags = [
          'critical_infrastructure', 'financial', 'healthcare', 
          'government', 'energy', 'transportation', 'water'
        ];
        
        const hasCriticalSectorTag = tags.some((tag: string) =>
          criticalSectorTags.some(criticalTag => 
            tag.toLowerCase().includes(criticalTag.toLowerCase())
          )
        );
        
        if (hasCriticalSectorTag) {
          impact = Math.min(5, impact + 1);
        }
      } catch (e) {
        // Handle non-JSON tags
        const criticalSectorKeywords = [
          'critical', 'financial', 'healthcare', 'government', 'energy'
        ];
        
        if (criticalSectorKeywords.some(keyword => 
          ioc.tags.toLowerCase().includes(keyword)
        )) {
          impact = Math.min(5, impact + 1);
        }
      }
    }

    return Math.max(1, Math.min(5, impact));
  }

  /**
   * Determine risk category based on IOC characteristics
   */
  private determineRiskCategory(ioc: any): string {
    // Map IOC types and contexts to risk categories
    if (ioc.tags) {
      try {
        const tags = JSON.parse(ioc.tags);
        
        if (tags.some((tag: string) => ['financial', 'fraud', 'banking'].includes(tag.toLowerCase()))) {
          return 'financial';
        }
        
        if (tags.some((tag: string) => ['privacy', 'gdpr', 'personal_data'].includes(tag.toLowerCase()))) {
          return 'privacy';
        }
        
        if (tags.some((tag: string) => ['compliance', 'regulatory'].includes(tag.toLowerCase()))) {
          return 'compliance';
        }
      } catch (e) {
        // Handle non-JSON tags
      }
    }

    // Default to cybersecurity for TI-related risks
    return 'cybersecurity';
  }

  /**
   * Create risk in the risks table
   */
  private async createRiskFromTI(riskData: any, autoPromote: boolean = false): Promise<number> {
    // Check if risks table exists and get its schema
    const tableInfo = await this.db.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='risks'
    `).first();

    if (!tableInfo) {
      throw new Error('Risks table not found. Ensure GRC schema is properly initialized.');
    }

    // Insert new risk
    const result = await this.db.prepare(`
      INSERT INTO risks (
        title, description, category, probability, impact, 
        owner_id, organization_id, status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      riskData.title,
      riskData.description,
      riskData.category,
      riskData.probability,
      riskData.impact,
      riskData.owner_id,
      riskData.organization_id,
      'active'
    ).run();

    const riskId = result.meta.last_row_id as number;

    console.log(`✅ Created risk ID ${riskId}: ${riskData.title}`);
    
    return riskId;
  }

  /**
   * Link IOC to created risk
   */
  private async linkIOCToRisk(iocId: number, riskId: number, confidence: number): Promise<void> {
    await this.db.prepare(`
      UPDATE iocs 
      SET risk_id = ?, 
          auto_risk_created = 1,
          risk_creation_confidence = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(riskId, confidence, iocId).run();

    console.log(`🔗 Linked IOC ${iocId} to Risk ${riskId}`);
  }

  /**
   * Log risk state transitions
   */
  private async logRiskStateTransition(
    riskId: number,
    fromState: string | null,
    toState: string,
    reason: string,
    automated: boolean,
    confidenceScore: number,
    sourceIOCId?: number,
    sourceCampaignId?: number,
    userId?: number
  ): Promise<void> {
    await this.db.prepare(`
      INSERT INTO ti_risk_states (
        risk_id, source_ioc_id, source_campaign_id,
        previous_state, current_state, transition_reason,
        automated, confidence_score, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      riskId,
      sourceIOCId || null,
      sourceCampaignId || null,
      fromState,
      toState,
      reason,
      automated,
      confidenceScore,
      userId || null
    ).run();

    console.log(`📝 Logged risk state: Risk ${riskId} → ${toState} (${automated ? 'auto' : 'manual'})`);
  }

  /**
   * Update campaign risk associations
   */
  private async updateCampaignRiskAssociations(): Promise<void> {
    // Get campaigns that have IOCs linked to risks
    const campaignsWithRisks = await this.db.prepare(`
      SELECT 
        tc.id as campaign_id,
        tc.name,
        GROUP_CONCAT(DISTINCT i.risk_id) as risk_ids
      FROM threat_campaigns tc
      JOIN iocs i ON tc.id = i.campaign_id
      WHERE i.risk_id IS NOT NULL
      GROUP BY tc.id, tc.name
    `).all();

    for (const campaign of campaignsWithRisks.results as any[]) {
      const riskIds = campaign.risk_ids.split(',').filter((id: string) => id !== 'null');
      
      await this.db.prepare(`
        UPDATE threat_campaigns 
        SET associated_risks = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(JSON.stringify(riskIds), campaign.campaign_id).run();

      console.log(`🔗 Updated campaign ${campaign.name} with ${riskIds.length} associated risks`);
    }
  }

  /**
   * Get risk creation rules from database
   */
  private async getRiskCreationRules(): Promise<RiskCreationRule[]> {
    const result = await this.db.prepare(`
      SELECT * FROM ti_risk_creation_rules 
      WHERE enabled = 1 
      ORDER BY priority DESC, confidence_threshold DESC
    `).all();

    return (result.results || []).map(row => ({
      id: row.id,
      rule_name: row.rule_name,
      description: row.description,
      conditions: JSON.parse(row.conditions as string),
      confidence_threshold: row.confidence_threshold,
      auto_promote_to_draft: row.auto_promote_to_draft === 1,
      target_category: row.target_category,
      target_impact: row.target_impact,
      target_probability: row.target_probability,
      enabled: row.enabled === 1,
      priority: row.priority
    })) as RiskCreationRule[];
  }

  /**
   * Log processing activity for audit trail
   */
  private async logProcessingActivity(
    processingType: string,
    sourceId: string,
    sourceType: string,
    action: string,
    details: any,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const processingTimeMs = details.processing_time_ms || 0;
    
    await this.db.prepare(`
      INSERT INTO ti_processing_logs (
        processing_type, source_id, source_type, action,
        details, success, error_message, processing_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      processingType,
      sourceId,
      sourceType,
      action,
      JSON.stringify(details),
      success,
      errorMessage || null,
      processingTimeMs
    ).run();
  }

  // PHASE 1 PUBLIC API METHODS

  /**
   * Get TI-generated dynamic risks with their current states
   */
  async getTIDynamicRisks(filters?: {
    state?: string;
    confidence?: number;
    limit?: number;
  }): Promise<DynamicRisk[]> {
    let sql = `
      SELECT 
        r.*,
        trs.current_state as dynamic_state,
        trs.confidence_score,
        trs.created_at as state_created_at,
        GROUP_CONCAT(DISTINCT i.value, '||' || i.ioc_type) as source_iocs_data,
        u.first_name || ' ' || u.last_name as owner_name
      FROM risks r
      LEFT JOIN ti_risk_states trs ON r.id = trs.risk_id
      LEFT JOIN iocs i ON r.id = i.risk_id  
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM iocs WHERE risk_id = r.id AND auto_risk_created = 1
      )
    `;

    const params: any[] = [];

    if (filters?.state) {
      sql += ' AND trs.current_state = ?';
      params.push(filters.state);
    }

    if (filters?.confidence) {
      sql += ' AND trs.confidence_score >= ?';
      params.push(filters.confidence);
    }

    sql += ' GROUP BY r.id ORDER BY r.created_at DESC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const result = await this.db.prepare(sql).bind(...params).all();

    return (result.results || []).map(row => {
      const sourceIOCs: string[] = [];
      if (row.source_iocs_data) {
        sourceIOCs.push(...(row.source_iocs_data as string).split(',').map((data: string) => {
          const [value, type] = data.split('||');
          return `${value} (${type})`;
        }));
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        probability: row.probability,
        impact: row.impact,
        source_type: 'ti_automated',
        dynamic_state: row.dynamic_state || 'detected',
        confidence_score: row.confidence_score || 0,
        source_iocs: sourceIOCs,
        source_campaigns: [], // Would be populated from campaign associations
        ti_enrichment_summary: '', // Would be populated by AI analysis
        created_from_ti: true,
        owner_name: row.owner_name,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    }) as DynamicRisk[];
  }

  /**
   * Get TI pipeline statistics
   */
  async getTIPipelineStats(): Promise<TIPipelineStats> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(DISTINCT r.id) as total_risks_created,
        COUNT(CASE WHEN trs.current_state = 'detected' THEN 1 END) as detected,
        COUNT(CASE WHEN trs.current_state = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN trs.current_state = 'validated' THEN 1 END) as validated,
        COUNT(CASE WHEN trs.current_state = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN trs.current_state = 'retired' THEN 1 END) as retired
      FROM risks r
      JOIN ti_risk_states trs ON r.id = trs.risk_id
      WHERE EXISTS (
        SELECT 1 FROM iocs WHERE risk_id = r.id AND auto_risk_created = 1
      )
    `).first();

    // Get high confidence IOCs pending processing
    const pendingResult = await this.db.prepare(`
      SELECT COUNT(*) as high_confidence_pending
      FROM iocs 
      WHERE is_active = 1 
        AND risk_id IS NULL 
        AND confidence >= 80 
        AND threat_level IN ('critical', 'high')
    `).first();

    // Get 24h processing rate
    const processingResult = await this.db.prepare(`
      SELECT COUNT(*) as processing_rate_24h
      FROM ti_processing_logs
      WHERE processing_type = 'risk_creation'
        AND action = 'created'
        AND created_at >= datetime('now', '-1 day')
    `).first();

    return {
      total_risks_created: (result?.total_risks_created as number) || 0,
      detected: (result?.detected as number) || 0,
      draft: (result?.draft as number) || 0,
      validated: (result?.validated as number) || 0,
      active: (result?.active as number) || 0,
      retired: (result?.retired as number) || 0,
      high_confidence_pending: (pendingResult?.high_confidence_pending as number) || 0,
      processing_rate_24h: (processingResult?.processing_rate_24h as number) || 0
    };
  }

  /**
   * Transition risk state manually
   */
  async transitionRiskState(
    riskId: number,
    toState: 'detected' | 'draft' | 'validated' | 'active' | 'retired',
    reason: string,
    userId?: number
  ): Promise<void> {
    // Get current state
    const currentStateResult = await this.db.prepare(`
      SELECT current_state FROM ti_risk_states 
      WHERE risk_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(riskId).first();

    const fromState = currentStateResult?.current_state || null;

    // Validate transition (simplified - would have more complex rules)
    const validTransitions = {
      'detected': ['draft', 'retired'],
      'draft': ['validated', 'retired'],
      'validated': ['active', 'retired'],
      'active': ['retired'],
      'retired': []
    };

    if (fromState && validTransitions[fromState as keyof typeof validTransitions]) {
      const allowedTransitions = validTransitions[fromState as keyof typeof validTransitions];
      if (!allowedTransitions.includes(toState)) {
        throw new Error(`Invalid transition from ${fromState} to ${toState}`);
      }
    }

    // Log the transition
    await this.logRiskStateTransition(
      riskId,
      fromState as string | null,
      toState,
      reason,
      false, // Not automated
      0, // No confidence change
      undefined, // No source IOC
      undefined, // No source campaign
      userId
    );

    console.log(`🔄 Manual risk state transition: Risk ${riskId} ${fromState} → ${toState}`);
  }

  /**
   * PUBLIC API METHODS
   * These methods provide public access to Enhanced TI functionality
   */

  /**
   * Get Risk Creation Rules (Public API)
   */
  async getRiskCreationRulesPublic(): Promise<RiskCreationRule[]> {
    return this.getRiskCreationRules();
  }

  /**
   * Get TI Risk Summary (Public API)
   */
  async getTIRiskSummaryPublic(days: number = 30): Promise<any> {
    const summary = await this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN trs.current_state = 'detected' THEN 1 END) as detected,
        COUNT(CASE WHEN trs.current_state = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN trs.current_state = 'validated' THEN 1 END) as validated,
        COUNT(CASE WHEN trs.current_state = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN trs.current_state = 'retired' THEN 1 END) as retired,
        COUNT(*) as total_ti_risks,
        AVG(CASE WHEN trs.confidence_score IS NOT NULL THEN trs.confidence_score END) as avg_confidence,
        COUNT(CASE WHEN r.created_at >= datetime('now', '-${days} days') THEN 1 END) as created_last_period
      FROM ti_risk_states trs
      INNER JOIN risks r ON trs.risk_id = r.id
      WHERE r.source_type = 'ti_automated'
        AND trs.created_at >= datetime('now', '-${days} days')
    `).first();

    return {
      period_days: days,
      risk_states: {
        detected: (summary?.detected as number) || 0,
        draft: (summary?.draft as number) || 0,
        validated: (summary?.validated as number) || 0,
        active: (summary?.active as number) || 0,
        retired: (summary?.retired as number) || 0
      },
      total_ti_risks: (summary?.total_ti_risks as number) || 0,
      average_confidence: Math.round(((summary?.avg_confidence as number) || 0) * 100) / 100,
      created_last_period: (summary?.created_last_period as number) || 0,
      generated_at: new Date().toISOString()
    };
  }
}