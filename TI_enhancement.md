# Threat Intelligence (TI) Enhancement Implementation Plan

## 📋 Executive Summary

This document outlines the comprehensive implementation plan for integrating Threat Intelligence (TI) capabilities into the ARIA5 GRC platform. The plan addresses the critical gap between current infrastructure (30% complete) and the original TI enhancement requirements, focusing on dynamic risk lifecycle management, automated TI data ingestion, and AI-driven risk enrichment.

## 🎯 Project Objectives

### Primary Goals
1. **Dynamic Risk Lifecycle**: Auto-generate and manage risks from TI feeds with state transitions
2. **TI → GRC Integration**: Seamless mapping of threat intelligence to risk management workflows  
3. **AI-Driven Enrichment**: Leverage RAG and LLM APIs for contextual threat analysis
4. **Multi-Source Ingestion**: Activate OSINT and premium TI feed processing
5. **Compliance Integration**: Map TI insights to regulatory frameworks (NIST, ISO, PCI)

### Success Metrics
- **100% automated risk creation** from high-confidence TI sources (CISA KEV, EPSS >0.7)
- **Real-time TI data ingestion** from 8+ OSINT sources  
- **AI-enriched risk summaries** for 100% of dynamic risks
- **Sub-5 minute** detection-to-draft-risk timeline
- **90%+ accuracy** in TI → risk mapping validation

---

## 🏗️ Current Implementation Analysis

### ✅ Completed Infrastructure (30%)
- **Database Schema**: TI tables exist (threat_feeds, iocs, threat_campaigns, behavioral_profiles)
- **Service Layer**: Feed connectors and ML analytics services created
- **AI Integration**: Basic RAG service and Cloudflare AI integration
- **Feed Connectors**: Code exists for OTX, CISA KEV, NVD, STIX/TAXII

### ❌ Critical Gaps (70%)
- **Dynamic Risk Lifecycle**: No auto-generation or state management
- **Active Data Ingestion**: Feed connectors exist but not operational
- **TI → GRC Mapping**: No automated CVE→Risk, IOC→Vendor Risk workflows
- **Required LLM Functions**: Missing 5 core enrichment functions
- **Tiered Integration**: No differentiation between OSINT/Premium tiers

---

## 🚀 Implementation Phases

## **Phase 1: Dynamic Risk Lifecycle Foundation** (Priority: CRITICAL)
*Timeline: 5-7 days | Effort: High | Dependencies: None*

### **1.1 Dynamic Risk State Management**

#### Database Schema Extensions
```sql
-- Extend risks table for dynamic TI integration
ALTER TABLE risks ADD COLUMN source_type TEXT DEFAULT 'manual';
ALTER TABLE risks ADD COLUMN dynamic_state TEXT DEFAULT NULL;
ALTER TABLE risks ADD COLUMN confidence_score REAL DEFAULT 0.0;
ALTER TABLE risks ADD COLUMN threat_intel_sources TEXT DEFAULT '[]';
ALTER TABLE risks ADD COLUMN last_ti_update DATETIME DEFAULT NULL;
ALTER TABLE risks ADD COLUMN auto_retirement_date DATETIME DEFAULT NULL;

-- Dynamic risk state tracking
CREATE TABLE IF NOT EXISTS dynamic_risk_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  previous_state TEXT,
  current_state TEXT NOT NULL,
  transition_reason TEXT,
  automated BOOLEAN DEFAULT FALSE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- TI source attribution  
CREATE TABLE IF NOT EXISTS ti_risk_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'osint', 'premium', 'internal'
  confidence_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  data_payload TEXT, -- JSON with source-specific data
  first_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);
```

#### Dynamic Risk State Enum & Logic
```typescript
// src/types/dynamic-risk.ts
export enum DynamicRiskState {
  DETECTED = 'detected',      // TI source identified potential risk
  DRAFT = 'draft',           // Auto-created, pending validation  
  VALIDATED = 'validated',   // Human approved, ready for activation
  ACTIVE = 'active',         // Monitoring and updating dynamically
  RETIRED = 'retired'        // No longer relevant or patched
}

export interface DynamicRiskTransition {
  fromState: DynamicRiskState;
  toState: DynamicRiskState;
  trigger: 'automated' | 'manual' | 'scheduled';
  conditions?: string[];
  requiredApproval?: boolean;
}

export const RISK_STATE_TRANSITIONS: DynamicRiskTransition[] = [
  {
    fromState: DynamicRiskState.DETECTED,
    toState: DynamicRiskState.DRAFT,
    trigger: 'automated',
    conditions: ['confidence >= 0.7', 'epss_score >= 0.7']
  },
  {
    fromState: DynamicRiskState.DRAFT, 
    toState: DynamicRiskState.VALIDATED,
    trigger: 'manual',
    requiredApproval: true
  },
  {
    fromState: DynamicRiskState.VALIDATED,
    toState: DynamicRiskState.ACTIVE, 
    trigger: 'automated',
    conditions: ['affected_assets_confirmed']
  },
  {
    fromState: DynamicRiskState.ACTIVE,
    toState: DynamicRiskState.RETIRED,
    trigger: 'automated', 
    conditions: ['patch_confirmed', 'threat_inactive_30days']
  }
];
```

