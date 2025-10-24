// Tenable.io Vulnerability Management Integration
// Provides comprehensive Tenable.io integration for vulnerability assessment

export interface TenableConfiguration {
  accessKey: string;
  secretKey: string;
  baseUrl?: string;
}

export interface TenableVulnerability {
  plugin_id: number;
  plugin_name: string;
  plugin_family: string;
  severity: number; // 0=Info, 1=Low, 2=Medium, 3=High, 4=Critical
  severity_name: string;
  
  // Asset Information
  asset: {
    uuid: string;
    hostname?: string;
    fqdn?: string;
    ipv4?: string;
    operating_system?: string[];
  };
  
  // CVE & Scoring
  cve?: string[];
  cvss_base_score?: number;
  cvss_temporal_score?: number;
  cvss3_base_score?: number;
  cvss3_temporal_score?: number;
  vpr_score?: number; // Vulnerability Priority Rating
  
  // Vulnerability Details
  description?: string;
  solution?: string;
  synopsis?: string;
  see_also?: string[];
  plugin_publication_date?: string;
  plugin_modification_date?: string;
  vuln_publication_date?: string;
  
  // Detection
  first_found?: string;
  last_found?: string;
  state: string; // 'OPEN', 'REOPENED', 'FIXED'
  
  // Evidence
  output?: string; // Plugin output
  port?: {
    port: number;
    protocol: string;
    service?: string;
  };
  
  // Scan Information
  scan?: {
    schedule_uuid?: string;
    started_at?: string;
    completed_at?: string;
  };
}

export interface TenableAsset {
  id: string;
  uuid?: string;
  
  // Identifiers
  fqdn?: string[];
  hostname?: string[];
  ipv4?: string[];
  ipv6?: string[];
  mac_address?: string[];
  netbios_name?: string[];
  
  // Operating System
  operating_system?: string[];
  os_family?: string;
  
  // Network
  network_id?: string[];
  
  // Asset Details
  has_agent?: boolean;
  agent_name?: string[];
  aws_ec2_instance_id?: string[];
  azure_vm_id?: string[];
  
  // Scoring
  exposure_score?: number; // Asset Exposure Score (AES)
  acr_score?: number; // Asset Criticality Rating
  
  // Timing
  last_seen?: string;
  first_seen?: string;
  last_authenticated_scan_date?: string;
  
  // Tags
  tags?: Array<{
    key: string;
    value: string;
    added_by?: string;
    added_at?: string;
  }>;
}

export interface TenableScan {
  id: number;
  uuid: string;
  name: string;
  type: string;
  status: string;
  enabled: boolean;
  
  // Schedule
  starttime?: string;
  timezone?: string;
  rrules?: any;
  
  // Stats
  last_modification_date?: number;
  creation_date?: number;
  control?: boolean;
  shared?: boolean;
  user_permissions?: number;
  
  // Progress
  read?: boolean;
  status_text?: string;
}

export interface TenableExport {
  uuid: string;
  status: string; // 'QUEUED', 'PROCESSING', 'FINISHED', 'ERROR'
  chunks_available?: number[];
  empty_response?: boolean;
}

export class TenableIntegrationService {
  private config: TenableConfiguration;
  private baseUrl: string;

