-- ARIA51A Minimal Seed Data
-- Organizations, Users, and Risks only
-- Password for all users: demo123

-- ========================================
-- 1. ORGANIZATIONS
-- ========================================

INSERT INTO organizations (id, name, description, type, industry, size, country, is_active) VALUES
(1, 'TechCorp International', 'Global technology and cybersecurity company', 'Enterprise', 'Technology', 'Large (1000+ employees)', 'USA', 1),
(2, 'FinanceGuard LLC', 'Financial services and compliance firm', 'Corporate', 'Financial Services', 'Medium (100-999)', 'UK', 1),
(3, 'HealthSecure Systems', 'Healthcare security and compliance provider', 'Enterprise', 'Healthcare', 'Large (1000+ employees)', 'Canada', 1);

-- ========================================
-- 2. DEMO USERS  
-- Password: demo123
-- ========================================

INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active) VALUES
(1, 'admin', 'admin@aria51a.local', 'demo123', 'Admin', 'User', 'admin', 1, 1),
(2, 'riskmanager', 'risk@aria51a.local', 'demo123', 'Sarah', 'Johnson', 'risk_manager', 1, 1),
(3, 'riskanalyst', 'analyst@aria51a.local', 'demo123', 'Michael', 'Chen', 'analyst', 1, 1),
(4, 'compliance', 'compliance@aria51a.local', 'demo123', 'Emma', 'Williams', 'compliance_officer', 2, 1),
(5, 'auditor', 'auditor@aria51a.local', 'demo123', 'James', 'Brown', 'auditor', 2, 1),
(6, 'securitymgr', 'security@aria51a.local', 'demo123', 'David', 'Martinez', 'security_manager', 1, 1),
(7, 'secanalyst', 'secanalyst@aria51a.local', 'demo123', 'Lisa', 'Anderson', 'analyst', 3, 1),
(8, 'user1', 'user1@aria51a.local', 'demo123', 'John', 'Smith', 'user', 1, 1),
(9, 'user2', 'user2@aria51a.local', 'demo123', 'Emily', 'Davis', 'user', 2, 1),
(10, 'user3', 'user3@aria51a.local', 'demo123', 'Robert', 'Wilson', 'user', 3, 1);

-- ========================================
-- 3. SAMPLE RISKS
-- ========================================

INSERT INTO risks (
  title, description, category, subcategory,
  probability, impact, status,
  owner_id, organization_id, created_by,
  review_date, source
) VALUES
-- Critical Risks (Score 20-25)
(
  'Data Breach Through Third-Party Vendor',
  'Potential unauthorized access to customer data through compromised third-party vendor systems. The vendor processes sensitive customer information and has shown security weaknesses in recent assessments.',
  'cybersecurity', 'data_breach',
  5, 5, 'active',
  6, 1, 1,
  date('now', '+30 days'), 'Risk Assessment 2025-Q1'
),
(
  'Ransomware Attack on Critical Infrastructure',
  'Risk of ransomware deployment targeting production systems and backup infrastructure. Recent intelligence indicates increased targeting of our industry sector.',
  'cybersecurity', 'malware',
  4, 5, 'active',
  6, 1, 1,
  date('now', '+14 days'), 'Threat Intelligence Feed'
),
(
  'Regulatory Non-Compliance - GDPR',
  'Current data handling processes may not fully comply with GDPR requirements, particularly around data subject access requests and right to be forgotten implementation.',
  'compliance', 'regulatory',
  4, 5, 'pending',
  4, 2, 2,
  date('now', '+21 days'), 'Compliance Audit 2025'
),