#### Core Dynamic Risk Service
```typescript
// src/services/dynamic-risk-manager.ts
export class DynamicRiskManager {
  
  async createDynamicRisk(tiData: ThreatIntelligenceData): Promise<DynamicRisk> {
    // Auto-generate risk from TI data
    const riskData = await this.mapTIToRisk(tiData);
    const risk = await this.createRiskInDraftState(riskData);
    await this.enrichWithAI(risk);
    return risk;
  }

  async transitionRiskState(
    riskId: number, 
    toState: DynamicRiskState, 
    reason: string,
    automated = false
  ): Promise<void> {
    // Validate transition rules
    // Update risk state  
    // Log state change
    // Trigger workflows
  }

  async processDetectedThreats(): Promise<void> {
    // Scheduled job to process detected → draft transitions
    const detectedRisks = await this.getDetectedRisks();
    
    for (const risk of detectedRisks) {
      if (await this.shouldPromoteToDraft(risk)) {
        await this.transitionRiskState(
          risk.id, 
          DynamicRiskState.DRAFT,
          'Auto-promotion based on confidence threshold',
          true
        );
      }
    }
  }

  private async mapTIToRisk(tiData: ThreatIntelligenceData): Promise<Partial<Risk>> {
    // Map CVE/IOC/TTP data to risk structure
    // Calculate initial risk scores
    // Identify affected assets
    // Map to frameworks (NIST, MITRE ATT&CK)
  }
}
```

### **1.2 API Endpoints for Dynamic Risk Management**

```typescript
// src/routes/dynamic-risk-routes.ts
export function createDynamicRiskRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Get dynamic risks with filtering
  app.get('/api/ti/dynamic-risks', async (c) => {
    const { state, source, confidence } = c.req.query();
    // Return filtered dynamic risks
  });

  // Create risk from TI data
  app.post('/api/ti/auto-generate-risk', async (c) => {
    const tiData = await c.req.json();
    const risk = await dynamicRiskManager.createDynamicRisk(tiData);
    return c.json(risk);
  });

  // Validate draft risk (human approval)
  app.post('/api/ti/validate-risk/:id', async (c) => {
    const riskId = parseInt(c.req.param('id'));
    const { approved, notes } = await c.req.json();
    
    if (approved) {
      await dynamicRiskManager.transitionRiskState(
        riskId,
        DynamicRiskState.VALIDATED,
        notes || 'Manual validation approved'
      );
    }
    
    return c.json({ success: true });
  });

  // Retire risk
  app.post('/api/ti/retire-risk/:id', async (c) => {
    const riskId = parseInt(c.req.param('id'));
    const { reason } = await c.req.json();
    
    await dynamicRiskManager.transitionRiskState(
      riskId,
      DynamicRiskState.RETIRED, 
      reason
    );
    
    return c.json({ success: true });
  });

  // Get risk state history
  app.get('/api/ti/risk/:id/state-history', async (c) => {
    const riskId = parseInt(c.req.param('id'));
    const history = await dynamicRiskManager.getStateHistory(riskId);
    return c.json(history);
  });

  return app;
}
```

---

## **Phase 2: TI Data Ingestion Pipeline** (Priority: CRITICAL)  
*Timeline: 4-6 days | Effort: Medium | Dependencies: Phase 1*

### **2.1 Feed Connector Activation**

#### Scheduled Feed Processing
```typescript
// src/services/ti-ingestion-pipeline.ts
export class TIIngestionPipeline {
  
  async startScheduledIngestion(): Promise<void> {
    // Schedule feed connectors based on source priority
    const feedSchedule = {
      'cisa-kev': '0 */2 * * *',      // Every 2 hours (critical)
      'nvd': '0 */6 * * *',           // Every 6 hours  
      'otx': '0 */4 * * *',           // Every 4 hours
      'first-epss': '0 0 * * *',      // Daily
      'mitre-attack': '0 0 * * 0'     // Weekly
    };
    
    for (const [source, schedule] of Object.entries(feedSchedule)) {
      await this.scheduleConnector(source, schedule);
    }
  }

  async processFeedData(source: string, data: any[]): Promise<void> {
    // Normalize data to common schema
    const normalizedData = await this.normalizeToSTIX(source, data);
    
    // Store in database
    await this.storeTIData(normalizedData);
    
    // Trigger risk assessment
    await this.assessForRiskCreation(normalizedData);
  }

  private async assessForRiskCreation(tiData: STIXData[]): Promise<void> {
    for (const indicator of tiData) {
      const riskCriteria = await this.evaluateRiskCriteria(indicator);
      
      if (riskCriteria.shouldCreateRisk) {
        await this.dynamicRiskManager.createDynamicRisk({
          source: indicator.source,
          confidence: riskCriteria.confidence,
          data: indicator
        });
      }
    }
  }
}
```

#### Risk Creation Rules Engine
```typescript
// src/services/risk-creation-rules.ts
export class RiskCreationRules {
  
  private rules = [
    {
      name: 'CISA KEV Auto-Create',
      condition: (data: TIData) => data.source === 'cisa-kev',
      confidence: 0.95,
      autoPromoteToDraft: true
    },
    {
      name: 'High EPSS Score',
      condition: (data: TIData) => data.epss_score >= 0.8,
      confidence: 0.85,
      autoPromoteToDraft: true  
    },
    {
      name: 'Active Exploitation',
      condition: (data: TIData) => data.exploitation_status === 'active',
      confidence: 0.90,
      autoPromoteToDraft: true
    },
    {
      name: 'Critical CVE with Assets',
      condition: (data: TIData) => 
        data.cvss_score >= 9.0 && data.affected_assets?.length > 0,
      confidence: 0.80,
      autoPromoteToDraft: false // Requires manual review
    }
  ];

  async evaluateRiskCreation(tiData: TIData): Promise<RiskAssessment> {
    let maxConfidence = 0;
    let shouldCreate = false;
    let autoPromote = false;
    const matchedRules = [];

    for (const rule of this.rules) {
      if (rule.condition(tiData)) {
        matchedRules.push(rule.name);
        maxConfidence = Math.max(maxConfidence, rule.confidence);
        shouldCreate = true;
        if (rule.autoPromoteToDraft) autoPromote = true;
      }
    }

    return {
      shouldCreateRisk: shouldCreate,
      confidence: maxConfidence,
      autoPromoteToDraft: autoPromote,
      matchedRules,
      reasoning: this.generateReasoning(matchedRules, tiData)
    };
  }
}
```

