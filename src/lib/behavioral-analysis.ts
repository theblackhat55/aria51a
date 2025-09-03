/**
 * Behavioral Analysis & Anomaly Detection Service for ARIA5.1
 * 
 * Provides advanced behavioral analytics for:
 * - User behavior pattern analysis and anomaly detection
 * - System usage patterns and deviations
 * - Risk management behavior insights
 * - Security incident behavioral analysis
 * - Compliance behavior tracking and predictions
 * - Entity relationship behavioral patterns
 * 
 * Features:
 * - Real-time behavioral monitoring
 * - Statistical and ML-based anomaly detection
 * - Baseline behavior establishment and tracking
 * - Risk scoring based on behavioral deviations
 * - Automated alerts for suspicious activities
 * - Integration with all ARIA5 security modules
 */

export interface BehavioralProfile {
  entityId: string;
  entityType: 'user' | 'system' | 'application' | 'process';
  profileId: string;
  baselineMetrics: Record<string, BehavioralMetric>;
  currentMetrics: Record<string, BehavioralMetric>;
  riskScore: number;
  confidence: number;
  lastUpdated: string;
  createdAt: string;
  status: 'learning' | 'active' | 'suspicious' | 'compromised';
}

export interface BehavioralMetric {
  name: string;
  value: number;
  baseline: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: Record<string, number>; // P10, P25, P50, P75, P90
  };
  trend: 'stable' | 'increasing' | 'decreasing' | 'volatile';
  anomalyScore: number;
  lastAnomaly?: string;
  dataPoints: number;
}

export interface BehavioralEvent {
  id: string;
  entityId: string;
  entityType: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: string;
  processed: boolean;
  anomalyScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyDetection {
  id: string;
  entityId: string;
  anomalyType: 'statistical' | 'pattern' | 'behavioral' | 'temporal' | 'contextual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  affectedMetrics: string[];
  detectionMethod: string;
  timestamp: string;
  resolved: boolean;
  falsePositive: boolean;
  investigationNotes?: string;
}

export interface BehavioralInsight {
  type: 'trend' | 'pattern' | 'correlation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
  affectedEntities: string[];
  supportingData: Record<string, any>;
  timestamp: string;
}

export interface UserBehaviorAnalysis {
  userId: number;
  loginPatterns: {
    timeOfDay: number[];
    dayOfWeek: number[];
    frequency: number;
    locations: string[];
    devices: string[];
  };
  activityPatterns: {
    sessionDuration: BehavioralMetric;
    pageViews: BehavioralMetric;
    actions: Record<string, BehavioralMetric>;
    dataAccess: BehavioralMetric;
  };
  riskBehaviors: {
    failedLogins: BehavioralMetric;
    privilegeEscalation: BehavioralMetric;
    dataExfiltration: BehavioralMetric;
    offHourAccess: BehavioralMetric;
  };
  collaborationPatterns: {
    teamInteraction: BehavioralMetric;
    documentSharing: BehavioralMetric;
    communicationFrequency: BehavioralMetric;
  };
}

export class BehavioralAnalysisService {
  private db: any;
  private profiles: Map<string, BehavioralProfile> = new Map();
  private eventQueue: BehavioralEvent[] = [];
  private isInitialized = false;
  private processingInterval: any;

  // Anomaly detection configuration
  private config = {
    anomalyThresholds: {
      statistical: 2.5, // Standard deviations
      pattern: 0.8, // Similarity threshold
      behavioral: 0.7, // Behavioral score threshold
      temporal: 3.0, // Time-based threshold
      contextual: 0.6 // Context similarity threshold
    },
    learningPeriodDays: 30,
    minDataPoints: 50,
    updateIntervalMinutes: 15,
    retentionDays: 365
  };

  constructor(database?: any) {
    this.db = database;
    if (this.db) {
      this.initializeBehavioralAnalysis();
    }
  }

