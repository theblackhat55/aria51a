/**
 * Machine Learning Analytics Service
 * 
 * Provides advanced analytics capabilities including:
 * - Risk prediction models using statistical analysis
 * - Trend analysis and forecasting
 * - Anomaly detection for security events
 * - Predictive compliance gap analysis
 */

export interface RiskPredictionModel {
  id: string;
  name: string;
  type: 'risk_likelihood' | 'impact_assessment' | 'compliance_prediction' | 'threat_analysis';
  algorithm: 'linear_regression' | 'decision_tree' | 'random_forest' | 'neural_network';
  accuracy: number;
  confidence_interval: number;
  last_trained: string;
  training_data_size: number;
  features: string[];
  hyperparameters: Record<string, any>;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  probability_distribution: Record<string, number>;
  contributing_factors: Array<{
    factor: string;
    importance: number;
    impact: 'positive' | 'negative';
  }>;
  recommendations: string[];
  model_used: string;
  prediction_date: string;
}

export interface TrendAnalysis {
  metric: string;
  time_period: string;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  r_squared: number;
  seasonal_pattern: boolean;
  anomalies: Array<{
    date: string;
    value: number;
    expected_value: number;
    deviation_score: number;
  }>;
  forecast: Array<{
    date: string;
    predicted_value: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
}

export interface ComplianceGapPrediction {
  framework: string;
  control_id: string;
  current_status: 'compliant' | 'non_compliant' | 'partial';
  predicted_status: 'compliant' | 'non_compliant' | 'partial';
  risk_of_failure: number;
  time_to_failure: number; // days
  required_actions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    effort_estimate: number; // hours
    success_probability: number;
  }>;
  cost_of_inaction: number;
}

export class MLAnalyticsService {
  constructor(private db: D1Database) {}

  /**
   * Initialize ML analytics tables
   */
  async initializeTables(): Promise<void> {
    // ML Models table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ml_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        accuracy REAL DEFAULT 0.0,
        confidence_interval REAL DEFAULT 0.95,
        last_trained DATETIME DEFAULT CURRENT_TIMESTAMP,
        training_data_size INTEGER DEFAULT 0,
        features TEXT, -- JSON array
        hyperparameters TEXT, -- JSON object
        model_data TEXT, -- Serialized model parameters
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Predictions table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ml_predictions (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        entity_type TEXT NOT NULL, -- 'risk', 'asset', 'compliance', etc.
        entity_id TEXT NOT NULL,
        prediction_value REAL NOT NULL,
        confidence REAL NOT NULL,
        prediction_data TEXT, -- JSON object with full prediction details
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (model_id) REFERENCES ml_models(id)
      )
    `).run();

    // Trend Analysis table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS trend_analysis (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        time_period TEXT NOT NULL,
        trend_data TEXT NOT NULL, -- JSON object with trend analysis
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Anomaly Detection table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS anomaly_detection (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        anomaly_score REAL NOT NULL,
        threshold REAL NOT NULL,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        severity TEXT DEFAULT 'medium',
        resolved BOOLEAN DEFAULT FALSE
      )
    `).run();

