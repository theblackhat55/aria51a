/**
 * Automated Threat Modeling & Attack Path Analysis Service for ARIA5.1
 * 
 * Provides comprehensive threat modeling capabilities:
 * - Automated threat identification and classification
 * - Attack path analysis and mapping
 * - Attack surface assessment
 * - Threat actor profiling and tactics analysis
 * - Kill chain and MITRE ATT&CK framework mapping
 * - Risk-based threat prioritization
 * - Mitigation strategy recommendations
 * 
 * Features:
 * - STRIDE threat modeling methodology
 * - MITRE ATT&CK technique mapping
 * - Graph-based attack path analysis
 * - Automated threat landscape updates
 * - Integration with vulnerability databases
 * - Threat intelligence correlation
 */

export interface ThreatModel {
  id: string;
  name: string;
  description: string;
  scope: string;
  assetId?: number;
  systemId?: string;
  methodology: 'STRIDE' | 'PASTA' | 'OCTAVE' | 'TRIKE' | 'VAST';
  threats: Threat[];
  attackPaths: AttackPath[];
  mitigations: ThreatMitigation[];
  riskScore: number;
  lastUpdated: string;
  createdAt: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
}

export interface Threat {
  id: string;
  modelId: string;
  category: 'spoofing' | 'tampering' | 'repudiation' | 'information_disclosure' | 'denial_of_service' | 'elevation_of_privilege';
  title: string;
  description: string;
  threatActor: ThreatActor;
  techniques: MITRETechnique[];
  assets: string[];
  likelihood: number; // 1-10
  impact: number; // 1-10
  riskScore: number;
  cvssVector?: string;
  cweIds: string[];
  killChainPhases: KillChainPhase[];
  prerequisites: string[];
  indicators: string[];
  mitigations: string[];
  status: 'identified' | 'analyzed' | 'mitigated' | 'accepted' | 'transferred';
}

export interface AttackPath {
  id: string;
  modelId: string;
  name: string;
  description: string;
  startNode: AttackNode;
  endNode: AttackNode;
  nodes: AttackNode[];
  edges: AttackEdge[];
  probability: number;
  complexity: 'low' | 'medium' | 'high';
  timeToExploit: number; // hours
  detectionDifficulty: 'easy' | 'medium' | 'hard';
  impactScore: number;
  mitigationCoverage: number; // percentage
}

export interface AttackNode {
  id: string;
  type: 'asset' | 'vulnerability' | 'technique' | 'objective';
  name: string;
  description: string;
  properties: Record<string, any>;
  mitigations: string[];
  detectionRules: string[];
}

export interface AttackEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'exploits' | 'leads_to' | 'enables' | 'requires' | 'mitigates';
  probability: number;
  conditions: string[];
}

export interface ThreatActor {
  id: string;
  name: string;
  type: 'nation_state' | 'cybercriminal' | 'hacktivist' | 'insider' | 'script_kiddie' | 'terrorist';
  sophistication: 'minimal' | 'intermediate' | 'advanced' | 'expert' | 'innovator';
  motivation: string[];
  resources: 'individual' | 'club' | 'team' | 'organization' | 'government';
  capabilities: string[];
  ttps: string[]; // Tactics, Techniques, and Procedures
  aliases: string[];
  geography: string[];
  lastActivity?: string;
}

export interface MITRETechnique {
  id: string; // T1234
  name: string;
  tactic: string;
  description: string;
  platforms: string[];
  dataSource: string[];
  detection: string;
  mitigation: string[];
  subtechniques?: string[];
}

export interface KillChainPhase {
  phase: 'reconnaissance' | 'weaponization' | 'delivery' | 'exploitation' | 'installation' | 'command_control' | 'actions_objectives';
  description: string;
  techniques: string[];
  indicators: string[];
  mitigations: string[];
}

export interface ThreatMitigation {
  id: string;
  threatId: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  strategy: string;
  description: string;
  implementation: string;
  cost: 'low' | 'medium' | 'high';
  effectiveness: number; // 0-100%
  timeframe: string;
  responsible: string;
  status: 'planned' | 'in_progress' | 'implemented' | 'verified';
}

export interface ThreatIntelligence {
  id: string;
  source: string;
  type: 'ioc' | 'ttp' | 'vulnerability' | 'campaign' | 'actor' | 'malware';
  indicator: string;
  confidence: number;
  tlpLevel: 'white' | 'green' | 'amber' | 'red';
  description: string;
  tags: string[];
  firstSeen: string;
  lastSeen: string;
  threatActors: string[];
  campaigns: string[];
  malwareFamilies: string[];
  techniques: string[];
}

export interface ThreatAssessmentResult {
  overallRisk: number;
  topThreats: Threat[];
  criticalPaths: AttackPath[];
  exposedAssets: string[];
  recommendedMitigations: ThreatMitigation[];
  complianceImpact: {
    framework: string;
    controls: string[];
    gapAnalysis: string[];
  }[];
  executiveSummary: string;
}

export class ThreatModelingService {
  private db: any;
  private threatModels: Map<string, ThreatModel> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private mitreFramework: Map<string, MITRETechnique> = new Map();
  private isInitialized = false;

  constructor(database?: any) {
    this.db = database;
    if (this.db) {
      this.initializeThreatModeling();
    }
  }

