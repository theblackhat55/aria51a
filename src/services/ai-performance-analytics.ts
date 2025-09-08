/**
 * AI Performance Analytics Service
 * 
 * Comprehensive tracking and analytics for AI provider usage:
 * - Model performance monitoring and comparison
 * - Cost optimization and usage tracking
 * - Response quality and accuracy metrics
 * - Intelligent routing effectiveness analysis
 * - A/B testing for model selection strategies
 */

import { D1Database } from '@cloudflare/workers-types';

export interface AIPerformanceMetrics {
  providerId: string;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  avgTokenUsage: number;
  avgConfidenceScore: number;
  costPerRequest: number;
  totalCost: number;
  qualityRating: number; // 0-1 based on user feedback
  errorRate: number;
  uptimePercentage: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface AIProviderComparison {
  comparisonId: string;
  providers: AIProviderPerformance[];
  metrics: {
    bestForSpeed: string;
    bestForCost: string;
    bestForQuality: string;
    bestForReliability: string;
  };
  recommendations: AIRouteRecommendation[];
  generatedAt: string;
}

export interface AIProviderPerformance {
  providerId: string;
  displayName: string;
  metrics: AIPerformanceMetrics;
  strengths: string[];
  weaknesses: string[];
  useCaseOptimization: {
    simple_queries: number;
    complex_analysis: number;
    threat_intelligence: number;
    compliance: number;
  };
}

export interface AIRouteRecommendation {
  useCase: string;
  recommendedProvider: string;
  confidence: number;
  reasoning: string;
  expectedImprovement: {
    speed: number;
    cost: number;
    quality: number;
  };
}

export interface CostOptimizationInsights {
  currentMonthlySpend: number;
  projectedMonthlySpend: number;
  potentialSavings: number;
  optimizationOpportunities: {
    type: 'model_downgrade' | 'query_routing' | 'caching' | 'batching';
    description: string;
    estimatedSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
  }[];
  costByProvider: {
    providerId: string;
    cost: number;
    percentage: number;
  }[];
}

export class AIPerformanceAnalytics {
  private db: D1Database;
  
  // Cost per token estimates (USD)
  private costModels = {
    'openai-gpt4': { input: 0.00003, output: 0.00006 },
    'openai-gpt35': { input: 0.0000015, output: 0.000002 },
    'anthropic-claude': { input: 0.000008, output: 0.000024 },
    'cloudflare-llama': { input: 0, output: 0 } // Free tier
  };

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Record AI request performance metrics
   */
  async recordAIRequest(metrics: {
    providerId: string;
    model: string;
    queryType: string;
    queryComplexity: 'simple' | 'medium' | 'complex';
    responseTime: number;
    tokenUsage: { input: number; output: number };
    success: boolean;
    confidenceScore?: number;
    errorType?: string;
    userFeedback?: number; // 1-5 rating
  }): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ai_performance_logs (
          provider_id, model, query_type, query_complexity, response_time_ms,
          input_tokens, output_tokens, success, confidence_score, error_type,
          user_feedback, cost_estimate, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        metrics.providerId,
        metrics.model,
        metrics.queryType,
        metrics.queryComplexity,
        metrics.responseTime,
        metrics.tokenUsage.input,
        metrics.tokenUsage.output,
        metrics.success ? 1 : 0,
        metrics.confidenceScore || null,
        metrics.errorType || null,
        metrics.userFeedback || null,
        this.calculateCost(metrics.providerId, metrics.tokenUsage),
        new Date().toISOString()
      ).run();

