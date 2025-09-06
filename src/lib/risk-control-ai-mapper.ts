/**
 * AI-Powered Risk-Control Mapping System
 * Automatically links risks to appropriate controls from compliance frameworks
 */

export interface RiskControlMapping {
  risk_id: number;
  control_id: string;
  framework_id: number;
  control_type: 'preventive' | 'detective' | 'corrective';
  effectiveness_rating: number; // 1-5
  mapping_confidence: number; // 0-1
  ai_rationale: string;
}

export interface MappingPattern {
  risk_keywords: string[];
  control_family: string;
  control_keywords: string[];
  mapping_strength: number;
  framework_type: string;
}

export class AIRiskControlMapper {
  private patterns: Map<string, MappingPattern[]> = new Map();

  constructor(private db: D1Database) {
    this.initializePatterns();
  }

  /**
   * Initialize AI mapping patterns from database
   */
  private async initializePatterns() {
    try {
      const patterns = await this.db.prepare(`
        SELECT risk_category, risk_keywords, control_family, control_keywords, 
               mapping_strength, framework_type
        FROM ai_mapping_patterns
        ORDER BY mapping_strength DESC
      `).all();

      patterns.results.forEach((pattern: any) => {
        const key = pattern.framework_type.toLowerCase();
        if (!this.patterns.has(key)) {
          this.patterns.set(key, []);
        }
        
        this.patterns.get(key)!.push({
          risk_keywords: JSON.parse(pattern.risk_keywords),
          control_family: pattern.control_family,
          control_keywords: JSON.parse(pattern.control_keywords),
          mapping_strength: pattern.mapping_strength,
          framework_type: pattern.framework_type
        });
      });

      console.log('🤖 AI Risk-Control Mapper initialized with', patterns.results.length, 'patterns');
    } catch (error) {
      console.error('❌ Failed to initialize AI patterns:', error);
    }
  }

  /**
   * Automatically map a risk to appropriate controls using AI analysis
   */
  async mapRiskToControls(riskId: number, riskTitle: string, riskDescription: string, riskCategory: string): Promise<RiskControlMapping[]> {
    const mappings: RiskControlMapping[] = [];

    try {
      // Get available frameworks
      const frameworks = await this.db.prepare(`
        SELECT id, name, type FROM compliance_frameworks 
        WHERE is_active = 1
      `).all();

      for (const framework of frameworks.results) {
        const frameworkMappings = await this.mapRiskToFrameworkControls(
          riskId, 
          riskTitle, 
          riskDescription, 
          riskCategory, 
          framework as any
        );
        mappings.push(...frameworkMappings);
      }

      // Store mappings in database
      for (const mapping of mappings) {
        await this.storeMappingInDatabase(mapping);
      }

      console.log(`🎯 Generated ${mappings.length} AI mappings for risk: ${riskTitle}`);
      return mappings;

    } catch (error) {
      console.error('❌ Error in AI risk mapping:', error);
      return [];
    }
  }

  /**
   * Map risk to controls within a specific framework
   */
  private async mapRiskToFrameworkControls(
    riskId: number,
    riskTitle: string,
    riskDescription: string,
    riskCategory: string,
    framework: any
  ): Promise<RiskControlMapping[]> {
    const mappings: RiskControlMapping[] = [];
    const frameworkType = framework.type.toLowerCase();
    const patterns = this.patterns.get(frameworkType) || [];

    // Combine risk text for analysis
    const riskText = `${riskTitle} ${riskDescription} ${riskCategory}`.toLowerCase();

    // Get available controls for this framework
    const controls = await this.db.prepare(`
      SELECT control_id, title, description, category
      FROM compliance_controls
      WHERE framework_id = ?
    `).bind(framework.id).all();

    // Analyze each control for relevance to the risk
    for (const control of controls.results) {
      const controlText = `${(control as any).title} ${(control as any).description} ${(control as any).category}`.toLowerCase();
      
      // Calculate mapping confidence using multiple factors
      const confidence = this.calculateMappingConfidence(
        riskText,
        controlText,
        riskCategory,
        patterns
      );

      // Only create mapping if confidence is above threshold
      if (confidence >= 0.6) {
        const controlType = this.determineControlType(controlText);
        const effectiveness = this.estimateControlEffectiveness(riskText, controlText);
        const rationale = this.generateMappingRationale(riskTitle, (control as any).title, confidence);

        mappings.push({
          risk_id: riskId,
          control_id: (control as any).control_id,
          framework_id: framework.id,
          control_type: controlType,
          effectiveness_rating: effectiveness,
          mapping_confidence: confidence,
          ai_rationale: rationale
        });
      }
    }

    return mappings.sort((a, b) => b.mapping_confidence - a.mapping_confidence).slice(0, 5); // Top 5 matches
  }

