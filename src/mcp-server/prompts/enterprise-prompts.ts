/**
 * ARIA 5.1 MCP Enterprise Prompts
 * 
 * Comprehensive prompt templates for enterprise security intelligence,
 * risk analysis, compliance reporting, and threat hunting.
 * 
 * Phase 4.1 Implementation
 */

import type { MCPPrompt } from '../types/mcp-types';

/**
 * Risk Analysis Prompts
 */
export const riskAnalysisPrompts: MCPPrompt[] = [
  {
    name: 'analyze_risk_comprehensive',
    description: 'Comprehensive risk analysis with full platform context',
    arguments: [
      { name: 'risk_id', description: 'Risk ID to analyze', required: true, type: 'number' },
      { name: 'include_mitigations', description: 'Include mitigation strategies', required: false, type: 'boolean' },
      { name: 'include_trends', description: 'Include historical trends', required: false, type: 'boolean' }
    ],
    template: (args) => {
      const basePrompt = `Analyze risk ID ${args.risk_id} with comprehensive platform context including:
- Current risk status, probability, and impact
- Related threats and recent incidents
- Applicable compliance controls and gaps
- Asset exposure and dependencies`;
      
      const mitigations = args.include_mitigations ? '\n- Recommended mitigation strategies and controls' : '';
      const trends = args.include_trends ? '\n- Historical trends and pattern analysis' : '';
      
      return basePrompt + mitigations + trends + '\n\nProvide actionable recommendations prioritized by effectiveness and cost.';
    }
  },
  
  {
    name: 'risk_portfolio_assessment',
    description: 'Assess entire risk portfolio for executive reporting',
    arguments: [
      { name: 'time_period', description: 'Assessment period (30d, 90d, 1y)', required: false, type: 'string' },
      { name: 'risk_categories', description: 'Specific categories to analyze', required: false, type: 'array' }
    ],
    template: (args) => {
      const period = args.time_period || '90d';
      const categories = args.risk_categories?.length ? ` focusing on categories: ${args.risk_categories.join(', ')}` : '';
      
      return `Provide executive risk portfolio assessment for the last ${period}${categories}.

Include:
1. Risk heat map by category and severity
2. Top 10 critical risks requiring immediate attention
3. Risk trend analysis (increasing, stable, decreasing)
4. Key risk indicators (KRIs) status
5. Compliance exposure summary
6. Resource allocation recommendations

Format: Executive summary suitable for board presentation.`;
    }
  },
  
  {
    name: 'risk_scenario_modeling',
    description: 'Model risk scenarios with impact analysis',
    arguments: [
      { name: 'scenario_type', description: 'Scenario type (worst_case, best_case, likely)', required: true, type: 'string' },
      { name: 'risk_ids', description: 'Risk IDs to include in scenario', required: true, type: 'array' },
      { name: 'business_context', description: 'Business context and constraints', required: false, type: 'string' }
    ],
    template: (args) => {
      const context = args.business_context ? `\n\nBusiness Context: ${args.business_context}` : '';
      
      return `Model ${args.scenario_type} scenario for risks: ${args.risk_ids.join(', ')}.${context}

Analyze:
1. Combined likelihood of scenario occurrence
2. Cascading effects and dependencies
3. Financial impact estimate (direct + indirect costs)
4. Operational impact (downtime, productivity loss)
5. Reputational and regulatory consequences
6. Recovery time objectives (RTO/RPO)
7. Mitigation strategies to prevent scenario

Provide quantitative estimates where possible.`;
    }
  }
];

/**
 * Compliance & Audit Prompts
 */
