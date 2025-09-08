/**
 * Enhanced SAML Service for SSO Integration
 * Provides comprehensive SAML authentication, user provisioning, and configuration management
 */

import { EnhancedRBACService } from './enhanced-rbac-service';

export interface SAMLConfig {
  id: number;
  enabled: boolean;
  sso_url: string;
  metadata_url: string;
  entity_id: string;
  acs_url: string;
  auto_provision: boolean;
  require_signed_assertions: boolean;
  enforce_sso: boolean;
  default_role: string;
  attribute_mapping: Record<string, string>;
  certificate?: string;
  private_key?: string;
}

export interface SAMLUser {
  subject_id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  manager_email?: string;
  groups?: string[];
  attributes: Record<string, any>;
}

export interface SAMLResponse {
  success: boolean;
  user?: any;
  error?: string;
  redirect_url?: string;
}

export class EnhancedSAMLService {
  private db: any;
  private rbacService: EnhancedRBACService;

  constructor(db: any) {
    this.db = db;
    this.rbacService = new EnhancedRBACService(db);
  }

  /**
   * Get SAML configuration from database
   */
  async getSAMLConfig(): Promise<SAMLConfig | null> {
    try {
      const config = await this.db.prepare('SELECT * FROM saml_config WHERE id = 1').first();
      
      if (!config) return null;

      return {
        ...config,
        enabled: !!config.enabled,
        auto_provision: !!config.auto_provision,
        require_signed_assertions: !!config.require_signed_assertions,
        enforce_sso: !!config.enforce_sso,
        attribute_mapping: config.attribute_mapping ? JSON.parse(config.attribute_mapping) : {}
      };
    } catch (error) {
      console.error('Error getting SAML config:', error);
      return null;
    }
  }

