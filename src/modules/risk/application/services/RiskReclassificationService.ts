/**
 * Risk Reclassification Service
 * 
 * Automatically reclassifies risks when:
 * - Asset criticality changes
 * - New assets are linked to risks
 * - Asset status changes
 * 
 * Implements RMF dynamic risk rating based on asset criticality
 */

import { D1Database } from '@cloudflare/workers-types';

/**
 * Criticality score mapping
 */
const CRITICALITY_SCORES: Record<string, number> = {
  'critical': 5,
  'high': 4,
  'medium': 3,
  'low': 2,
  'minimal': 1
};

/**
 * Asset criticality details
 */
interface AssetCriticality {
  assetId: number;
  assetName: string;
  criticality: string;
  criticalityScore: number;
  impactWeight: number;
}

/**
 * Risk reclassification result
 */
interface ReclassificationResult {
  riskId: number;
  oldProbability: number;
  oldImpact: number;
  newProbability: number;
  newImpact: number;
  oldRiskScore: number;
  newRiskScore: number;
  reason: string;
  linkedAssets: AssetCriticality[];
}

/**
 * Risk Reclassification Service
 */
export class RiskReclassificationService {
  constructor(private db: D1Database) {}

  /**
   * Reclassify a single risk based on its linked assets
   * 
   * Algorithm:
   * 1. Get all linked assets and their criticality
   * 2. Calculate weighted impact based on asset criticality
   * 3. Adjust probability based on number and criticality of assets
   * 4. Update risk probability and impact if changed
   * 
   * @param riskId Risk database ID
   * @returns Reclassification result or null if no changes
   */
  async reclassifyRisk(riskId: number): Promise<ReclassificationResult | null> {
    try {
      // Get current risk details
      const riskResult = await this.db
        .prepare('SELECT id, probability, impact, title FROM risks WHERE id = ?')
        .bind(riskId)
        .first<{ id: number; probability: number; impact: number; title: string }>();

      if (!riskResult) {
        console.log(`⚠️ Risk ${riskId} not found`);
        return null;
      }

      // Get linked assets with criticality
      const linkedAssetsResult = await this.db
        .prepare(`
          SELECT 
            ra.asset_id,
            ra.impact_weight,
            a.name as asset_name,
            a.criticality,
            a.status
          FROM risk_assets ra
          JOIN assets a ON ra.asset_id = a.id
          WHERE ra.risk_id = ?
            AND a.status = 'active'
        `)
        .bind(riskId)
        .all();

      // If no linked assets, no reclassification needed
      if (!linkedAssetsResult.success || !linkedAssetsResult.results || linkedAssetsResult.results.length === 0) {
        console.log(`ℹ️ Risk ${riskId} has no linked active assets - no reclassification`);
        return null;
      }

      const linkedAssets: AssetCriticality[] = linkedAssetsResult.results.map((row: any) => ({
        assetId: row.asset_id,
        assetName: row.asset_name,
        criticality: (row.criticality || 'medium').toLowerCase(),
        criticalityScore: CRITICALITY_SCORES[(row.criticality || 'medium').toLowerCase()] || 3,
        impactWeight: row.impact_weight || 1.0
      }));

      // Calculate new probability and impact
      const { newProbability, newImpact, reason } = this.calculateDynamicRisk(
        riskResult.probability,
        riskResult.impact,
        linkedAssets
      );

      // Check if anything changed
      if (newProbability === riskResult.probability && newImpact === riskResult.impact) {
        console.log(`ℹ️ Risk ${riskId} scores unchanged - no update needed`);
        return null;
      }

      // Update risk with new scores
      await this.db
        .prepare(`
          UPDATE risks 
          SET probability = ?,
              impact = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(newProbability, newImpact, riskId)
        .run();

      const oldRiskScore = riskResult.probability * riskResult.impact;
      const newRiskScore = newProbability * newImpact;

      console.log(`✅ Reclassified Risk ${riskId}: ${oldRiskScore} → ${newRiskScore}`);

      return {
        riskId,
        oldProbability: riskResult.probability,
        oldImpact: riskResult.impact,
        newProbability,
        newImpact,
        oldRiskScore,
        newRiskScore,
        reason,
        linkedAssets
      };

    } catch (error) {
      console.error(`❌ Error reclassifying risk ${riskId}:`, error);
      throw error;
    }
  }

  /**
   * Reclassify all risks linked to a specific asset
   * Called when asset criticality changes
   * 
   * @param assetId Asset database ID
   * @returns Array of reclassification results
   */
  async reclassifyRisksByAsset(assetId: number): Promise<ReclassificationResult[]> {
    try {
      // Get all risks linked to this asset
      const linkedRisksResult = await this.db
        .prepare(`
          SELECT DISTINCT ra.risk_id
          FROM risk_assets ra
          WHERE ra.asset_id = ?
        `)
        .bind(assetId)
        .all();

      if (!linkedRisksResult.success || !linkedRisksResult.results || linkedRisksResult.results.length === 0) {
        console.log(`ℹ️ Asset ${assetId} not linked to any risks`);
        return [];
      }

      const results: ReclassificationResult[] = [];

      for (const row of linkedRisksResult.results as any[]) {
        const result = await this.reclassifyRisk(row.risk_id);
        if (result) {
          results.push(result);
        }
      }

      console.log(`✅ Reclassified ${results.length} risks affected by asset ${assetId}`);
      return results;

    } catch (error) {
      console.error(`❌ Error reclassifying risks for asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Reclassify all risks (bulk operation)
   * Use for periodic recalculation or after major changes
   * 
   * @returns Array of reclassification results
   */
  async reclassifyAllRisks(): Promise<ReclassificationResult[]> {
    try {
      // Get all risks that have linked assets
      const risksResult = await this.db
        .prepare(`
          SELECT DISTINCT r.id
          FROM risks r
          JOIN risk_assets ra ON r.id = ra.risk_id
          WHERE r.status IN ('active', 'monitoring', 'pending')
        `)
        .all();

      if (!risksResult.success || !risksResult.results || risksResult.results.length === 0) {
        console.log('ℹ️ No risks with linked assets found');
        return [];
      }

      const results: ReclassificationResult[] = [];

      for (const row of risksResult.results as any[]) {
        const result = await this.reclassifyRisk(row.id);
        if (result) {
          results.push(result);
        }
      }

      console.log(`✅ Bulk reclassification complete: ${results.length} risks updated`);
      return results;

    } catch (error) {
      console.error('❌ Error in bulk reclassification:', error);
      throw error;
    }
  }

  /**
   * Calculate dynamic risk scores based on linked assets
   * 
   * Algorithm:
   * 1. Base scores: Use original probability and impact as baseline
   * 2. Impact adjustment: Increase impact based on max asset criticality
   *    - Critical assets: +40% impact (capped at 5)
   *    - High assets: +30% impact
   *    - Medium assets: +20% impact
   *    - Low assets: +10% impact
   * 3. Probability adjustment: Increase probability based on number of critical assets
   *    - Multiple critical assets increase likelihood of risk occurrence
   * 
   * @param baseProbability Original probability (1-5)
   * @param baseImpact Original impact (1-5)
   * @param linkedAssets Array of linked assets with criticality
   * @returns New probability, impact, and explanation
   */
  private calculateDynamicRisk(
    baseProbability: number,
    baseImpact: number,
    linkedAssets: AssetCriticality[]
  ): { newProbability: number; newImpact: number; reason: string } {
    // Find highest criticality asset
    const maxCriticality = Math.max(...linkedAssets.map(a => a.criticalityScore));
    const criticalAssetCount = linkedAssets.filter(a => a.criticalityScore >= 5).length;
    const highAssetCount = linkedAssets.filter(a => a.criticalityScore >= 4).length;

    // Calculate impact multiplier based on max criticality
    let impactMultiplier = 1.0;
    let impactReason = '';

    if (maxCriticality >= 5) {
      impactMultiplier = 1.4; // +40% for critical assets
      impactReason = 'Critical assets linked';
    } else if (maxCriticality >= 4) {
      impactMultiplier = 1.3; // +30% for high criticality
      impactReason = 'High criticality assets linked';
    } else if (maxCriticality >= 3) {
      impactMultiplier = 1.2; // +20% for medium criticality
      impactReason = 'Medium criticality assets linked';
    } else {
      impactMultiplier = 1.1; // +10% for low criticality
      impactReason = 'Low criticality assets linked';
    }

    // Calculate probability adjustment based on number of critical assets
    let probabilityAdjustment = 0;
    let probabilityReason = '';

    if (criticalAssetCount >= 3) {
      probabilityAdjustment = 1; // +1 for 3+ critical assets
      probabilityReason = 'Multiple critical assets increase likelihood';
    } else if (criticalAssetCount >= 2) {
      probabilityAdjustment = 0.5; // +0.5 for 2 critical assets
      probabilityReason = 'Two critical assets increase likelihood';
    } else if (highAssetCount >= 3) {
      probabilityAdjustment = 0.5; // +0.5 for 3+ high assets
      probabilityReason = 'Multiple high-criticality assets increase likelihood';
    }

    // Calculate new values (capped at 5)
    const newImpact = Math.min(5, Math.round(baseImpact * impactMultiplier));
    const newProbability = Math.min(5, Math.round(baseProbability + probabilityAdjustment));

    // Build reason string
    const reasons: string[] = [];
    if (newImpact !== baseImpact) {
      reasons.push(`Impact: ${baseImpact} → ${newImpact} (${impactReason})`);
    }
    if (newProbability !== baseProbability) {
      reasons.push(`Probability: ${baseProbability} → ${newProbability} (${probabilityReason})`);
    }

    const reason = reasons.length > 0 
      ? reasons.join('; ')
      : 'No changes from linked assets';

    return {
      newProbability,
      newImpact,
      reason
    };
  }

  /**
   * Get reclassification recommendations without applying changes
   * Useful for previewing impact of asset criticality changes
   * 
   * @param riskId Risk database ID
   * @returns Reclassification preview or null
   */
  async previewReclassification(riskId: number): Promise<ReclassificationResult | null> {
    try {
      // Get current risk details
      const riskResult = await this.db
        .prepare('SELECT id, probability, impact, title FROM risks WHERE id = ?')
        .bind(riskId)
        .first<{ id: number; probability: number; impact: number; title: string }>();

      if (!riskResult) {
        return null;
      }

      // Get linked assets with criticality
      const linkedAssetsResult = await this.db
        .prepare(`
          SELECT 
            ra.asset_id,
            ra.impact_weight,
            a.name as asset_name,
            a.criticality,
            a.status
          FROM risk_assets ra
          JOIN assets a ON ra.asset_id = a.id
          WHERE ra.risk_id = ?
            AND a.status = 'active'
        `)
        .bind(riskId)
        .all();

      if (!linkedAssetsResult.success || !linkedAssetsResult.results || linkedAssetsResult.results.length === 0) {
        return null;
      }

      const linkedAssets: AssetCriticality[] = linkedAssetsResult.results.map((row: any) => ({
        assetId: row.asset_id,
        assetName: row.asset_name,
        criticality: (row.criticality || 'medium').toLowerCase(),
        criticalityScore: CRITICALITY_SCORES[(row.criticality || 'medium').toLowerCase()] || 3,
        impactWeight: row.impact_weight || 1.0
      }));

      const { newProbability, newImpact, reason } = this.calculateDynamicRisk(
        riskResult.probability,
        riskResult.impact,
        linkedAssets
      );

      const oldRiskScore = riskResult.probability * riskResult.impact;
      const newRiskScore = newProbability * newImpact;

      return {
        riskId,
        oldProbability: riskResult.probability,
        oldImpact: riskResult.impact,
        newProbability,
        newImpact,
        oldRiskScore,
        newRiskScore,
        reason,
        linkedAssets
      };

    } catch (error) {
      console.error(`Error previewing reclassification for risk ${riskId}:`, error);
      throw error;
    }
  }
}
