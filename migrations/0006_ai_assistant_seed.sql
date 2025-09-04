-- AI Assistant Seed Data for ARIA5.1
-- Initial configuration and sample RAG documents

-- System configuration for AI assistant
INSERT OR IGNORE INTO system_configuration (key, value, description, is_public) VALUES
  ('rag_enabled', 'true', 'Enable RAG (Retrieval Augmented Generation) for AI responses', 0),
  ('ai_model', 'gpt-4', 'Default AI model for generating responses', 0),
  ('max_context_tokens', '8000', 'Maximum tokens for context window', 0),
  ('response_timeout_ms', '30000', 'AI response timeout in milliseconds', 0),
  ('enable_chat_history', 'true', 'Store AI chat conversations for analysis', 0),
  ('ai_system_prompt', 'You are ARIA, an AI assistant specialized in governance, risk management, and compliance. Provide accurate, actionable guidance based on the provided context.', 'System prompt for AI responses', 0);

-- Sample RAG documents - Risk Management Policies
INSERT OR IGNORE INTO rag_documents (title, content, document_type, metadata, organization_id, uploaded_by) VALUES
  (
    'Risk Assessment Framework',
    'Risk Assessment Framework\n\nPurpose: This framework establishes the methodology for identifying, analyzing, and evaluating risks across the organization.\n\nRisk Categories:\n1. Cybersecurity Risks - Threats to information systems and data\n2. Operational Risks - Business process and operational failures\n3. Financial Risks - Market, credit, and liquidity risks\n4. Compliance Risks - Regulatory and legal compliance failures\n5. Strategic Risks - Business strategy and planning risks\n\nRisk Scoring:\n- Probability: Scale 1-5 (1=Very Low, 5=Very High)\n- Impact: Scale 1-5 (1=Minimal, 5=Catastrophic)\n- Risk Score = Probability × Impact\n- Critical: Score 20-25\n- High: Score 12-19\n- Medium: Score 6-11\n- Low: Score 1-5\n\nMitigation Strategies:\n- Accept: Risk level acceptable, no action required\n- Avoid: Eliminate the risk source or activity\n- Mitigate: Reduce probability or impact\n- Transfer: Insurance or outsourcing',
    'policy',
    '{"version": "2.1", "effective_date": "2024-01-01", "review_date": "2024-12-31", "category": "risk_management"}',
    1,
    1
  ),
  (
    'Information Security Policy',
    'Information Security Policy\n\nScope: This policy applies to all employees, contractors, and third parties accessing organizational information systems.\n\nData Classification:\n- Public: Information that can be freely shared\n- Internal: Information for internal use only\n- Confidential: Sensitive business information\n- Restricted: Highly sensitive data requiring special protection\n\nAccess Controls:\n- Principle of least privilege\n- Role-based access control (RBAC)\n- Multi-factor authentication (MFA) required for privileged accounts\n- Regular access reviews quarterly\n\nIncident Response:\n1. Detect and report security incidents immediately\n2. Contain and isolate affected systems\n3. Assess impact and gather evidence\n4. Remediate vulnerabilities\n5. Document lessons learned\n\nCompliance Requirements:\n- ISO 27001:2013 alignment\n- GDPR data protection requirements\n- SOC 2 Type II controls\n- Industry-specific regulations',
    'policy',
    '{"classification": "internal", "owner": "CISO", "next_review": "2024-06-01", "category": "security"}',
    1,
    1
  ),
  (
    'Business Continuity Plan',
    'Business Continuity Plan\n\nObjective: Ensure critical business functions can continue during and after disruptive events.\n\nCritical Business Functions:\n1. Customer Service Operations (RTO: 4 hours, RPO: 1 hour)\n2. Financial Transactions (RTO: 2 hours, RPO: 15 minutes)\n3. Data Processing Systems (RTO: 8 hours, RPO: 4 hours)\n4. Communication Systems (RTO: 1 hour, RPO: 30 minutes)\n\nDisaster Recovery Strategies:\n- Primary data center with full redundancy\n- Secondary site with 50% capacity\n- Cloud-based backup systems\n- Mobile recovery units for critical staff\n\nActivation Triggers:\n- Natural disasters (earthquake, flood, fire)\n- Cyber attacks affecting core systems\n- Pandemic or health emergencies\n- Supply chain disruptions\n- Key personnel unavailability\n\nRecovery Team Roles:\n- Crisis Management Team Leader\n- IT Recovery Coordinator\n- Business Unit Coordinators\n- Communications Manager\n- External Relations Manager',
    'plan',
    '{"last_tested": "2023-09-15", "test_frequency": "semi-annual", "contact_list": "updated", "category": "business_continuity"}',
    1,
    1
  ),
  (
    'Compliance Framework Overview',
    'Compliance Framework Overview\n\nRegulatory Requirements:\n\n1. ISO 27001:2013 - Information Security Management\n   - 114 controls across 14 domains\n   - Annual surveillance audits\n   - Certification renewal every 3 years\n\n2. SOC 2 Type II - Service Organization Controls\n   - Trust Services Criteria: Security, Availability, Confidentiality, Processing Integrity, Privacy\n   - Annual audit by certified CPA firm\n   - Continuous monitoring required\n\n3. GDPR - General Data Protection Regulation\n   - Data protection by design and by default\n   - Privacy impact assessments for high-risk processing\n   - Data breach notification within 72 hours\n   - Regular data protection officer training\n\n4. Industry Standards:\n   - NIST Cybersecurity Framework\n   - CIS Controls v8\n   - OWASP Top 10\n\nCompliance Monitoring:\n- Quarterly compliance assessments\n- Monthly control testing\n- Annual risk assessments\n- Continuous vulnerability scanning\n- Regular employee training and awareness',
    'framework',
    '{"frameworks": ["ISO27001", "SOC2", "GDPR", "NIST"], "last_update": "2024-01-15", "category": "compliance"}',
    1,
    1
  ),
  (
    'Incident Response Procedures',
    'Incident Response Procedures\n\nIncident Classification:\n- P1 Critical: System outage affecting all users (Response: Immediate)\n- P2 High: Security breach or data compromise (Response: 1 hour)\n- P3 Medium: Service degradation affecting some users (Response: 4 hours)\n- P4 Low: Minor issues with workarounds available (Response: 24 hours)\n\nResponse Team:\n- Incident Commander: Overall coordination and decisions\n- Technical Lead: Technical investigation and remediation\n- Communications Lead: Internal and external communications\n- Legal/Compliance: Regulatory notifications and legal issues\n- Business Lead: Business impact assessment and user communication\n\nResponse Process:\n1. Detection and Reporting (0-15 minutes)\n2. Initial Assessment and Classification (15-30 minutes)\n3. Team Assembly and War Room Setup (30-45 minutes)\n4. Investigation and Containment (Ongoing)\n5. Communication Plan Execution (Hourly updates)\n6. Resolution and Recovery (Variable)\n7. Post-Incident Review (Within 48 hours)\n\nEscalation Matrix:\n- P1/P2: Executive leadership notified within 1 hour\n- Data breach: Legal and regulatory notifications as required\n- External impact: Customer communication within 2 hours',
    'procedure',
    '{"version": "3.2", "contact_numbers": "verified", "last_drill": "2023-11-20", "category": "incident_management"}',
    1,
    1
  );