export const compliancePrompts: MCPPrompt[] = [
  {
    name: 'compliance_gap_report',
    description: 'Generate comprehensive compliance gap analysis report',
    arguments: [
      { name: 'framework', description: 'Compliance framework (NIST-CSF, ISO-27001, SOC2, GDPR)', required: true, type: 'string' },
      { name: 'scope', description: 'Scope (organization, department, system)', required: false, type: 'string' },
      { name: 'remediation_priority', description: 'Prioritize by risk or cost', required: false, type: 'string' }
    ],
    template: (args) => {
      const scope = args.scope ? ` for scope: ${args.scope}` : '';
      const priority = args.remediation_priority || 'risk';
      
      return `Generate detailed compliance gap analysis for ${args.framework}${scope}.

Report Structure:
1. Executive Summary
   - Overall compliance score (%)
   - Critical gaps requiring immediate action
   - Estimated remediation timeline and cost

2. Detailed Gap Analysis
   - Control-by-control assessment
   - Current maturity level vs. target
   - Evidence requirements and current state
   - Risk exposure for each gap

3. Remediation Roadmap
   - Prioritized by ${priority}
   - Quick wins (0-30 days)
   - Medium-term initiatives (1-6 months)
   - Long-term strategic projects (6-12 months)

4. Resource Requirements
   - Budget estimates
   - Personnel needs
   - Technology investments

Include specific control references and actionable recommendations.`;
    }
  },
  
  {
    name: 'audit_readiness_assessment',
    description: 'Assess readiness for compliance audit',
    arguments: [
      { name: 'audit_type', description: 'Audit type (internal, external, certification)', required: true, type: 'string' },
      { name: 'audit_date', description: 'Scheduled audit date', required: true, type: 'string' },
      { name: 'frameworks', description: 'Frameworks in scope', required: true, type: 'array' }
    ],
    template: (args) => {
      return `Assess audit readiness for ${args.audit_type} audit scheduled for ${args.audit_date}.

Frameworks in scope: ${args.frameworks.join(', ')}

Assessment Areas:
1. Documentation Completeness
   - Policies and procedures current and approved
   - Evidence artifacts organized and accessible
   - Change logs and version control

2. Control Effectiveness
   - Operating effectiveness test results
   - Exception documentation and remediation
   - Continuous monitoring evidence

3. Gap Remediation Status
   - Outstanding gaps from previous audit
   - Current remediation progress
   - Timeline to closure

4. Stakeholder Readiness
   - Interview preparation status
   - Roles and responsibilities clarity
   - Communication plan

5. Technical Readiness
   - System access for auditors
   - Data extraction capabilities
   - Security and privacy controls

Provide Go/No-Go recommendation with risk assessment.`;
    }
  },
  
  {
    name: 'control_effectiveness_review',
    description: 'Review control effectiveness across domains',
    arguments: [
      { name: 'control_domain', description: 'Control domain (access, encryption, monitoring)', required: false, type: 'string' },
      { name: 'review_period', description: 'Review period', required: false, type: 'string' }
    ],
    template: (args) => {
      const domain = args.control_domain ? ` for ${args.control_domain} domain` : ' across all domains';
      const period = args.review_period || 'last 90 days';
      
      return `Review control effectiveness${domain} over ${period}.

Analysis Framework:
1. Control Design Assessment
   - Design adequacy to mitigate stated risks
   - Control rationalization opportunities
   - Redundancy and overlap analysis

2. Operating Effectiveness
   - Test results and exception rates
   - Automation vs. manual controls
   - Frequency and timeliness metrics

3. Performance Metrics
   - KPIs and KRIs for each control
   - Trend analysis (improving, stable, degrading)
   - Benchmark against industry standards

4. Maturity Assessment
   - Current maturity level (1-5)
   - Gaps to target maturity
   - Improvement initiatives

5. Cost-Effectiveness
   - Control cost vs. risk reduction
   - Optimization opportunities
   - Automation candidates

Provide maturity scores and improvement roadmap.`;
    }
  }
];

/**
 * Threat Intelligence & Hunting Prompts
 */
