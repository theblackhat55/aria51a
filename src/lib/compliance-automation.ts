/**
 * Intelligent Compliance Automation & Gap Analysis Service for ARIA5.1
 * 
 * Provides comprehensive compliance automation capabilities:
 * - Automated compliance framework mapping and assessment
 * - Intelligent gap analysis and remediation planning
 * - Real-time compliance monitoring and alerting
 * - Multi-framework compliance orchestration
 * - Evidence collection and audit trail management
 * - Continuous compliance validation and reporting
 * - Risk-based compliance prioritization
 * 
 * Features:
 * - Support for major frameworks (ISO 27001, SOC 2, NIST, GDPR, HIPAA, PCI DSS)
 * - AI-powered control mapping and assessment
 * - Automated evidence collection and validation
 * - Intelligent remediation recommendations
 * - Compliance dashboard and executive reporting
 * - Integration with risk management and threat modeling
 */

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'security' | 'privacy' | 'industry' | 'regional' | 'internal';
  domains: ComplianceDomain[];
  totalControls: number;
  applicableControls: number;
  implementedControls: number;
  lastAssessment?: string;
  nextAssessment?: string;
  status: 'not_started' | 'in_progress' | 'compliant' | 'non_compliant' | 'partially_compliant';
  overallScore: number; // 0-100
  certificationRequired: boolean;
}

export interface ComplianceDomain {
  id: string;
  frameworkId: string;
  name: string;
  description: string;
  controls: ComplianceControl[];
  weight: number; // Importance weight
  score: number; // Domain compliance score
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed';
}

export interface ComplianceControl {
  id: string;
  domainId: string;
  frameworkId: string;
  title: string;
  description: string;
  requirements: string[];
  controlType: 'preventive' | 'detective' | 'corrective' | 'compensating' | 'directive';
  category: 'technical' | 'administrative' | 'physical';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'implemented' | 'partially_implemented' | 'not_implemented' | 'not_applicable' | 'in_progress';
  maturityLevel: number; // 1-5 (Initial, Managed, Defined, Quantitatively Managed, Optimizing)
  effectiveness: number; // 0-100%
  implementationDate?: string;
  lastAssessed?: string;
  assessor?: string;
  evidence: ComplianceEvidence[];
  gaps: ComplianceGap[];
  mitigations: ComplianceMitigation[];
  relatedRisks: number[];
  relatedControls: string[];
  automationLevel: 'manual' | 'semi_automated' | 'automated';
  testingFrequency: 'continuous' | 'monthly' | 'quarterly' | 'annually';
  responsible: string;
  accountable: string;
}

export interface ComplianceEvidence {
  id: string;
  controlId: string;
  type: 'document' | 'screenshot' | 'log' | 'certificate' | 'report' | 'policy' | 'procedure';
  title: string;
  description: string;
  fileUrl?: string;
  content?: string;
  collectionMethod: 'manual' | 'automated' | 'continuous';
  validity: 'valid' | 'expired' | 'pending' | 'invalid';
  collectedAt: string;
  expiresAt?: string;
  collectedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  metadata: Record<string, any>;
}

export interface ComplianceGap {
  id: string;
  controlId: string;
  type: 'implementation' | 'design' | 'operational' | 'evidence' | 'testing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  rootCause: string;
  recommendation: string;
  remediationPlan: ComplianceRemediationPlan;
  status: 'identified' | 'acknowledged' | 'in_progress' | 'resolved' | 'accepted' | 'deferred';
  identifiedAt: string;
  targetResolution?: string;
  actualResolution?: string;
  assignee?: string;
}

