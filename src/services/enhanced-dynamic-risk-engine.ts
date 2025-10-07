/**
 * Enhanced Dynamic Risk Calculation Engine
 * 
 * Transforms simple Impact × Probability into sophisticated multi-factor scoring
 * Integrates MS Defender data, threat intelligence, and contextual factors
 */

import type { CloudflareBindings } from '../types';

export interface DynamicRiskScore {
  score: number;           // 0-100 normalized score
  level: RiskLevel;        // CRITICAL/HIGH/MEDIUM/LOW/MINIMAL
  trend: RiskTrend;        // INCREASING/STABLE/DECREASING
  confidence: number;      // 0-1 confidence in calculation
  components: RiskComponents;
  lastCalculated: string;
  nextCalculation: string;
  metadata: any;
}

export interface RiskComponents {
  baseRisk: number;           // Traditional Impact × Probability
  assetCriticality: number;   // From asset importance and MS Defender
  serviceCriticality: number; // From service dependency analysis
  vulnerabilityScore: number; // From MS Defender vulnerabilities
  threatIntelligence: number; // From threat feeds and IOCs
  incidentHistory: number;    // From MS Defender incident data
  controlEffectiveness: number; // Reduction from implemented controls
  contextMultiplier: number;  // Environmental and business factors
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
export type RiskTrend = 'INCREASING' | 'STABLE' | 'DECREASING';

export interface AssetRiskData {
  id: number;
  name: string;
  criticality: string;
  defenderScore?: number;
  vulnerabilities: VulnerabilityData[];
  incidents: IncidentData[];
  services: ServiceData[];
  exposureLevel: string;
  patchStatus: string;
}

export interface VulnerabilityData {
  id: string;
  cveId?: string;
  cvssScore: number;
  severityLevel: string;
  exploitAvailable: boolean;
  publicExploit: boolean;
  patchAvailable: boolean;
  daysSincePatch?: number;
  attackComplexity: string;
}

export interface IncidentData {
  id: string;
  severity: string;
  status: string;
  createdDate: string;
  resolvedDate?: string;
  incidentType: string;
}

export interface ServiceData {
  id: number;
  name: string;
  criticality: number;
  availabilityRequirement: number;
  userImpact: number;
  financialImpact: number;
  dependencies: number;
}

export interface ThreatIntelData {
  source: string;
  threatType: string;
  confidenceLevel: number;
  severityScore: number;
  relevanceScore: number;
}

export class EnhancedDynamicRiskEngine {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Calculate dynamic risk score for a risk
   */
  async calculateDynamicRisk(riskId: number): Promise<DynamicRiskScore> {
    try {
      console.log(`🎯 Calculating dynamic risk score for risk ID: ${riskId}`);
      
      // Get risk base data
      const risk = await this.getRiskData(riskId);
      if (!risk) {
        throw new Error(`Risk ${riskId} not found`);
      }
      
      // Get related assets and services
      const assets = await this.getRiskAssets(riskId);
      const services = await this.getRiskServices(riskId);
      
      // Get threat intelligence data
      const threatIntel = await this.getThreatIntelligence(riskId);
      
      // Get control effectiveness
      const controls = await this.getControlEffectiveness(riskId);
      
      // Get scoring configuration
      const config = await this.getScoringConfig();
      
      // Calculate component scores
      const components = await this.calculateComponents(
        risk, assets, services, threatIntel, controls, config
      );
      
      // Calculate final score
      const finalScore = this.calculateFinalScore(components, config);
      
      // Determine risk level and trend
      const level = this.determineRiskLevel(finalScore.score, config);
      const trend = await this.calculateRiskTrend(riskId, finalScore.score);
      
      // Store calculation history
      await this.storeCalculationHistory(riskId, finalScore.score, components);
      
      // Update risk record
      await this.updateRiskRecord(riskId, finalScore.score, level, trend, finalScore.confidence);
      
      return {
        score: finalScore.score,
        level,
        trend,
        confidence: finalScore.confidence,
        components,
        lastCalculated: new Date().toISOString(),
        nextCalculation: this.calculateNextUpdate().toISOString(),
        metadata: {
          assetsCount: assets.length,
          servicesCount: services.length,
          threatSources: threatIntel.length,
          controlsCount: controls.length
        }
      };
      
    } catch (error) {
      console.error('Error calculating dynamic risk:', error);
      throw error;
    }
  }