  /**
   * Calculate mapping confidence based on text similarity and learned patterns
   */
  private calculateMappingConfidence(
    riskText: string,
    controlText: string,
    riskCategory: string,
    patterns: MappingPattern[]
  ): number {
    let confidence = 0;

    // 1. Keyword matching score (40%)
    const keywordScore = this.calculateKeywordSimilarity(riskText, controlText);
    confidence += keywordScore * 0.4;

    // 2. Pattern matching score (40%)
    const patternScore = this.calculatePatternScore(riskText, controlText, riskCategory, patterns);
    confidence += patternScore * 0.4;

    // 3. Category alignment score (20%)
    const categoryScore = this.calculateCategoryAlignment(riskText, controlText);
    confidence += categoryScore * 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate keyword similarity between risk and control text
   */
  private calculateKeywordSimilarity(riskText: string, controlText: string): number {
    const riskWords = this.extractKeywords(riskText);
    const controlWords = this.extractKeywords(controlText);

    if (riskWords.length === 0 || controlWords.length === 0) return 0;

    const intersection = riskWords.filter(word => controlWords.includes(word));
    const union = [...new Set([...riskWords, ...controlWords])];

    return intersection.length / Math.max(union.length, 1);
  }

  /**
   * Calculate score based on learned patterns
   */
  private calculatePatternScore(
    riskText: string,
    controlText: string,
    riskCategory: string,
    patterns: MappingPattern[]
  ): number {
    let maxScore = 0;

    for (const pattern of patterns) {
      // Check if risk matches pattern keywords
      const riskMatches = pattern.risk_keywords.some(keyword => 
        riskText.includes(keyword.toLowerCase()) || 
        riskCategory.toLowerCase().includes(keyword.toLowerCase())
      );

      // Check if control matches pattern keywords
      const controlMatches = pattern.control_keywords.some(keyword =>
        controlText.includes(keyword.toLowerCase())
      );

      if (riskMatches && controlMatches) {
        maxScore = Math.max(maxScore, pattern.mapping_strength);
      }
    }

    return maxScore;
  }

  /**
   * Calculate category alignment score
   */
  private calculateCategoryAlignment(riskText: string, controlText: string): number {
    const securityCategories = [
      ['access', 'authentication', 'authorization', 'login', 'password'],
      ['data', 'information', 'encryption', 'classification', 'protection'],
      ['network', 'firewall', 'intrusion', 'monitoring', 'detection'],
      ['vendor', 'third-party', 'supplier', 'outsourcing', 'contractor'],
      ['incident', 'response', 'recovery', 'forensics', 'management'],
      ['backup', 'continuity', 'disaster', 'recovery', 'resilience']
    ];

    for (const category of securityCategories) {
      const riskInCategory = category.some(word => riskText.includes(word));
      const controlInCategory = category.some(word => controlText.includes(word));
      
      if (riskInCategory && controlInCategory) {
        return 0.8; // High alignment
      }
    }

    return 0.3; // Low alignment
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Determine control type based on control description
   */
  private determineControlType(controlText: string): 'preventive' | 'detective' | 'corrective' {
    if (controlText.includes('monitor') || controlText.includes('detect') || controlText.includes('alert') || controlText.includes('log')) {
      return 'detective';
    }
    if (controlText.includes('response') || controlText.includes('recover') || controlText.includes('remediate') || controlText.includes('correct')) {
      return 'corrective';
    }
    return 'preventive'; // Default
  }

  /**
   * Estimate control effectiveness rating
   */
  private estimateControlEffectiveness(riskText: string, controlText: string): number {
    const relevanceScore = this.calculateKeywordSimilarity(riskText, controlText);
    
    if (relevanceScore > 0.7) return 5; // Very effective
    if (relevanceScore > 0.5) return 4; // Effective
    if (relevanceScore > 0.3) return 3; // Moderately effective
    if (relevanceScore > 0.1) return 2; // Somewhat effective
    return 1; // Minimally effective
  }

  /**
   * Generate human-readable rationale for the mapping
   */
  private generateMappingRationale(riskTitle: string, controlTitle: string, confidence: number): string {
    if (confidence > 0.8) {
      return `Strong correlation identified between "${riskTitle}" and "${controlTitle}" control. High keyword overlap and pattern matching suggest this control is highly relevant for mitigating this risk.`;
    } else if (confidence > 0.6) {
      return `Moderate correlation found between "${riskTitle}" and "${controlTitle}" control. Several matching keywords and security categories suggest this control provides relevant protection.`;
    } else {
      return `Basic correlation detected between "${riskTitle}" and "${controlTitle}" control. Some keyword matches suggest potential relevance for risk mitigation.`;
    }
  }

  /**
   * Store mapping in database
   */
  private async storeMappingInDatabase(mapping: RiskControlMapping): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO risk_control_mappings 
        (risk_id, control_id, framework_id, control_type, effectiveness_rating, mapping_confidence, ai_rationale, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        mapping.risk_id,
        mapping.control_id,
        mapping.framework_id,
        mapping.control_type,
        mapping.effectiveness_rating,
        mapping.mapping_confidence,
        mapping.ai_rationale
      ).run();
    } catch (error) {
      console.error('❌ Error storing mapping:', error);
    }
  }

