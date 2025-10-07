/**
 * Microsoft Defender for Endpoint API Service
 * 
 * This service handles all interactions with Microsoft Defender APIs including:
 * - Azure AD authentication
 * - Advanced Hunting queries
 * - Asset/Machine management
 * - Incident management
 * - Vulnerability assessment
 * - Real-time data synchronization
 */

interface AzureADConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authority?: string;
  scope?: string;
}

interface DefenderAsset {
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
  healthStatus: string;
  deviceValue: string;
  rbacGroupId: number;
  rbacGroupName: string;
  riskScore: number;
  exposureLevel: string;
  aadDeviceId: string;
  defectMitigationStatus: string;
  onboardingStatus: string;
  sensorHealthState: string;
  isAadJoined: boolean;
  machineTags: string[];
}

interface DefenderIncident {
  incidentId: string;
  redirectIncidentId?: string;
  incidentName: string;
  createdTime: string;
  lastUpdateTime: string;
  assignedTo?: string;
  classification?: string;
  determination?: string;
  status: string;
  severity: string;
  tags: string[];
  comments: any[];
  alerts: any[];
  entities: any[];
  investigationId?: string;
  investigationState?: string;
}

interface DefenderVulnerability {
  id: string;
  name: string;
  description: string;
  severity: string;
  cvssV3: number;
  exposedMachines: number;
  publishedOn: string;
  updatedOn: string;
  publicExploit: boolean;
  exploitabilityLevel: string;
  threatName?: string;
  cvssVector?: string;
  category?: string;
  tags: string[];
}

interface AdvancedHuntingResult {
  Schema: Array<{
    Name: string;
    Type: string;
  }>;
  Results: any[];
}

