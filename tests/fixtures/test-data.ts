// Test fixtures and data for ARIA5.1 Enterprise Security Intelligence Platform

export const testUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@aria51.com',
    password: 'demo123',
    first_name: 'System',
    last_name: 'Administrator',
    role: 'admin',
    is_active: true,
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  
  security_manager: {
    id: 2,
    username: 'avi_security',
    email: 'security@aria51.com',
    password: 'demo123',
    first_name: 'Avi',
    last_name: 'Security',
    role: 'security_manager',
    is_active: true,
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  
  compliance_manager: {
    id: 3,
    username: 'compliance_mgr',
    email: 'compliance@aria51.com',
    password: 'demo123',
    first_name: 'Jane',
    last_name: 'Compliance',
    role: 'compliance_manager',
    is_active: true,
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  
  regular_user: {
    id: 4,
    username: 'user',
    email: 'user@aria51.com',
    password: 'demo123',
    first_name: 'John',
    last_name: 'User',
    role: 'user',
    is_active: true,
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z'
  }
}

export const testOrganizations = {
  enterprise: {
    id: 1,
    name: 'ARIA5 Enterprise',
    description: 'Enterprise security intelligence organization',
    type: 'Enterprise',
    industry: 'Security',
    size: 'Large',
    country: 'US',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  
  subsidiary: {
    id: 2,
    name: 'ARIA5 Security Division',
    description: 'Security operations division',
    type: 'Subsidiary',
    industry: 'Cybersecurity',
    size: 'Medium',
    country: 'US',
    is_active: true,
    parent_id: 1,
    created_at: '2025-01-01T00:00:00Z'
  }
}

export const testRisks = {
  high_security_risk: {
    id: 1,
    title: 'Critical Data Breach Risk',
    description: 'High probability of sensitive customer data exposure due to insufficient access controls',
    category: 'Security',
    subcategory: 'Data Protection',
    probability: 4,
    impact: 5,
    risk_score: 20,
    inherent_risk: 20,
    residual_risk: 12,
    status: 'active',
    owner_id: 2,
    organization_id: 1,
    source: 'Security Assessment',
    affected_assets: JSON.stringify(['Customer Database', 'Payment Gateway', 'User Authentication System']),
    review_date: '2025-03-01',
    due_date: '2025-02-15',
    created_at: '2025-01-01T00:00:00Z'
  },
  
  medium_operational_risk: {
    id: 2,
    title: 'System Downtime Risk',
    description: 'Risk of extended system unavailability during peak business hours',
    category: 'Operational',
    subcategory: 'System Availability',
    probability: 3,
    impact: 3,
    risk_score: 9,
    inherent_risk: 15,
    residual_risk: 9,
    status: 'active',
    owner_id: 2,
    organization_id: 1,
    source: 'Business Continuity Assessment',
    affected_assets: JSON.stringify(['Web Application', 'Database Server', 'Load Balancer']),
    review_date: '2025-02-15',
    due_date: '2025-02-01',
    created_at: '2025-01-01T00:00:00Z'
  },
  
  low_compliance_risk: {
    id: 3,
    title: 'Regulatory Compliance Gap',
    description: 'Minor gaps in GDPR compliance documentation',
    category: 'Compliance',
    subcategory: 'Regulatory',
    probability: 2,
    impact: 3,
    risk_score: 6,
    inherent_risk: 12,
    residual_risk: 6,
    status: 'mitigated',
    owner_id: 3,
    organization_id: 1,
    source: 'Compliance Audit',
    affected_assets: JSON.stringify(['Privacy Policy', 'Data Processing Records']),
    review_date: '2025-04-01',
    due_date: '2025-01-30',
    created_at: '2025-01-01T00:00:00Z'
  },
  
  financial_risk: {
    id: 4,
    title: 'Budget Overrun Risk',
    description: 'Risk of exceeding security budget due to increased threat landscape',
    category: 'Financial',
    subcategory: 'Budget Management',
    probability: 3,
    impact: 2,
    risk_score: 6,
    inherent_risk: 9,
    residual_risk: 6,
    status: 'active',
    owner_id: 1,
    organization_id: 1,
    source: 'Financial Planning',
    affected_assets: JSON.stringify(['Security Tools Budget', 'Training Budget']),
    review_date: '2025-03-15',
    due_date: '2025-02-28',
    created_at: '2025-01-01T00:00:00Z'
  }
}

export const testIncidents = {
  security_incident: {
    id: 1,
    title: 'Suspicious Login Activity',
    description: 'Multiple failed login attempts detected from foreign IP addresses',
    type: 'Security',
    severity: 'Medium',
    status: 'investigating',
    risk_id: 1,
    reported_by: 2,
    assigned_to: 2,
    organization_id: 1,
    detection_date: '2025-01-15T14:30:00Z',
    impact_description: 'Potential unauthorized access attempt',
    created_at: '2025-01-15T14:35:00Z'
  },
  
  operational_incident: {
    id: 2,
    title: 'Database Performance Degradation',
    description: 'Significant slowdown in database response times affecting user experience',
    type: 'Operational',
    severity: 'High',
    status: 'in_progress',
    risk_id: 2,
    reported_by: 4,
    assigned_to: 1,
    organization_id: 1,
    detection_date: '2025-01-20T09:15:00Z',
    resolution_date: null,
    impact_description: 'Degraded system performance for all users',
    created_at: '2025-01-20T09:20:00Z'
  }
}

export const testAssets = {
  web_server: {
    id: 1,
    name: 'Production Web Server',
    type: 'Server',
    category: 'Infrastructure',
    owner_id: 1,
    organization_id: 1,
    location: 'Data Center A',
    criticality: 'High',
    value: 50000,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z'
  },
  
  database_server: {
    id: 2,
    name: 'Customer Database Server',
    type: 'Database',
    category: 'Data',
    owner_id: 2,
    organization_id: 1,
    location: 'Data Center A',
    criticality: 'Critical',
    value: 100000,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z'
  },
  
  workstation: {
    id: 3,
    name: 'Admin Workstation',
    type: 'Workstation',
    category: 'Endpoint',
    owner_id: 1,
    organization_id: 1,
    location: 'Office Building B',
    criticality: 'Medium',
    value: 2000,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z'
  }
}

export const testComplianceFrameworks = {
  iso27001: {
    id: 1,
    name: 'ISO 27001',
    version: '2013',
    description: 'Information security management systems standard',
    regulatory_body: 'International Organization for Standardization',
    industry: 'General',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  
  gdpr: {
    id: 2,
    name: 'GDPR',
    version: '2018',
    description: 'General Data Protection Regulation',
    regulatory_body: 'European Union',
    industry: 'General',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  
  sox: {
    id: 3,
    name: 'SOX',
    version: '2002',
    description: 'Sarbanes-Oxley Act',
    regulatory_body: 'U.S. Securities and Exchange Commission',
    industry: 'Financial',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  }
}

export const testEvidence = {
  security_policy: {
    id: 1,
    name: 'Information Security Policy',
    description: 'Comprehensive information security policy document',
    type: 'document',
    file_path: '/evidence/security-policy.pdf',
    file_size: 2048576,
    mime_type: 'application/pdf',
    control_ids: JSON.stringify([1, 2, 3]),
    risk_ids: JSON.stringify([1, 3]),
    uploaded_by: 2,
    status: 'approved',
    valid_from: '2025-01-01',
    valid_until: '2026-01-01',
    created_at: '2025-01-01T00:00:00Z'
  },
  
  penetration_test: {
    id: 2,
    name: 'Q4 2024 Penetration Test Report',
    description: 'External penetration testing results and remediation recommendations',
    type: 'report',
    file_path: '/evidence/pentest-q4-2024.pdf',
    file_size: 5242880,
    mime_type: 'application/pdf',
    control_ids: JSON.stringify([4, 5, 6]),
    risk_ids: JSON.stringify([1, 2]),
    uploaded_by: 2,
    reviewed_by: 1,
    status: 'approved',
    valid_from: '2024-10-01',
    valid_until: '2025-04-01',
    created_at: '2024-10-15T00:00:00Z'
  }
}

export const testAuditLogs = {
  user_login: {
    id: 1,
    user_id: 1,
    action: 'USER_LOGIN',
    entity_type: 'authentication',
    entity_id: 1,
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: '2025-01-15T10:30:00Z'
  },
  
  risk_created: {
    id: 2,
    user_id: 2,
    action: 'RISK_CREATED',
    entity_type: 'risk',
    entity_id: 1,
    new_values: JSON.stringify({
      title: 'Critical Data Breach Risk',
      category: 'Security',
      probability: 4,
      impact: 5
    }),
    ip_address: '192.168.1.101',
    created_at: '2025-01-15T11:00:00Z'
  },
  
  risk_mitigated: {
    id: 3,
    user_id: 2,
    action: 'RISK_MITIGATED',
    entity_type: 'risk',
    entity_id: 3,
    old_values: JSON.stringify({ status: 'active', residual_risk: 12 }),
    new_values: JSON.stringify({ status: 'mitigated', residual_risk: 6 }),
    ip_address: '192.168.1.101',
    created_at: '2025-01-15T15:30:00Z'
  }
}

// Helper functions for test data
export const createTestUser = (overrides: Partial<typeof testUsers.admin> = {}) => ({
  ...testUsers.regular_user,
  ...overrides,
  id: Date.now() + Math.floor(Math.random() * 1000), // Unique ID
  email: overrides.email || `test${Date.now()}@example.com`,
  username: overrides.username || `testuser${Date.now()}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestRisk = (overrides: Partial<typeof testRisks.high_security_risk> = {}) => ({
  ...testRisks.medium_operational_risk,
  ...overrides,
  id: Date.now() + Math.floor(Math.random() * 1000),
  title: overrides.title || `Test Risk ${Date.now()}`,
  risk_score: overrides.risk_score || (overrides.probability || 3) * (overrides.impact || 3),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestOrganization = (overrides: Partial<typeof testOrganizations.enterprise> = {}) => ({
  ...testOrganizations.enterprise,
  ...overrides,
  id: Date.now() + Math.floor(Math.random() * 1000),
  name: overrides.name || `Test Organization ${Date.now()}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestIncident = (overrides: Partial<typeof testIncidents.security_incident> = {}) => ({
  ...testIncidents.security_incident,
  ...overrides,
  id: Date.now() + Math.floor(Math.random() * 1000),
  title: overrides.title || `Test Incident ${Date.now()}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

// Database seed data
export const seedData = {
  users: Object.values(testUsers),
  organizations: Object.values(testOrganizations),
  risks: Object.values(testRisks),
  incidents: Object.values(testIncidents),
  assets: Object.values(testAssets),
  compliance_frameworks: Object.values(testComplianceFrameworks),
  evidence: Object.values(testEvidence),
  audit_logs: Object.values(testAuditLogs)
}

// API response templates
export const apiResponses = {
  success: (data: any) => ({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }),
  
  error: (message: string, status = 400) => ({
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString()
  }),
  
  paginated: (items: any[], page = 1, limit = 10) => ({
    success: true,
    data: {
      items: items.slice((page - 1) * limit, page * limit),
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit)
    },
    timestamp: new Date().toISOString()
  })
}