-- Phase 4: Enterprise Multi-Tenancy & Scalability
-- Migration: Advanced organizational hierarchy and enterprise features

-- Enhanced Organizations with hierarchical support
DROP TABLE IF EXISTS organizations_hierarchy;
CREATE TABLE IF NOT EXISTS organizations_hierarchy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT UNIQUE NOT NULL,
  parent_id INTEGER, -- Self-referencing for hierarchy
  
  -- Basic Information
  name TEXT NOT NULL,
  display_name TEXT,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('enterprise', 'subsidiary', 'department', 'project', 'partner')),
  
  -- Contact Information
  email_domain TEXT, -- Primary domain for this organization
  primary_contact_email TEXT,
  phone TEXT,
  address JSON, -- Full address information
  
  -- Business Information
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  business_hours JSON, -- Operating hours configuration
  
  -- Subscription & Licensing
  subscription_tier TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise', 'custom')),
  license_type TEXT NOT NULL DEFAULT 'per_user' CHECK (license_type IN ('per_user', 'per_organization', 'unlimited')),
  max_users INTEGER DEFAULT 10,
  max_frameworks INTEGER DEFAULT 3,
  features_enabled JSON, -- Array of enabled feature flags
  
  -- Multi-tenancy Configuration
  tenant_isolation_level TEXT DEFAULT 'shared' CHECK (tenant_isolation_level IN ('shared', 'isolated', 'dedicated')),
  custom_subdomain TEXT, -- Optional custom subdomain
  custom_domain TEXT, -- Optional custom domain
  
  -- Compliance Configuration
  default_frameworks JSON, -- Default frameworks for this org
  compliance_requirements JSON, -- Specific compliance requirements
  risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  
  -- Enterprise Features
  sso_enabled BOOLEAN DEFAULT 0,
  sso_provider TEXT, -- SAML, OIDC provider details
  sso_configuration JSON,
  api_access_enabled BOOLEAN DEFAULT 0,
  api_rate_limits JSON, -- API rate limiting configuration
  
  -- Audit & Compliance
  audit_retention_days INTEGER DEFAULT 365,
  data_classification_policy JSON,
  compliance_contact_email TEXT,
  
  -- Status & Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'trial')),
  trial_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_id) REFERENCES organizations_hierarchy(id)
);

-- Organization-specific Framework Customizations
CREATE TABLE IF NOT EXISTS organization_framework_customizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  framework_id INTEGER NOT NULL,
  
  -- Customization Details
  custom_name TEXT, -- Organization-specific framework name
  custom_description TEXT,
  customization_level TEXT NOT NULL DEFAULT 'none' CHECK (customization_level IN ('none', 'minor', 'moderate', 'extensive', 'custom')),
  
  -- Custom Controls
  added_controls JSON, -- Controls added by organization
  removed_control_ids JSON, -- Standard controls removed/disabled
  modified_controls JSON, -- Controls with modified requirements
  
  -- Custom Categories and Mappings
  custom_categories JSON, -- Organization-specific control categories
  risk_mappings JSON, -- Custom risk-control mappings
  
  -- Implementation Standards
  implementation_standards JSON, -- Org-specific implementation requirements
  evidence_requirements JSON, -- Custom evidence requirements
  testing_procedures JSON, -- Custom testing procedures
  
  -- Workflow Customizations
  approval_workflows JSON, -- Custom approval processes
  notification_rules JSON, -- Custom notification configurations
  escalation_procedures JSON, -- Custom escalation paths
  
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_framework_version TEXT, -- Version of base framework this is based on
  change_history JSON, -- History of customizations
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  approved_by INTEGER, -- User who approved customizations
  approved_at DATETIME,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  UNIQUE(organization_id, framework_id)
);