export const threatPrompts: MCPPrompt[] = [
  {
    name: 'threat_hunt_campaign',
    description: 'Design threat hunting campaign based on intelligence',
    arguments: [
      { name: 'threat_actor', description: 'Known threat actor or group', required: false, type: 'string' },
      { name: 'attack_vector', description: 'Primary attack vector', required: false, type: 'string' },
      { name: 'asset_scope', description: 'Assets in scope', required: false, type: 'array' }
    ],
    template: (args) => {
      const actor = args.threat_actor ? `\nThreat Actor: ${args.threat_actor}` : '';
      const vector = args.attack_vector ? `\nAttack Vector: ${args.attack_vector}` : '';
      const assets = args.asset_scope?.length ? `\nAssets in Scope: ${args.asset_scope.join(', ')}` : '';
      
      return `Design comprehensive threat hunting campaign.${actor}${vector}${assets}

Campaign Structure:
1. Hypothesis Development
   - Threat hypothesis based on current intelligence
   - Indicators of Compromise (IOCs) to hunt
   - Tactics, Techniques, and Procedures (TTPs) from MITRE ATT&CK

2. Data Sources
   - Required log sources and telemetry
   - SIEM queries and correlation rules
   - EDR/XDR hunt queries

3. Hunting Methodology
   - Stack ranking of hypotheses by risk
   - Query sequence and logic flow
   - Baseline vs. anomaly detection approach

4. Success Criteria
   - Detection indicators
   - False positive filtering
   - Escalation thresholds

5. Response Playbook
   - Confirmation steps if threats found
   - Containment and remediation procedures
   - Communication and escalation paths

Provide actionable hunt queries and expected outcomes.`;
    }
  },
  
  {
    name: 'incident_pattern_analysis',
    description: 'Analyze incident patterns for proactive defense',
    arguments: [
      { name: 'time_window', description: 'Analysis time window', required: false, type: 'string' },
      { name: 'incident_types', description: 'Incident types to analyze', required: false, type: 'array' }
    ],
    template: (args) => {
      const window = args.time_window || '90 days';
      const types = args.incident_types?.length ? ` focusing on: ${args.incident_types.join(', ')}` : '';
      
      return `Analyze incident patterns over ${window}${types}.

Pattern Analysis:
1. Temporal Patterns
   - Time-of-day distribution
   - Day-of-week patterns
   - Seasonal trends
   - Attack timing correlation

2. Attack Patterns
   - Common attack chains and kill chains
   - Privilege escalation patterns
   - Lateral movement techniques
   - Data exfiltration methods

3. Target Analysis
   - Most targeted assets and systems
   - User groups at highest risk
   - Geographic patterns
   - Business impact distribution

4. Root Cause Analysis
   - Common vulnerabilities exploited
   - Configuration weaknesses
   - Process gaps
   - Human factors

5. Effectiveness Assessment
   - Detection time trends
   - Response time improvements
   - Containment effectiveness
   - Recurrence rates

Provide proactive defense recommendations based on patterns.`;
    }
  },
  
  {
    name: 'threat_landscape_report',
    description: 'Generate threat landscape report for executives',
    arguments: [
      { name: 'industry_focus', description: 'Industry vertical', required: false, type: 'string' },
      { name: 'geographic_region', description: 'Geographic focus', required: false, type: 'string' }
    ],
    template: (args) => {
      const industry = args.industry_focus ? `\nIndustry Focus: ${args.industry_focus}` : '';
      const region = args.geographic_region ? `\nGeographic Region: ${args.geographic_region}` : '';
      
      return `Generate executive threat landscape report.${industry}${region}

Report Sections:
1. Current Threat Environment
   - Active threat actors and campaigns
   - Emerging attack techniques
   - Zero-day vulnerabilities
   - Supply chain threats

2. Industry-Specific Threats
   - Targeted attacks in our sector
   - Regulatory compliance risks
   - Industry-specific vulnerabilities
   - Competitor incidents and lessons learned

3. Our Exposure Assessment
   - Attack surface analysis
   - Vulnerable assets and systems
   - High-value target identification
   - Gap in defenses

4. Threat Trend Analysis
   - Year-over-year comparison
   - Emerging threat vectors
   - Attack sophistication trends
   - Financial impact trends

5. Strategic Recommendations
   - Investment priorities
   - Technology enhancements
   - Process improvements
   - Training and awareness needs

Format for C-suite consumption with executive summary.`;
    }
  }
];