-- High Risks (Score 12-19)
(
  'Insider Threat - Privileged Access Abuse',
  'Risk of data exfiltration or system sabotage by employees or contractors with elevated access privileges. Insufficient monitoring of privileged account activities.',
  'operational', 'insider_threat',
  3, 5, 'active',
  6, 1, 2,
  date('now', '+45 days'), 'Internal Audit'
),
(
  'Cloud Infrastructure Misconfiguration',
  'Improperly configured cloud services exposing sensitive data or creating security vulnerabilities. Recent scans identified multiple S3 buckets with overly permissive access controls.',
  'technology', 'cloud_security',
  4, 4, 'active',
  6, 1, 3,
  date('now', '+30 days'), 'Security Assessment'
),
(
  'Supply Chain Disruption',
  'Potential disruption to critical business operations due to single-source dependencies in supply chain. No backup suppliers identified for key components.',
  'operational', 'supply_chain',
  3, 5, 'monitoring',
  2, 1, 2,
  date('now', '+60 days'), 'Business Continuity Planning'
),
(
  'DDoS Attack on Customer-Facing Services',
  'Distributed Denial of Service attacks targeting public-facing web applications and APIs, potentially causing service outages and revenue loss.',
  'cybersecurity', 'availability',
  4, 4, 'mitigated',
  6, 1, 1,
  date('now', '+90 days'), 'Security Operations'
),

-- Medium Risks (Score 6-11)
(
  'Phishing Campaign Targeting Employees',
  'Ongoing sophisticated phishing campaigns targeting employees with access to financial systems. Recent employee training completion rate below target.',
  'cybersecurity', 'social_engineering',
  4, 3, 'active',
  6, 1, 2,
  date('now', '+30 days'), 'Security Awareness Program'
),
(
  'Legacy System End-of-Life',
  'Critical business application running on unsupported operating system with no vendor patches available. Migration project delayed by 6 months.',
  'technology', 'technical_debt',
  3, 4, 'accepted',
  3, 1, 3,
  date('now', '+180 days'), 'IT Infrastructure Review'
),
(
  'Key Personnel Departure Risk',
  'Loss of critical institutional knowledge due to retirement of senior technical staff. No comprehensive knowledge transfer plan in place.',
  'operational', 'human_resources',
  3, 3, 'active',
  2, 1, 2,
  date('now', '+90 days'), 'HR Risk Assessment'
),
(
  'API Security Vulnerabilities',
  'Multiple RESTful APIs lack proper authentication, rate limiting, and input validation. Penetration testing identified several exploitable endpoints.',
  'technology', 'application_security',
  4, 3, 'active',
  6, 1, 1,
  date('now', '+45 days'), 'Penetration Test Report'
),
(
  'Third-Party Software Supply Chain Attack',
  'Open source dependencies with known vulnerabilities in production applications. Supply chain attacks targeting software libraries.',
  'technology', 'supply_chain',
  3, 3, 'active',
  6, 1, 1,
  date('now', '+60 days'), 'Vulnerability Scan'
),

-- Low Risks (Score 1-5)
(
  'Physical Security - Badge System Aging',
  'Physical access control system nearing end-of-life with occasional badge reader failures. Replacement scheduled for next fiscal year.',
  'operational', 'physical_security',
  2, 3, 'monitoring',
  2, 1, 2,
  date('now', '+120 days'), 'Facilities Management'
),
(
  'Software License Compliance',
  'Potential over-deployment of licensed software without proper tracking. Annual audit approaching with incomplete software inventory.',
  'compliance', 'licensing',
  3, 2, 'active',
  4, 2, 4,
  date('now', '+60 days'), 'Software Asset Management'
),
(
  'Mobile Device Management Gaps',
  'BYOD policy allows personal devices to access corporate email without full MDM enrollment. Limited visibility into device security posture.',
  'technology', 'mobile_security',
  2, 3, 'active',
  6, 1, 6,
  date('now', '+90 days'), 'Mobile Security Review'
),
(
  'Vendor Contract Renewal Delays',
  'Critical security services contracts expiring within 60 days without renewal process initiated. May result in service gaps.',
  'operational', 'vendor_management',
  2, 2, 'pending',
  2, 1, 2,
  date('now', '+30 days'), 'Procurement Review'
),
(
  'Outdated Security Documentation',
  'Security policies and procedures documentation last updated 18 months ago. Does not reflect current practices and controls.',
  'operational', 'documentation',
  2, 2, 'active',
  6, 1, 2,
  date('now', '+90 days'), 'Compliance Review'
);

-- ========================================
-- VERIFICATION
-- ========================================

SELECT COUNT(*) as organization_count FROM organizations;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as risk_count FROM risks;
