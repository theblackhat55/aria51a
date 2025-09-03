// Microsoft Defender for Endpoint API Integration
// Provides real threat intelligence and security data for ARIA5.1

export interface DefenderAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Informational' | 'Low' | 'Medium' | 'High';
  status: 'New' | 'InProgress' | 'Resolved';
  classification: 'TruePositive' | 'FalsePositive' | 'BenignPositive' | 'Unknown';
  determination: string;
  category: string;
  threatFamilyName?: string;
  machineId: string;
  computerDnsName: string;
  creationTime: string;
  lastUpdateTime: string;
  firstEventTime: string;
  lastEventTime: string;
  resolvedTime?: string;
  incidentId?: number;
  investigationId?: number;
  assignedTo?: string;
}

export interface DefenderDevice {
  id: string;
  computerDnsName: string;
  firstSeen: string;
  lastSeen: string;
  osPlatform: string;
  osVersion: string;
  osProcessor: string;
  version: string;
  lastIpAddress: string;
  lastExternalIpAddress: string;
  agentVersion: string;
  osBuild: number;
  healthStatus: 'Active' | 'Inactive' | 'ImpairedCommunication' | 'NoSensorData' | 'NoSensorDataImpairedCommunication';
  deviceValue: 'Normal' | 'Low' | 'High';
  rbacGroupId: number;
  rbacGroupName: string;
  riskScore: 'None' | 'Low' | 'Medium' | 'High';
  exposureLevel: 'None' | 'Low' | 'Medium' | 'High';
  isAadJoined: boolean;
  aadDeviceId?: string;
  machineTags: string[];
}

export interface DefenderVulnerability {
  id: string;
  name: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  cvssV3: number;
  exposedMachines: number;
  publishedOn: string;
  updatedOn: string;
  publicExploit: boolean;
  exploitVerified: boolean;
  exploitInKit: boolean;
  exploitTypes: string[];
  exploitUris: string[];
}

export interface DefenderRecommendation {
  id: string;
  productName: string;
  recommendationName: string;
  weaknesses: number;
  vendor: string;
  recommendedVersion: string;
  recommendationCategory: string;
  subCategory: string;
  severityScore: number;
  publicExploit: boolean;
  activeAlert: boolean;
  associatedThreats: string[];
  remediationType: string;
  status: string;
  configScoreImpact: number;
  exposureImpact: number;
  totalMachineCount: number;
  exposedMachinesCount: number;
}

export interface DefenderIncident {
  incidentId: number;
  incidentName: string;
  createdTime: string;
  lastUpdateTime: string;
  assignedTo?: string;
  classification: 'TruePositive' | 'FalsePositive' | 'BenignPositive' | 'Unknown';
  determination: string;
  status: 'Active' | 'Resolved' | 'Redirected';
  severity: 'Informational' | 'Low' | 'Medium' | 'High';
  tags: string[];
  comments: Array<{
    comment: string;
    createdBy: string;
    createdTime: string;
  }>;
  alerts: DefenderAlert[];
}

export interface DefenderThreatIntelligence {
  indicator: string;
  indicatorType: 'FileSha1' | 'FileSha256' | 'IpAddress' | 'DomainName' | 'Url';
  title: string;
  description: string;
  confidence: number;
  severity: 'Informational' | 'Low' | 'Medium' | 'High';
  recommendedActions: string;
  threatType: string;
  objectType: string;
  createdBy: string;
  createdBySource: string;
  creationTimeDateTimeUtc: string;
  lastUpdateTimeDateTimeUtc: string;
  tags: string[];
}

export interface DefenderConfiguration {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  apiVersion?: string;
}

export class MicrosoftDefenderService {
  private config: DefenderConfiguration;
  private accessToken?: string;
  private tokenExpiration?: number;