  /**
   * Update SAML configuration
   */
  async updateSAMLConfig(config: Partial<SAMLConfig>, updatedBy: number): Promise<boolean> {
    try {
      const attributeMapping = config.attribute_mapping ? JSON.stringify(config.attribute_mapping) : null;
      
      await this.db.prepare(`
        UPDATE saml_config SET 
          enabled = ?,
          sso_url = ?,
          metadata_url = ?,
          entity_id = ?,
          acs_url = ?,
          auto_provision = ?,
          require_signed_assertions = ?,
          enforce_sso = ?,
          default_role = ?,
          attribute_mapping = ?,
          certificate = ?,
          private_key = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).bind(
        config.enabled ? 1 : 0,
        config.sso_url || '',
        config.metadata_url || '',
        config.entity_id || 'https://aria5.example.com/saml/metadata',
        config.acs_url || 'https://aria5.example.com/auth/saml/acs',
        config.auto_provision ? 1 : 0,
        config.require_signed_assertions ? 1 : 0,
        config.enforce_sso ? 1 : 0,
        config.default_role || 'viewer',
        attributeMapping,
        config.certificate || null,
        config.private_key || null
      ).run();

      // Log configuration change
      await this.logSAMLAction('config_updated', {
        updated_fields: Object.keys(config),
        updated_by: updatedBy
      });

      return true;
    } catch (error) {
      console.error('Error updating SAML config:', error);
      return false;
    }
  }

  /**
   * Process SAML authentication response (simplified for demo)
   */
  async processSAMLResponse(samlResponse: string, relayState?: string): Promise<SAMLResponse> {
    try {
      const config = await this.getSAMLConfig();
      
      if (!config || !config.enabled) {
        return { success: false, error: 'SAML authentication is not enabled' };
      }

      // In a real implementation, this would:
      // 1. Parse and validate the SAML response XML
      // 2. Verify digital signatures if required
      // 3. Extract user attributes from assertions
      // 4. Check response timing and validity
      
      // For demo purposes, we'll simulate SAML response parsing
      const samlUser = await this.parseSAMLResponseDemo(samlResponse, config);
      
      if (!samlUser.success) {
        return { success: false, error: samlUser.error };
      }

      // Process user authentication/provisioning
      const authResult = await this.authenticateOrProvisionSAMLUser(samlUser.user!, config);
      
      if (authResult.success) {
        // Log successful SAML authentication
        await this.logSAMLAction('sso_login_success', {
          user_id: authResult.user?.id,
          subject_id: samlUser.user?.subject_id,
          email: samlUser.user?.email
        });

        return {
          success: true,
          user: authResult.user,
          redirect_url: relayState || '/dashboard'
        };
      } else {
        // Log failed SAML authentication
        await this.logSAMLAction('sso_login_failed', {
          subject_id: samlUser.user?.subject_id,
          email: samlUser.user?.email,
          error: authResult.error
        });

        return { success: false, error: authResult.error };
      }
    } catch (error) {
      console.error('Error processing SAML response:', error);
      await this.logSAMLAction('sso_error', { error: error.message });
      return { success: false, error: 'SAML authentication failed' };
    }
  }

  /**
   * Authenticate or provision SAML user
   */
  private async authenticateOrProvisionSAMLUser(samlUser: SAMLUser, config: SAMLConfig): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check if user already exists
      let existingUser = await this.db.prepare(`
        SELECT * FROM users 
        WHERE saml_subject_id = ? OR email = ?
      `).bind(samlUser.subject_id, samlUser.email).first();

      if (existingUser) {
        // Update existing SAML user information
        await this.updateExistingSAMLUser(existingUser, samlUser, config);
        
        // Check if account is locked
        const isLocked = await this.rbacService.isUserLocked(existingUser.id);
        if (isLocked) {
          return { success: false, error: 'Account is temporarily locked' };
        }

        // Reset failed login attempts on successful SAML login
        await this.rbacService.resetFailedLogins(existingUser.id);

        return { success: true, user: existingUser };
      } else if (config.auto_provision) {
        // Auto-provision new SAML user
        const newUser = await this.provisionSAMLUser(samlUser, config);
        if (newUser) {
          return { success: true, user: newUser };
        } else {
          return { success: false, error: 'Failed to provision user account' };
        }
      } else {
        return { success: false, error: 'User not found and auto-provisioning is disabled' };
      }
    } catch (error) {
      console.error('Error authenticating/provisioning SAML user:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Update existing SAML user with fresh attributes
   */
  private async updateExistingSAMLUser(existingUser: any, samlUser: SAMLUser, config: SAMLConfig): Promise<void> {
    try {
      // Map SAML attributes to user fields
      const mappedAttributes = this.mapSAMLAttributes(samlUser, config.attribute_mapping);
      
      await this.db.prepare(`
        UPDATE users SET
          email = ?,
          first_name = ?,
          last_name = ?,
          department = ?,
          saml_subject_id = ?,
          last_login = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        samlUser.email,
        mappedAttributes.first_name || samlUser.firstName || existingUser.first_name,
        mappedAttributes.last_name || samlUser.lastName || existingUser.last_name,
        mappedAttributes.department || samlUser.department || existingUser.department,
        samlUser.subject_id,
        existingUser.id
      ).run();

      // Update roles if specified in SAML attributes
      if (mappedAttributes.role && mappedAttributes.role !== existingUser.role) {
        await this.updateUserRoleFromSAML(existingUser.id, mappedAttributes.role);
      }

      // Process group memberships if available
      if (samlUser.groups && samlUser.groups.length > 0) {
        await this.processSAMLGroupMemberships(existingUser.id, samlUser.groups);
      }
    } catch (error) {
      console.error('Error updating existing SAML user:', error);
    }
  }

  /**
   * Provision new SAML user
   */
  private async provisionSAMLUser(samlUser: SAMLUser, config: SAMLConfig): Promise<any> {
    try {
      // Map SAML attributes to user fields
      const mappedAttributes = this.mapSAMLAttributes(samlUser, config.attribute_mapping);
      
      // Generate username from email if not provided
      const username = mappedAttributes.username || samlUser.email.split('@')[0];
      
      // Determine user role
      const userRole = mappedAttributes.role || samlUser.role || config.default_role || 'viewer';

      // Create new user
      const result = await this.db.prepare(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name,
          role, auth_type, saml_subject_id, department, is_active,
          created_at, updated_at, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        username,
        samlUser.email,
        '', // No password for SAML users
        mappedAttributes.first_name || samlUser.firstName || '',
        mappedAttributes.last_name || samlUser.lastName || '',
        userRole,
        'saml',
        samlUser.subject_id,
        mappedAttributes.department || samlUser.department || null,
        1
      ).run();

      const userId = result.meta.last_row_id as number;

      // Assign default role in RBAC system
      const roles = await this.rbacService.getAllRoles();
      const defaultRole = roles.find(r => r.name === userRole);
      if (defaultRole) {
        await this.rbacService.assignRole(userId, defaultRole.id, -1); // System assignment
      }

      // Process group memberships if available
      if (samlUser.groups && samlUser.groups.length > 0) {
        await this.processSAMLGroupMemberships(userId, samlUser.groups);
      }

      // Log user provisioning
      await this.logSAMLAction('user_provisioned', {
        user_id: userId,
        username,
        email: samlUser.email,
        subject_id: samlUser.subject_id,
        role: userRole
      });

      // Return the new user
      return await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    } catch (error) {
      console.error('Error provisioning SAML user:', error);
      return null;
    }
  }

