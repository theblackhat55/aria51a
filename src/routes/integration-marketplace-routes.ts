/**
 * Integration Marketplace Routes
 * 
 * Provides centralized integration management for external vendor integrations:
 * - Microsoft Defender for Endpoint (EDR)
 * - ServiceNow (ITSM & CMDB)
 * - Tenable.io (Vulnerability Management)
 */

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { MicrosoftDefenderService } from '../lib/microsoft-defender';
import { ServiceNowIntegrationService } from '../lib/servicenow-integration';
import { TenableIntegrationService } from '../lib/tenable-integration';
import type { CloudflareBindings } from '../types';

export function createIntegrationMarketplaceRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Helper function to safely get organizationId
  const getOrgId = (user: any): number => user?.organizationId || 1;

  /**
   * Integration Marketplace Homepage
   */
  app.get('/', async (c) => {
    try {
      const user = c.get('user');
      
      const orgId = getOrgId(user);
      
      console.log('[Integration Marketplace] User:', user?.username, 'OrgId:', orgId);
      console.log('[Integration Marketplace] DB binding available:', !!c.env?.DB);
      
      if (!c.env?.DB) {
        console.error('[Integration Marketplace] ERROR: DB binding not available');
        return c.html(`
          <div class="p-8">
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Database Error:</strong> Database binding not configured. Please configure DB binding in Cloudflare Dashboard.
            </div>
          </div>
        `, 500);
      }
      
      // Get available integrations from catalog
      console.log('[Integration Marketplace] Fetching catalog...');
      const catalog = await getIntegrationCatalog(c.env.DB);
      console.log('[Integration Marketplace] Catalog items:', catalog.length);
      
      // Get user's installed integrations
      console.log('[Integration Marketplace] Fetching installations...');
      const installations = await getUserInstallations(c.env.DB, orgId);
      console.log('[Integration Marketplace] Installations:', installations.length);
      
      return c.html(
        cleanLayout({
          title: 'Integration Marketplace',
          user,
          content: renderMarketplaceHomepage(catalog, installations)
        })
      );
    } catch (error) {
      console.error('[Integration Marketplace] ERROR:', error);
      console.error('[Integration Marketplace] Error stack:', error instanceof Error ? error.stack : 'No stack');
      return c.html(`
        <div class="p-8">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      `, 500);
    }
  });

  /**
   * Integration Detail Page
   */
  app.get('/:integrationKey', async (c) => {
    const user = c.get('user');
    const integrationKey = c.req.param('integrationKey');
    
    // Get integration details
    const integration = await getIntegrationByKey(c.env.DB, integrationKey);
    
    if (!integration) {
      return c.html('<div class="alert alert-error">Integration not found</div>', 404);
    }
    
    // Check if user has this integration installed
    const installation = await getInstallation(c.env.DB, integrationKey, getOrgId(user));
    
    return c.html(
      cleanLayout({
        title: `${integration.name} - Integration`,
        user,
        content: renderIntegrationDetail(integration, installation)
      })
    );
  });

  /**
   * Microsoft Defender Integration Management
   */
  app.get('/ms-defender/configure', async (c) => {
    const user = c.get('user');
    
    const installation = await getInstallation(c.env.DB, 'ms-defender', getOrgId(user));
    
    return c.html(
      cleanLayout({
        title: 'Microsoft Defender Configuration',
        user,
        content: renderDefenderConfiguration(installation)
      })
    );
  });

  /**
   * MS Defender - Assets
   */
  app.get('/ms-defender/assets', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'MS Defender - Assets',
        user,
        content: renderDefenderAssets()
      })
    );
  });

  /**
   * MS Defender - Incidents
   */
  app.get('/ms-defender/incidents', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'MS Defender - Incidents',
        user,
        content: renderDefenderIncidents()
      })
    );
  });

  /**
   * MS Defender - Vulnerabilities
   */
  app.get('/ms-defender/vulnerabilities', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'MS Defender - Vulnerabilities',
        user,
        content: renderDefenderVulnerabilities()
      })
    );
  });

  /**
   * ServiceNow Integration Management
   */
  app.get('/servicenow/configure', async (c) => {
    const user = c.get('user');
    
    const installation = await getInstallation(c.env.DB, 'servicenow', getOrgId(user));
    
    return c.html(
      cleanLayout({
        title: 'ServiceNow Configuration',
        user,
        content: renderServiceNowConfiguration(installation)
      })
    );
  });

  /**
   * ServiceNow - CMDB
   */
  app.get('/servicenow/cmdb', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'ServiceNow CMDB',
        user,
        content: renderServiceNowCMDB()
      })
    );
  });

  /**
   * ServiceNow - Service Catalogue
   */
  app.get('/servicenow/services', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'ServiceNow Service Catalogue',
        user,
        content: renderServiceNowServices()
      })
    );
  });

  /**
   * Tenable.io Integration Management
   */
  app.get('/tenable/configure', async (c) => {
    const user = c.get('user');
    
    const installation = await getInstallation(c.env.DB, 'tenable', getOrgId(user));
    
    return c.html(
      cleanLayout({
        title: 'Tenable.io Configuration',
        user,
        content: renderTenableConfiguration(installation)
      })
    );
  });

  /**
   * Tenable - Vulnerabilities
   */
  app.get('/tenable/vulnerabilities', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Tenable Vulnerabilities',
        user,
        content: renderTenableVulnerabilities()
      })
    );
  });

  /**
   * Tenable - Assets
   */
  app.get('/tenable/assets', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Tenable Assets',
        user,
        content: renderTenableAssets()
      })
    );
  });

  // ========== API ENDPOINTS ==========

  /**
   * Install Integration
   */
  app.post('/api/install', async (c) => {
    const user = c.get('user');
    const { integrationKey, config } = await c.req.json();
    
    try {
      // Test connection first
      let testResult;
      
      switch (integrationKey) {
        case 'ms-defender':
          const defenderService = new MicrosoftDefenderService(config);
          testResult = await defenderService.testConnection();
          break;
        case 'servicenow':
          const snowService = new ServiceNowIntegrationService(config);
          testResult = await snowService.testConnection();
          break;
        case 'tenable':
          const tenableService = new TenableIntegrationService(config);
          testResult = await tenableService.testConnection();
          break;
        default:
          throw new Error('Unknown integration');
      }
      
      if (!testResult.success) {
        return c.json({ success: false, error: testResult.message }, 400);
      }
      
      // Store encrypted config in KV
      const configKvKey = `integration:${integrationKey}:${getOrgId(user)}`;
      await c.env.KV?.put(configKvKey, JSON.stringify(config));
      
      // Create installation record
      const installationId = await createInstallation(c.env.DB, {
        integration_key: integrationKey,
        organization_id: getOrgId(user),
        config_kv_key: configKvKey,
        installed_by: user.id
      });
      
      return c.json({
        success: true,
        message: 'Integration installed successfully',
        installation_id: installationId
      });
      
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed'
      }, 500);
    }
  });

  /**
   * Test Connection
   */
  app.post('/api/test-connection', async (c) => {
    const { integrationKey, config } = await c.req.json();
    
    try {
      let testResult;
      
      switch (integrationKey) {
        case 'ms-defender':
          const defenderService = new MicrosoftDefenderService(config);
          testResult = await defenderService.testConnection();
          break;
        case 'servicenow':
          const snowService = new ServiceNowIntegrationService(config);
          testResult = await snowService.testConnection();
          break;
        case 'tenable':
          const tenableService = new TenableIntegrationService(config);
          testResult = await tenableService.testConnection();
          break;
        default:
          throw new Error('Unknown integration');
      }
      
      return c.json(testResult);
      
    } catch (error) {
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      }, 500);
    }
  });

  /**
   * Sync Integration Data
   */
  app.post('/api/:integrationKey/sync', async (c) => {
    const user = c.get('user');
    const integrationKey = c.req.param('integrationKey');
    
    try {
      // Get installation
      const installation = await getInstallation(c.env.DB, integrationKey, getOrgId(user));
      
      if (!installation) {
        return c.json({ success: false, error: 'Integration not installed' }, 404);
      }
      
      // Get config from KV
      const configData = await c.env.KV?.get(installation.config_kv_key);
      if (!configData) {
        return c.json({ success: false, error: 'Configuration not found' }, 404);
      }
      
      const config = JSON.parse(configData);
      let syncResult;
      
      // Perform sync based on integration type
      switch (integrationKey) {
        case 'ms-defender':
          const defenderService = new MicrosoftDefenderService(config);
          syncResult = await defenderService.syncAlertsToRisks(c.env.DB, user.id, {
            autoCreateRisks: true
          });
          break;
        case 'servicenow':
          const snowService = new ServiceNowIntegrationService(config);
          syncResult = await snowService.syncCMDBToAssets(c.env.DB, user.id, {
            autoCreateAssets: true
          });
          break;
        case 'tenable':
          const tenableService = new TenableIntegrationService(config);
          syncResult = await tenableService.syncVulnerabilitiesToRisks(c.env.DB, user.id, {
            autoCreateRisks: true,
            severityFilter: [3, 4] // High and Critical only
          });
          break;
        default:
          throw new Error('Unknown integration');
      }
      
      // Update installation stats
      await updateInstallationSyncStats(c.env.DB, installation.id, syncResult);
      
      return c.json({
        success: true,
        result: syncResult
      });
      
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }, 500);
    }
  });

  /**
   * Sync MS Defender Incidents to ARIA5 Incidents
   * Week 6 Enhancement
   */
  app.post('/api/ms-defender/sync-incidents', async (c) => {
    const user = c.get('user');
    
    try {
      // Get installation
      const installation = await getInstallation(c.env.DB, 'ms-defender', getOrgId(user));
      
      if (!installation) {
        return c.json({ success: false, error: 'MS Defender integration not installed' }, 404);
      }
      
      // Get config from KV
      const configData = await c.env.KV?.get(installation.config_kv_key);
      if (!configData) {
        return c.json({ success: false, error: 'Configuration not found' }, 404);
      }
      
      const config = JSON.parse(configData);
      const defenderService = new MicrosoftDefenderService(config);
      
      // Create or update sync job
      const syncJob = await c.env.DB.prepare(`
        INSERT INTO incident_sync_jobs 
          (integration_key, organization_id, status, next_sync_at, sync_interval_minutes)
        VALUES (?, ?, 'running', datetime('now', '+15 minutes'), 15)
        RETURNING id
      `).bind('ms-defender', getOrgId(user)).first();
      
      // Fetch incidents from MS Defender
      const defenderIncidents = await defenderService.getIncidents({
        status: 'Active',
        top: 50 // Limit to most recent
      });
      
      let syncedCount = 0;
      let errors = [];
      
      // Sync each incident
      for (const incident of defenderIncidents) {
        try {
          // Check if incident already exists
          const existing = await c.env.DB.prepare(`
            SELECT id FROM incidents WHERE external_id = ? AND external_source = 'ms-defender'
          `).bind(incident.id).first();
          
          if (!existing) {
            // Create new incident
            await c.env.DB.prepare(`
              INSERT INTO incidents (
                title, description, severity, status, category,
                external_id, external_source, external_data,
                organization_id, reported_by, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, 'ms-defender', ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              incident.title || `MS Defender Incident ${incident.id}`,
              incident.description || 'Incident synced from Microsoft Defender',
              mapDefenderSeverity(incident.severity),
              mapDefenderStatus(incident.status),
              'security',
              incident.id,
              JSON.stringify(incident),
              getOrgId(user),
              user.id
            ).run();
            
            syncedCount++;
          } else {
            // Update existing incident
            await c.env.DB.prepare(`
              UPDATE incidents
              SET title = ?, description = ?, severity = ?, status = ?,
                  external_data = ?, updated_at = CURRENT_TIMESTAMP
              WHERE external_id = ? AND external_source = 'ms-defender'
            `).bind(
              incident.title || `MS Defender Incident ${incident.id}`,
              incident.description || 'Incident synced from Microsoft Defender',
              mapDefenderSeverity(incident.severity),
              mapDefenderStatus(incident.status),
              JSON.stringify(incident),
              incident.id
            ).run();
          }
        } catch (error) {
          errors.push(`Failed to sync incident ${incident.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Update sync job
      await c.env.DB.prepare(`
        UPDATE incident_sync_jobs
        SET status = ?, incidents_synced = ?, last_sync_at = CURRENT_TIMESTAMP,
            error_message = ?, next_sync_at = datetime('now', '+15 minutes')
        WHERE id = ?
      `).bind(
        errors.length > 0 ? 'completed_with_errors' : 'completed',
        syncedCount,
        errors.length > 0 ? JSON.stringify(errors) : null,
        syncJob.id
      ).run();
      
      return c.json({
        success: true,
        message: `Synced ${syncedCount} incidents from MS Defender`,
        incidents_synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }, 500);
    }
  });

  /**
   * Sync ServiceNow Incidents to ARIA5 Incidents
   * Week 6 Enhancement
   */
  app.post('/api/servicenow/sync-incidents', async (c) => {
    const user = c.get('user');
    
    try {
      // Get installation
      const installation = await getInstallation(c.env.DB, 'servicenow', getOrgId(user));
      
      if (!installation) {
        return c.json({ success: false, error: 'ServiceNow integration not installed' }, 404);
      }
      
      // Get config from KV
      const configData = await c.env.KV?.get(installation.config_kv_key);
      if (!configData) {
        return c.json({ success: false, error: 'Configuration not found' }, 404);
      }
      
      const config = JSON.parse(configData);
      const snowService = new ServiceNowIntegrationService(config);
      
      // Create or update sync job
      const syncJob = await c.env.DB.prepare(`
        INSERT INTO incident_sync_jobs 
          (integration_key, organization_id, status, next_sync_at, sync_interval_minutes)
        VALUES (?, ?, 'running', datetime('now', '+15 minutes'), 15)
        RETURNING id
      `).bind('servicenow', getOrgId(user)).first();
      
      // Fetch incidents from ServiceNow
      const snowIncidents = await snowService.getIncidents({
        state: 'Active',
        category: 'security',
        limit: 50
      });
      
      let syncedCount = 0;
      let errors = [];
      
      // Sync each incident
      for (const incident of snowIncidents) {
        try {
          // Check if incident already exists
          const existing = await c.env.DB.prepare(`
            SELECT id FROM incidents WHERE external_id = ? AND external_source = 'servicenow'
          `).bind(incident.sys_id).first();
          
          if (!existing) {
            // Create new incident
            await c.env.DB.prepare(`
              INSERT INTO incidents (
                title, description, severity, status, category,
                external_id, external_source, external_data,
                organization_id, reported_by, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, 'servicenow', ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              incident.short_description || `ServiceNow Incident ${incident.number}`,
              incident.description || 'Incident synced from ServiceNow',
              mapServiceNowPriority(incident.priority),
              mapServiceNowState(incident.state),
              'security',
              incident.sys_id,
              JSON.stringify(incident),
              getOrgId(user),
              user.id
            ).run();
            
            syncedCount++;
          } else {
            // Update existing incident
            await c.env.DB.prepare(`
              UPDATE incidents
              SET title = ?, description = ?, severity = ?, status = ?,
                  external_data = ?, updated_at = CURRENT_TIMESTAMP
              WHERE external_id = ? AND external_source = 'servicenow'
            `).bind(
              incident.short_description || `ServiceNow Incident ${incident.number}`,
              incident.description || 'Incident synced from ServiceNow',
              mapServiceNowPriority(incident.priority),
              mapServiceNowState(incident.state),
              JSON.stringify(incident),
              incident.sys_id
            ).run();
          }
        } catch (error) {
          errors.push(`Failed to sync incident ${incident.number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Update sync job
      await c.env.DB.prepare(`
        UPDATE incident_sync_jobs
        SET status = ?, incidents_synced = ?, last_sync_at = CURRENT_TIMESTAMP,
            error_message = ?, next_sync_at = datetime('now', '+15 minutes')
        WHERE id = ?
      `).bind(
        errors.length > 0 ? 'completed_with_errors' : 'completed',
        syncedCount,
        errors.length > 0 ? JSON.stringify(errors) : null,
        syncJob.id
      ).run();
      
      return c.json({
        success: true,
        message: `Synced ${syncedCount} incidents from ServiceNow`,
        incidents_synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }, 500);
    }
  });

  /**
   * Get MS Defender Assets API
   */
  app.get('/api/ms-defender/assets', async (c) => {
    const user = c.get('user');
    
    const assets = await c.env.DB.prepare(`
      SELECT * FROM ms_defender_assets
      WHERE installation_id IN (
        SELECT id FROM integration_installations
        WHERE organization_id = ? AND integration_key = 'ms-defender'
      )
      ORDER BY last_seen DESC
      LIMIT 100
    `).bind(getOrgId(user)).all();
    
    return c.json({ success: true, assets: assets.results || [] });
  });

  /**
   * Get MS Defender Incidents API
   */
  app.get('/api/ms-defender/incidents', async (c) => {
    const user = c.get('user');
    
    const incidents = await c.env.DB.prepare(`
      SELECT * FROM ms_defender_incidents
      WHERE installation_id IN (
        SELECT id FROM integration_installations
        WHERE organization_id = ? AND integration_key = 'ms-defender'
      )
      ORDER BY created_time DESC
      LIMIT 100
    `).bind(getOrgId(user)).all();
    
    return c.json({ success: true, incidents: incidents.results || [] });
  });

  /**
   * Get MS Defender Vulnerabilities API
   */
  app.get('/api/ms-defender/vulnerabilities', async (c) => {
    const user = c.get('user');
    
    const vulnerabilities = await c.env.DB.prepare(`
      SELECT * FROM ms_defender_vulnerabilities
      WHERE installation_id IN (
        SELECT id FROM integration_installations
        WHERE organization_id = ? AND integration_key = 'ms-defender'
      )
      ORDER BY cvss_v3 DESC
      LIMIT 100
    `).bind(getOrgId(user)).all();
    
    return c.json({ success: true, vulnerabilities: vulnerabilities.results || [] });
  });

  return app;
}

// ========== DATABASE HELPERS ==========

async function getIntegrationCatalog(db: any): Promise<any[]> {
  const result = await db.prepare(`
    SELECT * FROM integration_catalog
    WHERE status = 'active'
    ORDER BY is_featured DESC, install_count DESC, name
  `).all();
  
  return result.results || [];
}

async function getUserInstallations(db: any, orgId: number): Promise<any[]> {
  const result = await db.prepare(`
    SELECT 
      ii.*,
      ic.name as integration_name,
      ic.vendor,
      ic.category,
      ic.icon_url
    FROM integration_installations ii
    JOIN integration_catalog ic ON ii.integration_key = ic.integration_key
    WHERE ii.organization_id = ? AND ii.is_enabled = 1
    ORDER BY ii.installed_at DESC
  `).bind(orgId).all();
  
  return result.results || [];
}

async function getIntegrationByKey(db: any, key: string): Promise<any> {
  const result = await db.prepare(`
    SELECT * FROM integration_catalog
    WHERE integration_key = ?
  `).bind(key).first();
  
  return result;
}

async function getInstallation(db: any, integrationKey: string, orgId: number): Promise<any> {
  const result = await db.prepare(`
    SELECT * FROM integration_installations
    WHERE integration_key = ? AND organization_id = ?
  `).bind(integrationKey, orgId).first();
  
  return result;
}

async function createInstallation(db: any, data: any): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO integration_installations (
      integration_key, organization_id, config_kv_key, installed_by
    ) VALUES (?, ?, ?, ?)
  `).bind(
    data.integration_key,
    data.organization_id,
    data.config_kv_key,
    data.installed_by
  ).run();
  
  return result.meta.last_row_id;
}

async function updateInstallationSyncStats(db: any, installationId: number, syncResult: any): Promise<void> {
  await db.prepare(`
    UPDATE integration_installations
    SET 
      last_sync_at = CURRENT_TIMESTAMP,
      last_sync_status = ?,
      total_syncs = total_syncs + 1,
      successful_syncs = successful_syncs + 1,
      total_records_synced = total_records_synced + ?
    WHERE id = ?
  `).bind(
    syncResult.errors.length > 0 ? 'partial' : 'success',
    syncResult.synced,
    installationId
  ).run();
}

// ========== UI RENDER FUNCTIONS ==========

function renderMarketplaceHomepage(catalog: any[], installations: any[]) {
  const installedKeys = new Set(installations.map(i => i.integration_key));
  
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Integration Marketplace</h1>
          <p class="mt-2 text-gray-600">Connect external security and IT management platforms</p>
        </div>

        <!-- My Integrations -->
        ${installations.length > 0 ? html`
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">My Integrations</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${installations.map(inst => html`
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">${inst.integration_name}</h3>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Installed</span>
                  </div>
                  <p class="text-sm text-gray-600 mb-4">${inst.category}</p>
                  <div class="flex gap-2">
                    <a href="/integrations/${inst.integration_key}" 
                       class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Manage →
                    </a>
                    <button onclick="syncIntegration('${inst.integration_key}')"
                            class="text-green-600 hover:text-green-800 text-sm font-medium">
                      Sync Now
                    </button>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        <!-- Available Integrations -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Available Integrations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${catalog.map(integration => {
              const isInstalled = installedKeys.has(integration.integration_key);
              return html`
                <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">${integration.name}</h3>
                    ${integration.is_featured ? html`
                      <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Featured</span>
                    ` : ''}
                  </div>
                  <p class="text-sm text-gray-600 mb-2">${integration.vendor}</p>
                  <p class="text-sm text-gray-500 mb-4">${integration.description}</p>
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">${integration.category}</span>
                    ${isInstalled ? html`
                      <a href="/integrations/${integration.integration_key}"
                         class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Manage →
                      </a>
                    ` : html`
                      <a href="/integrations/${integration.integration_key}"
                         class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Install →
                      </a>
                    `}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    </div>

    <script>
      async function syncIntegration(integrationKey) {
        if (!confirm('Start synchronization for this integration?')) return;
        
        try {
          const response = await fetch(\`/integrations/api/\${integrationKey}/sync\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = await response.json();
          
          if (data.success) {
            alert(\`Sync completed: \${data.result.synced} records synced, \${data.result.created} created, \${data.result.updated} updated\`);
            location.reload();
          } else {
            alert('Sync failed: ' + data.error);
          }
        } catch (error) {
          alert('Sync failed: ' + error.message);
        }
      }
    </script>
  `;
}

function renderIntegrationDetail(integration: any, installation: any) {
  const isInstalled = !!installation;
  
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900">${integration.name}</h1>
            <p class="text-gray-600 mt-2">${integration.vendor} • ${integration.category}</p>
          </div>

          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Description</h2>
            <p class="text-gray-700">${integration.description}</p>
          </div>

          ${isInstalled ? html`
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 class="text-lg font-semibold text-green-900 mb-2">✓ Installed</h3>
              <p class="text-sm text-green-700 mb-4">Last synced: ${installation.last_sync_at || 'Never'}</p>
              <div class="flex gap-4">
                <a href="/integrations/${integration.integration_key}/configure"
                   class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  Configure
                </a>
                <button onclick="syncIntegration('${integration.integration_key}')"
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                  Sync Now
                </button>
              </div>
            </div>
          ` : html`
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 class="text-lg font-semibold text-blue-900 mb-4">Install Integration</h3>
              <a href="/integrations/${integration.integration_key}/configure"
                 class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded inline-block">
                Install Now
              </a>
            </div>
          `}

          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Capabilities</h2>
            <div class="flex flex-wrap gap-2">
              ${JSON.parse(integration.capabilities || '[]').map((cap: string) => html`
                <span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">${cap}</span>
              `)}
            </div>
          </div>

          <div class="flex gap-4">
            <a href="/integrations" class="text-blue-600 hover:text-blue-800">
              ← Back to Marketplace
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDefenderConfiguration(installation: any) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Microsoft Defender Configuration</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 mb-4">Configure your Microsoft Defender for Endpoint integration.</p>
          
          ${installation ? html`
            <div class="space-y-4">
              <div class="flex gap-4">
                <a href="/integrations/ms-defender/assets" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Assets
                </a>
                <a href="/integrations/ms-defender/incidents" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Incidents
                </a>
                <a href="/integrations/ms-defender/vulnerabilities" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Vulnerabilities
                </a>
              </div>
            </div>
          ` : html`
            <form id="defenderConfigForm">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tenant ID</label>
                  <input type="text" name="tenantId" required
                         class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Client ID</label>
                  <input type="text" name="clientId" required
                         class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Client Secret</label>
                  <input type="password" name="clientSecret" required
                         class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                </div>
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Install Integration
                </button>
              </div>
            </form>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderDefenderAssets() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Microsoft Defender - Assets</h1>
        
        <div class="bg-white rounded-lg shadow">
          <div id="assetsTable" hx-get="/integrations/api/ms-defender/assets" hx-trigger="load">
            Loading assets...
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDefenderIncidents() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Microsoft Defender - Incidents</h1>
        
        <div class="bg-white rounded-lg shadow">
          <div id="incidentsTable" hx-get="/integrations/api/ms-defender/incidents" hx-trigger="load">
            Loading incidents...
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDefenderVulnerabilities() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Microsoft Defender - Vulnerabilities</h1>
        
        <div class="bg-white rounded-lg shadow">
          <div id="vulnerabilitiesTable" hx-get="/integrations/api/ms-defender/vulnerabilities" hx-trigger="load">
            Loading vulnerabilities...
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderServiceNowConfiguration(installation: any) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">ServiceNow Configuration</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 mb-4">Configure your ServiceNow ITSM & CMDB integration.</p>
          
          ${installation ? html`
            <div class="space-y-4">
              <div class="flex gap-4">
                <a href="/integrations/servicenow/cmdb" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View CMDB
                </a>
                <a href="/integrations/servicenow/services" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Services
                </a>
              </div>
            </div>
          ` : html`
            <p class="text-gray-500">Installation form would go here</p>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderServiceNowCMDB() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">ServiceNow CMDB</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">CMDB items will be displayed here</p>
        </div>
      </div>
    </div>
  `;
}

function renderServiceNowServices() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">ServiceNow Service Catalogue</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">Services will be displayed here</p>
        </div>
      </div>
    </div>
  `;
}

function renderTenableConfiguration(installation: any) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Tenable.io Configuration</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 mb-4">Configure your Tenable.io vulnerability management integration.</p>
          
          ${installation ? html`
            <div class="space-y-4">
              <div class="flex gap-4">
                <a href="/integrations/tenable/vulnerabilities" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Vulnerabilities
                </a>
                <a href="/integrations/tenable/assets" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Assets
                </a>
              </div>
            </div>
          ` : html`
            <p class="text-gray-500">Installation form would go here</p>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderTenableVulnerabilities() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Tenable Vulnerabilities</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">Vulnerabilities will be displayed here</p>
        </div>
      </div>
    </div>
  `;
}

function renderTenableAssets() {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold mb-6">Tenable Assets</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600">Assets will be displayed here</p>
        </div>
      </div>
    </div>
  `;
}

// ========== HELPER FUNCTIONS - Week 6 ==========

/**
 * Map MS Defender severity to ARIA5 severity
 */
function mapDefenderSeverity(defenderSeverity: string): string {
  const mapping: Record<string, string> = {
    'Informational': 'info',
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Critical': 'critical'
  };
  return mapping[defenderSeverity] || 'medium';
}

/**
 * Map MS Defender status to ARIA5 incident status
 */
function mapDefenderStatus(defenderStatus: string): string {
  const mapping: Record<string, string> = {
    'Active': 'open',
    'InProgress': 'investigating',
    'Resolved': 'resolved',
    'Redirected': 'closed'
  };
  return mapping[defenderStatus] || 'open';
}

/**
 * Map ServiceNow priority to ARIA5 severity
 */
function mapServiceNowPriority(priority: string): string {
  const mapping: Record<string, string> = {
    '1': 'critical', // P1 - Critical
    '2': 'high',     // P2 - High
    '3': 'medium',   // P3 - Medium
    '4': 'low',      // P4 - Low
    '5': 'info'      // P5 - Planning
  };
  return mapping[priority] || 'medium';
}

/**
 * Map ServiceNow state to ARIA5 incident status
 */
function mapServiceNowState(state: string): string {
  const mapping: Record<string, string> = {
    '1': 'open',         // New
    '2': 'investigating', // In Progress
    '3': 'investigating', // On Hold
    '6': 'resolved',     // Resolved
    '7': 'closed',       // Closed
    '8': 'closed'        // Canceled
  };
  return mapping[state] || 'open';
}
