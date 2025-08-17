// Microsoft Defender Integration Service
// Handles data synchronization with Microsoft Defender for Endpoint and Graph API

import { CloudflareBindings } from './types';
import { DefenderAsset, DefenderIncident, DefenderVulnerability, MicrosoftConfig } from './microsoft-integration';

export interface DefenderSyncResult {
  assets: {
    total_fetched: number;
    new_assets: number;
    updated_assets: number;
    errors: number;
  };
  incidents: {
    total_fetched: number;
    new_incidents: number;
    updated_incidents: number;
    errors: number;
  };
  vulnerabilities: {
    total_fetched: number;
    new_vulnerabilities: number;
    updated_vulnerabilities: number;
    errors: number;
  };
  sync_duration_ms: number;
  last_sync: string;
}

export interface DefenderAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  scope: string;
}

export class DefenderIntegrationService {
  private env: CloudflareBindings;
  private config: MicrosoftConfig;
  private authToken: DefenderAuthToken | null = null;

  constructor(env: CloudflareBindings) {
    this.env = env;
    this.config = null;
  }

  // Initialize configuration from database
  async initialize(): Promise<void> {
    try {
      const configRow = await this.env.DB.prepare(`
        SELECT * FROM microsoft_integration_config 
        WHERE sync_enabled = 1 
        ORDER BY created_at DESC 
        LIMIT 1
      `).first();

      if (!configRow) {
        console.warn('⚠️ No Microsoft integration configuration found');
        return;
      }

      this.config = {
        tenant_id: configRow.tenant_id,
        client_id: configRow.client_id,
        client_secret: configRow.client_secret, // In production, decrypt this
        scopes: JSON.parse(configRow.scopes || '[]')
      };

      console.log('✅ Microsoft Defender integration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Defender integration:', error);
      throw error;
    }
  }

  // ====================
  // AUTHENTICATION
  // ====================

  async getAccessToken(): Promise<string> {
    try {
      // Check if current token is still valid
      if (this.authToken && Date.now() < this.authToken.expires_at - 60000) {
        return this.authToken.access_token;
      }

      if (!this.config) {
        throw new Error('Microsoft integration not configured');
      }

      console.log('🔑 Requesting new access token from Microsoft');

      const tokenUrl = `https://login.microsoftonline.com/${this.config.tenant_id}/oauth2/v2.0/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.client_id,
          client_secret: this.config.client_secret,
          scope: 'https://api.securitycenter.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      
      this.authToken = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: Date.now() + (tokenData.expires_in * 1000),
        scope: tokenData.scope
      };

      console.log('✅ Access token acquired successfully');
      return this.authToken.access_token;
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  // ====================
  // DATA SYNCHRONIZATION
  // ====================

  async performFullSync(): Promise<DefenderSyncResult> {
    const startTime = Date.now();
    console.log('🔄 Starting full Microsoft Defender sync');

    try {
      if (!this.config) {
        await this.initialize();
      }

      const results: DefenderSyncResult = {
        assets: { total_fetched: 0, new_assets: 0, updated_assets: 0, errors: 0 },
        incidents: { total_fetched: 0, new_incidents: 0, updated_incidents: 0, errors: 0 },
        vulnerabilities: { total_fetched: 0, new_vulnerabilities: 0, updated_vulnerabilities: 0, errors: 0 },
        sync_duration_ms: 0,
        last_sync: new Date().toISOString()
      };

      // Sync assets (devices)
      try {
        const assetResults = await this.syncAssets();
        results.assets = assetResults;
        console.log(`✅ Assets sync completed: ${assetResults.new_assets} new, ${assetResults.updated_assets} updated`);
      } catch (error) {
        console.error('❌ Assets sync failed:', error);
        results.assets.errors++;
      }

      // Sync incidents
      try {
        const incidentResults = await this.syncIncidents();
        results.incidents = incidentResults;
        console.log(`✅ Incidents sync completed: ${incidentResults.new_incidents} new, ${incidentResults.updated_incidents} updated`);
      } catch (error) {
        console.error('❌ Incidents sync failed:', error);
        results.incidents.errors++;
      }

      // Sync vulnerabilities
      try {
        const vulnResults = await this.syncVulnerabilities();
        results.vulnerabilities = vulnResults;
        console.log(`✅ Vulnerabilities sync completed: ${vulnResults.new_vulnerabilities} new, ${vulnResults.updated_vulnerabilities} updated`);
      } catch (error) {
        console.error('❌ Vulnerabilities sync failed:', error);
        results.vulnerabilities.errors++;
      }

      // Update sync timestamp
      await this.env.DB.prepare(`
        UPDATE microsoft_integration_config 
        SET last_sync = datetime('now') 
        WHERE sync_enabled = 1
      `).run();

      results.sync_duration_ms = Date.now() - startTime;
      console.log(`🎉 Full Defender sync completed in ${results.sync_duration_ms}ms`);

      return results;
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      throw error;
    }
  }

  // ====================
  // ASSET SYNCHRONIZATION
  // ====================

  private async syncAssets(): Promise<{ total_fetched: number; new_assets: number; updated_assets: number; errors: number; }> {
    const token = await this.getAccessToken();
    let totalFetched = 0;
    let newAssets = 0;
    let updatedAssets = 0;
    let errors = 0;
    let nextUrl = 'https://api.securitycenter.microsoft.com/api/machines';

    console.log('📡 Fetching assets from Microsoft Defender...');

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Assets API call failed: ${response.status}`);
        }

