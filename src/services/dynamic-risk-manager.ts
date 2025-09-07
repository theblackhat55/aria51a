/**
 * Dynamic Risk Manager Service
 * Handles threat intelligence-driven risk lifecycle management
 * Enhances existing risk management with TI capabilities
 */

export interface ThreatIntelligenceData {
  source: string;
  sourceType: 'osint' | 'premium' | 'internal';
  indicatorType: 'cve' | 'ioc' | 'ttp' | 'campaign';
  indicatorValue: string;
  confidence: number;
  data: any;
  firstSeen?: Date;
  metadata?: any;
}

export interface DynamicRisk {
  id: number;
  title: string;
  description: string;
  category: string;
  sourceType: 'manual' | 'Dynamic-TI';
  dynamicState: DynamicRiskState | null;
  confidenceScore: number;
  threatIntelSources: TISource[];
  frameworkMappings: FrameworkMapping[];
  tiEnrichmentSummary?: string;
  riskScore: number;
  probability: number;
  impact: number;
  status: string;
}

export enum DynamicRiskState {
  DETECTED = 'detected',      // TI source identified potential risk
  DRAFT = 'draft',           // Auto-created, pending validation  
  VALIDATED = 'validated',   // Human approved, ready for activation
  ACTIVE = 'active',         // Monitoring and updating dynamically
  RETIRED = 'retired'        // No longer relevant or patched
}

export interface TISource {
  source: string;
  confidence: string;
  first_seen: string;
  [key: string]: any;
}

export interface FrameworkMapping {
  framework: string;
  controls: string[];
}

export interface RiskAssessment {
  shouldCreateRisk: boolean;
  confidence: number;
  autoPromoteToDraft: boolean;
  matchedRules: string[];
  reasoning: string;
  estimatedImpact: number;
  estimatedProbability: number;
}

export interface StateTransition {
  fromState: DynamicRiskState;
  toState: DynamicRiskState;
  trigger: 'automated' | 'manual' | 'scheduled';
  conditions?: string[];
  requiredApproval?: boolean;
}

