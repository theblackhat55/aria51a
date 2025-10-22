/**
 * ARIA5 TI Enhancement - Phase 2: TI Data Ingestion Pipeline
 * 
 * Orchestrates real-time threat intelligence processing by:
 * 1. Coordinating feed connector synchronization
 * 2. Converting TI indicators to risk assessment data
 * 3. Integrating with Dynamic Risk Manager for automated risk creation
 * 4. Providing pipeline monitoring and statistics
 */

import { ConnectorFactory, ConnectorResult } from './feed-connectors/connector-factory';
import { DynamicRiskManager, ThreatIntelligenceData, DynamicRiskState } from './dynamic-risk-manager';
import { ThreatIndicator } from './feed-connectors/base-connector';

export interface TIProcessingResult {
  connectorResults: Map<string, ConnectorResult>;
  indicatorsProcessed: number;
  risksCreated: number;
  risksUpdated: number;
  errors: string[];
  processingTimeMs: number;
  timestamp: Date;
}

export interface TIProcessingStats {
  totalIndicators: number;
  newIndicators: number;
  updatedIndicators: number;
  risksCreated: number;
  risksBySource: { [source: string]: number };
  risksByState: { [state: string]: number };
  averageConfidence: number;
  processingDuration: number;
}

export interface RiskCreationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    sources?: string[];
    indicatorTypes?: string[];
    confidenceMin?: number;
    severityMin?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    customConditions?: { [key: string]: any };
  };
  actions: {
    createRisk: boolean;
    autoPromoteToDraft: boolean;
    assignPriority?: 'low' | 'medium' | 'high' | 'critical';
    notifyUsers?: number[];
  };
  enabled: boolean;
}

export class TIIngestionPipeline {
  private connectorFactory: ConnectorFactory;
  private dynamicRiskManager: DynamicRiskManager;
  private db: D1Database;
  private isProcessing: boolean = false;
  private lastProcessingTime?: Date;
  private processingHistory: TIProcessingResult[] = [];
  private maxHistorySize = 50;

  constructor(connectorFactory: ConnectorFactory, dynamicRiskManager: DynamicRiskManager, db: D1Database) {
    this.connectorFactory = connectorFactory;
    this.dynamicRiskManager = dynamicRiskManager;
    this.db = db;
  }

