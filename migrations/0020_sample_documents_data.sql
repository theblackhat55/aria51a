-- Sample Documents Data for Testing
-- Add some sample documents to demonstrate the document management functionality

-- Insert sample documents (assuming user ID 1 exists)
INSERT OR IGNORE INTO documents (
  document_id, file_name, original_file_name, file_path, file_size, mime_type, file_hash,
  uploaded_by, title, description, document_type, tags, version, visibility,
  access_permissions, status, is_active, download_count,
  upload_date, created_at, updated_at
) VALUES 
-- Risk Management Policy
('doc-sample-001-risk-policy', 'Risk_Management_Policy_v2.pdf', 'Risk Management Policy v2.0.pdf', 
 'documents/sample/risk-policy.pdf', 524288, 'application/pdf', 
 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6',
 1, 'Risk Management Policy', 'Comprehensive organizational risk management policy document', 
 'policy', '["risk-management", "governance", "policy"]', '2.0', 'public', 
 '["admin", "risk-manager"]', 'active', 1, 0,
 datetime('now', '-30 days'), datetime('now', '-30 days'), datetime('now', '-30 days')),

-- Data Protection Procedure
('doc-sample-002-data-protection', 'Data_Protection_Procedure.pdf', 'Data Protection Procedure.pdf',
 'documents/sample/data-protection.pdf', 387200, 'application/pdf',
 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7',
 1, 'Data Protection Procedure', 'Standard operating procedure for data protection and privacy compliance',
 'procedure', '["data-protection", "privacy", "gdpr", "compliance"]', '1.5', 'restricted',
 '["admin", "data-protection-officer"]', 'active', 1, 5,
 datetime('now', '-20 days'), datetime('now', '-20 days'), datetime('now', '-20 days')),

-- Security Incident Report Template
('doc-sample-003-incident-template', 'Security_Incident_Report_Template.docx', 'Security Incident Report Template.docx',
 'documents/sample/incident-template.docx', 156742, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8',
 1, 'Security Incident Report Template', 'Template for reporting security incidents and breaches',
 'report', '["security", "incident", "template", "report"]', '1.0', 'public',
 '["admin", "security-team", "incident-responder"]', 'active', 1, 12,
 datetime('now', '-15 days'), datetime('now', '-15 days'), datetime('now', '-15 days')),

-- Compliance Audit Checklist
('doc-sample-004-audit-checklist', 'Compliance_Audit_Checklist.xlsx', 'Compliance Audit Checklist.xlsx',
 'documents/sample/audit-checklist.xlsx', 89456, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9',
 1, 'Compliance Audit Checklist', 'Comprehensive checklist for conducting compliance audits',
 'other', '["compliance", "audit", "checklist", "iso27001"]', '3.1', 'private',
 '["admin", "auditor", "compliance-manager"]', 'active', 1, 8,
 datetime('now', '-10 days'), datetime('now', '-10 days'), datetime('now', '-10 days')),

-- Business Continuity Plan
('doc-sample-005-bcp', 'Business_Continuity_Plan.pdf', 'Business Continuity Plan - 2024.pdf',
 'documents/sample/bcp-2024.pdf', 678912, 'application/pdf',
 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0',
 1, 'Business Continuity Plan 2024', 'Updated business continuity and disaster recovery plan for 2024',
 'policy', '["business-continuity", "disaster-recovery", "bcp", "operations"]', '4.0', 'restricted',
 '["admin", "bcp-coordinator", "executive"]', 'active', 1, 3,
 datetime('now', '-5 days'), datetime('now', '-5 days'), datetime('now', '-5 days')),

-- Training Certificate
('doc-sample-006-certificate', 'ISO27001_Training_Certificate.pdf', 'ISO 27001 Lead Auditor Certificate.pdf',
 'documents/sample/iso27001-cert.pdf', 245760, 'application/pdf',
 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1',
 1, 'ISO 27001 Lead Auditor Certificate', 'Professional certification for ISO 27001 lead auditor training',
 'certificate', '["iso27001", "training", "certificate", "audit"]', '1.0', 'private',
 '["admin"]', 'active', 1, 1,
 datetime('now', '-2 days'), datetime('now', '-2 days'), datetime('now', '-2 days'));

-- Insert sample document access logs
INSERT OR IGNORE INTO document_access_log (
  document_id, user_id, action, ip_address, user_agent, accessed_at
) VALUES 
-- Access logs for the documents above
(1, 1, 'view', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-1 day')),
(1, 1, 'download', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-1 day')),
(2, 1, 'view', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-12 hours')),
(3, 1, 'download', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-6 hours')),
(3, 1, 'view', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-6 hours')),
(4, 1, 'view', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-4 hours')),
(5, 1, 'view', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-2 hours')),
(6, 1, 'download', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-1 hour'));