### **2.2 TI Data Normalization Layer**

```typescript
// src/services/ti-normalizer.ts
export class TINormalizer {
  
  async normalizeToCommonSchema(source: string, rawData: any): Promise<TIIndicator> {
    const normalizers = {
      'cisa-kev': this.normalizeCISAKEV,
      'nvd': this.normalizeNVD,
      'otx': this.normalizeOTX,
      'first-epss': this.normalizeEPSS
    };

    const normalizer = normalizers[source];
    if (!normalizer) throw new Error(`No normalizer for source: ${source}`);

    return normalizer(rawData);
  }

  private async normalizeCISAKEV(data: any): Promise<TIIndicator> {
    return {
      id: `cisa-kev-${data.cveID}`,
      type: 'vulnerability',
      source: 'cisa-kev',
      confidence: 0.95, // CISA KEV is high confidence
      created: new Date(data.dateAdded),
      modified: new Date(),
      indicators: [{
        type: 'cve',
        value: data.cveID,
        metadata: {
          product: data.product,
          vendorProject: data.vendorProject,
          shortDescription: data.shortDescription,
          requiredAction: data.requiredAction,
          dueDate: data.dueDate,
          knownRansomwareCampaignUse: data.knownRansomwareCampaignUse
        }
      }],
      relationships: [],
      riskFactors: {
        exploitationStatus: 'active',
        patchAvailable: true,
        businessImpact: this.calculateBusinessImpact(data)
      }
    };
  }

  private async normalizeNVD(data: any): Promise<TIIndicator> {
    // Map NVD CVE data to common schema
    const cvss = data.impact?.baseMetricV3?.cvssV3 || data.impact?.baseMetricV2?.cvssV2;
    
    return {
      id: `nvd-${data.cve.CVE_data_meta.ID}`,
      type: 'vulnerability',
      source: 'nvd',
      confidence: 0.85,
      created: new Date(data.publishedDate),
      modified: new Date(data.lastModifiedDate),
      indicators: [{
        type: 'cve',
        value: data.cve.CVE_data_meta.ID,
        metadata: {
          description: data.cve.description.description_data[0]?.value,
          cvssScore: cvss?.baseScore,
          cvssVector: cvss?.vectorString,
          severity: cvss?.baseSeverity
        }
      }],
      riskFactors: {
        cvssScore: cvss?.baseScore,
        exploitabilityScore: cvss?.exploitabilityScore,
        impactScore: cvss?.impactScore
      }
    };
  }
}
```

---

## **Phase 3: Required LLM Functions** (Priority: HIGH)
*Timeline: 3-4 days | Effort: Medium | Dependencies: Phase 1, 2*

### **3.1 Core LLM Enrichment Functions**

```typescript
// src/services/ti-llm-functions.ts
export class TILLMFunctions {
  
  async summarizeThreatIntel(tiData: TIIndicator[]): Promise<string> {
    const prompt = `
    Analyze the following threat intelligence data and provide an executive summary:
    
    ${JSON.stringify(tiData, null, 2)}
    
    Provide:
    1. Key threats and their severity
    2. Business impact assessment  
    3. Recommended immediate actions
    4. Strategic recommendations
    
    Format as executive-friendly summary (max 300 words).
    `;

    return await this.callLLM(prompt);
  }

  async enrichRiskEntry(cve: string, iocs: string[]): Promise<RiskEnrichment> {
    const prompt = `
    Enrich this risk entry with threat intelligence context:
    
    CVE: ${cve}
    Related IOCs: ${iocs.join(', ')}
    
    Provide:
    1. Threat actor attribution (if known)
    2. Attack techniques (MITRE ATT&CK TTPs)
    3. Exploitation timeline and trends
    4. Recommended controls and mitigations
    5. Business context and urgency level
    
    Return structured JSON with enrichment data.
    `;

    const response = await this.callLLM(prompt);
    return JSON.parse(response);
  }

  async assessControls(threat: ThreatData, controls: Control[]): Promise<ControlAssessment> {
    const prompt = `
    Assess the effectiveness of these security controls against the threat:
    
    Threat: ${JSON.stringify(threat)}
    Current Controls: ${JSON.stringify(controls)}
    
    For each control, provide:
    1. Effectiveness rating (1-5)
    2. Coverage gaps
    3. Improvement recommendations
    4. Additional controls needed
    
    Return structured assessment with prioritized recommendations.
    `;

    const response = await this.callLLM(prompt);
    return JSON.parse(response);
  }

  async generateVendorRiskReport(vendorName: string, tiContext: TIData[]): Promise<VendorRiskReport> {
    const prompt = `
    Generate a vendor risk assessment report for: ${vendorName}
    
    Threat Intelligence Context: ${JSON.stringify(tiContext)}
    
    Include:
    1. Vendor threat landscape assessment
    2. Supply chain risks
    3. Known vulnerabilities in vendor products
    4. Industry-specific threat vectors
    5. Risk score and justification
    6. Mitigation recommendations
    
    Format as comprehensive risk report.
    `;

    const response = await this.callLLM(prompt);
    return JSON.parse(response);
  }

  async generateBoardSummary(threats: ThreatData[]): Promise<BoardSummary> {
    const prompt = `
    Create a board-level summary of current threat landscape:
    
    Threat Data: ${JSON.stringify(threats)}
    
    Provide:
    1. Executive summary (3 bullet points max)
    2. Top 3 risks requiring board attention
    3. Resource/investment recommendations
    4. Regulatory/compliance implications
    5. Strategic security posture assessment
    
    Use business language, avoid technical jargon. Max 500 words.
    `;

    const response = await this.callLLM(prompt);
    return JSON.parse(response);
  }

  private async callLLM(prompt: string): Promise<string> {
    // Use existing Cloudflare AI integration
    const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048
    });

    return response.response || 'LLM response unavailable';
  }
}
```