  /**
   * Execute full TI ingestion pipeline
   * 1. Synchronize all enabled feeds
   * 2. Process indicators and assess for risk creation
   * 3. Create/update risks through Dynamic Risk Manager
   * 4. Return comprehensive processing results
   */
  async executeFullPipeline(): Promise<TIProcessingResult> {
    if (this.isProcessing) {
      throw new Error('TI ingestion pipeline is already running');
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let totalIndicatorsProcessed = 0;
    let totalRisksCreated = 0;
    let totalRisksUpdated = 0;

    try {
      console.log('🚀 Starting TI Ingestion Pipeline execution...');

      // Step 1: Synchronize all feed connectors
      console.log('📡 Synchronizing threat intelligence feeds...');
      const connectorResults = await this.connectorFactory.synchronizeAllFeeds();

      // Step 2: Process indicators from all successful feeds
      console.log('🔄 Processing threat indicators...');
      
      for (const [connectorId, result] of connectorResults) {
        if (!result.success) {
          errors.push(`Feed ${connectorId} synchronization failed: ${result.errors.join(', ')}`);
          continue;
        }

        try {
          // Get the actual indicators from the connector
          const indicators = await this.getIndicatorsFromConnector(connectorId);
          
          if (indicators && indicators.length > 0) {
            console.log(`Processing ${indicators.length} indicators from ${connectorId}...`);
            
            const processingResult = await this.processIndicators(connectorId, indicators);
            
            totalIndicatorsProcessed += processingResult.indicatorsProcessed;
            totalRisksCreated += processingResult.risksCreated;
            totalRisksUpdated += processingResult.risksUpdated;
            
            if (processingResult.errors.length > 0) {
              errors.push(...processingResult.errors);
            }
          }
          
        } catch (error) {
          const errorMsg = `Error processing indicators from ${connectorId}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Step 3: Update pipeline statistics
      await this.updatePipelineStats({
        totalIndicators: totalIndicatorsProcessed,
        risksCreated: totalRisksCreated,
        risksUpdated: totalRisksUpdated,
        errors: errors.length
      });

      const processingTime = Date.now() - startTime;
      
      const result: TIProcessingResult = {
        connectorResults,
        indicatorsProcessed: totalIndicatorsProcessed,
        risksCreated: totalRisksCreated,
        risksUpdated: totalRisksUpdated,
        errors,
        processingTimeMs: processingTime,
        timestamp: new Date()
      };

      // Store in processing history
      this.addToProcessingHistory(result);
      this.lastProcessingTime = new Date();

      console.log(`✅ TI Pipeline completed: ${totalIndicatorsProcessed} indicators processed, ${totalRisksCreated} risks created in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      const errorMsg = `TI Pipeline execution failed: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      return {
        connectorResults: new Map(),
        indicatorsProcessed: 0,
        risksCreated: 0,
        risksUpdated: 0,
        errors,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date()
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process threat indicators and create/update risks based on rules
   */
  private async processIndicators(
    connectorId: string, 
    indicators: ThreatIndicator[]
  ): Promise<{ indicatorsProcessed: number; risksCreated: number; risksUpdated: number; errors: string[] }> {
    
    let risksCreated = 0;
    let risksUpdated = 0;
    const errors: string[] = [];

    // Get risk creation rules
    const rules = await this.getRiskCreationRules();

    for (const indicator of indicators) {
      try {
        // Convert indicator to TI data format
        const tiData = this.convertIndicatorToTIData(connectorId, indicator);
        
        // Evaluate against risk creation rules
        const matchedRules = this.evaluateRiskCreationRules(tiData, rules);
        
        if (matchedRules.length > 0) {
          // Check if risk already exists for this indicator
          const existingRisk = await this.findExistingRisk(tiData);
          
          if (existingRisk) {
            // Update existing risk with new TI data
            await this.updateExistingRisk(existingRisk, tiData, matchedRules);
            risksUpdated++;
            
          } else {
            // Create new risk from TI data
            const dynamicRisk = await this.dynamicRiskManager.createDynamicRisk(tiData);
            risksCreated++;
            
            console.log(`✅ Created risk from ${connectorId}: ${dynamicRisk.title} (ID: ${dynamicRisk.id})`);
            
            // Log TI processing record
            await this.logTIProcessingRecord(connectorId, indicator, 'risk_created', dynamicRisk.id);
          }
          
        } else {
          // Log TI processing record for non-qualifying indicators
          await this.logTIProcessingRecord(connectorId, indicator, 'no_risk_created');
        }
        
      } catch (error) {
        const errorMsg = `Error processing indicator ${indicator.id} from ${connectorId}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      indicatorsProcessed: indicators.length,
      risksCreated,
      risksUpdated,
      errors
    };
  }

  /**
   * Convert ThreatIndicator to ThreatIntelligenceData format
   */
  private convertIndicatorToTIData(connectorId: string, indicator: ThreatIndicator): ThreatIntelligenceData {
    return {
      source: connectorId,
      sourceType: this.determineSourceType(connectorId),
      indicatorType: this.mapIndicatorType(indicator.type),
      indicatorValue: indicator.value,
      confidence: indicator.confidence / 100, // Convert to 0-1 scale
      data: {
        ...indicator.raw_data,
        severity: indicator.severity,
        tags: indicator.tags,
        context: indicator.context,
        tlp_marking: indicator.tlp_marking,
        source_reliability: indicator.source_reliability,
        first_seen: indicator.first_seen,
        last_seen: indicator.last_seen
      },
      firstSeen: new Date(indicator.first_seen),
      metadata: {
        connector_id: connectorId,
        indicator_id: indicator.id,
        parsed_at: new Date().toISOString()
      }
    };
  }

  /**
   * Evaluate risk creation rules against TI data
   */
  private evaluateRiskCreationRules(tiData: ThreatIntelligenceData, rules: RiskCreationRule[]): RiskCreationRule[] {
    const matchedRules: RiskCreationRule[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      let matches = true;
      const conditions = rule.conditions;

      // Check source conditions
      if (conditions.sources && !conditions.sources.includes(tiData.source)) {
        matches = false;
      }

      // Check indicator type conditions
      if (conditions.indicatorTypes && !conditions.indicatorTypes.includes(tiData.indicatorType)) {
        matches = false;
      }

      // Check confidence threshold
      if (conditions.confidenceMin && tiData.confidence < conditions.confidenceMin) {
        matches = false;
      }

      // Check severity conditions
      if (conditions.severityMin && tiData.data.severity) {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityLevels[tiData.data.severity] < severityLevels[conditions.severityMin]) {
          matches = false;
        }
      }

      // Check tag conditions
      if (conditions.tags && tiData.data.tags) {
        const hasRequiredTags = conditions.tags.some(tag => 
          tiData.data.tags.includes(tag)
        );
        if (!hasRequiredTags) {
          matches = false;
        }
      }

      // Check custom conditions (e.g., EPSS score, CVSS score)
      if (conditions.customConditions) {
        for (const [field, condition] of Object.entries(conditions.customConditions)) {
          if (condition['>='] && (!tiData.data[field] || tiData.data[field] < condition['>='])) {
            matches = false;
          }
          if (condition['=='] && tiData.data[field] !== condition['==']) {
            matches = false;
          }
        }
      }

      if (matches) {
        matchedRules.push(rule);
      }
    }

    return matchedRules;
  }

  /**
   * Get indicators from a specific connector (placeholder - would integrate with actual connector storage)
   */
  private async getIndicatorsFromConnector(connectorId: string): Promise<ThreatIndicator[]> {
    // This would typically fetch from a TI indicators table or connector cache
    // For now, we'll simulate by triggering a fresh connector sync and getting results
    
    try {
      const connector = this.connectorFactory.getConnector(connectorId);
      if (!connector) {
        console.warn(`Connector ${connectorId} not found`);
        return [];
      }

      // In a real implementation, this would fetch stored indicators
      // For now, we'll return empty array as indicators would be processed during sync
      // The actual integration would happen in the connector's fetchFeed method
      return [];
      
    } catch (error) {
      console.error(`Error getting indicators from ${connectorId}:`, error);
      return [];
    }
  }

  /**
   * Find existing risk for the same TI indicator
   */
  private async findExistingRisk(tiData: ThreatIntelligenceData): Promise<any | null> {
    try {
      const result = await this.db.prepare(`
        SELECT r.* FROM risks r
        JOIN ti_risk_sources trs ON r.id = trs.risk_id
        WHERE trs.indicator_value = ? AND trs.source_name = ?
        LIMIT 1
      `).bind(tiData.indicatorValue, tiData.source).first();

      return result || null;
    } catch (error) {
      console.error('Error finding existing risk:', error);
      return null;
    }
  }

  /**
   * Update existing risk with new TI data
   */
  private async updateExistingRisk(existingRisk: any, tiData: ThreatIntelligenceData, matchedRules: RiskCreationRule[]): Promise<void> {
    try {
      // Update confidence score if new data has higher confidence
      if (tiData.confidence > existingRisk.confidence_score) {
        await this.db.prepare(`
          UPDATE risks 
          SET confidence_score = ?, last_ti_update = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(tiData.confidence, existingRisk.id).run();
      }

      // Add new TI source if not already present
      await this.db.prepare(`
        INSERT OR IGNORE INTO ti_risk_sources (
          risk_id, source_name, source_type, indicator_type, indicator_value,
          confidence_level, data_payload, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        existingRisk.id,
        tiData.source,
        tiData.sourceType,
        tiData.indicatorType,
        tiData.indicatorValue,
        this.confidenceToLevel(tiData.confidence),
        JSON.stringify(tiData.data)
      ).run();

      console.log(`🔄 Updated existing risk ${existingRisk.id} with new TI data from ${tiData.source}`);
      
    } catch (error) {
      console.error('Error updating existing risk:', error);
      throw error;
    }
  }

  /**
   * Log TI processing record for audit and monitoring
   */
  private async logTIProcessingRecord(
    connectorId: string, 
    indicator: ThreatIndicator, 
    outcome: string,
    riskId?: number
  ): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ti_processing_logs (
          connector_id, indicator_id, indicator_type, indicator_value,
          outcome, risk_id, confidence_score, processing_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        connectorId,
        indicator.id,
        indicator.type,
        indicator.value,
        outcome,
        riskId || null,
        indicator.confidence
      ).run();
      
    } catch (error) {
      console.error('Error logging TI processing record:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get risk creation rules from database
   */
  private async getRiskCreationRules(): Promise<RiskCreationRule[]> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM ti_risk_creation_rules WHERE enabled = 1
        ORDER BY priority DESC
      `).all();

      return (result.results || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        conditions: JSON.parse(row.conditions),
        actions: JSON.parse(row.actions),
        enabled: row.enabled === 1
      }));
      
    } catch (error) {
      console.error('Error getting risk creation rules:', error);
      
      // Return default rules if database fails
      return this.getDefaultRiskCreationRules();
    }
  }

  /**
   * Default risk creation rules (fallback)
   */
  private getDefaultRiskCreationRules(): RiskCreationRule[] {
    return [
      {
        id: 'cisa-kev-auto',
        name: 'CISA KEV Auto-Create',
        description: 'Automatically create risks for all CISA KEV vulnerabilities',
        conditions: {
          sources: ['cisa-kev']
        },
        actions: {
          createRisk: true,
          autoPromoteToDraft: true,
          assignPriority: 'critical'
        },
        enabled: true
      },
      {
        id: 'high-confidence-cve',
        name: 'High Confidence CVE',
        description: 'Create risks for CVEs with high confidence and CVSS >= 8.0',
        conditions: {
          indicatorTypes: ['cve'],
          confidenceMin: 0.8,
          customConditions: {
            'cvss_score': { '>=': 8.0 }
          }
        },
        actions: {
          createRisk: true,
          autoPromoteToDraft: false,
          assignPriority: 'high'
        },
        enabled: true
      },
      {
        id: 'active-exploitation',
        name: 'Active Exploitation',
        description: 'Create risks for actively exploited vulnerabilities',
        conditions: {
          tags: ['active-exploitation', 'known-exploited'],
          confidenceMin: 0.7
        },
        actions: {
          createRisk: true,
          autoPromoteToDraft: true,
          assignPriority: 'critical'
        },
        enabled: true
      }
    ];
  }

  /**
   * Update pipeline processing statistics
   */
  private async updatePipelineStats(stats: any): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO ti_pipeline_stats (
          date, total_indicators, risks_created, risks_updated, 
          errors_count, last_updated
        ) VALUES (DATE('now'), ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        stats.totalIndicators,
        stats.risksCreated,
        stats.risksUpdated,
        stats.errors
      ).run();
      
    } catch (error) {
      console.error('Error updating pipeline stats:', error);
    }
  }

  /**
   * Get pipeline processing statistics
   */
  async getPipelineStats(days: number = 7): Promise<TIProcessingStats[]> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM ti_pipeline_stats 
        WHERE date >= DATE('now', '-${days} days')
        ORDER BY date DESC
      `).all();

      return (result.results || []).map(row => ({
        totalIndicators: row.total_indicators,
        newIndicators: row.new_indicators || 0,
        updatedIndicators: row.updated_indicators || 0,
        risksCreated: row.risks_created,
        risksBySource: JSON.parse(row.risks_by_source || '{}'),
        risksByState: JSON.parse(row.risks_by_state || '{}'),
        averageConfidence: row.average_confidence || 0,
        processingDuration: row.processing_duration || 0
      }));
      
    } catch (error) {
      console.error('Error getting pipeline stats:', error);
      return [];
    }
  }

  /**
   * Get recent processing history
   */
  getProcessingHistory(limit: number = 10): TIProcessingResult[] {
    return this.processingHistory.slice(0, limit);
  }

  // Helper methods

  private determineSourceType(connectorId: string): 'osint' | 'premium' | 'internal' {
    const osintSources = ['cisa-kev', 'otx-alienvault', 'nvd', 'first-epss', 'mitre-attack'];
    return osintSources.includes(connectorId) ? 'osint' : 'premium';
  }

  private mapIndicatorType(type: string): 'cve' | 'ioc' | 'ttp' | 'campaign' {
    const typeMap: { [key: string]: 'cve' | 'ioc' | 'ttp' | 'campaign' } = {
      'cve': 'cve',
      'ip': 'ioc',
      'domain': 'ioc',
      'url': 'ioc',
      'hash': 'ioc',
      'email': 'ioc',
      'yara': 'ttp'
    };
    
    return typeMap[type] || 'ioc';
  }

  private confidenceToLevel(confidence: number): string {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  private addToProcessingHistory(result: TIProcessingResult): void {
    this.processingHistory.unshift(result);
    
    // Keep only recent history
    if (this.processingHistory.length > this.maxHistorySize) {
      this.processingHistory = this.processingHistory.slice(0, this.maxHistorySize);
    }
  }

  // Status and monitoring methods

  get isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  get lastProcessing(): Date | undefined {
    return this.lastProcessingTime;
  }

  /**
   * Schedule automated pipeline execution
   */
  async scheduleAutomatedProcessing(intervalMinutes: number = 120): Promise<void> {
    console.log(`📅 Scheduling automated TI pipeline every ${intervalMinutes} minutes`);
    
    setInterval(async () => {
      try {
        if (!this.isProcessing) {
          console.log('⏰ Executing scheduled TI pipeline...');
          await this.executeFullPipeline();
        } else {
          console.log('⏸️ Skipping scheduled execution - pipeline already running');
        }
      } catch (error) {
        console.error('❌ Scheduled TI pipeline execution failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export default TIIngestionPipeline;