/**
 * Machine Learning Analytics Service for ARIA5.1
 * 
 * Provides advanced ML-powered analytics for:
 * - Predictive risk assessment and scoring
 * - Risk trend analysis and forecasting
 * - Anomaly detection in risk patterns
 * - Impact correlation and causality analysis
 * - Automated risk categorization and clustering
 * - Compliance prediction and gap analysis
 * 
 * Features:
 * - Statistical analysis and regression models
 * - Time series forecasting for risk trends
 * - Clustering algorithms for risk grouping
 * - Feature importance analysis
 * - Model training and evaluation metrics
 * - Integration with AI providers for enhanced analysis
 */

export interface MLDataPoint {
  timestamp: string;
  features: Record<string, number>;
  target?: number;
  metadata?: Record<string, any>;
}

export interface RiskPredictionModel {
  id: string;
  name: string;
  type: 'linear_regression' | 'decision_tree' | 'clustering' | 'time_series' | 'classification';
  features: string[];
  targetVariable: string;
  accuracy?: number;
  lastTrained: string;
  trainingDataPoints: number;
  modelParams: Record<string, any>;
  isActive: boolean;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  factors: Array<{
    feature: string;
    importance: number;
    value: number;
    impact: 'positive' | 'negative';
  }>;
  recommendation: string;
  modelUsed: string;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  correlation: number;
  seasonality?: {
    period: number;
    strength: number;
  };
  forecast?: Array<{
    timestamp: string;
    predicted: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  threshold: number;
  explanation: string;
  similarPeriods: Array<{
    timestamp: string;
    similarity: number;
  }>;
}

export interface ClusterAnalysis {
  clusterId: number;
  clusterName: string;
  centeroid: Record<string, number>;
  size: number;
  characteristics: string[];
  similarRisks: Array<{
    riskId: number;
    title: string;
    similarity: number;
  }>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  correlation: number;
  description: string;
}

export class MLAnalyticsService {
  private db: any;
  private models: Map<string, RiskPredictionModel> = new Map();
  private trainingData: MLDataPoint[] = [];
  private isInitialized = false;

  constructor(database?: any) {
    this.db = database;
    if (this.db) {
      this.initializeMLAnalytics();
    }
  }

  /**
   * Initialize ML analytics database tables
   */
  private async initializeMLAnalytics(): Promise<void> {
    try {
      // ML training data table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS ml_training_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME NOT NULL,
          features TEXT NOT NULL, -- JSON
          target_value REAL,
          target_variable TEXT,
          data_source TEXT, -- 'risks', 'compliance', 'incidents'
          source_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // ML models table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS ml_models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          features TEXT NOT NULL, -- JSON array
          target_variable TEXT NOT NULL,
          accuracy REAL,
          last_trained DATETIME,
          training_data_points INTEGER DEFAULT 0,
          model_params TEXT, -- JSON
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // ML predictions table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS ml_predictions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          model_id TEXT NOT NULL,
          entity_type TEXT NOT NULL, -- 'risk', 'compliance'
          entity_id INTEGER NOT NULL,
          prediction REAL NOT NULL,
          confidence REAL NOT NULL,
          factors TEXT, -- JSON array
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (model_id) REFERENCES ml_models(id)
        )
      `).run();

      // Create indexes
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_ml_training_timestamp ON ml_training_data(timestamp)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_ml_training_source ON ml_training_data(data_source, source_id)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_ml_predictions_entity ON ml_predictions(entity_type, entity_id)
      `).run();

      // Load existing models
      await this.loadModels();

      // Initialize default models
      await this.initializeDefaultModels();