### **3.2 LLM Function API Endpoints**

```typescript
// src/routes/ti-llm-routes.ts
export function createTILLMRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  app.post('/api/llm/summarize-threat-intel', async (c) => {
    const { tiData } = await c.req.json();
    const summary = await tiLLMFunctions.summarizeThreatIntel(tiData);
    return c.json({ summary });
  });

  app.post('/api/llm/enrich-risk-entry', async (c) => {
    const { cve, iocs } = await c.req.json();
    const enrichment = await tiLLMFunctions.enrichRiskEntry(cve, iocs);
    return c.json(enrichment);
  });

  app.post('/api/llm/assess-controls', async (c) => {
    const { threat, controls } = await c.req.json();
    const assessment = await tiLLMFunctions.assessControls(threat, controls);
    return c.json(assessment);
  });

  app.post('/api/llm/generate-vendor-risk-report', async (c) => {
    const { vendorName, tiContext } = await c.req.json();
    const report = await tiLLMFunctions.generateVendorRiskReport(vendorName, tiContext);
    return c.json(report);
  });

  app.post('/api/llm/generate-board-summary', async (c) => {
    const { threats } = await c.req.json();
    const summary = await tiLLMFunctions.generateBoardSummary(threats);
    return c.json(summary);
  });

  return app;
}
```

---

## **Phase 4: TI → GRC Mapping Engine** (Priority: HIGH)
*Timeline: 4-5 days | Effort: High | Dependencies: Phase 1, 2, 3*

### **4.1 Automated Mapping Logic**

```typescript
// src/services/ti-grc-mapper.ts
export class TIGRCMapper {
  
  async mapCVEToRisk(cveData: CVEData): Promise<RiskMapping> {
    // 1. Asset Impact Analysis
    const affectedAssets = await this.findAffectedAssets(cveData);
    
    // 2. Business Impact Calculation
    const businessImpact = await this.calculateBusinessImpact(affectedAssets);
    
    // 3. Risk Score Calculation
    const riskScore = this.calculateTIRiskScore({
      cvssScore: cveData.cvssScore,
      epssScore: cveData.epssScore,
      businessImpact,
      exploitationStatus: cveData.exploitationStatus
    });

    // 4. Framework Mapping
    const frameworkMappings = await this.mapToFrameworks(cveData);

    return {
      riskTitle: `${cveData.cveId} - ${cveData.shortDescription}`,
      category: 'Vulnerability Management',
      likelihood: this.mapEPSSToLikelihood(cveData.epssScore),
      impact: businessImpact.level,
      riskScore,
      affectedAssets,
      frameworkMappings,
      recommendedControls: await this.suggestControls(cveData),
      llmEnrichment: await this.tiLLMFunctions.enrichRiskEntry(
        cveData.cveId, 
        cveData.relatedIOCs || []
      )
    };
  }

  async mapIOCToVendorRisk(ioc: IOCData, vendors: Vendor[]): Promise<VendorRiskUpdate[]> {
    const updates = [];
    
    for (const vendor of vendors) {
      const relevance = await this.assessIOCVendorRelevance(ioc, vendor);
      
      if (relevance.isRelevant) {
        const riskUpdate = {
          vendorId: vendor.id,
          riskFactors: [{
            type: 'threat-intelligence',
            severity: relevance.severity,
            description: `IOC detected: ${ioc.value} (${ioc.type})`,
            source: ioc.source,
            confidence: ioc.confidence,
            firstSeen: ioc.firstSeen,
            contextualInfo: await this.tiLLMFunctions.enrichRiskEntry(
              null, [ioc.value]
            )
          }],
          scoreAdjustment: relevance.scoreAdjustment,
          recommendedActions: relevance.actions
        };
        
        updates.push(riskUpdate);
      }
    }
    
    return updates;
  }

  async mapTTPToControls(ttp: MITREAttackTechnique): Promise<ControlMapping[]> {
    // Map MITRE ATT&CK techniques to existing security controls
    const existingControls = await this.getExistingControls();
    const mappings = [];
    
    for (const control of existingControls) {
      const effectiveness = await this.assessControlEffectiveness(ttp, control);
      
      if (effectiveness.coverage > 0) {
        mappings.push({
          controlId: control.id,
          techniqueId: ttp.id,
          coverage: effectiveness.coverage,
          effectiveness: effectiveness.level,
          gaps: effectiveness.gaps,
          recommendations: effectiveness.improvements
        });
      }
    }
    
    // Suggest additional controls if coverage gaps exist
    const missingCoverage = await this.identifyControlGaps(ttp, mappings);
    if (missingCoverage.length > 0) {
      mappings.push(...missingCoverage);
    }
    
    return mappings;
  }

  private calculateTIRiskScore(factors: TIRiskFactors): number {
    // Threat-contextual risk scoring algorithm
    const weights = {
      cvssScore: 0.25,
      epssScore: 0.30,        // Higher weight for exploitation probability
      businessImpact: 0.25,
      exploitationStatus: 0.20
    };
    
    const normalizedScores = {
      cvssScore: factors.cvssScore / 10,
      epssScore: factors.epssScore,
      businessImpact: factors.businessImpact / 5,
      exploitationStatus: factors.exploitationStatus === 'active' ? 1.0 : 0.5
    };
    
    let score = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      score += normalizedScores[factor] * weight;
    }
    
    return Math.round(score * 100); // 0-100 scale
  }
}
```