/**
 * Incident Response Prompts
 */
export const incidentResponsePrompts: MCPPrompt[] = [
  {
    name: 'incident_response_playbook',
    description: 'Generate incident response playbook for scenario',
    arguments: [
      { name: 'incident_type', description: 'Incident type (ransomware, breach, DDoS)', required: true, type: 'string' },
      { name: 'severity_level', description: 'Severity (critical, high, medium, low)', required: true, type: 'string' },
      { name: 'affected_systems', description: 'Systems affected', required: false, type: 'array' }
    ],
    template: (args) => {
      const systems = args.affected_systems?.length ? `\nAffected Systems: ${args.affected_systems.join(', ')}` : '';
      
      return `Generate incident response playbook for ${args.incident_type} incident (Severity: ${args.severity_level}).${systems}

Playbook Structure:
1. Initial Response (First 15 minutes)
   - Incident confirmation steps
   - Initial containment actions
   - Stakeholder notification (who, when, how)
   - Evidence preservation

2. Investigation Phase
   - Forensic data collection checklist
   - Log analysis procedures
   - Scope determination methods
   - Root cause analysis approach

3. Containment Strategy
   - Short-term containment (immediate)
   - Long-term containment (permanent fix)
   - System isolation procedures
   - Communication blackout protocols

4. Eradication Procedures
   - Threat removal steps
   - Vulnerability remediation
   - System hardening measures
   - Credential rotation

5. Recovery Process
   - System restoration priorities
   - Validation and testing
   - Monitoring enhancement
   - Return to normal operations criteria

6. Post-Incident Activities
   - Lessons learned session format
   - Documentation requirements
   - Improvement recommendations
   - Regulatory reporting obligations

Include specific commands, tools, and decision trees.`;
    }
  },
  
  {
    name: 'post_incident_review',
    description: 'Conduct post-incident review and lessons learned',
    arguments: [
      { name: 'incident_id', description: 'Incident ID to review', required: true, type: 'string' },
      { name: 'include_timeline', description: 'Include detailed timeline', required: false, type: 'boolean' }
    ],
    template: (args) => {
      const timeline = args.include_timeline ? '\n- Detailed timeline of events and actions' : '';
      
      return `Conduct comprehensive post-incident review for incident ${args.incident_id}.

Review Framework:
1. Incident Summary
   - What happened (attack vector, technique, impact)
   - When discovered and by whom
   - Scope and affected assets${timeline}

2. Response Effectiveness
   - Detection time (dwell time analysis)
   - Response time to containment
   - Eradication effectiveness
   - Recovery time and completeness
   - Communication effectiveness

3. Root Cause Analysis
   - Technical root causes
   - Process failures
   - Human factors
   - Control gaps exploited

4. What Went Well
   - Effective controls and detections
   - Successful response actions
   - Team collaboration highlights
   - Tools that performed well

5. Areas for Improvement
   - Missed detection opportunities
   - Response delays and bottlenecks
   - Communication breakdowns
   - Tool limitations

6. Action Items
   - Technical improvements (specific changes)
   - Process enhancements (policy updates)
   - Training needs identified
   - Tool acquisitions or upgrades
   - Responsibility assignments and deadlines

7. Metrics and KPIs
   - Update incident response metrics
   - Cost impact calculation
   - Regulatory reporting status
   - Insurance claim information

Format: Blameless retrospective focused on systemic improvements.`;
    }
  }
];

/**
 * Asset & Vulnerability Management Prompts
 */