  constructor(config: TenableConfiguration) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://cloud.tenable.com'
    };
    this.baseUrl = this.config.baseUrl;
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-ApiKeys': `accessKey=${this.config.accessKey}; secretKey=${this.config.secretKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Test connection to Tenable.io
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test with a simple API call - get current user
      const response = await fetch(`${this.baseUrl}/session`, {
        headers: this.getHeaders()
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
          user: data.username,
          email: data.email,
          container_name: data.container_name,
          permissions: data.permissions
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
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders()
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tenable API error: ${response.status} ${errorText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Get list of scans
   */
  async getScans(): Promise<{ scans: TenableScan[] }> {
    return this.makeRequest('/scans');
  }

  /**
   * Get scan details
   */
  async getScanDetails(scanId: number): Promise<any> {
    return this.makeRequest(`/scans/${scanId}`);
  }

  /**
   * Export vulnerabilities (newer API)
   */
  async exportVulnerabilities(filters?: any): Promise<{ export_uuid: string }> {
    const payload = {
      num_assets: 5000, // Max assets per export
      filters: filters || {}
    };
    
    return this.makeRequest('/vulns/export', 'POST', payload);
  }

  /**
   * Check export status
   */
  async getExportStatus(exportUuid: string): Promise<TenableExport> {
    return this.makeRequest(`/vulns/export/${exportUuid}/status`);
  }

  /**
   * Download export chunk
   */
  async downloadExportChunk(exportUuid: string, chunkId: number): Promise<TenableVulnerability[]> {
    return this.makeRequest(`/vulns/export/${exportUuid}/chunks/${chunkId}`);
  }

  /**
   * Get all vulnerabilities (handles export/download flow)
   */
  async getAllVulnerabilities(filters?: any): Promise<TenableVulnerability[]> {
    try {
      // 1. Request export
      const exportResponse = await this.exportVulnerabilities(filters);
      const exportUuid = exportResponse.export_uuid;
      
      // 2. Poll for export completion (max 60 seconds)
      let attempts = 0;
      let exportStatus: TenableExport;
      
      while (attempts < 30) { // 30 attempts * 2 seconds = 60 seconds max
        exportStatus = await this.getExportStatus(exportUuid);
        
        if (exportStatus.status === 'FINISHED') {
          break;
        } else if (exportStatus.status === 'ERROR') {
          throw new Error('Export failed');
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
      
      if (exportStatus!.status !== 'FINISHED') {
        throw new Error('Export timeout');
      }
      
      // 3. Download all chunks
      const vulnerabilities: TenableVulnerability[] = [];
      const chunks = exportStatus!.chunks_available || [];
      
      for (const chunkId of chunks) {
        const chunkData = await this.downloadExportChunk(exportUuid, chunkId);
        vulnerabilities.push(...chunkData);
      }
      
      return vulnerabilities;
      
    } catch (error) {
      throw new Error(`Failed to get vulnerabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export assets
   */
  async exportAssets(filters?: any): Promise<{ export_uuid: string }> {
    const payload = {
      chunk_size: 1000,
      filters: filters || {}
    };
    
    return this.makeRequest('/assets/export', 'POST', payload);
  }

  /**
   * Get asset export status
   */
  async getAssetExportStatus(exportUuid: string): Promise<TenableExport> {
    return this.makeRequest(`/assets/export/${exportUuid}/status`);
  }

  /**
   * Download asset export chunk
   */
  async downloadAssetExportChunk(exportUuid: string, chunkId: number): Promise<TenableAsset[]> {
    return this.makeRequest(`/assets/export/${exportUuid}/chunks/${chunkId}`);
  }

  /**
   * Get all assets (handles export/download flow)
   */
  async getAllAssets(filters?: any): Promise<TenableAsset[]> {
    try {
      // 1. Request export
      const exportResponse = await this.exportAssets(filters);
      const exportUuid = exportResponse.export_uuid;
      
      // 2. Poll for export completion
      let attempts = 0;
      let exportStatus: TenableExport;
      
      while (attempts < 30) {
        exportStatus = await this.getAssetExportStatus(exportUuid);
        
        if (exportStatus.status === 'FINISHED') {
          break;
        } else if (exportStatus.status === 'ERROR') {
          throw new Error('Asset export failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
      
      if (exportStatus!.status !== 'FINISHED') {
        throw new Error('Asset export timeout');
      }
      
      // 3. Download all chunks
      const assets: TenableAsset[] = [];
      const chunks = exportStatus!.chunks_available || [];
      
      for (const chunkId of chunks) {
        const chunkData = await this.downloadAssetExportChunk(exportUuid, chunkId);
        assets.push(...chunkData);
      }
      
      return assets;
      
    } catch (error) {
      throw new Error(`Failed to get assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform Tenable vulnerability to ARIA risk format
   */
  transformVulnerabilityToRisk(vuln: TenableVulnerability): any {
    // Map Tenable severity (0-4) to ARIA probability/impact (1-5)
    const severityMap: Record<number, { probability: number; impact: number }> = {
      0: { probability: 1, impact: 1 }, // Info
      1: { probability: 2, impact: 2 }, // Low
      2: { probability: 3, impact: 3 }, // Medium
      3: { probability: 4, impact: 4 }, // High
      4: { probability: 5, impact: 5 }  // Critical
    };
    
    const mapped = severityMap[vuln.severity] || { probability: 3, impact: 3 };
    
    return {
      title: vuln.plugin_name,
      description: vuln.description || vuln.synopsis || 'No description available',
      category: 'Security',
      subcategory: 'Vulnerability',
      probability: mapped.probability,
      impact: mapped.impact,
      source: 'Tenable.io',
      status: vuln.state === 'FIXED' ? 'resolved' : 'active',
      affected_assets: vuln.asset.hostname || vuln.asset.ipv4 || vuln.asset.uuid,
      external_id: `tenable-${vuln.plugin_id}-${vuln.asset.uuid}`,
      detection_date: vuln.first_found,
      metadata: {
        tenable: {
          plugin_id: vuln.plugin_id,
          plugin_family: vuln.plugin_family,
          severity: vuln.severity,
          severity_name: vuln.severity_name,
          cve: vuln.cve,
          cvss_base_score: vuln.cvss_base_score,
          cvss3_base_score: vuln.cvss3_base_score,
          vpr_score: vuln.vpr_score,
          solution: vuln.solution,
          see_also: vuln.see_also,
          asset_uuid: vuln.asset.uuid,
          port: vuln.port,
          output: vuln.output
        }
      }
    };
  }

  /**
   * Transform Tenable asset to ARIA asset format
   */
  transformAssetToARIAAsset(asset: TenableAsset): any {
    return {
      name: asset.hostname?.[0] || asset.fqdn?.[0] || asset.ipv4?.[0] || asset.uuid || 'Unknown',
      type: this.detectAssetType(asset),
      criticality: this.calculateCriticality(asset),
      status: 'active',
      ip_address: asset.ipv4?.[0],
      mac_address: asset.mac_address?.[0],
      fqdn: asset.fqdn?.[0],
      description: `Tenable Asset: ${asset.operating_system?.[0] || 'Unknown OS'}`,
      metadata: {
        tenable: {
          uuid: asset.uuid,
          exposure_score: asset.exposure_score,
          acr_score: asset.acr_score,
          has_agent: asset.has_agent,
          agent_name: asset.agent_name?.[0],
          operating_system: asset.operating_system?.[0],
          os_family: asset.os_family,
          last_seen: asset.last_seen,
          first_seen: asset.first_seen,
          last_authenticated_scan: asset.last_authenticated_scan_date,
          tags: asset.tags
        }
      }
    };
  }

  /**
   * Sync vulnerabilities to ARIA risks
   */
  async syncVulnerabilitiesToRisks(
    db: any,
    userId: number,
    options?: {
      severityFilter?: number[]; // Array of severity levels: 0-4
      limit?: number;
      autoCreateRisks?: boolean;
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
      // Build filters
      const filters: any = {};
      
      if (options?.severityFilter?.length) {
        filters.severity = options.severityFilter;
      }
      
      // Get vulnerabilities from Tenable
      const vulnerabilities = await this.getAllVulnerabilities(filters);
      
      // Limit if specified
      const vulnsToProcess = options?.limit 
        ? vulnerabilities.slice(0, options.limit)
        : vulnerabilities;

      for (const vuln of vulnsToProcess) {
        try {
          const externalId = `tenable-${vuln.plugin_id}-${vuln.asset.uuid}`;
          
          // Check if risk already exists
          const existingRisk = await db.getRiskByExternalId?.(externalId);
          
          if (existingRisk) {
            // Update existing risk
            const updates = {
              status: vuln.state === 'FIXED' ? 'resolved' : 'active',
              updated_at: new Date().toISOString()
            };
            
            await db.updateRisk(existingRisk.id, updates);
            results.updated++;
          } else if (options?.autoCreateRisks) {
            // Create new risk from vulnerability
            const riskData = this.transformVulnerabilityToRisk(vuln);
            const riskId = await db.createRisk(riskData, userId);
            
            // Create audit log
            await db.createAuditLog(
              userId,
              'CREATE',
              'risk',
              riskId,
              null,
              { source: 'Tenable.io Sync', plugin_id: vuln.plugin_id }
            );
            
            results.created++;
          }
          
          results.synced++;
        } catch (error) {
          results.errors.push(`Failed to sync vulnerability ${vuln.plugin_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to sync vulnerabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Sync Tenable assets to ARIA assets
   */
  async syncAssetsToARIA(
    db: any,
    userId: number,
    options?: {
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
      // Get assets from Tenable
      const assets = await this.getAllAssets();
      
      // Limit if specified
      const assetsToProcess = options?.limit 
        ? assets.slice(0, options.limit)
        : assets;

      for (const asset of assetsToProcess) {
        try {
          // Check if asset already exists
          const existingAsset = await db.getAssetByExternalId?.(asset.uuid);
          
          if (existingAsset) {
            // Update existing asset
            const updates = this.transformAssetToARIAAsset(asset);
            await db.updateAsset(existingAsset.id, updates);
            results.updated++;
          } else if (options?.autoCreateAssets) {
            // Create new asset
            const assetData = this.transformAssetToARIAAsset(asset);
            await db.createAsset(assetData, userId);
            results.created++;
          }
          
          results.synced++;
        } catch (error) {
          results.errors.push(`Failed to sync asset ${asset.uuid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to sync assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Helper: Detect asset type from Tenable data
   */
  private detectAssetType(asset: TenableAsset): string {
    const os = asset.operating_system?.[0]?.toLowerCase() || '';
    
    if (os.includes('windows server') || os.includes('linux') && os.includes('server')) {
      return 'server';
    } else if (os.includes('windows') || os.includes('mac')) {
      return 'workstation';
    } else if (os.includes('cisco') || os.includes('juniper') || os.includes('router')) {
      return 'network';
    } else if (os.includes('vmware') || os.includes('hypervisor')) {
      return 'virtual';
    }
    
    return 'other';
  }

  /**
   * Helper: Calculate asset criticality from exposure score
   */
  private calculateCriticality(asset: TenableAsset): string {
    const exposureScore = asset.exposure_score || 0;
    
    if (exposureScore >= 900) return 'critical';
    if (exposureScore >= 700) return 'high';
    if (exposureScore >= 400) return 'medium';
    
    return 'low';
  }
}
