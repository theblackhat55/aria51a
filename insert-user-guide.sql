
INSERT OR REPLACE INTO rag_documents (
  title, 
  content, 
  file_path, 
  document_type, 
  embedding_status, 
  chunk_count,
  metadata,
  uploaded_by,
  organization_id
) VALUES (
  'ARIA5.1 Platform User Guide',
  '# ARIA5.1 Enterprise Platform - Complete User Guide

**Version**: 5.1.0  
**Document Version**: 1.0  
**Last Updated**: December 8, 2024  
**Platform URL**: https://aria51.pages.dev

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Getting Started](#getting-started)
3. [AI/ML Rating Systems](#aiml-rating-systems)
4. [Core Modules](#core-modules)
5. [AI Assistant (ARIA)](#ai-assistant-aria)
6. [Risk Management](#risk-management)
7. [Threat Intelligence](#threat-intelligence)
8. [Compliance Management](#compliance-management)
9. [Operations Center](#operations-center)
10. [Admin & Analytics](#admin-analytics)
11. [API Reference](#api-reference)
12. [Security & Best Practices](#security-best-practices)
13. [Troubleshooting](#troubleshooting)
14. [Appendices](#appendices)

---

## Platform Overview

### What is ARIA5.1?

ARIA5.1 is an enterprise-grade AI-powered risk intelligence and security management platform designed for comprehensive organizational security operations. Built on Cloudflare''s global edge network, it provides real-time threat intelligence, risk assessment, compliance management, and AI-driven analytics.

### Key Features

- **AI-Powered Risk Assessment**: Machine learning algorithms for dynamic risk scoring
- **Real-Time Threat Intelligence**: Multi-source feed integration with behavioral analytics
- **Compliance Automation**: Automated compliance monitoring for SOC 2, ISO 27001, NIST
- **Conversational AI Assistant**: Natural language interaction with platform data
- **Enterprise Security**: Role-based access, CSRF protection, secure authentication
- **Global Edge Deployment**: Sub-100ms response times worldwide via Cloudflare

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Hono Backend  │    │   Cloudflare    │
│   HTMX + JS     │◄──►│   TypeScript    │◄──►│   D1 Database   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Providers  │    │   Auth System   │    │   R2 Storage    │
│   Multi-LLM     │    │   JWT + RBAC    │    │   File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Getting Started

### System Requirements

- **Browser**: Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- **Network**: HTTPS connection required
- **Authentication**: Valid user account with appropriate role permissions

### User Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Administrator** | Full Platform | All modules, user management, system configuration |
| **Risk Manager** | Risk + Intelligence | Risk assessment, threat analysis, compliance viewing |
| **Compliance Officer** | Compliance + Reports | Compliance management, audit reports, control tracking |
| **Security Analyst** | Operations + Intelligence | Asset management, incident response, threat hunting |
| **Viewer** | Read-Only | Dashboard viewing, report access |

### Login Process

1. Navigate to platform URL: `https://aria51.pages.dev`
2. Click "Sign In" or access `/login`
3. Enter credentials or use demo accounts:
   - Admin: `admin` / `demo123`
   - Risk Manager: `avi_security` / `demo123`
   - Compliance Officer: `sjohnson` / `demo123`
4. Upon successful authentication, redirect to personalized dashboard

---

## AI/ML Rating Systems

### Overview

ARIA5.1 employs sophisticated AI and machine learning algorithms across multiple domains to provide intelligent, data-driven insights. All rating systems are designed to be transparent, auditable, and continuously improving.

### 1. Risk Scoring Algorithm

#### Dynamic Risk Calculation

**Formula**: `Risk Score = (Probability × Impact × Threat Context × Business Criticality) / Mitigation Effectiveness`

**Components**:

- **Probability (0-100)**: Likelihood of risk occurrence
  - Historical data analysis
  - Industry trend correlation
  - Environmental factor assessment
  
- **Impact (0-100)**: Potential business impact
  - Financial loss estimation
  - Operational disruption assessment
  - Reputational damage scoring
  - Regulatory penalty calculation

- **Threat Context Multiplier (0.5-2.0)**: Real-time threat landscape
  - Current threat intelligence feeds
  - Behavioral anomaly detection
  - Campaign attribution confidence
  - IOC correlation strength

- **Business Criticality (0.5-2.0)**: Asset importance
  - Revenue impact weighting
  - Customer data sensitivity
  - System interdependencies
  - Recovery time objectives

- **Mitigation Effectiveness (0.1-1.0)**: Control strength
  - Implementation completeness
  - Control maturity assessment
  - Testing validation results
  - Continuous monitoring coverage

#### Risk Categories

| Score Range | Category | Color | Priority | Action Required |
|-------------|----------|-------|----------|----------------|
| 90-100 | **Critical** | 🔴 Red | P0 | Immediate (0-24h) |
| 70-89 | **High** | 🟠 Orange | P1 | Urgent (1-7 days) |
| 40-69 | **Medium** | 🟡 Yellow | P2 | Scheduled (1-4 weeks) |
| 0-39 | **Low** | 🟢 Green | P3 | Routine monitoring |

#### Machine Learning Enhancements

**Predictive Risk Modeling**:
- Trend analysis using historical risk patterns
- Seasonal risk fluctuation detection
- Industry benchmark comparison
- Emerging threat correlation

**Behavioral Analytics**:
- Anomaly detection in risk patterns
- Control effectiveness optimization
- Resource allocation recommendations
- Risk appetite calibration

### 2. Threat Intelligence Scoring

#### IOC Confidence Scoring

**Formula**: `Confidence = (Source Reliability × Attribution Strength × Temporal Relevance × Contextual Correlation)`

**Scoring Matrix**:

| Confidence | Range | Description | Action |
|------------|--------|-------------|--------|
| **High** | 80-100% | Multiple reliable sources, strong attribution | Block/Alert |
| **Medium** | 60-79% | Some validation, moderate attribution | Monitor closely |
| **Low** | 40-59% | Limited validation, weak attribution | Log for analysis |
| **Unverified** | 0-39% | Single source, no validation | Research needed |

#### Source Reliability Ratings

| Source Type | Base Reliability | Adjustment Factors |
|-------------|------------------|-------------------|
| Government Feeds (CISA) | 95% | Timeliness, specificity |
| Commercial TI Vendors | 85% | Track record, validation |
| Open Source (OTX) | 70% | Community validation, age |
| Internal Detection | 90% | Context accuracy, false positives |
| Third-party Reports | 65% | Reputation, verification |

#### Campaign Attribution Confidence

**Attribution Scoring Factors**:
- **TTPs Overlap (30%)**: Tactics, techniques, procedures similarity
- **Infrastructure Reuse (25%)**: Domain/IP address patterns
- **Code Similarity (20%)**: Malware family connections
- **Timeline Correlation (15%)**: Attack sequence patterns
- **Victimology (10%)**: Target selection similarity

### 3. Compliance Scoring

#### Control Effectiveness Rating

**Formula**: `Effectiveness = (Implementation Score × Testing Results × Monitoring Coverage × Maturity Level)`

**Implementation Scoring**:
- **Implemented (100%)**: Fully deployed and operational
- **Partially Implemented (60%)**: Core components active
- **Planned (20%)**: Design complete, deployment pending
- **Not Implemented (0%)**: No progress on control

**Testing Results Weight**:
- **Satisfactory (1.0)**: No deficiencies found
- **Minor Issues (0.8)**: Low-risk gaps identified
- **Major Issues (0.6)**: Significant deficiencies
- **Failed (0.3)**: Control not operating effectively

**Maturity Levels**:

| Level | Score | Description | Characteristics |
|-------|-------|-------------|----------------|
| **Optimized** | 100% | Continuous improvement | Automated, metrics-driven |
| **Managed** | 80% | Quantitatively managed | Measured, controlled |
| **Defined** | 60% | Standardized process | Documented, trained |
| **Repeatable** | 40% | Basic management | Some documentation |
| **Initial** | 20% | Ad hoc processes | Unpredictable, reactive |

#### Framework Coverage Scoring

**Supported Frameworks**:
- **SOC 2 Type II**: Service Organization Control 2
- **ISO 27001**: Information Security Management
- **NIST CSF**: Cybersecurity Framework
- **PCI DSS**: Payment Card Industry Data Security
- **GDPR**: General Data Protection Regulation
- **HIPAA**: Health Insurance Portability Act

**Coverage Calculation**:
```
Framework Coverage = (Applicable Controls Implemented / Total Applicable Controls) × 100%
```

### 4. Asset Criticality Rating

#### Business Impact Assessment

**Criticality Factors**:
- **Revenue Impact (30%)**: Direct revenue dependency
- **Data Sensitivity (25%)**: Type and volume of sensitive data
- **Operational Dependency (20%)**: Business process criticality
- **Customer Impact (15%)**: External customer effect
- **Regulatory Requirement (10%)**: Compliance obligations

#### CIA Rating System

**Confidentiality, Integrity, Availability Scoring**:

| Rating | Value | Confidentiality | Integrity | Availability |
|--------|-------|----------------|-----------|--------------|
| **Critical** | 5 | Top Secret/PCI | Financial systems | 24/7 operations |
| **High** | 4 | Confidential/PII | Customer data | Business hours |
| **Medium** | 3 | Internal use | Operational data | Standard SLA |
| **Low** | 2 | Public info | Reference data | Best effort |
| **Minimal** | 1 | Public domain | Archive data | No requirement |

### 5. Incident Severity Scoring

#### CVSS-Based Impact Assessment

**Base Score Components**:
- **Attack Vector (AV)**: Network, Adjacent, Local, Physical
- **Attack Complexity (AC)**: Low, High
- **Privileges Required (PR)**: None, Low, High
- **User Interaction (UI)**: None, Required
- **Scope (S)**: Unchanged, Changed
- **Impact Metrics (CIA)**: High, Low, None

**Temporal Score Modifiers**:
- **Exploit Code Maturity**: Not defined, Proof of concept, Functional, High
- **Remediation Level**: Official fix, Temporary fix, Workaround, Unavailable
- **Report Confidence**: Unknown, Reasonable, Confirmed

---

## Core Modules

### Dashboard Overview

The main dashboard provides real-time insights across all platform modules:

#### Key Metrics Display

**Risk Landscape Overview**:
- Total active risks with severity breakdown
- Risk trend analysis (7-day, 30-day)
- Top 5 critical risks requiring attention
- Risk score distribution histogram

**Threat Intelligence Summary**:
- Active IOCs with confidence levels
- Campaign attribution updates
- Feed synchronization status
- Behavioral anomaly alerts

**Compliance Posture**:
- Overall compliance percentage
- Framework-specific scores
- Upcoming audit deadlines
- Control gap analysis

**Operational Status**:
- Asset inventory summary
- Service availability metrics
- Incident response queue
- System health indicators

#### Interactive Elements

- **Quick Actions**: Rapid access to common tasks
- **Alert Center**: Real-time notifications and warnings
- **Search Global**: Platform-wide intelligent search
- **AI Assistant**: Conversational interface for queries

---

## AI Assistant (ARIA)

### Overview

ARIA (AI Risk Intelligence Assistant) is the platform''s conversational AI interface, powered by multiple LLM providers with intelligent routing for optimal performance and cost efficiency.

### AI Provider Stack

#### Multi-Provider Architecture

**Provider Priority (Automatic Failover)**:
1. **OpenAI GPT-4**: Primary provider for complex analysis
2. **Anthropic Claude**: Secondary for reasoning tasks
3. **Google Gemini**: Tertiary for general queries
4. **Azure AI Foundry**: Enterprise deployment option
5. **Cloudflare Llama3**: Always-available fallback (free)

#### Provider Selection Logic

```typescript
function selectProvider(query) {
  const complexity = analyzeQueryComplexity(query);
  const contextLength = getContextLength(query);
  const urgency = detectUrgency(query);
  
  if (complexity > 0.8 && OPENAI_AVAILABLE) return ''openai'';
  if (contextLength > 4000 && ANTHROPIC_AVAILABLE) return ''anthropic'';
  if (urgency === ''high'' && GOOGLE_AVAILABLE) return ''google'';
  return ''cloudflare''; // Always available fallback
}
```

### RAG (Retrieval-Augmented Generation)

#### Knowledge Base Integration

**Indexed Content Sources**:
- Platform documentation and user guides
- Risk assessment methodologies
- Compliance framework requirements
- Threat intelligence reports
- Historical incident data
- Best practice recommendations

**Vector Embedding Process**:
1. Document chunking (512-token segments)
2. Embedding generation (OpenAI text-embedding-3-small)
3. Vector storage in Cloudflare Vectorize
4. Semantic search with cosine similarity
5. Context ranking and selection

#### Query Processing Pipeline

```mermaid
graph LR
    A[User Query] --> B[Intent Analysis]
    B --> C[Context Retrieval]
    C --> D[Provider Selection]
    D --> E[LLM Generation]
    E --> F[Response Validation]
    F --> G[Formatted Output]
```

### Capabilities & Use Cases

#### Risk Analysis Queries

**Example Interactions**:
- "What are my top critical risks?"
- "Show risk trends for the past month"
- "Analyze risk distribution by category"
- "What mitigation strategies do you recommend?"

**ARIA Response Format**:
```
🎯 **Live Risk Analysis** (ML-Enhanced)

**Current Risk Landscape:**
• 0 CRITICAL risks requiring immediate attention
• 0 HIGH priority risks (ML confidence >85%)
• 0 MEDIUM risks monitored by behavioral analytics
• 8 LOW risks tracked for pattern evolution

**AI Risk Assessment:**
• Average Risk Score: 35/100
• Threat Posture: MANAGEABLE
• Platform Health: 78/100
• ML Prediction: Stable risk trajectory maintained
```

#### Threat Intelligence Queries

**Example Interactions**:
- "What threat campaigns are currently active?"
- "Analyze IOC confidence scores"
- "Show APT attribution analysis"
- "What are the latest threat patterns?"

#### Compliance Queries

**Example Interactions**:
- "What''s my SOC 2 compliance status?"
- "Show control gap analysis"
- "When is my next audit deadline?"
- "What compliance improvements do you recommend?"

### Advanced Features

#### Conversational Context

ARIA maintains conversation context for natural, flowing interactions:
- Previous query memory within session
- Follow-up question handling
- Clarification requests
- Progressive disclosure of information

#### Proactive Alerts

ARIA generates intelligent alerts based on:
- Anomaly detection in platform metrics
- Threshold breaches in risk scores
- Compliance deadline proximity
- Emerging threat intelligence

#### Multi-Modal Responses

Response formats adapt to query type:
- **Tabular Data**: Risk matrices, compliance scores
- **Visualizations**: Trend charts, distribution graphs
- **Action Lists**: Recommended next steps
- **Contextual Links**: Direct navigation to relevant modules

---

## Risk Management

### Risk Assessment Process

#### 1. Risk Identification

**Methods Supported**:
- **Asset-Based Assessment**: Systematic asset inventory review
- **Threat-Based Assessment**: Current threat landscape analysis
- **Vulnerability Assessment**: Technical and process gap identification
- **Scenario Planning**: "What-if" risk modeling

**Risk Categories**:
- **Cybersecurity**: Data breaches, malware, insider threats
- **Operational**: Process failures, supply chain disruptions
- **Financial**: Market volatility, credit risks, fraud
- **Regulatory**: Compliance violations, regulatory changes
- **Strategic**: Technology obsolescence, competitive threats
- **Reputational**: Public relations crises, stakeholder confidence

#### 2. Risk Analysis & Scoring

**Quantitative Analysis**:
- **Annual Loss Expectancy (ALE)**: Frequency × Impact
- **Single Loss Expectancy (SLE)**: Asset Value × Exposure Factor
- **Return on Security Investment (ROSI)**: Cost-benefit analysis

**Qualitative Analysis**:
- **Risk Heat Maps**: Visual probability/impact matrices
- **Expert Judgment**: SME input and validation
- **Historical Analysis**: Past incident correlation
- **Industry Benchmarking**: Peer comparison data

#### 3. Risk Treatment Strategies

**Treatment Options**:

| Strategy | Description | Use Cases | Cost Considerations |
|----------|-------------|-----------|-------------------|
| **Accept** | Acknowledge and monitor | Low-impact risks | Ongoing monitoring costs |
| **Avoid** | Eliminate risk source | High-impact, controllable | Opportunity costs |
| **Mitigate** | Reduce likelihood/impact | Most enterprise risks | Implementation and maintenance |
| **Transfer** | Insurance or outsourcing | Specialized risks | Premium and deductible costs |

### Risk Monitoring & Reporting

#### Real-Time Monitoring

**Automated Tracking**:
- Risk score recalculation (daily)
- Threat landscape correlation (real-time)
- Control effectiveness monitoring (continuous)
- Mitigation progress tracking (weekly)

**Dashboard Widgets**:
- Risk trend visualization
- Top risk alerts
- Risk appetite monitoring
- Risk register summary

#### Reporting Capabilities

**Executive Reports**:
- Risk posture summary
- Trend analysis and forecasting
- Compliance correlation
- Investment recommendations

**Operational Reports**:
- Detailed risk register
- Mitigation action plans
- Control effectiveness assessments
- Risk treatment tracking

---

## Threat Intelligence

### Intelligence Collection

#### Multi-Source Integration

**Primary Sources**:
- **CISA KEV (Known Exploited Vulnerabilities)**
- **MISP Communities**: Threat sharing platforms
- **OTX (Open Threat Exchange)**: AlienVault community
- **Commercial Feeds**: Vendor-specific intelligence
- **STIX/TAXII**: Structured threat information

**Collection Framework**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   External  │    │   Parsing   │    │ Enrichment  │
│   Sources   │───►│   & Norm.   │───►│ & Scoring   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    IOC      │    │   Campaign  │    │   Tactical  │
│ Management  │    │ Attribution │    │ Intelligence│
└─────────────┘    └─────────────┘    └─────────────┘
```

#### IOC Management

**Indicator Types Supported**:
- **File Hashes**: MD5, SHA1, SHA256, SHA512
- **Network Indicators**: IP addresses, domains, URLs
- **Registry Keys**: Windows registry modifications
- **Mutex Names**: Process synchronization objects
- **YARA Rules**: Malware detection signatures
- **Email Indicators**: Sender addresses, subjects, headers

**IOC Lifecycle Management**:
1. **Collection**: Automated ingestion from feeds
2. **Validation**: Source verification and deduplication
3. **Enrichment**: Context addition and correlation
4. **Distribution**: Internal sharing and alerting
5. **Aging**: Relevance decay and archival
6. **Feedback**: Effectiveness tracking and tuning

### Campaign Attribution

#### Attribution Methodology

**Analysis Framework**:
- **Diamond Model**: Adversary, Infrastructure, Capability, Victim
- **Kill Chain Analysis**: Attack progression mapping
- **TTP Correlation**: Behavioral pattern matching
- **Infrastructure Analysis**: Domain/IP relationship mapping

**Confidence Assessment**:

| Confidence Level | Criteria | Required Evidence |
|------------------|----------|-------------------|
| **High (80-100%)** | Multiple corroborating sources | 3+ independent confirmations |
| **Medium (60-79%)** | Some supporting evidence | 2 independent sources |
| **Low (40-59%)** | Limited evidence | Single source or weak correlation |
| **Speculation (0-39%)** | Hypothesis only | Insufficient evidence |

#### Threat Actor Profiling

**Actor Categories**:
- **Nation-State**: APT groups, government-sponsored
- **Cybercriminal**: Financially motivated groups
- **Hacktivist**: Ideologically motivated actors
- **Insider Threat**: Internal malicious actors
- **Script Kiddies**: Low-skill opportunistic actors

**Profiling Attributes**:
- **Motivation**: Financial, espionage, disruption, ideology
- **Sophistication**: Attack complexity and innovation level
- **Resources**: Funding, personnel, infrastructure access
- **Geography**: Operating region and time zones
- **Targets**: Industry focus and victim selection
- **TTPs**: Preferred techniques and tools

### Behavioral Analytics

#### Anomaly Detection

**ML Algorithms Used**:
- **Isolation Forest**: Outlier detection in high-dimensional data
- **LSTM Networks**: Time-series anomaly identification
- **Clustering**: Behavioral pattern grouping (K-means, DBSCAN)
- **Statistical Analysis**: Z-score and IQR-based detection

**Detection Domains**:
- **Network Traffic**: Communication pattern anomalies
- **User Behavior**: Access pattern deviations
- **System Activity**: Process and file system anomalies
- **Data Access**: Unusual data interaction patterns

#### Pattern Recognition

**Correlation Engine**:
```python
class ThreatCorrelationEngine:
    def correlate_indicators(self, iocs):
        # Temporal correlation
        temporal_clusters = self.find_temporal_patterns(iocs)
        
        # Infrastructure correlation  
        infra_clusters = self.analyze_infrastructure(iocs)
        
        # TTP correlation
        ttp_patterns = self.match_attack_patterns(iocs)
        
        # Generate attribution confidence
        return self.calculate_attribution_confidence(
            temporal_clusters, infra_clusters, ttp_patterns
        )
```

---

## Compliance Management

### Framework Support

#### SOC 2 Type II

**Trust Service Categories**:
- **Security**: Information and systems protection
- **Availability**: System operation and usage as committed
- **Processing Integrity**: Complete, valid, accurate, timely processing
- **Confidentiality**: Designated confidential information protection
- **Privacy**: Personal information collection, use, retention, disclosure

**Control Families**:

| Control ID | Category | Description | Testing Frequency |
|------------|----------|-------------|-------------------|
| CC1 | COSO Framework | Control environment | Annual |
| CC2 | Communication | Relevant information communication | Semi-annual |
| CC3 | Risk Assessment | Risk identification and analysis | Quarterly |
| CC4 | Monitoring | Control deficiency monitoring | Continuous |
| CC5 | Control Activities | Achievement of entity objectives | Monthly |
| CC6 | Logical Access | System access management | Quarterly |
| CC7 | System Operations | System processing integrity | Monthly |
| CC8 | Change Management | System changes management | Per change |
| CC9 | Risk Mitigation | Risk mitigation procedures | Quarterly |

#### ISO 27001:2022

**Control Domains** (Annex A):

| Domain | Controls | Focus Area | Implementation Priority |
|--------|----------|------------|------------------------|
| A.5 | Information Security Policies | Governance | High |
| A.6 | Organization of Information Security | Structure | High |
| A.7 | Human Resource Security | Personnel | Medium |
| A.8 | Asset Management | Asset protection | High |
| A.9 | Access Control | Access management | Critical |
| A.10 | Cryptography | Data protection | High |
| A.11 | Physical and Environmental Security | Facilities | Medium |
| A.12 | Operations Security | Operational procedures | High |
| A.13 | Communications Security | Network protection | High |
| A.14 | System Acquisition | Development lifecycle | Medium |

### Automated Compliance Monitoring

#### Evidence Collection

**Automated Evidence Types**:
- **Configuration Scans**: System hardening verification
- **Access Reviews**: Periodic access right validation
- **Vulnerability Scans**: Security weakness identification
- **Log Analysis**: Security event correlation
- **Change Records**: Modification tracking and approval
- **Training Records**: Personnel awareness compliance

**Evidence Processing Pipeline**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │    │   Extract   │    │   Validate  │
│   Systems   │───►│ & Transform │───►│ & Enrich    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Evidence  │    │   Control   │    │   Report    │
│   Storage   │    │  Mapping    │    │ Generation  │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Gap Analysis & Remediation

**Gap Identification Process**:
1. **Requirement Mapping**: Framework control to system capability
2. **Evidence Assessment**: Available proof evaluation
3. **Gap Calculation**: Missing or insufficient controls
4. **Priority Ranking**: Risk-based implementation order
5. **Remediation Planning**: Resource allocation and timeline

**Remediation Tracking**:
- **Action Plans**: Detailed implementation steps
- **Responsibility Assignment**: Owner and stakeholder identification
- **Progress Monitoring**: Milestone and completion tracking
- **Effectiveness Testing**: Post-implementation validation

---

## Operations Center

### Asset Management

#### Asset Discovery & Classification

**Discovery Methods**:
- **Network Scanning**: Active and passive network discovery
- **Agent-Based**: Endpoint management integration
- **Cloud APIs**: Public cloud resource enumeration
- **Manual Entry**: User-provided asset registration
- **Integration APIs**: CMDB and inventory system sync

**Asset Categories**:

| Category | Examples | Criticality Factors | Monitoring Requirements |
|----------|----------|-------------------|------------------------|
| **Infrastructure** | Servers, network devices | Availability, performance | 24/7 monitoring |
| **Applications** | Business applications | Data sensitivity, uptime | Business hours monitoring |
| **Data Stores** | Databases, file systems | Confidentiality, integrity | Continuous backup verification |
| **Endpoints** | Workstations, mobile | User access, compliance | Periodic scanning |
| **Cloud Resources** | VMs, containers, services | Cost, security posture | Real-time tracking |

#### Service Mapping

**Service Model**:
```
Service
├── Business Function (Customer-facing capability)
├── Technical Components (Applications, databases)
├── Infrastructure Dependencies (Servers, networks)
├── Support Processes (Monitoring, backup)
└── Risk Associations (Threats, vulnerabilities)
```

**Dependency Mapping**:
- **Upstream Dependencies**: Services this service depends on
- **Downstream Dependencies**: Services depending on this service
- **Critical Path Analysis**: Failure impact assessment
- **Recovery Requirements**: RTO/RPO specification

### Incident Management

#### Incident Classification

**Severity Levels**:

| Severity | Response Time | Escalation | Examples |
|----------|---------------|------------|----------|
| **P0 - Critical** | 15 minutes | Immediate C-level | Data breach, system down |
| **P1 - High** | 1 hour | Management notification | Security incident, partial outage |
| **P2 - Medium** | 4 hours | Team lead notification | Performance degradation |
| **P3 - Low** | 24 hours | Standard assignment | Minor issues, requests |

**Category Classification**:
- **Security Incident**: Unauthorized access, malware, data loss
- **Operational Issue**: System failure, performance problem
- **Service Request**: User requests, access changes
- **Change Management**: Planned modifications, updates

#### Response Workflow

**Incident Lifecycle**:
1. **Detection/Reporting**: Automated alert or user report
2. **Initial Assessment**: Severity and category assignment
3. **Assignment**: Route to appropriate response team
4. **Investigation**: Root cause analysis and evidence collection
5. **Containment**: Immediate threat mitigation
6. **Eradication**: Threat removal and system hardening
7. **Recovery**: Service restoration and validation
8. **Post-Incident**: Lessons learned and process improvement

### Document Management

#### Document Classification

**Classification Levels**:

| Level | Access Control | Handling Requirements | Examples |
|-------|----------------|----------------------|----------|
| **Public** | No restrictions | Standard distribution | Marketing materials, public policies |
| **Internal** | Employee access | Internal use only | Procedures, internal communications |
| **Confidential** | Need-to-know | Restricted distribution | Financial data, strategic plans |
| **Restricted** | Authorized personnel | Special handling | Security procedures, PII data |

#### Version Control & Lifecycle

**Document Lifecycle**:
- **Draft**: Document creation and initial review
- **Review**: Stakeholder review and approval process
- **Published**: Active document available for use
- **Archived**: Historical record, superseded by newer version
- **Retired**: No longer relevant, maintained for compliance

---

## Admin & Analytics

### User Management

#### Role-Based Access Control (RBAC)

**Permission Matrix**:

| Module | Admin | Risk Mgr | Compliance | Analyst | Viewer |
|--------|-------|----------|------------|---------|--------|
| **Dashboard** | R/W | R/W | R/W | R/W | R |
| **Risk Management** | R/W | R/W | R | R | R |
| **Threat Intel** | R/W | R/W | R | R/W | R |
| **Compliance** | R/W | R | R/W | R | R |
| **Operations** | R/W | R | R | R/W | R |
| **Admin Panel** | R/W | - | - | - | - |
| **AI Assistant** | R/W | R/W | R/W | R/W | R |

**Permission Types**:
- **R**: Read access to module data
- **W**: Write access (create, update, delete)
- **-**: No access to module

#### User Provisioning

**Account Lifecycle**:
1. **Request**: Role-appropriate access request
2. **Approval**: Manager and system administrator approval
3. **Provisioning**: Account creation with appropriate permissions
4. **Validation**: Access testing and user notification
5. **Monitoring**: Regular access review and validation
6. **Deprovisioning**: Account deactivation upon role change/departure

### AI Provider Management

#### Multi-Provider Configuration

**Supported Providers**:

| Provider | Models Available | Use Cases | Cost Structure |
|----------|------------------|-----------|----------------|
| **OpenAI** | GPT-4, GPT-3.5-turbo | Complex analysis, reasoning | Per token |
| **Anthropic** | Claude 3 (Opus, Sonnet, Haiku) | Long-context tasks | Per token |
| **Google** | Gemini Pro, Gemini Pro Vision | Multimodal analysis | Per request |
| **Azure AI** | GPT-4, Custom models | Enterprise deployment | Per token |
| **Cloudflare** | Llama 3.1 (8B, 70B) | Always-available fallback | Included |

#### Provider Selection Logic

**Automatic Routing Factors**:
- **Query Complexity**: Syntax analysis and context requirements
- **Response Time Requirements**: User urgency indicators
- **Cost Optimization**: Token usage and provider pricing
- **Provider Availability**: Health checks and failover logic
- **Model Capabilities**: Task-specific model strengths

### System Analytics

#### Performance Metrics

**Key Performance Indicators**:

| Metric | Target | Measurement | Alert Threshold |
|--------|--------|-------------|----------------|
| **Response Time** | <200ms | 95th percentile | >500ms |
| **Availability** | 99.9% | Monthly uptime | <99.5% |
| **Error Rate** | <0.1% | Failed requests | >1% |
| **AI Response Quality** | >90% | User feedback | <80% |
| **Database Performance** | <50ms | Query execution | >100ms |

**Analytics Dashboard**:
- Real-time performance monitoring
- Usage trend analysis
- Cost optimization recommendations
- Capacity planning insights
- User behavior analytics

#### Cost Management

**Cost Tracking Categories**:
- **AI Provider Costs**: Token usage and API calls
- **Infrastructure Costs**: Cloudflare services (D1, R2, Workers)
- **Operational Costs**: Monitoring, backup, support
- **Compliance Costs**: Audit, certification, legal

**Optimization Strategies**:
- AI provider selection optimization
- Caching strategy implementation
- Query optimization and batching
- Resource usage monitoring
- Cost allocation by department/project

---

## API Reference

### Authentication

#### JWT Token Management

**Token Structure**:
```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "string",
    "username": "string", 
    "role": "admin|risk_manager|compliance|analyst|viewer",
    "permissions": ["array", "of", "permissions"],
    "exp": timestamp,
    "iat": timestamp
  }
}
```

**Authentication Flow**:
1. **Login**: POST `/auth/login` with credentials
2. **Token Response**: JWT token and refresh token
3. **Request Authorization**: Include `Authorization: Bearer <token>` header
4. **Token Refresh**: POST `/auth/refresh` with refresh token
5. **Logout**: POST `/auth/logout` to invalidate tokens

### Core Endpoints

#### Risk Management API

**Get Risk Summary**:
```http
GET /api/risks/summary
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "total_risks": 8,
    "critical": 0,
    "high": 0, 
    "medium": 0,
    "low": 8,
    "average_score": 35.2,
    "trend": "stable"
  }
}
```

**Create Risk**:
```http
POST /api/risks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Data Breach Risk",
  "description": "Risk of unauthorized data access",
  "category": "cybersecurity",
  "probability": 30,
  "impact": 80,
  "owner": "user@company.com"
}
```

#### AI Assistant API

**Chat Interaction**:
```http
POST /ai/chat-json
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are my current risks?",
  "session_id": "optional-session-id"
}

Response:
{
  "response": "AI-generated response text",
  "model": "provider-model-used",
  "confidence": "High|Medium|Low",
  "source": "Live Platform Data",
  "processing_time_ms": 1234
}
```

#### Threat Intelligence API

**IOC Query**:
```http
GET /api/threat-intelligence/iocs?type=ip&value=192.168.1.1
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "indicator": "192.168.1.1",
    "type": "ip",
    "confidence": 85,
    "source": "CISA KEV",
    "first_seen": "2024-12-01T00:00:00Z",
    "last_seen": "2024-12-08T00:00:00Z",
    "campaigns": ["APT28-2024"],
    "attribution": "Nation-state"
  }
}
```

### Error Handling

**Standard Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error details"
    },
    "timestamp": "2024-12-08T12:00:00Z",
    "request_id": "unique-request-identifier"
  }
}
```

**Common Error Codes**:
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request data validation failure
- `RESOURCE_NOT_FOUND`: Requested resource doesn''t exist
- `RATE_LIMIT_EXCEEDED`: Too many requests from user
- `INTERNAL_ERROR`: Unexpected server error

---

## Security & Best Practices

### Security Architecture

#### Defense in Depth

**Security Layers**:
1. **Edge Protection**: Cloudflare DDoS protection, WAF
2. **Application Security**: CSRF tokens, input validation
3. **Authentication**: JWT tokens, multi-factor authentication
4. **Authorization**: Role-based access control (RBAC)
5. **Data Protection**: Encryption at rest and in transit
6. **Monitoring**: Real-time security event correlation

#### Data Protection

**Encryption Standards**:
- **In Transit**: TLS 1.3 for all communications
- **At Rest**: AES-256 encryption for database storage
- **Application**: bcrypt for password hashing (cost factor 12)
- **Tokens**: HMAC-SHA256 for JWT signing

**Data Classification**:
- **Public**: Marketing materials, public documentation
- **Internal**: Employee directory, internal procedures
- **Confidential**: Risk assessments, threat intelligence
- **Restricted**: Authentication credentials, encryption keys

### Best Practices

#### User Security

**Password Requirements**:
- Minimum 12 characters length
- Mix of uppercase, lowercase, numbers, symbols
- No common dictionary words or patterns
- Regular password rotation (90 days)
- No password reuse (last 12 passwords)

**Session Management**:
- JWT token expiration: 8 hours
- Refresh token expiration: 30 days
- Automatic logout on browser close
- Concurrent session limits by role
- Session monitoring and anomaly detection

#### API Security

**Request Validation**:
- Input sanitization and validation
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection for state-changing operations
- Rate limiting (100 requests/minute per user)

**Response Security**:
- Sensitive data masking in logs
- Error message sanitization
- Response header security controls
- Content type validation
- Data size limits and pagination

### Compliance Considerations

#### Data Privacy

**GDPR Compliance**:
- Lawful basis for processing personal data
- Data subject rights implementation (access, rectification, erasure)
- Privacy by design and default
- Data protection impact assessments
- Breach notification procedures (72-hour requirement)

**Data Retention**:
- Risk data: 7 years retention for audit purposes
- Threat intelligence: 2 years for historical analysis
- User activity logs: 1 year for security investigation
- Audit logs: 7 years for compliance requirements
- Backup data: Encrypted storage with automated deletion

---

## Troubleshooting

### Common Issues

#### Authentication Problems

**Symptom**: Unable to login or frequent session timeouts

**Possible Causes**:
- Expired JWT tokens
- Browser cache issues  
- Network connectivity problems
- Account locked due to failed attempts

**Resolution Steps**:
1. Clear browser cache and cookies
2. Verify network connectivity to platform
3. Check for account lockout notifications
4. Contact administrator for password reset
5. Verify correct URL and environment

#### Performance Issues

**Symptom**: Slow page loads or API responses

**Troubleshooting Process**:
1. **Client-Side Issues**:
   - Check browser developer tools for errors
   - Verify stable internet connection
   - Disable browser extensions temporarily
   - Try different browser or incognito mode

2. **Network Issues**:
   - Ping platform URL to check connectivity
   - Check for CDN or DNS resolution problems
   - Verify corporate firewall/proxy settings

3. **Server-Side Issues**:
   - Monitor platform status page
   - Check for scheduled maintenance windows
   - Verify database connectivity
   - Review application performance metrics

#### Data Inconsistencies

**Symptom**: Incorrect risk counts or missing data

**Investigation Steps**:
1. **Verify Data Source**:
   - Check database synchronization status
   - Validate data import/export processes
   - Review recent system changes

2. **Check Permissions**:
   - Verify user role and data access permissions
   - Check for data filtering based on user context
   - Validate organizational hierarchy access

3. **System Integrity**:
   - Run data consistency checks
   - Review audit logs for unauthorized changes
   - Check for concurrent modification conflicts

### Error Reference

#### HTTP Status Codes

| Code | Meaning | Common Causes | Resolution |
|------|---------|---------------|------------|
| **400** | Bad Request | Invalid input data | Validate request format and parameters |
| **401** | Unauthorized | Missing/invalid authentication | Re-authenticate or refresh token |
| **403** | Forbidden | Insufficient permissions | Contact admin for role/permission review |
| **404** | Not Found | Resource doesn''t exist | Verify URL and resource availability |
| **429** | Too Many Requests | Rate limit exceeded | Reduce request frequency or contact admin |
| **500** | Internal Server Error | System malfunction | Contact support with request details |

#### AI Assistant Issues

**Symptom**: ARIA providing incorrect or outdated information

**Resolution**:
1. **Verify Data Currency**:
   - Check platform data synchronization
   - Validate RAG knowledge base updates
   - Review recent system changes affecting data

2. **AI Provider Status**:
   - Check AI provider availability and health
   - Verify API key configuration
   - Test failover to backup providers

3. **Query Optimization**:
   - Rephrase queries for clarity
   - Provide more specific context
   - Use structured query formats

### Support Escalation

#### Internal Support Process

**Level 1 - Self-Service**:
- Platform documentation review
- Knowledge base search
- Community forums (if available)
- Basic troubleshooting steps

**Level 2 - Help Desk**:
- Ticket submission with detailed issue description
- Remote assistance for configuration issues
- Account and permission management
- Basic technical support

**Level 3 - Engineering**:
- Complex technical issues requiring code changes
- Performance optimization and tuning
- Integration and customization support
- Security incident response

#### Information Required for Support

**Ticket Information**:
- User account and role details
- Specific error messages and codes
- Steps to reproduce the issue
- Browser and system information
- Screenshots or screen recordings
- Expected vs. actual behavior description

---

## Appendices

### Appendix A: Keyboard Shortcuts

| Shortcut | Action | Module |
|----------|--------|--------|
| `Ctrl+/` | Open AI Assistant | Global |
| `Ctrl+K` | Global search | Global |
| `Ctrl+D` | Navigate to Dashboard | Global |
| `Ctrl+R` | Navigate to Risk Management | Global |
| `Ctrl+T` | Navigate to Threat Intelligence | Global |
| `Ctrl+C` | Navigate to Compliance | Global |
| `Ctrl+O` | Navigate to Operations | Global |
| `Ctrl+A` | Navigate to Admin (if permitted) | Global |
| `Escape` | Close modal or overlay | Global |

### Appendix B: Data Schema Reference

#### Risk Data Model

```sql
CREATE TABLE risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  impact INTEGER CHECK (impact >= 0 AND impact <= 100),
  risk_score REAL GENERATED ALWAYS AS (
    CAST(probability AS REAL) * CAST(impact AS REAL) / 100.0
  ) STORED,
  status TEXT DEFAULT ''active'' CHECK (status IN (''active'', ''mitigated'', ''closed'')),
  owner TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Threat Intelligence Model

```sql
CREATE TABLE threat_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_value TEXT NOT NULL,
  indicator_type TEXT NOT NULL CHECK (
    indicator_type IN (''ip'', ''domain'', ''url'', ''hash'', ''email'')
  ),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source TEXT NOT NULL,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  tags TEXT, -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Appendix C: Integration Specifications

#### STIX/TAXII Integration

**Supported STIX Objects**:
- Indicator
- Malware
- Attack Pattern
- Threat Actor
- Campaign
- Intrusion Set
- Vulnerability
- Observed Data

**TAXII 2.1 Endpoints**:
- Discovery: `/taxii2/`
- API Root: `/taxii2/api/`
- Collections: `/taxii2/api/collections/`
- Objects: `/taxii2/api/collections/{id}/objects/`

#### Webhook Configuration

**Supported Events**:
- Risk creation/modification
- Threat indicator updates
- Compliance status changes
- Incident creation/resolution
- User activity events

**Webhook Format**:
```json
{
  "event_type": "risk.created",
  "timestamp": "2024-12-08T12:00:00Z",
  "data": {
    "risk_id": 123,
    "title": "New Risk Identified",
    "severity": "high",
    "owner": "user@company.com"
  },
  "signature": "webhook-signature-for-verification"
}
```

### Appendix D: Compliance Mapping

#### SOC 2 to Platform Features

| SOC 2 Control | Platform Feature | Implementation Notes |
|---------------|------------------|---------------------|
| CC1.1 | User role management | RBAC implementation |
| CC1.2 | Board oversight | Admin dashboard and reporting |
| CC1.3 | Management structure | Organizational hierarchy |
| CC6.1 | Logical access | Authentication system |
| CC6.2 | Access authorization | Permission matrix |
| CC6.3 | Access removal | User lifecycle management |
| CC7.1 | System boundaries | Asset classification |
| CC8.1 | Change management | Audit logging |

#### ISO 27001 Control Mapping

| ISO Control | Platform Implementation | Evidence Collection |
|-------------|------------------------|-------------------|
| A.9.1.1 | Access control policy | Policy documentation |
| A.9.1.2 | Network access control | Network monitoring logs |
| A.9.2.1 | User registration | User provisioning records |
| A.9.2.2 | User access provisioning | Role assignment logs |
| A.9.2.3 | Management of privileged access | Admin activity monitoring |
| A.12.1.1 | Operating procedures | System documentation |
| A.12.6.1 | Management of vulnerabilities | Vulnerability scan results |

---

## Document Information

**Document Control**:
- **Version**: 1.0
- **Classification**: Internal Use
- **Owner**: ARIA5 Platform Team
- **Review Frequency**: Quarterly
- **Next Review**: March 8, 2025
- **Distribution**: All platform users

**Change History**:

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-08 | Initial comprehensive guide creation | ARIA5 Platform Team |

**Approval**:
- **Technical Review**: Platform Engineering Team
- **Security Review**: Information Security Team  
- **Business Review**: Risk Management Team
- **Final Approval**: Platform Product Owner

---

*This document is proprietary and confidential. Distribution outside the organization requires explicit authorization from the document owner.*',
  '/docs/ARIA5-User-Guide.md',
  'user_guide',
  'processed',
  133,
  '{"version":"1.0","total_sections":133,"total_chunks":133,"document_size":46133,"created_date":"2024-12-08","classification":"internal","tags":["user_guide","platform_documentation","ai_ml_ratings","system_operations"]}',
  1,
  1
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  0,
  '# ARIA5.1 Enterprise Platform - Complete User Guide

**Version**: 5.1.0  
**Document Version**: 1.0  
**Last Updated**: December 8, 2024  
**Platform URL**: https://aria51.pages.dev

---',
  '{"section_title":"ARIA5.1 Enterprise Platform - Complete User Guide","section_level":1,"chunk_size":186,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  1,
  '## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Getting Started](#getting-started)
3. [AI/ML Rating Systems](#aiml-rating-systems)
4. [Core Modules](#core-modules)
5. [AI Assistant (ARIA)](#ai-assistant-aria)
6. [Risk Management](#risk-management)
7. [Threat Intelligence](#threat-intelligence)
8. [Compliance Management](#compliance-management)
9. [Operations Center](#operations-center)
10. [Admin & Analytics](#admin-analytics)
11. [API Reference](#api-reference)
12. [Security & Best Practices](#security-best-practices)
13. [Troubleshooting](#troubleshooting)
14. [Appendices](#appendices)

---',
  '{"section_title":"Table of Contents","section_level":2,"chunk_size":620,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  2,
  '## Platform Overview',
  '{"section_title":"Platform Overview","section_level":2,"chunk_size":20,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  3,
  '### What is ARIA5.1?

ARIA5.1 is an enterprise-grade AI-powered risk intelligence and security management platform designed for comprehensive organizational security operations. Built on Cloudflare''s global edge network, it provides real-time threat intelligence, risk assessment, compliance management, and AI-driven analytics.',
  '{"section_title":"What is ARIA5.1?","section_level":3,"chunk_size":328,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  4,
  '### Key Features

- **AI-Powered Risk Assessment**: Machine learning algorithms for dynamic risk scoring
- **Real-Time Threat Intelligence**: Multi-source feed integration with behavioral analytics
- **Compliance Automation**: Automated compliance monitoring for SOC 2, ISO 27001, NIST
- **Conversational AI Assistant**: Natural language interaction with platform data
- **Enterprise Security**: Role-based access, CSRF protection, secure authentication
- **Global Edge Deployment**: Sub-100ms response times worldwide via Cloudflare',
  '{"section_title":"Key Features","section_level":3,"chunk_size":533,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  5,
  '### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Hono Backend  │    │   Cloudflare    │
│   HTMX + JS     │◄──►│   TypeScript    │◄──►│   D1 Database   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Providers  │    │   Auth System   │    │   R2 Storage    │
│   Multi-LLM     │    │   JWT + RBAC    │    │   File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---',
  '{"section_title":"Architecture","section_level":3,"chunk_size":676,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  6,
  '## Getting Started',
  '{"section_title":"Getting Started","section_level":2,"chunk_size":18,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  7,
  '### System Requirements

- **Browser**: Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- **Network**: HTTPS connection required
- **Authentication**: Valid user account with appropriate role permissions',
  '{"section_title":"System Requirements","section_level":3,"chunk_size":212,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  8,
  '### User Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Administrator** | Full Platform | All modules, user management, system configuration |
| **Risk Manager** | Risk + Intelligence | Risk assessment, threat analysis, compliance viewing |
| **Compliance Officer** | Compliance + Reports | Compliance management, audit reports, control tracking |
| **Security Analyst** | Operations + Intelligence | Asset management, incident response, threat hunting |
| **Viewer** | Read-Only | Dashboard viewing, report access |',
  '{"section_title":"User Roles","section_level":3,"chunk_size":557,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  9,
  '### Login Process

1. Navigate to platform URL: `https://aria51.pages.dev`
2. Click "Sign In" or access `/login`
3. Enter credentials or use demo accounts:
   - Admin: `admin` / `demo123`
   - Risk Manager: `avi_security` / `demo123`
   - Compliance Officer: `sjohnson` / `demo123`
4. Upon successful authentication, redirect to personalized dashboard

---',
  '{"section_title":"Login Process","section_level":3,"chunk_size":356,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  10,
  '## AI/ML Rating Systems',
  '{"section_title":"AI/ML Rating Systems","section_level":2,"chunk_size":23,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  11,
  '### Overview

ARIA5.1 employs sophisticated AI and machine learning algorithms across multiple domains to provide intelligent, data-driven insights. All rating systems are designed to be transparent, auditable, and continuously improving.',
  '{"section_title":"Overview","section_level":3,"chunk_size":238,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  12,
  '### 1. Risk Scoring Algorithm',
  '{"section_title":"1. Risk Scoring Algorithm","section_level":3,"chunk_size":29,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  13,
  '#### Dynamic Risk Calculation

**Formula**: `Risk Score = (Probability × Impact × Threat Context × Business Criticality) / Mitigation Effectiveness`

**Components**:

- **Probability (0-100)**: Likelihood of risk occurrence
  - Historical data analysis
  - Industry trend correlation
  - Environmental factor assessment
  
- **Impact (0-100)**: Potential business impact
  - Financial loss estimation
  - Operational disruption assessment
  - Reputational damage scoring
  - Regulatory penalty calculation

- **Threat Context Multiplier (0.5-2.0)**: Real-time threat landscape
  - Current threat intelligence feeds
  - Behavioral anomaly detection
  - Campaign attribution confidence
  - IOC correlation strength

- **Business Criticality (0.5-2.0)**: Asset importance
  - Revenue impact weighting
  - Customer data sensitivity
  - System interdependencies
  - Recovery time objectives

- **Mitigation Effectiveness (0.1-1.0)**: Control strength
  - Implementation completeness
  - Control maturity assessment
  - Testing validation results
  - Continuous monitoring coverage',
  '{"section_title":"Dynamic Risk Calculation","section_level":4,"chunk_size":1075,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  14,
  '#### Risk Categories

| Score Range | Category | Color | Priority | Action Required |
|-------------|----------|-------|----------|----------------|
| 90-100 | **Critical** | 🔴 Red | P0 | Immediate (0-24h) |
| 70-89 | **High** | 🟠 Orange | P1 | Urgent (1-7 days) |
| 40-69 | **Medium** | 🟡 Yellow | P2 | Scheduled (1-4 weeks) |
| 0-39 | **Low** | 🟢 Green | P3 | Routine monitoring |',
  '{"section_title":"Risk Categories","section_level":4,"chunk_size":386,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  15,
  '#### Machine Learning Enhancements

**Predictive Risk Modeling**:
- Trend analysis using historical risk patterns
- Seasonal risk fluctuation detection
- Industry benchmark comparison
- Emerging threat correlation

**Behavioral Analytics**:
- Anomaly detection in risk patterns
- Control effectiveness optimization
- Resource allocation recommendations
- Risk appetite calibration',
  '{"section_title":"Machine Learning Enhancements","section_level":4,"chunk_size":380,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  16,
  '### 2. Threat Intelligence Scoring',
  '{"section_title":"2. Threat Intelligence Scoring","section_level":3,"chunk_size":34,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  17,
  '#### IOC Confidence Scoring

**Formula**: `Confidence = (Source Reliability × Attribution Strength × Temporal Relevance × Contextual Correlation)`

**Scoring Matrix**:

| Confidence | Range | Description | Action |
|------------|--------|-------------|--------|
| **High** | 80-100% | Multiple reliable sources, strong attribution | Block/Alert |
| **Medium** | 60-79% | Some validation, moderate attribution | Monitor closely |
| **Low** | 40-59% | Limited validation, weak attribution | Log for analysis |
| **Unverified** | 0-39% | Single source, no validation | Research needed |',
  '{"section_title":"IOC Confidence Scoring","section_level":4,"chunk_size":583,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  18,
  '#### Source Reliability Ratings

| Source Type | Base Reliability | Adjustment Factors |
|-------------|------------------|-------------------|
| Government Feeds (CISA) | 95% | Timeliness, specificity |
| Commercial TI Vendors | 85% | Track record, validation |
| Open Source (OTX) | 70% | Community validation, age |
| Internal Detection | 90% | Context accuracy, false positives |
| Third-party Reports | 65% | Reputation, verification |',
  '{"section_title":"Source Reliability Ratings","section_level":4,"chunk_size":440,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  19,
  '#### Campaign Attribution Confidence

**Attribution Scoring Factors**:
- **TTPs Overlap (30%)**: Tactics, techniques, procedures similarity
- **Infrastructure Reuse (25%)**: Domain/IP address patterns
- **Code Similarity (20%)**: Malware family connections
- **Timeline Correlation (15%)**: Attack sequence patterns
- **Victimology (10%)**: Target selection similarity',
  '{"section_title":"Campaign Attribution Confidence","section_level":4,"chunk_size":368,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  20,
  '### 3. Compliance Scoring',
  '{"section_title":"3. Compliance Scoring","section_level":3,"chunk_size":25,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  21,
  '#### Control Effectiveness Rating

**Formula**: `Effectiveness = (Implementation Score × Testing Results × Monitoring Coverage × Maturity Level)`

**Implementation Scoring**:
- **Implemented (100%)**: Fully deployed and operational
- **Partially Implemented (60%)**: Core components active
- **Planned (20%)**: Design complete, deployment pending
- **Not Implemented (0%)**: No progress on control

**Testing Results Weight**:
- **Satisfactory (1.0)**: No deficiencies found
- **Minor Issues (0.8)**: Low-risk gaps identified
- **Major Issues (0.6)**: Significant deficiencies
- **Failed (0.3)**: Control not operating effectively

**Maturity Levels**:

| Level | Score | Description | Characteristics |
|-------|-------|-------------|----------------|
| **Optimized** | 100% | Continuous improvement | Automated, metrics-driven |
| **Managed** | 80% | Quantitatively managed | Measured, controlled |
| **Defined** | 60% | Standardized process | Documented, trained |
| **Repeatable** | 40% | Basic management | Some documentation |
| **Initial** | 20% | Ad hoc processes | Unpredictable, reactive |',
  '{"section_title":"Control Effectiveness Rating","section_level":4,"chunk_size":1099,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  22,
  '#### Framework Coverage Scoring

**Supported Frameworks**:
- **SOC 2 Type II**: Service Organization Control 2
- **ISO 27001**: Information Security Management
- **NIST CSF**: Cybersecurity Framework
- **PCI DSS**: Payment Card Industry Data Security
- **GDPR**: General Data Protection Regulation
- **HIPAA**: Health Insurance Portability Act

**Coverage Calculation**:
```
Framework Coverage = (Applicable Controls Implemented / Total Applicable Controls) × 100%
```',
  '{"section_title":"Framework Coverage Scoring","section_level":4,"chunk_size":468,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  23,
  '### 4. Asset Criticality Rating',
  '{"section_title":"4. Asset Criticality Rating","section_level":3,"chunk_size":31,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  24,
  '#### Business Impact Assessment

**Criticality Factors**:
- **Revenue Impact (30%)**: Direct revenue dependency
- **Data Sensitivity (25%)**: Type and volume of sensitive data
- **Operational Dependency (20%)**: Business process criticality
- **Customer Impact (15%)**: External customer effect
- **Regulatory Requirement (10%)**: Compliance obligations',
  '{"section_title":"Business Impact Assessment","section_level":4,"chunk_size":353,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  25,
  '#### CIA Rating System

**Confidentiality, Integrity, Availability Scoring**:

| Rating | Value | Confidentiality | Integrity | Availability |
|--------|-------|----------------|-----------|--------------|
| **Critical** | 5 | Top Secret/PCI | Financial systems | 24/7 operations |
| **High** | 4 | Confidential/PII | Customer data | Business hours |
| **Medium** | 3 | Internal use | Operational data | Standard SLA |
| **Low** | 2 | Public info | Reference data | Best effort |
| **Minimal** | 1 | Public domain | Archive data | No requirement |',
  '{"section_title":"CIA Rating System","section_level":4,"chunk_size":547,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  26,
  '### 5. Incident Severity Scoring',
  '{"section_title":"5. Incident Severity Scoring","section_level":3,"chunk_size":32,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  27,
  '#### CVSS-Based Impact Assessment

**Base Score Components**:
- **Attack Vector (AV)**: Network, Adjacent, Local, Physical
- **Attack Complexity (AC)**: Low, High
- **Privileges Required (PR)**: None, Low, High
- **User Interaction (UI)**: None, Required
- **Scope (S)**: Unchanged, Changed
- **Impact Metrics (CIA)**: High, Low, None

**Temporal Score Modifiers**:
- **Exploit Code Maturity**: Not defined, Proof of concept, Functional, High
- **Remediation Level**: Official fix, Temporary fix, Workaround, Unavailable
- **Report Confidence**: Unknown, Reasonable, Confirmed

---',
  '{"section_title":"CVSS-Based Impact Assessment","section_level":4,"chunk_size":581,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  28,
  '## Core Modules',
  '{"section_title":"Core Modules","section_level":2,"chunk_size":15,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  29,
  '### Dashboard Overview

The main dashboard provides real-time insights across all platform modules:',
  '{"section_title":"Dashboard Overview","section_level":3,"chunk_size":99,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  30,
  '#### Key Metrics Display

**Risk Landscape Overview**:
- Total active risks with severity breakdown
- Risk trend analysis (7-day, 30-day)
- Top 5 critical risks requiring attention
- Risk score distribution histogram

**Threat Intelligence Summary**:
- Active IOCs with confidence levels
- Campaign attribution updates
- Feed synchronization status
- Behavioral anomaly alerts

**Compliance Posture**:
- Overall compliance percentage
- Framework-specific scores
- Upcoming audit deadlines
- Control gap analysis

**Operational Status**:
- Asset inventory summary
- Service availability metrics
- Incident response queue
- System health indicators',
  '{"section_title":"Key Metrics Display","section_level":4,"chunk_size":646,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  31,
  '#### Interactive Elements

- **Quick Actions**: Rapid access to common tasks
- **Alert Center**: Real-time notifications and warnings
- **Search Global**: Platform-wide intelligent search
- **AI Assistant**: Conversational interface for queries

---',
  '{"section_title":"Interactive Elements","section_level":4,"chunk_size":249,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  32,
  '## AI Assistant (ARIA)',
  '{"section_title":"AI Assistant (ARIA)","section_level":2,"chunk_size":22,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  33,
  '### Overview

ARIA (AI Risk Intelligence Assistant) is the platform''s conversational AI interface, powered by multiple LLM providers with intelligent routing for optimal performance and cost efficiency.',
  '{"section_title":"Overview","section_level":3,"chunk_size":202,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  34,
  '### AI Provider Stack',
  '{"section_title":"AI Provider Stack","section_level":3,"chunk_size":21,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  35,
  '#### Multi-Provider Architecture

**Provider Priority (Automatic Failover)**:
1. **OpenAI GPT-4**: Primary provider for complex analysis
2. **Anthropic Claude**: Secondary for reasoning tasks
3. **Google Gemini**: Tertiary for general queries
4. **Azure AI Foundry**: Enterprise deployment option
5. **Cloudflare Llama3**: Always-available fallback (free)',
  '{"section_title":"Multi-Provider Architecture","section_level":4,"chunk_size":355,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  36,
  '#### Provider Selection Logic

```typescript
function selectProvider(query) {
  const complexity = analyzeQueryComplexity(query);
  const contextLength = getContextLength(query);
  const urgency = detectUrgency(query);
  
  if (complexity > 0.8 && OPENAI_AVAILABLE) return ''openai'';
  if (contextLength > 4000 && ANTHROPIC_AVAILABLE) return ''anthropic'';
  if (urgency === ''high'' && GOOGLE_AVAILABLE) return ''google'';
  return ''cloudflare''; // Always available fallback
}
```',
  '{"section_title":"Provider Selection Logic","section_level":4,"chunk_size":474,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  37,
  '### RAG (Retrieval-Augmented Generation)',
  '{"section_title":"RAG (Retrieval-Augmented Generation)","section_level":3,"chunk_size":40,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  38,
  '#### Knowledge Base Integration

**Indexed Content Sources**:
- Platform documentation and user guides
- Risk assessment methodologies
- Compliance framework requirements
- Threat intelligence reports
- Historical incident data
- Best practice recommendations

**Vector Embedding Process**:
1. Document chunking (512-token segments)
2. Embedding generation (OpenAI text-embedding-3-small)
3. Vector storage in Cloudflare Vectorize
4. Semantic search with cosine similarity
5. Context ranking and selection',
  '{"section_title":"Knowledge Base Integration","section_level":4,"chunk_size":505,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  39,
  '#### Query Processing Pipeline

```mermaid
graph LR
    A[User Query] --> B[Intent Analysis]
    B --> C[Context Retrieval]
    C --> D[Provider Selection]
    D --> E[LLM Generation]
    E --> F[Response Validation]
    F --> G[Formatted Output]
```',
  '{"section_title":"Query Processing Pipeline","section_level":4,"chunk_size":250,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  40,
  '### Capabilities & Use Cases',
  '{"section_title":"Capabilities & Use Cases","section_level":3,"chunk_size":28,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  41,
  '#### Risk Analysis Queries

**Example Interactions**:
- "What are my top critical risks?"
- "Show risk trends for the past month"
- "Analyze risk distribution by category"
- "What mitigation strategies do you recommend?"

**ARIA Response Format**:
```
🎯 **Live Risk Analysis** (ML-Enhanced)

**Current Risk Landscape:**
• 0 CRITICAL risks requiring immediate attention
• 0 HIGH priority risks (ML confidence >85%)
• 0 MEDIUM risks monitored by behavioral analytics
• 8 LOW risks tracked for pattern evolution

**AI Risk Assessment:**
• Average Risk Score: 35/100
• Threat Posture: MANAGEABLE
• Platform Health: 78/100
• ML Prediction: Stable risk trajectory maintained
```',
  '{"section_title":"Risk Analysis Queries","section_level":4,"chunk_size":673,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  42,
  '#### Threat Intelligence Queries

**Example Interactions**:
- "What threat campaigns are currently active?"
- "Analyze IOC confidence scores"
- "Show APT attribution analysis"
- "What are the latest threat patterns?"',
  '{"section_title":"Threat Intelligence Queries","section_level":4,"chunk_size":216,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  43,
  '#### Compliance Queries

**Example Interactions**:
- "What''s my SOC 2 compliance status?"
- "Show control gap analysis"
- "When is my next audit deadline?"
- "What compliance improvements do you recommend?"',
  '{"section_title":"Compliance Queries","section_level":4,"chunk_size":206,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  44,
  '### Advanced Features',
  '{"section_title":"Advanced Features","section_level":3,"chunk_size":21,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  45,
  '#### Conversational Context

ARIA maintains conversation context for natural, flowing interactions:
- Previous query memory within session
- Follow-up question handling
- Clarification requests
- Progressive disclosure of information',
  '{"section_title":"Conversational Context","section_level":4,"chunk_size":233,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  46,
  '#### Proactive Alerts

ARIA generates intelligent alerts based on:
- Anomaly detection in platform metrics
- Threshold breaches in risk scores
- Compliance deadline proximity
- Emerging threat intelligence',
  '{"section_title":"Proactive Alerts","section_level":4,"chunk_size":205,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  47,
  '#### Multi-Modal Responses

Response formats adapt to query type:
- **Tabular Data**: Risk matrices, compliance scores
- **Visualizations**: Trend charts, distribution graphs
- **Action Lists**: Recommended next steps
- **Contextual Links**: Direct navigation to relevant modules

---',
  '{"section_title":"Multi-Modal Responses","section_level":4,"chunk_size":284,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  48,
  '## Risk Management',
  '{"section_title":"Risk Management","section_level":2,"chunk_size":18,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  49,
  '### Risk Assessment Process',
  '{"section_title":"Risk Assessment Process","section_level":3,"chunk_size":27,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  50,
  '#### 1. Risk Identification

**Methods Supported**:
- **Asset-Based Assessment**: Systematic asset inventory review
- **Threat-Based Assessment**: Current threat landscape analysis
- **Vulnerability Assessment**: Technical and process gap identification
- **Scenario Planning**: "What-if" risk modeling

**Risk Categories**:
- **Cybersecurity**: Data breaches, malware, insider threats
- **Operational**: Process failures, supply chain disruptions
- **Financial**: Market volatility, credit risks, fraud
- **Regulatory**: Compliance violations, regulatory changes
- **Strategic**: Technology obsolescence, competitive threats
- **Reputational**: Public relations crises, stakeholder confidence',
  '{"section_title":"1. Risk Identification","section_level":4,"chunk_size":693,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  51,
  '#### 2. Risk Analysis & Scoring

**Quantitative Analysis**:
- **Annual Loss Expectancy (ALE)**: Frequency × Impact
- **Single Loss Expectancy (SLE)**: Asset Value × Exposure Factor
- **Return on Security Investment (ROSI)**: Cost-benefit analysis

**Qualitative Analysis**:
- **Risk Heat Maps**: Visual probability/impact matrices
- **Expert Judgment**: SME input and validation
- **Historical Analysis**: Past incident correlation
- **Industry Benchmarking**: Peer comparison data',
  '{"section_title":"2. Risk Analysis & Scoring","section_level":4,"chunk_size":481,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  52,
  '#### 3. Risk Treatment Strategies

**Treatment Options**:

| Strategy | Description | Use Cases | Cost Considerations |
|----------|-------------|-----------|-------------------|
| **Accept** | Acknowledge and monitor | Low-impact risks | Ongoing monitoring costs |
| **Avoid** | Eliminate risk source | High-impact, controllable | Opportunity costs |
| **Mitigate** | Reduce likelihood/impact | Most enterprise risks | Implementation and maintenance |
| **Transfer** | Insurance or outsourcing | Specialized risks | Premium and deductible costs |',
  '{"section_title":"3. Risk Treatment Strategies","section_level":4,"chunk_size":547,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  53,
  '### Risk Monitoring & Reporting',
  '{"section_title":"Risk Monitoring & Reporting","section_level":3,"chunk_size":31,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  54,
  '#### Real-Time Monitoring

**Automated Tracking**:
- Risk score recalculation (daily)
- Threat landscape correlation (real-time)
- Control effectiveness monitoring (continuous)
- Mitigation progress tracking (weekly)

**Dashboard Widgets**:
- Risk trend visualization
- Top risk alerts
- Risk appetite monitoring
- Risk register summary',
  '{"section_title":"Real-Time Monitoring","section_level":4,"chunk_size":336,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  55,
  '#### Reporting Capabilities

**Executive Reports**:
- Risk posture summary
- Trend analysis and forecasting
- Compliance correlation
- Investment recommendations

**Operational Reports**:
- Detailed risk register
- Mitigation action plans
- Control effectiveness assessments
- Risk treatment tracking

---',
  '{"section_title":"Reporting Capabilities","section_level":4,"chunk_size":305,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  56,
  '## Threat Intelligence',
  '{"section_title":"Threat Intelligence","section_level":2,"chunk_size":22,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  57,
  '### Intelligence Collection',
  '{"section_title":"Intelligence Collection","section_level":3,"chunk_size":27,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  58,
  '#### Multi-Source Integration

**Primary Sources**:
- **CISA KEV (Known Exploited Vulnerabilities)**
- **MISP Communities**: Threat sharing platforms
- **OTX (Open Threat Exchange)**: AlienVault community
- **Commercial Feeds**: Vendor-specific intelligence
- **STIX/TAXII**: Structured threat information

**Collection Framework**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   External  │    │   Parsing   │    │ Enrichment  │
│   Sources   │───►│   & Norm.   │───►│ & Scoring   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    IOC      │    │   Campaign  │    │   Tactical  │
│ Management  │    │ Attribution │    │ Intelligence│
└─────────────┘    └─────────────┘    └─────────────┘
```',
  '{"section_title":"Multi-Source Integration","section_level":4,"chunk_size":870,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  59,
  '#### IOC Management

**Indicator Types Supported**:
- **File Hashes**: MD5, SHA1, SHA256, SHA512
- **Network Indicators**: IP addresses, domains, URLs
- **Registry Keys**: Windows registry modifications
- **Mutex Names**: Process synchronization objects
- **YARA Rules**: Malware detection signatures
- **Email Indicators**: Sender addresses, subjects, headers

**IOC Lifecycle Management**:
1. **Collection**: Automated ingestion from feeds
2. **Validation**: Source verification and deduplication
3. **Enrichment**: Context addition and correlation
4. **Distribution**: Internal sharing and alerting
5. **Aging**: Relevance decay and archival
6. **Feedback**: Effectiveness tracking and tuning',
  '{"section_title":"IOC Management","section_level":4,"chunk_size":695,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  60,
  '### Campaign Attribution',
  '{"section_title":"Campaign Attribution","section_level":3,"chunk_size":24,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  61,
  '#### Attribution Methodology

**Analysis Framework**:
- **Diamond Model**: Adversary, Infrastructure, Capability, Victim
- **Kill Chain Analysis**: Attack progression mapping
- **TTP Correlation**: Behavioral pattern matching
- **Infrastructure Analysis**: Domain/IP relationship mapping

**Confidence Assessment**:

| Confidence Level | Criteria | Required Evidence |
|------------------|----------|-------------------|
| **High (80-100%)** | Multiple corroborating sources | 3+ independent confirmations |
| **Medium (60-79%)** | Some supporting evidence | 2 independent sources |
| **Low (40-59%)** | Limited evidence | Single source or weak correlation |
| **Speculation (0-39%)** | Hypothesis only | Insufficient evidence |',
  '{"section_title":"Attribution Methodology","section_level":4,"chunk_size":728,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  62,
  '#### Threat Actor Profiling

**Actor Categories**:
- **Nation-State**: APT groups, government-sponsored
- **Cybercriminal**: Financially motivated groups
- **Hacktivist**: Ideologically motivated actors
- **Insider Threat**: Internal malicious actors
- **Script Kiddies**: Low-skill opportunistic actors

**Profiling Attributes**:
- **Motivation**: Financial, espionage, disruption, ideology
- **Sophistication**: Attack complexity and innovation level
- **Resources**: Funding, personnel, infrastructure access
- **Geography**: Operating region and time zones
- **Targets**: Industry focus and victim selection
- **TTPs**: Preferred techniques and tools',
  '{"section_title":"Threat Actor Profiling","section_level":4,"chunk_size":654,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  63,
  '### Behavioral Analytics',
  '{"section_title":"Behavioral Analytics","section_level":3,"chunk_size":24,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  64,
  '#### Anomaly Detection

**ML Algorithms Used**:
- **Isolation Forest**: Outlier detection in high-dimensional data
- **LSTM Networks**: Time-series anomaly identification
- **Clustering**: Behavioral pattern grouping (K-means, DBSCAN)
- **Statistical Analysis**: Z-score and IQR-based detection

**Detection Domains**:
- **Network Traffic**: Communication pattern anomalies
- **User Behavior**: Access pattern deviations
- **System Activity**: Process and file system anomalies
- **Data Access**: Unusual data interaction patterns',
  '{"section_title":"Anomaly Detection","section_level":4,"chunk_size":530,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  65,
  '#### Pattern Recognition

**Correlation Engine**:
```python
class ThreatCorrelationEngine:
    def correlate_indicators(self, iocs):
        # Temporal correlation
        temporal_clusters = self.find_temporal_patterns(iocs)
        
        # Infrastructure correlation  
        infra_clusters = self.analyze_infrastructure(iocs)
        
        # TTP correlation
        ttp_patterns = self.match_attack_patterns(iocs)
        
        # Generate attribution confidence
        return self.calculate_attribution_confidence(
            temporal_clusters, infra_clusters, ttp_patterns
        )
```

---',
  '{"section_title":"Pattern Recognition","section_level":4,"chunk_size":607,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  66,
  '## Compliance Management',
  '{"section_title":"Compliance Management","section_level":2,"chunk_size":24,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  67,
  '### Framework Support',
  '{"section_title":"Framework Support","section_level":3,"chunk_size":21,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  68,
  '#### SOC 2 Type II

**Trust Service Categories**:
- **Security**: Information and systems protection
- **Availability**: System operation and usage as committed
- **Processing Integrity**: Complete, valid, accurate, timely processing
- **Confidentiality**: Designated confidential information protection
- **Privacy**: Personal information collection, use, retention, disclosure

**Control Families**:

| Control ID | Category | Description | Testing Frequency |
|------------|----------|-------------|-------------------|
| CC1 | COSO Framework | Control environment | Annual |
| CC2 | Communication | Relevant information communication | Semi-annual |
| CC3 | Risk Assessment | Risk identification and analysis | Quarterly |
| CC4 | Monitoring | Control deficiency monitoring | Continuous |
| CC5 | Control Activities | Achievement of entity objectives | Monthly |
| CC6 | Logical Access | System access management | Quarterly |
| CC7 | System Operations | System processing integrity | Monthly |
| CC8 | Change Management | System changes management | Per change |
| CC9 | Risk Mitigation | Risk mitigation procedures | Quarterly |',
  '{"section_title":"SOC 2 Type II","section_level":4,"chunk_size":1134,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  69,
  '#### ISO 27001:2022

**Control Domains** (Annex A):

| Domain | Controls | Focus Area | Implementation Priority |
|--------|----------|------------|------------------------|
| A.5 | Information Security Policies | Governance | High |
| A.6 | Organization of Information Security | Structure | High |
| A.7 | Human Resource Security | Personnel | Medium |
| A.8 | Asset Management | Asset protection | High |
| A.9 | Access Control | Access management | Critical |
| A.10 | Cryptography | Data protection | High |
| A.11 | Physical and Environmental Security | Facilities | Medium |
| A.12 | Operations Security | Operational procedures | High |
| A.13 | Communications Security | Network protection | High |
| A.14 | System Acquisition | Development lifecycle | Medium |',
  '{"section_title":"ISO 27001:2022","section_level":4,"chunk_size":770,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  70,
  '### Automated Compliance Monitoring',
  '{"section_title":"Automated Compliance Monitoring","section_level":3,"chunk_size":35,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  71,
  '#### Evidence Collection

**Automated Evidence Types**:
- **Configuration Scans**: System hardening verification
- **Access Reviews**: Periodic access right validation
- **Vulnerability Scans**: Security weakness identification
- **Log Analysis**: Security event correlation
- **Change Records**: Modification tracking and approval
- **Training Records**: Personnel awareness compliance

**Evidence Processing Pipeline**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │    │   Extract   │    │   Validate  │
│   Systems   │───►│ & Transform │───►│ & Enrich    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Evidence  │    │   Control   │    │   Report    │
│   Storage   │    │  Mapping    │    │ Generation  │
└─────────────┘    └─────────────┘    └─────────────┘
```',
  '{"section_title":"Evidence Collection","section_level":4,"chunk_size":959,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  72,
  '#### Gap Analysis & Remediation

**Gap Identification Process**:
1. **Requirement Mapping**: Framework control to system capability
2. **Evidence Assessment**: Available proof evaluation
3. **Gap Calculation**: Missing or insufficient controls
4. **Priority Ranking**: Risk-based implementation order
5. **Remediation Planning**: Resource allocation and timeline

**Remediation Tracking**:
- **Action Plans**: Detailed implementation steps
- **Responsibility Assignment**: Owner and stakeholder identification
- **Progress Monitoring**: Milestone and completion tracking
- **Effectiveness Testing**: Post-implementation validation

---',
  '{"section_title":"Gap Analysis & Remediation","section_level":4,"chunk_size":635,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  73,
  '## Operations Center',
  '{"section_title":"Operations Center","section_level":2,"chunk_size":20,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  74,
  '### Asset Management',
  '{"section_title":"Asset Management","section_level":3,"chunk_size":20,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  75,
  '#### Asset Discovery & Classification

**Discovery Methods**:
- **Network Scanning**: Active and passive network discovery
- **Agent-Based**: Endpoint management integration
- **Cloud APIs**: Public cloud resource enumeration
- **Manual Entry**: User-provided asset registration
- **Integration APIs**: CMDB and inventory system sync

**Asset Categories**:

| Category | Examples | Criticality Factors | Monitoring Requirements |
|----------|----------|-------------------|------------------------|
| **Infrastructure** | Servers, network devices | Availability, performance | 24/7 monitoring |
| **Applications** | Business applications | Data sensitivity, uptime | Business hours monitoring |
| **Data Stores** | Databases, file systems | Confidentiality, integrity | Continuous backup verification |
| **Endpoints** | Workstations, mobile | User access, compliance | Periodic scanning |
| **Cloud Resources** | VMs, containers, services | Cost, security posture | Real-time tracking |',
  '{"section_title":"Asset Discovery & Classification","section_level":4,"chunk_size":987,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  76,
  '#### Service Mapping

**Service Model**:
```
Service
├── Business Function (Customer-facing capability)
├── Technical Components (Applications, databases)
├── Infrastructure Dependencies (Servers, networks)
├── Support Processes (Monitoring, backup)
└── Risk Associations (Threats, vulnerabilities)
```

**Dependency Mapping**:
- **Upstream Dependencies**: Services this service depends on
- **Downstream Dependencies**: Services depending on this service
- **Critical Path Analysis**: Failure impact assessment
- **Recovery Requirements**: RTO/RPO specification',
  '{"section_title":"Service Mapping","section_level":4,"chunk_size":562,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  77,
  '### Incident Management',
  '{"section_title":"Incident Management","section_level":3,"chunk_size":23,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  78,
  '#### Incident Classification

**Severity Levels**:

| Severity | Response Time | Escalation | Examples |
|----------|---------------|------------|----------|
| **P0 - Critical** | 15 minutes | Immediate C-level | Data breach, system down |
| **P1 - High** | 1 hour | Management notification | Security incident, partial outage |
| **P2 - Medium** | 4 hours | Team lead notification | Performance degradation |
| **P3 - Low** | 24 hours | Standard assignment | Minor issues, requests |

**Category Classification**:
- **Security Incident**: Unauthorized access, malware, data loss
- **Operational Issue**: System failure, performance problem
- **Service Request**: User requests, access changes
- **Change Management**: Planned modifications, updates',
  '{"section_title":"Incident Classification","section_level":4,"chunk_size":749,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  79,
  '#### Response Workflow

**Incident Lifecycle**:
1. **Detection/Reporting**: Automated alert or user report
2. **Initial Assessment**: Severity and category assignment
3. **Assignment**: Route to appropriate response team
4. **Investigation**: Root cause analysis and evidence collection
5. **Containment**: Immediate threat mitigation
6. **Eradication**: Threat removal and system hardening
7. **Recovery**: Service restoration and validation
8. **Post-Incident**: Lessons learned and process improvement',
  '{"section_title":"Response Workflow","section_level":4,"chunk_size":504,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  80,
  '### Document Management',
  '{"section_title":"Document Management","section_level":3,"chunk_size":23,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  81,
  '#### Document Classification

**Classification Levels**:

| Level | Access Control | Handling Requirements | Examples |
|-------|----------------|----------------------|----------|
| **Public** | No restrictions | Standard distribution | Marketing materials, public policies |
| **Internal** | Employee access | Internal use only | Procedures, internal communications |
| **Confidential** | Need-to-know | Restricted distribution | Financial data, strategic plans |
| **Restricted** | Authorized personnel | Special handling | Security procedures, PII data |',
  '{"section_title":"Document Classification","section_level":4,"chunk_size":558,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  82,
  '#### Version Control & Lifecycle

**Document Lifecycle**:
- **Draft**: Document creation and initial review
- **Review**: Stakeholder review and approval process
- **Published**: Active document available for use
- **Archived**: Historical record, superseded by newer version
- **Retired**: No longer relevant, maintained for compliance

---',
  '{"section_title":"Version Control & Lifecycle","section_level":4,"chunk_size":341,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  83,
  '## Admin & Analytics',
  '{"section_title":"Admin & Analytics","section_level":2,"chunk_size":20,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  84,
  '### User Management',
  '{"section_title":"User Management","section_level":3,"chunk_size":19,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  85,
  '#### Role-Based Access Control (RBAC)

**Permission Matrix**:

| Module | Admin | Risk Mgr | Compliance | Analyst | Viewer |
|--------|-------|----------|------------|---------|--------|
| **Dashboard** | R/W | R/W | R/W | R/W | R |
| **Risk Management** | R/W | R/W | R | R | R |
| **Threat Intel** | R/W | R/W | R | R/W | R |
| **Compliance** | R/W | R | R/W | R | R |
| **Operations** | R/W | R | R | R/W | R |
| **Admin Panel** | R/W | - | - | - | - |
| **AI Assistant** | R/W | R/W | R/W | R/W | R |

**Permission Types**:
- **R**: Read access to module data
- **W**: Write access (create, update, delete)
- **-**: No access to module',
  '{"section_title":"Role-Based Access Control (RBAC)","section_level":4,"chunk_size":639,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  86,
  '#### User Provisioning

**Account Lifecycle**:
1. **Request**: Role-appropriate access request
2. **Approval**: Manager and system administrator approval
3. **Provisioning**: Account creation with appropriate permissions
4. **Validation**: Access testing and user notification
5. **Monitoring**: Regular access review and validation
6. **Deprovisioning**: Account deactivation upon role change/departure',
  '{"section_title":"User Provisioning","section_level":4,"chunk_size":403,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  87,
  '### AI Provider Management',
  '{"section_title":"AI Provider Management","section_level":3,"chunk_size":26,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  88,
  '#### Multi-Provider Configuration

**Supported Providers**:

| Provider | Models Available | Use Cases | Cost Structure |
|----------|------------------|-----------|----------------|
| **OpenAI** | GPT-4, GPT-3.5-turbo | Complex analysis, reasoning | Per token |
| **Anthropic** | Claude 3 (Opus, Sonnet, Haiku) | Long-context tasks | Per token |
| **Google** | Gemini Pro, Gemini Pro Vision | Multimodal analysis | Per request |
| **Azure AI** | GPT-4, Custom models | Enterprise deployment | Per token |
| **Cloudflare** | Llama 3.1 (8B, 70B) | Always-available fallback | Included |',
  '{"section_title":"Multi-Provider Configuration","section_level":4,"chunk_size":585,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  89,
  '#### Provider Selection Logic

**Automatic Routing Factors**:
- **Query Complexity**: Syntax analysis and context requirements
- **Response Time Requirements**: User urgency indicators
- **Cost Optimization**: Token usage and provider pricing
- **Provider Availability**: Health checks and failover logic
- **Model Capabilities**: Task-specific model strengths',
  '{"section_title":"Provider Selection Logic","section_level":4,"chunk_size":360,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  90,
  '### System Analytics',
  '{"section_title":"System Analytics","section_level":3,"chunk_size":20,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  91,
  '#### Performance Metrics

**Key Performance Indicators**:

| Metric | Target | Measurement | Alert Threshold |
|--------|--------|-------------|----------------|
| **Response Time** | <200ms | 95th percentile | >500ms |
| **Availability** | 99.9% | Monthly uptime | <99.5% |
| **Error Rate** | <0.1% | Failed requests | >1% |
| **AI Response Quality** | >90% | User feedback | <80% |
| **Database Performance** | <50ms | Query execution | >100ms |

**Analytics Dashboard**:
- Real-time performance monitoring
- Usage trend analysis
- Cost optimization recommendations
- Capacity planning insights
- User behavior analytics',
  '{"section_title":"Performance Metrics","section_level":4,"chunk_size":622,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  92,
  '#### Cost Management

**Cost Tracking Categories**:
- **AI Provider Costs**: Token usage and API calls
- **Infrastructure Costs**: Cloudflare services (D1, R2, Workers)
- **Operational Costs**: Monitoring, backup, support
- **Compliance Costs**: Audit, certification, legal

**Optimization Strategies**:
- AI provider selection optimization
- Caching strategy implementation
- Query optimization and batching
- Resource usage monitoring
- Cost allocation by department/project

---',
  '{"section_title":"Cost Management","section_level":4,"chunk_size":481,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  93,
  '## API Reference',
  '{"section_title":"API Reference","section_level":2,"chunk_size":16,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  94,
  '### Authentication',
  '{"section_title":"Authentication","section_level":3,"chunk_size":18,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  95,
  '#### JWT Token Management

**Token Structure**:
```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "string",
    "username": "string", 
    "role": "admin|risk_manager|compliance|analyst|viewer",
    "permissions": ["array", "of", "permissions"],
    "exp": timestamp,
    "iat": timestamp
  }
}
```

**Authentication Flow**:
1. **Login**: POST `/auth/login` with credentials
2. **Token Response**: JWT token and refresh token
3. **Request Authorization**: Include `Authorization: Bearer <token>` header
4. **Token Refresh**: POST `/auth/refresh` with refresh token
5. **Logout**: POST `/auth/logout` to invalidate tokens',
  '{"section_title":"JWT Token Management","section_level":4,"chunk_size":672,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  96,
  '### Core Endpoints',
  '{"section_title":"Core Endpoints","section_level":3,"chunk_size":18,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  97,
  '#### Risk Management API

**Get Risk Summary**:
```http
GET /api/risks/summary
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "total_risks": 8,
    "critical": 0,
    "high": 0, 
    "medium": 0,
    "low": 8,
    "average_score": 35.2,
    "trend": "stable"
  }
}
```

**Create Risk**:
```http
POST /api/risks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Data Breach Risk",
  "description": "Risk of unauthorized data access",
  "category": "cybersecurity",
  "probability": 30,
  "impact": 80,
  "owner": "user@company.com"
}
```',
  '{"section_title":"Risk Management API","section_level":4,"chunk_size":593,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  98,
  '#### AI Assistant API

**Chat Interaction**:
```http
POST /ai/chat-json
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are my current risks?",
  "session_id": "optional-session-id"
}

Response:
{
  "response": "AI-generated response text",
  "model": "provider-model-used",
  "confidence": "High|Medium|Low",
  "source": "Live Platform Data",
  "processing_time_ms": 1234
}
```',
  '{"section_title":"AI Assistant API","section_level":4,"chunk_size":413,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  99,
  '#### Threat Intelligence API

**IOC Query**:
```http
GET /api/threat-intelligence/iocs?type=ip&value=192.168.1.1
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "indicator": "192.168.1.1",
    "type": "ip",
    "confidence": 85,
    "source": "CISA KEV",
    "first_seen": "2024-12-01T00:00:00Z",
    "last_seen": "2024-12-08T00:00:00Z",
    "campaigns": ["APT28-2024"],
    "attribution": "Nation-state"
  }
}
```',
  '{"section_title":"Threat Intelligence API","section_level":4,"chunk_size":444,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  100,
  '### Error Handling

**Standard Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error details"
    },
    "timestamp": "2024-12-08T12:00:00Z",
    "request_id": "unique-request-identifier"
  }
}
```

**Common Error Codes**:
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request data validation failure
- `RESOURCE_NOT_FOUND`: Requested resource doesn''t exist
- `RATE_LIMIT_EXCEEDED`: Too many requests from user
- `INTERNAL_ERROR`: Unexpected server error

---',
  '{"section_title":"Error Handling","section_level":3,"chunk_size":700,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  101,
  '## Security & Best Practices',
  '{"section_title":"Security & Best Practices","section_level":2,"chunk_size":28,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  102,
  '### Security Architecture',
  '{"section_title":"Security Architecture","section_level":3,"chunk_size":25,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  103,
  '#### Defense in Depth

**Security Layers**:
1. **Edge Protection**: Cloudflare DDoS protection, WAF
2. **Application Security**: CSRF tokens, input validation
3. **Authentication**: JWT tokens, multi-factor authentication
4. **Authorization**: Role-based access control (RBAC)
5. **Data Protection**: Encryption at rest and in transit
6. **Monitoring**: Real-time security event correlation',
  '{"section_title":"Defense in Depth","section_level":4,"chunk_size":390,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  104,
  '#### Data Protection

**Encryption Standards**:
- **In Transit**: TLS 1.3 for all communications
- **At Rest**: AES-256 encryption for database storage
- **Application**: bcrypt for password hashing (cost factor 12)
- **Tokens**: HMAC-SHA256 for JWT signing

**Data Classification**:
- **Public**: Marketing materials, public documentation
- **Internal**: Employee directory, internal procedures
- **Confidential**: Risk assessments, threat intelligence
- **Restricted**: Authentication credentials, encryption keys',
  '{"section_title":"Data Protection","section_level":4,"chunk_size":515,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  105,
  '### Best Practices',
  '{"section_title":"Best Practices","section_level":3,"chunk_size":18,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  106,
  '#### User Security

**Password Requirements**:
- Minimum 12 characters length
- Mix of uppercase, lowercase, numbers, symbols
- No common dictionary words or patterns
- Regular password rotation (90 days)
- No password reuse (last 12 passwords)

**Session Management**:
- JWT token expiration: 8 hours
- Refresh token expiration: 30 days
- Automatic logout on browser close
- Concurrent session limits by role
- Session monitoring and anomaly detection',
  '{"section_title":"User Security","section_level":4,"chunk_size":452,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  107,
  '#### API Security

**Request Validation**:
- Input sanitization and validation
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection for state-changing operations
- Rate limiting (100 requests/minute per user)

**Response Security**:
- Sensitive data masking in logs
- Error message sanitization
- Response header security controls
- Content type validation
- Data size limits and pagination',
  '{"section_title":"API Security","section_level":4,"chunk_size":441,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  108,
  '### Compliance Considerations',
  '{"section_title":"Compliance Considerations","section_level":3,"chunk_size":29,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  109,
  '#### Data Privacy

**GDPR Compliance**:
- Lawful basis for processing personal data
- Data subject rights implementation (access, rectification, erasure)
- Privacy by design and default
- Data protection impact assessments
- Breach notification procedures (72-hour requirement)

**Data Retention**:
- Risk data: 7 years retention for audit purposes
- Threat intelligence: 2 years for historical analysis
- User activity logs: 1 year for security investigation
- Audit logs: 7 years for compliance requirements
- Backup data: Encrypted storage with automated deletion

---',
  '{"section_title":"Data Privacy","section_level":4,"chunk_size":571,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  110,
  '## Troubleshooting',
  '{"section_title":"Troubleshooting","section_level":2,"chunk_size":18,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  111,
  '### Common Issues',
  '{"section_title":"Common Issues","section_level":3,"chunk_size":17,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  112,
  '#### Authentication Problems

**Symptom**: Unable to login or frequent session timeouts

**Possible Causes**:
- Expired JWT tokens
- Browser cache issues  
- Network connectivity problems
- Account locked due to failed attempts

**Resolution Steps**:
1. Clear browser cache and cookies
2. Verify network connectivity to platform
3. Check for account lockout notifications
4. Contact administrator for password reset
5. Verify correct URL and environment',
  '{"section_title":"Authentication Problems","section_level":4,"chunk_size":453,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  113,
  '#### Performance Issues

**Symptom**: Slow page loads or API responses

**Troubleshooting Process**:
1. **Client-Side Issues**:
   - Check browser developer tools for errors
   - Verify stable internet connection
   - Disable browser extensions temporarily
   - Try different browser or incognito mode

2. **Network Issues**:
   - Ping platform URL to check connectivity
   - Check for CDN or DNS resolution problems
   - Verify corporate firewall/proxy settings

3. **Server-Side Issues**:
   - Monitor platform status page
   - Check for scheduled maintenance windows
   - Verify database connectivity
   - Review application performance metrics',
  '{"section_title":"Performance Issues","section_level":4,"chunk_size":647,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  114,
  '#### Data Inconsistencies

**Symptom**: Incorrect risk counts or missing data

**Investigation Steps**:
1. **Verify Data Source**:
   - Check database synchronization status
   - Validate data import/export processes
   - Review recent system changes

2. **Check Permissions**:
   - Verify user role and data access permissions
   - Check for data filtering based on user context
   - Validate organizational hierarchy access

3. **System Integrity**:
   - Run data consistency checks
   - Review audit logs for unauthorized changes
   - Check for concurrent modification conflicts',
  '{"section_title":"Data Inconsistencies","section_level":4,"chunk_size":581,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  115,
  '### Error Reference',
  '{"section_title":"Error Reference","section_level":3,"chunk_size":19,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  116,
  '#### HTTP Status Codes

| Code | Meaning | Common Causes | Resolution |
|------|---------|---------------|------------|
| **400** | Bad Request | Invalid input data | Validate request format and parameters |
| **401** | Unauthorized | Missing/invalid authentication | Re-authenticate or refresh token |
| **403** | Forbidden | Insufficient permissions | Contact admin for role/permission review |
| **404** | Not Found | Resource doesn''t exist | Verify URL and resource availability |
| **429** | Too Many Requests | Rate limit exceeded | Reduce request frequency or contact admin |
| **500** | Internal Server Error | System malfunction | Contact support with request details |',
  '{"section_title":"HTTP Status Codes","section_level":4,"chunk_size":678,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  117,
  '#### AI Assistant Issues

**Symptom**: ARIA providing incorrect or outdated information

**Resolution**:
1. **Verify Data Currency**:
   - Check platform data synchronization
   - Validate RAG knowledge base updates
   - Review recent system changes affecting data

2. **AI Provider Status**:
   - Check AI provider availability and health
   - Verify API key configuration
   - Test failover to backup providers

3. **Query Optimization**:
   - Rephrase queries for clarity
   - Provide more specific context
   - Use structured query formats',
  '{"section_title":"AI Assistant Issues","section_level":4,"chunk_size":543,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  118,
  '### Support Escalation',
  '{"section_title":"Support Escalation","section_level":3,"chunk_size":22,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  119,
  '#### Internal Support Process

**Level 1 - Self-Service**:
- Platform documentation review
- Knowledge base search
- Community forums (if available)
- Basic troubleshooting steps

**Level 2 - Help Desk**:
- Ticket submission with detailed issue description
- Remote assistance for configuration issues
- Account and permission management
- Basic technical support

**Level 3 - Engineering**:
- Complex technical issues requiring code changes
- Performance optimization and tuning
- Integration and customization support
- Security incident response',
  '{"section_title":"Internal Support Process","section_level":4,"chunk_size":548,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  120,
  '#### Information Required for Support

**Ticket Information**:
- User account and role details
- Specific error messages and codes
- Steps to reproduce the issue
- Browser and system information
- Screenshots or screen recordings
- Expected vs. actual behavior description

---',
  '{"section_title":"Information Required for Support","section_level":4,"chunk_size":277,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  121,
  '## Appendices',
  '{"section_title":"Appendices","section_level":2,"chunk_size":13,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  122,
  '### Appendix A: Keyboard Shortcuts

| Shortcut | Action | Module |
|----------|--------|--------|
| `Ctrl+/` | Open AI Assistant | Global |
| `Ctrl+K` | Global search | Global |
| `Ctrl+D` | Navigate to Dashboard | Global |
| `Ctrl+R` | Navigate to Risk Management | Global |
| `Ctrl+T` | Navigate to Threat Intelligence | Global |
| `Ctrl+C` | Navigate to Compliance | Global |
| `Ctrl+O` | Navigate to Operations | Global |
| `Ctrl+A` | Navigate to Admin (if permitted) | Global |
| `Escape` | Close modal or overlay | Global |',
  '{"section_title":"Appendix A: Keyboard Shortcuts","section_level":3,"chunk_size":529,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  123,
  '### Appendix B: Data Schema Reference',
  '{"section_title":"Appendix B: Data Schema Reference","section_level":3,"chunk_size":37,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  124,
  '#### Risk Data Model

```sql
CREATE TABLE risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  impact INTEGER CHECK (impact >= 0 AND impact <= 100),
  risk_score REAL GENERATED ALWAYS AS (
    CAST(probability AS REAL) * CAST(impact AS REAL) / 100.0
  ) STORED,
  status TEXT DEFAULT ''active'' CHECK (status IN (''active'', ''mitigated'', ''closed'')),
  owner TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```',
  '{"section_title":"Risk Data Model","section_level":4,"chunk_size":600,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  125,
  '#### Threat Intelligence Model

```sql
CREATE TABLE threat_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_value TEXT NOT NULL,
  indicator_type TEXT NOT NULL CHECK (
    indicator_type IN (''ip'', ''domain'', ''url'', ''hash'', ''email'')
  ),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source TEXT NOT NULL,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  tags TEXT, -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```',
  '{"section_title":"Threat Intelligence Model","section_level":4,"chunk_size":582,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  126,
  '### Appendix C: Integration Specifications',
  '{"section_title":"Appendix C: Integration Specifications","section_level":3,"chunk_size":42,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  127,
  '#### STIX/TAXII Integration

**Supported STIX Objects**:
- Indicator
- Malware
- Attack Pattern
- Threat Actor
- Campaign
- Intrusion Set
- Vulnerability
- Observed Data

**TAXII 2.1 Endpoints**:
- Discovery: `/taxii2/`
- API Root: `/taxii2/api/`
- Collections: `/taxii2/api/collections/`
- Objects: `/taxii2/api/collections/{id}/objects/`',
  '{"section_title":"STIX/TAXII Integration","section_level":4,"chunk_size":339,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  128,
  '#### Webhook Configuration

**Supported Events**:
- Risk creation/modification
- Threat indicator updates
- Compliance status changes
- Incident creation/resolution
- User activity events

**Webhook Format**:
```json
{
  "event_type": "risk.created",
  "timestamp": "2024-12-08T12:00:00Z",
  "data": {
    "risk_id": 123,
    "title": "New Risk Identified",
    "severity": "high",
    "owner": "user@company.com"
  },
  "signature": "webhook-signature-for-verification"
}
```',
  '{"section_title":"Webhook Configuration","section_level":4,"chunk_size":476,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  129,
  '### Appendix D: Compliance Mapping',
  '{"section_title":"Appendix D: Compliance Mapping","section_level":3,"chunk_size":34,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  130,
  '#### SOC 2 to Platform Features

| SOC 2 Control | Platform Feature | Implementation Notes |
|---------------|------------------|---------------------|
| CC1.1 | User role management | RBAC implementation |
| CC1.2 | Board oversight | Admin dashboard and reporting |
| CC1.3 | Management structure | Organizational hierarchy |
| CC6.1 | Logical access | Authentication system |
| CC6.2 | Access authorization | Permission matrix |
| CC6.3 | Access removal | User lifecycle management |
| CC7.1 | System boundaries | Asset classification |
| CC8.1 | Change management | Audit logging |',
  '{"section_title":"SOC 2 to Platform Features","section_level":4,"chunk_size":584,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  131,
  '#### ISO 27001 Control Mapping

| ISO Control | Platform Implementation | Evidence Collection |
|-------------|------------------------|-------------------|
| A.9.1.1 | Access control policy | Policy documentation |
| A.9.1.2 | Network access control | Network monitoring logs |
| A.9.2.1 | User registration | User provisioning records |
| A.9.2.2 | User access provisioning | Role assignment logs |
| A.9.2.3 | Management of privileged access | Admin activity monitoring |
| A.12.1.1 | Operating procedures | System documentation |
| A.12.6.1 | Management of vulnerabilities | Vulnerability scan results |

---',
  '{"section_title":"ISO 27001 Control Mapping","section_level":4,"chunk_size":612,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);

INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  132,
  '## Document Information

**Document Control**:
- **Version**: 1.0
- **Classification**: Internal Use
- **Owner**: ARIA5 Platform Team
- **Review Frequency**: Quarterly
- **Next Review**: March 8, 2025
- **Distribution**: All platform users

**Change History**:

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-08 | Initial comprehensive guide creation | ARIA5 Platform Team |

**Approval**:
- **Technical Review**: Platform Engineering Team
- **Security Review**: Information Security Team  
- **Business Review**: Risk Management Team
- **Final Approval**: Platform Product Owner

---

*This document is proprietary and confidential. Distribution outside the organization requires explicit authorization from the document owner.*',
  '{"section_title":"Document Information","section_level":2,"chunk_size":774,"total_chunks_in_section":1,"document_type":"user_guide","version":"1.0","created_date":"2024-12-08"}'
);