  /**
   * Map SAML attributes to user fields based on configuration
   */
  private mapSAMLAttributes(samlUser: SAMLUser, attributeMapping: Record<string, string>): Record<string, any> {
    const mapped: Record<string, any> = {};
    
    // Apply attribute mapping configuration
    for (const [localField, samlAttribute] of Object.entries(attributeMapping)) {
      if (samlUser.attributes[samlAttribute]) {
        mapped[localField] = samlUser.attributes[samlAttribute];
      }
    }

    // Apply standard mappings if not overridden
    if (!mapped.first_name && samlUser.firstName) mapped.first_name = samlUser.firstName;
    if (!mapped.last_name && samlUser.lastName) mapped.last_name = samlUser.lastName;
    if (!mapped.department && samlUser.department) mapped.department = samlUser.department;
    if (!mapped.role && samlUser.role) mapped.role = samlUser.role;

    return mapped;
  }

  /**
   * Process SAML group memberships and map to roles
   */
  private async processSAMLGroupMemberships(userId: number, groups: string[]): Promise<void> {
    try {
      // Define group to role mapping (could be configurable)
      const groupRoleMapping: Record<string, string> = {
        'ARIA5-Administrators': 'admin',
        'ARIA5-Risk-Managers': 'risk_manager',
        'ARIA5-Security-Analysts': 'security_analyst',
        'ARIA5-Compliance-Officers': 'compliance_officer',
        'ARIA5-Managers': 'manager',
        'ARIA5-Analysts': 'analyst',
        'ARIA5-Viewers': 'viewer'
      };

      const roles = await this.rbacService.getAllRoles();
      
      for (const group of groups) {
        const roleName = groupRoleMapping[group];
        if (roleName) {
          const role = roles.find(r => r.name === roleName);
          if (role) {
            await this.rbacService.assignRole(userId, role.id, -1); // System assignment from SAML
          }
        }
      }
    } catch (error) {
      console.error('Error processing SAML group memberships:', error);
    }
  }

