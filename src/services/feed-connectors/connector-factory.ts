/**
 * ARIA5 TI Enhancement - Feed Connector Factory
 * 
 * Factory class for creating and managing threat intelligence feed connectors.
 * Supports multiple feed types and provides unified management interface.
 */

import { BaseFeedConnector, FeedConfig, ConnectorResult, ThreatIndicator } from './base-connector';
import { OTXConnector } from './otx-connector';
import { CISAKEVConnector } from './cisa-kev-connector';
import { NVDConnector } from './nvd-connector';

export interface ConnectorStatus {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  last_sync?: Date;
  last_result?: ConnectorResult;
  error_count: number;
  next_sync?: Date;
  health_status: 'healthy' | 'warning' | 'error' | 'disabled';
  indicators_stored?: number;
  last_indicators_fetch?: Date;
}

export interface ConnectorIndicatorData {
  connectorId: string;
  indicators: ThreatIndicator[];
  fetchTime: Date;
  metadata: {
    source: string;
    version?: string;
    totalCount: number;
  };
}

export class ConnectorFactory {
  private connectors: Map<string, BaseFeedConnector> = new Map();
  private connectorStatus: Map<string, ConnectorStatus> = new Map();
  private db?: D1Database;
  private indicatorStorage: Map<string, ThreatIndicator[]> = new Map();
  private onIndicatorsProcessed?: (connectorId: string, indicators: ThreatIndicator[]) => Promise<void>;

  /**
   * Initialize default connectors with standard configurations
   */
  async initializeDefaultConnectors(): Promise<void> {
    // OTX Connector
    const otxConfig: FeedConfig = {
      id: 'otx-alienvault',
      name: 'AlienVault OTX',
      type: 'json_api',
      url: 'https://otx.alienvault.com/api/v1',
      polling_interval: 3600, // 1 hour
      timeout: 30,
      retry_attempts: 3,
      retry_delay: 5,
      enabled: true,
      filter_rules: {
        allowed_types: ['ip', 'domain', 'url', 'hash', 'email'],
        min_confidence: 30,
        min_severity: 'low'
      }
    };

    // CISA KEV Connector
    const cisaConfig: FeedConfig = {
      id: 'cisa-kev',
      name: 'CISA Known Exploited Vulnerabilities',
      type: 'json_api', 
      url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      polling_interval: 86400, // 24 hours
      timeout: 30,
      retry_attempts: 3,
      retry_delay: 5,
      enabled: true,
      filter_rules: {
        allowed_types: ['cve'],
        min_confidence: 70
      }
    };

    // NVD Connector
    const nvdConfig: FeedConfig = {
      id: 'nvd-cve',
      name: 'National Vulnerability Database',
      type: 'json_api',
      url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
      polling_interval: 21600, // 6 hours
      timeout: 45,
      retry_attempts: 3,
      retry_delay: 10,
      enabled: true,
      filter_rules: {
        allowed_types: ['cve'],
        min_confidence: 50
      }
    };

    await this.addConnector(otxConfig);
    await this.addConnector(cisaConfig);
    await this.addConnector(nvdConfig);

    console.log('[ConnectorFactory] Default connectors initialized');
  }

  /**
   * Add a new connector
   */
  async addConnector(config: FeedConfig): Promise<void> {
    try {
      const connector = this.createConnector(config);
      this.connectors.set(config.id, connector);
      
      this.connectorStatus.set(config.id, {
        id: config.id,
        name: config.name,
        type: config.type,
        enabled: config.enabled,
        error_count: 0,
        health_status: config.enabled ? 'healthy' : 'disabled'
      });

      console.log(`[ConnectorFactory] Added connector: ${config.name}`);
    } catch (error) {
      console.error(`[ConnectorFactory] Failed to add connector ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Create connector instance based on configuration
   */
  private createConnector(config: FeedConfig): BaseFeedConnector {
    switch (config.id) {
      case 'otx-alienvault':
        return new OTXConnector(config);
      case 'cisa-kev':
        return new CISAKEVConnector(config);
      case 'nvd-cve':
        return new NVDConnector(config);
      default:
        throw new Error(`Unknown connector type: ${config.id}`);
    }
  }

  /**
   * Execute feed synchronization for all enabled connectors
   */
  async synchronizeAllFeeds(): Promise<Map<string, ConnectorResult>> {
    const results = new Map<string, ConnectorResult>();
    
    console.log('[ConnectorFactory] Starting feed synchronization...');
    
    for (const [id, connector] of this.connectors) {
      const status = this.connectorStatus.get(id);
      
      if (!status?.enabled) {
        console.log(`[ConnectorFactory] Skipping disabled connector: ${id}`);
        continue;
      }

      try {
        console.log(`[ConnectorFactory] Synchronizing ${connector.name}...`);
        const result = await connector.fetchFeed();
        results.set(id, result);
        
        // Update status
        this.updateConnectorStatus(id, result);
        
        console.log(`[ConnectorFactory] ${connector.name} sync completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        console.error(`[ConnectorFactory] Sync failed for ${connector.name}:`, error);
        
        const errorResult: ConnectorResult = {
          success: false,
          indicators_fetched: 0,
          indicators_new: 0,
          indicators_updated: 0,
          errors: [error.message],
          processing_time_ms: 0
        };
        
        results.set(id, errorResult);
        this.updateConnectorStatus(id, errorResult);
      }
    }
    
    console.log(`[ConnectorFactory] Feed synchronization completed. ${results.size} connectors processed.`);
    return results;
  }