export class MSDefenderService {
  private tenantId: string;
  private clientId: string;
  private clientSecret: string;
  private authority: string;
  private scope: string;
  private apiBaseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: AzureADConfig) {
    this.tenantId = config.tenantId;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.authority = config.authority || 'https://login.microsoftonline.com/';
    this.scope = config.scope || 'https://api.securitycenter.microsoft.com/.default';
    this.apiBaseUrl = 'https://api.securitycenter.microsoft.com/api/';
  }

  /**
   * Authenticate with Azure AD and get access token
   */
  async authenticate(): Promise<string> {
    // Check if current token is still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < (this.tokenExpiresAt - 300000)) {
      return this.accessToken;
    }

    const tokenUrl = `${this.authority}${this.tenantId}/oauth2/v2.0/token`;
    
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.scope,
      grant_type: 'client_credentials'
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Azure AD authentication error:', error);
      throw new Error(`Failed to authenticate with Azure AD: ${error.message}`);
    }
  }

  /**
   * Make authenticated API request to Microsoft Defender
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authenticate();
    
    const url = `${this.apiBaseUrl}${endpoint}`;
    
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
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get all machines from Microsoft Defender
   */
  async getMachines(): Promise<DefenderAsset[]> {
    try {
      const response = await this.makeRequest('machines');
      return response.value || [];
    } catch (error) {
      console.error('Failed to get machines:', error);
      throw error;
    }
  }

  /**
   * Get specific machine by ID
   */
  async getMachine(machineId: string): Promise<DefenderAsset> {
    try {
      return await this.makeRequest(`machines/${machineId}`);
    } catch (error) {
      console.error(`Failed to get machine ${machineId}:`, error);
      throw error;
    }
  }

  /**
   * Get all incidents from Microsoft Defender
   */
  async getIncidents(top: number = 100): Promise<DefenderIncident[]> {
    try {
      const response = await this.makeRequest(`incidents?$top=${top}`);
      return response.value || [];
    } catch (error) {
      console.error('Failed to get incidents:', error);
      throw error;
    }
  }

  /**
   * Get specific incident by ID
   */
  async getIncident(incidentId: string): Promise<DefenderIncident> {
    try {
      return await this.makeRequest(`incidents/${incidentId}`);
    } catch (error) {
      console.error(`Failed to get incident ${incidentId}:`, error);
      throw error;
    }
  }

  /**
   * Get vulnerabilities from Microsoft Defender
   */
  async getVulnerabilities(top: number = 100): Promise<DefenderVulnerability[]> {
    try {
      const response = await this.makeRequest(`vulnerabilities?$top=${top}`);
      return response.value || [];
    } catch (error) {
      console.error('Failed to get vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Get machines affected by a specific vulnerability
   */
  async getVulnerabilityMachines(vulnerabilityId: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(`vulnerabilities/${vulnerabilityId}/machineReferences`);
      return response.value || [];
    } catch (error) {
      console.error(`Failed to get machines for vulnerability ${vulnerabilityId}:`, error);
      throw error;
    }
  }

  /**
   * Execute Advanced Hunting query
   */
  async advancedHunting(query: string): Promise<AdvancedHuntingResult> {
    try {
      const response = await this.makeRequest('advancedqueries/run', {
        method: 'POST',
        body: JSON.stringify({ Query: query })
      });
      
      return {
        Schema: response.Schema || [],
        Results: response.Results || []
      };
    } catch (error) {
      console.error('Advanced hunting query failed:', error);
      throw error;
    }
  }

  /**
   * Get incidents related to a specific machine
   */
  async getMachineIncidents(machineId: string): Promise<DefenderIncident[]> {
    const query = `
      AlertInfo
      | where TimeGenerated > ago(30d)
      | join (AlertEvidence | where EntityType == "Machine" and DeviceId == "${machineId}") on AlertId
      | join (
          IncidentInfo 
          | project IncidentId, IncidentName, Severity, Status, Classification, CreatedTime, LastUpdateTime
      ) on \$left.IncidentId == \$right.IncidentId
      | project IncidentId, IncidentName, Severity, Status, Classification, CreatedTime, LastUpdateTime, AlertId, Title
      | summarize 
          AlertCount = count(),
          AlertTitles = make_list(Title)
          by IncidentId, IncidentName, Severity, Status, Classification, CreatedTime, LastUpdateTime
      | order by CreatedTime desc
    `;

    try {
      const result = await this.advancedHunting(query);
      return result.Results.map(row => ({
        incidentId: row.IncidentId,
        incidentName: row.IncidentName,
        severity: row.Severity,
        status: row.Status,
        classification: row.Classification,
        createdTime: row.CreatedTime,
        lastUpdateTime: row.LastUpdateTime,
        alerts: row.AlertTitles || [],
        entities: [],
        tags: [],
        comments: []
      } as DefenderIncident));
    } catch (error) {
      console.error(`Failed to get incidents for machine ${machineId}:`, error);
      return [];
    }
  }

  /**
   * Get vulnerabilities for a specific machine
   */
  async getMachineVulnerabilities(machineId: string): Promise<DefenderVulnerability[]> {
    const query = `
      DeviceTvmSoftwareVulnerabilities
      | where DeviceId == "${machineId}"
      | join (
          DeviceTvmSoftwareVulnerabilitiesKB
          | project VulnerabilityId, VulnerabilityName, VulnerabilityDescription, VulnerabilitySeverityLevel, 
                    CvssScore, PublishedDate, VulnerabilityCategory, IsExploitAvailable, ThreatName
      ) on VulnerabilityId
      | project VulnerabilityId, VulnerabilityName, VulnerabilityDescription, VulnerabilitySeverityLevel,
                CvssScore, PublishedDate, VulnerabilityCategory, IsExploitAvailable, ThreatName,
                SoftwareName, SoftwareVersion, OSPlatform
      | summarize 
          SoftwareList = make_list(strcat(SoftwareName, " ", SoftwareVersion)),
          OSPlatforms = make_set(OSPlatform)
          by VulnerabilityId, VulnerabilityName, VulnerabilityDescription, VulnerabilitySeverityLevel,
             CvssScore, PublishedDate, VulnerabilityCategory, IsExploitAvailable, ThreatName
      | order by CvssScore desc
    `;

    try {
      const result = await this.advancedHunting(query);
      return result.Results.map(row => ({
        id: row.VulnerabilityId,
        name: row.VulnerabilityName,
        description: row.VulnerabilityDescription,
        severity: row.VulnerabilitySeverityLevel,
        cvssV3: parseFloat(row.CvssScore) || 0,
        publishedOn: row.PublishedDate,
        updatedOn: row.PublishedDate,
        publicExploit: row.IsExploitAvailable === true,
        exploitabilityLevel: row.IsExploitAvailable ? 'High' : 'Low',
        threatName: row.ThreatName,
        category: row.VulnerabilityCategory,
        exposedMachines: 1, // Single machine context
        tags: row.SoftwareList || []
      } as DefenderVulnerability));
    } catch (error) {
      console.error(`Failed to get vulnerabilities for machine ${machineId}:`, error);
      return [];
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('machines?$top=1');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API status and configuration
   */
  async getStatus(): Promise<{
    connected: boolean;
    lastAuth: string | null;
    tokenExpires: string | null;
    error?: string;
  }> {
    try {
      const isConnected = await this.testConnection();
      return {
        connected: isConnected,
        lastAuth: this.accessToken ? new Date().toISOString() : null,
        tokenExpires: this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toISOString() : null
      };
    } catch (error) {
      return {
        connected: false,
        lastAuth: null,
        tokenExpires: null,
        error: error.message
      };
    }
  }

  /**
   * Predefined Advanced Hunting queries
   */
  static getStandardQueries(): Array<{
    name: string;
    description: string;
    query: string;
    category: string;
  }> {
    return [
      {
        name: 'High Risk Machines',
        description: 'Find machines with high risk scores and recent alerts',
        category: 'Asset Discovery',
        query: `
          DeviceInfo
          | join (
              AlertInfo
              | where TimeGenerated > ago(7d)
              | summarize AlertCount = count() by DeviceId
          ) on DeviceId
          | where RiskScore > 70 or AlertCount > 5
          | project DeviceId, DeviceName, OSPlatform, RiskScore, AlertCount, LastSeen
          | order by RiskScore desc
        `
      },
      {
        name: 'Critical Vulnerabilities',
        description: 'Find critical vulnerabilities across all machines',
        category: 'Vulnerability Management',
        query: `
          DeviceTvmSoftwareVulnerabilities
          | join DeviceTvmSoftwareVulnerabilitiesKB on VulnerabilityId
          | where VulnerabilitySeverityLevel == "Critical"
          | summarize 
              MachineCount = dcount(DeviceId),
              Machines = make_set(DeviceName)
              by VulnerabilityId, VulnerabilityName, CvssScore
          | order by CvssScore desc
        `
      },
      {
        name: 'Recent Incident Timeline',
        description: 'Timeline of incidents and alerts in the last 48 hours',
        category: 'Incident Investigation',
        query: `
          AlertInfo
          | where TimeGenerated > ago(2d)
          | join (IncidentInfo) on IncidentId
          | project TimeGenerated, IncidentId, IncidentName, Title, Severity, Category, Status
          | order by TimeGenerated desc
        `
      },
      {
        name: 'PowerShell Activity Analysis',
        description: 'Analyze PowerShell execution patterns for suspicious activity',
        category: 'Threat Hunting',
        query: `
          DeviceProcessEvents
          | where TimeGenerated > ago(24h)
          | where ProcessCommandLine contains "powershell"
          | summarize 
              ExecutionCount = count(),
              UniqueCommands = dcount(ProcessCommandLine),
              Commands = make_set(ProcessCommandLine)
              by DeviceId, DeviceName, AccountName
          | where ExecutionCount > 10 or UniqueCommands > 5
          | order by ExecutionCount desc
        `
      },
      {
        name: 'Network Communication Patterns',
        description: 'Identify suspicious network connections and patterns',
        category: 'Threat Hunting',
        query: `
          DeviceNetworkEvents
          | where TimeGenerated > ago(24h)
          | summarize 
              ConnectionCount = count(),
              UniqueIPs = dcount(RemoteIP),
              RemoteIPs = make_set(RemoteIP)
              by DeviceId, DeviceName, LocalPort, Protocol
          | where ConnectionCount > 100 or UniqueIPs > 50
          | order by ConnectionCount desc
        `
      }
    ];
  }
}

/**
 * Database integration helper functions
 */
export class DefenderDatabaseService {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Sync assets from Defender API to database
   */
  async syncAssets(assets: DefenderAsset[]): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    let created = 0, updated = 0, failed = 0;

    for (const asset of assets) {
      try {
        // Check if asset exists
        const existing = await this.db.prepare(`
          SELECT id FROM defender_assets WHERE machine_id = ?
        `).bind(asset.id).first();

        if (existing) {
          // Update existing asset
          await this.db.prepare(`
            UPDATE defender_assets SET
              device_name = ?, computer_dns_name = ?, os_platform = ?, os_version = ?,
              last_ip_address = ?, health_status = ?, device_value = ?, risk_score = ?,
              exposure_level = ?, last_seen = ?, sensor_health_state = ?, is_aad_joined = ?,
              updated_at = CURRENT_TIMESTAMP, last_sync = CURRENT_TIMESTAMP
            WHERE machine_id = ?
          `).bind(
            asset.computerDnsName,
            asset.computerDnsName,
            asset.osPlatform,
            asset.osVersion,
            asset.lastIpAddress,
            asset.healthStatus,
            asset.deviceValue,
            asset.riskScore,
            asset.exposureLevel,
            asset.lastSeen,
            asset.sensorHealthState,
            asset.isAadJoined ? 1 : 0,
            asset.id
          ).run();
          updated++;
        } else {
          // Create new asset
          await this.db.prepare(`
            INSERT INTO defender_assets (
              machine_id, device_name, computer_dns_name, os_platform, os_version,
              last_ip_address, health_status, device_value, risk_score, exposure_level,
              first_seen, last_seen, sensor_health_state, is_aad_joined,
              created_at, updated_at, last_sync
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            asset.id,
            asset.computerDnsName,
            asset.computerDnsName,
            asset.osPlatform,
            asset.osVersion,
            asset.lastIpAddress,
            asset.healthStatus,
            asset.deviceValue,
            asset.riskScore,
            asset.exposureLevel,
            asset.firstSeen,
            asset.lastSeen,
            asset.sensorHealthState,
            asset.isAadJoined ? 1 : 0
          ).run();
          created++;
        }
      } catch (error) {
        console.error(`Failed to sync asset ${asset.id}:`, error);
        failed++;
      }
    }

    return { created, updated, failed };
  }

  /**
   * Sync incidents from Defender API to database
   */
  async syncIncidents(incidents: DefenderIncident[]): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    let created = 0, updated = 0, failed = 0;

    for (const incident of incidents) {
      try {
        // Check if incident exists
        const existing = await this.db.prepare(`
          SELECT id FROM defender_incidents WHERE incident_id = ?
        `).bind(incident.incidentId).first();

        if (existing) {
          // Update existing incident
          await this.db.prepare(`
            UPDATE defender_incidents SET
              incident_name = ?, severity = ?, status = ?, classification = ?,
              assigned_to = ?, last_update_time = ?, alerts_count = ?,
              updated_at = CURRENT_TIMESTAMP, last_sync = CURRENT_TIMESTAMP
            WHERE incident_id = ?
          `).bind(
            incident.incidentName,
            incident.severity,
            incident.status,
            incident.classification,
            incident.assignedTo,
            incident.lastUpdateTime,
            incident.alerts?.length || 0,
            incident.incidentId
          ).run();
          updated++;
        } else {
          // Create new incident
          await this.db.prepare(`
            INSERT INTO defender_incidents (
              incident_id, incident_name, severity, status, classification,
              assigned_to, created_time, last_update_time, alerts_count,
              description, created_at, updated_at, last_sync
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            incident.incidentId,
            incident.incidentName,
            incident.severity,
            incident.status,
            incident.classification,
            incident.assignedTo,
            incident.createdTime,
            incident.lastUpdateTime,
            incident.alerts?.length || 0,
            `${incident.incidentName} - Imported from Microsoft Defender`
          ).run();
          created++;
        }
      } catch (error) {
        console.error(`Failed to sync incident ${incident.incidentId}:`, error);
        failed++;
      }
    }

    return { created, updated, failed };
  }

  /**
   * Log sync operation
   */
  async logSync(syncType: string, status: string, stats: any, error?: string): Promise<void> {
    await this.db.prepare(`
      INSERT INTO defender_sync_logs (
        sync_type, status, records_processed, records_created, records_updated, records_failed,
        error_message, started_at, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      syncType,
      status,
      stats.processed || 0,
      stats.created || 0,
      stats.updated || 0,
      stats.failed || 0,
      error || null,
      new Date().toISOString(),
    ).run();
  }
}