### **4.2 Framework Integration**

```typescript
// src/services/framework-mapper.ts
export class FrameworkMapper {
  
  async mapToNISTCSF(tiData: TIIndicator): Promise<NISTMapping[]> {
    const mappings = [];
    
    // Map based on threat type and characteristics
    if (tiData.type === 'vulnerability') {
      mappings.push(
        { function: 'Identify', category: 'ID.AM-1', rationale: 'Asset inventory needed for vulnerability assessment' },
        { function: 'Protect', category: 'PR.IP-12', rationale: 'Vulnerability management process' },
        { function: 'Detect', category: 'DE.CM-8', rationale: 'Vulnerability scanning and monitoring' }
      );
    }
    
    if (tiData.indicators.some(i => i.type === 'malware')) {
      mappings.push(
        { function: 'Protect', category: 'PR.PT-1', rationale: 'Malware defense and protection' },
        { function: 'Detect', category: 'DE.CM-4', rationale: 'Malicious code detection' },
        { function: 'Respond', category: 'RS.MI-3', rationale: 'Malware incident mitigation' }
      );
    }
    
    return mappings;
  }

  async mapToMITREAttack(tiData: TIIndicator): Promise<MITREMapping[]> {
    // Use AI/ML to map indicators to MITRE ATT&CK techniques
    const prompt = `
    Map this threat intelligence to MITRE ATT&CK techniques:
    ${JSON.stringify(tiData)}
    
    Return JSON array with technique IDs, tactics, and confidence scores.
    `;
    
    const mappingResult = await this.tiLLMFunctions.callLLM(prompt);
    return JSON.parse(mappingResult);
  }
}
```

---

## **Phase 5: Tiered Integration Model** (Priority: MEDIUM)
*Timeline: 3-4 days | Effort: Medium | Dependencies: Phase 1-4*

### **5.1 Tier Configuration Management**

```typescript
// src/services/tier-manager.ts
export class TITierManager {
  
  private tierConfigurations = {
    tier1: {
      name: 'OSINT Baseline',
      description: 'Open source threat intelligence feeds',
      sources: [
        'alienvault-otx',
        'cisa-kev', 
        'nvd-cve',
        'first-epss',
        'abuse-ch',
        'mitre-attack',
        'greynoise-community'
      ],
      features: [
        'basic-correlation',
        'automated-risk-creation',
        'llm-enrichment-basic',
        'framework-mapping'
      ],
      updateFrequency: {
        'cisa-kev': '2h',
        'nvd-cve': '6h',
        'otx': '4h',
        'others': '24h'
      },
      maxRisksPerDay: 50
    },
    
    tier2: {
      name: 'Premium Intelligence',
      description: 'Enterprise-grade commercial threat intelligence',
      sources: [
        ...this.tierConfigurations.tier1.sources,
        'mandiant-advantage',
        'recorded-future',
        'threatconnect',
        'intel471',
        'flashpoint',
        'crowdstrike-falcon-x'
      ],
      features: [
        ...this.tierConfigurations.tier1.features,
        'advanced-correlation',
        'attribution-analysis',
        'predictive-analytics',
        'custom-hunting-rules',
        'priority-support',
        'advanced-reporting'
      ],
      updateFrequency: {
        'premium-feeds': '1h',
        'critical-alerts': 'real-time'
      },
      maxRisksPerDay: 200,
      slaResponseTime: '4h'
    }
  };

  async activateTier(tier: 'tier1' | 'tier2'): Promise<void> {
    const config = this.tierConfigurations[tier];
    
    // Configure feed connectors
    await this.configureFeedConnectors(config.sources, config.updateFrequency);
    
    // Enable tier-specific features
    await this.enableTierFeatures(config.features);
    
    // Set processing limits
    await this.setProcessingLimits(config);
    
    // Update system configuration
    await this.updateSystemConfig({ activeTier: tier });
  }
}
```

### **5.2 Premium Feed Integration Hooks**

```typescript
// src/services/premium-feed-connectors.ts
export class PremiumFeedConnectors {
  
  async configureMandiantAdvantage(apiKey: string): Promise<void> {
    const connector = new MandiantConnector({
      apiKey,
      baseUrl: 'https://api.intelligence.mandiant.com',
      rateLimits: { requestsPerHour: 1000 }
    });
    
    await connector.configure({
      indicators: true,
      reports: true,
      campaigns: true,
      malware: true,
      actors: true
    });
    
    await this.feedManager.registerConnector('mandiant-advantage', connector);
  }

  async configureRecordedFuture(apiKey: string): Promise<void> {
    const connector = new RecordedFutureConnector({
      apiKey,
      baseUrl: 'https://api.recordedfuture.com/v2',
      risklists: ['malware', 'c2', 'phishing', 'vulnerability']
    });
    
    await this.feedManager.registerConnector('recorded-future', connector);
  }

  // Template for additional premium connectors
  async configurePremiumConnector(
    provider: string, 
    config: PremiumConnectorConfig
  ): Promise<void> {
    const ConnectorClass = this.getConnectorClass(provider);
    const connector = new ConnectorClass(config);
    await this.feedManager.registerConnector(provider, connector);
  }
}
```

---

## **Phase 6: Advanced Features & Integration** (Priority: LOW)
*Timeline: 5-7 days | Effort: High | Dependencies: Phase 1-5*

### **6.1 TI-Driven Dashboards**