export const assetPrompts: MCPPrompt[] = [
  {
    name: 'vulnerability_prioritization',
    description: 'Prioritize vulnerabilities based on risk context',
    arguments: [
      { name: 'vulnerability_source', description: 'Source (scan, pentest, disclosure)', required: false, type: 'string' },
      { name: 'asset_criticality', description: 'Filter by asset criticality', required: false, type: 'string' }
    ],
    template: (args) => {
      const source = args.vulnerability_source ? `\nSource: ${args.vulnerability_source}` : '';
      const criticality = args.asset_criticality ? `\nAsset Criticality: ${args.asset_criticality}` : '';
      
      return `Prioritize vulnerabilities for remediation using risk-based approach.${source}${criticality}

Prioritization Factors:
1. Exploitability Assessment
   - CVSS score and vector
   - Public exploit availability
   - Exploit complexity and prerequisites
   - Active exploitation in the wild

2. Asset Context
   - Asset criticality and business value
   - Exposure (internet-facing, internal)
   - Data sensitivity on affected systems
   - Compliance requirements

3. Threat Intelligence
   - Known threat actor interest
   - Ransomware group targeting
   - APT campaign relevance
   - Industry-specific threats

4. Compensating Controls
   - Existing control effectiveness
   - Defense-in-depth layers
   - Monitoring and detection capability
   - Mitigation difficulty and cost

5. Business Impact
   - Service disruption risk
   - Data breach consequences
   - Regulatory penalties
   - Reputational damage

Output Format:
- Priority 1 (Critical): Remediate in 7 days
- Priority 2 (High): Remediate in 30 days
- Priority 3 (Medium): Remediate in 90 days
- Priority 4 (Low): Remediate in 180 days

Include specific remediation guidance and workarounds.`;
    }
  },
  
  {
    name: 'asset_risk_profile',
    description: 'Generate comprehensive risk profile for asset',
    arguments: [
      { name: 'asset_id', description: 'Asset ID', required: true, type: 'string' },
      { name: 'include_dependencies', description: 'Include dependency analysis', required: false, type: 'boolean' }
    ],
    template: (args) => {
      const dependencies = args.include_dependencies ? '\n- Dependency mapping and cascade risk analysis' : '';
      
      return `Generate comprehensive risk profile for asset ${args.asset_id}.

Risk Profile Components:
1. Asset Classification
   - Asset type and criticality
   - Business function supported
   - Data classification hosted
   - Compliance scope

2. Threat Exposure
   - Current vulnerability count by severity
   - Historical incident involvement
   - Threat actor interest level
   - Attack surface area

3. Security Posture
   - Security control coverage
   - Configuration compliance
   - Patch currency status
   - Security tool coverage (AV, EDR, etc.)

4. Risk Metrics
   - Calculated risk score
   - Risk trend (improving/degrading)
   - Comparison to peer assets
   - Risk velocity (rate of change)${dependencies}

5. Recommended Actions
   - Priority remediation items
   - Control enhancements
   - Monitoring improvements
   - Architecture changes

Provide risk score with supporting evidence and trend analysis.`;
    }
  }
];

/**
 * Security Metrics & Reporting Prompts
 */
