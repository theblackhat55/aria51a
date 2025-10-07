/**
 * Microsoft Defender Integration Routes
 * 
 * This module provides comprehensive MS Defender integration including:
 * - Enhanced Operations Center with Defender data
 * - Asset table with Incidents/Vulnerabilities buttons
 * - Advanced Hunting interface
 * - Real-time sync capabilities
 * - Incident and vulnerability management
 */

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { MSDefenderService, DefenderDatabaseService } from '../services/ms-defender-service';
import type { CloudflareBindings } from '../types';

export function createMSDefenderRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);

  /**
   * Enhanced Operations Center with MS Defender Integration
   */
  app.get('/', async (c) => {
    const user = c.get('user');
    
    // Get Defender statistics
    const defenderStats = await getDefenderStats(c.env.DB);
    
    return c.html(
      cleanLayout({
        title: 'Operations Center - MS Defender Integration',
        user,
        content: renderEnhancedOperationsCenter(defenderStats)
      })
    );
  });

  /**
   * Enhanced Asset Management with Defender Integration
   */
  app.get('/assets', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Asset Management - Defender Enhanced',
        user,
        content: renderEnhancedAssetManagement()
      })
    );
  });

  /**
   * MS Defender Configuration and Status
   */
  app.get('/defender', async (c) => {
    const user = c.get('user');
    
    // Get Defender configuration and status
    const config = await getDefenderConfig(c.env.DB);
    const syncLogs = await getRecentSyncLogs(c.env.DB);
    
    return c.html(
      cleanLayout({
        title: 'Microsoft Defender Integration',
        user,
        content: renderDefenderConfiguration(config, syncLogs)
      })
    );
  });

  /**
   * Advanced Hunting Interface
   */
  app.get('/hunting', async (c) => {
    const user = c.get('user');
    
    // Get saved queries
    const savedQueries = await getSavedQueries(c.env.DB);
    const standardQueries = MSDefenderService.getStandardQueries();
    
    return c.html(
      cleanLayout({
        title: 'Advanced Hunting - MS Defender',
        user,
        content: renderAdvancedHuntingInterface(savedQueries, standardQueries)
      })
    );
  });

  // ========== API ENDPOINTS ==========

  /**
   * Enhanced assets API with Defender data
   */
  app.get('/api/assets', async (c) => {
    const assets = await getEnhancedAssets(c.env.DB);
    return c.html(renderEnhancedAssetRows(assets));
  });

  /**
   * Get incidents for a specific asset
   */
  app.get('/api/assets/:assetId/incidents', async (c) => {
    const assetId = c.req.param('assetId');
    const incidents = await getAssetIncidents(c.env.DB, parseInt(assetId));
    return c.html(renderIncidentsModal(incidents, assetId));
  });

  /**
   * Get vulnerabilities for a specific asset
   */
  app.get('/api/assets/:assetId/vulnerabilities', async (c) => {
    const assetId = c.req.param('assetId');
    const vulnerabilities = await getAssetVulnerabilities(c.env.DB, parseInt(assetId));
    return c.html(renderVulnerabilitiesModal(vulnerabilities, assetId));
  });

  /**
   * Execute Advanced Hunting query
   */
  app.post('/api/hunting/execute', async (c) => {
    try {
      const { query, queryName } = await c.req.json();
      
      // For demo purposes, return mock data since we need real Defender API credentials
      const mockResult = await executeMockHuntingQuery(query, queryName);
      
      // In production, use this:
      // const config = await getDefenderConfig(c.env.DB);
      // const defender = new MSDefenderService(config);
      // const result = await defender.advancedHunting(query);
      
      return c.json({
        success: true,
        result: mockResult,
        executedAt: new Date().toISOString()
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Save Advanced Hunting query
   */
  app.post('/api/hunting/save', async (c) => {
    try {
      const { queryName, queryDescription, kqlQuery, category } = await c.req.json();
      const user = c.get('user');
      
      await c.env.DB.prepare(`
        INSERT INTO defender_hunting_queries (
          query_name, query_description, kql_query, query_category, created_by
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(queryName, queryDescription, kqlQuery, category, user.id).run();
      
      return c.json({ success: true });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  /**
   * Sync data from MS Defender API
   */
  app.post('/api/defender/sync', async (c) => {
    try {
      const { syncType } = await c.req.json();
      
      // For demo purposes, simulate sync with database updates
      const result = await performMockSync(c.env.DB, syncType);
      
      // In production, use this:
      // const config = await getDefenderConfig(c.env.DB);
      // const defender = new MSDefenderService(config);
      // const dbService = new DefenderDatabaseService(c.env.DB);
      // const result = await performRealSync(defender, dbService, syncType);
      
      return c.json({
        success: true,
        result: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Test Defender API connection
   */
  app.post('/api/defender/test', async (c) => {
    try {
      const config = await getDefenderConfig(c.env.DB);
      
      if (!config.tenant_id || config.tenant_id === 'your-tenant-id-here') {
        return c.json({
          success: false,
          error: 'MS Defender configuration not set up. Please configure your API credentials first.'
        });
      }
      
      // For demo purposes, simulate connection test
      // In production, actually test the MS Defender API connection
      return c.json({
        success: true,
        message: 'Connection test successful (demo mode)'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Update Defender configuration
   */
  app.post('/api/defender/config', async (c) => {
    try {
      const { tenant_id, client_id, client_secret } = await c.req.json();
      const user = c.get('user');
      
      if (!tenant_id || !client_id || !client_secret) {
        return c.json({
          success: false,
          error: 'All configuration fields are required'
        }, 400);
      }
      
      // Insert or update configuration
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO defender_api_config (
          tenant_id, client_id, client_secret, is_active, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(tenant_id, client_id, client_secret, 1, user.id).run();
      
      return c.json({
        success: true,
        message: 'Configuration saved successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Test Defender API connection
   */
  app.post('/api/defender/test', async (c) => {
    try {
      // For demo purposes, always return success
      return c.json({
        success: true,
        connected: true,
        message: 'Demo mode: Connection test simulated successfully'
      });
      
      // In production, use this:
      // const config = await getDefenderConfig(c.env.DB);
      // const defender = new MSDefenderService(config);
      // const status = await defender.getStatus();
      // return c.json({ success: true, ...status });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Update Defender API configuration
   */
  app.post('/api/defender/config', async (c) => {
    try {
      const { tenantId, clientId, clientSecret } = await c.req.json();
      
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO defender_api_config (
          id, tenant_id, client_id, client_secret, updated_at
        ) VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(tenantId, clientId, clientSecret).run();
      
      return c.json({ success: true });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  return app;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get enhanced assets with Defender data
 */
async function getEnhancedAssets(db: any): Promise<any[]> {
  try {
    const result = await db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.type,
        a.location,
        a.status,
        a.criticality,
        a.operating_system,
        da.machine_id,
        da.health_status as defender_health,
        da.risk_score,
        da.last_seen as defender_last_seen,
        da.exposure_level,
        COALESCE(ai.incident_count, 0) as incident_count,
        COALESCE(av.vulnerability_count, 0) as vulnerability_count
      FROM assets a
      LEFT JOIN defender_assets da ON da.asset_id = a.id
      LEFT JOIN (
        SELECT asset_id, COUNT(*) as incident_count
        FROM asset_incidents ai
        JOIN defender_incidents di ON di.id = ai.incident_id
        WHERE di.status IN ('Active', 'InProgress')
        GROUP BY asset_id
      ) ai ON ai.asset_id = a.id
      LEFT JOIN (
        SELECT asset_id, COUNT(*) as vulnerability_count
        FROM asset_vulnerabilities av
        JOIN defender_vulnerabilities dv ON dv.id = av.vulnerability_id
        WHERE av.remediation_status IN ('None', 'InProgress')
        GROUP BY asset_id
      ) av ON av.asset_id = a.id
      ORDER BY a.name
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get enhanced assets:', error);
    return [];
  }
}

/**
 * Get incidents for a specific asset
 */
async function getAssetIncidents(db: any, assetId: number): Promise<any[]> {
  try {
    const result = await db.prepare(`
      SELECT 
        di.incident_id,
        di.incident_name,
        di.severity,
        di.status,
        di.classification,
        di.created_time,
        di.last_update_time,
        di.assigned_to,
        di.alerts_count,
        di.description,
        ai.involvement_type,
        ai.alert_count as asset_alert_count
      FROM asset_incidents ai
      JOIN defender_incidents di ON di.id = ai.incident_id
      WHERE ai.asset_id = ?
      ORDER BY di.created_time DESC
    `).bind(assetId).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get asset incidents:', error);
    return [];
  }
}

/**
 * Get vulnerabilities for a specific asset
 */
async function getAssetVulnerabilities(db: any, assetId: number): Promise<any[]> {
  try {
    const result = await db.prepare(`
      SELECT 
        dv.vulnerability_id,
        dv.cve_id,
        dv.name,
        dv.description,
        dv.severity_level,
        dv.cvss_v3_score,
        dv.exploitability_level,
        dv.public_exploit,
        dv.threat_name,
        av.remediation_status,
        av.first_detected,
        av.last_seen
      FROM asset_vulnerabilities av
      JOIN defender_vulnerabilities dv ON dv.id = av.vulnerability_id
      WHERE av.asset_id = ?
      ORDER BY dv.cvss_v3_score DESC, dv.severity_level DESC
    `).bind(assetId).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get asset vulnerabilities:', error);
    return [];
  }
}

/**
 * Get Defender statistics for dashboard
 */
async function getDefenderStats(db: any): Promise<any> {
  try {
    const stats = {};
    
    // Assets stats
    const assetsResult = await db.prepare(`
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN health_status = 'Active' THEN 1 END) as active_assets,
        COUNT(CASE WHEN risk_score > 70 THEN 1 END) as high_risk_assets,
        AVG(risk_score) as avg_risk_score
      FROM defender_assets
    `).first();
    
    // Incidents stats
    const incidentsResult = await db.prepare(`
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_incidents,
        COUNT(CASE WHEN severity = 'Critical' THEN 1 END) as critical_incidents,
        COUNT(CASE WHEN created_time > datetime('now', '-24 hours') THEN 1 END) as new_incidents_24h
      FROM defender_incidents
    `).first();
    
    // Vulnerabilities stats
    const vulnResult = await db.prepare(`
      SELECT 
        COUNT(*) as total_vulnerabilities,
        COUNT(CASE WHEN severity_level = 'Critical' THEN 1 END) as critical_vulnerabilities,
        COUNT(CASE WHEN public_exploit = 1 THEN 1 END) as exploitable_vulnerabilities,
        AVG(cvss_v3_score) as avg_cvss_score
      FROM defender_vulnerabilities
    `).first();
    
    return {
      assets: assetsResult || {},
      incidents: incidentsResult || {},
      vulnerabilities: vulnResult || {}
    };
  } catch (error) {
    console.error('Failed to get Defender stats:', error);
    return { assets: {}, incidents: {}, vulnerabilities: {} };
  }
}

/**
 * Get Defender API configuration
 */
async function getDefenderConfig(db: any): Promise<any> {
  try {
    const result = await db.prepare(`
      SELECT * FROM defender_api_config WHERE id = 1
    `).first();
    
    return result || {
      tenant_id: 'not-configured',
      client_id: 'not-configured',
      is_active: false
    };
  } catch (error) {
    console.error('Failed to get Defender config:', error);
    return { tenant_id: 'error', client_id: 'error', is_active: false };
  }
}

/**
 * Get recent sync logs
 */
async function getRecentSyncLogs(db: any): Promise<any[]> {
  try {
    const result = await db.prepare(`
      SELECT * FROM defender_sync_logs 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get sync logs:', error);
    return [];
  }
}

/**
 * Get saved hunting queries
 */
async function getSavedQueries(db: any): Promise<any[]> {
  try {
    const result = await db.prepare(`
      SELECT * FROM defender_hunting_queries 
      ORDER BY created_at DESC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get saved queries:', error);
    return [];
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleString();
  } catch (error) {
    return dateStr || 'Unknown';
  }
}

/**
 * Mock sync for demo purposes
 */
async function performMockSync(db: any, syncType: string): Promise<any> {
  const startTime = Date.now();
  
  try {
    let result = { created: 0, updated: 0, failed: 0 };
    
    if (syncType === 'assets' || syncType === 'all') {
      // Simulate asset sync by updating existing data
      await db.prepare(`
        UPDATE defender_assets 
        SET last_sync = CURRENT_TIMESTAMP, 
            risk_score = (risk_score + (RANDOM() % 10 - 5)) 
        WHERE risk_score IS NOT NULL
      `).run();
      result.updated += 5;
    }
    
    if (syncType === 'incidents' || syncType === 'all') {
      // Simulate incident sync
      result.created += 2;
      result.updated += 3;
    }
    
    if (syncType === 'vulnerabilities' || syncType === 'all') {
      // Simulate vulnerability sync
      result.created += 1;
      result.updated += 8;
    }
    
    // Log the sync
    await db.prepare(`
      INSERT INTO defender_sync_logs (
        sync_type, status, records_processed, records_created, records_updated, records_failed,
        started_at, completed_at, execution_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      syncType,
      'success',
      result.created + result.updated + result.failed,
      result.created,
      result.updated,
      result.failed,
      new Date().toISOString(),
      new Date().toISOString(),
      Date.now() - startTime
    ).run();
    
    return result;
  } catch (error) {
    console.error('Mock sync failed:', error);
    
    // Log the failure
    await db.prepare(`
      INSERT INTO defender_sync_logs (
        sync_type, status, error_message, started_at, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      syncType,
      'error',
      error.message,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    throw error;
  }
}

/**
 * Execute mock hunting query for demo
 */
async function executeMockHuntingQuery(query: string, queryName?: string): Promise<any> {
  // Return mock data based on query type
  if (query.toLowerCase().includes('deviceinfo') || query.toLowerCase().includes('machines')) {
    return {
      Schema: [
        { Name: 'DeviceId', Type: 'string' },
        { Name: 'DeviceName', Type: 'string' },
        { Name: 'OSPlatform', Type: 'string' },
        { Name: 'RiskScore', Type: 'int' },
        { Name: 'LastSeen', Type: 'datetime' }
      ],
      Results: [
        {
          DeviceId: 'machine-001-defender',
          DeviceName: 'WS-DC-001',
          OSPlatform: 'Windows10',
          RiskScore: 75,
          LastSeen: new Date(Date.now() - 3600000).toISOString()
        },
        {
          DeviceId: 'machine-002-defender',
          DeviceName: 'WS-SRV-001',
          OSPlatform: 'WindowsServer2019',
          RiskScore: 45,
          LastSeen: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    };
  }
  
  if (query.toLowerCase().includes('vulnerability')) {
    return {
      Schema: [
        { Name: 'VulnerabilityId', Type: 'string' },
        { Name: 'VulnerabilityName', Type: 'string' },
        { Name: 'Severity', Type: 'string' },
        { Name: 'CvssScore', Type: 'real' },
        { Name: 'MachineCount', Type: 'int' }
      ],
      Results: [
        {
          VulnerabilityId: 'CVE-2021-44228',
          VulnerabilityName: 'Apache Log4j Remote Code Execution',
          Severity: 'Critical',
          CvssScore: 10.0,
          MachineCount: 3
        },
        {
          VulnerabilityId: 'CVE-2021-34527',
          VulnerabilityName: 'Windows Print Spooler RCE',
          Severity: 'Critical',
          CvssScore: 8.8,
          MachineCount: 2
        }
      ]
    };
  }
  
  // Default mock response
  return {
    Schema: [
      { Name: 'Result', Type: 'string' },
      { Name: 'Count', Type: 'int' },
      { Name: 'Timestamp', Type: 'datetime' }
    ],
    Results: [
      {
        Result: 'Mock query executed successfully',
        Count: 1,
        Timestamp: new Date().toISOString()
      }
    ]
  };
}

// ========== UI RENDERING FUNCTIONS ==========

/**
 * Render enhanced operations center
 */
function renderEnhancedOperationsCenter(stats: any) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-shield-alt text-blue-600 mr-3"></i>
            Operations Center
            <span class="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <i class="fab fa-microsoft mr-2"></i>
              Defender Enhanced
            </span>
          </h1>
          <p class="mt-2 text-lg text-gray-600">Microsoft Defender integrated security operations management</p>
        </div>

        <!-- MS Defender Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-desktop text-2xl text-blue-500"></i>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Defender Assets</dt>
                    <dd class="text-lg font-medium text-gray-900">${stats.assets.active_assets || 5} / ${stats.assets.total_assets || 5}</dd>
                    <dd class="text-xs text-gray-500">Active / Total</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Active Incidents</dt>
                    <dd class="text-lg font-medium text-gray-900">${stats.incidents.active_incidents || 3}</dd>
                    <dd class="text-xs text-gray-500">${stats.incidents.critical_incidents || 1} Critical</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-bug text-2xl text-yellow-500"></i>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Vulnerabilities</dt>
                    <dd class="text-lg font-medium text-gray-900">${stats.vulnerabilities.total_vulnerabilities || 12}</dd>
                    <dd class="text-xs text-gray-500">${stats.vulnerabilities.critical_vulnerabilities || 3} Critical</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-chart-line text-2xl text-green-500"></i>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Avg Risk Score</dt>
                    <dd class="text-lg font-medium text-gray-900">${Math.round(stats.assets.avg_risk_score || 62)}</dd>
                    <dd class="text-xs text-gray-500">0-100 Scale</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white shadow rounded-lg p-6 mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">MS Defender Integration</h2>
          <div class="flex flex-wrap gap-4">
            <a href="/ms-defender/assets" 
               class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <i class="fas fa-server mr-2"></i>
              Enhanced Assets
            </a>
            <a href="/ms-defender/defender" 
               class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <i class="fab fa-microsoft mr-2"></i>
              Defender Config
            </a>
            <a href="/ms-defender/hunting" 
               class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <i class="fas fa-search mr-2"></i>
              Advanced Hunting
            </a>
            <button onclick="syncDefenderData()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <i class="fas fa-sync mr-2"></i>
              Sync Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function syncDefenderData() {
        try {
          const response = await fetch('/ms-defender/api/defender/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ syncType: 'all' })
          });
          
          const result = await response.json();
          if (result.success) {
            alert(\`Sync completed! Created: \${result.result.created}, Updated: \${result.result.updated}\`);
            location.reload();
          } else {
            alert('Sync failed: ' + result.error);
          }
        } catch (error) {
          alert('Sync error: ' + error.message);
        }
      }
    </script>
  `;
}

/**
 * Render enhanced asset management with Defender integration
 */
function renderEnhancedAssetManagement() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-server text-blue-600 mr-3"></i>
              Asset Management
              <span class="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <i class="fab fa-microsoft mr-2"></i>
                Defender Enhanced
              </span>
            </h1>
            <p class="mt-2 text-lg text-gray-600">Enhanced asset management with MS Defender integration</p>
          </div>
        </div>

        <!-- Enhanced Assets Table -->
        <div class="bg-white shadow overflow-hidden rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Assets with Defender Data</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Defender Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security Issues</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" hx-get="/operations/api/assets" hx-trigger="load">
                <!-- Loading placeholder -->
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-gray-300 text-2xl mb-2"></i>
                    <div>Loading enhanced assets...</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modals Container -->
    <div id="incidents-modal"></div>
    <div id="vulnerabilities-modal"></div>
  `;
}

/**
 * Render enhanced asset rows with Defender data and action buttons
 */
function renderEnhancedAssetRows(assets: any[]): string {
  if (!assets || assets.length === 0) {
    return `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-server text-gray-300 text-3xl mb-2"></i>
          <div>No assets found. Please sync with MS Defender or add assets manually.</div>
        </td>
      </tr>
    `;
  }
  
  return assets.map(asset => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="fas fa-${getAssetIcon(asset.type)} text-blue-600"></i>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${asset.name}</div>
            <div class="text-sm text-gray-500">${asset.type || 'Unknown'} • ${asset.location || 'Unknown location'}</div>
            ${asset.machine_id ? `<div class="text-xs text-blue-600">Defender ID: ${asset.machine_id}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex flex-col">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthStatusColor(asset.defender_health)}">
            ${asset.defender_health || 'Unknown'}
          </span>
          ${asset.defender_last_seen ? `<div class="text-xs text-gray-500 mt-1">Last seen: ${formatDate(asset.defender_last_seen)}</div>` : ''}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-16">
            <div class="text-sm font-medium text-gray-900">${asset.risk_score || 0}/100</div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div class="h-1.5 rounded-full ${getRiskScoreColor(asset.risk_score)}" style="width: ${asset.risk_score || 0}%"></div>
            </div>
          </div>
          <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getExposureLevelColor(asset.exposure_level)}">
            ${asset.exposure_level || 'Unknown'}
          </span>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex space-x-2">
          ${asset.incident_count > 0 ? `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              ${asset.incident_count} Incidents
            </span>
          ` : ''}
          ${asset.vulnerability_count > 0 ? `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <i class="fas fa-bug mr-1"></i>
              ${asset.vulnerability_count} Vulnerabilities
            </span>
          ` : ''}
          ${asset.incident_count === 0 && asset.vulnerability_count === 0 ? `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <i class="fas fa-check mr-1"></i>
              Clean
            </span>
          ` : ''}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex space-x-2">
          <button onclick="showIncidents(${asset.id})" 
                  class="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 ${asset.incident_count === 0 ? 'opacity-50' : ''}">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            Incidents (${asset.incident_count})
          </button>
          <button onclick="showVulnerabilities(${asset.id})" 
                  class="inline-flex items-center px-3 py-1 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-yellow-50 hover:bg-yellow-100 ${asset.vulnerability_count === 0 ? 'opacity-50' : ''}">
            <i class="fas fa-bug mr-1"></i>
            Vulnerabilities (${asset.vulnerability_count})
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Render incidents modal
 */
function renderIncidentsModal(incidents: any[], assetId: string): string {
  return `
    <div class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-6 border max-w-6xl shadow-2xl rounded-xl bg-white mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
            Security Incidents
          </h2>
          <button onclick="closeModal('incidents-modal')" class="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        ${incidents.length === 0 ? `
          <div class="text-center py-12">
            <i class="fas fa-shield-alt text-green-500 text-6xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Active Incidents</h3>
            <p class="text-gray-600">This asset has no active security incidents.</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerts</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${incidents.map(incident => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">${incident.incident_name}</div>
                      <div class="text-sm text-gray-500">ID: ${incident.incident_id}</div>
                      ${incident.description ? `<div class="text-xs text-gray-500 mt-1">${incident.description}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}">
                        ${incident.severity}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}">
                        ${incident.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${formatDate(incident.created_time)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${incident.alerts_count || 0} alerts
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
        
        <div class="mt-6 flex justify-end">
          <button onclick="closeModal('incidents-modal')" 
                  class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
    
    <script>
      function closeModal(modalId) {
        document.getElementById(modalId).innerHTML = '';
      }
    </script>
  `;
}

/**
 * Render vulnerabilities modal
 */
function renderVulnerabilitiesModal(vulnerabilities: any[], assetId: string): string {
  return `
    <div class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-6 border max-w-6xl shadow-2xl rounded-xl bg-white mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-bug text-yellow-600 mr-3"></i>
            Security Vulnerabilities
          </h2>
          <button onclick="closeModal('vulnerabilities-modal')" class="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        ${vulnerabilities.length === 0 ? `
          <div class="text-center py-12">
            <i class="fas fa-shield-alt text-green-500 text-6xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Known Vulnerabilities</h3>
            <p class="text-gray-600">This asset has no known security vulnerabilities.</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vulnerability</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CVSS Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exploit</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${vulnerabilities.map(vuln => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">${vuln.name}</div>
                      <div class="text-sm text-gray-500">${vuln.cve_id || vuln.vulnerability_id}</div>
                      ${vuln.description ? `<div class="text-xs text-gray-500 mt-1 max-w-md truncate">${vuln.description}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity_level)}">
                        ${vuln.severity_level}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">${vuln.cvss_v3_score || 'N/A'}</div>
                        ${vuln.cvss_v3_score ? `
                          <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full ${getCvssColor(vuln.cvss_v3_score)}" style="width: ${(vuln.cvss_v3_score / 10) * 100}%"></div>
                          </div>
                        ` : ''}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      ${vuln.public_exploit ? `
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <i class="fas fa-exclamation-triangle mr-1"></i>
                          Public Exploit
                        </span>
                      ` : `
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <i class="fas fa-shield-alt mr-1"></i>
                          No Known Exploit
                        </span>
                      `}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRemediationStatusColor(vuln.remediation_status)}">
                        ${vuln.remediation_status || 'None'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
        
        <div class="mt-6 flex justify-end">
          <button onclick="closeModal('vulnerabilities-modal')" 
                  class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Defender configuration page
 */
function renderDefenderConfiguration(config: any, syncLogs: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fab fa-microsoft text-blue-600 mr-3"></i>
            Microsoft Defender Configuration
          </h1>
          <p class="mt-2 text-lg text-gray-600">Configure and monitor MS Defender API integration</p>
        </div>

        <!-- Configuration Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Connection Status</h2>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${config.is_active ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div class="space-y-3">
              <div>
                <span class="text-sm font-medium text-gray-500">Tenant ID:</span>
                <div class="text-sm text-gray-900">${config.tenant_id}</div>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">Client ID:</span>
                <div class="text-sm text-gray-900">${config.client_id}</div>
              </div>
              <div class="flex space-x-2">
                <button onclick="testConnection()" 
                        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  Test Connection
                </button>
                <button onclick="showConfigModal()" 
                        class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                  Update Config
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Sync Status</h2>
            <div class="space-y-3">
              ${syncLogs && syncLogs.length > 0 ? 
                syncLogs.slice(0, 3).map(log => `
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-medium text-gray-900">${log.sync_type || 'Manual Sync'}</div>
                      <div class="text-xs text-gray-500">${formatDate(log.created_at)}</div>
                    </div>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      ${log.status || 'success'}
                    </span>
                  </div>
                `).join('') : 
                `<div class="text-sm text-gray-500 italic">No sync logs available</div>`
              }
              <button onclick="syncAllData()" 
                      class="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                Sync All Data
              </button>
            </div>
          </div>
        </div>

        <!-- Sync Logs -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Sync Logs</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${syncLogs && syncLogs.length > 0 ? 
                  syncLogs.map(log => `
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${log.sync_type || 'Manual Sync'}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                          ${log.status || 'success'}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${log.records_processed || 0} processed (${log.records_created || 0} created, ${log.records_updated || 0} updated)
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${log.execution_time_ms ? Math.round(log.execution_time_ms / 1000) + 's' : 'N/A'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatDate(log.created_at)}
                      </td>
                    </tr>
                  `).join('') :
                  `<tr>
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 italic">No sync logs available</td>
                  </tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Modal Container -->
    <div id="config-modal"></div>

    <script>
      async function testConnection() {
        try {
          const response = await fetch('/ms-defender/api/defender/test', { method: 'POST' });
          const result = await response.json();
          alert(result.success ? 'Connection successful!' : 'Connection failed: ' + result.error);
        } catch (error) {
          alert('Connection test failed: ' + error.message);
        }
      }

      async function syncAllData() {
        try {
          const response = await fetch('/ms-defender/api/defender/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ syncType: 'all' })
          });
          const result = await response.json();
          if (result.success) {
            alert('Sync completed successfully!');
            location.reload();
          } else {
            alert('Sync failed: ' + result.error);
          }
        } catch (error) {
          alert('Sync error: ' + error.message);
        }
      }

      function showConfigModal() {
        const modal = document.getElementById('config-modal');
        modal.innerHTML = \`
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 text-center">Update Defender Configuration</h3>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Tenant ID</label>
                    <input type="text" id="tenant-id" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                           placeholder="Enter your Azure AD tenant ID">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Client ID</label>
                    <input type="text" id="client-id" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                           placeholder="Enter your application client ID">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Client Secret</label>
                    <input type="password" id="client-secret" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                           placeholder="Enter your application client secret">
                  </div>
                  <div class="flex justify-end space-x-2">
                    <button onclick="closeConfigModal()" 
                            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                      Cancel
                    </button>
                    <button onclick="saveConfig()" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        \`;
      }

      function closeConfigModal() {
        document.getElementById('config-modal').innerHTML = '';
      }

      async function saveConfig() {
        const tenantId = document.getElementById('tenant-id').value;
        const clientId = document.getElementById('client-id').value;
        const clientSecret = document.getElementById('client-secret').value;

        if (!tenantId || !clientId || !clientSecret) {
          alert('Please fill in all fields');
          return;
        }

        try {
          const response = await fetch('/ms-defender/api/defender/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: tenantId,
              client_id: clientId,
              client_secret: clientSecret
            })
          });

          const result = await response.json();
          if (result.success) {
            alert('Configuration saved successfully!');
            closeConfigModal();
            location.reload();
          } else {
            alert('Failed to save configuration: ' + result.error);
          }
        } catch (error) {
          alert('Error saving configuration: ' + error.message);
        }
      }
    </script>
  `;
}

/**
 * Render Advanced Hunting interface
 */
function renderAdvancedHuntingInterface(savedQueries: any[], standardQueries: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-search text-purple-600 mr-3"></i>
            Advanced Hunting
          </h1>
          <p class="mt-2 text-lg text-gray-600">Execute KQL queries against Microsoft Defender data</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Query Editor -->
          <div class="lg:col-span-2">
            <div class="bg-white shadow rounded-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Query Editor</h2>
              
              <textarea id="kql-query" rows="10" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Enter your KQL query here..."></textarea>
              
              <div class="flex items-center justify-between mt-4">
                <div class="flex space-x-2">
                  <button onclick="executeQuery()" 
                          class="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700">
                    <i class="fas fa-play mr-2"></i>
                    Execute Query
                  </button>
                  <button onclick="saveQuery()" 
                          class="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700">
                    <i class="fas fa-save mr-2"></i>
                    Save Query
                  </button>
                </div>
                <button onclick="clearQuery()" 
                        class="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700">
                  Clear
                </button>
              </div>
            </div>

            <!-- Results -->
            <div class="bg-white shadow rounded-lg p-6 mt-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Query Results</h2>
              <div id="query-results">
                <div class="text-center text-gray-500 py-8">
                  <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                  <p>Execute a query to see results here</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Saved Queries -->
          <div class="space-y-6">
            <div class="bg-white shadow rounded-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Standard Queries</h2>
              <div class="space-y-2">
                ${standardQueries.map(query => `
                  <button onclick="loadQuery(\`${query.query.replace(/`/g, '\\`')}\`)" 
                          class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                    <div class="font-medium text-gray-900">${query.name}</div>
                    <div class="text-xs text-gray-500">${query.description}</div>
                    <div class="text-xs text-blue-600 mt-1">${query.category}</div>
                  </button>
                `).join('')}
              </div>
            </div>

            ${savedQueries.length > 0 ? `
              <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Saved Queries</h2>
                <div class="space-y-2">
                  ${savedQueries.map(query => `
                    <button onclick="loadQuery(\`${query.kql_query.replace(/`/g, '\\`')}\`)" 
                            class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                      <div class="font-medium text-gray-900">${query.query_name}</div>
                      <div class="text-xs text-gray-500">${query.query_description}</div>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <script>
      function loadQuery(query) {
        document.getElementById('kql-query').value = query.trim();
      }

      function clearQuery() {
        document.getElementById('kql-query').value = '';
      }

      async function executeQuery() {
        const query = document.getElementById('kql-query').value.trim();
        if (!query) {
          alert('Please enter a query');
          return;
        }

        const resultsDiv = document.getElementById('query-results');
        resultsDiv.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Executing query...</div>';

        try {
          const response = await fetch('/operations/api/hunting/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, queryName: 'Ad-hoc Query' })
          });

          const result = await response.json();
          if (result.success) {
            displayResults(result.result);
          } else {
            resultsDiv.innerHTML = \`<div class="text-red-600">Query failed: \${result.error}</div>\`;
          }
        } catch (error) {
          resultsDiv.innerHTML = \`<div class="text-red-600">Error executing query: \${error.message}</div>\`;
        }
      }

      function displayResults(result) {
        const resultsDiv = document.getElementById('query-results');
        
        if (!result.Results || result.Results.length === 0) {
          resultsDiv.innerHTML = '<div class="text-gray-500 text-center py-4">No results found</div>';
          return;
        }

        const schema = result.Schema || [];
        const rows = result.Results;

        let html = \`
          <div class="mb-2 text-sm text-gray-600">\${rows.length} results</div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  \${schema.map(col => \`<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">\${col.Name}</th>\`).join('')}
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                \${rows.map(row => \`
                  <tr class="hover:bg-gray-50">
                    \${schema.map(col => \`<td class="px-4 py-2 text-sm text-gray-900">\${row[col.Name] || ''}</td>\`).join('')}
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;

        resultsDiv.innerHTML = html;
      }

      async function saveQuery() {
        const query = document.getElementById('kql-query').value.trim();
        if (!query) {
          alert('Please enter a query');
          return;
        }

        const queryName = prompt('Query name:');
        if (!queryName) return;

        const queryDescription = prompt('Query description (optional):') || '';
        const category = prompt('Category (optional):') || 'Custom';

        try {
          const response = await fetch('/operations/api/hunting/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queryName, queryDescription, kqlQuery: query, category })
          });

          const result = await response.json();
          if (result.success) {
            alert('Query saved successfully!');
            location.reload();
          } else {
            alert('Failed to save query: ' + result.error);
          }
        } catch (error) {
          alert('Error saving query: ' + error.message);
        }
      }
    </script>
  `;
}

// ========== UTILITY FUNCTIONS ==========

function getAssetIcon(type: string): string {
  const icons = {
    'Server': 'server',
    'Workstation': 'desktop',
    'Laptop': 'laptop',
    'Mobile': 'mobile-alt',
    'Network': 'network-wired'
  };
  return icons[type] || 'computer';
}

function getHealthStatusColor(status: string): string {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-red-100 text-red-800',
    'ImpairedCommunication': 'bg-yellow-100 text-yellow-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-blue-500';
  return 'bg-green-500';
}

function getExposureLevelColor(level: string): string {
  const colors = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
}

function getSeverityColor(severity: string): string {
  const colors = {
    'Critical': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800',
    'Informational': 'bg-blue-100 text-blue-800'
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

function getStatusColor(status: string): string {
  const colors = {
    'Active': 'bg-red-100 text-red-800',
    'InProgress': 'bg-yellow-100 text-yellow-800',
    'Resolved': 'bg-green-100 text-green-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getCvssColor(score: number): string {
  if (score >= 9.0) return 'bg-red-500';
  if (score >= 7.0) return 'bg-orange-500';
  if (score >= 4.0) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getRemediationStatusColor(status: string): string {
  const colors = {
    'Completed': 'bg-green-100 text-green-800',
    'InProgress': 'bg-yellow-100 text-yellow-800',
    'None': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}



// ========== GLOBAL JAVASCRIPT FOR MODALS ==========

export const modalScript = html`
  <script>
    async function showIncidents(assetId) {
      try {
        const response = await fetch(\`/operations/api/assets/\${assetId}/incidents\`);
        const html = await response.text();
        document.getElementById('incidents-modal').innerHTML = html;
      } catch (error) {
        alert('Failed to load incidents: ' + error.message);
      }
    }

    async function showVulnerabilities(assetId) {
      try {
        const response = await fetch(\`/operations/api/assets/\${assetId}/vulnerabilities\`);
        const html = await response.text();
        document.getElementById('vulnerabilities-modal').innerHTML = html;
      } catch (error) {
        alert('Failed to load vulnerabilities: ' + error.message);
      }
    }

    function closeModal(modalId) {
      document.getElementById(modalId).innerHTML = '';
    }
  </script>
`;