```typescript
// Frontend TI Dashboard Components
// public/static/ti-dashboard.js

class TIDashboard {
  constructor() {
    this.initializeWidgets();
    this.startRealTimeUpdates();
  }

  async initializeWidgets() {
    await Promise.all([
      this.renderThreatHeatmap(),
      this.renderRiskTrendChart(), 
      this.renderThreatActorActivity(),
      this.renderVendorRiskScores(),
      this.renderDynamicRiskPipeline()
    ]);
  }

  async renderThreatHeatmap() {
    const data = await fetch('/api/ti/dashboard/threat-heatmap').then(r => r.json());
    
    // D3.js or Chart.js heatmap visualization
    const heatmap = new ThreatHeatmap('#threat-heatmap', {
      data: data.threats,
      dimensions: ['severity', 'likelihood', 'businessImpact'],
      colorScale: ['#00ff00', '#ffff00', '#ff8000', '#ff0000']
    });
    
    heatmap.render();
  }

  async renderDynamicRiskPipeline() {
    const pipeline = await fetch('/api/ti/dynamic-risks/pipeline').then(r => r.json());
    
    const widget = document.getElementById('dynamic-risk-pipeline');
    widget.innerHTML = `
      <div class="pipeline-stage detected">
        <h4>Detected</h4>
        <span class="count">${pipeline.detected}</span>
      </div>
      <div class="pipeline-stage draft"> 
        <h4>Draft</h4>
        <span class="count">${pipeline.draft}</span>
        <button onclick="reviewDraftRisks()">Review</button>
      </div>
      <div class="pipeline-stage active">
        <h4>Active</h4>
        <span class="count">${pipeline.active}</span>
      </div>
      <div class="pipeline-stage retired">
        <h4>Retired</h4>
        <span class="count">${pipeline.retired}</span>
      </div>
    `;
  }
}
```

### **6.2 Automated Reporting**

```typescript
// src/services/ti-report-generator.ts
export class TIReportGenerator {
  
  async generateExecutiveSummary(timeframe: string): Promise<ExecutiveReport> {
    const tiData = await this.getTIDataForPeriod(timeframe);
    const dynamicRisks = await this.getDynamicRisksForPeriod(timeframe);
    
    const summary = await this.tiLLMFunctions.generateBoardSummary(tiData);
    
    return {
      executiveSummary: summary,
      keyMetrics: {
        totalThreatsProcessed: tiData.length,
        risksCreated: dynamicRisks.filter(r => r.state !== 'detected').length,
        criticalRisks: dynamicRisks.filter(r => r.severity === 'critical').length,
        avgTimeToValidation: this.calculateAvgValidationTime(dynamicRisks)
      },
      trendAnalysis: await this.generateTrendAnalysis(tiData),
      recommendedActions: await this.generateActionItems(dynamicRisks),
      complianceImpact: await this.assessComplianceImpact(tiData)
    };
  }

  async scheduleAutomatedReports(): Promise<void> {
    // Weekly executive summary
    cron.schedule('0 9 * * 1', async () => {
      const report = await this.generateExecutiveSummary('7d');
      await this.distributeReport(report, 'executives');
    });
    
    // Daily operational report
    cron.schedule('0 8 * * *', async () => {
      const report = await this.generateOperationalReport('24h');
      await this.distributeReport(report, 'security-team');
    });
  }
}
```

---

## 🛠️ Technical Implementation Details

### **Database Schema Updates**

```sql
-- Complete database schema for TI enhancement

-- Dynamic risk management
CREATE TABLE IF NOT EXISTS dynamic_risk_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  previous_state TEXT,
  current_state TEXT NOT NULL,
  transition_reason TEXT,
  automated BOOLEAN DEFAULT FALSE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- TI source attribution
CREATE TABLE IF NOT EXISTS ti_risk_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  data_payload TEXT,
  first_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- Feed processing logs
CREATE TABLE IF NOT EXISTS feed_processing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0,
  risks_created INTEGER DEFAULT 0,
  errors TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  processing_duration INTEGER -- milliseconds
);

-- TI indicators (normalized)
CREATE TABLE IF NOT EXISTS ti_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'cve', 'ioc', 'ttp', 'campaign'
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL NOT NULL,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON
  relationships TEXT, -- JSON array of related indicators
  risk_score REAL DEFAULT 0.0,
  status TEXT DEFAULT 'active' -- 'active', 'retired', 'false_positive'
);

-- Framework mappings
CREATE TABLE IF NOT EXISTS ti_framework_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id TEXT NOT NULL,
  framework TEXT NOT NULL, -- 'nist-csf', 'mitre-attack', 'iso27001'
  control_id TEXT NOT NULL,
  mapping_confidence REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (indicator_id) REFERENCES ti_indicators(indicator_id)
);

-- Vendor risk TI context
CREATE TABLE IF NOT EXISTS vendor_ti_context (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  indicator_id TEXT NOT NULL,
  relevance_score REAL NOT NULL,
  impact_description TEXT,
  recommended_actions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (indicator_id) REFERENCES ti_indicators(indicator_id)
);
```

### **Environment Configuration**