  /**
   * Calculate all component scores
   */
  private async calculateComponents(
    risk: any,
    assets: AssetRiskData[],
    services: ServiceData[],
    threatIntel: ThreatIntelData[],
    controls: any[],
    config: any
  ): Promise<RiskComponents> {
    
    // 1. Base Risk (Traditional Impact × Probability)
    const baseRisk = (risk.impact || 3) * (risk.probability || 3); // 1-25 scale
    
    // 2. Asset Criticality Score
    const assetCriticality = await this.calculateAssetCriticality(assets);
    
    // 3. Service Criticality Score
    const serviceCriticality = await this.calculateServiceCriticality(services);
    
    // 4. Vulnerability Score (from MS Defender)
    const vulnerabilityScore = await this.calculateVulnerabilityScore(assets);
    
    // 5. Threat Intelligence Score
    const threatIntelligence = await this.calculateThreatIntelligenceScore(threatIntel);
    
    // 6. Incident History Score
    const incidentHistory = await this.calculateIncidentHistoryScore(assets);
    
    // 7. Control Effectiveness (risk reduction)
    const controlEffectiveness = await this.calculateControlEffectiveness(controls);
    
    // 8. Context Multiplier
    const contextMultiplier = await this.calculateContextMultiplier(risk);
    
    return {
      baseRisk: Math.min(baseRisk * 4, 100), // Normalize to 0-100
      assetCriticality: Math.min(assetCriticality * 10, 100),
      serviceCriticality: Math.min(serviceCriticality * 10, 100),
      vulnerabilityScore: Math.min(vulnerabilityScore * 10, 100),
      threatIntelligence: Math.min(threatIntelligence * 10, 100),
      incidentHistory: Math.min(incidentHistory * 10, 100),
      controlEffectiveness: Math.min(controlEffectiveness * 20, 100),
      contextMultiplier
    };
  }