  /**
   * Initialize threat modeling database and framework data
   */
  private async initializeThreatModeling(): Promise<void> {
    try {
      // Threat models table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS threat_models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          scope TEXT NOT NULL,
          asset_id INTEGER,
          system_id TEXT,
          methodology TEXT NOT NULL CHECK (methodology IN ('STRIDE', 'PASTA', 'OCTAVE', 'TRIKE', 'VAST')),
          threats TEXT, -- JSON array
          attack_paths TEXT, -- JSON array
          mitigations TEXT, -- JSON array
          risk_score REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets(id)
        )
      `).run();

      // Threats table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS threats (
          id TEXT PRIMARY KEY,
          model_id TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('spoofing', 'tampering', 'repudiation', 'information_disclosure', 'denial_of_service', 'elevation_of_privilege')),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          threat_actor TEXT, -- JSON
          techniques TEXT, -- JSON array
          assets TEXT, -- JSON array
          likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 10),
          impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 10),
          risk_score REAL NOT NULL,
          cvss_vector TEXT,
          cwe_ids TEXT, -- JSON array
          kill_chain_phases TEXT, -- JSON array
          prerequisites TEXT, -- JSON array
          indicators TEXT, -- JSON array
          mitigations TEXT, -- JSON array
          status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'analyzed', 'mitigated', 'accepted', 'transferred')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (model_id) REFERENCES threat_models(id) ON DELETE CASCADE
        )
      `).run();

