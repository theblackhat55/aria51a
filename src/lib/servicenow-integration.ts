// ServiceNow ITSM & CMDB Integration
// Provides comprehensive ServiceNow integration for CMDB and Service Catalogue

export interface ServiceNowConfiguration {
  instanceUrl: string; // e.g., https://yourinstance.service-now.com
  username: string;
  password: string;
  apiVersion?: string;
}

export interface ServiceNowCMDBItem {
  sys_id: string;
  sys_class_name: string;
  name: string;
  asset_tag?: string;
  serial_number?: string;
  operational_status?: string;
  install_status?: string;
  location?: string;
  department?: string;
  assigned_to?: string;
  managed_by?: string;
  ip_address?: string;
  mac_address?: string;
  os?: string;
  os_version?: string;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface ServiceNowService {
  sys_id: string;
  name: string;
  description?: string;
  service_type?: string;
  operational_status?: string;
  business_criticality?: string;
  business_owner?: string;
  technical_owner?: string;
  support_group?: string;
  sla_name?: string;
  u_availability_sla?: number;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface ServiceNowIncident {
  sys_id?: string;
  number?: string;
  short_description: string;
  description?: string;
  urgency: number; // 1=High, 2=Medium, 3=Low
  impact: number; // 1=High, 2=Medium, 3=Low
  priority?: number; // Calculated: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning
  state?: number; // 1=New, 2=In Progress, 6=Resolved, 7=Closed
  assignment_group?: string;
  assigned_to?: string;
  caller_id?: string;
  category?: string;
  subcategory?: string;
  cmdb_ci?: string; // Configuration Item sys_id
  sys_created_on?: string;
  sys_updated_on?: string;
}

export class ServiceNowIntegrationService {
  private config: ServiceNowConfiguration;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ServiceNowConfiguration) {
    this.config = {
      ...config,
      apiVersion: config.apiVersion || 'v2'
    };
    this.baseUrl = `${config.instanceUrl}/api/now`;
    
    // Basic Auth header
    const credentials = btoa(`${config.username}:${config.password}`);
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Test connection to ServiceNow instance
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test with a simple API call
      const response = await fetch(`${this.baseUrl}/table/sys_user?sysparm_limit=1`, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Connection failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Connection successful',
        details: {
          instanceUrl: this.config.instanceUrl,
          authenticated: true,
          apiVersion: this.config.apiVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    table: string, 
    method: string = 'GET', 
    params?: Record<string, string>,
    body?: any
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}/table/${table}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ServiceNow API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get CMDB Configuration Items
   */
  async getCMDBItems(options?: {
    limit?: number;
    ciClass?: string; // e.g., 'cmdb_ci_server', 'cmdb_ci_network_equipment'
    query?: string; // ServiceNow query string
  }): Promise<{ result: ServiceNowCMDBItem[] }> {
    const params: Record<string, string> = {
      sysparm_limit: (options?.limit || 100).toString(),
      sysparm_display_value: 'true'
    };

    if (options?.query) {
      params.sysparm_query = options.query;
    }

    // Default to cmdb_ci table (base class for all CIs)
    const table = options?.ciClass || 'cmdb_ci';
    
    return this.makeRequest(table, 'GET', params);
  }

  /**
   * Get specific CMDB item by sys_id
   */
  async getCMDBItem(sysId: string): Promise<{ result: ServiceNowCMDBItem }> {
    const response = await this.makeRequest(`cmdb_ci/${sysId}`, 'GET');
    return { result: response.result };
  }

  /**
   * Get Services from Service Catalogue
   */
  async getServices(options?: {
    limit?: number;
    query?: string;
  }): Promise<{ result: ServiceNowService[] }> {
    const params: Record<string, string> = {
      sysparm_limit: (options?.limit || 100).toString(),
      sysparm_display_value: 'true'
    };

    if (options?.query) {
      params.sysparm_query = options.query;
    }

    return this.makeRequest('cmdb_ci_service', 'GET', params);
  }

  /**
   * Get specific service by sys_id
   */
  async getService(sysId: string): Promise<{ result: ServiceNowService }> {
    const response = await this.makeRequest(`cmdb_ci_service/${sysId}`, 'GET');
    return { result: response.result };
  }

  /**
   * Get Incidents
   */
  async getIncidents(options?: {
    limit?: number;
    state?: number[]; // Filter by state
    priority?: number[]; // Filter by priority
    assignmentGroup?: string;
    query?: string;
  }): Promise<{ result: ServiceNowIncident[] }> {
    const params: Record<string, string> = {
      sysparm_limit: (options?.limit || 100).toString(),
      sysparm_display_value: 'true'
    };

    // Build query
    const queryParts: string[] = [];
    
    if (options?.state?.length) {
      const stateQuery = options.state.map(s => `state=${s}`).join('^OR');
      queryParts.push(`(${stateQuery})`);
    }
    
    if (options?.priority?.length) {
      const priorityQuery = options.priority.map(p => `priority=${p}`).join('^OR');
      queryParts.push(`(${priorityQuery})`);
    }
    
    if (options?.assignmentGroup) {
      queryParts.push(`assignment_group=${options.assignmentGroup}`);
    }
    
    if (options?.query) {
      queryParts.push(options.query);
    }

    if (queryParts.length > 0) {
      params.sysparm_query = queryParts.join('^');
    }

    return this.makeRequest('incident', 'GET', params);
  }

  /**
   * Create Incident
   */
  async createIncident(incident: ServiceNowIncident): Promise<{ result: ServiceNowIncident }> {
    return this.makeRequest('incident', 'POST', undefined, incident);
  }

  /**
   * Update Incident
   */
  async updateIncident(sysId: string, updates: Partial<ServiceNowIncident>): Promise<{ result: ServiceNowIncident }> {
    return this.makeRequest(`incident/${sysId}`, 'PATCH', undefined, updates);
  }

  /**
   * Get Change Requests
   */
  async getChangeRequests(options?: {
    limit?: number;
    state?: string;
    query?: string;
  }): Promise<any> {
    const params: Record<string, string> = {
      sysparm_limit: (options?.limit || 100).toString(),
      sysparm_display_value: 'true'
    };

    if (options?.query) {
      params.sysparm_query = options.query;
    }

    return this.makeRequest('change_request', 'GET', params);
  }

  /**
   * Transform ServiceNow CMDB item to ARIA asset format
   */
  transformCMDBToAsset(ci: ServiceNowCMDBItem): any {
    return {
      name: ci.name,
      type: this.mapCIClassToAssetType(ci.sys_class_name),
      criticality: this.mapBusinessCriticalityToCriticality(ci.operational_status),
      status: ci.operational_status?.toLowerCase() || 'unknown',
      ip_address: ci.ip_address,
      mac_address: ci.mac_address,
      location: ci.location,
      department: ci.department,
      owner: ci.assigned_to,
      description: `ServiceNow CI: ${ci.sys_class_name}`,
      metadata: {
        servicenow: {
          sys_id: ci.sys_id,
          sys_class_name: ci.sys_class_name,
          asset_tag: ci.asset_tag,
          serial_number: ci.serial_number,
          install_status: ci.install_status,
          managed_by: ci.managed_by,
          os: ci.os,
          os_version: ci.os_version
        }
      }
    };
  }

  /**
   * Transform ServiceNow Service to ARIA service format
   */
  transformServiceToARIAService(service: ServiceNowService): any {
    return {
      name: service.name,
      description: service.description,
      service_type: service.service_type,
      business_criticality: service.business_criticality,
      operational_status: service.operational_status,
      business_owner: service.business_owner,
      technical_owner: service.technical_owner,
      support_group: service.support_group,
      metadata: {
        servicenow: {
          sys_id: service.sys_id,
          sla_name: service.sla_name,
          availability_sla: service.u_availability_sla
        }
      }
    };
  }

  /**
   * Sync CMDB items to ARIA assets
   */
  async syncCMDBToAssets(
    db: any,
    userId: number,
    options?: {
      ciClass?: string;
      limit?: number;
      autoCreateAssets?: boolean;
    }
  ): Promise<{
    synced: number;
    created: number;
    updated: number;
    errors: string[];
  }> {
    const results = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    try {
      // Get CMDB items from ServiceNow
      const response = await this.getCMDBItems({
        ciClass: options?.ciClass,
        limit: options?.limit || 100
      });

      for (const ci of response.result) {
        try {
          // Check if asset already exists for this CI
          const existingAsset = await db.getAssetByExternalId?.(ci.sys_id);
          
          if (existingAsset) {
            // Update existing asset
            const updates = this.transformCMDBToAsset(ci);
            await db.updateAsset(existingAsset.id, updates);
            results.updated++;
          } else if (options?.autoCreateAssets) {
            // Create new asset from CI
            const assetData = this.transformCMDBToAsset(ci);
            await db.createAsset(assetData, userId);
            results.created++;
          }
          
          results.synced++;
        } catch (error) {
          results.errors.push(`Failed to sync CI ${ci.sys_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to sync CMDB items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Sync ServiceNow services to ARIA services
   */
  async syncServicesToARIA(
    db: any,
    userId: number,
    options?: {
      limit?: number;
      autoCreateServices?: boolean;
    }
  ): Promise<{
    synced: number;
    created: number;
    updated: number;
    errors: string[];
  }> {
    const results = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    try {
      // Get services from ServiceNow
      const response = await this.getServices({
        limit: options?.limit || 100
      });

      for (const service of response.result) {
        try {
          // Check if service already exists
          const existingService = await db.getServiceByExternalId?.(service.sys_id);
          
          if (existingService) {
            // Update existing service
            const updates = this.transformServiceToARIAService(service);
            await db.updateService(existingService.id, updates);
            results.updated++;
          } else if (options?.autoCreateServices) {
            // Create new service
            const serviceData = this.transformServiceToARIAService(service);
            await db.createService(serviceData, userId);
            results.created++;
          }
          
          results.synced++;
        } catch (error) {
          results.errors.push(`Failed to sync service ${service.sys_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to sync services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Helper: Map CI class to asset type
   */
  private mapCIClassToAssetType(ciClass: string): string {
    const mapping: Record<string, string> = {
      'cmdb_ci_server': 'server',
      'cmdb_ci_computer': 'workstation',
      'cmdb_ci_network_equipment': 'network',
      'cmdb_ci_storage': 'storage',
      'cmdb_ci_database': 'database',
      'cmdb_ci_app_server': 'application',
      'cmdb_ci_web_server': 'server'
    };
    
    return mapping[ciClass] || 'other';
  }

  /**
   * Helper: Map operational status to criticality
   */
  private mapBusinessCriticalityToCriticality(status?: string): string {
    if (!status) return 'medium';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('critical') || statusLower.includes('high')) return 'critical';
    if (statusLower.includes('medium') || statusLower.includes('moderate')) return 'high';
    if (statusLower.includes('low')) return 'medium';
    
    return 'medium';
  }
}