```bash
# .dev.vars - TI Enhancement Configuration

# === Tier Configuration ===
TI_TIER=tier1  # 'tier1' or 'tier2'
TI_AUTO_RISK_CREATION=true
TI_MAX_RISKS_PER_DAY=50

# === OSINT Feed API Keys ===
OTX_API_KEY=your_otx_api_key_here
NVD_API_KEY=your_nvd_api_key_here
FIRST_EPSS_API_KEY=optional_epss_api_key
GREYNOISE_API_KEY=your_greynoise_community_key

# === Premium Feed API Keys (Tier 2) ===
MANDIANT_API_KEY=your_mandiant_api_key
RECORDED_FUTURE_API_KEY=your_recorded_future_key
THREATCONNECT_API_KEY=your_threatconnect_key
INTEL471_API_KEY=your_intel471_key
FLASHPOINT_API_KEY=your_flashpoint_key

# === TAXII/STIX Configuration ===
TAXII_SERVER_URL=https://your-taxii-server.com
TAXII_USERNAME=your_taxii_username
TAXII_PASSWORD=your_taxii_password
TAXII_COLLECTION_ID=your_collection_id

# === Processing Configuration ===
TI_FEED_SYNC_INTERVAL=3600  # seconds
TI_BATCH_SIZE=1000
TI_CORRELATION_THRESHOLD=0.75
TI_AUTO_RETIREMENT_DAYS=30

# === Risk Creation Rules ===
CISA_KEV_AUTO_CREATE=true
EPSS_THRESHOLD_AUTO_CREATE=0.7
CVSS_THRESHOLD_CRITICAL=9.0

# === LLM Configuration ===
TI_LLM_MODEL=@cf/meta/llama-3.1-8b-instruct
TI_LLM_MAX_TOKENS=2048
TI_ENABLE_AI_ENRICHMENT=true

# === Notification Configuration ===
TI_ALERT_WEBHOOK_URL=https://your-slack-webhook.com
TI_EMAIL_NOTIFICATIONS=admin@yourcompany.com
TI_CRITICAL_ALERT_THRESHOLD=critical
```

### **Deployment Configuration**

```javascript
// ecosystem.config.cjs - Updated for TI processing
module.exports = {
  apps: [
    {
      name: 'ARIA5-TI-Enhanced',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=ARIA5-Ubuntu-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        TI_PROCESSING_ENABLED: 'true'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'TI-Feed-Processor',
      script: 'dist/ti-processor.js',
      env: {
        NODE_ENV: 'production',
        TI_MODE: 'processor'
      },
      cron_restart: '0 */2 * * *',  // Restart every 2 hours
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
```

---

## 📊 Implementation Timeline & Milestones

### **Week 1: Foundation**
- **Days 1-2**: Dynamic Risk Lifecycle (Phase 1)
- **Days 3-4**: TI Data Ingestion Pipeline (Phase 2) 
- **Days 5-7**: Core LLM Functions (Phase 3)

**Milestone 1**: ✅ Auto-generate risks from CISA KEV with AI enrichment

### **Week 2: Integration**  
- **Days 8-10**: TI → GRC Mapping Engine (Phase 4)
- **Days 11-12**: Tiered Integration Model (Phase 5)
- **Days 13-14**: Testing & Bug fixes

**Milestone 2**: ✅ Complete TI → Risk → Framework mapping workflow

### **Week 3: Advanced Features**
- **Days 15-18**: TI-Driven Dashboards (Phase 6)
- **Days 19-21**: Automated Reporting & Analytics

**Milestone 3**: ✅ Full TI enhancement suite operational

### **Success Criteria**
- [ ] CISA KEV vulnerabilities auto-create risks within 5 minutes
- [ ] 8+ OSINT feeds actively processing with 99% uptime
- [ ] AI enrichment applied to 100% of dynamic risks
- [ ] Dynamic risk state transitions working automatically
- [ ] Executive TI reports generating weekly
- [ ] Vendor risk scores updated with TI context
- [ ] Framework mappings (NIST, MITRE) automatically generated

---

## 🔧 Testing & Validation Plan

### **Unit Testing**
```typescript
// tests/dynamic-risk.test.ts
describe('Dynamic Risk Manager', () => {
  test('creates risk from CISA KEV data', async () => {
    const cisaData = mockCISAKEVEntry();
    const risk = await dynamicRiskManager.createDynamicRisk(cisaData);
    
    expect(risk.source_type).toBe('Dynamic-TI');
    expect(risk.dynamic_state).toBe('draft');
    expect(risk.confidence_score).toBeGreaterThan(0.9);
  });
  
  test('transitions risk states correctly', async () => {
    const risk = await createMockDynamicRisk();
    await dynamicRiskManager.transitionRiskState(
      risk.id, 
      DynamicRiskState.VALIDATED,
      'Test validation'
    );
    
    const updatedRisk = await getRiskById(risk.id);
    expect(updatedRisk.dynamic_state).toBe('validated');
  });
});
```

### **Integration Testing**
```typescript
// tests/ti-integration.test.ts
describe('TI Integration Pipeline', () => {
  test('end-to-end CISA KEV to risk creation', async () => {
    // 1. Mock CISA KEV feed response
    const mockFeedData = mockCISAKEVResponse();
    
    // 2. Process through ingestion pipeline
    await tiIngestionPipeline.processFeedData('cisa-kev', mockFeedData);
    
    // 3. Verify risk creation
    const risks = await getDynamicRisks({ source: 'cisa-kev' });
    expect(risks.length).toBeGreaterThan(0);
    
    // 4. Verify AI enrichment
    const risk = risks[0];
    expect(risk.llm_summary).toBeDefined();
    expect(risk.framework_mappings).toBeDefined();
  });
});
```

### **Performance Testing**
- Test feed processing with 10,000+ indicators
- Validate risk creation under load (100 concurrent requests)
- Measure AI enrichment response times (<5s target)
- Test database performance with large TI datasets

---

## 📈 Monitoring & Observability