      console.log(`📊 Recorded AI performance metrics for ${metrics.providerId}`);
    } catch (error) {
      console.error('Error recording AI performance:', error);
    }
  }

  /**
   * Get comprehensive performance metrics for a provider
   */
  async getProviderMetrics(
    providerId: string, 
    timeRange: { start: string; end: string }
  ): Promise<AIPerformanceMetrics> {
    try {
      const result = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
          AVG(response_time_ms) as avg_response_time,
          AVG(input_tokens + output_tokens) as avg_token_usage,
          AVG(confidence_score) as avg_confidence_score,
          AVG(cost_estimate) as avg_cost_per_request,
          SUM(cost_estimate) as total_cost,
          AVG(user_feedback) as avg_quality_rating,
          CAST(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as error_rate
        FROM ai_performance_logs 
        WHERE provider_id = ? AND created_at BETWEEN ? AND ?
      `).bind(providerId, timeRange.start, timeRange.end).first();

      const successfulRequests = Number(result?.successful_requests) || 0;
      const totalRequests = Number(result?.total_requests) || 0;

      return {
        providerId,
        model: await this.getCommonModel(providerId, timeRange),
        totalRequests,
        successfulRequests,
        failedRequests: Number(result?.failed_requests) || 0,
        avgResponseTime: Number(result?.avg_response_time) || 0,
        avgTokenUsage: Number(result?.avg_token_usage) || 0,
        avgConfidenceScore: Number(result?.avg_confidence_score) || 0,
        costPerRequest: Number(result?.avg_cost_per_request) || 0,
        totalCost: Number(result?.total_cost) || 0,
        qualityRating: Number(result?.avg_quality_rating) || 0,
        errorRate: Number(result?.error_rate) || 0,
        uptimePercentage: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        timeRange
      };
    } catch (error) {
      console.error('Error getting provider metrics:', error);
      return this.getEmptyMetrics(providerId, timeRange);
    }
  }

  /**
   * Compare performance across all AI providers
   */
  async compareProviders(timeRange: { start: string; end: string }): Promise<AIProviderComparison> {
    try {
      // Get unique providers
      const providersResult = await this.db.prepare(`
        SELECT DISTINCT provider_id FROM ai_performance_logs 
        WHERE created_at BETWEEN ? AND ?
      `).bind(timeRange.start, timeRange.end).all();

      const providers: AIProviderPerformance[] = [];

      for (const row of (providersResult.results || [])) {
        const providerId = row.provider_id as string;
        const metrics = await this.getProviderMetrics(providerId, timeRange);
        
        providers.push({
          providerId,
          displayName: this.getProviderDisplayName(providerId),
          metrics,
          strengths: this.analyzeStrengths(metrics),
          weaknesses: this.analyzeWeaknesses(metrics),
          useCaseOptimization: await this.getUseCaseOptimization(providerId, timeRange)
        });
      }

      // Determine best performers
      const bestMetrics = this.determineBestPerformers(providers);
      
      // Generate recommendations
      const recommendations = await this.generateRoutingRecommendations(providers);

      return {
        comparisonId: `comparison_${Date.now()}`,
        providers,
        metrics: bestMetrics,
        recommendations,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error comparing providers:', error);
      return {
        comparisonId: 'error',
        providers: [],
        metrics: {
          bestForSpeed: 'cloudflare-llama',
          bestForCost: 'cloudflare-llama',
          bestForQuality: 'openai-gpt4',
          bestForReliability: 'cloudflare-llama'
        },
        recommendations: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate cost optimization insights
   */
  async getCostOptimizationInsights(timeRange: { start: string; end: string }): Promise<CostOptimizationInsights> {
    try {
      // Calculate current spending patterns
      const spendingResult = await this.db.prepare(`
        SELECT 
          provider_id,
          SUM(cost_estimate) as total_cost,
          COUNT(*) as request_count,
          AVG(cost_estimate) as avg_cost_per_request
        FROM ai_performance_logs 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY provider_id
      `).bind(timeRange.start, timeRange.end).all();

      const currentSpend = (spendingResult.results || []).reduce(
        (sum, row: any) => sum + Number(row.total_cost), 0
      );

      // Calculate days in range for projection
      const daysInRange = Math.ceil(
        (new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) / (1000 * 60 * 60 * 24)
      );
      const dailySpend = currentSpend / daysInRange;
      const projectedMonthlySpend = dailySpend * 30;

      // Analyze optimization opportunities
      const opportunities = await this.analyzeOptimizationOpportunities(spendingResult.results || []);

      const costByProvider = (spendingResult.results || []).map((row: any) => ({
        providerId: row.provider_id,
        cost: Number(row.total_cost),
        percentage: currentSpend > 0 ? (Number(row.total_cost) / currentSpend) * 100 : 0
      }));

      const potentialSavings = opportunities.reduce((sum, opp) => sum + opp.estimatedSavings, 0);

      return {
        currentMonthlySpend: projectedMonthlySpend,
        projectedMonthlySpend: projectedMonthlySpend,
        potentialSavings,
        optimizationOpportunities: opportunities,
        costByProvider
      };

    } catch (error) {
      console.error('Error generating cost insights:', error);
      return {
        currentMonthlySpend: 0,
        projectedMonthlySpend: 0,
        potentialSavings: 0,
        optimizationOpportunities: [],
        costByProvider: []
      };
    }
  }

  /**
   * Get AI routing effectiveness metrics
   */
  async getRoutingEffectiveness(timeRange: { start: string; end: string }): Promise<any> {
    try {
      const routingResult = await this.db.prepare(`
        SELECT 
          query_complexity,
          provider_id,
          AVG(response_time_ms) as avg_response_time,
          AVG(confidence_score) as avg_confidence,
          COUNT(*) as request_count,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count
        FROM ai_performance_logs 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY query_complexity, provider_id
      `).bind(timeRange.start, timeRange.end).all();

      const routingEffectiveness = {
        totalRequests: 0,
        successfulRoutes: 0,
        complexityDistribution: {
          simple: { count: 0, avgResponseTime: 0, avgConfidence: 0 },
          medium: { count: 0, avgResponseTime: 0, avgConfidence: 0 },
          complex: { count: 0, avgResponseTime: 0, avgConfidence: 0 }
        },
        providerUtilization: {} as any
      };

      (routingResult.results || []).forEach((row: any) => {
        const complexity = row.query_complexity;
        const count = Number(row.request_count);
        
        routingEffectiveness.totalRequests += count;
        routingEffectiveness.successfulRoutes += Number(row.success_count);
        
        if (routingEffectiveness.complexityDistribution[complexity as keyof typeof routingEffectiveness.complexityDistribution]) {
          const dist = routingEffectiveness.complexityDistribution[complexity as keyof typeof routingEffectiveness.complexityDistribution];
          dist.count += count;
          dist.avgResponseTime = (dist.avgResponseTime + Number(row.avg_response_time)) / 2;
          dist.avgConfidence = (dist.avgConfidence + Number(row.avg_confidence)) / 2;
        }
        
        if (!routingEffectiveness.providerUtilization[row.provider_id]) {
          routingEffectiveness.providerUtilization[row.provider_id] = 0;
        }
        routingEffectiveness.providerUtilization[row.provider_id] += count;
      });

      return routingEffectiveness;

    } catch (error) {
      console.error('Error getting routing effectiveness:', error);
      return { totalRequests: 0, successfulRoutes: 0 };
    }
  }

  /**
   * Private helper methods
   */
  private calculateCost(providerId: string, tokenUsage: { input: number; output: number }): number {
    const model = this.costModels[providerId as keyof typeof this.costModels];
    if (!model) return 0;
    
    return (tokenUsage.input * model.input) + (tokenUsage.output * model.output);
  }

  private async getCommonModel(providerId: string, timeRange: { start: string; end: string }): Promise<string> {
    try {
      const result = await this.db.prepare(`
        SELECT model, COUNT(*) as usage_count 
        FROM ai_performance_logs 
        WHERE provider_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY model 
        ORDER BY usage_count DESC 
        LIMIT 1
      `).bind(providerId, timeRange.start, timeRange.end).first();

      return result?.model || providerId;
    } catch (error) {
      return providerId;
    }
  }

  private getProviderDisplayName(providerId: string): string {
    const displayNames = {
      'openai-gpt4': 'OpenAI GPT-4',
      'openai-gpt35': 'OpenAI GPT-3.5',
      'anthropic-claude': 'Anthropic Claude',
      'cloudflare-llama': 'Cloudflare Workers AI (Llama)'
    };
    return displayNames[providerId as keyof typeof displayNames] || providerId;
  }

  private analyzeStrengths(metrics: AIPerformanceMetrics): string[] {
    const strengths = [];
    
    if (metrics.avgResponseTime < 2000) strengths.push('Fast response times');
    if (metrics.errorRate < 0.05) strengths.push('High reliability');
    if (metrics.avgConfidenceScore > 0.8) strengths.push('High confidence scores');
    if (metrics.costPerRequest < 0.001) strengths.push('Cost effective');
    if (metrics.qualityRating > 4) strengths.push('High user satisfaction');
    
    return strengths;
  }

  private analyzeWeaknesses(metrics: AIPerformanceMetrics): string[] {
    const weaknesses = [];
    
    if (metrics.avgResponseTime > 5000) weaknesses.push('Slow response times');
    if (metrics.errorRate > 0.1) weaknesses.push('High error rate');
    if (metrics.avgConfidenceScore < 0.6) weaknesses.push('Low confidence scores');
    if (metrics.costPerRequest > 0.01) weaknesses.push('High cost per request');
    if (metrics.qualityRating < 3) weaknesses.push('Low user satisfaction');
    
    return weaknesses;
  }

  private async getUseCaseOptimization(providerId: string, timeRange: { start: string; end: string }): Promise<any> {
    try {
      const result = await this.db.prepare(`
        SELECT 
          query_type,
          AVG(confidence_score) as avg_confidence,
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) as usage_count
        FROM ai_performance_logs 
        WHERE provider_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY query_type
      `).bind(providerId, timeRange.start, timeRange.end).all();

      const optimization = {
        simple_queries: 0.5,
        complex_analysis: 0.5,
        threat_intelligence: 0.5,
        compliance: 0.5
      };

      (result.results || []).forEach((row: any) => {
        const queryType = row.query_type;
        const score = (Number(row.avg_confidence) + (3000 / Math.max(Number(row.avg_response_time), 1000))) / 2;
        
        if (queryType in optimization) {
          optimization[queryType as keyof typeof optimization] = Math.min(1, score);
        }
      });

      return optimization;
    } catch (error) {
      return { simple_queries: 0.5, complex_analysis: 0.5, threat_intelligence: 0.5, compliance: 0.5 };
    }
  }

  private determineBestPerformers(providers: AIProviderPerformance[]): any {
    if (providers.length === 0) {
      return {
        bestForSpeed: 'cloudflare-llama',
        bestForCost: 'cloudflare-llama',
        bestForQuality: 'openai-gpt4',
        bestForReliability: 'cloudflare-llama'
      };
    }

    const bestForSpeed = providers.reduce((best, current) => 
      current.metrics.avgResponseTime < best.metrics.avgResponseTime ? current : best
    );

    const bestForCost = providers.reduce((best, current) => 
      current.metrics.costPerRequest < best.metrics.costPerRequest ? current : best
    );

    const bestForQuality = providers.reduce((best, current) => 
      current.metrics.qualityRating > best.metrics.qualityRating ? current : best
    );

    const bestForReliability = providers.reduce((best, current) => 
      current.metrics.uptimePercentage > best.metrics.uptimePercentage ? current : best
    );

    return {
      bestForSpeed: bestForSpeed.providerId,
      bestForCost: bestForCost.providerId,
      bestForQuality: bestForQuality.providerId,
      bestForReliability: bestForReliability.providerId
    };
  }

  private async generateRoutingRecommendations(providers: AIProviderPerformance[]): Promise<AIRouteRecommendation[]> {
    const recommendations = [];

    // Simple queries recommendation
    const bestSimple = providers.reduce((best, current) => {
      const score = (current.useCaseOptimization.simple_queries * 0.7) + 
                   ((1 - current.metrics.costPerRequest / 0.01) * 0.3);
      const bestScore = (best.useCaseOptimization.simple_queries * 0.7) + 
                       ((1 - best.metrics.costPerRequest / 0.01) * 0.3);
      return score > bestScore ? current : best;
    });

    recommendations.push({
      useCase: 'Simple Queries',
      recommendedProvider: bestSimple.providerId,
      confidence: 0.85,
      reasoning: `Best balance of speed and cost for simple queries`,
      expectedImprovement: { speed: 15, cost: 25, quality: 5 }
    });

    // Complex analysis recommendation
    const bestComplex = providers.reduce((best, current) => {
      const score = (current.useCaseOptimization.complex_analysis * 0.6) + 
                   (current.metrics.qualityRating * 0.4);
      const bestScore = (best.useCaseOptimization.complex_analysis * 0.6) + 
                       (best.metrics.qualityRating * 0.4);
      return score > bestScore ? current : best;
    });

    recommendations.push({
      useCase: 'Complex Analysis',
      recommendedProvider: bestComplex.providerId,
      confidence: 0.90,
      reasoning: `Highest quality results for complex analytical tasks`,
      expectedImprovement: { speed: -5, cost: -15, quality: 20 }
    });

    return recommendations;
  }

  private async analyzeOptimizationOpportunities(spendingData: any[]): Promise<any[]> {
    const opportunities = [];

    // Check for expensive low-complexity queries
    const expensiveSimple = spendingData.find(row => 
      row.provider_id.includes('gpt4') && Number(row.avg_cost_per_request) > 0.005
    );

    if (expensiveSimple) {
      opportunities.push({
        type: 'model_downgrade',
        description: 'Route simple queries to lower-cost models',
        estimatedSavings: Number(expensiveSimple.total_cost) * 0.6,
        implementationEffort: 'low'
      });
    }

    // Check for high-volume usage that could benefit from caching
    const highVolume = spendingData.find(row => Number(row.request_count) > 1000);
    if (highVolume) {
      opportunities.push({
        type: 'caching',
        description: 'Implement response caching for repeated queries',
        estimatedSavings: Number(highVolume.total_cost) * 0.3,
        implementationEffort: 'medium'
      });
    }

    return opportunities;
  }

  private getEmptyMetrics(providerId: string, timeRange: { start: string; end: string }): AIPerformanceMetrics {
    return {
      providerId,
      model: providerId,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      avgTokenUsage: 0,
      avgConfidenceScore: 0,
      costPerRequest: 0,
      totalCost: 0,
      qualityRating: 0,
      errorRate: 0,
      uptimePercentage: 0,
      timeRange
    };
  }
}