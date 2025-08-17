// Microsoft Graph API Integration Service
// Handles Microsoft Defender for Endpoint and Entra ID integration

export interface MicrosoftConfig {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  scopes: string[];
}

export interface DefenderAsset {
  id: string;
  computerDnsName: string;
  osPlatform: string;
  osVersion: string;
  lastIpAddress: string;
  lastExternalIpAddress: string;
  riskScore: string;
  exposureLevel: string;
  deviceValue: string;
  rbacGroupName: string;
  aadDeviceId: string;
  machineTags: string[];
  healthStatus: string;
  onboardingStatus: string;
  lastSeen: string;
}

export interface DefenderIncident {
  id: string;
  incidentId: string;
  redirectIncidentId: string | null;
  incidentName: string;
  createdTime: string;
  lastUpdateTime: string;
  assignedTo: string | null;
  classification: string;
  determination: string;
  status: string;
  severity: string;
  tags: string[];
  comments: any[];
  alerts: any[];
}

export interface DefenderVulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  exploitAvailable: boolean;
  publicExploit: boolean;
  publishedDate: string;
  updatedDate: string;
  affectedProducts: string[];
  mitigationSteps: string;
  workarounds: string;
}

export class MicrosoftGraphService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private config: MicrosoftConfig) {}

  /**
   * Get Microsoft Graph API access token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenant_id}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', this.config.client_id);
    params.append('client_secret', this.config.client_secret);
    params.append('scope', this.config.scopes.join(' '));
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000); // 1 minute buffer

    return this.accessToken;
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async makeGraphRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make authenticated request to Microsoft Defender API
   */
  private async makeDefenderRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://api.securitycenter.microsoft.com/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Defender API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get devices from Microsoft Defender for Endpoint
   */
  async getDefenderDevices(): Promise<DefenderAsset[]> {
    try {
      const response = await this.makeDefenderRequest('/machines');
      return response.value || [];
    } catch (error) {
      console.error('Error fetching Defender devices:', error);
      throw error;
    }
  }

  /**
   * Get incidents from Microsoft Defender for Endpoint
   */
  async getDefenderIncidents(): Promise<DefenderIncident[]> {
    try {
      const response = await this.makeDefenderRequest('/incidents');
      return response.value || [];
    } catch (error) {
      console.error('Error fetching Defender incidents:', error);
      throw error;
    }
  }

  /**
   * Get vulnerabilities from Microsoft Defender for Endpoint
   */
  async getDefenderVulnerabilities(): Promise<DefenderVulnerability[]> {
    try {
      const response = await this.makeDefenderRequest('/vulnerabilities');
      return response.value || [];
    } catch (error) {
      console.error('Error fetching Defender vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Get machine vulnerabilities from Microsoft Defender
   */
  async getMachineVulnerabilities(machineId: string): Promise<any[]> {
    try {
      const response = await this.makeDefenderRequest(`/machines/${machineId}/vulnerabilities`);
      return response.value || [];
    } catch (error) {
      console.error('Error fetching machine vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Get security alerts from Microsoft Graph
   */
  async getSecurityAlerts(): Promise<any[]> {
    try {
      const response = await this.makeGraphRequest('/security/alerts');
      return response.value || [];
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      throw error;
    }
  }

  /**
   * Sync assets from Microsoft Defender to local database
   */
  async syncAssetsToDatabase(db: any, organizationId: number): Promise<number> {
    try {
      const devices = await this.getDefenderDevices();
      let syncedCount = 0;

      for (const device of devices) {
        try {
          // Map Defender device to our asset schema
          const assetData = {
            asset_id: device.id,
            name: device.computerDnsName || 'Unknown Device',
            asset_type: this.mapOsPlatformToAssetType(device.osPlatform),
            operating_system: `${device.osPlatform} ${device.osVersion}`,
            ip_address: device.lastIpAddress,
            risk_score: this.parseRiskScore(device.riskScore),
            exposure_level: this.mapExposureLevel(device.exposureLevel),
            device_tags: JSON.stringify(device.machineTags || []),
            organization_id: organizationId,
            last_sync: new Date().toISOString(),
          };

          // Insert or update asset
          await db.prepare(`
            INSERT OR REPLACE INTO assets 
            (asset_id, name, asset_type, operating_system, ip_address, risk_score, 
             exposure_level, device_tags, organization_id, last_sync, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            assetData.asset_id,
            assetData.name,
            assetData.asset_type,
            assetData.operating_system,
            assetData.ip_address,
            assetData.risk_score,
            assetData.exposure_level,
            assetData.device_tags,
            assetData.organization_id,
            assetData.last_sync
          ).run();

          syncedCount++;
        } catch (deviceError) {
          console.error(`Error syncing device ${device.id}:`, deviceError);
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing assets:', error);
      throw error;
    }
  }

  /**
   * Sync incidents from Microsoft Defender to local database
   */
  async syncIncidentsToDatabase(db: any): Promise<number> {
    try {
      const incidents = await this.getDefenderIncidents();
      let syncedCount = 0;

      for (const incident of incidents) {
        try {
          // Insert or update Defender incident
          await db.prepare(`
            INSERT OR REPLACE INTO defender_incidents 
            (incident_id, title, description, severity, status, classification, determination,
             created_datetime, last_update_datetime, assigned_to, tags, comments, evidence,
             alerts_count, last_sync, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            incident.incidentId,
            incident.incidentName,
            incident.incidentName, // Use title as description for now
            incident.severity.toLowerCase(),
            incident.status.toLowerCase(),
            incident.classification,
            incident.determination,
            incident.createdTime,
            incident.lastUpdateTime,
            incident.assignedTo,
            JSON.stringify(incident.tags || []),
            JSON.stringify(incident.comments || []),
            JSON.stringify([]), // Evidence placeholder
            incident.alerts?.length || 0,
            new Date().toISOString()
          ).run();

          syncedCount++;
        } catch (incidentError) {
          console.error(`Error syncing incident ${incident.incidentId}:`, incidentError);
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing incidents:', error);
      throw error;
    }
  }

  /**
   * Sync vulnerabilities from Microsoft Defender to local database
   */
  async syncVulnerabilitiesToDatabase(db: any): Promise<number> {
    try {
      const vulnerabilities = await this.getDefenderVulnerabilities();
      let syncedCount = 0;

      for (const vuln of vulnerabilities) {
        try {
          // Insert or update vulnerability
          await db.prepare(`
            INSERT OR REPLACE INTO defender_vulnerabilities 
            (vulnerability_id, cve_id, title, description, severity, cvss_score,
             exploit_available, public_exploit, published_date, updated_date,
             affected_products, mitigation_steps, workarounds, last_sync, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            vuln.id,
            vuln.cveId,
            vuln.title,
            vuln.description,
            vuln.severity.toLowerCase(),
            vuln.cvssScore || 0,
            vuln.exploitAvailable ? 1 : 0,
            vuln.publicExploit ? 1 : 0,
            vuln.publishedDate,
            vuln.updatedDate,
            JSON.stringify(vuln.affectedProducts || []),
            vuln.mitigationSteps || '',
            vuln.workarounds || '',
            new Date().toISOString()
          ).run();

          syncedCount++;
        } catch (vulnError) {
          console.error(`Error syncing vulnerability ${vuln.id}:`, vulnError);
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Sync asset vulnerabilities and update risk scores
   */
  async syncAssetVulnerabilities(db: any): Promise<number> {
    try {
      // Get all assets with Microsoft Defender asset IDs
      const assets = await db.prepare('SELECT id, asset_id FROM assets WHERE asset_id IS NOT NULL').all();
      let syncedCount = 0;

      for (const asset of assets.results) {
        try {
          const machineVulns = await this.getMachineVulnerabilities(asset.asset_id);
          
          for (const machineVuln of machineVulns) {
            // Find the vulnerability in our database
            const vulnResult = await db.prepare(
              'SELECT id FROM defender_vulnerabilities WHERE vulnerability_id = ?'
            ).bind(machineVuln.vulnerabilityId).first();

            if (vulnResult) {
              // Link asset to vulnerability
              await db.prepare(`
                INSERT OR REPLACE INTO asset_vulnerabilities
                (asset_id, vulnerability_id, detected_date, remediation_status, priority, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
              `).bind(
                asset.id,
                vulnResult.id,
                machineVuln.detectedDate || new Date().toISOString(),
                'open',
                this.mapVulnerabilityPriority(machineVuln.severity)
              ).run();

              syncedCount++;
            }
          }

          // Update asset vulnerability metrics
          await this.updateAssetVulnerabilityMetrics(db, asset.id);
        } catch (assetError) {
          console.error(`Error syncing vulnerabilities for asset ${asset.asset_id}:`, assetError);
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing asset vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Update asset vulnerability metrics
   */
  private async updateAssetVulnerabilityMetrics(db: any, assetId: number): Promise<void> {
    try {
      const metrics = await db.prepare(`
        SELECT 
          COUNT(*) as total_vulns,
          COUNT(CASE WHEN dv.severity = 'critical' THEN 1 END) as critical_vulns,
          AVG(dv.cvss_score) as avg_cvss
        FROM asset_vulnerabilities av
        JOIN defender_vulnerabilities dv ON av.vulnerability_id = dv.id
        WHERE av.asset_id = ? AND av.remediation_status = 'open'
      `).bind(assetId).first();

      if (metrics) {
        const vulnerabilityScore = this.calculateVulnerabilityScore(
          metrics.total_vulns || 0,
          metrics.critical_vulns || 0,
          metrics.avg_cvss || 0
        );

        await db.prepare(`
          UPDATE assets 
          SET vulnerability_count = ?,
              critical_vulnerabilities = ?,
              vulnerability_score = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          metrics.total_vulns || 0,
          metrics.critical_vulns || 0,
          vulnerabilityScore,
          assetId
        ).run();
      }
    } catch (error) {
      console.error('Error updating asset vulnerability metrics:', error);
    }
  }

  /**
   * Calculate vulnerability score based on count and severity
   */
  private calculateVulnerabilityScore(totalVulns: number, criticalVulns: number, avgCvss: number): number {
    // Weight critical vulnerabilities more heavily
    const criticalWeight = criticalVulns * 3;
    const totalWeight = totalVulns * 1;
    const cvssWeight = avgCvss * 0.1;
    
    const score = (criticalWeight + totalWeight + cvssWeight) / 10;
    return Math.min(Math.max(score, 0), 10); // Ensure 0-10 range
  }

  /**
   * Map vulnerability severity to priority
   */
  private mapVulnerabilityPriority(severity: string): string {
    if (!severity) return 'medium';
    
    const sev = severity.toLowerCase();
    if (sev === 'critical') return 'critical';
    if (sev === 'high') return 'high';
    if (sev === 'medium') return 'medium';
    return 'low';
  }

  /**
   * Map OS platform to asset type
   */
  private mapOsPlatformToAssetType(osPlatform: string): string {
    if (!osPlatform) return 'device';
    
    const platform = osPlatform.toLowerCase();
    if (platform.includes('windows')) return 'workstation';
    if (platform.includes('linux')) return 'server';
    if (platform.includes('macos')) return 'workstation';
    if (platform.includes('android') || platform.includes('ios')) return 'mobile';
    
    return 'device';
  }

  /**
   * Parse risk score from string to number
   */
  private parseRiskScore(riskScore: string): number {
    if (!riskScore) return 0;
    
    const score = riskScore.toLowerCase();
    if (score === 'low') return 2;
    if (score === 'medium') return 5;
    if (score === 'high') return 8;
    if (score === 'critical') return 10;
    
    // Try to parse as number
    const numericScore = parseFloat(riskScore);
    return isNaN(numericScore) ? 0 : Math.min(Math.max(numericScore, 0), 10);
  }

  /**
   * Map exposure level from Defender to our schema
   */
  private mapExposureLevel(exposureLevel: string): string {
    if (!exposureLevel) return 'low';
    
    const level = exposureLevel.toLowerCase();
    if (level.includes('low')) return 'low';
    if (level.includes('medium')) return 'medium';
    if (level.includes('high')) return 'high';
    if (level.includes('critical')) return 'critical';
    
    return 'low';
  }

  /**
   * Test connection to Microsoft APIs
   */
  async testConnection(): Promise<{ graph: boolean; defender: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();
      
      // Test Graph API
      let graphWorking = false;
      try {
        await this.makeGraphRequest('/me');
        graphWorking = true;
      } catch (graphError) {
        console.error('Graph API test failed:', graphError);
      }

      // Test Defender API
      let defenderWorking = false;
      try {
        await this.makeDefenderRequest('/machines?$top=1');
        defenderWorking = true;
      } catch (defenderError) {
        console.error('Defender API test failed:', defenderError);
      }

      // Test Vulnerabilities API
      let vulnerabilitiesWorking = false;
      try {
        await this.makeDefenderRequest('/vulnerabilities?$top=1');
        vulnerabilitiesWorking = true;
      } catch (vulnError) {
        console.error('Vulnerabilities API test failed:', vulnError);
      }

      return {
        graph: graphWorking,
        defender: defenderWorking,
        vulnerabilities: vulnerabilitiesWorking
      };
    } catch (error) {
      return {
        graph: false,
        defender: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Enhanced Risk Scoring based on Microsoft Defender data
 */
export class EnhancedRiskScoring {
  /**
   * Calculate asset-based risk category
   */
  static calculateAssetBasedRiskCategory(
    assetRiskScore: number,
    incidentCount: number,
    assetType: string
  ): string {
    // Base category on asset criticality
    const assetCriticality = {
      'server': 1.5,
      'database': 1.8,
      'network_device': 1.6,
      'workstation': 1.0,
      'mobile': 0.8,
      'iot': 0.6,
    };

    const multiplier = assetCriticality[assetType as keyof typeof assetCriticality] || 1.0;
    const adjustedScore = (assetRiskScore * multiplier) + (incidentCount * 0.5);

    if (adjustedScore >= 8) return 'infrastructure_security';
    if (adjustedScore >= 6) return 'operational_risk';
    if (adjustedScore >= 4) return 'compliance_governance';
    if (adjustedScore >= 2) return 'data_privacy';
    
    return 'business_continuity';
  }

  /**
   * Calculate service risk rating based on linked assets
   */
  static calculateServiceRiskRating(assets: Array<{ risk_score: number; incident_count: number }>): number {
    if (assets.length === 0) return 0;

    // Calculate weighted average based on asset risk scores and incident counts
    const totalRiskScore = assets.reduce((sum, asset) => {
      const incidentWeight = Math.min(asset.incident_count * 0.2, 2); // Cap incident impact
      return sum + asset.risk_score + incidentWeight;
    }, 0);

    const averageRisk = totalRiskScore / assets.length;
    return Math.min(Math.max(averageRisk, 0), 10); // Ensure 0-10 range
  }

  /**
   * Update risk scores based on new vulnerability data
   */
  static async updateRiskScoresFromVulnerabilities(db: any): Promise<void> {
    try {
      // Update asset vulnerability risk scores
      const assetsQuery = `
        SELECT a.id, a.risk_score as current_risk_score,
               COUNT(av.id) as total_vulns,
               COUNT(CASE WHEN dv.severity = 'critical' THEN 1 END) as critical_vulns,
               COUNT(CASE WHEN dv.severity = 'high' THEN 1 END) as high_vulns,
               AVG(dv.cvss_score) as avg_cvss
        FROM assets a
        LEFT JOIN asset_vulnerabilities av ON a.id = av.asset_id AND av.remediation_status = 'open'
        LEFT JOIN defender_vulnerabilities dv ON av.vulnerability_id = dv.id
        GROUP BY a.id
      `;

      const assets = await db.prepare(assetsQuery).all();

      for (const asset of assets.results) {
        // Calculate vulnerability-based risk contribution
        const vulnRiskScore = this.calculateVulnerabilityRiskScore(
          asset.total_vulns || 0,
          asset.critical_vulns || 0,
          asset.high_vulns || 0,
          asset.avg_cvss || 0
        );

        // Combine current risk with vulnerability risk (weighted approach)
        const combinedRiskScore = Math.min(
          (asset.current_risk_score * 0.6) + (vulnRiskScore * 0.4),
          10
        );

        await db.prepare(`
          UPDATE assets 
          SET risk_score = ?,
              vulnerability_risk_score = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          combinedRiskScore,
          vulnRiskScore,
          asset.id
        ).run();
      }

      // Update risk categories based on vulnerability data
      const risksQuery = `
        SELECT r.id, r.risk_score,
               AVG(a.vulnerability_risk_score) as avg_vuln_risk,
               COUNT(av.id) as total_asset_vulns,
               COUNT(CASE WHEN dv.severity = 'critical' THEN 1 END) as critical_vulns
        FROM risks r
        LEFT JOIN risk_assets ra ON r.id = ra.risk_id
        LEFT JOIN assets a ON ra.asset_id = a.id
        LEFT JOIN asset_vulnerabilities av ON a.id = av.asset_id AND av.remediation_status = 'open'
        LEFT JOIN defender_vulnerabilities dv ON av.vulnerability_id = dv.id
        GROUP BY r.id
      `;

      const risks = await db.prepare(risksQuery).all();

      for (const risk of risks.results) {
        if (risk.avg_vuln_risk > 0) {
          // Adjust risk score based on vulnerability exposure
          const vulnAdjustedScore = Math.min(
            risk.risk_score + (risk.avg_vuln_risk * 0.3),
            25 // Cap at matrix maximum
          );

          await db.prepare(`
            UPDATE risks 
            SET vulnerability_exposure_score = ?,
                automated_risk_score = ?,
                critical_vulnerability_count = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            risk.avg_vuln_risk,
            vulnAdjustedScore,
            risk.critical_vulns || 0,
            risk.id
          ).run();
        }
      }

    } catch (error) {
      console.error('Error updating risk scores from vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Calculate vulnerability-based risk score
   */
  static calculateVulnerabilityRiskScore(
    totalVulns: number,
    criticalVulns: number,
    highVulns: number,
    avgCvss: number
  ): number {
    // Weight different vulnerability factors
    const criticalWeight = criticalVulns * 4;  // Critical vulns have highest impact
    const highWeight = highVulns * 2;          // High vulns moderate impact
    const totalWeight = totalVulns * 0.5;     // Total count base impact
    const cvssWeight = avgCvss * 0.8;          // CVSS score factor
    
    const rawScore = (criticalWeight + highWeight + totalWeight + cvssWeight) / 10;
    return Math.min(Math.max(rawScore, 0), 10); // Ensure 0-10 range
  }

  /**
   * Update risk scores based on new incident data
   */
  static async updateRiskScoresFromIncidents(db: any): Promise<void> {
    try {
      // Update asset-based risk categories for all risks
      const risksQuery = `
        SELECT r.id, r.risk_score, 
               AVG(a.risk_score) as avg_asset_risk,
               COUNT(ai.id) as incident_count,
               GROUP_CONCAT(a.asset_type) as asset_types
        FROM risks r
        LEFT JOIN risk_assets ra ON r.id = ra.risk_id
        LEFT JOIN assets a ON ra.asset_id = a.id
        LEFT JOIN asset_incidents ai ON a.id = ai.asset_id
        GROUP BY r.id
      `;

      const risks = await db.prepare(risksQuery).all();

      for (const risk of risks.results) {
        if (risk.avg_asset_risk && risk.asset_types) {
          const assetTypes = risk.asset_types.split(',');
          const primaryAssetType = assetTypes[0] || 'workstation';
          
          const assetBasedCategory = this.calculateAssetBasedRiskCategory(
            risk.avg_asset_risk,
            risk.incident_count || 0,
            primaryAssetType
          );

          const automatedRiskScore = risk.avg_asset_risk + (risk.incident_count * 0.5);

          await db.prepare(`
            UPDATE risks 
            SET asset_based_category = ?,
                automated_risk_score = ?,
                defender_incident_count = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            assetBasedCategory,
            Math.min(automatedRiskScore, 25), // Cap at 25 (5x5 matrix max)
            risk.incident_count || 0,
            risk.id
          ).run();
        }
      }

      // Update service risk ratings
      const servicesQuery = `
        SELECT s.id,
               AVG(a.risk_score) as avg_asset_risk,
               COUNT(ai.id) as total_incidents
        FROM services s
        LEFT JOIN assets a ON s.id = a.service_id
        LEFT JOIN asset_incidents ai ON a.id = ai.asset_id
        GROUP BY s.id
      `;

      const services = await db.prepare(servicesQuery).all();

      for (const service of services.results) {
        if (service.avg_asset_risk) {
          const serviceRiskRating = this.calculateServiceRiskRating([{
            risk_score: service.avg_asset_risk,
            incident_count: service.total_incidents || 0
          }]);

          await db.prepare(`
            UPDATE services 
            SET risk_rating = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(serviceRiskRating, service.id).run();
        }
      }

    } catch (error) {
      console.error('Error updating risk scores from incidents:', error);
      throw error;
    }
  }
}