-- Enhanced Role-Based Access Control for Compliance
CREATE TABLE IF NOT EXISTS compliance_roles_advanced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT UNIQUE NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('system', 'organization', 'framework', 'project')),
  
  -- Role Definition
  display_name TEXT NOT NULL,
  description TEXT,
  role_level INTEGER NOT NULL DEFAULT 1, -- 1=basic, 5=admin level
  
  -- Permissions Structure
  compliance_permissions JSON NOT NULL, -- Detailed compliance permissions
  framework_permissions JSON, -- Framework-specific permissions
  data_access_level TEXT DEFAULT 'restricted' CHECK (data_access_level IN ('none', 'restricted', 'department', 'organization', 'global')),
  
  -- Scope Configuration
  organization_scope JSON, -- Organizations this role applies to
  framework_scope JSON, -- Frameworks this role can access
  control_scope JSON, -- Specific controls this role can manage
  
  -- Advanced Features
  can_create_workflows BOOLEAN DEFAULT 0,
  can_approve_assessments BOOLEAN DEFAULT 0,
  can_modify_frameworks BOOLEAN DEFAULT 0,
  can_manage_users BOOLEAN DEFAULT 0,
  can_view_audit_logs BOOLEAN DEFAULT 0,
  can_export_data BOOLEAN DEFAULT 0,
  
  -- Delegation & Inheritance
  can_delegate_permissions BOOLEAN DEFAULT 0,
  inherits_from_role INTEGER, -- Role inheritance
  delegation_rules JSON, -- Rules for permission delegation
  
  -- Time-based Access
  time_based_access BOOLEAN DEFAULT 0,
  access_schedule JSON, -- When this role is active
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (inherits_from_role) REFERENCES compliance_roles_advanced(id)
);

-- User-Role Assignments with Context
CREATE TABLE IF NOT EXISTS user_compliance_role_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  
  -- Assignment Context
  assignment_type TEXT DEFAULT 'permanent' CHECK (assignment_type IN ('permanent', 'temporary', 'project_based', 'emergency')),
  assignment_scope JSON, -- Specific scope within organization
  
  -- Framework-specific assignments
  framework_ids JSON, -- Specific frameworks this assignment covers
  control_ids JSON, -- Specific controls if fine-grained
  
  -- Temporary Access
  effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- For temporary assignments
  
  -- Approval & Audit
  assigned_by INTEGER NOT NULL,
  approval_required BOOLEAN DEFAULT 0,
  approved_by INTEGER,
  approved_at DATETIME,
  assignment_reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES compliance_roles_advanced(id),
  FOREIGN KEY (organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  UNIQUE(user_id, role_id, organization_id)
);

-- Organization Compliance Policies
CREATE TABLE IF NOT EXISTS organization_compliance_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  -- Policy Definition
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('framework_selection', 'risk_appetite', 'evidence_retention', 'approval_workflow', 'notification', 'escalation')),
  policy_category TEXT,
  
  -- Policy Configuration
  policy_rules JSON NOT NULL, -- Detailed policy rules and conditions
  enforcement_level TEXT DEFAULT 'advisory' CHECK (enforcement_level IN ('advisory', 'warning', 'blocking', 'mandatory')),
  
  -- Scope
  applies_to_frameworks JSON, -- Framework IDs this policy applies to
  applies_to_roles JSON, -- Roles this policy applies to
  exclusions JSON, -- Specific exclusions or exceptions
  
  -- Implementation
  automated_enforcement BOOLEAN DEFAULT 0,
  automation_scripts JSON, -- Scripts for automated enforcement
  manual_procedures TEXT, -- Manual procedures when automation not possible
  
  -- Compliance Tracking
  compliance_tracking BOOLEAN DEFAULT 1,
  violation_consequences JSON, -- What happens when policy is violated
  
  -- Version Control
  version INTEGER DEFAULT 1,
  change_history JSON,
  effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_frequency INTEGER DEFAULT 365, -- Days between reviews
  next_review_date DATETIME,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'archived')),
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Cross-Organization Compliance Sharing
CREATE TABLE IF NOT EXISTS compliance_sharing_agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Parties
  sharing_organization_id INTEGER NOT NULL, -- Organization sharing compliance data
  receiving_organization_id INTEGER NOT NULL, -- Organization receiving data
  
  -- Agreement Details
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('parent_subsidiary', 'partnership', 'vendor_assessment', 'audit_cooperation', 'framework_sharing')),
  agreement_name TEXT NOT NULL,
  description TEXT,
  
  -- Sharing Configuration
  shared_frameworks JSON, -- Frameworks included in sharing
  shared_data_types JSON, -- Types of data shared (assessments, evidence, reports)
  sharing_frequency TEXT DEFAULT 'on_demand' CHECK (sharing_frequency IN ('real_time', 'daily', 'weekly', 'monthly', 'on_demand')),
  
  -- Access Control
  access_level TEXT DEFAULT 'read_only' CHECK (access_level IN ('read_only', 'read_write', 'full_access')),
  data_masking_rules JSON, -- Rules for masking sensitive data
  
  -- Legal & Compliance
  legal_basis TEXT, -- Legal basis for data sharing
  data_protection_requirements JSON, -- Privacy and protection requirements
  retention_period INTEGER, -- How long shared data is retained
  
  -- Agreement Terms
  effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  auto_renewal BOOLEAN DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'terminated')),
  signed_by_sharing INTEGER, -- User who signed for sharing org
  signed_by_receiving INTEGER, -- User who signed for receiving org
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sharing_organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (receiving_organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (signed_by_sharing) REFERENCES users(id),
  FOREIGN KEY (signed_by_receiving) REFERENCES users(id)
);