  /**
   * Calculate Asset Criticality Score
   */
  private async calculateAssetCriticality(assets: AssetRiskData[]): Promise<number> {
    if (!assets.length) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const asset of assets) {
      // Base criticality from asset classification
      const criticalityMap = {
        'Critical': 5.0,
        'High': 4.0,
        'Medium': 3.0,
        'Low': 2.0,
        'Minimal': 1.0
      };
      
      let assetScore = criticalityMap[asset.criticality] || 3.0;
      
      // MS Defender score enhancement
      if (asset.defenderScore) {
        assetScore = (assetScore * 0.6) + (asset.defenderScore * 0.4);
      }
      
      // Exposure level adjustment
      const exposureMultiplier = {
        'internet_facing': 1.8,
        'dmz': 1.4,
        'internal': 1.0,
        'isolated': 0.6
      };
      
      assetScore *= exposureMultiplier[asset.exposureLevel] || 1.0;
      
      // Service dependency weight
      const serviceWeight = Math.max(asset.services.length, 1);
      
      totalScore += assetScore * serviceWeight;
      totalWeight += serviceWeight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate Service Criticality Score
   */
  private async calculateServiceCriticality(services: ServiceData[]): Promise<number> {
    if (!services.length) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const service of services) {
      // Base service criticality (0-10 scale)
      let serviceScore = service.criticality;
      
      // Availability requirement factor
      const availabilityFactor = (1 - service.availabilityRequirement) * 10; // Higher requirement = higher risk
      
      // User impact factor
      const userImpactFactor = Math.log10(Math.max(service.userImpact, 1)) / 3; // Log scale for user impact
      
      // Financial impact factor
      const financialFactor = Math.min(service.financialImpact / 10000, 5); // Normalize financial impact
      
      // Dependency complexity
      const dependencyFactor = Math.min(service.dependencies * 0.5, 3);
      
      serviceScore += availabilityFactor + userImpactFactor + financialFactor + dependencyFactor;
      
      const weight = 1 + (service.dependencies * 0.1); // More dependencies = higher weight
      
      totalScore += Math.min(serviceScore, 10) * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate Vulnerability Score from MS Defender data
   */
  private async calculateVulnerabilityScore(assets: AssetRiskData[]): Promise<number> {
    let totalScore = 0;
    let vulnCount = 0;
    
    for (const asset of assets) {
      for (const vuln of asset.vulnerabilities) {
        let vulnScore = vuln.cvssScore; // 0-10 CVSS score
        
        // Exploitability factors
        if (vuln.exploitAvailable) vulnScore *= 1.5;
        if (vuln.publicExploit) vulnScore *= 2.0;
        
        // Patch status factors
        if (!vuln.patchAvailable) {
          vulnScore *= 1.3;
        } else if (vuln.daysSincePatch && vuln.daysSincePatch > 30) {
          vulnScore *= 1.2; // Penalty for delayed patching
        }
        
        // Attack complexity
        const complexityMultiplier = {
          'low': 1.5,
          'medium': 1.0,
          'high': 0.7
        };
        vulnScore *= complexityMultiplier[vuln.attackComplexity.toLowerCase()] || 1.0;
        
        totalScore += Math.min(vulnScore, 10);
        vulnCount++;
      }
    }
    
    return vulnCount > 0 ? totalScore / vulnCount : 0;
  }

  /**
   * Calculate Threat Intelligence Score
   */
  private async calculateThreatIntelligenceScore(threatIntel: ThreatIntelData[]): Promise<number> {
    if (!threatIntel.length) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const threat of threatIntel) {
      const threatScore = threat.severityScore * threat.relevanceScore;
      const weight = threat.confidenceLevel;
      
      totalScore += threatScore * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate Incident History Score
   */
  private async calculateIncidentHistoryScore(assets: AssetRiskData[]): Promise<number> {
    let totalScore = 0;
    let incidentCount = 0;
    
    const severityWeights = {
      'Critical': 4.0,
      'High': 3.0,
      'Medium': 2.0,
      'Low': 1.0
    };
    
    const now = new Date();
    
    for (const asset of assets) {
      for (const incident of asset.incidents) {
        const incidentDate = new Date(incident.createdDate);
        const daysAgo = (now.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Time decay - recent incidents matter more
        const timeFactor = Math.exp(-daysAgo / 90); // 90-day half-life
        
        const severityWeight = severityWeights[incident.severity] || 2.0;
        
        totalScore += severityWeight * timeFactor;
        incidentCount++;
      }
    }
    
    // Frequency factor
    const frequencyFactor = Math.min(incidentCount / 10, 1); // Normalize by expected incident count
    
    return incidentCount > 0 ? (totalScore / incidentCount) * (1 + frequencyFactor) : 0;
  }

  /**
   * Calculate Control Effectiveness (risk reduction)
   */
  private async calculateControlEffectiveness(controls: any[]): Promise<number> {
    if (!controls.length) return 0;
    
    let totalEffectiveness = 0;
    let totalWeight = 0;
    
    for (const control of controls) {
      let effectiveness = control.effectiveness_score; // 0-1
      const coverage = control.coverage_percentage / 100; // 0-1
      const maturity = control.maturity_level / 5; // 0-1
      
      // Control decay over time
      if (control.last_tested) {
        const daysSinceTest = (Date.now() - new Date(control.last_tested).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceTest > 90) {
          const decayFactor = Math.exp(-daysSinceTest / 180);
          effectiveness *= decayFactor;
        }
      }
      
      const controlValue = (effectiveness * 0.5 + coverage * 0.3 + maturity * 0.2);
      const weight = coverage; // Coverage acts as weight
      
      totalEffectiveness += controlValue * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalEffectiveness / totalWeight : 0;
  }

  /**
   * Calculate Context Multiplier
   */
  private async calculateContextMultiplier(risk: any): Promise<number> {
    let multiplier = 1.0;
    
    // Get context factors from database
    const contexts = await this.db.prepare(`
      SELECT context_type, context_name, impact_multiplier
      FROM risk_environment_context
      WHERE risk_id = ? AND (
        active_period_start IS NULL OR active_period_start <= datetime('now')
      ) AND (
        active_period_end IS NULL OR active_period_end >= datetime('now')
      )
    `).bind(risk.id).all();
    
    const contextMultipliers = [];
    
    for (const context of contexts.results || []) {
      contextMultipliers.push(context.impact_multiplier);
    }
    
    // Add dynamic context factors
    if (this.isPeakBusinessPeriod()) contextMultipliers.push(1.3);
    if (this.isAuditPeriod()) contextMultipliers.push(1.2);
    if (await this.hasRecentSecurityIncident()) contextMultipliers.push(1.4);
    if (await this.isHighThreatPeriod()) contextMultipliers.push(1.5);
    
    // Return maximum multiplier if any exist
    return contextMultipliers.length > 0 ? Math.max(...contextMultipliers) : 1.0;
  }

  /**
   * Calculate final weighted score
   */
  private calculateFinalScore(components: RiskComponents, config: any): { score: number; confidence: number } {
    const weights = JSON.parse(config.weights);
    
    // Calculate weighted score
    let weightedScore = (
      components.baseRisk * weights.asset_criticality +
      components.assetCriticality * weights.asset_criticality +
      components.serviceCriticality * weights.service_criticality +
      components.vulnerabilityScore * weights.vulnerability_score +
      components.threatIntelligence * weights.threat_intelligence +
      components.incidentHistory * weights.incident_history
    );
    
    // Apply context multiplier
    weightedScore *= components.contextMultiplier;
    
    // Apply control effectiveness as reduction
    const controlReduction = components.controlEffectiveness * Math.abs(weights.control_effectiveness);
    weightedScore = Math.max(0, weightedScore - controlReduction);
    
    // Normalize to 0-100
    const normalizedScore = Math.min(100, Math.max(0, weightedScore));
    
    // Calculate confidence based on data availability
    const confidence = this.calculateDataConfidence(components);
    
    return {
      score: normalizedScore,
      confidence
    };
  }

  /**
   * Determine risk level based on score and organizational thresholds
   */
  private determineRiskLevel(score: number, config: any): RiskLevel {
    const thresholds = JSON.parse(config.thresholds);
    
    // Adjust thresholds based on risk appetite
    const appetiteMultiplier = {
      'conservative': 0.8,
      'moderate': 1.0,
      'aggressive': 1.2
    };
    
    const multiplier = appetiteMultiplier[config.risk_appetite] || 1.0;
    
    const adjustedThresholds = {
      critical: thresholds.critical * multiplier,
      high: thresholds.high * multiplier,
      medium: thresholds.medium * multiplier,
      low: thresholds.low * multiplier
    };
    
    if (score >= adjustedThresholds.critical) return 'CRITICAL';
    if (score >= adjustedThresholds.high) return 'HIGH';
    if (score >= adjustedThresholds.medium) return 'MEDIUM';
    if (score >= adjustedThresholds.low) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Calculate risk trend based on historical data
   */
  private async calculateRiskTrend(riskId: number, currentScore: number): Promise<RiskTrend> {
    const history = await this.db.prepare(`
      SELECT new_score, calculation_date
      FROM risk_calculation_history
      WHERE risk_id = ?
      ORDER BY calculation_date DESC
      LIMIT 10
    `).bind(riskId).all();
    
    if (!history.results || history.results.length < 3) {
      return 'STABLE';
    }
    
    const scores = history.results.map(h => h.new_score);
    const recentAvg = scores.slice(0, 3).reduce((a, b) => a + b) / 3;
    const olderAvg = scores.slice(3, 6).reduce((a, b) => a + b) / Math.max(scores.slice(3, 6).length, 1);
    
    const trendDiff = recentAvg - olderAvg;
    
    if (trendDiff > 5) return 'INCREASING';
    if (trendDiff < -5) return 'DECREASING';
    return 'STABLE';
  }

  /**
   * Calculate data confidence based on component availability
   */
  private calculateDataConfidence(components: RiskComponents): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on data availability
    if (components.assetCriticality > 0) confidence += 0.1;
    if (components.serviceCriticality > 0) confidence += 0.1;
    if (components.vulnerabilityScore > 0) confidence += 0.1;
    if (components.threatIntelligence > 0) confidence += 0.1;
    if (components.incidentHistory > 0) confidence += 0.1;
    if (components.controlEffectiveness > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Helper methods
  private calculateNextUpdate(): Date {
    const next = new Date();
    next.setHours(next.getHours() + 1); // Default to hourly updates
    return next;
  }

  private isPeakBusinessPeriod(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Business hours on weekdays
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 18;
  }

  private isAuditPeriod(): boolean {
    const now = new Date();
    const month = now.getMonth();
    // Typically Q4 (Oct-Dec) and Q1 (Jan-Mar) are audit periods
    return month >= 9 || month <= 2;
  }

  private async hasRecentSecurityIncident(): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM defender_incidents
      WHERE created_time >= datetime('now', '-7 days')
      AND severity IN ('Critical', 'High')
    `).first();
    
    return (result?.count || 0) > 0;
  }

  private async isHighThreatPeriod(): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM risk_threat_intelligence
      WHERE last_seen >= datetime('now', '-24 hours')
      AND severity_score >= 7
      AND active_status = TRUE
    `).first();
    
    return (result?.count || 0) > 5; // Arbitrary threshold
  }

  // Database helper methods
  private async getRiskData(riskId: number) {
    return await this.db.prepare('SELECT * FROM risks WHERE id = ?').bind(riskId).first();
  }

  private async getRiskAssets(riskId: number): Promise<AssetRiskData[]> {
    const mappings = await this.db.prepare(`
      SELECT a.*, ram.impact_weight, ram.exposure_level
      FROM risk_asset_mappings ram
      JOIN assets a ON ram.asset_id = a.id
      WHERE ram.risk_id = ?
    `).bind(riskId).all();
    
    const assets: AssetRiskData[] = [];
    
    for (const mapping of mappings.results || []) {
      // Get vulnerabilities for this asset
      const vulnerabilities = await this.db.prepare(`
        SELECT dv.*
        FROM asset_vulnerabilities av
        JOIN defender_vulnerabilities dv ON av.vulnerability_id = dv.id
        WHERE av.asset_id = ?
      `).bind(mapping.id).all();
      
      // Get incidents for this asset
      const incidents = await this.db.prepare(`
        SELECT di.*
        FROM asset_incidents ai
        JOIN defender_incidents di ON ai.incident_id = di.id
        WHERE ai.asset_id = ?
      `).bind(mapping.id).all();
      
      // Get services for this asset
      const services = await this.db.prepare(`
        SELECT s.* FROM services s
        WHERE s.id IN (
          SELECT service_id FROM asset_service_mappings WHERE asset_id = ?
        )
      `).bind(mapping.id).all();
      
      assets.push({
        id: mapping.id,
        name: mapping.name,
        criticality: mapping.criticality || 'Medium',
        defenderScore: null, // Could be populated from MS Defender API
        vulnerabilities: (vulnerabilities.results || []).map(v => ({
          id: v.vulnerability_id,
          cveId: v.cve_id,
          cvssScore: v.cvss_v3_score || 0,
          severityLevel: v.severity_level,
          exploitAvailable: v.exploitability_level !== 'Low',
          publicExploit: v.public_exploit || false,
          patchAvailable: true, // Default assumption
          attackComplexity: 'medium' // Default
        })),
        incidents: (incidents.results || []).map(i => ({
          id: i.incident_id,
          severity: i.severity,
          status: i.status,
          createdDate: i.created_time,
          resolvedDate: i.resolved_time,
          incidentType: i.classification
        })),
        services: (services.results || []).map(s => ({
          id: s.id,
          name: s.name,
          criticality: s.criticality_score || 50,
          availabilityRequirement: 0.99,
          userImpact: 100,
          financialImpact: 1000,
          dependencies: 1
        })),
        exposureLevel: mapping.exposure_level || 'internal',
        patchStatus: 'up_to_date'
      });
    }
    
    return assets;
  }

  private async getRiskServices(riskId: number): Promise<ServiceData[]> {
    const mappings = await this.db.prepare(`
      SELECT s.*, rsm.*
      FROM risk_service_mappings rsm
      JOIN services s ON rsm.service_id = s.id
      WHERE rsm.risk_id = ?
    `).bind(riskId).all();
    
    return (mappings.results || []).map(s => ({
      id: s.id,
      name: s.name,
      criticality: s.criticality_score || 50,
      availabilityRequirement: s.availability_requirement || 0.99,
      userImpact: s.user_impact_count || 100,
      financialImpact: s.financial_impact_hourly || 1000,
      dependencies: 1 // Could be calculated from dependency tables
    }));
  }

  private async getThreatIntelligence(riskId: number): Promise<ThreatIntelData[]> {
    const threats = await this.db.prepare(`
      SELECT *
      FROM risk_threat_intelligence
      WHERE risk_id = ? AND active_status = TRUE
    `).bind(riskId).all();
    
    return (threats.results || []).map(t => ({
      source: t.threat_source,
      threatType: t.threat_type,
      confidenceLevel: t.confidence_level,
      severityScore: t.severity_score,
      relevanceScore: 0.8 // Default relevance
    }));
  }

  private async getControlEffectiveness(riskId: number) {
    const controls = await this.db.prepare(`
      SELECT *
      FROM risk_control_effectiveness
      WHERE risk_id = ?
    `).bind(riskId).all();
    
    return controls.results || [];
  }

  private async getScoringConfig() {
    const config = await this.db.prepare(`
      SELECT *
      FROM risk_scoring_config
      WHERE active_status = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `).first();
    
    return config || {
      risk_appetite: 'moderate',
      thresholds: '{"critical": 80, "high": 60, "medium": 40, "low": 20}',
      weights: '{"asset_criticality": 0.25, "service_criticality": 0.25, "vulnerability_score": 0.20, "threat_intelligence": 0.15, "incident_history": 0.10, "control_effectiveness": -0.15}'
    };
  }

  private async storeCalculationHistory(riskId: number, newScore: number, components: RiskComponents) {
    // Get previous score
    const previous = await this.db.prepare(`
      SELECT dynamic_score FROM risks WHERE id = ?
    `).bind(riskId).first();
    
    const previousScore = previous?.dynamic_score || 0;
    const scoreChange = newScore - previousScore;
    
    await this.db.prepare(`
      INSERT INTO risk_calculation_history (
        risk_id, new_score, previous_score, score_change, 
        triggered_by, calculation_details
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      riskId,
      newScore,
      previousScore,
      scoreChange,
      'scheduled',
      JSON.stringify(components)
    ).run();
  }

  private async updateRiskRecord(riskId: number, score: number, level: RiskLevel, trend: RiskTrend, confidence: number) {
    await this.db.prepare(`
      UPDATE risks SET
        dynamic_score = ?,
        dynamic_level = ?,
        dynamic_trend = ?,
        confidence_score = ?,
        last_calculated = datetime('now'),
        next_calculation = datetime('now', '+1 hour')
      WHERE id = ?
    `).bind(score, level, trend, confidence, riskId).run();
  }

  /**
   * Batch calculate all active risks
   */
  async calculateAllActiveRisks(): Promise<void> {
    const risks = await this.db.prepare(`
      SELECT id FROM risks 
      WHERE status = 'active' 
      AND (next_calculation IS NULL OR next_calculation <= datetime('now'))
    `).all();
    
    for (const risk of risks.results || []) {
      try {
        await this.calculateDynamicRisk(risk.id);
        console.log(`✅ Calculated dynamic risk for risk ID: ${risk.id}`);
      } catch (error) {
        console.error(`❌ Failed to calculate risk ID: ${risk.id}`, error);
      }
    }
  }
}

export default EnhancedDynamicRiskEngine;