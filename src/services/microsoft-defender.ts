/**
 * Microsoft Defender for Endpoint API Integration Service
 * Implements real Microsoft Graph Security API and Defender ATP endpoints
 */

export interface DefenderMachine {
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
  riskScore: 'None' | 'Informational' | 'Low' | 'Medium' | 'High';
  exposureLevel: 'None' | 'Low' | 'Medium' | 'High';
  isAadJoined: boolean;
  aadDeviceId: string;
  machineTags: string[];
  defenderAvStatus: 'NotApplicable' | 'Enabled' | 'Disabled' | 'NotSupported';
  onboardingStatus: 'Onboarded' | 'CanBeOnboarded' | 'Unsupported' | 'InsufficientInfo';
  osArchitecture: string;
  managedBy: 'Mdatp' | 'Intune' | 'Sccm' | 'Unknown';
  managedByStatus: 'Managed' | 'Unmanaged' | 'Unknown';
}

export interface DefenderAlert {
  id: string;
  incidentId?: number;
  investigationId?: number;
  assignedTo?: string;
  severity: 'Informational' | 'Low' | 'Medium' | 'High';
  status: 'New' | 'InProgress' | 'Resolved';
  classification?: 'TruePositive' | 'Benign' | 'FalsePositive';
  determination?: string;
  investigationState: 'Unknown' | 'Terminated' | 'SuccessfullyRemediated' | 'Benign' | 'Failed' | 'PartiallyRemediated' | 'Running' | 'PendingApproval' | 'PendingResource' | 'PartiallyInvestigated' | 'TerminatedByUser' | 'TerminatedBySystem' | 'Queued' | 'InnerFailure' | 'PreexistingAlert' | 'UnsupportedOs' | 'UnsupportedAlertType' | 'SuppressedAlert';
  category: string;
  title: string;
  description: string;
  alertCreationTime: string;
  firstEventTime: string;
  lastEventTime: string;
  lastUpdateTime: string;
  resolvedTime?: string;
  machineId: string;
  computerDnsName: string;
  aadTenantId: string;
  detectorId: string;
  comments: Array<{
    comment: string;
    createdBy: string;
    createdTime: string;
  }>;
  evidence: Array<{
    entityType: string;
    evidenceCreationTime: string;
    sha1?: string;
    sha256?: string;
    fileName?: string;
    filePath?: string;
    processId?: number;
    processCommandLine?: string;
    processCreationTime?: string;
    parentProcessId?: number;
    parentProcessCreationTime?: string;
    ipAddress?: string;
    url?: string;
    accountName?: string;
    domainName?: string;
    userSid?: string;
    aadUserId?: string;
    userPrincipalName?: string;
    detectionStatus?: string;
  }>;
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

export interface DefenderConfiguration {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  baseUrl: string;
}

export class MicrosoftDefenderService {
  private config: DefenderConfiguration;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: DefenderConfiguration) {
    this.config = {
      tenantId: config.tenantId,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scope: config.scope || 'https://api.securitycenter.microsoft.com/.default',
      baseUrl: config.baseUrl || 'https://api.securitycenter.microsoft.com'
    };
  }