export class DynamicRiskManager {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Create a dynamic risk from threat intelligence data
   */
  async createDynamicRisk(tiData: ThreatIntelligenceData): Promise<DynamicRisk> {
    try {
      console.log('🎯 Creating dynamic risk from TI data:', tiData.indicatorValue);
      
      // Assess if risk should be created
      const assessment = await this.assessRiskCreation(tiData);
      
      if (!assessment.shouldCreateRisk) {
        throw new Error(`TI data does not meet risk creation criteria: ${assessment.reasoning}`);
      }

      // Generate risk data structure
      const riskData = await this.mapTIToRisk(tiData, assessment);
      
      // Insert risk into database
      const result = await this.db.prepare(`
        INSERT INTO risks (
          title, description, category, owner_id, organization_id, 
          probability, impact, status, review_date, 
          source_type, dynamic_state, confidence_score, 
          threat_intel_sources, framework_mappings, ti_enrichment_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        riskData.title,
        riskData.description,
        riskData.category,
        riskData.ownerId,
        riskData.organizationId,
        riskData.probability,
        riskData.impact,
        'active',
        riskData.reviewDate,
        'Dynamic-TI',
        assessment.autoPromoteToDraft ? DynamicRiskState.DRAFT : DynamicRiskState.DETECTED,
        assessment.confidence,
        JSON.stringify([{
          source: tiData.source,
          confidence: this.confidenceToLevel(assessment.confidence),
          first_seen: tiData.firstSeen?.toISOString() || new Date().toISOString(),
          indicator_type: tiData.indicatorType,
          indicator_value: tiData.indicatorValue
        }]),
        JSON.stringify(riskData.frameworkMappings || []),
        riskData.enrichmentSummary
      ).run();

      const riskId = result.meta.last_row_id as number;

      // Insert TI source attribution
      await this.insertTISourceAttribution(riskId, tiData, assessment.confidence);

      // Log state transition
      await this.logStateTransition(
        riskId,
        null,
        assessment.autoPromoteToDraft ? DynamicRiskState.DRAFT : DynamicRiskState.DETECTED,
        'Auto-created from TI source',
        true,
        assessment.confidence
      );

      // Insert framework mappings
      if (riskData.frameworkMappings) {
        await this.insertFrameworkMappings(riskId, riskData.frameworkMappings);
      }

      console.log('✅ Dynamic risk created successfully:', riskId);

      // Return created risk
      return await this.getRiskById(riskId);

    } catch (error) {
      console.error('❌ Error creating dynamic risk:', error);
      throw error;
    }
  }

  /**
   * Transition risk between states
   */
  async transitionRiskState(
    riskId: number, 
    toState: DynamicRiskState, 
    reason: string,
    automated = false,
    userId?: number
  ): Promise<void> {
    try {
      const risk = await this.getRiskById(riskId);
      if (!risk) {
        throw new Error(`Risk ${riskId} not found`);
      }

      const fromState = risk.dynamicState;
      
      // Validate transition
      if (!this.isValidTransition(fromState, toState)) {
        throw new Error(`Invalid state transition from ${fromState} to ${toState}`);
      }

      // Update risk state
      await this.db.prepare(`
        UPDATE risks 
        SET dynamic_state = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(toState, riskId).run();

      // Log state transition
      await this.logStateTransition(riskId, fromState, toState, reason, automated, 0, userId);

      console.log(`✅ Risk ${riskId} transitioned from ${fromState} to ${toState}`);

    } catch (error) {
      console.error('❌ Error transitioning risk state:', error);
      throw error;
    }
  }

  /**
   * Get dynamic risks with filtering
   */
  async getDynamicRisks(filters?: {
    state?: DynamicRiskState;
    source?: string;
    confidence?: number;
    limit?: number;
  }): Promise<DynamicRisk[]> {
    try {
      let query = `
        SELECT 
          r.*,
          u.first_name || ' ' || u.last_name as owner_name
        FROM risks r
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.source_type = 'Dynamic-TI'
      `;
      
      const params: any[] = [];
      
      if (filters?.state) {
        query += ' AND r.dynamic_state = ?';
        params.push(filters.state);
      }
      
      if (filters?.confidence) {
        query += ' AND r.confidence_score >= ?';
        params.push(filters.confidence);
      }

      query += ' ORDER BY r.confidence_score DESC, r.created_at DESC';
      
      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const result = await this.db.prepare(query).bind(...params).all();
      
      return (result.results || []).map(row => this.mapRowToDynamicRisk(row));

    } catch (error) {
      console.error('❌ Error fetching dynamic risks:', error);
      return [];
    }
  }

  /**
   * Get risk pipeline statistics
   */
  async getRiskPipelineStats(): Promise<{
    detected: number;
    draft: number;
    validated: number;
    active: number;
    retired: number;
    total: number;
  }> {
    try {
      const result = await this.db.prepare(`
        SELECT 
          dynamic_state,
          COUNT(*) as count
        FROM risks 
        WHERE source_type = 'Dynamic-TI'
        GROUP BY dynamic_state
      `).all();

      const stats = {
        detected: 0,
        draft: 0,
        validated: 0,
        active: 0,
        retired: 0,
        total: 0
      };

      (result.results || []).forEach((row: any) => {
        if (row.dynamic_state && stats.hasOwnProperty(row.dynamic_state)) {
          stats[row.dynamic_state as keyof typeof stats] = row.count;
        }
        stats.total += row.count;
      });

      return stats;

    } catch (error) {
      console.error('❌ Error fetching pipeline stats:', error);
      return { detected: 0, draft: 0, validated: 0, active: 0, retired: 0, total: 0 };
    }
  }

  /**
   * Process detected threats for auto-promotion
   */
  async processDetectedThreats(): Promise<void> {
    try {
      const detectedRisks = await this.getDynamicRisks({ 
        state: DynamicRiskState.DETECTED,
        limit: 50 
      });

      console.log(`🔍 Processing ${detectedRisks.length} detected threats`);

      for (const risk of detectedRisks) {
        if (await this.shouldPromoteToDraft(risk)) {
          await this.transitionRiskState(
            risk.id,
            DynamicRiskState.DRAFT,
            'Auto-promotion based on confidence and rules',
            true
          );
        }
      }

    } catch (error) {
      console.error('❌ Error processing detected threats:', error);
    }
  }

  // Private helper methods

  private async assessRiskCreation(tiData: ThreatIntelligenceData): Promise<RiskAssessment> {
    // Get risk creation rules
    const rules = await this.getRiskCreationRules();
    
    let maxConfidence = 0;
    let shouldCreate = false;
    let autoPromote = false;
    const matchedRules: string[] = [];

    for (const rule of rules) {
      if (await this.evaluateRule(rule, tiData)) {
        matchedRules.push(rule.rule_name);
        maxConfidence = Math.max(maxConfidence, rule.confidence_threshold);
        shouldCreate = true;
        if (rule.auto_promote_to_draft) autoPromote = true;
      }
    }

    // Default assessment for unmatched data
    if (!shouldCreate && tiData.confidence >= 0.6) {
      shouldCreate = true;
      maxConfidence = tiData.confidence;
      matchedRules.push('Default confidence threshold');
    }

    return {
      shouldCreateRisk: shouldCreate,
      confidence: maxConfidence,
      autoPromoteToDraft: autoPromote,
      matchedRules,
      reasoning: this.generateAssessmentReasoning(matchedRules, tiData),
      estimatedImpact: this.estimateImpact(tiData),
      estimatedProbability: this.estimateProbability(tiData)
    };
  }

  private async mapTIToRisk(tiData: ThreatIntelligenceData, assessment: RiskAssessment): Promise<any> {
    const title = this.generateRiskTitle(tiData);
    const description = this.generateRiskDescription(tiData);
    const frameworkMappings = await this.generateFrameworkMappings(tiData);
    const enrichmentSummary = await this.generateEnrichmentSummary(tiData);

    return {
      title,
      description,
      category: 'cybersecurity',
      ownerId: 2, // Default to security manager
      organizationId: 1,
      probability: assessment.estimatedProbability,
      impact: assessment.estimatedImpact,
      reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      frameworkMappings,
      enrichmentSummary
    };
  }

  private async insertTISourceAttribution(riskId: number, tiData: ThreatIntelligenceData, confidence: number): Promise<void> {
    await this.db.prepare(`
      INSERT INTO ti_risk_sources (
        risk_id, source_name, source_type, indicator_type, indicator_value,
        confidence_level, data_payload, risk_score_contribution
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      riskId,
      tiData.source,
      tiData.sourceType,
      tiData.indicatorType,
      tiData.indicatorValue,
      this.confidenceToLevel(confidence),
      JSON.stringify(tiData.data),
      this.calculateRiskContribution(confidence, tiData)
    ).run();
  }

  private async logStateTransition(
    riskId: number,
    fromState: DynamicRiskState | null,
    toState: DynamicRiskState,
    reason: string,
    automated: boolean,
    confidenceChange: number,
    userId?: number
  ): Promise<void> {
    await this.db.prepare(`
      INSERT INTO dynamic_risk_states (
        risk_id, previous_state, current_state, transition_reason,
        automated, confidence_change, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      riskId,
      fromState,
      toState,
      reason,
      automated,
      confidenceChange,
      userId || null
    ).run();
  }

  private async insertFrameworkMappings(riskId: number, mappings: FrameworkMapping[]): Promise<void> {
    for (const mapping of mappings) {
      for (const control of mapping.controls) {
        await this.db.prepare(`
          INSERT INTO ti_framework_mappings (
            risk_id, framework_name, control_id, mapping_confidence, automated, rationale
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          riskId,
          mapping.framework,
          control,
          0.85, // Default confidence
          true,
          `Auto-mapped based on ${mapping.framework} framework analysis`
        ).run();
      }
    }
  }

  private async getRiskById(riskId: number): Promise<DynamicRisk> {
    const result = await this.db.prepare(`
      SELECT r.*, u.first_name || ' ' || u.last_name as owner_name
      FROM risks r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.id = ?
    `).bind(riskId).first();

    if (!result) {
      throw new Error(`Risk ${riskId} not found`);
    }

    return this.mapRowToDynamicRisk(result);
  }

  private mapRowToDynamicRisk(row: any): DynamicRisk {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      sourceType: row.source_type,
      dynamicState: row.dynamic_state,
      confidenceScore: row.confidence_score || 0,
      threatIntelSources: JSON.parse(row.threat_intel_sources || '[]'),
      frameworkMappings: JSON.parse(row.framework_mappings || '[]'),
      tiEnrichmentSummary: row.ti_enrichment_summary,
      riskScore: row.risk_score,
      probability: row.probability,
      impact: row.impact,
      status: row.status
    };
  }

  private async getRiskCreationRules(): Promise<any[]> {
    const result = await this.db.prepare(`
      SELECT * FROM ti_risk_creation_rules WHERE is_active = 1
    `).all();
    
    return result.results || [];
  }

  private async evaluateRule(rule: any, tiData: ThreatIntelligenceData): Promise<boolean> {
    try {
      const conditions = JSON.parse(rule.conditions);
      
      // Simple condition evaluation (can be enhanced)
      if (conditions.source && conditions.source !== tiData.source) {
        return false;
      }
      
      if (conditions.epss_score && tiData.data.epss_score) {
        const threshold = conditions.epss_score['>='];
        if (threshold && tiData.data.epss_score < threshold) {
          return false;
        }
      }
      
      if (conditions.cvss_score && tiData.data.cvss_score) {
        const threshold = conditions.cvss_score['>='];
        if (threshold && tiData.data.cvss_score < threshold) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return false;
    }
  }

  private generateRiskTitle(tiData: ThreatIntelligenceData): string {
    switch (tiData.indicatorType) {
      case 'cve':
        return `${tiData.indicatorValue} - ${tiData.data.shortDescription || 'Security Vulnerability'}`;
      case 'ioc':
        return `IOC Detection: ${tiData.data.malware_family || 'Malicious Activity'} Campaign`;
      case 'ttp':
        return `TTP Alert: ${tiData.data.technique_name || 'Adversary Technique'} Detected`;
      case 'campaign':
        return `Campaign Activity: ${tiData.data.campaign_name || 'Threat Campaign'}`;
      default:
        return `TI Alert: ${tiData.indicatorValue}`;
    }
  }

  private generateRiskDescription(tiData: ThreatIntelligenceData): string {
    const baseDesc = `Threat intelligence indicator detected from ${tiData.source}.`;
    const details = tiData.data.description || tiData.data.shortDescription || 'No additional details available.';
    return `${baseDesc} ${details}`;
  }

  private async generateFrameworkMappings(tiData: ThreatIntelligenceData): Promise<FrameworkMapping[]> {
    const mappings: FrameworkMapping[] = [];

    // Basic NIST CSF mappings based on indicator type
    if (tiData.indicatorType === 'cve') {
      mappings.push({
        framework: 'NIST_CSF',
        controls: ['PR.IP-12', 'DE.CM-8', 'RS.MI-3']
      });
      mappings.push({
        framework: 'MITRE_ATT&CK',
        controls: ['T1190', 'T1059']
      });
    }

    if (tiData.indicatorType === 'ioc') {
      mappings.push({
        framework: 'NIST_CSF',
        controls: ['PR.PT-1', 'DE.CM-4', 'RS.AN-1']
      });
    }

    return mappings;
  }

  private async generateEnrichmentSummary(tiData: ThreatIntelligenceData): Promise<string> {
    // Generate AI-enhanced summary (placeholder for now)
    return `Threat intelligence from ${tiData.source} indicates ${tiData.indicatorType} activity with ${this.confidenceToLevel(tiData.confidence)} confidence. Immediate assessment and response recommended.`;
  }

  private confidenceToLevel(confidence: number): string {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  private calculateRiskContribution(confidence: number, tiData: ThreatIntelligenceData): number {
    return confidence * 20; // Base contribution scaled by confidence
  }

  private estimateImpact(tiData: ThreatIntelligenceData): number {
    if (tiData.indicatorType === 'cve' && tiData.data.cvss_score >= 9.0) return 5;
    if (tiData.indicatorType === 'campaign' && tiData.data.ransomware_use === 'yes') return 5;
    if (tiData.confidence >= 0.9) return 4;
    if (tiData.confidence >= 0.7) return 3;
    return 2;
  }

  private estimateProbability(tiData: ThreatIntelligenceData): number {
    if (tiData.data.exploitation_status === 'active') return 5;
    if (tiData.data.epss_score >= 0.8) return 4;
    if (tiData.confidence >= 0.8) return 3;
    return 2;
  }

  private generateAssessmentReasoning(matchedRules: string[], tiData: ThreatIntelligenceData): string {
    if (matchedRules.length === 0) {
      return 'No specific rules matched, using default confidence threshold';
    }
    return `Matched rules: ${matchedRules.join(', ')}. Source: ${tiData.source}, Type: ${tiData.indicatorType}`;
  }

  private isValidTransition(fromState: DynamicRiskState | null, toState: DynamicRiskState): boolean {
    const validTransitions: { [key: string]: DynamicRiskState[] } = {
      'null': [DynamicRiskState.DETECTED, DynamicRiskState.DRAFT],
      [DynamicRiskState.DETECTED]: [DynamicRiskState.DRAFT, DynamicRiskState.RETIRED],
      [DynamicRiskState.DRAFT]: [DynamicRiskState.VALIDATED, DynamicRiskState.RETIRED],
      [DynamicRiskState.VALIDATED]: [DynamicRiskState.ACTIVE, DynamicRiskState.RETIRED],
      [DynamicRiskState.ACTIVE]: [DynamicRiskState.RETIRED],
      [DynamicRiskState.RETIRED]: [] // No transitions from retired
    };

    const key = fromState || 'null';
    return validTransitions[key]?.includes(toState) || false;
  }

  private async shouldPromoteToDraft(risk: DynamicRisk): boolean {
    // Auto-promote if confidence is high enough
    if (risk.confidenceScore >= 0.8) return true;
    
    // Check if from high-confidence source
    const highConfidenceSources = ['cisa-kev', 'nvd', 'mandiant'];
    const hasHighConfidenceSource = risk.threatIntelSources.some(
      source => highConfidenceSources.includes(source.source)
    );
    
    return hasHighConfidenceSource && risk.confidenceScore >= 0.7;
  }
}