-- Insert sample AI chat history for demonstration
INSERT OR IGNORE INTO ai_chat_history (user_id, session_id, message, response, message_type, processing_time_ms, model_used, confidence_score) VALUES
  (1, 'demo-session-1', 'What are our current high risks?', 'Based on your risk register, you have 3 critical risks requiring immediate attention: 1) Unauthorized database access (Score: 20), 2) Ransomware threat (Score: 16), 3) Third-party vendor breach (Score: 15). I recommend prioritizing the database access controls first.', 'risk_analysis', 1850, 'gpt-4', 0.92),
  (1, 'demo-session-1', 'How is our SOC 2 compliance?', 'Your SOC 2 compliance is currently at 94% with 127 out of 135 controls implemented. The upcoming Type II audit is scheduled for March 31, 2024. You need to remediate 8 controls before the audit, particularly around access management and change control procedures.', 'compliance_check', 2100, 'gpt-4', 0.89),
  (2, 'demo-session-2', 'What security recommendations do you have?', 'Based on your current security posture, I recommend: 1) Implement MFA for all admin accounts (High Priority), 2) Update your incident response plan which is 18 months old (Medium Priority), 3) Conduct quarterly vulnerability assessments (High Priority), 4) Review and update access controls (Medium Priority).', 'recommendations', 1750, 'gpt-4', 0.88);