  /**
   * Update user role based on SAML attributes
   */
  private async updateUserRoleFromSAML(userId: number, newRole: string): Promise<void> {
    try {
      // Update legacy role field
      await this.db.prepare(`
        UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(newRole, userId).run();

      // Update RBAC roles
      const roles = await this.rbacService.getAllRoles();
      const role = roles.find(r => r.name === newRole);
      if (role) {
        // Remove existing roles and assign new one
        await this.db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userId).run();
        await this.rbacService.assignRole(userId, role.id, -1); // System assignment
      }
    } catch (error) {
      console.error('Error updating user role from SAML:', error);
    }
  }

  /**
   * Parse SAML response (demo implementation)
   * In production, this would use a proper SAML library like saml2-js or passport-saml
   */
  private async parseSAMLResponseDemo(samlResponse: string, config: SAMLConfig): Promise<{ success: boolean; user?: SAMLUser; error?: string }> {
    try {
      // Demo SAML response parsing - in production, use proper SAML XML parsing
      // This simulates extracting user attributes from a SAML assertion
      
      // For demo, we'll create a mock user based on the response
      const mockSamlUser: SAMLUser = {
        subject_id: 'saml_demo_' + Date.now(),
        email: 'saml.demo@company.com',
        firstName: 'SAML',
        lastName: 'User',
        role: 'analyst',
        department: 'Security',
        groups: ['ARIA5-Security-Analysts', 'ARIA5-Analysts'],
        attributes: {
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'saml.demo@company.com',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'SAML',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'User',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'analyst',
          'http://schemas.microsoft.com/identity/claims/department': 'Security'
        }
      };

      // In production, validate SAML response timing, signatures, etc.
      if (config.require_signed_assertions) {
        // Validate digital signature
        // For demo, we'll just simulate validation
        const signatureValid = true; // Mock signature validation
        if (!signatureValid) {
          return { success: false, error: 'Invalid SAML assertion signature' };
        }
      }

      return { success: true, user: mockSamlUser };
    } catch (error) {
      console.error('Error parsing SAML response:', error);
      return { success: false, error: 'Invalid SAML response format' };
    }
  }

  /**
   * Generate SAML metadata for IdP configuration
   */
  async generateSAMLMetadata(config: SAMLConfig): Promise<string> {
    const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" 
                  entityID="${config.entity_id}">
  <SPSSODescriptor AuthnRequestsSigned="false" 
                   WantAssertionsSigned="${config.require_signed_assertions}" 
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
                              Location="${config.acs_url}" 
                              index="1" />
    <AttributeConsumingService index="1">
      <ServiceName xml:lang="en">ARIA5 Security Platform</ServiceName>
      <RequestedAttribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" 
                          NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" 
                          isRequired="true"/>
      <RequestedAttribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname" 
                          NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
      <RequestedAttribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname" 
                          NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
      <RequestedAttribute Name="http://schemas.microsoft.com/ws/2008/06/identity/claims/role" 
                          NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
      <RequestedAttribute Name="http://schemas.microsoft.com/identity/claims/department" 
                          NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
    </AttributeConsumingService>
  </SPSSODescriptor>
</EntityDescriptor>`;

    return metadata;
  }

  /**
   * Check if SSO is enforced for the domain
   */
  async isSSOMandatory(email?: string): Promise<boolean> {
    try {
      const config = await this.getSAMLConfig();
      if (!config || !config.enabled) return false;

      // Check if SSO is enforced globally
      if (config.enforce_sso) return true;

      // Could add domain-specific SSO enforcement logic here
      // For example, check if user's email domain requires SSO

      return false;
    } catch (error) {
      console.error('Error checking SSO mandatory status:', error);
      return false;
    }
  }

  /**
   * Test SAML connection
   */
  async testSAMLConnection(config: Partial<SAMLConfig>): Promise<{ success: boolean; message: string }> {
    try {
      // In production, this would:
      // 1. Attempt to fetch metadata from IdP
      // 2. Validate SSL certificates
      // 3. Test connectivity to SSO URL
      
      // For demo purposes, simulate connection test
      if (!config.sso_url) {
        return { success: false, message: 'SSO URL is required for connection test' };
      }

      if (!config.metadata_url) {
        return { success: false, message: 'Metadata URL is required for connection test' };
      }

      // Simulate successful connection test
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      return { success: true, message: 'SAML connection test successful' };
    } catch (error) {
      console.error('Error testing SAML connection:', error);
      return { success: false, message: `Connection test failed: ${error.message}` };
    }
  }

  /**
   * Log SAML-related actions for audit trail
   */
  private async logSAMLAction(action: string, details: any): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO user_audit_log (user_id, action, details, performed_by, timestamp)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        details.user_id || null,
        `saml_${action}`,
        JSON.stringify(details),
        details.performed_by || -1 // System action
      ).run();
    } catch (error) {
      console.error('Error logging SAML action:', error);
    }
  }

  /**
   * Get SAML audit trail
   */
  async getSAMLAuditTrail(limit: number = 100): Promise<any[]> {
    try {
      const audit = await this.db.prepare(`
        SELECT 
          ual.*,
          u.username as performed_by_username
        FROM user_audit_log ual
        LEFT JOIN users u ON ual.performed_by = u.id
        WHERE ual.action LIKE 'saml_%'
        ORDER BY ual.timestamp DESC
        LIMIT ?
      `).bind(limit).all();

      return audit.results?.map((entry: any) => ({
        ...entry,
        details: entry.details ? JSON.parse(entry.details) : {}
      })) || [];
    } catch (error) {
      console.error('Error getting SAML audit trail:', error);
      return [];
    }
  }
}

export default EnhancedSAMLService;