  /**
   * Synchronize specific connector by ID
   */
  async synchronizeConnector(connectorId: string): Promise<ConnectorResult> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    const status = this.connectorStatus.get(connectorId);
    if (!status?.enabled) {
      throw new Error(`Connector is disabled: ${connectorId}`);
    }

    console.log(`[ConnectorFactory] Synchronizing single connector: ${connector.name}`);
    
    try {
      const result = await connector.fetchFeed();
      this.updateConnectorStatus(connectorId, result);
      return result;
    } catch (error) {
      const errorResult: ConnectorResult = {
        success: false,
        indicators_fetched: 0,
        indicators_new: 0,
        indicators_updated: 0,
        errors: [error.message],
        processing_time_ms: 0
      };
      
      this.updateConnectorStatus(connectorId, errorResult);
      throw error;
    }
  }

  /**
   * Update connector status based on sync result
   */
  private updateConnectorStatus(connectorId: string, result: ConnectorResult): void {
    const status = this.connectorStatus.get(connectorId);
    if (!status) return;

    status.last_result = result;
    status.last_sync = new Date();
    status.next_sync = result.next_sync;

    if (result.success) {
      status.error_count = 0;
      status.health_status = 'healthy';
    } else {
      status.error_count++;
      status.health_status = status.error_count >= 3 ? 'error' : 'warning';
    }

    this.connectorStatus.set(connectorId, status);
  }

  /**
   * Get all connector statuses
   */
  getAllConnectorStatuses(): ConnectorStatus[] {
    return Array.from(this.connectorStatus.values());
  }

  /**
   * Get specific connector status
   */
  getConnectorStatus(connectorId: string): ConnectorStatus | undefined {
    return this.connectorStatus.get(connectorId);
  }

  /**
   * Enable/disable connector
   */
  async setConnectorEnabled(connectorId: string, enabled: boolean): Promise<void> {
    const status = this.connectorStatus.get(connectorId);
    if (!status) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    status.enabled = enabled;
    status.health_status = enabled ? 'healthy' : 'disabled';
    
    this.connectorStatus.set(connectorId, status);
    
    console.log(`[ConnectorFactory] Connector ${connectorId} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get health summary of all connectors
   */
  getHealthSummary(): {
    total: number;
    healthy: number;
    warning: number;
    error: number;
    disabled: number;
  } {
    const statuses = Array.from(this.connectorStatus.values());
    
    return {
      total: statuses.length,
      healthy: statuses.filter(s => s.health_status === 'healthy').length,
      warning: statuses.filter(s => s.health_status === 'warning').length,
      error: statuses.filter(s => s.health_status === 'error').length,
      disabled: statuses.filter(s => s.health_status === 'disabled').length
    };
  }

  /**
   * Remove connector
   */
  async removeConnector(connectorId: string): Promise<void> {
    this.connectors.delete(connectorId);
    this.connectorStatus.delete(connectorId);
    console.log(`[ConnectorFactory] Removed connector: ${connectorId}`);
  }

  /**
   * Get connector instance
   */
  getConnector(connectorId: string): BaseFeedConnector | undefined {
    return this.connectors.get(connectorId);
  }
}

export default ConnectorFactory;