        const data = await response.json();
        const assets = data.value || [];
        totalFetched += assets.length;

        // Process each asset
        for (const defenderAsset of assets) {
          try {
            const existingAsset = await this.env.DB.prepare(`
              SELECT id FROM assets WHERE asset_id = ?
            `).bind(defenderAsset.id).first();

            if (existingAsset) {
              // Update existing asset
              await this.env.DB.prepare(`
                UPDATE assets SET
                  name = ?,
                  operating_system = ?,
                  ip_address = ?,
                  last_seen = ?,
                  risk_score = ?,
                  exposure_level = ?,
                  device_tags = ?,
                  compliance_status = ?,
                  updated_at = datetime('now'),
                  last_sync = datetime('now')
                WHERE asset_id = ?
              `).bind(
                defenderAsset.computerDnsName,
                defenderAsset.osPlatform + ' ' + defenderAsset.osVersion,
                defenderAsset.lastIpAddress,
                defenderAsset.lastSeen,
                this.mapDefenderRiskScore(defenderAsset.riskScore),
                this.mapDefenderExposureLevel(defenderAsset.exposureLevel),
                JSON.stringify(defenderAsset.machineTags || []),
                defenderAsset.healthStatus === 'Active' ? 'compliant' : 'non_compliant',
                defenderAsset.id
              ).run();
              updatedAssets++;
            } else {
              // Create new asset
              await this.env.DB.prepare(`
                INSERT INTO assets (
                  asset_id, name, asset_type, operating_system, ip_address,
                  last_seen, risk_score, exposure_level, device_tags, 
                  compliance_status, organization_id, created_at, last_sync
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `).bind(
                defenderAsset.id,
                defenderAsset.computerDnsName,
                this.mapDefenderDeviceType(defenderAsset.osPlatform),
                defenderAsset.osPlatform + ' ' + defenderAsset.osVersion,
                defenderAsset.lastIpAddress,
                defenderAsset.lastSeen,
                this.mapDefenderRiskScore(defenderAsset.riskScore),
                this.mapDefenderExposureLevel(defenderAsset.exposureLevel),
                JSON.stringify(defenderAsset.machineTags || []),
                defenderAsset.healthStatus === 'Active' ? 'compliant' : 'non_compliant',
                1 // Default organization
              ).run();
              newAssets++;
            }
          } catch (assetError) {
            console.error(`Failed to sync asset ${defenderAsset.id}:`, assetError);
            errors++;
          }
        }

        // Check for next page
        nextUrl = data['@odata.nextLink'] || null;
        