  constructor(config: DefenderConfiguration) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.securitycenter.microsoft.com',
      apiVersion: config.apiVersion || 'v1.0'
    };
  }

  /**
   * Authenticate with Microsoft Graph API
   */
  async authenticate(): Promise<void> {
    if (this.accessToken && this.tokenExpiration && Date.now() < this.tokenExpiration) {
      return; // Token is still valid
    }

    try {
      const response = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'https://api.securitycenter.microsoft.com/.default',
          grant_type: 'client_credentials'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute before expiry
      
    } catch (error) {
      throw new Error(`Microsoft Defender authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.authenticate();

    const response = await fetch(`${this.config.baseUrl}/api/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft Defender API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Test connection to Microsoft Defender
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const alerts = await this.getAlerts({ limit: 1 });
      
      return {
        success: true,
        message: 'Connection successful',
        details: {
          alertsAvailable: Array.isArray(alerts.value) ? alerts.value.length : 0,
          authenticated: !!this.accessToken
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
   * Get security alerts
   */
  async getAlerts(options?: {
    limit?: number;
    severity?: string[];
    status?: string[];
    timeRange?: string; // e.g., 'P7D' for last 7 days
    assignedTo?: string;
  }): Promise<{ value: DefenderAlert[]; '@odata.nextLink'?: string }> {
    let filter = [];
    
    if (options?.severity?.length) {
      const severityFilter = options.severity.map(s => `severity eq '${s}'`).join(' or ');
      filter.push(`(${severityFilter})`);
    }
    
    if (options?.status?.length) {
      const statusFilter = options.status.map(s => `status eq '${s}'`).join(' or ');
      filter.push(`(${statusFilter})`);
    }
    
    if (options?.timeRange) {
      filter.push(`creationTime ge ${new Date(Date.now() - this.parseTimeRange(options.timeRange)).toISOString()}`);
    }
    
    if (options?.assignedTo) {
      filter.push(`assignedTo eq '${options.assignedTo}'`);
    }

    const params = new URLSearchParams();
    if (filter.length > 0) {
      params.append('$filter', filter.join(' and '));
    }
    if (options?.limit) {
      params.append('$top', options.limit.toString());
    }
    params.append('$orderby', 'creationTime desc');

    const endpoint = `alerts${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get device information
   */
  async getDevices(options?: {
    limit?: number;
    healthStatus?: string[];
    riskScore?: string[];
    exposureLevel?: string[];
  }): Promise<{ value: DefenderDevice[]; '@odata.nextLink'?: string }> {
    let filter = [];
    
    if (options?.healthStatus?.length) {
      const healthFilter = options.healthStatus.map(h => `healthStatus eq '${h}'`).join(' or ');
      filter.push(`(${healthFilter})`);
    }
    
    if (options?.riskScore?.length) {
      const riskFilter = options.riskScore.map(r => `riskScore eq '${r}'`).join(' or ');
      filter.push(`(${riskFilter})`);
    }
    
    if (options?.exposureLevel?.length) {
      const exposureFilter = options.exposureLevel.map(e => `exposureLevel eq '${e}'`).join(' or ');
      filter.push(`(${exposureFilter})`);
    }

    const params = new URLSearchParams();
    if (filter.length > 0) {
      params.append('$filter', filter.join(' and '));
    }
    if (options?.limit) {
      params.append('$top', options.limit.toString());
    }
    params.append('$orderby', 'lastSeen desc');

    const endpoint = `machines${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get vulnerabilities
   */
  async getVulnerabilities(options?: {
    limit?: number;
    severity?: string[];
    publicExploit?: boolean;
  }): Promise<{ value: DefenderVulnerability[]; '@odata.nextLink'?: string }> {
    let filter = [];
    
    if (options?.severity?.length) {
      const severityFilter = options.severity.map(s => `severity eq '${s}'`).join(' or ');
      filter.push(`(${severityFilter})`);
    }
    
    if (options?.publicExploit !== undefined) {
      filter.push(`publicExploit eq ${options.publicExploit}`);
    }

    const params = new URLSearchParams();
    if (filter.length > 0) {
      params.append('$filter', filter.join(' and '));
    }
    if (options?.limit) {
      params.append('$top', options.limit.toString());
    }
    params.append('$orderby', 'publishedOn desc');

    const endpoint = `vulnerabilities${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get security recommendations
   */
  async getRecommendations(options?: {
    limit?: number;
    severityScore?: number; // Minimum severity score
    publicExploit?: boolean;
    activeAlert?: boolean;
  }): Promise<{ value: DefenderRecommendation[]; '@odata.nextLink'?: string }> {
    let filter = [];
    
    if (options?.severityScore !== undefined) {
      filter.push(`severityScore ge ${options.severityScore}`);
    }
    
    if (options?.publicExploit !== undefined) {
      filter.push(`publicExploit eq ${options.publicExploit}`);
    }
    
    if (options?.activeAlert !== undefined) {
      filter.push(`activeAlert eq ${options.activeAlert}`);
    }

    const params = new URLSearchParams();
    if (filter.length > 0) {
      params.append('$filter', filter.join(' and '));
    }
    if (options?.limit) {
      params.append('$top', options.limit.toString());
    }
    params.append('$orderby', 'severityScore desc');

    const endpoint = `recommendations${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get incidents
   */
  async getIncidents(options?: {
    limit?: number;
    status?: string[];
    severity?: string[];
    assignedTo?: string;
  }): Promise<{ value: DefenderIncident[]; '@odata.nextLink'?: string }> {
    let filter = [];
    
    if (options?.status?.length) {
      const statusFilter = options.status.map(s => `status eq '${s}'`).join(' or ');
      filter.push(`(${statusFilter})`);
    }
    
    if (options?.severity?.length) {
      const severityFilter = options.severity.map(s => `severity eq '${s}'`).join(' or ');
      filter.push(`(${severityFilter})`);
    }
    
    if (options?.assignedTo) {
      filter.push(`assignedTo eq '${options.assignedTo}'`);
    }

    const params = new URLSearchParams();
    if (filter.length > 0) {
      params.append('$filter', filter.join(' and '));
    }
    if (options?.limit) {
      params.append('$top', options.limit.toString());
    }
    params.append('$orderby', 'createdTime desc');

    const endpoint = `incidents${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get threat intelligence indicators
   */
  async getThreatIntelligence(options?: {
    limit?: number;
    indicatorType?: string[];
    threatType?: string;
    confidence?: number; // Minimum confidence level
  }): Promise<{ value: DefenderThreatIntelligence[]; '@odata.nextLink'?: string }> {
    let filter = [];
    
    if (options?.indicatorType?.length) {
      const typeFilter = options.indicatorType.map(t => `indicatorType eq '${t}'`).join(' or ');
      filter.push(`(${typeFilter})`);
    }
    
    if (options?.threatType) {
      filter.push(`threatType eq '${options.threatType}'`);
    }
    
    if (options?.confidence !== undefined) {
      filter.push(`confidence ge ${options.confidence}`);
    }

    const params = new URLSearchParams();
    if (filter.length > 0) {
      params.append('$filter', filter.join(' and '));
    }
    if (options?.limit) {
      params.append('$top', options.limit.toString());
    }
    params.append('$orderby', 'creationTimeDateTimeUtc desc');

    const endpoint = `indicators${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Create or update an alert
   */
  async updateAlert(alertId: string, updates: {
    status?: string;
    assignedTo?: string;
    classification?: string;
    determination?: string;
    comment?: string;
  }): Promise<any> {
    return this.makeRequest(`alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Create incident from alerts
   */
  async createIncident(data: {
    incidentName: string;
    assignedTo?: string;
    severity: string;
    alertIds: string[];
    comment?: string;
  }): Promise<any> {
    return this.makeRequest('incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get security score
   */
  async getSecurityScore(): Promise<{
    currentScore: number;
    maxScore: number;
    percentage: number;
    controlScores: Array<{
      controlName: string;
      score: number;
      max: number;
      percentage: number;
    }>;
  }> {
    const response = await this.makeRequest('exposureScore');
    
    return {
      currentScore: response.score || 0,
      maxScore: 1000, // Microsoft Secure Score max
      percentage: Math.round((response.score / 1000) * 100),
      controlScores: response.controlScores || []
    };
  }

  /**
   * Parse time range string to milliseconds
   */
  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/P(\d+)([DWMY])/);
    if (!match) return 86400000; // Default to 1 day
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'D': return value * 86400000; // days
      case 'W': return value * 604800000; // weeks
      case 'M': return value * 2629746000; // months (approximate)
      case 'Y': return value * 31556952000; // years (approximate)
      default: return 86400000;
    }
  }

  /**
   * Transform Defender alert to ARIA5 risk format
   */
  transformAlertToRisk(alert: DefenderAlert): any {
    const severityMap = {
      'Informational': 1,
      'Low': 2,
      'Medium': 3,
      'High': 4
    };

    const impactMap = {
      'Informational': 1,
      'Low': 2,
      'Medium': 3,
      'High': 5
    };

    return {
      title: alert.title,
      description: alert.description,
      category: 'Security',
      subcategory: alert.category,
      probability: severityMap[alert.severity] || 3,
      impact: impactMap[alert.severity] || 3,
      source: 'Microsoft Defender',
      status: alert.status === 'New' ? 'active' : 'monitoring',
      affected_assets: alert.computerDnsName,
      external_id: alert.id,
      detection_date: alert.creationTime,
      metadata: {
        defenderAlert: {
          id: alert.id,
          severity: alert.severity,
          classification: alert.classification,
          determination: alert.determination,
          machineId: alert.machineId,
          incidentId: alert.incidentId,
          threatFamily: alert.threatFamilyName
        }
      }
    };
  }

  /**
   * Sync alerts with ARIA5 risk management
   */
  async syncAlertsToRisks(
    db: any, 
    userId: number, 
    options?: {
      severityFilter?: string[];
      timeRange?: string;
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
      // Get alerts from Defender
      const alertsResponse = await this.getAlerts({
        severity: options?.severityFilter || ['Medium', 'High'],
        timeRange: options?.timeRange || 'P7D', // Last 7 days
        limit: 100
      });

      for (const alert of alertsResponse.value) {
        try {
          // Check if risk already exists for this alert
          const existingRisk = await db.getRiskByExternalId?.(alert.id);
          
          if (existingRisk) {
            // Update existing risk
            const updates = {
              status: alert.status === 'Resolved' ? 'resolved' : 'active',
              updated_at: new Date().toISOString()
            };
            
            await db.updateRisk(existingRisk.id, updates);
            results.updated++;
          } else if (options?.autoCreateRisks) {
            // Create new risk from alert
            const riskData = this.transformAlertToRisk(alert);
            const riskId = await db.createRisk(riskData, userId);
            
            // Create audit log
            await db.createAuditLog(
              userId, 
              'CREATE', 
              'risk', 
              riskId, 
              null, 
              { source: 'Microsoft Defender Sync', alert_id: alert.id }
            );
            
            results.created++;
          }
          
          results.synced++;
        } catch (error) {
          results.errors.push(`Failed to sync alert ${alert.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to sync alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }
}