/**
 * ARIA5 Enterprise Multi-Tenancy Management Service
 * 
 * Provides comprehensive multi-tenant capabilities including:
 * - Hierarchical organization management
 * - Custom framework configurations per tenant
 * - Advanced role-based access control
 * - SSO and identity provider integration
 * - API access management
 * - Cross-tenant compliance sharing
 */

export interface OrganizationHierarchy {
  id: number;
  organizationId: string;
  parentId?: number;
  name: string;
  type: 'enterprise' | 'subsidiary' | 'department' | 'project' | 'partner';
  subscriptionTier: 'basic' | 'professional' | 'enterprise' | 'custom';
  maxUsers: number;
  maxFrameworks: number;
  featuresEnabled: string[];
  status: 'active' | 'suspended' | 'terminated' | 'trial';
  children?: OrganizationHierarchy[];
}

export interface FrameworkCustomization {
  organizationId: number;
  frameworkId: number;
  customName?: string;
  customizationLevel: 'none' | 'minor' | 'moderate' | 'extensive' | 'custom';
  addedControls: any[];
  removedControlIds: number[];
  modifiedControls: any[];
  implementationStandards: any;
  approvalWorkflows: any;
}

export interface ComplianceRole {
  id: number;
  roleName: string;
  roleType: 'system' | 'organization' | 'framework' | 'project';
  roleLevel: number;
  compliancePermissions: any;
  frameworkPermissions: any;
  dataAccessLevel: 'none' | 'restricted' | 'department' | 'organization' | 'global';
  canCreateWorkflows: boolean;
  canApproveAssessments: boolean;
  canModifyFrameworks: boolean;
}

export interface UserRoleAssignment {
  userId: number;
  roleId: number;
  organizationId: number;
  assignmentType: 'permanent' | 'temporary' | 'project_based' | 'emergency';
  frameworkIds?: number[];
  controlIds?: number[];
  expiresAt?: Date;
  status: 'pending' | 'active' | 'expired' | 'revoked';
}

export interface SSOProvider {
  organizationId: number;
  providerName: string;
  providerType: 'saml' | 'oidc' | 'ldap' | 'active_directory' | 'google_workspace' | 'azure_ad' | 'okta';
  providerConfig: any;
  autoProvisioning: boolean;
  userAttributeMapping: any;
  roleMappingRules: any;
  isPrimary: boolean;
}

export class EnterpriseMultiTenancyService {
  private db: D1Database;

  constructor(database: D1Database) {
    this.db = database;
  }

  /**
   * Create a new organization with hierarchical support
   */
  async createOrganization(orgData: Partial<OrganizationHierarchy>, createdBy: number): Promise<string> {
    const organizationId = `org_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await this.db.prepare(`
      INSERT INTO organizations_hierarchy
      (organization_id, parent_id, name, display_name, organization_type, industry, size, country,
       subscription_tier, max_users, max_frameworks, features_enabled, tenant_isolation_level,
       compliance_requirements, risk_tolerance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      organizationId,
      orgData.parentId || null,
      orgData.name,
      orgData.name, // display_name defaults to name
      orgData.type || 'department',
      'Technology', // default industry
      'medium', // default size
      'US', // default country
      orgData.subscriptionTier || 'basic',
      orgData.maxUsers || 10,
      orgData.maxFrameworks || 3,
      JSON.stringify(orgData.featuresEnabled || ['compliance_basic']),
      'shared', // default isolation level
      JSON.stringify(['soc2', 'iso27001']), // default requirements
      'medium', // default risk tolerance
      orgData.status || 'active'
    ).run();

    // Setup default policies for the organization
    await this.createDefaultCompliancePolicies(organizationId, createdBy);

    return organizationId;
  }

  /**
   * Get organization hierarchy tree
   */
  async getOrganizationHierarchy(rootOrgId?: string): Promise<OrganizationHierarchy[]> {
    let query = `
      SELECT * FROM organizations_hierarchy 
      WHERE status = 'active'
    `;
    const params: any[] = [];

    if (rootOrgId) {
      query += ` AND (organization_id = ? OR parent_id IN (
        WITH RECURSIVE org_tree AS (
          SELECT id FROM organizations_hierarchy WHERE organization_id = ?
          UNION ALL
          SELECT o.id FROM organizations_hierarchy o
          INNER JOIN org_tree ot ON o.parent_id = ot.id
        )
        SELECT id FROM org_tree
      ))`;
      params.push(rootOrgId, rootOrgId);
    } else {
      query += ` AND parent_id IS NULL`; // Root organizations only
    }

    query += ` ORDER BY name`;

    const orgs = await this.db.prepare(query).bind(...params).all();
    
    return this.buildHierarchyTree(orgs.results || []);
  }