  /**
   * Initialize behavioral analysis database and processing
   */
  private async initializeBehavioralAnalysis(): Promise<void> {
    try {
      // Behavioral profiles table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS behavioral_profiles (
          profile_id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'system', 'application', 'process')),
          baseline_metrics TEXT NOT NULL, -- JSON
          current_metrics TEXT NOT NULL, -- JSON
          risk_score REAL NOT NULL DEFAULT 0,
          confidence REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'active', 'suspicious', 'compromised')),
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(entity_id, entity_type)
        )
      `).run();

      // Behavioral events table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS behavioral_events (
          id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          event_type TEXT NOT NULL,
          event_data TEXT NOT NULL, -- JSON
          timestamp DATETIME NOT NULL,
          processed BOOLEAN DEFAULT FALSE,
          anomaly_score REAL,
          risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Anomaly detections table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS anomaly_detections (
          id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('statistical', 'pattern', 'behavioral', 'temporal', 'contextual')),
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          confidence REAL NOT NULL,
          description TEXT NOT NULL,
          affected_metrics TEXT, -- JSON array
          detection_method TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          resolved BOOLEAN DEFAULT FALSE,
          false_positive BOOLEAN DEFAULT FALSE,
          investigation_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Behavioral insights table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS behavioral_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('trend', 'pattern', 'correlation', 'prediction')),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          confidence REAL NOT NULL,
          impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
          recommendation TEXT NOT NULL,
          affected_entities TEXT, -- JSON array
          supporting_data TEXT, -- JSON
          timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Create indexes for performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_entity ON behavioral_profiles(entity_id, entity_type)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_behavioral_events_entity ON behavioral_events(entity_id, entity_type)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_behavioral_events_timestamp ON behavioral_events(timestamp)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_anomaly_detections_entity ON anomaly_detections(entity_id)
      `).run();

      // Load existing profiles
      await this.loadBehavioralProfiles();

      // Start processing
      this.startEventProcessing();

      this.isInitialized = true;
      console.log('✅ Behavioral Analysis engine initialized');

    } catch (error) {
      console.error('Failed to initialize behavioral analysis:', error);
    }
  }

  /**
   * Record a behavioral event for analysis
   */
  async recordEvent(event: Omit<BehavioralEvent, 'id' | 'processed'>): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const eventId = this.generateEventId();
      const fullEvent: BehavioralEvent = {
        ...event,
        id: eventId,
        processed: false
      };

      // Store event in database
      if (this.db && this.isInitialized) {
        await this.storeEvent(fullEvent);
      }

      // Add to processing queue
      this.eventQueue.push(fullEvent);

      // Process immediately if queue is getting large
      if (this.eventQueue.length > 100) {
        await this.processEventQueue();
      }

      return { success: true, eventId };

    } catch (error) {
      console.error('Failed to record behavioral event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Event recording failed'
      };
    }
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(userId: number, periodDays: number = 30): Promise<{ success: boolean; analysis?: UserBehaviorAnalysis; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Behavioral analysis not initialized' };
      }

      // Get user events for analysis period
      const events = await this.getUserEvents(userId, periodDays);
      
      if (events.length < 10) {
        return { success: false, error: 'Insufficient data for behavioral analysis' };
      }

      // Analyze login patterns
      const loginPatterns = this.analyzeLoginPatterns(events);
      
      // Analyze activity patterns
      const activityPatterns = await this.analyzeActivityPatterns(events);
      
      // Analyze risk behaviors
      const riskBehaviors = this.analyzeRiskBehaviors(events);
      
      // Analyze collaboration patterns
      const collaborationPatterns = this.analyzeCollaborationPatterns(events);

      const analysis: UserBehaviorAnalysis = {
        userId,
        loginPatterns,
        activityPatterns,
        riskBehaviors,
        collaborationPatterns
      };

      console.log('👤 User behavior analysis completed:', {
        userId,
        events: events.length,
        riskScore: this.calculateUserRiskScore(analysis)
      });

      return { success: true, analysis };

    } catch (error) {
      console.error('User behavior analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Detect anomalies in behavioral data
   */
  async detectAnomalies(entityId: string, entityType: string): Promise<{ success: boolean; anomalies?: AnomalyDetection[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Behavioral analysis not initialized' };
      }

      const profile = await this.getBehavioralProfile(entityId, entityType);
      if (!profile) {
        return { success: false, error: 'No behavioral profile found' };
      }

      const anomalies: AnomalyDetection[] = [];

      // Statistical anomaly detection
      const statisticalAnomalies = await this.detectStatisticalAnomalies(profile);
      anomalies.push(...statisticalAnomalies);

      // Pattern-based anomaly detection
      const patternAnomalies = await this.detectPatternAnomalies(entityId, entityType);
      anomalies.push(...patternAnomalies);

      // Behavioral anomaly detection
      const behavioralAnomalies = await this.detectBehavioralAnomalies(profile);
      anomalies.push(...behavioralAnomalies);

      // Temporal anomaly detection
      const temporalAnomalies = await this.detectTemporalAnomalies(entityId, entityType);
      anomalies.push(...temporalAnomalies);

      // Store anomalies
      for (const anomaly of anomalies) {
        await this.storeAnomaly(anomaly);
      }

      console.log('🚨 Anomaly detection completed:', {
        entityId,
        entityType,
        anomalies: anomalies.length,
        highSeverity: anomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length
      });

      return { success: true, anomalies };

    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Detection failed'
      };
    }
  }

  /**
   * Generate behavioral insights
   */
  async generateInsights(entityIds?: string[]): Promise<{ success: boolean; insights?: BehavioralInsight[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Behavioral analysis not initialized' };
      }

      const insights: BehavioralInsight[] = [];

      // Trend insights
      const trendInsights = await this.generateTrendInsights(entityIds);
      insights.push(...trendInsights);

      // Pattern insights
      const patternInsights = await this.generatePatternInsights(entityIds);
      insights.push(...patternInsights);

      // Correlation insights
      const correlationInsights = await this.generateCorrelationInsights(entityIds);
      insights.push(...correlationInsights);

      // Prediction insights
      const predictionInsights = await this.generatePredictionInsights(entityIds);
      insights.push(...predictionInsights);

      // Store insights
      for (const insight of insights) {
        await this.storeInsight(insight);
      }

      console.log('💡 Behavioral insights generated:', {
        total: insights.length,
        highImpact: insights.filter(i => i.impact === 'high').length
      });

      return { success: true, insights };

    } catch (error) {
      console.error('Insight generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Get behavioral profile for entity
   */
  async getBehavioralProfile(entityId: string, entityType: string): Promise<BehavioralProfile | null> {
    const profileKey = `${entityType}:${entityId}`;
    
    // Check memory cache
    if (this.profiles.has(profileKey)) {
      return this.profiles.get(profileKey)!;
    }

    // Load from database
    if (!this.db) return null;

    const result = await this.db.prepare(`
      SELECT * FROM behavioral_profiles 
      WHERE entity_id = ? AND entity_type = ?
    `).bind(entityId, entityType).first();

    if (!result) return null;

    const profile = this.mapRowToBehavioralProfile(result);
    this.profiles.set(profileKey, profile);
    
    return profile;
  }

  /**
   * Update behavioral profile
   */
  async updateBehavioralProfile(profile: BehavioralProfile): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Behavioral analysis not initialized' };
      }

      // Update in database
      await this.db.prepare(`
        INSERT OR REPLACE INTO behavioral_profiles (
          profile_id, entity_id, entity_type, baseline_metrics, current_metrics,
          risk_score, confidence, status, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        profile.profileId,
        profile.entityId,
        profile.entityType,
        JSON.stringify(profile.baselineMetrics),
        JSON.stringify(profile.currentMetrics),
        profile.riskScore,
        profile.confidence,
        profile.status,
        profile.lastUpdated
      ).run();

      // Update memory cache
      const profileKey = `${profile.entityType}:${profile.entityId}`;
      this.profiles.set(profileKey, profile);

      return { success: true };

    } catch (error) {
      console.error('Failed to update behavioral profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Get behavioral statistics
   */
  async getBehavioralStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Behavioral analysis not initialized' };
      }

      const profileStats = await this.db.prepare(`
        SELECT 
          entity_type,
          status,
          COUNT(*) as count,
          AVG(risk_score) as avg_risk_score,
          AVG(confidence) as avg_confidence
        FROM behavioral_profiles
        GROUP BY entity_type, status
      `).all();

      const anomalyStats = await this.db.prepare(`
        SELECT 
          anomaly_type,
          severity,
          COUNT(*) as count,
          AVG(confidence) as avg_confidence
        FROM anomaly_detections
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY anomaly_type, severity
      `).all();

      const eventStats = await this.db.prepare(`
        SELECT 
          entity_type,
          COUNT(*) as total_events,
          COUNT(CASE WHEN processed = TRUE THEN 1 END) as processed_events,
          AVG(anomaly_score) as avg_anomaly_score
        FROM behavioral_events
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY entity_type
      `).first();

      return {
        success: true,
        stats: {
          profiles: {
            total: this.profiles.size,
            byTypeAndStatus: profileStats.results || []
          },
          anomalies: {
            byTypeAndSeverity: anomalyStats.results || [],
            total: anomalyStats.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0
          },
          events: {
            totalEvents: eventStats?.total_events || 0,
            processedEvents: eventStats?.processed_events || 0,
            processingRate: eventStats?.total_events ? (eventStats.processed_events / eventStats.total_events * 100) : 0,
            avgAnomalyScore: Math.round((eventStats?.avg_anomaly_score || 0) * 100) / 100
          },
          queueSize: this.eventQueue.length
        }
      };

    } catch (error) {
      console.error('Failed to get behavioral statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Private helper methods

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    console.log('🔄 Processing behavioral event queue:', this.eventQueue.length);

    const eventsToProcess = this.eventQueue.splice(0, 50); // Process in batches

    for (const event of eventsToProcess) {
      try {
        await this.processEvent(event);
        
        // Mark as processed in database
        if (this.db) {
          await this.db.prepare(`
            UPDATE behavioral_events SET processed = TRUE WHERE id = ?
          `).bind(event.id).run();
        }

      } catch (error) {
        console.error('Failed to process event:', event.id, error);
      }
    }
  }

  private async processEvent(event: BehavioralEvent): Promise<void> {
    const profileKey = `${event.entityType}:${event.entityId}`;
    let profile = this.profiles.get(profileKey);

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await this.createBehavioralProfile(event.entityId, event.entityType);
      this.profiles.set(profileKey, profile);
    }

    // Update metrics based on event
    await this.updateMetricsFromEvent(profile, event);

    // Check for anomalies
    const anomalies = await this.checkEventForAnomalies(profile, event);
    
    // Update profile
    await this.updateBehavioralProfile(profile);

    // Store anomalies
    for (const anomaly of anomalies) {
      await this.storeAnomaly(anomaly);
    }
  }

  private async createBehavioralProfile(entityId: string, entityType: string): Promise<BehavioralProfile> {
    const profileId = this.generateProfileId(entityId, entityType);
    
    const profile: BehavioralProfile = {
      entityId,
      entityType,
      profileId,
      baselineMetrics: {},
      currentMetrics: {},
      riskScore: 0,
      confidence: 0,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'learning'
    };

    return profile;
  }

  private async updateMetricsFromEvent(profile: BehavioralProfile, event: BehavioralEvent): Promise<void> {
    const metrics = this.extractMetricsFromEvent(event);

    for (const [metricName, value] of Object.entries(metrics)) {
      if (!profile.currentMetrics[metricName]) {
        profile.currentMetrics[metricName] = this.initializeBehavioralMetric(metricName);
      }

      const metric = profile.currentMetrics[metricName];
      this.updateBehavioralMetric(metric, value);

      // Update baseline if in learning mode
      if (profile.status === 'learning' && metric.dataPoints >= this.config.minDataPoints) {
        this.updateBaseline(profile, metricName);
      }
    }

    // Calculate overall risk score
    profile.riskScore = this.calculateProfileRiskScore(profile);
    profile.confidence = this.calculateProfileConfidence(profile);
    profile.lastUpdated = new Date().toISOString();

    // Update status based on learning progress
    if (profile.status === 'learning' && this.hasCompletedLearning(profile)) {
      profile.status = 'active';
    }
  }

  private extractMetricsFromEvent(event: BehavioralEvent): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    switch (event.eventType) {
      case 'login':
        metrics.login_frequency = 1;
        metrics.login_hour = new Date(event.timestamp).getHours();
        metrics.login_day_of_week = new Date(event.timestamp).getDay();
        break;
        
      case 'page_view':
        metrics.page_views = 1;
        metrics.session_activity = 1;
        break;
        
      case 'risk_access':
        metrics.risk_interactions = 1;
        metrics.data_access = event.eventData.sensitivity || 1;
        break;
        
      case 'compliance_action':
        metrics.compliance_activity = 1;
        metrics.compliance_score = event.eventData.score || 0;
        break;
        
      case 'failed_login':
        metrics.failed_logins = 1;
        metrics.security_events = 1;
        break;
        
      case 'privilege_escalation':
        metrics.privilege_events = 1;
        metrics.security_risk = event.eventData.risk_level || 5;
        break;
        
      default:
        metrics.general_activity = 1;
    }

    return metrics;
  }

  private initializeBehavioralMetric(name: string): BehavioralMetric {
    return {
      name,
      value: 0,
      baseline: {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        percentiles: { P10: 0, P25: 0, P50: 0, P75: 0, P90: 0 }
      },
      trend: 'stable',
      anomalyScore: 0,
      dataPoints: 0
    };
  }

  private updateBehavioralMetric(metric: BehavioralMetric, newValue: number): void {
    metric.value = newValue;
    metric.dataPoints++;

    // Update baseline statistics
    if (metric.dataPoints === 1) {
      metric.baseline.min = newValue;
      metric.baseline.max = newValue;
      metric.baseline.mean = newValue;
    } else {
      metric.baseline.min = Math.min(metric.baseline.min, newValue);
      metric.baseline.max = Math.max(metric.baseline.max, newValue);
      
      // Update running statistics (simplified)
      const alpha = 0.1; // Exponential moving average factor
      metric.baseline.mean = metric.baseline.mean * (1 - alpha) + newValue * alpha;
    }

    // Calculate anomaly score
    if (metric.baseline.stdDev > 0) {
      metric.anomalyScore = Math.abs((newValue - metric.baseline.mean) / metric.baseline.stdDev);
    }
  }

  private updateBaseline(profile: BehavioralProfile, metricName: string): void {
    const metric = profile.currentMetrics[metricName];
    
    // Copy current to baseline when learning is complete
    profile.baselineMetrics[metricName] = {
      ...metric,
      baseline: { ...metric.baseline }
    };
  }

  private calculateProfileRiskScore(profile: BehavioralProfile): number {
    let totalRisk = 0;
    let metricCount = 0;

    for (const metric of Object.values(profile.currentMetrics)) {
      if (metric.anomalyScore > this.config.anomalyThresholds.statistical) {
        totalRisk += metric.anomalyScore * 2; // Weight anomalous metrics higher
      } else {
        totalRisk += metric.anomalyScore;
      }
      metricCount++;
    }

    return metricCount > 0 ? Math.min(10, totalRisk / metricCount) : 0;
  }

  private calculateProfileConfidence(profile: BehavioralProfile): number {
    const totalDataPoints = Object.values(profile.currentMetrics)
      .reduce((sum, metric) => sum + metric.dataPoints, 0);
    
    return Math.min(1, totalDataPoints / (this.config.minDataPoints * 5));
  }

  private hasCompletedLearning(profile: BehavioralProfile): boolean {
    const metricsWithSufficientData = Object.values(profile.currentMetrics)
      .filter(metric => metric.dataPoints >= this.config.minDataPoints);
    
    return metricsWithSufficientData.length >= 3; // At least 3 metrics with sufficient data
  }

  private async checkEventForAnomalies(profile: BehavioralProfile, event: BehavioralEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];
    const metrics = this.extractMetricsFromEvent(event);

    for (const [metricName, value] of Object.entries(metrics)) {
      const baseline = profile.baselineMetrics[metricName];
      if (!baseline || baseline.dataPoints < this.config.minDataPoints) continue;

      const zScore = Math.abs((value - baseline.baseline.mean) / (baseline.baseline.stdDev || 1));
      
      if (zScore > this.config.anomalyThresholds.statistical) {
        anomalies.push({
          id: this.generateAnomalyId(),
          entityId: event.entityId,
          anomalyType: 'statistical',
          severity: this.calculateAnomalySeverity(zScore),
          confidence: Math.min(0.99, zScore / 5),
          description: `${metricName} value ${value} deviates significantly from baseline (${baseline.baseline.mean.toFixed(2)})`,
          affectedMetrics: [metricName],
          detectionMethod: 'z-score',
          timestamp: event.timestamp,
          resolved: false,
          falsePositive: false
        });
      }
    }

    return anomalies;
  }

  private calculateAnomalySeverity(score: number): AnomalyDetection['severity'] {
    if (score > 4) return 'critical';
    if (score > 3) return 'high';
    if (score > 2) return 'medium';
    return 'low';
  }

  private async detectStatisticalAnomalies(profile: BehavioralProfile): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    for (const [metricName, metric] of Object.entries(profile.currentMetrics)) {
      const baseline = profile.baselineMetrics[metricName];
      if (!baseline || baseline.dataPoints < this.config.minDataPoints) continue;

      if (metric.anomalyScore > this.config.anomalyThresholds.statistical) {
        anomalies.push({
          id: this.generateAnomalyId(),
          entityId: profile.entityId,
          anomalyType: 'statistical',
          severity: this.calculateAnomalySeverity(metric.anomalyScore),
          confidence: Math.min(0.99, metric.anomalyScore / 5),
          description: `Statistical anomaly detected in ${metricName}`,
          affectedMetrics: [metricName],
          detectionMethod: 'statistical-analysis',
          timestamp: new Date().toISOString(),
          resolved: false,
          falsePositive: false
        });
      }
    }

    return anomalies;
  }

  private async detectPatternAnomalies(entityId: string, entityType: string): Promise<AnomalyDetection[]> {
    // Pattern-based anomaly detection would analyze sequences of events
    // For now, return empty array (implementation placeholder)
    return [];
  }

  private async detectBehavioralAnomalies(profile: BehavioralProfile): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    if (profile.riskScore > 7) {
      anomalies.push({
        id: this.generateAnomalyId(),
        entityId: profile.entityId,
        anomalyType: 'behavioral',
        severity: 'high',
        confidence: profile.confidence,
        description: `Behavioral risk score ${profile.riskScore.toFixed(2)} exceeds normal threshold`,
        affectedMetrics: Object.keys(profile.currentMetrics),
        detectionMethod: 'behavioral-scoring',
        timestamp: new Date().toISOString(),
        resolved: false,
        falsePositive: false
      });
    }

    return anomalies;
  }

  private async detectTemporalAnomalies(entityId: string, entityType: string): Promise<AnomalyDetection[]> {
    // Temporal anomaly detection would analyze time-based patterns
    // For now, return empty array (implementation placeholder)
    return [];
  }

  // Analysis helper methods

  private analyzeLoginPatterns(events: BehavioralEvent[]): UserBehaviorAnalysis['loginPatterns'] {
    const loginEvents = events.filter(e => e.eventType === 'login');
    
    const timeOfDay = new Array(24).fill(0);
    const dayOfWeek = new Array(7).fill(0);
    const locations = new Set<string>();
    const devices = new Set<string>();

    loginEvents.forEach(event => {
      const date = new Date(event.timestamp);
      timeOfDay[date.getHours()]++;
      dayOfWeek[date.getDay()]++;
      
      if (event.eventData.location) locations.add(event.eventData.location);
      if (event.eventData.device) devices.add(event.eventData.device);
    });

    return {
      timeOfDay,
      dayOfWeek,
      frequency: loginEvents.length,
      locations: Array.from(locations),
      devices: Array.from(devices)
    };
  }

  private async analyzeActivityPatterns(events: BehavioralEvent[]): Promise<UserBehaviorAnalysis['activityPatterns']> {
    const sessionDurations = events
      .filter(e => e.eventData.sessionDuration)
      .map(e => e.eventData.sessionDuration);

    const pageViews = events.filter(e => e.eventType === 'page_view').length;
    const dataAccess = events.filter(e => e.eventType === 'data_access').length;

    const actions: Record<string, BehavioralMetric> = {};
    events.forEach(event => {
      if (!actions[event.eventType]) {
        actions[event.eventType] = this.initializeBehavioralMetric(event.eventType);
      }
      this.updateBehavioralMetric(actions[event.eventType], 1);
    });

    return {
      sessionDuration: this.createMetricFromValues('sessionDuration', sessionDurations),
      pageViews: this.createMetricFromValue('pageViews', pageViews),
      actions,
      dataAccess: this.createMetricFromValue('dataAccess', dataAccess)
    };
  }

  private analyzeRiskBehaviors(events: BehavioralEvent[]): UserBehaviorAnalysis['riskBehaviors'] {
    const failedLogins = events.filter(e => e.eventType === 'failed_login').length;
    const privilegeEscalation = events.filter(e => e.eventType === 'privilege_escalation').length;
    const dataExfiltration = events.filter(e => e.eventType === 'data_exfiltration').length;
    const offHourAccess = events.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22; // Outside business hours
    }).length;

    return {
      failedLogins: this.createMetricFromValue('failedLogins', failedLogins),
      privilegeEscalation: this.createMetricFromValue('privilegeEscalation', privilegeEscalation),
      dataExfiltration: this.createMetricFromValue('dataExfiltration', dataExfiltration),
      offHourAccess: this.createMetricFromValue('offHourAccess', offHourAccess)
    };
  }

  private analyzeCollaborationPatterns(events: BehavioralEvent[]): UserBehaviorAnalysis['collaborationPatterns'] {
    const teamInteraction = events.filter(e => e.eventType === 'team_interaction').length;
    const documentSharing = events.filter(e => e.eventType === 'document_sharing').length;
    const communicationFrequency = events.filter(e => e.eventType === 'communication').length;

    return {
      teamInteraction: this.createMetricFromValue('teamInteraction', teamInteraction),
      documentSharing: this.createMetricFromValue('documentSharing', documentSharing),
      communicationFrequency: this.createMetricFromValue('communicationFrequency', communicationFrequency)
    };
  }

  private calculateUserRiskScore(analysis: UserBehaviorAnalysis): number {
    let riskScore = 0;
    
    // Risk behaviors contribute most to score
    riskScore += analysis.riskBehaviors.failedLogins.value * 2;
    riskScore += analysis.riskBehaviors.privilegeEscalation.value * 5;
    riskScore += analysis.riskBehaviors.dataExfiltration.value * 10;
    riskScore += analysis.riskBehaviors.offHourAccess.value * 0.5;
    
    // Activity patterns can indicate suspicious behavior
    if (analysis.activityPatterns.sessionDuration.value > 12) riskScore += 2; // Unusually long sessions
    if (analysis.activityPatterns.dataAccess.value > 100) riskScore += 1; // High data access
    
    return Math.min(10, riskScore);
  }

  private createMetricFromValue(name: string, value: number): BehavioralMetric {
    const metric = this.initializeBehavioralMetric(name);
    this.updateBehavioralMetric(metric, value);
    return metric;
  }

  private createMetricFromValues(name: string, values: number[]): BehavioralMetric {
    const metric = this.initializeBehavioralMetric(name);
    
    if (values.length > 0) {
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      
      metric.value = mean;
      metric.baseline.mean = mean;
      metric.baseline.stdDev = Math.sqrt(variance);
      metric.baseline.min = Math.min(...values);
      metric.baseline.max = Math.max(...values);
      metric.dataPoints = values.length;
    }
    
    return metric;
  }

  // Insight generation methods

  private async generateTrendInsights(entityIds?: string[]): Promise<BehavioralInsight[]> {
    // Generate insights about trending behaviors
    return [];
  }

  private async generatePatternInsights(entityIds?: string[]): Promise<BehavioralInsight[]> {
    // Generate insights about behavioral patterns
    return [];
  }

  private async generateCorrelationInsights(entityIds?: string[]): Promise<BehavioralInsight[]> {
    // Generate insights about correlated behaviors
    return [];
  }

  private async generatePredictionInsights(entityIds?: string[]): Promise<BehavioralInsight[]> {
    // Generate predictive insights
    return [];
  }

  // Database helper methods

  private async getUserEvents(userId: number, periodDays: number): Promise<BehavioralEvent[]> {
    if (!this.db) return [];

    const result = await this.db.prepare(`
      SELECT * FROM behavioral_events
      WHERE entity_id = ? AND entity_type = 'user'
      AND timestamp >= datetime('now', '-${periodDays} days')
      ORDER BY timestamp DESC
    `).bind(userId.toString()).all();

    return result.results?.map((row: any) => this.mapRowToBehavioralEvent(row)) || [];
  }

  private async storeEvent(event: BehavioralEvent): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT INTO behavioral_events (
        id, entity_id, entity_type, event_type, event_data,
        timestamp, processed, anomaly_score, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.entityId,
      event.entityType,
      event.eventType,
      JSON.stringify(event.eventData),
      event.timestamp,
      event.processed ? 1 : 0,
      event.anomalyScore,
      event.riskLevel
    ).run();
  }

  private async storeAnomaly(anomaly: AnomalyDetection): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT INTO anomaly_detections (
        id, entity_id, anomaly_type, severity, confidence,
        description, affected_metrics, detection_method, timestamp,
        resolved, false_positive, investigation_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      anomaly.id,
      anomaly.entityId,
      anomaly.anomalyType,
      anomaly.severity,
      anomaly.confidence,
      anomaly.description,
      JSON.stringify(anomaly.affectedMetrics),
      anomaly.detectionMethod,
      anomaly.timestamp,
      anomaly.resolved ? 1 : 0,
      anomaly.falsePositive ? 1 : 0,
      anomaly.investigationNotes
    ).run();
  }

  private async storeInsight(insight: BehavioralInsight): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT INTO behavioral_insights (
        type, title, description, confidence, impact,
        recommendation, affected_entities, supporting_data, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      insight.type,
      insight.title,
      insight.description,
      insight.confidence,
      insight.impact,
      insight.recommendation,
      JSON.stringify(insight.affectedEntities),
      JSON.stringify(insight.supportingData),
      insight.timestamp
    ).run();
  }

  private async loadBehavioralProfiles(): Promise<void> {
    if (!this.db) return;

    const result = await this.db.prepare(`
      SELECT * FROM behavioral_profiles
    `).all();

    for (const row of result.results || []) {
      const profile = this.mapRowToBehavioralProfile(row);
      const profileKey = `${profile.entityType}:${profile.entityId}`;
      this.profiles.set(profileKey, profile);
    }
  }

  private mapRowToBehavioralProfile(row: any): BehavioralProfile {
    return {
      profileId: row.profile_id,
      entityId: row.entity_id,
      entityType: row.entity_type,
      baselineMetrics: JSON.parse(row.baseline_metrics),
      currentMetrics: JSON.parse(row.current_metrics),
      riskScore: row.risk_score,
      confidence: row.confidence,
      status: row.status,
      lastUpdated: row.last_updated,
      createdAt: row.created_at
    };
  }

  private mapRowToBehavioralEvent(row: any): BehavioralEvent {
    return {
      id: row.id,
      entityId: row.entity_id,
      entityType: row.entity_type,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data),
      timestamp: row.timestamp,
      processed: Boolean(row.processed),
      anomalyScore: row.anomaly_score,
      riskLevel: row.risk_level
    };
  }

  private startEventProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.processEventQueue();
      }
    }, this.config.updateIntervalMinutes * 60 * 1000);
  }

  // ID generation helpers

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateProfileId(entityId: string, entityType: string): string {
    return `prof_${entityType}_${entityId}_${Date.now()}`;
  }

  private generateAnomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export helper functions for behavioral analysis integration
export const BehavioralHelpers = {
  /**
   * Create login event
   */
  createLoginEvent: (userId: number, location?: string, device?: string): Omit<BehavioralEvent, 'id' | 'processed'> => ({
    entityId: userId.toString(),
    entityType: 'user',
    eventType: 'login',
    eventData: { location, device },
    timestamp: new Date().toISOString()
  }),

  /**
   * Create failed login event
   */
  createFailedLoginEvent: (userId: number, reason?: string): Omit<BehavioralEvent, 'id' | 'processed'> => ({
    entityId: userId.toString(),
    entityType: 'user',
    eventType: 'failed_login',
    eventData: { reason },
    timestamp: new Date().toISOString(),
    riskLevel: 'medium'
  }),

  /**
   * Create risk access event
   */
  createRiskAccessEvent: (userId: number, riskId: number, action: string): Omit<BehavioralEvent, 'id' | 'processed'> => ({
    entityId: userId.toString(),
    entityType: 'user',
    eventType: 'risk_access',
    eventData: { riskId, action, sensitivity: 3 },
    timestamp: new Date().toISOString()
  }),

  /**
   * Create privilege escalation event
   */
  createPrivilegeEscalationEvent: (userId: number, fromRole: string, toRole: string): Omit<BehavioralEvent, 'id' | 'processed'> => ({
    entityId: userId.toString(),
    entityType: 'user',
    eventType: 'privilege_escalation',
    eventData: { fromRole, toRole, risk_level: 7 },
    timestamp: new Date().toISOString(),
    riskLevel: 'high'
  }),

  /**
   * Classify risk level based on anomaly score
   */
  classifyRiskLevel: (anomalyScore: number): BehavioralEvent['riskLevel'] => {
    if (anomalyScore > 4) return 'critical';
    if (anomalyScore > 3) return 'high';
    if (anomalyScore > 2) return 'medium';
    return 'low';
  }
};