      // Attack paths table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS attack_paths (
          id TEXT PRIMARY KEY,
          model_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          start_node TEXT, -- JSON
          end_node TEXT, -- JSON
          nodes TEXT NOT NULL, -- JSON array
          edges TEXT NOT NULL, -- JSON array
          probability REAL NOT NULL,
          complexity TEXT NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
          time_to_exploit INTEGER NOT NULL,
          detection_difficulty TEXT NOT NULL CHECK (detection_difficulty IN ('easy', 'medium', 'hard')),
          impact_score REAL NOT NULL,
          mitigation_coverage REAL NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (model_id) REFERENCES threat_models(id) ON DELETE CASCADE
        )
      `).run();

      // Threat actors table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS threat_actors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('nation_state', 'cybercriminal', 'hacktivist', 'insider', 'script_kiddie', 'terrorist')),
          sophistication TEXT NOT NULL CHECK (sophistication IN ('minimal', 'intermediate', 'advanced', 'expert', 'innovator')),
          motivation TEXT, -- JSON array
          resources TEXT NOT NULL CHECK (resources IN ('individual', 'club', 'team', 'organization', 'government')),
          capabilities TEXT, -- JSON array
          ttps TEXT, -- JSON array
          aliases TEXT, -- JSON array
          geography TEXT, -- JSON array
          last_activity DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Threat intelligence table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS threat_intelligence (
          id TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('ioc', 'ttp', 'vulnerability', 'campaign', 'actor', 'malware')),
          indicator TEXT NOT NULL,
          confidence REAL NOT NULL,
          tlp_level TEXT NOT NULL CHECK (tlp_level IN ('white', 'green', 'amber', 'red')),
          description TEXT NOT NULL,
          tags TEXT, -- JSON array
          first_seen DATETIME NOT NULL,
          last_seen DATETIME NOT NULL,
          threat_actors TEXT, -- JSON array
          campaigns TEXT, -- JSON array
          malware_families TEXT, -- JSON array
          techniques TEXT, -- JSON array
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // MITRE ATT&CK techniques table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS mitre_techniques (
          id TEXT PRIMARY KEY, -- T1234
          name TEXT NOT NULL,
          tactic TEXT NOT NULL,
          description TEXT NOT NULL,
          platforms TEXT, -- JSON array
          data_source TEXT, -- JSON array
          detection TEXT,
          mitigation TEXT, -- JSON array
          subtechniques TEXT, -- JSON array
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Create indexes for performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_threats_model_id ON threats(model_id)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_threats_category ON threats(category)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_attack_paths_model_id ON attack_paths(model_id)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_threat_intelligence_type ON threat_intelligence(type)
      `).run();

      // Initialize MITRE ATT&CK framework
      await this.initializeMITREFramework();

      // Load threat actors
      await this.initializeThreatActors();

      // Load existing threat models
      await this.loadThreatModels();

      this.isInitialized = true;
      console.log('✅ Threat Modeling engine initialized');

    } catch (error) {
      console.error('Failed to initialize threat modeling:', error);
    }
  }

  /**
   * Create a new threat model
   */
  async createThreatModel(config: {
    name: string;
    description: string;
    scope: string;
    assetId?: number;
    systemId?: string;
    methodology?: ThreatModel['methodology'];
  }): Promise<{ success: boolean; model?: ThreatModel; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Threat modeling not initialized' };
      }

      const modelId = this.generateThreatModelId();
      
      const threatModel: ThreatModel = {
        id: modelId,
        name: config.name,
        description: config.description,
        scope: config.scope,
        assetId: config.assetId,
        systemId: config.systemId,
        methodology: config.methodology || 'STRIDE',
        threats: [],
        attackPaths: [],
        mitigations: [],
        riskScore: 0,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      // Auto-generate initial threats based on methodology
      if (config.methodology === 'STRIDE' || !config.methodology) {
        threatModel.threats = await this.generateSTRIDEThreats(modelId, config.scope);
      }

      // Store in database
      await this.storeThreatModel(threatModel);

      // Cache in memory
      this.threatModels.set(modelId, threatModel);

      console.log('🛡️ Threat model created:', {
        id: modelId,
        name: config.name,
        methodology: threatModel.methodology,
        threats: threatModel.threats.length
      });

      return { success: true, model: threatModel };

    } catch (error) {
      console.error('Threat model creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Creation failed'
      };
    }
  }

  /**
   * Analyze attack paths for a threat model
   */
  async analyzeAttackPaths(modelId: string): Promise<{ success: boolean; paths?: AttackPath[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Threat modeling not initialized' };
      }

      const model = this.threatModels.get(modelId);
      if (!model) {
        return { success: false, error: 'Threat model not found' };
      }

      const attackPaths: AttackPath[] = [];

      // Generate attack paths for each threat
      for (const threat of model.threats) {
        const paths = await this.generateAttackPathsForThreat(threat, model);
        attackPaths.push(...paths);
      }

      // Calculate path probabilities and risks
      for (const path of attackPaths) {
        path.probability = this.calculatePathProbability(path);
        path.impactScore = this.calculatePathImpact(path);
        path.mitigationCoverage = this.calculateMitigationCoverage(path, model.mitigations);
      }

      // Update model
      model.attackPaths = attackPaths;
      model.lastUpdated = new Date().toISOString();
      await this.updateThreatModel(model);

      console.log('🎯 Attack path analysis completed:', {
        modelId,
        paths: attackPaths.length,
        highRiskPaths: attackPaths.filter(p => p.impactScore > 7).length
      });

      return { success: true, paths: attackPaths };

    } catch (error) {
      console.error('Attack path analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Perform comprehensive threat assessment
   */
  async performThreatAssessment(modelId: string): Promise<{ success: boolean; assessment?: ThreatAssessmentResult; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Threat modeling not initialized' };
      }

      const model = this.threatModels.get(modelId);
      if (!model) {
        return { success: false, error: 'Threat model not found' };
      }

      // Calculate overall risk score
      const overallRisk = this.calculateOverallRisk(model);

      // Identify top threats
      const topThreats = model.threats
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      // Identify critical attack paths
      const criticalPaths = model.attackPaths
        .filter(path => path.impactScore > 7 && path.mitigationCoverage < 50)
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, 5);

      // Identify exposed assets
      const exposedAssets = this.identifyExposedAssets(model);

      // Generate recommended mitigations
      const recommendedMitigations = await this.generateRecommendedMitigations(model);

      // Analyze compliance impact
      const complianceImpact = await this.analyzeComplianceImpact(model);

      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        overallRisk,
        topThreats,
        criticalPaths,
        recommendedMitigations
      );

      const assessment: ThreatAssessmentResult = {
        overallRisk,
        topThreats,
        criticalPaths,
        exposedAssets,
        recommendedMitigations,
        complianceImpact,
        executiveSummary
      };

      console.log('📊 Threat assessment completed:', {
        modelId,
        overallRisk,
        topThreats: topThreats.length,
        criticalPaths: criticalPaths.length,
        recommendedMitigations: recommendedMitigations.length
      });

      return { success: true, assessment };

    } catch (error) {
      console.error('Threat assessment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Assessment failed'
      };
    }
  }

  /**
   * Update threat intelligence data
   */
  async updateThreatIntelligence(intelligence: Omit<ThreatIntelligence, 'id'>): Promise<{ success: boolean; intelligenceId?: string; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Threat modeling not initialized' };
      }

      const intelligenceId = this.generateThreatIntelligenceId();
      const fullIntelligence: ThreatIntelligence = {
        ...intelligence,
        id: intelligenceId
      };

      // Store in database
      await this.storeThreatIntelligence(fullIntelligence);

      // Cache in memory
      this.threatIntelligence.set(intelligenceId, fullIntelligence);

      // Update related threat models
      await this.updateThreatModelsWithIntelligence(fullIntelligence);

      console.log('🔍 Threat intelligence updated:', {
        id: intelligenceId,
        type: intelligence.type,
        confidence: intelligence.confidence
      });

      return { success: true, intelligenceId };

    } catch (error) {
      console.error('Threat intelligence update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Map threats to MITRE ATT&CK framework
   */
  async mapToMITREAttack(threatId: string): Promise<{ success: boolean; mapping?: MITRETechnique[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Threat modeling not initialized' };
      }

      // Find threat
      let threat: Threat | undefined;
      for (const model of this.threatModels.values()) {
        threat = model.threats.find(t => t.id === threatId);
        if (threat) break;
      }

      if (!threat) {
        return { success: false, error: 'Threat not found' };
      }

      // Map to MITRE techniques
      const mapping = await this.generateMITREMapping(threat);

      // Update threat with techniques
      threat.techniques = mapping;

      console.log('🎯 MITRE ATT&CK mapping completed:', {
        threatId,
        techniques: mapping.length
      });

      return { success: true, mapping };

    } catch (error) {
      console.error('MITRE mapping failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mapping failed'
      };
    }
  }

  /**
   * Get threat modeling statistics
   */
  async getThreatModelingStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Threat modeling not initialized' };
      }

      const modelStats = await this.db.prepare(`
        SELECT 
          methodology,
          status,
          COUNT(*) as count,
          AVG(risk_score) as avg_risk
        FROM threat_models
        GROUP BY methodology, status
      `).all();

      const threatStats = await this.db.prepare(`
        SELECT 
          category,
          status,
          COUNT(*) as count,
          AVG(risk_score) as avg_risk,
          AVG(likelihood) as avg_likelihood,
          AVG(impact) as avg_impact
        FROM threats
        GROUP BY category, status
      `).all();

      const pathStats = await this.db.prepare(`
        SELECT 
          complexity,
          COUNT(*) as count,
          AVG(probability) as avg_probability,
          AVG(impact_score) as avg_impact,
          AVG(mitigation_coverage) as avg_coverage
        FROM attack_paths
        GROUP BY complexity
      `).all();

      const intelligenceStats = await this.db.prepare(`
        SELECT 
          type,
          COUNT(*) as count,
          AVG(confidence) as avg_confidence
        FROM threat_intelligence
        WHERE first_seen >= datetime('now', '-30 days')
        GROUP BY type
      `).all();

      return {
        success: true,
        stats: {
          models: {
            total: this.threatModels.size,
            byMethodologyAndStatus: modelStats.results || []
          },
          threats: {
            byCategoryAndStatus: threatStats.results || [],
            total: threatStats.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0
          },
          attackPaths: {
            byComplexity: pathStats.results || [],
            total: pathStats.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0
          },
          intelligence: {
            recent: intelligenceStats.results || [],
            total: this.threatIntelligence.size
          },
          mitreFramework: {
            techniques: this.mitreFramework.size
          }
        }
      };

    } catch (error) {
      console.error('Failed to get threat modeling statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Private helper methods

  private async generateSTRIDEThreats(modelId: string, scope: string): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    const strideCategories = [
      {
        category: 'spoofing' as const,
        title: 'Identity Spoofing',
        description: 'Attacker impersonates another user or system to gain unauthorized access',
        likelihood: 6,
        impact: 7
      },
      {
        category: 'tampering' as const,
        title: 'Data Tampering',
        description: 'Unauthorized modification of data in transit or at rest',
        likelihood: 5,
        impact: 8
      },
      {
        category: 'repudiation' as const,
        title: 'Action Repudiation',
        description: 'User denies performing actions without sufficient proof',
        likelihood: 4,
        impact: 5
      },
      {
        category: 'information_disclosure' as const,
        title: 'Information Disclosure',
        description: 'Unauthorized access to sensitive information',
        likelihood: 7,
        impact: 9
      },
      {
        category: 'denial_of_service' as const,
        title: 'Denial of Service',
        description: 'Service availability is compromised or disrupted',
        likelihood: 6,
        impact: 6
      },
      {
        category: 'elevation_of_privilege' as const,
        title: 'Privilege Escalation',
        description: 'Attacker gains higher privileges than authorized',
        likelihood: 5,
        impact: 9
      }
    ];

    for (const strideCategory of strideCategories) {
      const threat: Threat = {
        id: this.generateThreatId(),
        modelId,
        category: strideCategory.category,
        title: strideCategory.title,
        description: strideCategory.description,
        threatActor: await this.getGenericThreatActor(),
        techniques: [],
        assets: [scope],
        likelihood: strideCategory.likelihood,
        impact: strideCategory.impact,
        riskScore: strideCategory.likelihood * strideCategory.impact,
        cweIds: await this.getCWEsForCategory(strideCategory.category),
        killChainPhases: await this.getKillChainForCategory(strideCategory.category),
        prerequisites: [],
        indicators: [],
        mitigations: [],
        status: 'identified'
      };

      threats.push(threat);
    }

    return threats;
  }

  private async generateAttackPathsForThreat(threat: Threat, model: ThreatModel): Promise<AttackPath[]> {
    const paths: AttackPath[] = [];

    // Generate basic attack path
    const pathId = this.generateAttackPathId();
    
    const startNode: AttackNode = {
      id: `start_${pathId}`,
      type: 'asset',
      name: 'External Network',
      description: 'Attacker starting point',
      properties: { exposure: 'high' },
      mitigations: [],
      detectionRules: []
    };

    const targetNode: AttackNode = {
      id: `target_${pathId}`,
      type: 'objective',
      name: threat.title,
      description: threat.description,
      properties: { value: threat.impact },
      mitigations: threat.mitigations,
      detectionRules: []
    };

    const intermediateNode: AttackNode = {
      id: `intermediate_${pathId}`,
      type: 'vulnerability',
      name: `${threat.category} vulnerability`,
      description: 'Exploitable weakness',
      properties: { severity: 'medium' },
      mitigations: [],
      detectionRules: []
    };

    const edges: AttackEdge[] = [
      {
        id: `edge_1_${pathId}`,
        source: startNode.id,
        target: intermediateNode.id,
        relationship: 'exploits',
        probability: 0.7,
        conditions: ['network access', 'vulnerability present']
      },
      {
        id: `edge_2_${pathId}`,
        source: intermediateNode.id,
        target: targetNode.id,
        relationship: 'leads_to',
        probability: 0.8,
        conditions: ['successful exploitation']
      }
    ];

    const path: AttackPath = {
      id: pathId,
      modelId: model.id,
      name: `${threat.title} Attack Path`,
      description: `Attack path leading to ${threat.title}`,
      startNode,
      endNode: targetNode,
      nodes: [startNode, intermediateNode, targetNode],
      edges,
      probability: 0.56, // 0.7 * 0.8
      complexity: this.calculateComplexity(threat.likelihood),
      timeToExploit: this.estimateTimeToExploit(threat),
      detectionDifficulty: this.assessDetectionDifficulty(threat),
      impactScore: threat.impact,
      mitigationCoverage: 0
    };

    paths.push(path);
    return paths;
  }

  private calculatePathProbability(path: AttackPath): number {
    let totalProbability = 1.0;
    
    for (const edge of path.edges) {
      totalProbability *= edge.probability;
    }

    return Math.round(totalProbability * 100) / 100;
  }

  private calculatePathImpact(path: AttackPath): number {
    // Impact based on target node properties and path complexity
    let impact = path.endNode.properties?.value || 5;
    
    switch (path.complexity) {
      case 'low':
        impact *= 1.2; // Easier attacks are more concerning
        break;
      case 'medium':
        impact *= 1.0;
        break;
      case 'high':
        impact *= 0.8; // Harder attacks less likely
        break;
    }

    return Math.min(10, Math.max(1, impact));
  }

  private calculateMitigationCoverage(path: AttackPath, modelMitigations: ThreatMitigation[]): number {
    let coveredNodes = 0;
    
    for (const node of path.nodes) {
      const hasEffectiveMitigation = node.mitigations.some(mitigation => 
        modelMitigations.some(m => m.strategy.includes(mitigation) && m.effectiveness > 50)
      );
      
      if (hasEffectiveMitigation) {
        coveredNodes++;
      }
    }

    return Math.round((coveredNodes / path.nodes.length) * 100);
  }

  private calculateOverallRisk(model: ThreatModel): number {
    if (model.threats.length === 0) return 0;

    const weightedRisk = model.threats.reduce((sum, threat) => {
      // Weight by probability of attack paths
      const pathProbability = model.attackPaths
        .filter(path => path.name.includes(threat.title))
        .reduce((max, path) => Math.max(max, path.probability), 0.5);
      
      return sum + (threat.riskScore * pathProbability);
    }, 0);

    return Math.min(10, weightedRisk / model.threats.length);
  }

  private identifyExposedAssets(model: ThreatModel): string[] {
    const exposedAssets = new Set<string>();

    for (const threat of model.threats) {
      if (threat.riskScore > 6 && threat.status === 'identified') {
        threat.assets.forEach(asset => exposedAssets.add(asset));
      }
    }

    return Array.from(exposedAssets);
  }

  private async generateRecommendedMitigations(model: ThreatModel): Promise<ThreatMitigation[]> {
    const mitigations: ThreatMitigation[] = [];

    // Generate mitigations for high-risk threats
    const highRiskThreats = model.threats.filter(t => t.riskScore > 6);

    for (const threat of highRiskThreats) {
      const mitigation: ThreatMitigation = {
        id: this.generateMitigationId(),
        threatId: threat.id,
        type: this.getMitigationType(threat.category),
        strategy: this.getMitigationStrategy(threat.category),
        description: `Mitigation for ${threat.title}`,
        implementation: this.getImplementationGuidance(threat.category),
        cost: this.estimateMitigationCost(threat.category),
        effectiveness: this.estimateMitigationEffectiveness(threat.category),
        timeframe: '30-90 days',
        responsible: 'Security Team',
        status: 'planned'
      };

      mitigations.push(mitigation);
    }

    return mitigations;
  }

  private async analyzeComplianceImpact(model: ThreatModel): Promise<ThreatAssessmentResult['complianceImpact']> {
    const complianceFrameworks = [
      {
        framework: 'ISO 27001',
        controls: ['A.12.1.1', 'A.12.6.1', 'A.13.1.1'],
        gapAnalysis: model.threats.filter(t => t.riskScore > 7).map(t => `Control gap for ${t.title}`)
      },
      {
        framework: 'NIST Cybersecurity Framework',
        controls: ['PR.IP-1', 'DE.CM-1', 'RS.RP-1'],
        gapAnalysis: model.attackPaths.filter(p => p.mitigationCoverage < 50).map(p => `Detection gap in ${p.name}`)
      }
    ];

    return complianceFrameworks;
  }

  private generateExecutiveSummary(
    overallRisk: number,
    topThreats: Threat[],
    criticalPaths: AttackPath[],
    mitigations: ThreatMitigation[]
  ): string {
    return `
Executive Summary: Threat Assessment

Overall Risk Score: ${overallRisk.toFixed(1)}/10

Key Findings:
• ${topThreats.length} high-priority threats identified
• ${criticalPaths.length} critical attack paths require immediate attention
• ${mitigations.length} mitigation strategies recommended

Top Threat Categories:
${topThreats.slice(0, 3).map(t => `• ${t.title} (Risk: ${t.riskScore.toFixed(1)})`).join('\n')}

Immediate Actions Required:
• Implement recommended mitigations for critical threats
• Enhance monitoring for identified attack paths  
• Review and update security controls for exposed assets

Risk Level: ${overallRisk > 7 ? 'HIGH' : overallRisk > 4 ? 'MEDIUM' : 'LOW'}
    `.trim();
  }

  // Framework initialization methods

  private async initializeMITREFramework(): Promise<void> {
    // Sample MITRE ATT&CK techniques
    const sampleTechniques: MITRETechnique[] = [
      {
        id: 'T1078',
        name: 'Valid Accounts',
        tactic: 'Initial Access',
        description: 'Adversaries may obtain and abuse credentials of existing accounts',
        platforms: ['Windows', 'Linux', 'macOS'],
        dataSource: ['Authentication logs', 'Process monitoring'],
        detection: 'Monitor for suspicious account usage patterns',
        mitigation: ['Multi-factor Authentication', 'Privileged Account Management'],
        subtechniques: ['T1078.001', 'T1078.002', 'T1078.003']
      },
      {
        id: 'T1190',
        name: 'Exploit Public-Facing Application',
        tactic: 'Initial Access',
        description: 'Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program',
        platforms: ['Windows', 'Linux', 'macOS'],
        dataSource: ['Web application firewall logs', 'Network monitoring'],
        detection: 'Monitor for unusual web traffic patterns and exploitation attempts',
        mitigation: ['Application Isolation', 'Network Segmentation', 'Update Software'],
        subtechniques: []
      },
      {
        id: 'T1059',
        name: 'Command and Scripting Interpreter',
        tactic: 'Execution',
        description: 'Adversaries may abuse command and script interpreters to execute commands',
        platforms: ['Windows', 'Linux', 'macOS'],
        dataSource: ['Process monitoring', 'Command line interface'],
        detection: 'Monitor for suspicious command line activity',
        mitigation: ['Execution Prevention', 'Privileged Account Management'],
        subtechniques: ['T1059.001', 'T1059.003', 'T1059.007']
      }
    ];

    for (const technique of sampleTechniques) {
      this.mitreFramework.set(technique.id, technique);
      
      if (this.db) {
        await this.db.prepare(`
          INSERT OR REPLACE INTO mitre_techniques (
            id, name, tactic, description, platforms, data_source,
            detection, mitigation, subtechniques
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          technique.id,
          technique.name,
          technique.tactic,
          technique.description,
          JSON.stringify(technique.platforms),
          JSON.stringify(technique.dataSource),
          technique.detection,
          JSON.stringify(technique.mitigation),
          JSON.stringify(technique.subtechniques)
        ).run();
      }
    }
  }

  private async initializeThreatActors(): Promise<void> {
    const sampleActors: ThreatActor[] = [
      {
        id: 'apt1',
        name: 'Advanced Persistent Threat Group 1',
        type: 'nation_state',
        sophistication: 'advanced',
        motivation: ['espionage', 'data_theft'],
        resources: 'government',
        capabilities: ['zero_day_exploits', 'social_engineering', 'supply_chain_attacks'],
        ttps: ['spear_phishing', 'watering_hole', 'living_off_the_land'],
        aliases: ['APT1', 'Comment Crew'],
        geography: ['China'],
        lastActivity: new Date().toISOString()
      },
      {
        id: 'generic_insider',
        name: 'Malicious Insider',
        type: 'insider',
        sophistication: 'intermediate',
        motivation: ['financial_gain', 'revenge'],
        resources: 'individual',
        capabilities: ['privileged_access', 'knowledge_of_systems'],
        ttps: ['data_exfiltration', 'privilege_abuse'],
        aliases: ['Insider Threat'],
        geography: ['Internal'],
        lastActivity: new Date().toISOString()
      }
    ];

    for (const actor of sampleActors) {
      if (this.db) {
        await this.db.prepare(`
          INSERT OR REPLACE INTO threat_actors (
            id, name, type, sophistication, motivation, resources,
            capabilities, ttps, aliases, geography, last_activity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          actor.id,
          actor.name,
          actor.type,
          actor.sophistication,
          JSON.stringify(actor.motivation),
          actor.resources,
          JSON.stringify(actor.capabilities),
          JSON.stringify(actor.ttps),
          JSON.stringify(actor.aliases),
          JSON.stringify(actor.geography),
          actor.lastActivity
        ).run();
      }
    }
  }

  // Helper methods for threat generation

  private async getGenericThreatActor(): Promise<ThreatActor> {
    return {
      id: 'generic_attacker',
      name: 'Generic Attacker',
      type: 'cybercriminal',
      sophistication: 'intermediate',
      motivation: ['financial_gain'],
      resources: 'individual',
      capabilities: ['common_tools', 'basic_techniques'],
      ttps: ['reconnaissance', 'exploitation'],
      aliases: ['External Threat'],
      geography: ['Unknown']
    };
  }

  private async getCWEsForCategory(category: Threat['category']): Promise<string[]> {
    const cweMapping: Record<string, string[]> = {
      spoofing: ['CWE-290', 'CWE-346'],
      tampering: ['CWE-352', 'CWE-494'],
      repudiation: ['CWE-117', 'CWE-778'],
      information_disclosure: ['CWE-200', 'CWE-209'],
      denial_of_service: ['CWE-400', 'CWE-770'],
      elevation_of_privilege: ['CWE-264', 'CWE-269']
    };

    return cweMapping[category] || [];
  }

  private async getKillChainForCategory(category: Threat['category']): Promise<KillChainPhase[]> {
    // Sample kill chain phases for different threat categories
    return [
      {
        phase: 'reconnaissance',
        description: 'Information gathering phase',
        techniques: ['T1595', 'T1590'],
        indicators: ['unusual_network_scanning'],
        mitigations: ['network_monitoring']
      },
      {
        phase: 'exploitation',
        description: 'Initial compromise',
        techniques: ['T1190', 'T1078'],
        indicators: ['failed_authentication_attempts'],
        mitigations: ['access_controls', 'monitoring']
      }
    ];
  }

  private async generateMITREMapping(threat: Threat): Promise<MITRETechnique[]> {
    const mapping: MITRETechnique[] = [];
    
    // Map based on threat category
    const categoryMapping: Record<string, string[]> = {
      spoofing: ['T1078'],
      tampering: ['T1565'],
      information_disclosure: ['T1005', 'T1039'],
      denial_of_service: ['T1499'],
      elevation_of_privilege: ['T1068', 'T1055']
    };

    const techniqueIds = categoryMapping[threat.category] || [];
    
    for (const techniqueId of techniqueIds) {
      const technique = this.mitreFramework.get(techniqueId);
      if (technique) {
        mapping.push(technique);
      }
    }

    return mapping;
  }

  // Mitigation helper methods

  private getMitigationType(category: Threat['category']): ThreatMitigation['type'] {
    const typeMapping: Record<string, ThreatMitigation['type']> = {
      spoofing: 'preventive',
      tampering: 'detective',
      repudiation: 'detective',
      information_disclosure: 'preventive',
      denial_of_service: 'corrective',
      elevation_of_privilege: 'preventive'
    };

    return typeMapping[category] || 'preventive';
  }

  private getMitigationStrategy(category: Threat['category']): string {
    const strategyMapping: Record<string, string> = {
      spoofing: 'Implement strong authentication and identity verification',
      tampering: 'Deploy integrity monitoring and validation controls',
      repudiation: 'Establish comprehensive logging and audit trails',
      information_disclosure: 'Apply data classification and access controls',
      denial_of_service: 'Implement rate limiting and resource management',
      elevation_of_privilege: 'Enforce principle of least privilege'
    };

    return strategyMapping[category] || 'Implement appropriate security controls';
  }

  private getImplementationGuidance(category: Threat['category']): string {
    const guidanceMapping: Record<string, string> = {
      spoofing: 'Deploy MFA, certificate-based authentication, and identity verification systems',
      tampering: 'Implement file integrity monitoring, digital signatures, and checksums',
      repudiation: 'Configure comprehensive logging, implement non-repudiation controls',
      information_disclosure: 'Apply data loss prevention, encryption, and access controls',
      denial_of_service: 'Deploy DDoS protection, implement resource limits and monitoring',
      elevation_of_privilege: 'Configure RBAC, implement privilege escalation monitoring'
    };

    return guidanceMapping[category] || 'Consult security best practices for implementation';
  }

  private estimateMitigationCost(category: Threat['category']): ThreatMitigation['cost'] {
    const costMapping: Record<string, ThreatMitigation['cost']> = {
      spoofing: 'medium',
      tampering: 'low',
      repudiation: 'low',
      information_disclosure: 'medium',
      denial_of_service: 'high',
      elevation_of_privilege: 'medium'
    };

    return costMapping[category] || 'medium';
  }

  private estimateMitigationEffectiveness(category: Threat['category']): number {
    const effectivenessMapping: Record<string, number> = {
      spoofing: 85,
      tampering: 75,
      repudiation: 90,
      information_disclosure: 80,
      denial_of_service: 70,
      elevation_of_privilege: 85
    };

    return effectivenessMapping[category] || 75;
  }

  // Calculation helper methods

  private calculateComplexity(likelihood: number): AttackPath['complexity'] {
    if (likelihood >= 8) return 'low';
    if (likelihood >= 5) return 'medium';
    return 'high';
  }

  private estimateTimeToExploit(threat: Threat): number {
    const baseTime = 24; // hours
    const complexityMultiplier = threat.likelihood <= 3 ? 4 : threat.likelihood <= 6 ? 2 : 1;
    return baseTime * complexityMultiplier;
  }

  private assessDetectionDifficulty(threat: Threat): AttackPath['detectionDifficulty'] {
    if (threat.category === 'information_disclosure') return 'hard';
    if (threat.category === 'spoofing') return 'medium';
    return 'easy';
  }

  // Database operations

  private async storeThreatModel(model: ThreatModel): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO threat_models (
        id, name, description, scope, asset_id, system_id, methodology,
        threats, attack_paths, mitigations, risk_score, status, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      model.id,
      model.name,
      model.description,
      model.scope,
      model.assetId,
      model.systemId,
      model.methodology,
      JSON.stringify(model.threats),
      JSON.stringify(model.attackPaths),
      JSON.stringify(model.mitigations),
      model.riskScore,
      model.status,
      model.lastUpdated
    ).run();

    // Store individual threats
    for (const threat of model.threats) {
      await this.storeThreat(threat);
    }

    // Store attack paths
    for (const path of model.attackPaths) {
      await this.storeAttackPath(path);
    }
  }

  private async updateThreatModel(model: ThreatModel): Promise<void> {
    model.lastUpdated = new Date().toISOString();
    await this.storeThreatModel(model);
    this.threatModels.set(model.id, model);
  }

  private async storeThreat(threat: Threat): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO threats (
        id, model_id, category, title, description, threat_actor,
        techniques, assets, likelihood, impact, risk_score, cvss_vector,
        cwe_ids, kill_chain_phases, prerequisites, indicators, mitigations, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      threat.id,
      threat.modelId,
      threat.category,
      threat.title,
      threat.description,
      JSON.stringify(threat.threatActor),
      JSON.stringify(threat.techniques),
      JSON.stringify(threat.assets),
      threat.likelihood,
      threat.impact,
      threat.riskScore,
      threat.cvssVector,
      JSON.stringify(threat.cweIds),
      JSON.stringify(threat.killChainPhases),
      JSON.stringify(threat.prerequisites),
      JSON.stringify(threat.indicators),
      JSON.stringify(threat.mitigations),
      threat.status
    ).run();
  }

  private async storeAttackPath(path: AttackPath): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO attack_paths (
        id, model_id, name, description, start_node, end_node,
        nodes, edges, probability, complexity, time_to_exploit,
        detection_difficulty, impact_score, mitigation_coverage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      path.id,
      path.modelId,
      path.name,
      path.description,
      JSON.stringify(path.startNode),
      JSON.stringify(path.endNode),
      JSON.stringify(path.nodes),
      JSON.stringify(path.edges),
      path.probability,
      path.complexity,
      path.timeToExploit,
      path.detectionDifficulty,
      path.impactScore,
      path.mitigationCoverage
    ).run();
  }

  private async storeThreatIntelligence(intelligence: ThreatIntelligence): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO threat_intelligence (
        id, source, type, indicator, confidence, tlp_level, description,
        tags, first_seen, last_seen, threat_actors, campaigns,
        malware_families, techniques
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      intelligence.id,
      intelligence.source,
      intelligence.type,
      intelligence.indicator,
      intelligence.confidence,
      intelligence.tlpLevel,
      intelligence.description,
      JSON.stringify(intelligence.tags),
      intelligence.firstSeen,
      intelligence.lastSeen,
      JSON.stringify(intelligence.threatActors),
      JSON.stringify(intelligence.campaigns),
      JSON.stringify(intelligence.malwareFamilies),
      JSON.stringify(intelligence.techniques)
    ).run();
  }

  private async loadThreatModels(): Promise<void> {
    if (!this.db) return;

    const result = await this.db.prepare(`
      SELECT * FROM threat_models
    `).all();

    for (const row of result.results || []) {
      const model: ThreatModel = {
        id: row.id,
        name: row.name,
        description: row.description,
        scope: row.scope,
        assetId: row.asset_id,
        systemId: row.system_id,
        methodology: row.methodology,
        threats: JSON.parse(row.threats || '[]'),
        attackPaths: JSON.parse(row.attack_paths || '[]'),
        mitigations: JSON.parse(row.mitigations || '[]'),
        riskScore: row.risk_score,
        status: row.status,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      };

      this.threatModels.set(model.id, model);
    }
  }

  private async updateThreatModelsWithIntelligence(intelligence: ThreatIntelligence): Promise<void> {
    // Update threat models based on new intelligence
    // This would correlate intelligence with existing threats and update risk scores
    console.log('🔄 Updating threat models with new intelligence:', intelligence.type);
  }

  // ID generation helpers

  private generateThreatModelId(): string {
    return `tm_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateAttackPathId(): string {
    return `path_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateMitigationId(): string {
    return `mit_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateThreatIntelligenceId(): string {
    return `intel_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export helper functions for threat modeling integration
export const ThreatModelingHelpers = {
  /**
   * Create basic STRIDE threat model
   */
  createSTRIDEThreatModel: (name: string, scope: string): Omit<ThreatModel, 'id' | 'threats' | 'attackPaths' | 'mitigations' | 'riskScore' | 'lastUpdated' | 'createdAt'> => ({
    name,
    description: `STRIDE-based threat model for ${name}`,
    scope,
    methodology: 'STRIDE',
    status: 'draft'
  }),

  /**
   * Calculate CVSS score from threat
   */
  calculateCVSS: (threat: Threat): string => {
    // Simplified CVSS calculation
    const av = 'N'; // Network
    const ac = threat.likelihood > 7 ? 'L' : 'H'; // Low/High complexity
    const pr = threat.category === 'elevation_of_privilege' ? 'H' : 'L'; // Privileges required
    const ui = threat.category === 'spoofing' ? 'R' : 'N'; // User interaction
    const s = 'U'; // Scope unchanged
    const c = threat.category === 'information_disclosure' ? 'H' : 'L'; // Confidentiality
    const i = threat.category === 'tampering' ? 'H' : 'L'; // Integrity
    const a = threat.category === 'denial_of_service' ? 'H' : 'L'; // Availability

    return `CVSS:3.1/AV:${av}/AC:${ac}/PR:${pr}/UI:${ui}/S:${s}/C:${c}/I:${i}/A:${a}`;
  },

  /**
   * Map risk score to threat level
   */
  mapRiskToLevel: (riskScore: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (riskScore >= 9) return 'critical';
    if (riskScore >= 7) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  },

  /**
   * Generate threat intelligence from external source
   */
  createThreatIntelligence: (
    source: string, 
    type: ThreatIntelligence['type'], 
    indicator: string, 
    confidence: number
  ): Omit<ThreatIntelligence, 'id'> => ({
    source,
    type,
    indicator,
    confidence,
    tlpLevel: 'green',
    description: `${type} indicator from ${source}`,
    tags: [type, source],
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    threatActors: [],
    campaigns: [],
    malwareFamilies: [],
    techniques: []
  })
};