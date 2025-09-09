-- Insert ARIA5.1 User Guide into RAG database
INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Platform Overview',
  'ARIA5.1 is an enterprise-grade risk intelligence platform that combines advanced AI/ML analytics with comprehensive security operations. The platform provides real-time risk assessment, threat intelligence, and compliance monitoring capabilities built on Cloudflare''s edge infrastructure for sub-100ms response times globally.',
  'user_guide',
  '{"version": "5.1.0", "section": "platform_overview", "classification": "internal_use", "source": "internal_documentation"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 AI/ML Rating Systems',
  'ARIA5.1 employs sophisticated multi-factor risk scoring algorithms combining traditional assessment with AI enhancement. Base Risk Score = (Probability × Impact × Context Multiplier) + AI Enhancement. Risk severity classifications: Critical (90-100), High (70-89), Medium (40-69), Low (1-39). AI Enhancement factors include threat intelligence context, historical pattern analysis, and business context adjustments.',
  'user_guide',
  '{"version": "5.1.0", "section": "ai_ml_ratings", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Risk Management System',
  'The platform provides comprehensive risk lifecycle management from identification through resolution. Risk creation supports manual entry, AI-assisted creation, and automated discovery. The assessment algorithm uses multi-dimensional evaluation including contextual analysis, threat correlation, asset impact, business context, and regulatory impact. Risk monitoring includes automated correlation with threat intelligence and compliance drift detection.',
  'user_guide',
  '{"version": "5.1.0", "section": "risk_management", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA AI Assistant Capabilities',
  'ARIA provides intelligent, context-aware responses about security posture, risks, and operations. Core functions include risk analysis, threat intelligence, compliance guidance, and operational support. The assistant uses intelligent routing across multiple AI providers: OpenAI GPT-4, Anthropic Claude, Google Gemini, Azure AI Foundry, and Cloudflare Llama3. Query complexity analysis determines optimal model selection for accuracy and cost-effectiveness.',
  'user_guide',
  '{"version": "5.1.0", "section": "ai_assistant", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Threat Intelligence System',
  'The platform provides comprehensive threat intelligence lifecycle from collection through action. IOC confidence scoring uses weighted averages of source reliability, validation scores, and context scores. Campaign attribution uses TTPs matching, infrastructure analysis, timeline correlation, and victimology profiling. Behavioral analytics includes anomaly detection, machine learning models, and automated threat hunting capabilities.',
  'user_guide',
  '{"version": "5.1.0", "section": "threat_intelligence", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Compliance Management',
  'The platform supports multiple compliance frameworks including SOC 2, ISO 27001, NIST Cybersecurity Framework, and PCI DSS. Compliance scoring uses control implementation effectiveness, evidence quality, testing results, and maturity levels. Framework compliance calculation: Σ(Control Weight × Control Score) / Total Possible Score × 100. Features include automated assessment, continuous monitoring, gap analysis, and audit support.',
  'user_guide',
  '{"version": "5.1.0", "section": "compliance_management", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 AI Provider Management',
  'The platform integrates multiple AI providers for optimal performance and reliability. Provider selection algorithm considers query complexity, provider availability, user preferences, cost considerations, and performance requirements. Supported providers: OpenAI GPT-4 (complex analysis), Anthropic Claude (safety-focused), Google Gemini (multimodal), Azure AI Foundry (enterprise), Cloudflare Llama3 (fallback). Performance monitoring tracks response times, quality metrics, and cost analysis.',
  'user_guide',
  '{"version": "5.1.0", "section": "ai_provider_management", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Dashboard and Analytics',
  'The main dashboard provides real-time security posture visibility through AI-powered analytics. Key metrics include risk metrics (total active risks, critical count, average score), threat intelligence metrics (active IOCs, high-confidence threats, campaign attributions), compliance metrics (overall percentage, control implementation rate), and operational metrics (asset coverage, service availability). AI-powered insights provide risk predictions, threat forecasting, and performance optimization recommendations.',
  'user_guide',
  '{"version": "5.1.0", "section": "dashboard_analytics", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Operations Center',
  'The Operations Center provides comprehensive asset management and service monitoring. Asset categories include hardware, software, data, people, and processes. Classification dimensions: criticality (Critical/High/Medium/Low), confidentiality (Public/Internal/Confidential/Restricted), integrity requirements, and availability requirements. Service management includes SLA monitoring, incident management, and change management processes.',
  'user_guide',
  '{"version": "5.1.0", "section": "operations_center", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 API Reference and Integration',
  'ARIA5.1 provides comprehensive REST API for external integrations. Base URL: https://api.aria51.pages.dev/v1. Authentication supports API keys and JWT tokens. Core endpoints include Risk Management API (CRUD operations), Threat Intelligence API (IOC management), AI Assistant API (chat queries), and Compliance API (framework status). Rate limits: Standard (1000/hour), AI (100/hour), Bulk (10/minute). Webhook support for real-time event notifications.',
  'user_guide',
  '{"version": "5.1.0", "section": "api_reference", "classification": "internal_use"}',
  datetime('now')
);

INSERT INTO rag_documents (title, content, document_type, metadata, created_at) VALUES (
  'ARIA5.1 Troubleshooting and Support',
  'Common issues include authentication problems (verify credentials, check session timeout), performance issues (check network, clear cache, verify AI provider status), data issues (validate risk calculations, check feed connectivity), and integration issues (verify API keys, check webhook delivery). Diagnostic tools include system health checks, log analysis, and performance monitoring. Support channels include technical support (24/7 for critical), documentation, community forums, and training services.',
  'user_guide',
  '{"version": "5.1.0", "section": "troubleshooting", "classification": "internal_use"}',
  datetime('now')
);