export const metricsPrompts: MCPPrompt[] = [
  {
    name: 'security_metrics_dashboard',
    description: 'Generate security metrics executive dashboard',
    arguments: [
      { name: 'reporting_period', description: 'Reporting period', required: false, type: 'string' },
      { name: 'metric_categories', description: 'Metric categories to include', required: false, type: 'array' }
    ],
    template: (args) => {
      const period = args.reporting_period || 'monthly';
      const categories = args.metric_categories?.length ? ` focusing on: ${args.metric_categories.join(', ')}` : '';
      
      return `Generate executive security metrics dashboard for ${period} reporting${categories}.

Dashboard Sections:
1. Security Posture Overview
   - Overall security score (0-100)
   - Trend vs. previous period
   - Key achievements
   - Critical concerns

2. Risk Metrics
   - Open risks by severity (Critical/High/Medium/Low)
   - Risk velocity (new, closed, changed)
   - Risk appetite vs. actual exposure
   - Top 5 risks by business impact

3. Incident Metrics
   - Incident count and severity distribution
   - Mean time to detect (MTTD)
   - Mean time to respond (MTTR)
   - Mean time to recover (MTTR)
   - Incident cost impact

4. Vulnerability Management
   - Open vulnerabilities by severity
   - Patch compliance rate
   - Average time to remediate
   - Vulnerability reduction trend

5. Compliance Status
   - Framework compliance scores
   - Control effectiveness ratings
   - Audit findings status
   - Regulatory examination readiness

6. Security Operations
   - Security tool coverage
   - Alert volume and false positive rate
   - Automation percentage
   - Team capacity utilization

7. Investment & ROI
   - Security spending vs. budget
   - Risk reduction achieved
   - Incident cost avoidance
   - Efficiency improvements

Format: Executive-ready with traffic light indicators and trends.`;
    }
  },
  
  {
    name: 'board_security_report',
    description: 'Generate board-level security report',
    arguments: [
      { name: 'quarter', description: 'Reporting quarter', required: true, type: 'string' },
      { name: 'strategic_initiatives', description: 'Strategic initiatives to highlight', required: false, type: 'array' }
    ],
    template: (args) => {
      const initiatives = args.strategic_initiatives?.length ? `\n\nStrategic Initiatives: ${args.strategic_initiatives.join(', ')}` : '';
      
      return `Generate board-level security report for ${args.quarter}.${initiatives}

Report Structure (Maximum 5 pages):

1. Executive Summary (0.5 page)
   - Overall security posture rating
   - Key accomplishments this quarter
   - Critical risks requiring board awareness
   - Strategic recommendations

2. Cyber Risk Landscape (1 page)
   - Industry threat environment
   - Our risk exposure vs. peers
   - Recent material incidents (internal/industry)
   - Regulatory landscape changes

3. Security Program Performance (1.5 pages)
   - Risk reduction achievements
   - Compliance status (SOC2, ISO, GDPR, etc.)
   - Incident response effectiveness
   - Investment vs. outcomes
   - Program maturity advancement

4. Strategic Initiatives Update (1 page)
   - Zero Trust implementation status
   - Cloud security posture
   - Third-party risk program
   - Security awareness training
   - Other strategic projects

5. Forward-Looking View (1 page)
   - Next quarter priorities
   - Emerging risks and opportunities
   - Investment requirements
   - Board decisions needed
   - Success metrics

Tone: Strategic, risk-focused, business-outcome oriented.
Avoid: Technical jargon, operational details, tool names.
Include: Benchmarks, peer comparisons, industry context.`;
    }
  }
];

/**
 * All Enterprise Prompts Collection
 */
export const allEnterprisePrompts: MCPPrompt[] = [
  ...riskAnalysisPrompts,
  ...compliancePrompts,
  ...threatPrompts,
  ...incidentResponsePrompts,
  ...assetPrompts,
  ...metricsPrompts
];

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: string): MCPPrompt[] {
  switch (category.toLowerCase()) {
    case 'risk':
    case 'risk_analysis':
      return riskAnalysisPrompts;
    case 'compliance':
    case 'audit':
      return compliancePrompts;
    case 'threat':
    case 'threat_intelligence':
      return threatPrompts;
    case 'incident':
    case 'incident_response':
      return incidentResponsePrompts;
    case 'asset':
    case 'vulnerability':
      return assetPrompts;
    case 'metrics':
    case 'reporting':
      return metricsPrompts;
    default:
      return allEnterprisePrompts;
  }
}

/**
 * Get prompt by name
 */
export function getPromptByName(name: string): MCPPrompt | undefined {
  return allEnterprisePrompts.find(p => p.name === name);
}

/**
 * Export prompt statistics
 */
export const promptStats = {
  total: allEnterprisePrompts.length,
  byCategory: {
    riskAnalysis: riskAnalysisPrompts.length,
    compliance: compliancePrompts.length,
    threat: threatPrompts.length,
    incidentResponse: incidentResponsePrompts.length,
    asset: assetPrompts.length,
    metrics: metricsPrompts.length
  }
};