  /**
   * Build hierarchical tree structure from flat organization data
   */
  private buildHierarchyTree(orgs: any[], parentId: number | null = null): OrganizationHierarchy[] {
    return orgs
      .filter(org => org.parent_id === parentId)
      .map(org => ({
        id: org.id,
        organizationId: org.organization_id,
        parentId: org.parent_id,
        name: org.name,
        type: org.organization_type,
        subscriptionTier: org.subscription_tier,
        maxUsers: org.max_users,
        maxFrameworks: org.max_frameworks,
        featuresEnabled: JSON.parse(org.features_enabled || '[]'),
        status: org.status,
        children: this.buildHierarchyTree(orgs, org.id)
      }));
  }

  /**
   * Create framework customization for organization
   */
  async createFrameworkCustomization(
    customization: FrameworkCustomization,
    createdBy: number
  ): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO organization_framework_customizations
      (organization_id, framework_id, custom_name, customization_level, added_controls,
       removed_control_ids, modified_controls, implementation_standards, approval_workflows,
       created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      customization.organizationId,
      customization.frameworkId,
      customization.customName,
      customization.customizationLevel,
      JSON.stringify(customization.addedControls || []),
      JSON.stringify(customization.removedControlIds || []),
      JSON.stringify(customization.modifiedControls || []),
      JSON.stringify(customization.implementationStandards || {}),
      JSON.stringify(customization.approvalWorkflows || {}),
      createdBy
    ).run();