### **Key Metrics to Track**
```typescript
// TI Enhancement KPIs
const tiMetrics = {
  // Processing Metrics  
  feedProcessingSuccess: 'percentage of successful feed syncs',
  avgProcessingTime: 'average time to process feed data',
  indicatorsProcessedPerHour: 'TI data throughput',
  
  // Risk Creation Metrics
  risksCreatedFromTI: 'auto-generated risks per day',
  timeToRiskCreation: 'detection to draft risk time',
  riskValidationRate: 'percentage of draft risks validated',
  falsePositiveRate: 'invalid risks created',
  
  // AI Enhancement Metrics
  aiEnrichmentSuccess: 'percentage of successful AI enrichments', 
  avgEnrichmentTime: 'LLM response time for enrichment',
  aiAccuracyScore: 'human validation of AI suggestions',
  
  // Business Impact Metrics
  criticalRisksIdentified: 'high-impact risks from TI',
  mttr: 'mean time to risk resolution',
  complianceFrameworkCoverage: 'percentage of risks mapped to frameworks'
};
```

### **Alerting Configuration**
```typescript
// Monitoring alerts for TI enhancement
const tiAlerts = [
  {
    name: 'Feed Processing Failure',
    condition: 'feedProcessingSuccess < 95%',
    severity: 'critical',
    notification: ['slack', 'email']
  },
  {
    name: 'High Risk Creation Rate', 
    condition: 'risksCreatedFromTI > maxRisksPerDay',
    severity: 'warning',
    notification: ['slack']
  },
  {
    name: 'AI Enrichment Failure',
    condition: 'aiEnrichmentSuccess < 90%',
    severity: 'high', 
    notification: ['email']
  }
];
```

---

## 🔐 Security & Compliance Considerations

### **Data Privacy & Protection**
- **API Key Management**: Secure storage of TI feed API keys in Cloudflare secrets
- **Data Encryption**: Encrypt TI data at rest and in transit
- **Access Controls**: Role-based access to TI data and dynamic risks
- **Audit Logging**: Complete audit trail for all TI processing activities

### **Compliance Alignment**
- **SOC 2 Type II**: Implement controls for TI data processing and storage
- **ISO 27001**: Map TI enhancement to information security controls
- **GDPR**: Ensure TI data processing complies with data protection regulations
- **Industry Standards**: Align with NIST Cybersecurity Framework requirements

### **Operational Security**
- **Rate Limiting**: Implement proper rate limits for TI API calls
- **Input Validation**: Validate all TI feed data before processing
- **Sandboxing**: Isolate TI processing from core application
- **Backup & Recovery**: Implement backup procedures for TI databases

---

## 📋 Risk Assessment for Implementation

### **Technical Risks**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API Rate Limits | Medium | High | Implement intelligent rate limiting and caching |
| AI/LLM Failures | Low | Medium | Fallback to rule-based processing |
| Database Performance | Medium | High | Optimize queries, implement caching |
| Feed Data Quality | High | Medium | Implement data validation and cleansing |

### **Business Risks**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| False Positive Risks | Medium | Medium | Human validation workflow for critical risks |
| Alert Fatigue | High | Medium | Intelligent filtering and prioritization |
| Compliance Gaps | Low | High | Regular compliance review and mapping |
| Operational Overhead | Medium | Low | Automation and monitoring dashboards |

---

## 🎯 Success Metrics & KPIs

### **Immediate Success Indicators (Week 1)**
- [ ] CISA KEV feed processing operational
- [ ] First auto-generated risk created and validated  
- [ ] AI enrichment functional for risk entries
- [ ] Dynamic risk state transitions working

### **Short-term Goals (Month 1)**
- [ ] 8+ OSINT feeds processing regularly
- [ ] 50+ dynamic risks created and managed
- [ ] 95%+ feed processing success rate
- [ ] <5 minute detection-to-risk creation time

### **Long-term Objectives (Month 3)** 
- [ ] Tier 2 premium feeds integrated
- [ ] 90%+ risk validation accuracy
- [ ] Automated executive reporting operational
- [ ] Full compliance framework integration
- [ ] Measurable reduction in security incidents

---

## 📝 Next Steps & Implementation Order

### **Immediate Actions (This Week)**
1. **Set up development environment** for TI enhancement
2. **Implement Phase 1**: Dynamic Risk Lifecycle foundation
3. **Create database schema updates** 
4. **Build core API endpoints** for dynamic risk management

### **Priority Implementation Sequence**
1. **Phase 1**: Dynamic Risk Lifecycle ⚡ (CRITICAL)
2. **Phase 2**: TI Data Ingestion Pipeline ⚡ (CRITICAL)
3. **Phase 3**: Required LLM Functions ⚡ (HIGH)
4. **Phase 4**: TI → GRC Mapping Engine (HIGH)
5. **Phase 5**: Tiered Integration Model (MEDIUM)
6. **Phase 6**: Advanced Features & Dashboards (LOW)

### **Decision Points**
- **API Key Procurement**: Determine which premium TI feeds to integrate
- **Tier Selection**: Choose initial tier (recommend Tier 1 for MVP)
- **Resource Allocation**: Assign development resources and timeline
- **Testing Strategy**: Define acceptance criteria and validation methods

---

## 📞 Implementation Support

This implementation plan provides the roadmap to achieve 100% alignment with the original TI enhancement requirements. The plan prioritizes the most critical gaps (Dynamic Risk Lifecycle, Active Data Ingestion, LLM Functions) while providing a clear path to full implementation.

**Ready to begin implementation?** 

The next step is to start with Phase 1 (Dynamic Risk Lifecycle) as it forms the foundation for all other TI enhancement features. This will immediately provide value by enabling automatic risk creation from threat intelligence sources.

Would you like me to begin implementing Phase 1, or do you have questions about any specific aspect of this plan?

---

*This document serves as the master implementation guide for ARIA5 Threat Intelligence Enhancement. All development work should reference and update this plan to ensure alignment with original requirements and project objectives.*