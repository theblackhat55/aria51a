/**
 * Advanced Threat Intelligence Correlation Service
 * 
 * Provides comprehensive threat intelligence capabilities including:
 * - Multi-source threat feed integration
 * - Advanced correlation and analysis
 * - Threat hunting and IOC matching
 * - Risk-based threat prioritization
 * - Automated threat response recommendations
 */

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'file_path' | 'registry_key';
  value: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  first_seen: string;
  last_seen: string;
  tags: string[];
  context: {
    malware_family?: string;
    attack_vector?: string;
    threat_actor?: string;
    campaign?: string;
  };
  metadata: Record<string, any>;
}

export interface ThreatFeed {
  id: string;
  name: string;
  type: 'commercial' | 'open_source' | 'government' | 'internal';
  url?: string;
  api_key?: string;
  reliability_score: number;
  update_frequency: number; // hours
  last_update: string;
  indicator_count: number;
  is_active: boolean;
}

export interface ThreatCorrelation {
  id: string;
  primary_indicator_id: string;
  related_indicators: string[];
  correlation_score: number;
  correlation_type: 'infrastructure' | 'behavioral' | 'temporal' | 'campaign';
  threat_actor?: string;
  campaign?: string;
  attack_pattern: string;
  confidence: number;
  created_at: string;
}

export interface ThreatHuntingQuery {
  id: string;
  name: string;
  description: string;
  query_type: 'sigma' | 'yara' | 'ioc' | 'behavior' | 'network';
  query_content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitre_tactics: string[];
  mitre_techniques: string[];
  false_positive_rate: number;
  created_by: string;
  created_at: string;
  last_executed: string;
  execution_count: number;
}

export interface ThreatAnalysis {
  threat_landscape: {
    total_indicators: number;
    new_indicators_24h: number;
    high_confidence_threats: number;
    active_campaigns: number;
    top_threat_actors: Array<{ name: string; indicator_count: number }>;
    trending_malware: Array<{ family: string; growth_rate: number }>;
  };
  risk_assessment: {
    overall_risk_score: number;
    risk_factors: Array<{
      factor: string;
      score: number;
      description: string;
    }>;
    recommendations: string[];
  };
  correlation_insights: {
    new_correlations: number;
    high_confidence_correlations: number;
    infrastructure_clusters: number;
    behavioral_patterns: number;
  };
}

export class ThreatIntelligenceService {
  constructor(private db: D1Database) {}