    return result.meta.last_row_id;
  }

  /**
   * Get framework customizations for organization
   */
  async getFrameworkCustomizations(organizationId: number): Promise<FrameworkCustomization[]> {
    const customizations = await this.db.prepare(`
      SELECT ofc.*, f.name as framework_name
      FROM organization_framework_customizations ofc
      JOIN compliance_frameworks f ON ofc.framework_id = f.id
      WHERE ofc.organization_id = ? AND ofc.is_active = 1
      ORDER BY f.name
    `).bind(organizationId).all();

    return (customizations.results || []).map(c => ({
      organizationId: c.organization_id,
      frameworkId: c.framework_id,
      customName: c.custom_name,
      customizationLevel: c.customization_level,
      addedControls: JSON.parse(c.added_controls || '[]'),
      removedControlIds: JSON.parse(c.removed_control_ids || '[]'),
      modifiedControls: JSON.parse(c.modified_controls || '[]'),
      implementationStandards: JSON.parse(c.implementation_standards || '{}'),
      approvalWorkflows: JSON.parse(c.approval_workflows || '{}')
    }));
  }

  /**
   * Create advanced compliance role
   */
  async createComplianceRole(role: Partial<ComplianceRole>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO compliance_roles_advanced
      (role_name, role_type, display_name, description, role_level, compliance_permissions,
       framework_permissions, data_access_level, can_create_workflows, can_approve_assessments,
       can_modify_frameworks, can_manage_users)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      role.roleName,
      role.roleType || 'organization',
      role.roleName, // display_name defaults to role_name
      `Advanced role: ${role.roleName}`,
      role.roleLevel || 1,
      JSON.stringify(role.compliancePermissions || {}),
      JSON.stringify(role.frameworkPermissions || {}),
      role.dataAccessLevel || 'restricted',
      role.canCreateWorkflows || false,
      role.canApproveAssessments || false,
      role.canModifyFrameworks || false,
      false // can_manage_users default
    ).run();

    return result.meta.last_row_id;
  }

  /**
   * Assign role to user in organization context
   */
  async assignUserRole(assignment: UserRoleAssignment, assignedBy: number): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO user_compliance_role_assignments
      (user_id, role_id, organization_id, assignment_type, framework_ids, control_ids,
       expires_at, assigned_by, assignment_reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assignment.userId,
      assignment.roleId,
      assignment.organizationId,
      assignment.assignmentType,
      JSON.stringify(assignment.frameworkIds || []),
      JSON.stringify(assignment.controlIds || []),
      assignment.expiresAt?.toISOString(),
      assignedBy,
      'Multi-tenancy role assignment',
      assignment.status
    ).run();

    return result.meta.last_row_id;
  }

  /**
   * Get user roles for specific organization
   */
  async getUserRoles(userId: number, organizationId: number): Promise<UserRoleAssignment[]> {
    const assignments = await this.db.prepare(`
      SELECT ura.*, r.role_name, r.display_name, r.role_level, r.compliance_permissions
      FROM user_compliance_role_assignments ura
      JOIN compliance_roles_advanced r ON ura.role_id = r.id
      WHERE ura.user_id = ? AND ura.organization_id = ?
        AND ura.status = 'active'
        AND (ura.expires_at IS NULL OR ura.expires_at > datetime('now'))
      ORDER BY r.role_level DESC
    `).bind(userId, organizationId).all();

    return (assignments.results || []).map(a => ({
      userId: a.user_id,
      roleId: a.role_id,
      organizationId: a.organization_id,
      assignmentType: a.assignment_type,
      frameworkIds: JSON.parse(a.framework_ids || '[]'),
      controlIds: JSON.parse(a.control_ids || '[]'),
      expiresAt: a.expires_at ? new Date(a.expires_at) : undefined,
      status: a.status
    }));
  }

  /**
   * Check if user has specific permission in organization context
   */
  async checkUserPermission(
    userId: number, 
    organizationId: number, 
    permission: string,
    frameworkId?: number,
    controlId?: number
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId, organizationId);
    
    for (const assignment of userRoles) {
      // Check if assignment covers the requested framework/control
      if (frameworkId && assignment.frameworkIds && 
          assignment.frameworkIds.length > 0 && 
          !assignment.frameworkIds.includes(frameworkId)) {
        continue;
      }

      if (controlId && assignment.controlIds && 
          assignment.controlIds.length > 0 && 
          !assignment.controlIds.includes(controlId)) {
        continue;
      }

      // Get role permissions
      const role = await this.db.prepare(`
        SELECT compliance_permissions FROM compliance_roles_advanced WHERE id = ?
      `).bind(assignment.roleId).first();

      if (role) {
        const permissions = JSON.parse(role.compliance_permissions || '{}');
        if (permissions[permission] === true) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Setup SSO provider for organization
   */
  async setupSSOProvider(ssoConfig: SSOProvider): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO enterprise_identity_providers
      (organization_id, provider_name, provider_type, provider_config, auto_provisioning,
       user_attribute_mapping, role_mapping_rules, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ssoConfig.organizationId,
      ssoConfig.providerName,
      ssoConfig.providerType,
      JSON.stringify(ssoConfig.providerConfig),
      ssoConfig.autoProvisioning,
      JSON.stringify(ssoConfig.userAttributeMapping || {}),
      JSON.stringify(ssoConfig.roleMappingRules || {}),
      ssoConfig.isPrimary
    ).run();

    // If this is primary, unset other primary providers
    if (ssoConfig.isPrimary) {
      await this.db.prepare(`
        UPDATE enterprise_identity_providers 
        SET is_primary = 0 
        WHERE organization_id = ? AND id != ?
      `).bind(ssoConfig.organizationId, result.meta.last_row_id).run();
    }

    return result.meta.last_row_id;
  }

  /**
   * Generate API access key for organization
   */
  async generateAPIKey(
    organizationId: number, 
    apiName: string,
    allowedOperations: string[],
    createdBy: number,
    expiresAt?: Date
  ): Promise<{ keyId: string; apiKey: string }> {
    const keyId = `ak_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const apiKey = `aria5_${Buffer.from(`${organizationId}_${Date.now()}_${Math.random()}`).toString('base64')}`;
    const keyHash = await this.hashAPIKey(apiKey);

    await this.db.prepare(`
      INSERT INTO organization_api_access
      (organization_id, api_key_id, api_key_hash, api_name, allowed_operations,
       expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      organizationId,
      keyId,
      keyHash,
      apiName,
      JSON.stringify(allowedOperations),
      expiresAt?.toISOString(),
      createdBy
    ).run();

    return { keyId, apiKey };
  }

  /**
   * Validate API key and return organization context
   */
  async validateAPIKey(apiKey: string): Promise<{ organizationId: number; allowedOperations: string[] } | null> {
    const keyHash = await this.hashAPIKey(apiKey);
    
    const keyData = await this.db.prepare(`
      SELECT oaa.organization_id, oaa.allowed_operations, oh.name as org_name
      FROM organization_api_access oaa
      JOIN organizations_hierarchy oh ON oaa.organization_id = oh.id
      WHERE oaa.api_key_hash = ? AND oaa.is_active = 1
        AND (oaa.expires_at IS NULL OR oaa.expires_at > datetime('now'))
    `).bind(keyHash).first();

    if (!keyData) return null;

    // Update usage tracking
    await this.db.prepare(`
      UPDATE organization_api_access 
      SET last_used = datetime('now'), total_requests = total_requests + 1
      WHERE api_key_hash = ?
    `).bind(keyHash).run();

    return {
      organizationId: keyData.organization_id,
      allowedOperations: JSON.parse(keyData.allowed_operations || '[]')
    };
  }

  /**
   * Create default compliance policies for new organization
   */
  private async createDefaultCompliancePolicies(organizationId: string, createdBy: number): Promise<void> {
    const defaultPolicies = [
      {
        name: 'Framework Selection Policy',
        type: 'framework_selection',
        rules: {
          requiredFrameworks: ['SOC 2', 'ISO 27001'],
          maxCustomFrameworks: 2,
          approvalRequired: true
        }
      },
      {
        name: 'Risk Appetite Policy',
        type: 'risk_appetite',
        rules: {
          maxAcceptableRisk: 'medium',
          criticalControlsRequired: true,
          riskAssessmentFrequency: 'quarterly'
        }
      },
      {
        name: 'Evidence Retention Policy',
        type: 'evidence_retention',
        rules: {
          minimumRetention: 365, // days
          backupRequired: true,
          encryptionRequired: true
        }
      }
    ];

    const orgRecord = await this.db.prepare(`
      SELECT id FROM organizations_hierarchy WHERE organization_id = ?
    `).bind(organizationId).first();

    for (const policy of defaultPolicies) {
      await this.db.prepare(`
        INSERT INTO organization_compliance_policies
        (organization_id, policy_name, policy_type, policy_rules, enforcement_level, created_by)
        VALUES (?, ?, ?, ?, 'advisory', ?)
      `).bind(
        orgRecord?.id,
        policy.name,
        policy.type,
        JSON.stringify(policy.rules),
        createdBy
      ).run();
    }
  }

  /**
   * Hash API key for secure storage
   */
  private async hashAPIKey(apiKey: string): Promise<string> {
    // Simple hash for demo - in production, use crypto.subtle or bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get organization compliance dashboard data
   */
  async getOrganizationDashboard(organizationId: number): Promise<any> {
    // Get organization details
    const org = await this.db.prepare(`
      SELECT * FROM organizations_hierarchy WHERE id = ?
    `).bind(organizationId).first();

    // Get user count
    const userStats = await this.db.prepare(`
      SELECT COUNT(*) as user_count
      FROM users_organizations_bridge 
      WHERE organization_id = ? AND status = 'active'
    `).bind(organizationId).first();

    // Get framework customizations
    const frameworkStats = await this.db.prepare(`
      SELECT COUNT(*) as customized_frameworks
      FROM organization_framework_customizations
      WHERE organization_id = ? AND is_active = 1
    `).bind(organizationId).first();

    // Get compliance policy count
    const policyStats = await this.db.prepare(`
      SELECT COUNT(*) as active_policies
      FROM organization_compliance_policies
      WHERE organization_id = ? AND status = 'active'
    `).bind(organizationId).first();

    return {
      organization: org,
      metrics: {
        userCount: userStats?.user_count || 0,
        maxUsers: org?.max_users || 0,
        frameworksCustomized: frameworkStats?.customized_frameworks || 0,
        maxFrameworks: org?.max_frameworks || 0,
        activePolicies: policyStats?.active_policies || 0,
        subscriptionTier: org?.subscription_tier || 'basic',
        featuresEnabled: JSON.parse(org?.features_enabled || '[]')
      },
      usage: {
        storageUsed: 0, // Would calculate actual storage
        apiCallsThisMonth: 0, // Would calculate from API logs
        complianceScore: 85 // Would calculate from assessments
      }
    };
  }

  /**
   * Setup default compliance roles for organization
   */
  async setupDefaultComplianceRoles(): Promise<number[]> {
    const defaultRoles = [
      {
        roleName: 'compliance_viewer',
        roleType: 'organization',
        roleLevel: 1,
        compliancePermissions: {
          'view_frameworks': true,
          'view_controls': true,
          'view_assessments': true
        },
        dataAccessLevel: 'restricted'
      },
      {
        roleName: 'compliance_analyst',
        roleType: 'organization', 
        roleLevel: 3,
        compliancePermissions: {
          'view_frameworks': true,
          'view_controls': true,
          'view_assessments': true,
          'create_assessments': true,
          'update_controls': true
        },
        dataAccessLevel: 'department',
        canCreateWorkflows: true
      },
      {
        roleName: 'compliance_manager',
        roleType: 'organization',
        roleLevel: 4,
        compliancePermissions: {
          'view_frameworks': true,
          'view_controls': true,
          'view_assessments': true,
          'create_assessments': true,
          'update_controls': true,
          'approve_assessments': true,
          'manage_frameworks': true
        },
        dataAccessLevel: 'organization',
        canCreateWorkflows: true,
        canApproveAssessments: true,
        canModifyFrameworks: true
      }
    ];

    const roleIds: number[] = [];
    for (const role of defaultRoles) {
      const roleId = await this.createComplianceRole(role);
      roleIds.push(roleId);
    }

    return roleIds;
  }
}

export default EnterpriseMultiTenancyService;