export interface ComplianceRemediationPlan {
  id: string;
  gapId: string;
  strategy: string;
  actions: ComplianceAction[];
  timeline: string;
  budget?: number;
  resources: string[];
  dependencies: string[];
  riskReduction: number; // 0-100%
  priority: 'immediate' | 'high' | 'medium' | 'low';
  approvalRequired: boolean;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ComplianceAction {
  id: string;
  planId: string;
  title: string;
  description: string;
  type: 'policy' | 'procedure' | 'technical' | 'training' | 'monitoring' | 'testing';
  assignee: string;
  dueDate: string;
  estimatedEffort: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'verified';
  completedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface ComplianceMitigation {
  id: string;
  controlId: string;
  type: 'compensating_control' | 'alternative_implementation' | 'process_improvement' | 'technology_solution';
  description: string;
  implementation: string;
  effectiveness: number; // 0-100%
  cost: 'low' | 'medium' | 'high';
  timeframe: string;
  responsible: string;
  status: 'proposed' | 'approved' | 'implementing' | 'implemented' | 'verified';
  riskReduction: number;
}

export interface ComplianceAssessment {
  id: string;
  frameworkId: string;
  type: 'self_assessment' | 'internal_audit' | 'external_audit' | 'certification' | 'continuous_monitoring';
  scope: string[];
  assessor: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'reported';
  methodology: string;
  findings: ComplianceFinding[];
  overallScore: number;
  recommendations: string[];
  executiveSummary: string;
  reportUrl?: string;
}

export interface ComplianceFinding {
  id: string;
  assessmentId: string;
  controlId: string;
  type: 'compliant' | 'non_compliant' | 'minor_deficiency' | 'major_deficiency' | 'observation';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  managementResponse?: string;
  targetDate?: string;
  responsible?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
}

export interface ComplianceMetrics {
  frameworkId: string;
  period: string;
  overallCompliance: number;
  controlsImplemented: number;
  controlsTotal: number;
  criticalGaps: number;
  highRiskGaps: number;
  overdueMitigations: number;
  automationLevel: number;
  evidenceCompleteness: number;
  assessmentFrequency: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface ComplianceMapping {
  sourceFramework: string;
  targetFramework: string;
  mappings: Array<{
    sourceControl: string;
    targetControls: string[];
    mappingType: 'direct' | 'partial' | 'conceptual' | 'no_mapping';
    confidence: number; // 0-100%
    notes?: string;
  }>;
  coverage: number; // 0-100%
  lastUpdated: string;
}

export class ComplianceAutomationService {
  private db: any;
  private frameworks: Map<string, ComplianceFramework> = new Map();
  private assessments: Map<string, ComplianceAssessment> = new Map();
  private automationRules: Map<string, any> = new Map();
  private isInitialized = false;

  // Configuration
  private config = {
    assessmentFrequency: {
      critical: 30, // days
      high: 90,
      medium: 180,
      low: 365
    },
    evidenceRetention: 2555, // days (7 years)
    automationThreshold: 0.8, // 80% automation target
    complianceThreshold: 0.95 // 95% compliance target
  };

  constructor(database?: any) {
    this.db = database;
    if (this.db) {
      this.initializeComplianceAutomation();
    }
  }

  /**
   * Initialize compliance automation database and frameworks
   */
  private async initializeComplianceAutomation(): Promise<void> {
    try {
      // Compliance frameworks table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS compliance_frameworks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('security', 'privacy', 'industry', 'regional', 'internal')),
          domains TEXT NOT NULL, -- JSON array
          total_controls INTEGER DEFAULT 0,
          applicable_controls INTEGER DEFAULT 0,
          implemented_controls INTEGER DEFAULT 0,
          last_assessment DATETIME,
          next_assessment DATETIME,
          status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'compliant', 'non_compliant', 'partially_compliant')),
          overall_score REAL DEFAULT 0,
          certification_required BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Compliance controls table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS compliance_controls (
          id TEXT PRIMARY KEY,
          domain_id TEXT NOT NULL,
          framework_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          requirements TEXT, -- JSON array
          control_type TEXT NOT NULL CHECK (control_type IN ('preventive', 'detective', 'corrective', 'compensating', 'directive')),
          category TEXT NOT NULL CHECK (category IN ('technical', 'administrative', 'physical')),
          priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
          status TEXT DEFAULT 'not_implemented' CHECK (status IN ('implemented', 'partially_implemented', 'not_implemented', 'not_applicable', 'in_progress')),
          maturity_level INTEGER DEFAULT 1 CHECK (maturity_level BETWEEN 1 AND 5),
          effectiveness REAL DEFAULT 0,
          implementation_date DATETIME,
          last_assessed DATETIME,
          assessor TEXT,
          evidence TEXT, -- JSON array
          gaps TEXT, -- JSON array
          mitigations TEXT, -- JSON array
          related_risks TEXT, -- JSON array
          related_controls TEXT, -- JSON array
          automation_level TEXT DEFAULT 'manual' CHECK (automation_level IN ('manual', 'semi_automated', 'automated')),
          testing_frequency TEXT DEFAULT 'annually' CHECK (testing_frequency IN ('continuous', 'monthly', 'quarterly', 'annually')),
          responsible TEXT,
          accountable TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id) ON DELETE CASCADE
        )
      `).run();

      // Compliance evidence table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS compliance_evidence (
          id TEXT PRIMARY KEY,
          control_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('document', 'screenshot', 'log', 'certificate', 'report', 'policy', 'procedure')),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          file_url TEXT,
          content TEXT,
          collection_method TEXT NOT NULL CHECK (collection_method IN ('manual', 'automated', 'continuous')),
          validity TEXT DEFAULT 'valid' CHECK (validity IN ('valid', 'expired', 'pending', 'invalid')),
          collected_at DATETIME NOT NULL,
          expires_at DATETIME,
          collected_by TEXT NOT NULL,
          reviewed_by TEXT,
          reviewed_at DATETIME,
          metadata TEXT, -- JSON
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE
        )
      `).run();

      // Compliance gaps table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS compliance_gaps (
          id TEXT PRIMARY KEY,
          control_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('implementation', 'design', 'operational', 'evidence', 'testing')),
          severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          impact TEXT NOT NULL,
          root_cause TEXT NOT NULL,
          recommendation TEXT NOT NULL,
          remediation_plan TEXT, -- JSON
          status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'acknowledged', 'in_progress', 'resolved', 'accepted', 'deferred')),
          identified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          target_resolution DATETIME,
          actual_resolution DATETIME,
          assignee TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE
        )
      `).run();

      // Compliance assessments table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS compliance_assessments (
          id TEXT PRIMARY KEY,
          framework_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('self_assessment', 'internal_audit', 'external_audit', 'certification', 'continuous_monitoring')),
          scope TEXT, -- JSON array
          assessor TEXT NOT NULL,
          start_date DATETIME NOT NULL,
          end_date DATETIME,
          status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'reported')),
          methodology TEXT,
          findings TEXT, -- JSON array
          overall_score REAL DEFAULT 0,
          recommendations TEXT, -- JSON array
          executive_summary TEXT,
          report_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id) ON DELETE CASCADE
        )
      `).run();

      // Compliance mappings table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS compliance_mappings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_framework TEXT NOT NULL,
          target_framework TEXT NOT NULL,
          mappings TEXT NOT NULL, -- JSON array
          coverage REAL DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(source_framework, target_framework)
        )
      `).run();

      // Create indexes for performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_compliance_controls_framework ON compliance_controls(framework_id)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_compliance_controls_status ON compliance_controls(status)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_compliance_gaps_severity ON compliance_gaps(severity)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_compliance_evidence_control ON compliance_evidence(control_id)
      `).run();

      // Initialize compliance frameworks
      await this.initializeComplianceFrameworks();

      // Load existing assessments
      await this.loadAssessments();

      // Setup automation rules
      await this.setupAutomationRules();

      this.isInitialized = true;
      console.log('✅ Compliance Automation engine initialized');

    } catch (error) {
      console.error('Failed to initialize compliance automation:', error);
    }
  }

  /**
   * Create or update a compliance framework
   */
  async createComplianceFramework(framework: Omit<ComplianceFramework, 'totalControls' | 'implementedControls' | 'overallScore'>): Promise<{ success: boolean; framework?: ComplianceFramework; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      // Calculate control counts
      const totalControls = framework.domains.reduce((sum, domain) => sum + domain.controls.length, 0);
      const implementedControls = framework.domains.reduce((sum, domain) => 
        sum + domain.controls.filter(c => c.status === 'implemented').length, 0
      );

      const fullFramework: ComplianceFramework = {
        ...framework,
        totalControls,
        implementedControls,
        applicableControls: framework.applicableControls || totalControls,
        overallScore: totalControls > 0 ? (implementedControls / totalControls) * 100 : 0
      };

      // Store framework
      await this.storeComplianceFramework(fullFramework);

      // Store domains and controls
      for (const domain of framework.domains) {
        for (const control of domain.controls) {
          await this.storeComplianceControl(control);
        }
      }

      // Cache in memory
      this.frameworks.set(framework.id, fullFramework);

      console.log('📋 Compliance framework created:', {
        id: framework.id,
        name: framework.name,
        totalControls,
        implementedControls,
        score: fullFramework.overallScore
      });

      return { success: true, framework: fullFramework };

    } catch (error) {
      console.error('Compliance framework creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Creation failed'
      };
    }
  }

  /**
   * Perform automated gap analysis
   */
  async performGapAnalysis(frameworkId: string): Promise<{ success: boolean; gaps?: ComplianceGap[]; analysis?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const framework = this.frameworks.get(frameworkId);
      if (!framework) {
        return { success: false, error: 'Compliance framework not found' };
      }

      const gaps: ComplianceGap[] = [];
      
      // Get all controls for the framework
      const controls = await this.getFrameworkControls(frameworkId);

      // Analyze each control for gaps
      for (const control of controls) {
        const controlGaps = await this.analyzeControlGaps(control);
        gaps.push(...controlGaps);
      }

      // Analyze framework-level gaps
      const frameworkGaps = await this.analyzeFrameworkGaps(framework);
      gaps.push(...frameworkGaps);

      // Store gaps in database
      for (const gap of gaps) {
        await this.storeComplianceGap(gap);
      }

      // Generate gap analysis summary
      const analysis = this.generateGapAnalysisSummary(gaps, framework);

      console.log('🔍 Gap analysis completed:', {
        frameworkId,
        totalGaps: gaps.length,
        criticalGaps: gaps.filter(g => g.severity === 'critical').length,
        highGaps: gaps.filter(g => g.severity === 'high').length
      });

      return { success: true, gaps, analysis };

    } catch (error) {
      console.error('Gap analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Generate automated remediation plan
   */
  async generateRemediationPlan(gapIds: string[]): Promise<{ success: boolean; plan?: ComplianceRemediationPlan[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const plans: ComplianceRemediationPlan[] = [];

      for (const gapId of gapIds) {
        const gap = await this.getComplianceGap(gapId);
        if (!gap) continue;

        const plan = await this.createRemediationPlan(gap);
        plans.push(plan);

        // Update gap with plan
        gap.remediationPlan = plan;
        await this.updateComplianceGap(gap);
      }

      console.log('🛠️ Remediation plans generated:', {
        plans: plans.length,
        totalActions: plans.reduce((sum, plan) => sum + plan.actions.length, 0)
      });

      return { success: true, plan: plans };

    } catch (error) {
      console.error('Remediation plan generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Perform automated compliance assessment
   */
  async performAutomatedAssessment(frameworkId: string, assessorId: string): Promise<{ success: boolean; assessment?: ComplianceAssessment; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const framework = this.frameworks.get(frameworkId);
      if (!framework) {
        return { success: false, error: 'Compliance framework not found' };
      }

      const assessmentId = this.generateAssessmentId();
      
      // Get all controls for assessment
      const controls = await this.getFrameworkControls(frameworkId);
      
      // Perform automated assessment of each control
      const findings: ComplianceFinding[] = [];
      let totalScore = 0;
      let assessedControls = 0;

      for (const control of controls) {
        const controlFindings = await this.assessControlAutomatically(control, assessmentId);
        findings.push(...controlFindings);

        // Calculate control score
        const controlScore = this.calculateControlScore(control, controlFindings);
        totalScore += controlScore;
        assessedControls++;
      }

      const overallScore = assessedControls > 0 ? totalScore / assessedControls : 0;

      // Generate recommendations
      const recommendations = this.generateAssessmentRecommendations(findings);

      // Generate executive summary
      const executiveSummary = this.generateAssessmentSummary(framework, findings, overallScore);

      const assessment: ComplianceAssessment = {
        id: assessmentId,
        frameworkId,
        type: 'continuous_monitoring',
        scope: [frameworkId],
        assessor: assessorId,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: 'completed',
        methodology: 'Automated continuous monitoring and evidence validation',
        findings,
        overallScore,
        recommendations,
        executiveSummary
      };

      // Store assessment
      await this.storeComplianceAssessment(assessment);
      this.assessments.set(assessmentId, assessment);

      // Update framework status
      framework.lastAssessment = assessment.endDate;
      framework.overallScore = overallScore;
      framework.status = this.determineFrameworkStatus(overallScore);
      await this.updateComplianceFramework(framework);

      console.log('🔎 Automated assessment completed:', {
        frameworkId,
        assessmentId,
        overallScore: Math.round(overallScore),
        findings: findings.length,
        status: framework.status
      });

      return { success: true, assessment };

    } catch (error) {
      console.error('Automated assessment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Assessment failed'
      };
    }
  }

  /**
   * Collect evidence automatically
   */
  async collectEvidenceAutomatically(controlId: string): Promise<{ success: boolean; evidence?: ComplianceEvidence[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const control = await this.getComplianceControl(controlId);
      if (!control) {
        return { success: false, error: 'Compliance control not found' };
      }

      const evidence: ComplianceEvidence[] = [];

      // Collect evidence based on control type and category
      switch (control.category) {
        case 'technical':
          const technicalEvidence = await this.collectTechnicalEvidence(control);
          evidence.push(...technicalEvidence);
          break;

        case 'administrative':
          const administrativeEvidence = await this.collectAdministrativeEvidence(control);
          evidence.push(...administrativeEvidence);
          break;

        case 'physical':
          const physicalEvidence = await this.collectPhysicalEvidence(control);
          evidence.push(...physicalEvidence);
          break;
      }

      // Store evidence in database
      for (const item of evidence) {
        await this.storeComplianceEvidence(item);
      }

      // Update control with new evidence
      control.evidence = control.evidence.concat(evidence.map(e => e.id));
      await this.updateComplianceControl(control);

      console.log('📎 Evidence collected automatically:', {
        controlId,
        evidenceItems: evidence.length,
        types: [...new Set(evidence.map(e => e.type))]
      });

      return { success: true, evidence };

    } catch (error) {
      console.error('Automated evidence collection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Collection failed'
      };
    }
  }

  /**
   * Generate compliance dashboard metrics
   */
  async getComplianceMetrics(frameworkIds?: string[]): Promise<{ success: boolean; metrics?: ComplianceMetrics[]; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const targetFrameworks = frameworkIds || Array.from(this.frameworks.keys());
      const metrics: ComplianceMetrics[] = [];

      for (const frameworkId of targetFrameworks) {
        const framework = this.frameworks.get(frameworkId);
        if (!framework) continue;

        const frameworkMetrics = await this.calculateFrameworkMetrics(framework);
        metrics.push(frameworkMetrics);
      }

      console.log('📊 Compliance metrics generated:', {
        frameworks: metrics.length,
        avgCompliance: Math.round(metrics.reduce((sum, m) => sum + m.overallCompliance, 0) / metrics.length)
      });

      return { success: true, metrics };

    } catch (error) {
      console.error('Compliance metrics generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Metrics failed'
      };
    }
  }

  /**
   * Map controls between frameworks
   */
  async mapFrameworkControls(sourceFrameworkId: string, targetFrameworkId: string): Promise<{ success: boolean; mapping?: ComplianceMapping; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const sourceFramework = this.frameworks.get(sourceFrameworkId);
      const targetFramework = this.frameworks.get(targetFrameworkId);

      if (!sourceFramework || !targetFramework) {
        return { success: false, error: 'One or both frameworks not found' };
      }

      const mapping = await this.performControlMapping(sourceFramework, targetFramework);

      // Store mapping in database
      await this.storeComplianceMapping(mapping);

      console.log('🔗 Framework mapping completed:', {
        source: sourceFramework.name,
        target: targetFramework.name,
        coverage: Math.round(mapping.coverage),
        mappings: mapping.mappings.length
      });

      return { success: true, mapping };

    } catch (error) {
      console.error('Framework mapping failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mapping failed'
      };
    }
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Compliance automation not initialized' };
      }

      const frameworkStats = await this.db.prepare(`
        SELECT 
          type,
          status,
          COUNT(*) as count,
          AVG(overall_score) as avg_score
        FROM compliance_frameworks
        GROUP BY type, status
      `).all();

      const controlStats = await this.db.prepare(`
        SELECT 
          framework_id,
          status,
          automation_level,
          COUNT(*) as count,
          AVG(effectiveness) as avg_effectiveness
        FROM compliance_controls
        GROUP BY framework_id, status, automation_level
      `).all();

      const gapStats = await this.db.prepare(`
        SELECT 
          severity,
          status,
          COUNT(*) as count
        FROM compliance_gaps
        WHERE identified_at >= datetime('now', '-30 days')
        GROUP BY severity, status
      `).all();

      const evidenceStats = await this.db.prepare(`
        SELECT 
          type,
          collection_method,
          validity,
          COUNT(*) as count
        FROM compliance_evidence
        WHERE collected_at >= datetime('now', '-30 days')
        GROUP BY type, collection_method, validity
      `).all();

      const assessmentStats = await this.db.prepare(`
        SELECT 
          type,
          status,
          COUNT(*) as count,
          AVG(overall_score) as avg_score
        FROM compliance_assessments
        WHERE start_date >= datetime('now', '-90 days')
        GROUP BY type, status
      `).all();

      return {
        success: true,
        stats: {
          frameworks: {
            total: this.frameworks.size,
            byTypeAndStatus: frameworkStats.results || []
          },
          controls: {
            byFrameworkAndStatus: controlStats.results || [],
            total: controlStats.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0
          },
          gaps: {
            recent: gapStats.results || [],
            total: gapStats.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0
          },
          evidence: {
            recent: evidenceStats.results || [],
            total: evidenceStats.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0
          },
          assessments: {
            recent: assessmentStats.results || [],
            total: this.assessments.size
          }
        }
      };

    } catch (error) {
      console.error('Failed to get compliance statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Private helper methods

  private async analyzeControlGaps(control: ComplianceControl): Promise<ComplianceGap[]> {
    const gaps: ComplianceGap[] = [];

    // Implementation gap analysis
    if (control.status === 'not_implemented' || control.status === 'partially_implemented') {
      gaps.push({
        id: this.generateGapId(),
        controlId: control.id,
        type: 'implementation',
        severity: this.mapPriorityToSeverity(control.priority),
        title: `${control.title} - Implementation Gap`,
        description: `Control is ${control.status.replace('_', ' ')}`,
        impact: 'Increased risk exposure due to missing or incomplete control implementation',
        rootCause: 'Insufficient resources, unclear requirements, or lack of technical capability',
        recommendation: this.generateImplementationRecommendation(control),
        remediationPlan: {} as ComplianceRemediationPlan,
        status: 'identified',
        identifiedAt: new Date().toISOString()
      });
    }

    // Evidence gap analysis
    if (control.evidence.length === 0) {
      gaps.push({
        id: this.generateGapId(),
        controlId: control.id,
        type: 'evidence',
        severity: 'medium',
        title: `${control.title} - Evidence Gap`,
        description: 'No evidence available to demonstrate control effectiveness',
        impact: 'Cannot verify control implementation or effectiveness during audits',
        rootCause: 'Lack of evidence collection process or documentation',
        recommendation: 'Implement evidence collection procedures and documentation standards',
        remediationPlan: {} as ComplianceRemediationPlan,
        status: 'identified',
        identifiedAt: new Date().toISOString()
      });
    }

    // Effectiveness gap analysis
    if (control.effectiveness < 70) {
      gaps.push({
        id: this.generateGapId(),
        controlId: control.id,
        type: 'operational',
        severity: control.effectiveness < 50 ? 'high' : 'medium',
        title: `${control.title} - Effectiveness Gap`,
        description: `Control effectiveness is ${control.effectiveness}%, below acceptable threshold`,
        impact: 'Reduced protection against associated risks',
        rootCause: 'Inadequate control design, poor implementation, or lack of monitoring',
        recommendation: 'Review and enhance control design, implementation, and monitoring procedures',
        remediationPlan: {} as ComplianceRemediationPlan,
        status: 'identified',
        identifiedAt: new Date().toISOString()
      });
    }

    // Testing frequency gap analysis
    if (control.priority === 'critical' && control.testingFrequency !== 'continuous' && control.testingFrequency !== 'monthly') {
      gaps.push({
        id: this.generateGapId(),
        controlId: control.id,
        type: 'testing',
        severity: 'medium',
        title: `${control.title} - Testing Frequency Gap`,
        description: `Critical control tested ${control.testingFrequency}, should be more frequent`,
        impact: 'Delayed detection of control failures or degradation',
        rootCause: 'Insufficient testing procedures or resource constraints',
        recommendation: 'Increase testing frequency for critical controls to monthly or continuous',
        remediationPlan: {} as ComplianceRemediationPlan,
        status: 'identified',
        identifiedAt: new Date().toISOString()
      });
    }

    return gaps;
  }

  private async analyzeFrameworkGaps(framework: ComplianceFramework): Promise<ComplianceGap[]> {
    const gaps: ComplianceGap[] = [];

    // Overall compliance gap
    if (framework.overallScore < 95) {
      gaps.push({
        id: this.generateGapId(),
        controlId: `framework_${framework.id}`,
        type: 'implementation',
        severity: framework.overallScore < 70 ? 'high' : 'medium',
        title: `${framework.name} - Overall Compliance Gap`,
        description: `Framework compliance is ${framework.overallScore.toFixed(1)}%, below target of 95%`,
        impact: 'Potential compliance violations and regulatory risks',
        rootCause: 'Multiple control implementation and effectiveness gaps',
        recommendation: 'Prioritize high-risk control implementations and improvements',
        remediationPlan: {} as ComplianceRemediationPlan,
        status: 'identified',
        identifiedAt: new Date().toISOString()
      });
    }

    // Assessment frequency gap
    if (framework.lastAssessment) {
      const daysSinceAssessment = Math.floor(
        (Date.now() - new Date(framework.lastAssessment).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceAssessment > 365) {
        gaps.push({
          id: this.generateGapId(),
          controlId: `framework_${framework.id}`,
          type: 'testing',
          severity: 'medium',
          title: `${framework.name} - Assessment Overdue`,
          description: `Last assessment was ${daysSinceAssessment} days ago, exceeds annual requirement`,
          impact: 'Outdated compliance status and potential audit findings',
          rootCause: 'Insufficient assessment scheduling or resource allocation',
          recommendation: 'Schedule immediate comprehensive framework assessment',
          remediationPlan: {} as ComplianceRemediationPlan,
          status: 'identified',
          identifiedAt: new Date().toISOString()
        });
      }
    }

    return gaps;
  }

  private async createRemediationPlan(gap: ComplianceGap): Promise<ComplianceRemediationPlan> {
    const planId = this.generateRemediationPlanId();
    
    const actions: ComplianceAction[] = [];

    // Generate actions based on gap type
    switch (gap.type) {
      case 'implementation':
        actions.push(
          {
            id: this.generateActionId(),
            planId,
            title: 'Design Control Implementation',
            description: 'Create detailed implementation design and approach',
            type: 'procedure',
            assignee: 'Security Team',
            dueDate: this.addDays(new Date(), 14).toISOString(),
            estimatedEffort: '2-3 days',
            status: 'not_started'
          },
          {
            id: this.generateActionId(),
            planId,
            title: 'Implement Technical Controls',
            description: 'Deploy and configure necessary technical controls',
            type: 'technical',
            assignee: 'IT Team',
            dueDate: this.addDays(new Date(), 30).toISOString(),
            estimatedEffort: '5-10 days',
            status: 'not_started'
          }
        );
        break;

      case 'evidence':
        actions.push(
          {
            id: this.generateActionId(),
            planId,
            title: 'Establish Evidence Collection Process',
            description: 'Define and implement evidence collection procedures',
            type: 'procedure',
            assignee: 'Compliance Team',
            dueDate: this.addDays(new Date(), 7).toISOString(),
            estimatedEffort: '1-2 days',
            status: 'not_started'
          }
        );
        break;

      case 'testing':
        actions.push(
          {
            id: this.generateActionId(),
            planId,
            title: 'Enhance Testing Procedures',
            description: 'Implement more frequent and comprehensive testing',
            type: 'procedure',
            assignee: 'Quality Assurance',
            dueDate: this.addDays(new Date(), 21).toISOString(),
            estimatedEffort: '3-5 days',
            status: 'not_started'
          }
        );
        break;
    }

    return {
      id: planId,
      gapId: gap.id,
      strategy: this.generateRemediationStrategy(gap),
      actions,
      timeline: '30-60 days',
      resources: this.determineRequiredResources(gap),
      dependencies: [],
      riskReduction: this.estimateRiskReduction(gap),
      priority: this.mapSeverityToPriority(gap.severity),
      approvalRequired: gap.severity === 'critical' || gap.severity === 'high',
      approved: false
    };
  }

  private async assessControlAutomatically(control: ComplianceControl, assessmentId: string): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Assess implementation status
    if (control.status !== 'implemented') {
      findings.push({
        id: this.generateFindingId(),
        assessmentId,
        controlId: control.id,
        type: 'non_compliant',
        severity: this.mapPriorityToSeverity(control.priority),
        title: `${control.title} - Not Fully Implemented`,
        description: `Control status is ${control.status.replace('_', ' ')}`,
        evidence: 'Control implementation status verification',
        recommendation: 'Complete control implementation according to requirements',
        status: 'open'
      });
    }

    // Assess evidence availability
    if (control.evidence.length === 0) {
      findings.push({
        id: this.generateFindingId(),
        assessmentId,
        controlId: control.id,
        type: 'minor_deficiency',
        severity: 'medium',
        title: `${control.title} - Missing Evidence`,
        description: 'No evidence available to support control implementation',
        evidence: 'Evidence review and documentation analysis',
        recommendation: 'Collect and document appropriate evidence for control effectiveness',
        status: 'open'
      });
    }

    // Assess effectiveness
    if (control.effectiveness < 70) {
      findings.push({
        id: this.generateFindingId(),
        assessmentId,
        controlId: control.id,
        type: control.effectiveness < 50 ? 'major_deficiency' : 'minor_deficiency',
        severity: control.effectiveness < 50 ? 'high' : 'medium',
        title: `${control.title} - Low Effectiveness`,
        description: `Control effectiveness is ${control.effectiveness}%, below acceptable threshold`,
        evidence: 'Control effectiveness measurement and analysis',
        recommendation: 'Improve control design and implementation to increase effectiveness',
        status: 'open'
      });
    }

    // Check for overdue assessments
    if (control.lastAssessed) {
      const daysSinceAssessment = Math.floor(
        (Date.now() - new Date(control.lastAssessed).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const maxDays = this.config.assessmentFrequency[control.priority];
      if (daysSinceAssessment > maxDays) {
        findings.push({
          id: this.generateFindingId(),
          assessmentId,
          controlId: control.id,
          type: 'observation',
          severity: 'low',
          title: `${control.title} - Assessment Overdue`,
          description: `Control assessment is ${daysSinceAssessment} days overdue`,
          evidence: 'Assessment date review',
          recommendation: 'Schedule and complete control assessment',
          status: 'open'
        });
      }
    }

    return findings;
  }

  private async collectTechnicalEvidence(control: ComplianceControl): Promise<ComplianceEvidence[]> {
    const evidence: ComplianceEvidence[] = [];

    // System configuration evidence
    evidence.push({
      id: this.generateEvidenceId(),
      controlId: control.id,
      type: 'log',
      title: 'System Configuration Evidence',
      description: 'Automated collection of relevant system configurations',
      content: JSON.stringify({
        timestamp: new Date().toISOString(),
        controlId: control.id,
        configurations: {
          // Mock configuration data
          firewall_rules: 'active',
          encryption: 'enabled',
          access_controls: 'configured',
          monitoring: 'active'
        }
      }),
      collectionMethod: 'automated',
      validity: 'valid',
      collectedAt: new Date().toISOString(),
      expiresAt: this.addDays(new Date(), 90).toISOString(), // 90 days validity
      collectedBy: 'Automated System',
      metadata: {
        source: 'system_api',
        control_type: control.controlType,
        category: control.category
      }
    });

    return evidence;
  }

  private async collectAdministrativeEvidence(control: ComplianceControl): Promise<ComplianceEvidence[]> {
    const evidence: ComplianceEvidence[] = [];

    // Policy and procedure evidence
    evidence.push({
      id: this.generateEvidenceId(),
      controlId: control.id,
      type: 'document',
      title: 'Policy and Procedure Documentation',
      description: 'Collection of relevant policies and procedures',
      content: `Policy document for ${control.title} - automatically retrieved from document management system`,
      collectionMethod: 'automated',
      validity: 'valid',
      collectedAt: new Date().toISOString(),
      expiresAt: this.addDays(new Date(), 365).toISOString(), // 1 year validity
      collectedBy: 'Automated System',
      metadata: {
        document_type: 'policy',
        control_type: control.controlType,
        category: control.category
      }
    });

    return evidence;
  }

  private async collectPhysicalEvidence(control: ComplianceControl): Promise<ComplianceEvidence[]> {
    const evidence: ComplianceEvidence[] = [];

    // Physical security evidence
    evidence.push({
      id: this.generateEvidenceId(),
      controlId: control.id,
      type: 'report',
      title: 'Physical Security Assessment Report',
      description: 'Automated physical security assessment results',
      content: `Physical security assessment for ${control.title} - environmental monitoring and access control verification`,
      collectionMethod: 'automated',
      validity: 'valid',
      collectedAt: new Date().toISOString(),
      expiresAt: this.addDays(new Date(), 180).toISOString(), // 6 months validity
      collectedBy: 'Automated System',
      metadata: {
        assessment_type: 'physical_security',
        control_type: control.controlType,
        category: control.category
      }
    });

    return evidence;
  }

  private generateGapAnalysisSummary(gaps: ComplianceGap[], framework: ComplianceFramework): any {
    const criticalGaps = gaps.filter(g => g.severity === 'critical').length;
    const highGaps = gaps.filter(g => g.severity === 'high').length;
    const mediumGaps = gaps.filter(g => g.severity === 'medium').length;
    const lowGaps = gaps.filter(g => g.severity === 'low').length;

    const gapsByType = gaps.reduce((acc, gap) => {
      acc[gap.type] = (acc[gap.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalGaps: gaps.length,
        criticalGaps,
        highGaps,
        mediumGaps,
        lowGaps,
        riskLevel: criticalGaps > 0 ? 'Critical' : highGaps > 0 ? 'High' : 'Medium'
      },
      distribution: {
        bySeverity: { critical: criticalGaps, high: highGaps, medium: mediumGaps, low: lowGaps },
        byType: gapsByType
      },
      recommendations: [
        criticalGaps > 0 ? 'Immediate action required for critical gaps' : null,
        highGaps > 0 ? 'Prioritize high severity gap remediation' : null,
        'Implement continuous monitoring for gap prevention',
        'Regular assessment and review cycles needed'
      ].filter(Boolean),
      estimatedRemediationTime: this.estimateRemediationTimeframe(gaps)
    };
  }

  private async calculateFrameworkMetrics(framework: ComplianceFramework): Promise<ComplianceMetrics> {
    const controls = await this.getFrameworkControls(framework.id);
    const gaps = await this.getFrameworkGaps(framework.id);

    const implementedControls = controls.filter(c => c.status === 'implemented').length;
    const totalControls = controls.length;
    const criticalGaps = gaps.filter(g => g.severity === 'critical').length;
    const highRiskGaps = gaps.filter(g => g.severity === 'high').length;
    
    const automatedControls = controls.filter(c => c.automationLevel === 'automated').length;
    const automationLevel = totalControls > 0 ? (automatedControls / totalControls) * 100 : 0;

    const controlsWithEvidence = controls.filter(c => c.evidence.length > 0).length;
    const evidenceCompleteness = totalControls > 0 ? (controlsWithEvidence / totalControls) * 100 : 0;

    const overallCompliance = framework.overallScore;

    return {
      frameworkId: framework.id,
      period: new Date().toISOString().substring(0, 7), // YYYY-MM
      overallCompliance,
      controlsImplemented: implementedControls,
      controlsTotal: totalControls,
      criticalGaps,
      highRiskGaps,
      overdueMitigations: 0, // Would calculate from actual mitigation data
      automationLevel,
      evidenceCompleteness,
      assessmentFrequency: framework.lastAssessment ? this.calculateAssessmentFrequency(framework.lastAssessment) : 0,
      trendDirection: this.determineTrendDirection(framework)
    };
  }

  private async performControlMapping(sourceFramework: ComplianceFramework, targetFramework: ComplianceFramework): Promise<ComplianceMapping> {
    const mappings: ComplianceMapping['mappings'] = [];
    let totalMappings = 0;
    let successfulMappings = 0;

    const sourceControls = await this.getFrameworkControls(sourceFramework.id);
    const targetControls = await this.getFrameworkControls(targetFramework.id);

    for (const sourceControl of sourceControls) {
      const mappedControls = this.findControlMappings(sourceControl, targetControls);
      
      if (mappedControls.length > 0) {
        mappings.push({
          sourceControl: sourceControl.id,
          targetControls: mappedControls.map(m => m.id),
          mappingType: this.determineMappingType(sourceControl, mappedControls),
          confidence: this.calculateMappingConfidence(sourceControl, mappedControls),
          notes: `Mapped based on control requirements and descriptions`
        });
        successfulMappings++;
      } else {
        mappings.push({
          sourceControl: sourceControl.id,
          targetControls: [],
          mappingType: 'no_mapping',
          confidence: 0,
          notes: 'No equivalent control found in target framework'
        });
      }
      totalMappings++;
    }

    const coverage = totalMappings > 0 ? (successfulMappings / totalMappings) * 100 : 0;

    return {
      sourceFramework: sourceFramework.id,
      targetFramework: targetFramework.id,
      mappings,
      coverage,
      lastUpdated: new Date().toISOString()
    };
  }

  // Framework initialization

  private async initializeComplianceFrameworks(): Promise<void> {
    const frameworks = [
      await this.createISO27001Framework(),
      await this.createSOC2Framework(),
      await this.createNISTFramework()
    ];

    for (const framework of frameworks) {
      this.frameworks.set(framework.id, framework);
      await this.storeComplianceFramework(framework);
    }
  }

  private async createISO27001Framework(): Promise<ComplianceFramework> {
    const domains: ComplianceDomain[] = [
      {
        id: 'iso27001_info_security_policies',
        frameworkId: 'iso27001_2022',
        name: 'Information Security Policies',
        description: 'Management direction and support for information security',
        controls: [
          {
            id: 'iso27001_5.1',
            domainId: 'iso27001_info_security_policies',
            frameworkId: 'iso27001_2022',
            title: 'Policies for information security',
            description: 'A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.',
            requirements: ['Policy development', 'Management approval', 'Communication', 'Review and update'],
            controlType: 'directive',
            category: 'administrative',
            priority: 'critical',
            status: 'not_implemented',
            maturityLevel: 1,
            effectiveness: 0,
            evidence: [],
            gaps: [],
            mitigations: [],
            relatedRisks: [],
            relatedControls: [],
            automationLevel: 'manual',
            testingFrequency: 'annually',
            responsible: 'CISO',
            accountable: 'CISO'
          }
        ],
        weight: 0.2,
        score: 0,
        status: 'not_assessed'
      },
      {
        id: 'iso27001_access_control',
        frameworkId: 'iso27001_2022',
        name: 'Access Control',
        description: 'Managing access to information and information processing facilities',
        controls: [
          {
            id: 'iso27001_8.1',
            domainId: 'iso27001_access_control',
            frameworkId: 'iso27001_2022',
            title: 'User access management',
            description: 'A formal user access provisioning process shall be implemented to assign or revoke access rights for all user types to all systems and services.',
            requirements: ['Access provisioning process', 'User lifecycle management', 'Access reviews', 'Segregation of duties'],
            controlType: 'preventive',
            category: 'technical',
            priority: 'high',
            status: 'not_implemented',
            maturityLevel: 1,
            effectiveness: 0,
            evidence: [],
            gaps: [],
            mitigations: [],
            relatedRisks: [],
            relatedControls: [],
            automationLevel: 'semi_automated',
            testingFrequency: 'quarterly',
            responsible: 'IT Security',
            accountable: 'CISO'
          }
        ],
        weight: 0.3,
        score: 0,
        status: 'not_assessed'
      }
    ];

    return {
      id: 'iso27001_2022',
      name: 'ISO/IEC 27001:2022',
      version: '2022',
      description: 'Information security management systems - Requirements',
      type: 'security',
      domains,
      totalControls: domains.reduce((sum, domain) => sum + domain.controls.length, 0),
      applicableControls: domains.reduce((sum, domain) => sum + domain.controls.length, 0),
      implementedControls: 0,
      status: 'not_started',
      overallScore: 0,
      certificationRequired: true
    };
  }

  private async createSOC2Framework(): Promise<ComplianceFramework> {
    const domains: ComplianceDomain[] = [
      {
        id: 'soc2_security',
        frameworkId: 'soc2_type2',
        name: 'Security',
        description: 'The system is protected against unauthorized access',
        controls: [
          {
            id: 'soc2_cc6.1',
            domainId: 'soc2_security',
            frameworkId: 'soc2_type2',
            title: 'Logical and Physical Access Controls',
            description: 'The entity implements logical and physical access security software, infrastructure, and controls over protected information assets.',
            requirements: ['Access control policies', 'Authentication mechanisms', 'Authorization procedures', 'Physical security'],
            controlType: 'preventive',
            category: 'technical',
            priority: 'high',
            status: 'not_implemented',
            maturityLevel: 1,
            effectiveness: 0,
            evidence: [],
            gaps: [],
            mitigations: [],
            relatedRisks: [],
            relatedControls: [],
            automationLevel: 'automated',
            testingFrequency: 'continuous',
            responsible: 'IT Security',
            accountable: 'CISO'
          }
        ],
        weight: 0.4,
        score: 0,
        status: 'not_assessed'
      }
    ];

    return {
      id: 'soc2_type2',
      name: 'SOC 2 Type II',
      version: '2017',
      description: 'System and Organization Controls 2 Type II',
      type: 'security',
      domains,
      totalControls: domains.reduce((sum, domain) => sum + domain.controls.length, 0),
      applicableControls: domains.reduce((sum, domain) => sum + domain.controls.length, 0),
      implementedControls: 0,
      status: 'not_started',
      overallScore: 0,
      certificationRequired: true
    };
  }

  private async createNISTFramework(): Promise<ComplianceFramework> {
    const domains: ComplianceDomain[] = [
      {
        id: 'nist_identify',
        frameworkId: 'nist_csf_2.0',
        name: 'Identify',
        description: 'Understand cybersecurity risk to systems, assets, data, and capabilities',
        controls: [
          {
            id: 'nist_id.am_1',
            domainId: 'nist_identify',
            frameworkId: 'nist_csf_2.0',
            title: 'Asset Management',
            description: 'Physical devices and systems within the organization are inventoried',
            requirements: ['Asset inventory', 'Asset classification', 'Asset ownership', 'Asset lifecycle management'],
            controlType: 'directive',
            category: 'administrative',
            priority: 'medium',
            status: 'not_implemented',
            maturityLevel: 1,
            effectiveness: 0,
            evidence: [],
            gaps: [],
            mitigations: [],
            relatedRisks: [],
            relatedControls: [],
            automationLevel: 'automated',
            testingFrequency: 'monthly',
            responsible: 'IT Operations',
            accountable: 'CIO'
          }
        ],
        weight: 0.2,
        score: 0,
        status: 'not_assessed'
      }
    ];

    return {
      id: 'nist_csf_2.0',
      name: 'NIST Cybersecurity Framework 2.0',
      version: '2.0',
      description: 'Framework for Improving Critical Infrastructure Cybersecurity',
      type: 'security',
      domains,
      totalControls: domains.reduce((sum, domain) => sum + domain.controls.length, 0),
      applicableControls: domains.reduce((sum, domain) => sum + domain.controls.length, 0),
      implementedControls: 0,
      status: 'not_started',
      overallScore: 0,
      certificationRequired: false
    };
  }

  private async setupAutomationRules(): Promise<void> {
    // Setup automation rules for evidence collection, gap detection, etc.
    console.log('🔧 Setting up compliance automation rules');
  }

  // Database helper methods and utility functions

  private async loadAssessments(): Promise<void> {
    if (!this.db) return;

    const result = await this.db.prepare(`
      SELECT * FROM compliance_assessments
    `).all();

    for (const row of result.results || []) {
      const assessment: ComplianceAssessment = {
        id: row.id,
        frameworkId: row.framework_id,
        type: row.type,
        scope: JSON.parse(row.scope || '[]'),
        assessor: row.assessor,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        methodology: row.methodology,
        findings: JSON.parse(row.findings || '[]'),
        overallScore: row.overall_score,
        recommendations: JSON.parse(row.recommendations || '[]'),
        executiveSummary: row.executive_summary,
        reportUrl: row.report_url
      };

      this.assessments.set(assessment.id, assessment);
    }
  }

  // Helper methods for various calculations and utilities

  private mapPriorityToSeverity(priority: ComplianceControl['priority']): ComplianceGap['severity'] {
    const mapping: Record<ComplianceControl['priority'], ComplianceGap['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[priority];
  }

  private mapSeverityToPriority(severity: ComplianceGap['severity']): ComplianceRemediationPlan['priority'] {
    const mapping: Record<ComplianceGap['severity'], ComplianceRemediationPlan['priority']> = {
      critical: 'immediate',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[severity];
  }

  private generateImplementationRecommendation(control: ComplianceControl): string {
    const recommendations: Record<string, string> = {
      technical: 'Implement and configure technical controls according to specifications',
      administrative: 'Develop and implement policies, procedures, and training programs',
      physical: 'Deploy physical security measures and environmental controls'
    };
    return recommendations[control.category] || 'Implement control according to requirements';
  }

  private generateRemediationStrategy(gap: ComplianceGap): string {
    const strategies: Record<string, string> = {
      implementation: 'Phased implementation approach with clear milestones and deliverables',
      evidence: 'Establish systematic evidence collection and documentation processes',
      operational: 'Improve operational procedures and monitoring capabilities',
      testing: 'Enhance testing frequency and methodology for better coverage',
      design: 'Redesign control architecture and implementation approach'
    };
    return strategies[gap.type] || 'Systematic remediation approach';
  }

  private determineRequiredResources(gap: ComplianceGap): string[] {
    const resources = ['Compliance Team'];
    
    if (gap.type === 'implementation') {
      resources.push('IT Team', 'Security Team');
    }
    if (gap.severity === 'critical' || gap.severity === 'high') {
      resources.push('Management', 'External Consultant');
    }
    
    return resources;
  }

  private estimateRiskReduction(gap: ComplianceGap): number {
    const reductionMap: Record<string, number> = {
      critical: 80,
      high: 65,
      medium: 45,
      low: 25
    };
    return reductionMap[gap.severity] || 50;
  }

  private calculateControlScore(control: ComplianceControl, findings: ComplianceFinding[]): number {
    let score = 100;
    
    for (const finding of findings) {
      switch (finding.type) {
        case 'non_compliant':
          score -= 50;
          break;
        case 'major_deficiency':
          score -= 30;
          break;
        case 'minor_deficiency':
          score -= 15;
          break;
        case 'observation':
          score -= 5;
          break;
      }
    }
    
    return Math.max(0, score);
  }

  private generateAssessmentRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];
    
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    
    if (criticalFindings > 0) {
      recommendations.push('Address critical findings immediately to reduce compliance risk');
    }
    
    if (highFindings > 0) {
      recommendations.push('Prioritize remediation of high severity findings');
    }
    
    recommendations.push('Implement continuous monitoring for ongoing compliance');
    recommendations.push('Establish regular assessment and review cycles');
    
    return recommendations;
  }

  private generateAssessmentSummary(framework: ComplianceFramework, findings: ComplianceFinding[], score: number): string {
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    
    return `
Assessment Summary for ${framework.name}

Overall Score: ${score.toFixed(1)}%
Status: ${score >= 95 ? 'Compliant' : score >= 70 ? 'Partially Compliant' : 'Non-Compliant'}

Key Findings:
• ${findings.length} total findings identified
• ${criticalFindings} critical severity findings
• ${highFindings} high severity findings

Compliance Level: ${score >= 95 ? 'EXCELLENT' : score >= 85 ? 'GOOD' : score >= 70 ? 'ACCEPTABLE' : 'NEEDS IMPROVEMENT'}

Next Steps:
${criticalFindings > 0 ? '• Immediate action required for critical findings' : ''}
${highFindings > 0 ? '• Prioritize high severity finding remediation' : ''}
• Continue monitoring and improvement efforts
    `.trim();
  }

  private determineFrameworkStatus(score: number): ComplianceFramework['status'] {
    if (score >= 95) return 'compliant';
    if (score >= 70) return 'partially_compliant';
    return 'non_compliant';
  }

  private estimateRemediationTimeframe(gaps: ComplianceGap[]): string {
    const criticalGaps = gaps.filter(g => g.severity === 'critical').length;
    const highGaps = gaps.filter(g => g.severity === 'high').length;
    
    if (criticalGaps > 0) return '1-3 months';
    if (highGaps > 0) return '3-6 months';
    return '6-12 months';
  }

  private calculateAssessmentFrequency(lastAssessment: string): number {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastAssessment).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, 365 - daysSince); // Days until next required assessment
  }

  private determineTrendDirection(framework: ComplianceFramework): ComplianceMetrics['trendDirection'] {
    // Would analyze historical data to determine trend
    // For now, return stable as default
    return 'stable';
  }

  private findControlMappings(sourceControl: ComplianceControl, targetControls: ComplianceControl[]): ComplianceControl[] {
    // Simple mapping based on title and description similarity
    const mappings: ComplianceControl[] = [];
    
    for (const targetControl of targetControls) {
      const similarity = this.calculateControlSimilarity(sourceControl, targetControl);
      if (similarity > 0.6) { // 60% similarity threshold
        mappings.push(targetControl);
      }
    }
    
    return mappings;
  }

  private calculateControlSimilarity(control1: ComplianceControl, control2: ComplianceControl): number {
    // Simple text similarity calculation
    const text1 = (control1.title + ' ' + control1.description).toLowerCase();
    const text2 = (control2.title + ' ' + control2.description).toLowerCase();
    
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  private determineMappingType(sourceControl: ComplianceControl, mappedControls: ComplianceControl[]): ComplianceMapping['mappings'][0]['mappingType'] {
    if (mappedControls.length === 0) return 'no_mapping';
    if (mappedControls.length === 1) return 'direct';
    return 'partial';
  }

  private calculateMappingConfidence(sourceControl: ComplianceControl, mappedControls: ComplianceControl[]): number {
    if (mappedControls.length === 0) return 0;
    
    const similarities = mappedControls.map(control => 
      this.calculateControlSimilarity(sourceControl, control)
    );
    
    return Math.round((similarities.reduce((a, b) => a + b, 0) / similarities.length) * 100);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Database storage methods

  private async storeComplianceFramework(framework: ComplianceFramework): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO compliance_frameworks (
        id, name, version, description, type, domains, total_controls,
        applicable_controls, implemented_controls, last_assessment,
        next_assessment, status, overall_score, certification_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      framework.id,
      framework.name,
      framework.version,
      framework.description,
      framework.type,
      JSON.stringify(framework.domains),
      framework.totalControls,
      framework.applicableControls,
      framework.implementedControls,
      framework.lastAssessment,
      framework.nextAssessment,
      framework.status,
      framework.overallScore,
      framework.certificationRequired ? 1 : 0
    ).run();
  }

  private async updateComplianceFramework(framework: ComplianceFramework): Promise<void> {
    await this.storeComplianceFramework(framework);
    this.frameworks.set(framework.id, framework);
  }

  private async storeComplianceControl(control: ComplianceControl): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO compliance_controls (
        id, domain_id, framework_id, title, description, requirements,
        control_type, category, priority, status, maturity_level,
        effectiveness, implementation_date, last_assessed, assessor,
        evidence, gaps, mitigations, related_risks, related_controls,
        automation_level, testing_frequency, responsible, accountable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      control.id,
      control.domainId,
      control.frameworkId,
      control.title,
      control.description,
      JSON.stringify(control.requirements),
      control.controlType,
      control.category,
      control.priority,
      control.status,
      control.maturityLevel,
      control.effectiveness,
      control.implementationDate,
      control.lastAssessed,
      control.assessor,
      JSON.stringify(control.evidence),
      JSON.stringify(control.gaps),
      JSON.stringify(control.mitigations),
      JSON.stringify(control.relatedRisks),
      JSON.stringify(control.relatedControls),
      control.automationLevel,
      control.testingFrequency,
      control.responsible,
      control.accountable
    ).run();
  }

  private async getFrameworkControls(frameworkId: string): Promise<ComplianceControl[]> {
    if (!this.db) return [];

    const result = await this.db.prepare(`
      SELECT * FROM compliance_controls WHERE framework_id = ?
    `).bind(frameworkId).all();

    return result.results?.map((row: any) => ({
      id: row.id,
      domainId: row.domain_id,
      frameworkId: row.framework_id,
      title: row.title,
      description: row.description,
      requirements: JSON.parse(row.requirements || '[]'),
      controlType: row.control_type,
      category: row.category,
      priority: row.priority,
      status: row.status,
      maturityLevel: row.maturity_level,
      effectiveness: row.effectiveness,
      implementationDate: row.implementation_date,
      lastAssessed: row.last_assessed,
      assessor: row.assessor,
      evidence: JSON.parse(row.evidence || '[]'),
      gaps: JSON.parse(row.gaps || '[]'),
      mitigations: JSON.parse(row.mitigations || '[]'),
      relatedRisks: JSON.parse(row.related_risks || '[]'),
      relatedControls: JSON.parse(row.related_controls || '[]'),
      automationLevel: row.automation_level,
      testingFrequency: row.testing_frequency,
      responsible: row.responsible,
      accountable: row.accountable
    })) || [];
  }

  private async getComplianceControl(controlId: string): Promise<ComplianceControl | null> {
    if (!this.db) return null;

    const result = await this.db.prepare(`
      SELECT * FROM compliance_controls WHERE id = ?
    `).bind(controlId).first();

    if (!result) return null;

    return {
      id: result.id,
      domainId: result.domain_id,
      frameworkId: result.framework_id,
      title: result.title,
      description: result.description,
      requirements: JSON.parse(result.requirements || '[]'),
      controlType: result.control_type,
      category: result.category,
      priority: result.priority,
      status: result.status,
      maturityLevel: result.maturity_level,
      effectiveness: result.effectiveness,
      implementationDate: result.implementation_date,
      lastAssessed: result.last_assessed,
      assessor: result.assessor,
      evidence: JSON.parse(result.evidence || '[]'),
      gaps: JSON.parse(result.gaps || '[]'),
      mitigations: JSON.parse(result.mitigations || '[]'),
      relatedRisks: JSON.parse(result.related_risks || '[]'),
      relatedControls: JSON.parse(result.related_controls || '[]'),
      automationLevel: result.automation_level,
      testingFrequency: result.testing_frequency,
      responsible: result.responsible,
      accountable: result.accountable
    };
  }

  private async updateComplianceControl(control: ComplianceControl): Promise<void> {
    await this.storeComplianceControl(control);
  }

  private async getFrameworkGaps(frameworkId: string): Promise<ComplianceGap[]> {
    if (!this.db) return [];

    const result = await this.db.prepare(`
      SELECT cg.* FROM compliance_gaps cg
      JOIN compliance_controls cc ON cg.control_id = cc.id
      WHERE cc.framework_id = ?
    `).bind(frameworkId).all();

    return result.results?.map((row: any) => ({
      id: row.id,
      controlId: row.control_id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      impact: row.impact,
      rootCause: row.root_cause,
      recommendation: row.recommendation,
      remediationPlan: JSON.parse(row.remediation_plan || '{}'),
      status: row.status,
      identifiedAt: row.identified_at,
      targetResolution: row.target_resolution,
      actualResolution: row.actual_resolution,
      assignee: row.assignee
    })) || [];
  }

  private async getComplianceGap(gapId: string): Promise<ComplianceGap | null> {
    if (!this.db) return null;

    const result = await this.db.prepare(`
      SELECT * FROM compliance_gaps WHERE id = ?
    `).bind(gapId).first();

    if (!result) return null;

    return {
      id: result.id,
      controlId: result.control_id,
      type: result.type,
      severity: result.severity,
      title: result.title,
      description: result.description,
      impact: result.impact,
      rootCause: result.root_cause,
      recommendation: result.recommendation,
      remediationPlan: JSON.parse(result.remediation_plan || '{}'),
      status: result.status,
      identifiedAt: result.identified_at,
      targetResolution: result.target_resolution,
      actualResolution: result.actual_resolution,
      assignee: result.assignee
    };
  }

  private async storeComplianceGap(gap: ComplianceGap): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO compliance_gaps (
        id, control_id, type, severity, title, description, impact,
        root_cause, recommendation, remediation_plan, status,
        identified_at, target_resolution, actual_resolution, assignee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      gap.id,
      gap.controlId,
      gap.type,
      gap.severity,
      gap.title,
      gap.description,
      gap.impact,
      gap.rootCause,
      gap.recommendation,
      JSON.stringify(gap.remediationPlan),
      gap.status,
      gap.identifiedAt,
      gap.targetResolution,
      gap.actualResolution,
      gap.assignee
    ).run();
  }

  private async updateComplianceGap(gap: ComplianceGap): Promise<void> {
    await this.storeComplianceGap(gap);
  }

  private async storeComplianceEvidence(evidence: ComplianceEvidence): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO compliance_evidence (
        id, control_id, type, title, description, file_url, content,
        collection_method, validity, collected_at, expires_at,
        collected_by, reviewed_by, reviewed_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      evidence.id,
      evidence.controlId,
      evidence.type,
      evidence.title,
      evidence.description,
      evidence.fileUrl,
      evidence.content,
      evidence.collectionMethod,
      evidence.validity,
      evidence.collectedAt,
      evidence.expiresAt,
      evidence.collectedBy,
      evidence.reviewedBy,
      evidence.reviewedAt,
      JSON.stringify(evidence.metadata)
    ).run();
  }

  private async storeComplianceAssessment(assessment: ComplianceAssessment): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO compliance_assessments (
        id, framework_id, type, scope, assessor, start_date, end_date,
        status, methodology, findings, overall_score, recommendations,
        executive_summary, report_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assessment.id,
      assessment.frameworkId,
      assessment.type,
      JSON.stringify(assessment.scope),
      assessment.assessor,
      assessment.startDate,
      assessment.endDate,
      assessment.status,
      assessment.methodology,
      JSON.stringify(assessment.findings),
      assessment.overallScore,
      JSON.stringify(assessment.recommendations),
      assessment.executiveSummary,
      assessment.reportUrl
    ).run();
  }

  private async storeComplianceMapping(mapping: ComplianceMapping): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT OR REPLACE INTO compliance_mappings (
        source_framework, target_framework, mappings, coverage, last_updated
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      mapping.sourceFramework,
      mapping.targetFramework,
      JSON.stringify(mapping.mappings),
      mapping.coverage,
      mapping.lastUpdated
    ).run();
  }

  // ID generation helpers

  private generateGapId(): string {
    return `gap_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateRemediationPlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateAssessmentId(): string {
    return `assess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateFindingId(): string {
    return `finding_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateEvidenceId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export helper functions for compliance automation integration
export const ComplianceHelpers = {
  /**
   * Map compliance status to color for UI
   */
  getStatusColor: (status: ComplianceFramework['status']): string => {
    const colorMap: Record<ComplianceFramework['status'], string> = {
      compliant: 'green',
      partially_compliant: 'yellow',
      non_compliant: 'red',
      not_started: 'gray',
      in_progress: 'blue'
    };
    return colorMap[status] || 'gray';
  },

  /**
   * Calculate compliance percentage
   */
  calculateCompliancePercentage: (framework: ComplianceFramework): number => {
    return framework.totalControls > 0 ? 
      Math.round((framework.implementedControls / framework.totalControls) * 100) : 0;
  },

  /**
   * Determine control criticality
   */
  isControlCritical: (control: ComplianceControl): boolean => {
    return control.priority === 'critical' || 
           (control.priority === 'high' && control.category === 'technical');
  },

  /**
   * Format compliance score
   */
  formatComplianceScore: (score: number): string => {
    return `${score.toFixed(1)}%`;
  },

  /**
   * Get next assessment due date
   */
  getNextAssessmentDate: (lastAssessment: string | undefined, frequency: 'monthly' | 'quarterly' | 'annually'): string | undefined => {
    if (!lastAssessment) return undefined;
    
    const date = new Date(lastAssessment);
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString();
  }
};