    // Create indexes
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_ml_predictions_entity ON ml_predictions(entity_type, entity_id)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_anomaly_entity ON anomaly_detection(entity_type, entity_id)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON anomaly_detection(severity, resolved)`).run();

    // Initialize default models
    await this.initializeDefaultModels();
  }

  /**
   * Initialize default ML models
   */
  private async initializeDefaultModels(): Promise<void> {
    const defaultModels = [
      {
        id: 'risk_likelihood_predictor',
        name: 'Risk Likelihood Predictor',
        type: 'risk_likelihood',
        algorithm: 'random_forest',
        features: ['asset_type', 'vulnerability_count', 'patch_level', 'exposure_score', 'historical_incidents']
      },
      {
        id: 'compliance_gap_analyzer',
        name: 'Compliance Gap Analyzer', 
        type: 'compliance_prediction',
        algorithm: 'decision_tree',
        features: ['control_maturity', 'evidence_quality', 'testing_frequency', 'resource_allocation']
      },
      {
        id: 'threat_impact_assessor',
        name: 'Threat Impact Assessor',
        type: 'threat_analysis',
        algorithm: 'neural_network',
        features: ['threat_category', 'asset_criticality', 'attack_vector', 'organization_size', 'industry_sector']
      },
      {
        id: 'incident_severity_predictor',
        name: 'Incident Severity Predictor',
        type: 'impact_assessment',
        algorithm: 'linear_regression',
        features: ['incident_type', 'affected_systems', 'business_impact', 'detection_time', 'response_time']
      }
    ];

    for (const model of defaultModels) {
      await this.db.prepare(`
        INSERT OR IGNORE INTO ml_models (id, name, type, algorithm, features, accuracy)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        model.id,
        model.name,
        model.type,
        model.algorithm,
        JSON.stringify(model.features),
        0.85 // Default accuracy for demonstration
      ).run();
    }
  }

  /**
   * Predict risk likelihood using ML models
   */
  async predictRiskLikelihood(riskData: {
    asset_type: string;
    vulnerability_count: number;
    patch_level: number;
    exposure_score: number;
    historical_incidents: number;
  }): Promise<PredictionResult> {
    // Simulate ML prediction using weighted scoring
    const weights = {
      vulnerability_count: 0.3,
      exposure_score: 0.25,
      patch_level: -0.2, // Negative weight (higher patch level = lower risk)
      historical_incidents: 0.15,
      asset_type_multiplier: this.getAssetTypeMultiplier(riskData.asset_type)
    };

    // Calculate base score (0-1)
    const baseScore = Math.min(1, Math.max(0,
      (riskData.vulnerability_count / 10) * weights.vulnerability_count +
      (riskData.exposure_score / 10) * weights.exposure_score +
      (1 - riskData.patch_level / 10) * Math.abs(weights.patch_level) +
      (riskData.historical_incidents / 5) * weights.historical_incidents
    )) * weights.asset_type_multiplier;

    // Convert to 1-5 scale
    const prediction = Math.ceil(baseScore * 5);
    const confidence = 0.85 + Math.random() * 0.1; // Simulate model confidence

    // Determine contributing factors
    const contributingFactors = [
      {
        factor: 'Vulnerability Count',
        importance: riskData.vulnerability_count * 0.1,
        impact: riskData.vulnerability_count > 5 ? 'negative' : 'positive' as 'negative' | 'positive'
      },
      {
        factor: 'Exposure Score',
        importance: riskData.exposure_score * 0.1,
        impact: riskData.exposure_score > 7 ? 'negative' : 'positive' as 'negative' | 'positive'
      },
      {
        factor: 'Patch Level',
        importance: (10 - riskData.patch_level) * 0.1,
        impact: riskData.patch_level < 7 ? 'negative' : 'positive' as 'negative' | 'positive'
      }
    ];

    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(riskData, prediction);

    const result: PredictionResult = {
      prediction,
      confidence,
      probability_distribution: {
        'Very Low (1)': prediction === 1 ? confidence : (1 - confidence) / 4,
        'Low (2)': prediction === 2 ? confidence : (1 - confidence) / 4,
        'Medium (3)': prediction === 3 ? confidence : (1 - confidence) / 4,
        'High (4)': prediction === 4 ? confidence : (1 - confidence) / 4,
        'Critical (5)': prediction === 5 ? confidence : (1 - confidence) / 4
      },
      contributing_factors: contributingFactors,
      recommendations,
      model_used: 'risk_likelihood_predictor',
      prediction_date: new Date().toISOString()
    };

    // Store prediction
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await this.db.prepare(`
      INSERT INTO ml_predictions (id, model_id, entity_type, entity_id, prediction_value, confidence, prediction_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      predictionId,
      'risk_likelihood_predictor',
      'risk',
      `risk_${Date.now()}`,
      prediction,
      confidence,
      JSON.stringify(result)
    ).run();

    return result;
  }

  /**
   * Analyze trends in risk metrics
   */
  async analyzeTrends(metric: string, timeRange: '30d' | '90d' | '1y' = '90d'): Promise<TrendAnalysis> {
    // Simulate trend analysis with sample data
    const dataPoints = this.generateSampleTrendData(metric, timeRange);
    
    // Calculate linear regression
    const regression = this.calculateLinearRegression(dataPoints);
    
    // Detect anomalies
    const anomalies = this.detectStatisticalAnomalies(dataPoints);
    
    // Generate forecast
    const forecast = this.generateForecast(dataPoints, 30); // 30 days forecast

    const trendAnalysis: TrendAnalysis = {
      metric,
      time_period: timeRange,
      trend_direction: regression.slope > 0.1 ? 'increasing' : 
                      regression.slope < -0.1 ? 'decreasing' : 
                      this.calculateVolatility(dataPoints) > 0.3 ? 'volatile' : 'stable',
      slope: regression.slope,
      r_squared: regression.rSquared,
      seasonal_pattern: this.detectSeasonality(dataPoints),
      anomalies,
      forecast
    };

    // Store trend analysis
    const analysisId = `trend_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await this.db.prepare(`
      INSERT INTO trend_analysis (id, metric_name, time_period, trend_data)
      VALUES (?, ?, ?, ?)
    `).bind(analysisId, metric, timeRange, JSON.stringify(trendAnalysis)).run();

    return trendAnalysis;
  }

  /**
   * Predict compliance gaps
   */
  async predictComplianceGaps(frameworkId: string): Promise<ComplianceGapPrediction[]> {
    // Sample compliance controls for demonstration
    const controls = [
      { id: 'AC-1', name: 'Access Control Policy', current_maturity: 3 },
      { id: 'AC-2', name: 'Account Management', current_maturity: 4 },
      { id: 'IA-1', name: 'Identification and Authentication Policy', current_maturity: 2 },
      { id: 'SC-1', name: 'System and Communications Protection Policy', current_maturity: 3 },
      { id: 'SI-1', name: 'System and Information Integrity Policy', current_maturity: 4 }
    ];

    const predictions: ComplianceGapPrediction[] = [];

    for (const control of controls) {
      // Simulate ML prediction for compliance gap
      const riskFactors = {
        maturity_gap: 5 - control.current_maturity,
        resource_availability: Math.random() * 10,
        complexity: Math.random() * 10,
        regulatory_pressure: Math.random() * 10
      };

      const riskOfFailure = Math.min(1, 
        (riskFactors.maturity_gap * 0.3 + 
         (10 - riskFactors.resource_availability) * 0.25 + 
         riskFactors.complexity * 0.25 + 
         riskFactors.regulatory_pressure * 0.2) / 10
      );

      const timeToFailure = Math.max(30, 365 * (1 - riskOfFailure));

      const prediction: ComplianceGapPrediction = {
        framework: frameworkId,
        control_id: control.id,
        current_status: control.current_maturity >= 4 ? 'compliant' : 
                       control.current_maturity >= 2 ? 'partial' : 'non_compliant',
        predicted_status: riskOfFailure > 0.7 ? 'non_compliant' : 
                         riskOfFailure > 0.3 ? 'partial' : 'compliant',
        risk_of_failure: riskOfFailure,
        time_to_failure: Math.floor(timeToFailure),
        required_actions: this.generateComplianceActions(control.id, riskOfFailure),
        cost_of_inaction: riskOfFailure * 100000 // Estimated cost in dollars
      };

      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Detect anomalies in system metrics
   */
  async detectAnomalies(entityType: string, entityId: string, metrics: Record<string, number>): Promise<void> {
    for (const [metricName, value] of Object.entries(metrics)) {
      // Get historical data for this metric
      const historicalData = await this.getHistoricalMetrics(entityType, entityId, metricName);
      
      if (historicalData.length > 10) {
        const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
        const stdDev = Math.sqrt(
          historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length
        );

        // Z-score based anomaly detection
        const zScore = Math.abs((value - mean) / stdDev);
        const threshold = 2.5; // Standard threshold for anomaly detection

        if (zScore > threshold) {
          const anomalyId = `anomaly_${Date.now()}_${Math.random().toString(36).substring(2)}`;
          const severity = zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low';

          await this.db.prepare(`
            INSERT INTO anomaly_detection (id, entity_type, entity_id, metric_name, anomaly_score, threshold, severity, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            anomalyId,
            entityType,
            entityId,
            metricName,
            zScore,
            threshold,
            severity,
            `Anomalous ${metricName} value detected: ${value} (${zScore.toFixed(2)} standard deviations from mean)`
          ).run();
        }
      }
    }
  }

  /**
   * Get ML model performance metrics
   */
  async getModelMetrics(): Promise<any> {
    const models = await this.db.prepare(`
      SELECT * FROM ml_models WHERE is_active = TRUE
    `).all();

    const predictions = await this.db.prepare(`
      SELECT model_id, COUNT(*) as prediction_count, AVG(confidence) as avg_confidence
      FROM ml_predictions
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY model_id
    `).all();

    const anomalies = await this.db.prepare(`
      SELECT COUNT(*) as total_anomalies, 
             COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
             COUNT(CASE WHEN resolved = TRUE THEN 1 END) as resolved
      FROM anomaly_detection
      WHERE detected_at > datetime('now', '-30 days')
    `).first();

    return {
      models: models.results,
      recent_predictions: predictions.results,
      anomaly_stats: anomalies,
      model_performance: {
        total_models: models.results?.length || 0,
        active_models: models.results?.filter((m: any) => m.is_active).length || 0,
        avg_accuracy: models.results?.reduce((sum: number, m: any) => sum + m.accuracy, 0) / (models.results?.length || 1) || 0
      }
    };
  }

  // Helper methods
  private getAssetTypeMultiplier(assetType: string): number {
    const multipliers: Record<string, number> = {
      'server': 1.2,
      'workstation': 0.8,
      'mobile': 1.0,
      'network': 1.3,
      'iot': 1.1
    };
    return multipliers[assetType.toLowerCase()] || 1.0;
  }

  private generateRiskRecommendations(riskData: any, prediction: number): string[] {
    const recommendations: string[] = [];

    if (riskData.vulnerability_count > 5) {
      recommendations.push('Prioritize vulnerability patching - high vulnerability count detected');
    }
    if (riskData.patch_level < 7) {
      recommendations.push('Improve patch management - system patches are behind schedule');
    }
    if (riskData.exposure_score > 7) {
      recommendations.push('Reduce network exposure - implement network segmentation');
    }
    if (prediction >= 4) {
      recommendations.push('Implement immediate risk mitigation controls');
      recommendations.push('Schedule enhanced monitoring for this asset');
    }

    return recommendations;
  }

  private generateSampleTrendData(metric: string, timeRange: string): Array<{date: string; value: number}> {
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data: Array<{date: string; value: number}> = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseValue = 50 + Math.sin(i / 10) * 10 + Math.random() * 20;
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue)
      });
    }
    
    return data;
  }

  private calculateLinearRegression(data: Array<{date: string; value: number}>): {slope: number; rSquared: number} {
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, i) => sum + i * point.value, 0);
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared
    const meanY = sumY / n;
    const totalSumSquares = data.reduce((sum, point) => sum + Math.pow(point.value - meanY, 2), 0);
    const residualSumSquares = data.reduce((sum, point, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n;
      return sum + Math.pow(point.value - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    return { slope, rSquared };
  }

  private detectStatisticalAnomalies(data: Array<{date: string; value: number}>): Array<{
    date: string; value: number; expected_value: number; deviation_score: number;
  }> {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    return data
      .map(point => ({
        date: point.date,
        value: point.value,
        expected_value: mean,
        deviation_score: Math.abs(point.value - mean) / stdDev
      }))
      .filter(point => point.deviation_score > 2);
  }

  private generateForecast(data: Array<{date: string; value: number}>, days: number): Array<{
    date: string; predicted_value: number; confidence_lower: number; confidence_upper: number;
  }> {
    const regression = this.calculateLinearRegression(data);
    const lastDate = new Date(data[data.length - 1].date);
    const forecast = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const predicted = regression.slope * (data.length + i - 1) + 
                       (data.reduce((sum, p) => sum + p.value, 0) / data.length);
      
      const confidence = Math.abs(predicted * 0.1); // 10% confidence interval
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_value: Math.max(0, predicted),
        confidence_lower: Math.max(0, predicted - confidence),
        confidence_upper: predicted + confidence
      });
    }

    return forecast;
  }

  private calculateVolatility(data: Array<{date: string; value: number}>): number {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private detectSeasonality(data: Array<{date: string; value: number}>): boolean {
    // Simple seasonality detection - check for weekly patterns
    if (data.length < 14) return false;
    
    const weeklyCorrelation = this.calculateAutocorrelation(data.map(d => d.value), 7);
    return Math.abs(weeklyCorrelation) > 0.3;
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length < lag * 2) return 0;
    
    const n = values.length - lag;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateComplianceActions(controlId: string, riskLevel: number): Array<{
    action: string; priority: 'high' | 'medium' | 'low'; effort_estimate: number; success_probability: number;
  }> {
    const baseActions = [
      { action: 'Review and update control documentation', effort: 8, base_probability: 0.9 },
      { action: 'Conduct control effectiveness testing', effort: 16, base_probability: 0.8 },
      { action: 'Implement additional control measures', effort: 40, base_probability: 0.7 },
      { action: 'Provide staff training on control procedures', effort: 24, base_probability: 0.85 }
    ];

    return baseActions.map(action => ({
      action: action.action,
      priority: riskLevel > 0.7 ? 'high' : riskLevel > 0.4 ? 'medium' : 'low',
      effort_estimate: action.effort,
      success_probability: Math.max(0.5, action.base_probability - riskLevel * 0.2)
    }));
  }

  private async getHistoricalMetrics(entityType: string, entityId: string, metricName: string): Promise<number[]> {
    // This would typically query historical metrics from the database
    // For now, return sample data
    return Array.from({ length: 30 }, () => 50 + Math.random() * 40);
  }
}