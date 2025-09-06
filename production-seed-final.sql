-- Production seed data for dashboard functionality
-- This file populates the production database with sample risks and incidents

-- First, insert risk categories
INSERT OR IGNORE INTO risk_categories (id, name, description, category_type, risk_appetite)
VALUES 
    (1, 'Cybersecurity', 'Information security and cyber threats', 'operational', 'low'),
    (2, 'Financial', 'Financial and market risks', 'financial', 'medium'),
    (3, 'Operational', 'Business operations and process risks', 'operational', 'medium'),
    (4, 'Compliance', 'Regulatory and compliance risks', 'regulatory', 'low'),
    (5, 'Strategic', 'Strategic and business risks', 'strategic', 'high');

-- Insert sample risks with proper foreign key references
INSERT OR IGNORE INTO risks 
(risk_id, title, description, category_id, organization_id, owner_id, status, risk_type, 
 probability, impact, risk_score, root_cause, potential_impact, existing_controls, 
 mitigation_plan, identified_date, last_reviewed, next_review_date, created_by)
VALUES 
    ('RSK-001', 'Data Breach Vulnerability', 
     'Potential unauthorized access to customer data through outdated security protocols', 
     1, 1, 2, 'active', 'security', 
     4, 5, 20, 'Outdated firewall configurations and weak access controls', 
     'Loss of customer data, regulatory fines, reputation damage', 
     'Basic firewall, antivirus software, access logging', 
     'Implement multi-factor authentication, upgrade security infrastructure, conduct security audit',
     '2024-01-15', '2024-08-30', '2024-12-01', 1),
     
    ('RSK-002', 'Supply Chain Disruption', 
     'Risk of critical supplier failure affecting production schedules', 
     3, 1, 4, 'active', 'operational', 
     3, 4, 12, 'Over-reliance on single supplier for critical components', 
     'Production delays, increased costs, customer dissatisfaction', 
     'Supplier contracts, basic inventory management', 
     'Diversify supplier base, implement backup suppliers, increase safety stock',
     '2024-02-10', '2024-09-01', '2024-11-15', 2),
     
    ('RSK-003', 'Regulatory Compliance Gap', 
     'Potential non-compliance with updated industry regulations', 
     4, 1, 5, 'escalated', 'regulatory', 
     2, 4, 8, 'Insufficient monitoring of regulatory changes', 
     'Regulatory fines, operational restrictions, legal issues', 
     'Annual compliance reviews, legal team monitoring', 
     'Implement automated compliance monitoring system, hire compliance specialist',
     '2024-03-05', '2024-09-10', '2024-10-30', 1),
     
    ('RSK-004', 'Market Volatility Impact', 
     'Financial losses due to market fluctuations and economic uncertainty', 
     2, 1, 4, 'active', 'market', 
     4, 3, 12, 'Exposure to volatile market conditions without hedging', 
     'Revenue losses, cash flow problems, investment losses', 
     'Financial monitoring, quarterly reviews', 
     'Implement hedging strategies, diversify investments, improve forecasting',
     '2024-01-20', '2024-08-25', '2024-11-30', 2),
     
    ('RSK-005', 'Technology Infrastructure Failure', 
     'Critical system failure leading to business disruption', 
     1, 1, 2, 'active', 'technology', 
     3, 5, 15, 'Aging infrastructure without proper redundancy', 
     'Business downtime, data loss, customer service disruption', 
     'Regular backups, basic monitoring systems', 
     'Upgrade infrastructure, implement redundancy, disaster recovery plan',
     '2024-02-28', '2024-09-05', '2024-12-15', 1);

-- Check incidents table schema to see if it exists
-- If it exists, insert sample incidents

INSERT OR IGNORE INTO incidents 
(incident_id, title, description, category, severity, status, affected_systems, 
 detection_method, root_cause_analysis, resolution_steps, lessons_learned,
 reported_by, assigned_to, detected_at, resolved_at, created_at)
SELECT 
    'INC-001', 'Unauthorized Access Attempt', 
    'Multiple failed login attempts detected from suspicious IP addresses', 
    'Security', 'high', 'resolved', 'Authentication system, user database',
    'Automated monitoring system alert', 
    'Brute force attack attempt targeting admin accounts',
    'Blocked suspicious IPs, enforced stronger password policies, notified affected users',
    'Need to implement rate limiting and improve monitoring alerts',
    1, 2, '2024-09-01 14:30:00', '2024-09-01 18:45:00', '2024-09-01 14:35:00'
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='incidents')

UNION ALL

SELECT 
    'INC-002', 'Database Performance Degradation', 
    'Significant slowdown in database response times affecting user experience', 
    'Performance', 'medium', 'resolved', 'Production database, web application',
    'Performance monitoring alerts', 
    'Inefficient query execution due to missing indexes',
    'Added database indexes, optimized queries, increased server resources',
    'Regular database performance reviews needed',
    4, 2, '2024-08-28 09:15:00', '2024-08-28 16:20:00', '2024-08-28 09:20:00'
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='incidents')

UNION ALL

SELECT 
    'INC-003', 'Email Service Outage', 
    'Complete failure of email service affecting internal and external communications', 
    'Infrastructure', 'high', 'resolved', 'Email servers, SMTP services',
    'User reports and system monitoring', 
    'Primary email server hardware failure with delayed failover',
    'Replaced failed hardware, improved failover procedures, tested backup systems',
    'Need faster failover automation and better redundancy',
    5, 1, '2024-08-25 11:00:00', '2024-08-25 15:30:00', '2024-08-25 11:05:00'
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='incidents');

-- Verify data insertion
SELECT 'Risk Categories:', COUNT(*) as count FROM risk_categories
UNION ALL
SELECT 'Risks:', COUNT(*) as count FROM risks
UNION ALL
SELECT 'Incidents:', COUNT(*) as count FROM incidents WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='incidents');