        // Rate limiting - delay between requests
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Assets sync error:', error);
      throw error;
    }

    return { total_fetched: totalFetched, new_assets: newAssets, updated_assets: updatedAssets, errors };
  }

  // ====================
  // INCIDENT SYNCHRONIZATION
  // ====================

  private async syncIncidents(): Promise<{ total_fetched: number; new_incidents: number; updated_incidents: number; errors: number; }> {
    const token = await this.getAccessToken();
    let totalFetched = 0;
    let newIncidents = 0;
    let updatedIncidents = 0;
    let errors = 0;

    // Fetch incidents from last 30 days
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const filterDate = fromDate.toISOString();

    let nextUrl = `https://api.securitycenter.microsoft.com/api/incidents?$filter=createdTime ge ${filterDate}`;

    console.log('🚨 Fetching incidents from Microsoft Defender...');

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Incidents API call failed: ${response.status}`);
        }

        const data = await response.json();
        const incidents = data.value || [];
        totalFetched += incidents.length;

        // Process each incident
        for (const defenderIncident of incidents) {
          try {
            const existingIncident = await this.env.DB.prepare(`
              SELECT id FROM defender_incidents WHERE incident_id = ?
            `).bind(defenderIncident.incidentId).first();

            if (existingIncident) {
              // Update existing incident
              await this.env.DB.prepare(`
                UPDATE defender_incidents SET
                  title = ?,
                  description = ?,
                  severity = ?,
                  status = ?,
                  classification = ?,
                  determination = ?,
                  last_update_datetime = ?,
                  assigned_to = ?,
                  tags = ?,
                  alerts_count = ?,
                  updated_at = datetime('now'),
                  last_sync = datetime('now')
                WHERE incident_id = ?
              `).bind(
                defenderIncident.incidentName,
                defenderIncident.description || '',
                this.mapDefenderSeverity(defenderIncident.severity),
                this.mapDefenderStatus(defenderIncident.status),
                defenderIncident.classification,
                defenderIncident.determination,
                defenderIncident.lastUpdateTime,
                defenderIncident.assignedTo,
                JSON.stringify(defenderIncident.tags || []),
                defenderIncident.alerts?.length || 0,
                defenderIncident.incidentId
              ).run();
              updatedIncidents++;
            } else {
              // Create new incident
              await this.env.DB.prepare(`
                INSERT INTO defender_incidents (
                  incident_id, title, description, severity, status,
                  classification, determination, created_datetime,
                  last_update_datetime, assigned_to, tags, alerts_count,
                  created_at, last_sync
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `).bind(
                defenderIncident.incidentId,
                defenderIncident.incidentName,
                defenderIncident.description || '',
                this.mapDefenderSeverity(defenderIncident.severity),
                this.mapDefenderStatus(defenderIncident.status),
                defenderIncident.classification,
                defenderIncident.determination,
                defenderIncident.createdTime,
                defenderIncident.lastUpdateTime,
                defenderIncident.assignedTo,
                JSON.stringify(defenderIncident.tags || []),
                defenderIncident.alerts?.length || 0
              ).run();
              newIncidents++;
            }
          } catch (incidentError) {
            console.error(`Failed to sync incident ${defenderIncident.incidentId}:`, incidentError);
            errors++;
          }
        }

        nextUrl = data['@odata.nextLink'] || null;
        
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Incidents sync error:', error);
      throw error;
    }

    return { total_fetched: totalFetched, new_incidents: newIncidents, updated_incidents: updatedIncidents, errors };
  }

  // ====================
  // VULNERABILITY SYNCHRONIZATION
  // ====================

  private async syncVulnerabilities(): Promise<{ total_fetched: number; new_vulnerabilities: number; updated_vulnerabilities: number; errors: number; }> {
    const token = await this.getAccessToken();
    let totalFetched = 0;
    let newVulnerabilities = 0;
    let updatedVulnerabilities = 0;
    let errors = 0;
    let nextUrl = 'https://api.securitycenter.microsoft.com/api/vulnerabilities';

    console.log('🔍 Fetching vulnerabilities from Microsoft Defender...');

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Vulnerabilities API call failed: ${response.status}`);
        }

        const data = await response.json();
        const vulnerabilities = data.value || [];
        totalFetched += vulnerabilities.length;

        // Process each vulnerability
        for (const defenderVuln of vulnerabilities) {
          try {
            const existingVuln = await this.env.DB.prepare(`
              SELECT id FROM defender_vulnerabilities WHERE cve_id = ?
            `).bind(defenderVuln.id).first();

            if (existingVuln) {
              // Update existing vulnerability
              await this.env.DB.prepare(`
                UPDATE defender_vulnerabilities SET
                  title = ?,
                  description = ?,
                  severity = ?,
                  cvss_score = ?,
                  exploit_available = ?,
                  last_modified_date = ?,
                  affected_products = ?,
                  updated_at = datetime('now'),
                  last_sync = datetime('now')
                WHERE cve_id = ?
              `).bind(
                defenderVuln.name,
                defenderVuln.description,
                this.mapVulnerabilitySeverity(defenderVuln.severity),
                defenderVuln.cvssV3 || 0,
                defenderVuln.exploitAvailable || false,
                defenderVuln.lastModifiedDateTime,
                JSON.stringify(defenderVuln.exposedMachines || []),
                defenderVuln.id
              ).run();
              updatedVulnerabilities++;
            } else {
              // Create new vulnerability
              await this.env.DB.prepare(`
                INSERT INTO defender_vulnerabilities (
                  cve_id, title, description, severity, cvss_score,
                  exploit_available, published_date, last_modified_date,
                  affected_products, created_at, last_sync
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `).bind(
                defenderVuln.id,
                defenderVuln.name,
                defenderVuln.description,
                this.mapVulnerabilitySeverity(defenderVuln.severity),
                defenderVuln.cvssV3 || 0,
                defenderVuln.exploitAvailable || false,
                defenderVuln.publishedDateTime,
                defenderVuln.lastModifiedDateTime,
                JSON.stringify(defenderVuln.exposedMachines || [])
              ).run();
              newVulnerabilities++;
            }
          } catch (vulnError) {
            console.error(`Failed to sync vulnerability ${defenderVuln.id}:`, vulnError);
            errors++;
          }
        }

        nextUrl = data['@odata.nextLink'] || null;
        
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Vulnerabilities sync error:', error);
      throw error;
    }

    return { total_fetched: totalFetched, new_vulnerabilities: newVulnerabilities, updated_vulnerabilities: updatedVulnerabilities, errors };
  }

  // ====================
  // ASSET-VULNERABILITY RELATIONSHIPS
  // ====================

  async syncAssetVulnerabilities(): Promise<void> {
    const token = await this.getAccessToken();
    console.log('🔗 Syncing asset-vulnerability relationships...');

    try {
      // Get all assets from our database
      const assets = await this.env.DB.prepare(`
        SELECT id, asset_id FROM assets WHERE asset_id IS NOT NULL
      `).all();

      for (const asset of (assets.results || [])) {
        try {
          // Fetch vulnerabilities for this asset
          const response = await fetch(`https://api.securitycenter.microsoft.com/api/machines/${asset.asset_id}/vulnerabilities`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`Failed to fetch vulnerabilities for asset ${asset.asset_id}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const vulnerabilities = data.value || [];

          // Update asset vulnerability counts
          const criticalCount = vulnerabilities.filter(v => this.mapVulnerabilitySeverity(v.severity) === 'critical').length;
          const totalCount = vulnerabilities.length;

          await this.env.DB.prepare(`
            UPDATE assets SET 
              vulnerability_count = ?,
              critical_vulnerability_count = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(totalCount, criticalCount, asset.id).run();

          // Create asset-vulnerability relationships
          for (const vuln of vulnerabilities) {
            const vulnRecord = await this.env.DB.prepare(`
              SELECT id FROM defender_vulnerabilities WHERE cve_id = ?
            `).bind(vuln.id).first();

            if (vulnRecord) {
              await this.env.DB.prepare(`
                INSERT OR REPLACE INTO asset_vulnerabilities (
                  asset_id, vulnerability_id, defender_asset_id, detection_date,
                  status, exploit_probability, business_impact, patch_available,
                  remediation_complexity, last_sync
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(
                asset.id,
                vulnRecord.id,
                asset.asset_id,
                new Date().toISOString(),
                'active',
                vuln.exploitAvailable ? 0.8 : 0.2,
                this.calculateBusinessImpact(vuln.severity, vuln.cvssV3),
                vuln.publicExploit ? false : true,
                this.mapRemediationComplexity(vuln.severity)
              ).run();
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (assetError) {
          console.error(`Failed to sync vulnerabilities for asset ${asset.asset_id}:`, assetError);
        }
      }

      console.log('✅ Asset-vulnerability relationships synced');
    } catch (error) {
      console.error('❌ Asset-vulnerability sync failed:', error);
      throw error;
    }
  }

  // ====================
  // HELPER METHODS
  // ====================

  private mapDefenderRiskScore(riskScore: string): number {
    const mapping = {
      'None': 0,
      'Informational': 10,
      'Low': 25,
      'Medium': 50,
      'High': 75
    };
    return mapping[riskScore] || 0;
  }

  private mapDefenderExposureLevel(exposureLevel: string): string {
    const mapping = {
      'None': 'low',
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high'
    };
    return mapping[exposureLevel] || 'medium';
  }

  private mapDefenderDeviceType(osPlatform: string): string {
    if (osPlatform?.includes('Windows')) {
      return osPlatform.includes('Server') ? 'server' : 'workstation';
    }
    if (osPlatform?.includes('Linux')) return 'server';
    if (osPlatform?.includes('macOS')) return 'workstation';
    return 'device';
  }

  private mapDefenderSeverity(severity: string): string {
    const mapping = {
      'Informational': 'informational',
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high'
    };
    return mapping[severity] || 'low';
  }

  private mapDefenderStatus(status: string): string {
    const mapping = {
      'Active': 'active',
      'Resolved': 'resolved',
      'InProgress': 'in_progress',
      'New': 'new'
    };
    return mapping[status] || 'new';
  }

  private mapVulnerabilitySeverity(severity: string): string {
    const mapping = {
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high',
      'Critical': 'critical'
    };
    return mapping[severity] || 'medium';
  }

  private mapRemediationComplexity(severity: string): string {
    const mapping = {
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high',
      'Critical': 'critical'
    };
    return mapping[severity] || 'medium';
  }

  private calculateBusinessImpact(severity: string, cvssScore: number): number {
    const severityWeight = {
      'Critical': 1.0,
      'High': 0.8,
      'Medium': 0.5,
      'Low': 0.2
    }[severity] || 0.3;

    const cvssWeight = Math.min((cvssScore || 0) / 10, 1);
    return (severityWeight + cvssWeight) / 2;
  }
}