  /**
   * Get risk-control mappings for a specific risk
   */
  async getRiskControlMappings(riskId: number): Promise<any[]> {
    return await this.db.prepare(`
      SELECT 
        rcm.*,
        cc.title as control_title,
        cc.description as control_description,
        cf.name as framework_name,
        cf.type as framework_type
      FROM risk_control_mappings rcm
      LEFT JOIN compliance_controls cc ON rcm.control_id = cc.control_id AND rcm.framework_id = cc.framework_id
      LEFT JOIN compliance_frameworks cf ON rcm.framework_id = cf.id
      WHERE rcm.risk_id = ?
      ORDER BY rcm.mapping_confidence DESC
    `).bind(riskId).all();
  }

  /**
   * Bulk map all unmapped risks
   */
  async mapAllUnmappedRisks(): Promise<number> {
    try {
      // Get risks that don't have any control mappings
      // Use risks_simple for production compatibility (Cloudflare Pages)
      const unmappedRisks = await this.db.prepare(`
        SELECT r.id, r.title, r.description, r.category 
        FROM risks_simple r
        LEFT JOIN risk_control_mappings rcm ON r.id = rcm.risk_id
        WHERE r.status = 'active' AND rcm.id IS NULL
      `).all();

      let mappedCount = 0;
      for (const risk of unmappedRisks.results) {
        const riskData = risk as any;
        const mappings = await this.mapRiskToControls(
          riskData.id,
          riskData.title,
          riskData.description || '',
          riskData.category || ''
        );
        if (mappings.length > 0) {
          mappedCount++;
        }
      }

      console.log(`🎯 Auto-mapped ${mappedCount} risks to controls`);
      return mappedCount;
    } catch (error) {
      console.error('❌ Error in bulk mapping:', error);
      return 0;
    }
  }
}