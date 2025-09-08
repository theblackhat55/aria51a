// ===============================================
// RISK DATA CONSISTENCY LAYER
// Unified approach to ensure all queries return consistent risk data
// Works with both local and production database schemas
// ===============================================

export interface RiskSummary {
  total_risks: number;
  active_risks: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
}

export interface RiskWithLevel {
  id: number;
  title: string;
  probability: number;
  impact: number;
  risk_score: number;
  risk_level_code: string;
  risk_level_name: string;
  status: string;
}

// Standardized risk level thresholds
const RISK_THRESHOLDS = {
  CRITICAL: 20,
  HIGH: 12,
  MEDIUM: 6,
  LOW: 1
} as const;

// Get risk level from score
function getRiskLevel(score: number): { code: string; name: string } {
  if (score >= RISK_THRESHOLDS.CRITICAL) return { code: 'critical', name: 'Critical' };
  if (score >= RISK_THRESHOLDS.HIGH) return { code: 'high', name: 'High' };
  if (score >= RISK_THRESHOLDS.MEDIUM) return { code: 'medium', name: 'Medium' };
  return { code: 'low', name: 'Low' };
}

export class RiskDataConsistency {
  private db: D1Database;

  constructor(database: D1Database) {
    this.db = database;
  }

  // Get standardized risk summary that works with any schema
  async getRiskSummary(): Promise<RiskSummary> {
    try {
      // Use a single query that calculates everything based on the risk_score
      // This works regardless of whether risk_level columns exist
      const result = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_risks,
          COUNT(CASE WHEN status NOT IN ('archived', 'closed', 'retired') THEN 1 END) as active_risks,
          COUNT(CASE WHEN COALESCE(risk_score, probability * impact) >= ? THEN 1 END) as critical_risks,
          COUNT(CASE WHEN COALESCE(risk_score, probability * impact) >= ? AND COALESCE(risk_score, probability * impact) < ? THEN 1 END) as high_risks,
          COUNT(CASE WHEN COALESCE(risk_score, probability * impact) >= ? AND COALESCE(risk_score, probability * impact) < ? THEN 1 END) as medium_risks,
          COUNT(CASE WHEN COALESCE(risk_score, probability * impact) < ? THEN 1 END) as low_risks
        FROM risks
      `).bind(
        RISK_THRESHOLDS.CRITICAL,     // critical >= 20
        RISK_THRESHOLDS.HIGH,         // high >= 12
        RISK_THRESHOLDS.CRITICAL,     // high < 20
        RISK_THRESHOLDS.MEDIUM,       // medium >= 6  
        RISK_THRESHOLDS.HIGH,         // medium < 12
        RISK_THRESHOLDS.MEDIUM        // low < 6
      ).first();

      return result as RiskSummary;
    } catch (error) {
      console.error('Error getting risk summary:', error);
      // Return safe defaults
      return {
        total_risks: 0,
        active_risks: 0,
        critical_risks: 0,
        high_risks: 0,
        medium_risks: 0,
        low_risks: 0
      };
    }
  }

  // Get all risks with calculated levels
  async getRisksWithLevels(): Promise<RiskWithLevel[]> {
    try {
      const results = await this.db.prepare(`
        SELECT 
          id,
          title,
          COALESCE(probability, 3) as probability,
          COALESCE(impact, 3) as impact,
          COALESCE(risk_score, probability * impact, 9) as risk_score,
          status
        FROM risks
        ORDER BY COALESCE(risk_score, probability * impact, 9) DESC
      `).all();

      // Add risk levels to each risk
      return results.results.map((risk: any) => {
        const level = getRiskLevel(risk.risk_score);
        return {
          ...risk,
          risk_level_code: level.code,
          risk_level_name: level.name
        };
      });
    } catch (error) {
      console.error('Error getting risks with levels:', error);
      return [];
    }
  }

  // Get risks by specific level
  async getRisksByLevel(levelCode: string): Promise<RiskWithLevel[]> {
    const allRisks = await this.getRisksWithLevels();
    return allRisks.filter(risk => risk.risk_level_code === levelCode);
  }

  // Validate and fix any inconsistent risk scores
  async validateAndFixRiskScores(): Promise<{ fixed: number; total: number }> {
    try {
      // First, get all risks that might have inconsistent scores
      const risks = await this.db.prepare(`
        SELECT id, probability, impact, risk_score 
        FROM risks 
        WHERE probability IS NOT NULL AND impact IS NOT NULL
      `).all();

      let fixedCount = 0;
      const totalRisks = risks.results.length;

      for (const risk of risks.results) {
        const calculatedScore = risk.probability * risk.impact;
        
        if (risk.risk_score !== calculatedScore) {
          await this.db.prepare(`
            UPDATE risks 
            SET risk_score = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(calculatedScore, risk.id).run();
          
          fixedCount++;
        }
      }

      return { fixed: fixedCount, total: totalRisks };
    } catch (error) {
      console.error('Error validating risk scores:', error);
      return { fixed: 0, total: 0 };
    }
  }

  // Get dashboard metrics with consistent calculations
  async getDashboardMetrics() {
    const riskSummary = await this.getRiskSummary();
    
    return {
      risks: riskSummary,
      // Add other metrics as needed
      lastUpdated: new Date().toISOString()
    };
  }
}

// Utility function to create standardized risk level query conditions
export function createRiskLevelConditions(scoreColumn = 'risk_score') {
  return {
    critical: `${scoreColumn} >= ${RISK_THRESHOLDS.CRITICAL}`,
    high: `${scoreColumn} >= ${RISK_THRESHOLDS.HIGH} AND ${scoreColumn} < ${RISK_THRESHOLDS.CRITICAL}`,
    medium: `${scoreColumn} >= ${RISK_THRESHOLDS.MEDIUM} AND ${scoreColumn} < ${RISK_THRESHOLDS.HIGH}`,
    low: `${scoreColumn} < ${RISK_THRESHOLDS.MEDIUM}`
  };
}

// Export thresholds for use in other components
export { RISK_THRESHOLDS };