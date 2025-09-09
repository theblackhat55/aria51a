/**
 * ARIA5 Enterprise Multi-Tenancy API Routes
 * 
 * Provides REST endpoints for:
 * - Organization hierarchy management
 * - Framework customizations
 * - Advanced role-based access control
 * - SSO provider management
 * - API key management
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import EnterpriseMultiTenancyService from '../services/enterprise-multitenancy-service';

const app = new Hono<{ Bindings: { DB: D1Database; AI: any } }>();

// Enable CORS for API endpoints
app.use('/api/enterprise/*', cors());

/**
 * POST /api/enterprise/organizations
 * Create a new organization in the hierarchy
 */
app.post('/organizations', async (c) => {
  try {
    const { organizationData, createdBy } = await c.req.json();

    if (!organizationData?.name || !createdBy) {
      return c.json({ error: 'Organization name and creator required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const organizationId = await multiTenancyService.createOrganization(organizationData, createdBy);

    return c.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization created successfully'
      }
    });

  } catch (error) {
    console.error('Create Organization Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/enterprise/organizations/hierarchy
 * Get organization hierarchy tree
 */
app.get('/organizations/hierarchy', async (c) => {
  try {
    const rootOrgId = c.req.query('rootOrgId');
    
    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const hierarchy = await multiTenancyService.getOrganizationHierarchy(rootOrgId);

    return c.json({
      success: true,
      data: hierarchy
    });

  } catch (error) {
    console.error('Get Organization Hierarchy Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/enterprise/organizations/:orgId/dashboard
 * Get organization dashboard data
 */
app.get('/organizations/:orgId/dashboard', async (c) => {
  try {
    const orgId = parseInt(c.req.param('orgId'));

    if (!orgId) {
      return c.json({ error: 'Invalid organization ID' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const dashboard = await multiTenancyService.getOrganizationDashboard(orgId);

    return c.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Get Organization Dashboard Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/frameworks/customizations
 * Create framework customization for organization
 */
app.post('/frameworks/customizations', async (c) => {
  try {
    const { customization, createdBy } = await c.req.json();

    if (!customization?.organizationId || !customization?.frameworkId || !createdBy) {
      return c.json({ error: 'Organization ID, framework ID, and creator required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const customizationId = await multiTenancyService.createFrameworkCustomization(customization, createdBy);

    return c.json({
      success: true,
      data: {
        customizationId,
        message: 'Framework customization created successfully'
      }
    });

  } catch (error) {
    console.error('Create Framework Customization Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/enterprise/organizations/:orgId/frameworks/customizations
 * Get framework customizations for organization
 */
app.get('/organizations/:orgId/frameworks/customizations', async (c) => {
  try {
    const orgId = parseInt(c.req.param('orgId'));

    if (!orgId) {
      return c.json({ error: 'Invalid organization ID' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const customizations = await multiTenancyService.getFrameworkCustomizations(orgId);

    return c.json({
      success: true,
      data: customizations
    });

  } catch (error) {
    console.error('Get Framework Customizations Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/roles
 * Create advanced compliance role
 */
app.post('/roles', async (c) => {
  try {
    const { role } = await c.req.json();

    if (!role?.roleName) {
      return c.json({ error: 'Role name required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const roleId = await multiTenancyService.createComplianceRole(role);

    return c.json({
      success: true,
      data: {
        roleId,
        message: 'Compliance role created successfully'
      }
    });

  } catch (error) {
    console.error('Create Compliance Role Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/roles/setup-defaults
 * Setup default compliance roles
 */
app.post('/roles/setup-defaults', async (c) => {
  try {
    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const roleIds = await multiTenancyService.setupDefaultComplianceRoles();

    return c.json({
      success: true,
      data: {
        rolesCreated: roleIds.length,
        roleIds,
        message: 'Default compliance roles created successfully'
      }
    });

  } catch (error) {
    console.error('Setup Default Roles Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/users/:userId/roles/assign
 * Assign role to user in organization context
 */
app.post('/users/:userId/roles/assign', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const { assignment, assignedBy } = await c.req.json();

    if (!userId || !assignment?.roleId || !assignment?.organizationId || !assignedBy) {
      return c.json({ error: 'User ID, role assignment details, and assigner required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    assignment.userId = userId;
    
    const assignmentId = await multiTenancyService.assignUserRole(assignment, assignedBy);

    return c.json({
      success: true,
      data: {
        assignmentId,
        message: 'User role assigned successfully'
      }
    });

  } catch (error) {
    console.error('Assign User Role Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/enterprise/users/:userId/roles/:orgId
 * Get user roles for specific organization
 */
app.get('/users/:userId/roles/:orgId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const orgId = parseInt(c.req.param('orgId'));

    if (!userId || !orgId) {
      return c.json({ error: 'Invalid user ID or organization ID' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const roles = await multiTenancyService.getUserRoles(userId, orgId);

    return c.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Get User Roles Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/users/:userId/permissions/check
 * Check if user has specific permission
 */
app.post('/users/:userId/permissions/check', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const { organizationId, permission, frameworkId, controlId } = await c.req.json();

    if (!userId || !organizationId || !permission) {
      return c.json({ error: 'User ID, organization ID, and permission required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const hasPermission = await multiTenancyService.checkUserPermission(
      userId, organizationId, permission, frameworkId, controlId
    );

    return c.json({
      success: true,
      data: {
        hasPermission,
        permission,
        context: { organizationId, frameworkId, controlId }
      }
    });

  } catch (error) {
    console.error('Check User Permission Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/organizations/:orgId/sso
 * Setup SSO provider for organization
 */
app.post('/organizations/:orgId/sso', async (c) => {
  try {
    const orgId = parseInt(c.req.param('orgId'));
    const { ssoConfig } = await c.req.json();

    if (!orgId || !ssoConfig) {
      return c.json({ error: 'Organization ID and SSO configuration required' }, 400);
    }

    ssoConfig.organizationId = orgId;

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const ssoId = await multiTenancyService.setupSSOProvider(ssoConfig);

    return c.json({
      success: true,
      data: {
        ssoId,
        message: 'SSO provider configured successfully'
      }
    });

  } catch (error) {
    console.error('Setup SSO Provider Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/organizations/:orgId/api-keys
 * Generate API key for organization
 */
app.post('/organizations/:orgId/api-keys', async (c) => {
  try {
    const orgId = parseInt(c.req.param('orgId'));
    const { apiName, allowedOperations, expiresAt, createdBy } = await c.req.json();

    if (!orgId || !apiName || !allowedOperations || !createdBy) {
      return c.json({ error: 'Organization ID, API name, allowed operations, and creator required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const apiKeyData = await multiTenancyService.generateAPIKey(
      orgId,
      apiName,
      allowedOperations,
      createdBy,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return c.json({
      success: true,
      data: {
        keyId: apiKeyData.keyId,
        apiKey: apiKeyData.apiKey,
        message: 'API key generated successfully',
        warning: 'Store this API key securely - it will not be shown again'
      }
    });

  } catch (error) {
    console.error('Generate API Key Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/enterprise/api-keys/validate
 * Validate API key and return organization context
 */
app.post('/api-keys/validate', async (c) => {
  try {
    const { apiKey } = await c.req.json();

    if (!apiKey) {
      return c.json({ error: 'API key required' }, 400);
    }

    const multiTenancyService = new EnterpriseMultiTenancyService(c.env.DB);
    const validationResult = await multiTenancyService.validateAPIKey(apiKey);

    if (!validationResult) {
      return c.json({ error: 'Invalid or expired API key' }, 401);
    }

    return c.json({
      success: true,
      data: {
        valid: true,
        organizationId: validationResult.organizationId,
        allowedOperations: validationResult.allowedOperations
      }
    });

  } catch (error) {
    console.error('Validate API Key Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/enterprise/dashboard/overview
 * Get enterprise-wide dashboard overview
 */
app.get('/dashboard/overview', async (c) => {
  try {
    // Get enterprise-wide statistics
    const [orgStats, userStats, frameworkStats] = await Promise.all([
      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_orgs,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_orgs,
          COUNT(CASE WHEN organization_type = 'enterprise' THEN 1 END) as enterprise_orgs,
          COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial_orgs
        FROM organizations_hierarchy
      `).first(),
      
      c.env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT uob.user_id) as total_users,
          COUNT(CASE WHEN uob.status = 'active' THEN 1 END) as active_users
        FROM users_organizations_bridge uob
      `).first(),
      
      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_customizations,
          COUNT(CASE WHEN customization_level IN ('extensive', 'custom') THEN 1 END) as advanced_customizations
        FROM organization_framework_customizations
        WHERE is_active = 1
      `).first()
    ]);

    // Get subscription tier distribution
    const subscriptionStats = await c.env.DB.prepare(`
      SELECT 
        subscription_tier,
        COUNT(*) as count
      FROM organizations_hierarchy 
      WHERE status = 'active'
      GROUP BY subscription_tier
    `).all();

    const overview = {
      organizations: {
        total: orgStats?.total_orgs || 0,
        active: orgStats?.active_orgs || 0,
        enterprise: orgStats?.enterprise_orgs || 0,
        trial: orgStats?.trial_orgs || 0
      },
      users: {
        total: userStats?.total_users || 0,
        active: userStats?.active_users || 0
      },
      frameworks: {
        totalCustomizations: frameworkStats?.total_customizations || 0,
        advancedCustomizations: frameworkStats?.advanced_customizations || 0
      },
      subscriptions: (subscriptionStats.results || []).reduce((acc: any, row) => {
        acc[row.subscription_tier] = row.count;
        return acc;
      }, {}),
      revenue: {
        mrr: 0, // Would be calculated from subscription data
        arr: 0, // Would be calculated from subscription data
        growthRate: 0 // Would be calculated from historical data
      }
    };

    return c.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Get Enterprise Dashboard Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

export default app;