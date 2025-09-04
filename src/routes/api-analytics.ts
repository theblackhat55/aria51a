import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { MLAnalyticsService } from '../services/ml-analytics';

const apiAnalyticsRoutes = new Hono();

// Apply authentication middleware to all routes
apiAnalyticsRoutes.use('*', requireAuth);

// Initialize service
const mlService = new MLAnalyticsService();

// ML Analytics Overview API
apiAnalyticsRoutes.get('/overview', requirePermission('analytics:view'), async (c) => {
  try {
    const overview = await mlService.getAnalyticsOverview();
    return c.json(overview);
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    return c.json({ error: 'Failed to get analytics overview' }, 500);
  }
});

// Risk Predictions API
apiAnalyticsRoutes.get('/predictions', requirePermission('analytics:view'), async (c) => {
  try {
    const predictions = await mlService.getAllPredictions();
    return c.json(predictions);
  } catch (error) {
    console.error('Error getting predictions:', error);
    return c.json({ error: 'Failed to get predictions' }, 500);
  }
});

apiAnalyticsRoutes.get('/predictions/recent', requirePermission('analytics:view'), async (c) => {
  try {
    const predictions = await mlService.getRecentPredictions(10);
    return c.json(predictions);
  } catch (error) {
    console.error('Error getting recent predictions:', error);
    return c.json({ error: 'Failed to get recent predictions' }, 500);
  }
});

apiAnalyticsRoutes.post('/predictions', requirePermission('analytics:create'), async (c) => {
  try {
    const riskData = await c.req.json();
    
    // Validate required fields
    const requiredFields = ['asset_type', 'vulnerability_count', 'patch_level', 'exposure_score', 'historical_incidents'];
    for (const field of requiredFields) {
      if (riskData[field] === undefined || riskData[field] === null) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const prediction = await mlService.predictRiskLikelihood(riskData);
    return c.json(prediction);
  } catch (error) {
    console.error('Error creating prediction:', error);
    return c.json({ error: 'Failed to create prediction' }, 500);
  }
});

apiAnalyticsRoutes.get('/predictions/:id', requirePermission('analytics:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const prediction = await mlService.getPredictionById(id);
    
    if (!prediction) {
      return c.json({ error: 'Prediction not found' }, 404);
    }
    
    return c.json(prediction);
  } catch (error) {
    console.error('Error getting prediction:', error);
    return c.json({ error: 'Failed to get prediction' }, 500);
  }
});

// Trend Analysis API
apiAnalyticsRoutes.get('/trends', requirePermission('analytics:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const trends = await mlService.analyzeTrends(days);
    return c.json(trends);
  } catch (error) {
    console.error('Error getting trends:', error);
    return c.json({ error: 'Failed to get trends' }, 500);
  }
});

apiAnalyticsRoutes.post('/trends/report', requirePermission('analytics:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    
    // Generate trend report (mock implementation)
    const reportData = await mlService.generateTrendReport(days);
    
    // In a real implementation, this would generate a PDF using a library like PDFKit
    const reportContent = JSON.stringify(reportData, null, 2);
    
    return new Response(reportContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="trend-analysis-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Error generating trend report:', error);
    return c.json({ error: 'Failed to generate trend report' }, 500);
  }
});

// Anomaly Detection API
apiAnalyticsRoutes.get('/anomalies', requirePermission('analytics:view'), async (c) => {
  try {
    const anomalies = await mlService.getAnomalyAnalysis();
    return c.json(anomalies);
  } catch (error) {
    console.error('Error getting anomalies:', error);
    return c.json({ error: 'Failed to get anomalies' }, 500);
  }
});

apiAnalyticsRoutes.post('/anomalies/detect', requirePermission('analytics:create'), async (c) => {
  try {
    const userEmail = getCookie(c, 'user_email') || '';
    const result = await mlService.runAnomalyDetection(userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error running anomaly detection:', error);
    return c.json({ error: 'Failed to run anomaly detection' }, 500);
  }
});

apiAnalyticsRoutes.post('/anomalies/:id/investigate', requirePermission('analytics:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await mlService.updateAnomalyStatus(id, 'investigating', userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error updating anomaly status:', error);
    return c.json({ error: 'Failed to update anomaly status' }, 500);
  }
});

apiAnalyticsRoutes.post('/anomalies/:id/resolve', requirePermission('analytics:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await mlService.updateAnomalyStatus(id, 'resolved', userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    return c.json({ error: 'Failed to resolve anomaly' }, 500);
  }
});

// Model Management API
apiAnalyticsRoutes.get('/models', requirePermission('analytics:view'), async (c) => {
  try {
    const models = await mlService.getMLModels();
    return c.json(models);
  } catch (error) {
    console.error('Error getting ML models:', error);
    return c.json({ error: 'Failed to get ML models' }, 500);
  }
});

apiAnalyticsRoutes.post('/models/train', requirePermission('analytics:manage'), async (c) => {
  try {
    const userEmail = getCookie(c, 'user_email') || '';
    const { modelType } = await c.req.json();
    
    const result = await mlService.trainModel(modelType, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error training model:', error);
    return c.json({ error: 'Failed to train model' }, 500);
  }
});

// Compliance Analytics API
apiAnalyticsRoutes.get('/compliance', requirePermission('analytics:view'), async (c) => {
  try {
    const compliance = await mlService.analyzeComplianceGaps();
    return c.json(compliance);
  } catch (error) {
    console.error('Error getting compliance analysis:', error);
    return c.json({ error: 'Failed to get compliance analysis' }, 500);
  }
});

// Asset Risk Analysis API
apiAnalyticsRoutes.get('/asset-risk', requirePermission('analytics:view'), async (c) => {
  try {
    const assetRisk = await mlService.analyzeAssetRisk();
    return c.json(assetRisk);
  } catch (error) {
    console.error('Error getting asset risk analysis:', error);
    return c.json({ error: 'Failed to get asset risk analysis' }, 500);
  }
});

apiAnalyticsRoutes.get('/asset-risk/:assetId', requirePermission('analytics:view'), async (c) => {
  try {
    const assetId = c.req.param('assetId');
    const assetRisk = await mlService.getAssetRiskProfile(assetId);
    
    if (!assetRisk) {
      return c.json({ error: 'Asset not found' }, 404);
    }
    
    return c.json(assetRisk);
  } catch (error) {
    console.error('Error getting asset risk profile:', error);
    return c.json({ error: 'Failed to get asset risk profile' }, 500);
  }
});

export { apiAnalyticsRoutes };