  /**
   * Initialize threat intelligence tables
   */
  async initializeTables(): Promise<void> {
    // Threat indicators table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS threat_indicators (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        source TEXT NOT NULL,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        tags TEXT, -- JSON array
        context TEXT, -- JSON object
        metadata TEXT, -- JSON object
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, value, source)
      )
    `).run();

    // Threat feeds table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS threat_feeds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        url TEXT,
        api_key_encrypted TEXT,
        reliability_score REAL DEFAULT 0.5,
        update_frequency INTEGER DEFAULT 24,
        last_update DATETIME,
        indicator_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Threat correlations table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS threat_correlations (
        id TEXT PRIMARY KEY,
        primary_indicator_id TEXT NOT NULL,
        related_indicators TEXT NOT NULL, -- JSON array
        correlation_score REAL NOT NULL,
        correlation_type TEXT NOT NULL,
        threat_actor TEXT,
        campaign TEXT,
        attack_pattern TEXT,
        confidence REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (primary_indicator_id) REFERENCES threat_indicators(id)
      )
    `).run();

    // Threat hunting queries table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS threat_hunting_queries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        query_type TEXT NOT NULL,
        query_content TEXT NOT NULL,
        severity TEXT NOT NULL,
        mitre_tactics TEXT, -- JSON array
        mitre_techniques TEXT, -- JSON array
        false_positive_rate REAL DEFAULT 0.1,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_executed DATETIME,
        execution_count INTEGER DEFAULT 0
      )
    `).run();

    // Threat hunting results table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS threat_hunting_results (
        id TEXT PRIMARY KEY,
        query_id TEXT NOT NULL,
        execution_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        matches_found INTEGER DEFAULT 0,
        results_data TEXT, -- JSON object
        false_positive BOOLEAN DEFAULT FALSE,
        investigated BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (query_id) REFERENCES threat_hunting_queries(id)
      )
    `).run();

    // Create indexes
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_threat_indicators_type_value ON threat_indicators(type, value)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_threat_indicators_severity ON threat_indicators(severity, is_active)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_threat_correlations_primary ON threat_correlations(primary_indicator_id)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_threat_hunting_severity ON threat_hunting_queries(severity)`).run();

    // Initialize default threat feeds and queries
    await this.initializeDefaultData();
  }

  /**
   * Initialize default threat feeds and hunting queries
   */
  private async initializeDefaultData(): Promise<void> {
    // Default threat feeds
    const defaultFeeds = [
      {
        id: 'misp_feed',
        name: 'MISP Community Feed',
        type: 'open_source',
        reliability_score: 0.8,
        update_frequency: 6
      },
      {
        id: 'abuse_ch',
        name: 'Abuse.ch Threat Feed',
        type: 'open_source', 
        reliability_score: 0.9,
        update_frequency: 2
      },
      {
        id: 'commercial_ti',
        name: 'Commercial Threat Intelligence',
        type: 'commercial',
        reliability_score: 0.95,
        update_frequency: 1
      },
      {
        id: 'internal_iocs',
        name: 'Internal IOCs',
        type: 'internal',
        reliability_score: 1.0,
        update_frequency: 24
      }
    ];

    for (const feed of defaultFeeds) {
      await this.db.prepare(`
        INSERT OR IGNORE INTO threat_feeds (id, name, type, reliability_score, update_frequency)
        VALUES (?, ?, ?, ?, ?)
      `).bind(feed.id, feed.name, feed.type, feed.reliability_score, feed.update_frequency).run();
    }

    // Default hunting queries
    const defaultQueries = [
      {
        id: 'suspicious_network_connections',
        name: 'Suspicious Network Connections',
        description: 'Detect connections to known malicious IPs',
        query_type: 'network',
        query_content: 'SELECT * FROM network_logs WHERE dest_ip IN (SELECT value FROM threat_indicators WHERE type = "ip" AND severity IN ("high", "critical"))',
        severity: 'high',
        mitre_tactics: ['Command and Control'],
        mitre_techniques: ['T1071.001']
      },
      {
        id: 'malicious_file_hashes',
        name: 'Malicious File Detection',
        description: 'Identify known malicious file hashes',
        query_type: 'ioc',
        query_content: 'SELECT * FROM file_events WHERE file_hash IN (SELECT value FROM threat_indicators WHERE type = "hash")',
        severity: 'critical',
        mitre_tactics: ['Execution'],
        mitre_techniques: ['T1059']
      },
      {
        id: 'c2_domains',
        name: 'Command & Control Domains',
        description: 'Detect DNS queries to C2 domains',
        query_type: 'network',
        query_content: 'SELECT * FROM dns_logs WHERE query_name IN (SELECT value FROM threat_indicators WHERE type = "domain")',
        severity: 'high',
        mitre_tactics: ['Command and Control'],
        mitre_techniques: ['T1071.004']
      }
    ];

    for (const query of defaultQueries) {
      await this.db.prepare(`
        INSERT OR IGNORE INTO threat_hunting_queries (id, name, description, query_type, query_content, severity, mitre_tactics, mitre_techniques)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        query.id,
        query.name,
        query.description,
        query.query_type,
        query.query_content,
        query.severity,
        JSON.stringify(query.mitre_tactics),
        JSON.stringify(query.mitre_techniques)
      ).run();
    }

    // Generate sample threat indicators
    await this.generateSampleIndicators();
  }

  /**
   * Generate sample threat indicators for demonstration
   */
  private async generateSampleIndicators(): Promise<void> {
    const sampleIndicators = [
      {
        type: 'ip',
        value: '192.168.1.100',
        confidence: 0.95,
        severity: 'high',
        source: 'commercial_ti',
        tags: ['malware', 'c2', 'apt28'],
        context: { threat_actor: 'APT28', campaign: 'Fancy Bear 2024' }
      },
      {
        type: 'domain',
        value: 'malicious-example.com',
        confidence: 0.88,
        severity: 'critical',
        source: 'misp_feed',
        tags: ['phishing', 'credential_theft'],
        context: { attack_vector: 'email', malware_family: 'Agent Tesla' }
      },
      {
        type: 'hash',
        value: 'a1b2c3d4e5f6789012345678901234567890abcdef',
        confidence: 0.92,
        severity: 'critical',
        source: 'abuse_ch',
        tags: ['ransomware', 'ryuk'],
        context: { malware_family: 'Ryuk', attack_vector: 'email' }
      },
      {
        type: 'email',
        value: 'attacker@evil-domain.com',
        confidence: 0.75,
        severity: 'medium',
        source: 'internal_iocs',
        tags: ['phishing', 'social_engineering'],
        context: { attack_vector: 'email', campaign: 'Q4 Phishing Campaign' }
      }
    ];

    for (const indicator of sampleIndicators) {
      const id = `ioc_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      await this.db.prepare(`
        INSERT OR IGNORE INTO threat_indicators (id, type, value, confidence, severity, source, tags, context)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        indicator.type,
        indicator.value,
        indicator.confidence,
        indicator.severity,
        indicator.source,
        JSON.stringify(indicator.tags),
        JSON.stringify(indicator.context)
      ).run();
    }
  }

  /**
   * Add new threat indicator
   */
  async addThreatIndicator(indicator: Omit<ThreatIndicator, 'id'>): Promise<string> {
    const id = `ioc_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    await this.db.prepare(`
      INSERT INTO threat_indicators (id, type, value, confidence, severity, source, tags, context, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      indicator.type,
      indicator.value,
      indicator.confidence,
      indicator.severity,
      indicator.source,
      JSON.stringify(indicator.tags),
      JSON.stringify(indicator.context),
      JSON.stringify(indicator.metadata)
    ).run();

    // Trigger correlation analysis for new indicator
    await this.analyzeCorrelations(id);

    return id;
  }

  /**
   * Analyze correlations for threat indicators
   */
  async analyzeCorrelations(indicatorId?: string): Promise<ThreatCorrelation[]> {
    let indicators;
    
    if (indicatorId) {
      indicators = await this.db.prepare(`
        SELECT * FROM threat_indicators WHERE id = ?
      `).bind(indicatorId).all();
    } else {
      indicators = await this.db.prepare(`
        SELECT * FROM threat_indicators WHERE is_active = TRUE
        ORDER BY last_seen DESC LIMIT 100
      `).all();
    }

    const correlations: ThreatCorrelation[] = [];

    for (const indicator of indicators.results as any[]) {
      // Find related indicators by various correlation methods
      const related = await this.findRelatedIndicators(indicator);
      
      if (related.length > 0) {
        const correlation: ThreatCorrelation = {
          id: `corr_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          primary_indicator_id: indicator.id,
          related_indicators: related.map(r => r.id),
          correlation_score: this.calculateCorrelationScore(indicator, related),
          correlation_type: this.determineCorrelationType(indicator, related),
          threat_actor: this.extractThreatActor(indicator, related),
          campaign: this.extractCampaign(indicator, related),
          attack_pattern: this.identifyAttackPattern(indicator, related),
          confidence: this.calculateConfidence(indicator, related),
          created_at: new Date().toISOString()
        };

        // Store correlation
        await this.db.prepare(`
          INSERT INTO threat_correlations (id, primary_indicator_id, related_indicators, correlation_score, correlation_type, threat_actor, campaign, attack_pattern, confidence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          correlation.id,
          correlation.primary_indicator_id,
          JSON.stringify(correlation.related_indicators),
          correlation.correlation_score,
          correlation.correlation_type,
          correlation.threat_actor,
          correlation.campaign,
          correlation.attack_pattern,
          correlation.confidence
        ).run();

        correlations.push(correlation);
      }
    }

    return correlations;
  }

  /**
   * Execute threat hunting queries
   */
  async executeThreatHunting(queryId?: string): Promise<any> {
    let queries;
    
    if (queryId) {
      queries = await this.db.prepare(`
        SELECT * FROM threat_hunting_queries WHERE id = ?
      `).bind(queryId).all();
    } else {
      queries = await this.db.prepare(`
        SELECT * FROM threat_hunting_queries 
        WHERE (last_executed IS NULL OR last_executed < datetime('now', '-1 hour'))
        ORDER BY severity DESC
      `).all();
    }

    const results = [];

    for (const query of queries.results as any[]) {
      // Simulate query execution
      const matches = await this.simulateQueryExecution(query);
      
      // Store results
      const resultId = `hunt_result_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      await this.db.prepare(`
        INSERT INTO threat_hunting_results (id, query_id, matches_found, results_data)
        VALUES (?, ?, ?, ?)
      `).bind(resultId, query.id, matches.length, JSON.stringify(matches)).run();

      // Update query execution stats
      await this.db.prepare(`
        UPDATE threat_hunting_queries 
        SET last_executed = datetime('now'), execution_count = execution_count + 1
        WHERE id = ?
      `).bind(query.id).run();

      results.push({
        query_id: query.id,
        query_name: query.name,
        matches_found: matches.length,
        severity: query.severity,
        results: matches
      });
    }

    return results;
  }

  /**
   * Get comprehensive threat analysis
   */
  async getThreatAnalysis(): Promise<ThreatAnalysis> {
    // Threat landscape metrics
    const indicators = await this.db.prepare(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 END) as new_24h,
             COUNT(CASE WHEN confidence > 0.8 AND severity IN ('high', 'critical') THEN 1 END) as high_confidence
      FROM threat_indicators WHERE is_active = TRUE
    `).first();

    const campaigns = await this.db.prepare(`
      SELECT COUNT(DISTINCT campaign) as active_campaigns
      FROM threat_correlations WHERE campaign IS NOT NULL AND created_at > datetime('now', '-30 days')
    `).first();

    const topActors = await this.db.prepare(`
      SELECT JSON_EXTRACT(context, '$.threat_actor') as actor, COUNT(*) as count
      FROM threat_indicators 
      WHERE JSON_EXTRACT(context, '$.threat_actor') IS NOT NULL
      GROUP BY JSON_EXTRACT(context, '$.threat_actor')
      ORDER BY count DESC LIMIT 5
    `).all();

    const trendingMalware = await this.db.prepare(`
      SELECT JSON_EXTRACT(context, '$.malware_family') as family, COUNT(*) as count
      FROM threat_indicators 
      WHERE JSON_EXTRACT(context, '$.malware_family') IS NOT NULL
        AND created_at > datetime('now', '-7 days')
      GROUP BY JSON_EXTRACT(context, '$.malware_family')
      ORDER BY count DESC LIMIT 5
    `).all();

    // Correlation insights
    const correlations = await this.db.prepare(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN confidence > 0.8 THEN 1 END) as high_confidence,
             COUNT(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 END) as new_correlations,
             COUNT(DISTINCT correlation_type) as pattern_types
      FROM threat_correlations
    `).first();

    // Risk assessment
    const riskFactors = [
      { factor: 'High Severity Indicators', score: Math.min(100, ((indicators as any)?.high_confidence || 0) * 2) },
      { factor: 'Active Threat Campaigns', score: Math.min(100, ((campaigns as any)?.active_campaigns || 0) * 10) },
      { factor: 'Correlation Confidence', score: Math.min(100, ((correlations as any)?.high_confidence || 0) * 5) },
      { factor: 'Detection Coverage', score: 85 } // Simulated
    ];

    const overallRiskScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length;

    return {
      threat_landscape: {
        total_indicators: (indicators as any)?.total || 0,
        new_indicators_24h: (indicators as any)?.new_24h || 0,
        high_confidence_threats: (indicators as any)?.high_confidence || 0,
        active_campaigns: (campaigns as any)?.active_campaigns || 0,
        top_threat_actors: (topActors.results as any[])?.map(row => ({
          name: row.actor || 'Unknown',
          indicator_count: row.count
        })) || [],
        trending_malware: (trendingMalware.results as any[])?.map(row => ({
          family: row.family || 'Unknown',
          growth_rate: Math.random() * 100 // Simulated growth rate
        })) || []
      },
      risk_assessment: {
        overall_risk_score: overallRiskScore,
        risk_factors: riskFactors.map(factor => ({
          ...factor,
          description: this.getRiskFactorDescription(factor.factor)
        })),
        recommendations: this.generateThreatRecommendations(overallRiskScore, riskFactors)
      },
      correlation_insights: {
        new_correlations: (correlations as any)?.new_correlations || 0,
        high_confidence_correlations: (correlations as any)?.high_confidence || 0,
        infrastructure_clusters: Math.floor(Math.random() * 10) + 1,
        behavioral_patterns: (correlations as any)?.pattern_types || 0
      }
    };
  }

  /**
   * Search threat indicators
   */
  async searchIndicators(query: string, filters?: {
    type?: string;
    severity?: string;
    source?: string;
    confidence_min?: number;
  }): Promise<ThreatIndicator[]> {
    let sql = `
      SELECT * FROM threat_indicators 
      WHERE is_active = TRUE AND (value LIKE ? OR tags LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`];

    if (filters?.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.severity) {
      sql += ' AND severity = ?';
      params.push(filters.severity);
    }

    if (filters?.source) {
      sql += ' AND source = ?';
      params.push(filters.source);
    }

    if (filters?.confidence_min) {
      sql += ' AND confidence >= ?';
      params.push(filters.confidence_min.toString());
    }

    sql += ' ORDER BY confidence DESC, last_seen DESC LIMIT 100';

    const result = await this.db.prepare(sql).bind(...params).all();
    return (result.results as any[])?.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      context: JSON.parse(row.context || '{}'),
      metadata: JSON.parse(row.metadata || '{}')
    })) || [];
  }

  // Helper methods
  private async findRelatedIndicators(indicator: any): Promise<any[]> {
    // Simulate finding related indicators based on various correlation methods
    const related = [];

    // Look for indicators with same threat actor
    if (indicator.context) {
      const context = JSON.parse(indicator.context);
      if (context.threat_actor) {
        const actorIndicators = await this.db.prepare(`
          SELECT * FROM threat_indicators 
          WHERE id != ? AND JSON_EXTRACT(context, '$.threat_actor') = ?
          LIMIT 5
        `).bind(indicator.id, context.threat_actor).all();
        related.push(...(actorIndicators.results || []));
      }
    }

    return related;
  }

  private calculateCorrelationScore(primary: any, related: any[]): number {
    // Simple correlation scoring based on shared attributes
    let score = 0;
    const primaryContext = JSON.parse(primary.context || '{}');
    
    for (const rel of related) {
      const relContext = JSON.parse(rel.context || '{}');
      
      if (primaryContext.threat_actor === relContext.threat_actor) score += 0.3;
      if (primaryContext.campaign === relContext.campaign) score += 0.2;
      if (primaryContext.malware_family === relContext.malware_family) score += 0.2;
      
      // Time-based correlation
      const timeDiff = Math.abs(new Date(primary.last_seen).getTime() - new Date(rel.last_seen).getTime());
      if (timeDiff < 24 * 60 * 60 * 1000) score += 0.1; // Within 24 hours
    }

    return Math.min(1, score);
  }

  private determineCorrelationType(primary: any, related: any[]): 'infrastructure' | 'behavioral' | 'temporal' | 'campaign' {
    const primaryContext = JSON.parse(primary.context || '{}');
    
    if (primaryContext.campaign) return 'campaign';
    if (primary.type === 'ip' || primary.type === 'domain') return 'infrastructure';
    
    const timeDiff = related.some(rel => 
      Math.abs(new Date(primary.last_seen).getTime() - new Date(rel.last_seen).getTime()) < 60 * 60 * 1000
    );
    
    return timeDiff ? 'temporal' : 'behavioral';
  }

  private extractThreatActor(primary: any, related: any[]): string | undefined {
    const primaryContext = JSON.parse(primary.context || '{}');
    return primaryContext.threat_actor;
  }

  private extractCampaign(primary: any, related: any[]): string | undefined {
    const primaryContext = JSON.parse(primary.context || '{}');
    return primaryContext.campaign;
  }

  private identifyAttackPattern(primary: any, related: any[]): string {
    const primaryContext = JSON.parse(primary.context || '{}');
    
    if (primaryContext.attack_vector === 'email') return 'Phishing Campaign';
    if (primary.type === 'ip' && primaryContext.malware_family) return 'C2 Infrastructure';
    if (primary.type === 'hash') return 'Malware Distribution';
    
    return 'Unknown Pattern';
  }

  private calculateConfidence(primary: any, related: any[]): number {
    const baseConfidence = primary.confidence;
    const relatedConfidence = related.reduce((sum, rel) => sum + rel.confidence, 0) / related.length;
    
    return Math.min(1, (baseConfidence + relatedConfidence) / 2);
  }

  private async simulateQueryExecution(query: any): Promise<any[]> {
    // Simulate threat hunting query execution
    const matches = Math.floor(Math.random() * 10);
    const results = [];
    
    for (let i = 0; i < matches; i++) {
      results.push({
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        severity: query.severity,
        description: `Match found for ${query.name}`,
        source_data: {
          query_type: query.query_type,
          match_confidence: 0.7 + Math.random() * 0.3
        }
      });
    }
    
    return results;
  }

  private getRiskFactorDescription(factor: string): string {
    const descriptions: Record<string, string> = {
      'High Severity Indicators': 'Number of high-confidence, severe threat indicators',
      'Active Threat Campaigns': 'Ongoing threat campaigns detected in the environment',
      'Correlation Confidence': 'Reliability of threat intelligence correlations',
      'Detection Coverage': 'Effectiveness of current threat detection capabilities'
    };
    
    return descriptions[factor] || 'Risk factor assessment';
  }

  private generateThreatRecommendations(riskScore: number, factors: any[]): string[] {
    const recommendations = [];
    
    if (riskScore > 80) {
      recommendations.push('Implement emergency threat response procedures');
      recommendations.push('Increase security monitoring frequency');
    }
    
    if (riskScore > 60) {
      recommendations.push('Review and update threat detection rules');
      recommendations.push('Conduct threat hunting exercises');
    }
    
    recommendations.push('Maintain current threat intelligence feeds');
    recommendations.push('Regular correlation analysis for new patterns');
    
    return recommendations;
  }
}