  /**
   * Authenticate with Microsoft Graph using client credentials flow
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope,
      grant_type: 'client_credentials'
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;
    } catch (error) {
      console.error('Microsoft Defender authentication error:', error);
      throw new Error(`Failed to authenticate with Microsoft Defender: ${error.message}`);
    }
  }

  /**
   * Make authenticated API request to Microsoft Defender
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return response.text() as T;
  }

  /**
   * Get all machines from Microsoft Defender
   */
  async getMachines(filter?: string, top?: number): Promise<{ value: DefenderMachine[] }> {
    let endpoint = '/api/machines';
    const params = new URLSearchParams();

    if (filter) params.append('$filter', filter);
    if (top) params.append('$top', top.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await this.makeRequest<{ value: DefenderMachine[] }>(endpoint);
  }

  /**
   * Get specific machine by ID
   */
  async getMachine(machineId: string): Promise<DefenderMachine> {
    return await this.makeRequest<DefenderMachine>(`/api/machines/${machineId}`);
  }

  /**
   * Get alerts for a specific machine
   */
  async getMachineAlerts(machineId: string, filter?: string): Promise<{ value: DefenderAlert[] }> {
    let endpoint = `/api/machines/${machineId}/alerts`;
    if (filter) {
      endpoint += `?$filter=${encodeURIComponent(filter)}`;
    }
    return await this.makeRequest<{ value: DefenderAlert[] }>(endpoint);
  }

  /**
   * Get all alerts
   */
  async getAlerts(filter?: string, top?: number): Promise<{ value: DefenderAlert[] }> {
    let endpoint = '/api/alerts';
    const params = new URLSearchParams();

    if (filter) params.append('$filter', filter);
    if (top) params.append('$top', top.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await this.makeRequest<{ value: DefenderAlert[] }>(endpoint);
  }

  /**
   * Get vulnerabilities
   */
  async getVulnerabilities(filter?: string, top?: number): Promise<{ value: DefenderVulnerability[] }> {
    let endpoint = '/api/vulnerabilities';
    const params = new URLSearchParams();

    if (filter) params.append('$filter', filter);
    if (top) params.append('$top', top.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await this.makeRequest<{ value: DefenderVulnerability[] }>(endpoint);
  }

  /**
   * Get vulnerabilities for a specific machine
   */
  async getMachineVulnerabilities(machineId: string): Promise<{ value: DefenderVulnerability[] }> {
    return await this.makeRequest<{ value: DefenderVulnerability[] }>(`/api/machines/${machineId}/vulnerabilities`);
  }

  /**
   * Get machine security state
   */
  async getMachineSecurityState(machineId: string): Promise<any> {
    return await this.makeRequest(`/api/machines/${machineId}/getSecurityState`);
  }

  /**
   * Test connection to Microsoft Defender
   */
  async testConnection(): Promise<{ success: boolean; message: string; machineCount?: number }> {
    try {
      await this.authenticate();
      const result = await this.getMachines(undefined, 1);
      return {
        success: true,
        message: 'Successfully connected to Microsoft Defender for Endpoint',
        machineCount: result.value.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Convert Defender machine to ARIA5 asset format
   */
  convertMachineToAsset(machine: DefenderMachine): any {
    // Map Defender risk score to ARIA5 CIA rating (0-10)
    const riskScoreMapping = {
      'None': 1,
      'Informational': 2,
      'Low': 3,
      'Medium': 6,
      'High': 9
    };

    // Map exposure level to availability rating
    const exposureMapping = {
      'None': 9,
      'Low': 7,
      'Medium': 5,
      'High': 3
    };

    // Determine asset type based on OS platform
    const getAssetType = (platform: string) => {
      const platformLower = platform.toLowerCase();
      if (platformLower.includes('windows')) return 'Workstation';
      if (platformLower.includes('server')) return 'Server';
      if (platformLower.includes('linux')) return 'Server';
      if (platformLower.includes('android') || platformLower.includes('ios')) return 'Mobile Device';
      return 'Other';
    };

    return {
      id: machine.id,
      name: machine.computerDnsName,
      type: getAssetType(machine.osPlatform),
      ip_address: machine.lastIpAddress,
      location: machine.rbacGroupName || 'Unknown',
      owner: 'IT Operations',
      confidentiality: 7, // Default CIA rating
      integrity: 7,
      availability: exposureMapping[machine.exposureLevel] || 5,
      risk_score: riskScoreMapping[machine.riskScore] || 5,
      compliance_status: machine.healthStatus === 'Active' ? 'Compliant' : 'Non-Compliant',
      last_updated: machine.lastSeen,
      defender_data: {
        deviceValue: machine.deviceValue,
        healthStatus: machine.healthStatus,
        onboardingStatus: machine.onboardingStatus,
        osVersion: machine.osVersion,
        agentVersion: machine.agentVersion,
        managedBy: machine.managedBy,
        machineTags: machine.machineTags,
        defenderAvStatus: machine.defenderAvStatus
      }
    };
  }

  /**
   * Sync machines from Defender to ARIA5 assets
   */
  async syncMachinesToAssets(): Promise<{ 
    success: boolean; 
    message: string; 
    assets: any[]; 
    alertCount: number;
    vulnerabilityCount: number;
  }> {
    try {
      // Get machines from Defender
      const machinesResult = await this.getMachines();
      const machines = machinesResult.value;

      // Convert machines to ARIA5 asset format
      const assets = machines.map(machine => this.convertMachineToAsset(machine));

      // Get alert and vulnerability counts for context
      const alertsResult = await this.getAlerts(undefined, 100);
      const vulnerabilitiesResult = await this.getVulnerabilities(undefined, 100);

      return {
        success: true,
        message: `Successfully synced ${machines.length} machines from Microsoft Defender`,
        assets,
        alertCount: alertsResult.value.length,
        vulnerabilityCount: vulnerabilitiesResult.value.length
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        assets: [],
        alertCount: 0,
        vulnerabilityCount: 0
      };
    }
  }
}

/**
 * Factory function to create Microsoft Defender service from environment/config
 */
export function createDefenderService(env?: any): MicrosoftDefenderService | null {
  // Get configuration from environment variables or Cloudflare secrets
  const config = {
    tenantId: env?.DEFENDER_TENANT_ID || '',
    clientId: env?.DEFENDER_CLIENT_ID || '',
    clientSecret: env?.DEFENDER_CLIENT_SECRET || '',
    scope: env?.DEFENDER_SCOPE || 'https://api.securitycenter.microsoft.com/.default',
    baseUrl: env?.DEFENDER_BASE_URL || 'https://api.securitycenter.microsoft.com'
  };

  // Validate required configuration
  if (!config.tenantId || !config.clientId || !config.clientSecret) {
    console.warn('Microsoft Defender configuration incomplete. Set DEFENDER_TENANT_ID, DEFENDER_CLIENT_ID, and DEFENDER_CLIENT_SECRET.');
    return null;
  }

  return new MicrosoftDefenderService(config);
}

/**
 * Default export for easy importing
 */
export default MicrosoftDefenderService;