-- Enterprise SSO & Identity Management
CREATE TABLE IF NOT EXISTS enterprise_identity_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  -- Provider Configuration
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oidc', 'ldap', 'active_directory', 'google_workspace', 'azure_ad', 'okta')),
  provider_config JSON NOT NULL,
  
  -- Authentication Settings
  auto_provisioning BOOLEAN DEFAULT 0,
  user_attribute_mapping JSON, -- How user attributes map to internal fields
  role_mapping_rules JSON, -- How external roles map to compliance roles
  
  -- Security Configuration
  certificate_data TEXT, -- X.509 certificates for SAML
  signing_algorithm TEXT,
  encryption_enabled BOOLEAN DEFAULT 1,
  
  -- Session Management
  session_timeout INTEGER DEFAULT 28800, -- 8 hours default
  concurrent_sessions_allowed INTEGER DEFAULT 1,
  
  -- Status
  is_primary BOOLEAN DEFAULT 0, -- Primary identity provider for org
  is_active BOOLEAN DEFAULT 1,
  last_sync DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations_hierarchy(id)
);

-- API Access Management for Enterprise
CREATE TABLE IF NOT EXISTS organization_api_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  -- API Configuration
  api_key_id TEXT UNIQUE NOT NULL,
  api_key_hash TEXT NOT NULL, -- Hashed API key
  api_name TEXT,
  description TEXT,
  
  -- Access Control
  allowed_operations JSON, -- Array of allowed API operations
  scope_restrictions JSON, -- Restrictions on data access
  ip_whitelist JSON, -- Allowed IP addresses/ranges
  
  -- Rate Limiting
  rate_limit_requests INTEGER DEFAULT 1000, -- Requests per hour
  rate_limit_window INTEGER DEFAULT 3600, -- Window in seconds
  current_usage INTEGER DEFAULT 0,
  usage_reset_time DATETIME,
  
  -- Usage Tracking
  last_used DATETIME,
  total_requests INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  expires_at DATETIME,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Update existing users table to reference new organization structure
-- (This would typically be done with ALTER TABLE in a real migration)
CREATE TABLE IF NOT EXISTS users_organizations_bridge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  
  -- Relationship Details
  relationship_type TEXT DEFAULT 'employee' CHECK (relationship_type IN ('employee', 'contractor', 'partner', 'auditor', 'consultant')),
  primary_organization BOOLEAN DEFAULT 0, -- Is this the user's primary org?
  
  -- Access Details
  access_level TEXT DEFAULT 'standard' CHECK (access_level IN ('read_only', 'standard', 'elevated', 'admin')),
  department TEXT,
  job_title TEXT,
  manager_user_id INTEGER,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations_hierarchy(id),
  FOREIGN KEY (manager_user_id) REFERENCES users(id),
  UNIQUE(user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_parent ON organizations_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_type ON organizations_hierarchy(organization_type);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_status ON organizations_hierarchy(status);
CREATE INDEX IF NOT EXISTS idx_framework_customizations_org ON organization_framework_customizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_framework_customizations_framework ON organization_framework_customizations(framework_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON user_compliance_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_org ON user_compliance_role_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON user_compliance_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_compliance_policies_org ON organization_compliance_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_sharing_agreements_sharing ON compliance_sharing_agreements(sharing_organization_id);
CREATE INDEX IF NOT EXISTS idx_sharing_agreements_receiving ON compliance_sharing_agreements(receiving_organization_id);
CREATE INDEX IF NOT EXISTS idx_identity_providers_org ON enterprise_identity_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_access_org ON organization_api_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_orgs_bridge_user ON users_organizations_bridge(user_id);
CREATE INDEX IF NOT EXISTS idx_users_orgs_bridge_org ON users_organizations_bridge(organization_id);