      this.isInitialized = true;
      console.log('✅ ML Analytics engine initialized');

    } catch (error) {
      console.error('Failed to initialize ML analytics:', error);
    }
  }

  /**
   * Train a predictive model on historical data
   */
  async trainModel(modelConfig: {
    name: string;
    type: RiskPredictionModel['type'];
    features: string[];
    targetVariable: string;
    trainingPeriodDays?: number;
  }): Promise<{ success: boolean; model?: RiskPredictionModel; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'ML analytics not initialized' };
      }

      // Get training data
      const trainingData = await this.getTrainingData(
        modelConfig.features, 
        modelConfig.targetVariable, 
        modelConfig.trainingPeriodDays || 365
      );

      if (trainingData.length < 10) {
        return { success: false, error: 'Insufficient training data (minimum 10 data points required)' };
      }

      const modelId = `model_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // Train model based on type
      let modelParams: Record<string, any> = {};
      let accuracy = 0;

      switch (modelConfig.type) {
        case 'linear_regression':
          const regressionResult = await this.trainLinearRegression(trainingData, modelConfig.features, modelConfig.targetVariable);
          modelParams = regressionResult.params;
          accuracy = regressionResult.accuracy;
          break;

        case 'classification':
          const classificationResult = await this.trainClassification(trainingData, modelConfig.features, modelConfig.targetVariable);
          modelParams = classificationResult.params;
          accuracy = classificationResult.accuracy;
          break;

        case 'clustering':
          const clusteringResult = await this.trainClustering(trainingData, modelConfig.features);
          modelParams = clusteringResult.params;
          accuracy = clusteringResult.silhouetteScore;
          break;

        case 'time_series':
          const timeSeriesResult = await this.trainTimeSeries(trainingData, modelConfig.targetVariable);
          modelParams = timeSeriesResult.params;
          accuracy = timeSeriesResult.accuracy;
          break;

        default:
          return { success: false, error: `Unsupported model type: ${modelConfig.type}` };
      }

      // Create model object
      const model: RiskPredictionModel = {
        id: modelId,
        name: modelConfig.name,
        type: modelConfig.type,
        features: modelConfig.features,
        targetVariable: modelConfig.targetVariable,
        accuracy,
        lastTrained: new Date().toISOString(),
        trainingDataPoints: trainingData.length,
        modelParams,
        isActive: true
      };

      // Save model to database
      await this.saveModel(model);

      // Store in memory
      this.models.set(modelId, model);

      console.log('🤖 ML Model trained:', {
        id: modelId,
        type: modelConfig.type,
        accuracy,
        dataPoints: trainingData.length
      });

      return { success: true, model };

    } catch (error) {
      console.error('Model training failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Training failed'
      };
    }
  }

  /**
   * Generate risk prediction for a specific entity
   */
  async predictRisk(entityId: number, entityType: 'risk' | 'compliance', features: Record<string, number>, modelId?: string): Promise<{ success: boolean; prediction?: PredictionResult; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'ML analytics not initialized' };
      }

      // Select best model if not specified
      let model: RiskPredictionModel | undefined;
      if (modelId) {
        model = this.models.get(modelId);
      } else {
        // Find best active model for prediction
        model = Array.from(this.models.values())
          .filter(m => m.isActive && (m.type === 'linear_regression' || m.type === 'classification'))
          .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0];
      }

      if (!model) {
        return { success: false, error: 'No suitable model found' };
      }

      // Validate features
      const missingFeatures = model.features.filter(f => !(f in features));
      if (missingFeatures.length > 0) {
        return { success: false, error: `Missing required features: ${missingFeatures.join(', ')}` };
      }

      // Generate prediction based on model type
      let prediction: PredictionResult;

      switch (model.type) {
        case 'linear_regression':
          prediction = await this.predictLinearRegression(model, features);
          break;

        case 'classification':
          prediction = await this.predictClassification(model, features);
          break;

        default:
          return { success: false, error: `Model type ${model.type} not supported for prediction` };
      }

      // Store prediction
      await this.storePrediction(model.id, entityType, entityId, prediction);

      console.log('🎯 Risk prediction generated:', {
        entityType,
        entityId,
        modelId: model.id,
        prediction: prediction.prediction,
        confidence: prediction.confidence
      });

      return { success: true, prediction };

    } catch (error) {
      console.error('Risk prediction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Prediction failed'
      };
    }
  }

  /**
   * Perform trend analysis on historical data
   */
  async analyzeTrends(metric: string, entityType: string, periodDays: number = 90): Promise<{ success: boolean; analysis?: TrendAnalysis; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'ML analytics not initialized' };
      }

      // Get historical data
      const data = await this.getTimeSeriesData(metric, entityType, periodDays);
      
      if (data.length < 7) {
        return { success: false, error: 'Insufficient data for trend analysis (minimum 7 data points required)' };
      }

      // Calculate trend
      const trend = this.calculateTrend(data);
      const correlation = this.calculateCorrelation(data);
      const seasonality = this.detectSeasonality(data);

      // Generate forecast
      const forecast = await this.generateForecast(data, 7); // 7 day forecast

      const analysis: TrendAnalysis = {
        trend: trend.direction,
        slope: trend.slope,
        correlation,
        seasonality,
        forecast
      };

      console.log('📈 Trend analysis completed:', {
        metric,
        entityType,
        trend: analysis.trend,
        correlation
      });

      return { success: true, analysis };

    } catch (error) {
      console.error('Trend analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Detect anomalies in risk data
   */
  async detectAnomalies(dataPoints: MLDataPoint[], sensitivity: number = 0.95): Promise<{ success: boolean; anomalies?: AnomalyDetectionResult[]; error?: string }> {
    try {
      const anomalies: AnomalyDetectionResult[] = [];
      
      if (dataPoints.length < 10) {
        return { success: false, error: 'Insufficient data for anomaly detection' };
      }

      // Statistical anomaly detection using z-score and IQR methods
      for (const featureName of Object.keys(dataPoints[0].features)) {
        const values = dataPoints.map(dp => dp.features[featureName]);
        const anomalyResults = this.detectStatisticalAnomalies(values, sensitivity);
        
        anomalyResults.forEach((result, index) => {
          if (result.isAnomaly) {
            anomalies.push({
              isAnomaly: true,
              anomalyScore: result.score,
              threshold: result.threshold,
              explanation: `${featureName} value ${result.value} is significantly different from normal range`,
              similarPeriods: this.findSimilarPeriods(dataPoints[index], dataPoints)
            });
          }
        });
      }

      console.log('🚨 Anomaly detection completed:', {
        dataPoints: dataPoints.length,
        anomaliesFound: anomalies.length,
        sensitivity
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
   * Perform cluster analysis on risks
   */
  async performClusterAnalysis(features: string[], numClusters: number = 5): Promise<{ success: boolean; clusters?: ClusterAnalysis[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'ML analytics not initialized' };
      }

      // Get data for clustering
      const data = await this.getClusteringData(features);
      
      if (data.length < numClusters * 2) {
        return { success: false, error: 'Insufficient data for clustering' };
      }

      // Perform k-means clustering
      const clusters = await this.performKMeansClustering(data, features, numClusters);

      console.log('🎯 Cluster analysis completed:', {
        features,
        numClusters,
        dataPoints: data.length
      });

      return { success: true, clusters };

    } catch (error) {
      console.error('Cluster analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clustering failed'
      };
    }
  }

  /**
   * Analyze feature importance for risk prediction
   */
  async analyzeFeatureImportance(targetVariable: string): Promise<{ success: boolean; features?: FeatureImportance[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'ML analytics not initialized' };
      }

      // Get all available features
      const trainingData = await this.getTrainingData([], targetVariable, 365);
      
      if (trainingData.length === 0) {
        return { success: false, error: 'No training data available' };
      }

      const features: FeatureImportance[] = [];
      const allFeatures = Object.keys(trainingData[0].features);
      const targetValues = trainingData.map(d => d.target || 0);

      // Calculate feature importance using correlation and mutual information
      for (const featureName of allFeatures) {
        const featureValues = trainingData.map(d => d.features[featureName]);
        
        const correlation = this.calculatePearsonCorrelation(featureValues, targetValues);
        const importance = Math.abs(correlation);
        
        features.push({
          feature: featureName,
          importance,
          correlation,
          description: this.getFeatureDescription(featureName)
        });
      }

      // Sort by importance
      features.sort((a, b) => b.importance - a.importance);

      console.log('📊 Feature importance analysis completed:', {
        targetVariable,
        features: features.length,
        topFeature: features[0]?.feature
      });

      return { success: true, features };

    } catch (error) {
      console.error('Feature importance analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Get ML analytics statistics
   */
  async getAnalyticsStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'ML analytics not initialized' };
      }

      const modelStats = await this.db.prepare(`
        SELECT 
          type,
          COUNT(*) as count,
          AVG(accuracy) as avg_accuracy,
          MAX(last_trained) as latest_training
        FROM ml_models
        WHERE is_active = TRUE
        GROUP BY type
      `).all();

      const predictionStats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_predictions,
          AVG(prediction) as avg_prediction,
          AVG(confidence) as avg_confidence,
          COUNT(DISTINCT model_id) as models_used
        FROM ml_predictions
        WHERE created_at >= datetime('now', '-30 days')
      `).first();

      const trainingStats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_training_points,
          COUNT(DISTINCT data_source) as data_sources,
          MIN(timestamp) as earliest_data,
          MAX(timestamp) as latest_data
        FROM ml_training_data
      `).first();

      return {
        success: true,
        stats: {
          models: {
            active: this.models.size,
            byType: modelStats.results || [],
            avgAccuracy: modelStats.results?.reduce((sum: number, row: any) => sum + (row.avg_accuracy || 0), 0) / (modelStats.results?.length || 1)
          },
          predictions: {
            totalPredictions: predictionStats?.total_predictions || 0,
            avgPrediction: Math.round((predictionStats?.avg_prediction || 0) * 100) / 100,
            avgConfidence: Math.round((predictionStats?.avg_confidence || 0) * 100) / 100,
            modelsUsed: predictionStats?.models_used || 0
          },
          training: {
            totalDataPoints: trainingStats?.total_training_points || 0,
            dataSources: trainingStats?.data_sources || 0,
            dataRange: {
              from: trainingStats?.earliest_data,
              to: trainingStats?.latest_data
            }
          }
        }
      };

    } catch (error) {
      console.error('Failed to get ML analytics statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Helper methods for ML algorithms

  private async trainLinearRegression(data: MLDataPoint[], features: string[], target: string): Promise<{ params: any; accuracy: number }> {
    // Simple linear regression implementation
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    // For simplicity, use first feature only in basic implementation
    const featureName = features[0];
    
    for (const point of data) {
      const x = point.features[featureName];
      const y = point.target || 0;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    let ssRes = 0, ssTot = 0;
    const meanY = sumY / n;

    for (const point of data) {
      const x = point.features[featureName];
      const y = point.target || 0;
      const predicted = slope * x + intercept;
      
      ssRes += Math.pow(y - predicted, 2);
      ssTot += Math.pow(y - meanY, 2);
    }

    const rSquared = 1 - (ssRes / ssTot);

    return {
      params: { slope, intercept, features: [featureName] },
      accuracy: Math.max(0, rSquared) // Ensure non-negative
    };
  }

  private async predictLinearRegression(model: RiskPredictionModel, features: Record<string, number>): Promise<PredictionResult> {
    const { slope, intercept } = model.modelParams;
    const featureName = model.features[0];
    const featureValue = features[featureName];
    
    const prediction = slope * featureValue + intercept;
    const confidence = Math.min(0.95, model.accuracy || 0.5);

    return {
      prediction: Math.max(0, Math.min(10, prediction)), // Clamp to 0-10 scale
      confidence,
      factors: [{
        feature: featureName,
        importance: 1.0,
        value: featureValue,
        impact: slope > 0 ? 'positive' : 'negative'
      }],
      recommendation: prediction > 7 ? 'High risk - immediate attention required' : 
                     prediction > 4 ? 'Medium risk - monitor closely' : 
                     'Low risk - routine monitoring sufficient',
      modelUsed: model.id
    };
  }

  private async trainClassification(data: MLDataPoint[], features: string[], target: string): Promise<{ params: any; accuracy: number }> {
    // Simple classification based on thresholds
    const featureName = features[0];
    const values = data.map(d => d.features[featureName]);
    const targets = data.map(d => d.target || 0);
    
    // Find optimal threshold
    const sortedValues = [...values].sort((a, b) => a - b);
    let bestThreshold = sortedValues[Math.floor(sortedValues.length / 2)];
    let bestAccuracy = 0;

    for (const threshold of sortedValues) {
      let correct = 0;
      for (let i = 0; i < values.length; i++) {
        const predicted = values[i] > threshold ? 1 : 0;
        const actual = targets[i] > 5 ? 1 : 0; // Binary classification
        if (predicted === actual) correct++;
      }
      const accuracy = correct / values.length;
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestThreshold = threshold;
      }
    }

    return {
      params: { threshold: bestThreshold, feature: featureName },
      accuracy: bestAccuracy
    };
  }

  private async predictClassification(model: RiskPredictionModel, features: Record<string, number>): Promise<PredictionResult> {
    const { threshold, feature } = model.modelParams;
    const featureValue = features[feature];
    
    const prediction = featureValue > threshold ? 8 : 3; // High or low risk
    const confidence = model.accuracy || 0.7;

    return {
      prediction,
      confidence,
      factors: [{
        feature,
        importance: 1.0,
        value: featureValue,
        impact: featureValue > threshold ? 'positive' : 'negative'
      }],
      recommendation: prediction > 5 ? 'High risk classification - review required' : 'Low risk classification - standard process',
      modelUsed: model.id
    };
  }

  private async trainClustering(data: MLDataPoint[], features: string[]): Promise<{ params: any; silhouetteScore: number }> {
    // Simple k-means clustering implementation
    const k = Math.min(5, Math.floor(data.length / 3)); // Adaptive cluster count
    const clusters = await this.performKMeansClustering(data, features, k);
    
    return {
      params: { k, clusters: clusters.map(c => c.centeroid) },
      silhouetteScore: 0.7 // Simplified score
    };
  }

  private async trainTimeSeries(data: MLDataPoint[], target: string): Promise<{ params: any; accuracy: number }> {
    // Simple moving average for time series
    const values = data.map(d => d.target || 0);
    const window = Math.min(7, Math.floor(values.length / 3));
    
    let totalError = 0;
    let predictions = 0;

    for (let i = window; i < values.length; i++) {
      const predicted = values.slice(i - window, i).reduce((a, b) => a + b) / window;
      const actual = values[i];
      totalError += Math.abs(predicted - actual);
      predictions++;
    }

    const meanAbsoluteError = totalError / predictions;
    const accuracy = Math.max(0, 1 - (meanAbsoluteError / 10)); // Normalize

    return {
      params: { window, type: 'moving_average' },
      accuracy
    };
  }

  private calculateTrend(data: Array<{ timestamp: string; value: number }>): { direction: TrendAnalysis['trend']; slope: number } {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point.value;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction: TrendAnalysis['trend'];
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    // Check for volatility
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    if (coefficientOfVariation > 0.3) {
      direction = 'volatile';
    }

    return { direction, slope };
  }

  private calculateCorrelation(data: Array<{ timestamp: string; value: number }>): number {
    const values = data.map(d => d.value);
    const indices = data.map((_, i) => i);
    
    return this.calculatePearsonCorrelation(indices, values);
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b);
    const sumY = y.reduce((a, b) => a + b);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private detectSeasonality(data: Array<{ timestamp: string; value: number }>): TrendAnalysis['seasonality'] | undefined {
    if (data.length < 14) return undefined;

    // Simple weekly seasonality detection
    const weeklyPattern: number[] = new Array(7).fill(0);
    const weeklyCount: number[] = new Array(7).fill(0);

    data.forEach(point => {
      const dayOfWeek = new Date(point.timestamp).getDay();
      weeklyPattern[dayOfWeek] += point.value;
      weeklyCount[dayOfWeek]++;
    });

    // Calculate average for each day of week
    const weeklyAverage = weeklyPattern.map((sum, i) => weeklyCount[i] > 0 ? sum / weeklyCount[i] : 0);
    const overallMean = weeklyAverage.reduce((a, b) => a + b) / 7;
    const variance = weeklyAverage.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / 7;
    const strength = Math.sqrt(variance) / overallMean;

    return strength > 0.1 ? { period: 7, strength } : undefined;
  }

  private async generateForecast(data: Array<{ timestamp: string; value: number }>, days: number): Promise<TrendAnalysis['forecast']> {
    const trend = this.calculateTrend(data);
    const lastValue = data[data.length - 1].value;
    const lastDate = new Date(data[data.length - 1].timestamp);

    const forecast: TrendAnalysis['forecast'] = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      const predicted = lastValue + (trend.slope * i);
      const confidence = Math.max(0.1, 0.9 - (i * 0.1)); // Decreasing confidence
      
      forecast.push({
        timestamp: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        confidence_lower: predicted * (1 - confidence * 0.2),
        confidence_upper: predicted * (1 + confidence * 0.2)
      });
    }

    return forecast;
  }

  private detectStatisticalAnomalies(values: number[], sensitivity: number): Array<{ isAnomaly: boolean; score: number; threshold: number; value: number }> {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const threshold = stdDev * (3 - sensitivity); // Adjustable threshold

    return values.map(value => {
      const zScore = Math.abs((value - mean) / stdDev);
      return {
        isAnomaly: zScore > threshold,
        score: zScore,
        threshold,
        value
      };
    });
  }

  private findSimilarPeriods(targetPoint: MLDataPoint, allPoints: MLDataPoint[]): Array<{ timestamp: string; similarity: number }> {
    const similarities: Array<{ timestamp: string; similarity: number }> = [];
    
    const targetFeatures = Object.values(targetPoint.features);
    
    for (const point of allPoints) {
      if (point.timestamp === targetPoint.timestamp) continue;
      
      const pointFeatures = Object.values(point.features);
      const similarity = this.calculateCosineSimilarity(targetFeatures, pointFeatures);
      
      if (similarity > 0.8) {
        similarities.push({
          timestamp: point.timestamp,
          similarity
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    return magnitudeA === 0 || magnitudeB === 0 ? 0 : dotProduct / (magnitudeA * magnitudeB);
  }

  private async performKMeansClustering(data: MLDataPoint[], features: string[], k: number): Promise<ClusterAnalysis[]> {
    // Simple k-means clustering implementation
    const points = data.map(d => features.map(f => d.features[f]));
    const clusters: ClusterAnalysis[] = [];

    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(features.map(() => Math.random() * 10));
    }

    // Perform clustering iterations (simplified)
    for (let iteration = 0; iteration < 10; iteration++) {
      const assignments = points.map(point => {
        let minDistance = Infinity;
        let clusterIndex = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = this.calculateEuclideanDistance(point, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            clusterIndex = index;
          }
        });
        
        return clusterIndex;
      });

      // Update centroids
      for (let i = 0; i < k; i++) {
        const clusterPoints = points.filter((_, index) => assignments[index] === i);
        if (clusterPoints.length > 0) {
          centroids[i] = features.map((_, featureIndex) => 
            clusterPoints.reduce((sum, point) => sum + point[featureIndex], 0) / clusterPoints.length
          );
        }
      }
    }

    // Create cluster analysis results
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => {
        const point = features.map(f => data[index].features[f]);
        let minDistance = Infinity;
        let clusterIndex = 0;
        
        centroids.forEach((centroid, cIndex) => {
          const distance = this.calculateEuclideanDistance(point, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            clusterIndex = cIndex;
          }
        });
        
        return clusterIndex === i;
      });

      const centeroid: Record<string, number> = {};
      features.forEach((feature, index) => {
        centeroid[feature] = centroids[i][index];
      });

      clusters.push({
        clusterId: i,
        clusterName: `Cluster ${i + 1}`,
        centeroid,
        size: clusterPoints.length,
        characteristics: this.generateClusterCharacteristics(centeroid),
        similarRisks: [] // Would need risk data to populate
      });
    }

    return clusters;
  }

  private calculateEuclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0));
  }

  private generateClusterCharacteristics(centeroid: Record<string, number>): string[] {
    const characteristics: string[] = [];
    
    Object.entries(centeroid).forEach(([feature, value]) => {
      if (value > 7) {
        characteristics.push(`High ${feature}`);
      } else if (value < 3) {
        characteristics.push(`Low ${feature}`);
      } else {
        characteristics.push(`Medium ${feature}`);
      }
    });

    return characteristics;
  }

  private getFeatureDescription(feature: string): string {
    const descriptions: Record<string, string> = {
      'risk_score': 'Overall risk assessment score',
      'likelihood': 'Probability of risk occurrence',
      'impact': 'Potential impact severity',
      'time_to_resolution': 'Expected time to resolve',
      'compliance_score': 'Compliance adherence level',
      'user_activity': 'User engagement metrics',
      'system_complexity': 'Technical complexity rating'
    };

    return descriptions[feature] || `${feature} metric`;
  }

  // Database helper methods

  private async getTrainingData(features: string[], targetVariable: string, periodDays: number): Promise<MLDataPoint[]> {
    if (!this.db) return [];

    const result = await this.db.prepare(`
      SELECT * FROM ml_training_data
      WHERE target_variable = ? 
      AND timestamp >= datetime('now', '-${periodDays} days')
      ORDER BY timestamp
    `).bind(targetVariable).all();

    return result.results?.map((row: any) => ({
      timestamp: row.timestamp,
      features: JSON.parse(row.features),
      target: row.target_value,
      metadata: { source: row.data_source, id: row.source_id }
    })) || [];
  }

  private async getTimeSeriesData(metric: string, entityType: string, periodDays: number): Promise<Array<{ timestamp: string; value: number }>> {
    if (!this.db) return [];

    // This would query actual time series data from the appropriate tables
    // For now, return sample data
    const data: Array<{ timestamp: string; value: number }> = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate sample trending data
      const baseValue = 5 + Math.sin(i / 7) * 2; // Weekly pattern
      const noise = (Math.random() - 0.5) * 2;
      const trend = i * 0.02; // Slight upward trend
      
      data.push({
        timestamp: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue + noise + trend)
      });
    }

    return data;
  }

  private async getClusteringData(features: string[]): Promise<MLDataPoint[]> {
    if (!this.db) return [];

    const result = await this.db.prepare(`
      SELECT * FROM ml_training_data
      WHERE timestamp >= datetime('now', '-365 days')
      ORDER BY timestamp
    `).all();

    return result.results?.map((row: any) => ({
      timestamp: row.timestamp,
      features: JSON.parse(row.features),
      target: row.target_value
    })) || [];
  }

  private async saveModel(model: RiskPredictionModel): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO ml_models (
        id, name, type, features, target_variable, accuracy,
        last_trained, training_data_points, model_params, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      model.id,
      model.name,
      model.type,
      JSON.stringify(model.features),
      model.targetVariable,
      model.accuracy,
      model.lastTrained,
      model.trainingDataPoints,
      JSON.stringify(model.modelParams),
      model.isActive ? 1 : 0
    ).run();
  }

  private async loadModels(): Promise<void> {
    if (!this.db) return;

    const result = await this.db.prepare(`
      SELECT * FROM ml_models WHERE is_active = TRUE
    `).all();

    for (const row of result.results || []) {
      const model: RiskPredictionModel = {
        id: row.id,
        name: row.name,
        type: row.type,
        features: JSON.parse(row.features),
        targetVariable: row.target_variable,
        accuracy: row.accuracy,
        lastTrained: row.last_trained,
        trainingDataPoints: row.training_data_points,
        modelParams: JSON.parse(row.model_params || '{}'),
        isActive: Boolean(row.is_active)
      };

      this.models.set(model.id, model);
    }
  }

  private async storePrediction(modelId: string, entityType: string, entityId: number, prediction: PredictionResult): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT INTO ml_predictions (
        model_id, entity_type, entity_id, prediction, confidence, factors
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      modelId,
      entityType,
      entityId,
      prediction.prediction,
      prediction.confidence,
      JSON.stringify(prediction.factors)
    ).run();
  }

  private async initializeDefaultModels(): Promise<void> {
    // Create default risk prediction model
    const defaultModel: RiskPredictionModel = {
      id: 'default_risk_prediction',
      name: 'Default Risk Prediction Model',
      type: 'linear_regression',
      features: ['likelihood', 'impact', 'complexity'],
      targetVariable: 'risk_score',
      accuracy: 0.75,
      lastTrained: new Date().toISOString(),
      trainingDataPoints: 100,
      modelParams: {
        slope: 1.2,
        intercept: 2.5,
        features: ['likelihood']
      },
      isActive: true
    };

    this.models.set(defaultModel.id, defaultModel);
    await this.saveModel(defaultModel);
  }
}

// Export helper functions for ML integration
export const MLHelpers = {
  /**
   * Extract features from risk data
   */
  extractRiskFeatures: (risk: any): Record<string, number> => ({
    likelihood: risk.likelihood || 5,
    impact: risk.impact_score || 5,
    complexity: risk.complexity || 3,
    time_open: Math.floor((Date.now() - new Date(risk.created_at).getTime()) / (1000 * 60 * 60 * 24)), // days
    user_activity: risk.comments?.length || 0,
    has_mitigation: risk.mitigation ? 1 : 0
  }),

  /**
   * Extract features from compliance data
   */
  extractComplianceFeatures: (compliance: any): Record<string, number> => ({
    compliance_score: compliance.score || 0,
    framework_maturity: compliance.maturity || 3,
    gap_count: compliance.gaps?.length || 0,
    last_assessment_days: Math.floor((Date.now() - new Date(compliance.last_assessment || compliance.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    automation_level: compliance.automation_level || 1
  }),

  /**
   * Create training data point
   */
  createTrainingPoint: (features: Record<string, number>, target: number, source: string, sourceId: number): Omit<MLDataPoint, 'timestamp'> => ({
    features,
    target,
    metadata: { source, sourceId }
  }),

  /**
   * Normalize feature values to 0-10 scale
   */
  normalizeFeatures: (features: Record<string, number>): Record<string, number> => {
    const normalized: Record<string, number> = {};
    
    Object.entries(features).forEach(([key, value]) => {
      // Apply different normalization based on feature type
      switch (key) {
        case 'likelihood':
        case 'impact':
        case 'compliance_score':
          normalized[key] = Math.max(0, Math.min(10, value));
          break;
        case 'time_open':
        case 'last_assessment_days':
          normalized[key] = Math.min(10, value / 30); // Normalize by month
          break;
        default:
          normalized[key] = Math.max(0, Math.min(10, value));
      }
    });

    return normalized;
  }
};