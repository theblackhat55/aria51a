// Enterprise API Extensions - Assets, Services, Microsoft Integrations
import { Hono } from 'hono';
import { CloudflareBindings, ApiResponse } from './types';
import { authMiddleware } from './auth';
import { MicrosoftGraphService, EnhancedRiskScoring, type MicrosoftConfig } from './microsoft-integration';

export function createEnterpriseAPI() {
  const api = new Hono<{ Bindings: CloudflareBindings }>();

  // Assets Management API
  api.get('/api/assets', authMiddleware, async (c) => {
    try {
      const { page = '1', limit = '20', search = '', service_id = '', risk_level = '' } = c.req.query();
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let query = `
        SELECT a.*, s.name as service_name, o.name as organization_name, 
               u.first_name, u.last_name
        FROM assets a
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN users u ON a.owner_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (search) {
        query += ' AND (a.name LIKE ? OR a.asset_id LIKE ? OR a.ip_address LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (service_id) {
        query += ' AND a.service_id = ?';
        params.push(service_id);
      }
      
      if (risk_level) {
        const riskRanges = {
          'low': [0, 2],
          'medium': [2, 4],
          'high': [4, 6],
          'critical': [6, 10]
        };
        const range = riskRanges[risk_level as keyof typeof riskRanges];
        if (range) {
          query += ' AND a.risk_score >= ? AND a.risk_score < ?';
          params.push(range[0], range[1]);
        }
      }
      
      query += ' ORDER BY a.risk_score DESC, a.name ASC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const assets = await c.env.DB.prepare(query).bind(...params).all();
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM assets a WHERE 1=1 ${search ? 'AND (a.name LIKE ? OR a.asset_id LIKE ?)' : ''}`;
      const countParams = search ? [`%${search}%`, `%${search}%`] : [];
      const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: assets.results,
        total: totalResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch assets'
      }, 500);
    }
  });

  api.post('/api/assets', authMiddleware, async (c) => {
    try {
      const assetData = await c.req.json();
      const user = c.get('user');
      
      const result = await c.env.DB.prepare(`
        INSERT INTO assets (asset_id, name, asset_type, operating_system, ip_address, 
                           mac_address, risk_score, exposure_level, service_id, 
                           organization_id, owner_id, device_tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        assetData.asset_id,
        assetData.name,
        assetData.asset_type,
        assetData.operating_system || null,
        assetData.ip_address || null,
        assetData.mac_address || null,
        assetData.risk_score || 0,
        assetData.exposure_level || 'low',
        assetData.service_id || null,
        assetData.organization_id,
        assetData.owner_id || user.id,
        JSON.stringify(assetData.device_tags || [])
      ).run();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: { id: result.meta.last_row_id, ...assetData },
        message: 'Asset created successfully'
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to create asset'
      }, 500);
    }
  });

  api.get('/api/assets/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const asset = await c.env.DB.prepare(`
        SELECT a.*, s.name as service_name, o.name as organization_name, 
               u.first_name, u.last_name
        FROM assets a
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN users u ON a.owner_id = u.id
        WHERE a.id = ?
      `).bind(id).first();

      if (!asset) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Asset not found'
        }, 404);
      }

      return c.json<ApiResponse<any>>({
        success: true,
        data: asset
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch asset'
      }, 500);
    }
  });

  api.put('/api/assets/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const assetData = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        UPDATE assets SET
          name = COALESCE(?, name),
          asset_type = COALESCE(?, asset_type),
          operating_system = COALESCE(?, operating_system),
          ip_address = COALESCE(?, ip_address),
          mac_address = COALESCE(?, mac_address),
          risk_score = COALESCE(?, risk_score),
          exposure_level = COALESCE(?, exposure_level),
          service_id = COALESCE(?, service_id),
          organization_id = COALESCE(?, organization_id),
          owner_id = COALESCE(?, owner_id),
          device_tags = COALESCE(?, device_tags),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        assetData.name,
        assetData.asset_type,
        assetData.operating_system,
        assetData.ip_address,
        assetData.mac_address,
        assetData.risk_score,
        assetData.exposure_level,
        assetData.service_id,
        assetData.organization_id,
        assetData.owner_id,
        JSON.stringify(assetData.device_tags || []),
        id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Asset not found'
        }, 404);
      }

      return c.json<ApiResponse<any>>({
        success: true,
        data: { updated: true },
        message: 'Asset updated successfully'
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to update asset'
      }, 500);
    }
  });

  api.post('/api/assets/import', authMiddleware, async (c) => {
    try {
      const { assets, skipDuplicates = true } = await c.req.json();
      
      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Assets array is required'
        }, 400);
      }

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (const asset of assets) {
        try {
          // Check for duplicates if skipDuplicates is enabled
          if (skipDuplicates && asset.asset_id) {
            const existing = await c.env.DB.prepare(`
              SELECT id FROM assets WHERE asset_id = ?
            `).bind(asset.asset_id).first();

            if (existing) {
              skipped++;
              continue;
            }
          }

          // Create the asset
          const result = await c.env.DB.prepare(`
            INSERT INTO assets (
              asset_id, name, asset_type, category, description, 
              owner, location, criticality, value, service, risk_level,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            asset.asset_id,
            asset.name,
            asset.type || 'Hardware',
            asset.category || '',
            asset.description || '',
            asset.owner || '',
            asset.location || '',
            asset.criticality || 'Medium',
            asset.value ? parseFloat(asset.value) : null,
            asset.service || '',
            asset.risk_level || 'Medium'
          ).run();

          if (result.success) {
            imported++;
          }
        } catch (assetError) {
          console.error('Error importing individual asset:', assetError);
          errors.push(`Failed to import asset: ${asset.name || asset.asset_id}`);
        }
      }

      return c.json<ApiResponse<any>>({
        success: true,
        data: { 
          imported, 
          skipped, 
          errors: errors.length > 0 ? errors : undefined 
        },
        message: `Import completed: ${imported} imported, ${skipped} skipped`
      });
    } catch (error) {
      console.error('Error importing assets:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to import assets'
      }, 500);
    }
  });

  // Services Management API
  api.get('/api/services', authMiddleware, async (c) => {
    try {
      const { page = '1', limit = '20', search = '', criticality = '' } = c.req.query();
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let query = `
        SELECT s.*, o.name as organization_name, 
               u1.first_name as service_owner_first_name, u1.last_name as service_owner_last_name,
               u2.first_name as business_owner_first_name, u2.last_name as business_owner_last_name,
               COUNT(a.id) as asset_count
        FROM services s
        LEFT JOIN organizations o ON s.organization_id = o.id
        LEFT JOIN users u1 ON s.service_owner_id = u1.id
        LEFT JOIN users u2 ON s.business_owner_id = u2.id
        LEFT JOIN assets a ON s.id = a.service_id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (search) {
        query += ' AND (s.name LIKE ? OR s.service_id LIKE ? OR s.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (criticality) {
        query += ' AND s.criticality = ?';
        params.push(criticality);
      }
      
      query += ' GROUP BY s.id ORDER BY s.criticality DESC, s.risk_rating DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const services = await c.env.DB.prepare(query).bind(...params).all();
      
      const countQuery = `SELECT COUNT(*) as total FROM services s WHERE 1=1 ${search ? 'AND (s.name LIKE ? OR s.service_id LIKE ?)' : ''}`;
      const countParams = search ? [`%${search}%`, `%${search}%`] : [];
      const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: services.results,
        total: totalResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch services'
      }, 500);
    }
  });

  // Create Service API
  api.post('/api/services', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const serviceData = await c.req.json();
      
      // Generate unique service ID
      const serviceId = `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate service_type (must be one of the allowed values)
      const validServiceTypes = ['infrastructure', 'application', 'database', 'network', 'business_process'];
      const serviceType = serviceData.service_type && validServiceTypes.includes(serviceData.service_type) 
        ? serviceData.service_type 
        : 'application';

      // Validate criticality (must be one of the allowed values)
      const validCriticalities = ['critical', 'high', 'medium', 'low'];
      const criticality = serviceData.criticality && validCriticalities.includes(serviceData.criticality)
        ? serviceData.criticality
        : 'medium';

      console.log('Create service data:', {
        serviceId,
        name: serviceData.name,
        description: serviceData.description || '',
        service_type: serviceType,
        criticality: criticality,
        organization_id: serviceData.organization_id || 1,
        service_owner_id: serviceData.service_owner_id || user.id,
        business_owner_id: serviceData.business_owner_id || user.id
      });

      // Insert new service (matching actual table structure)
      const result = await c.env.DB.prepare(`
        INSERT INTO services (
          service_id, name, description, service_type, criticality,
          organization_id, service_owner_id, business_owner_id, 
          status, risk_rating, availability_requirement, 
          recovery_time_objective, recovery_point_objective,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        serviceId,
        serviceData.name,
        serviceData.description || '',
        serviceType, // Fixed: using validated serviceType
        criticality, // Fixed: using criticality instead of criticality_level
        serviceData.organization_id || 1,
        serviceData.service_owner_id || user.id,
        serviceData.business_owner_id || user.id,
        'active',
        0.0, // Default risk rating
        parseFloat(serviceData.availability_requirement) || 99.0,
        parseInt(serviceData.recovery_time_objective) || 4,
        parseInt(serviceData.recovery_point_objective) || 1
      ).run();

      // Get the created service
      const service = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(result.meta.last_row_id).first();

      return c.json<ApiResponse<any>>({
        success: true,
        data: service,
        message: 'Service created successfully'
      }, 201);
    } catch (error) {
      console.error('Create service error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to create service'
      }, 500);
    }
  });

  // Get Individual Service API
  api.get('/api/services/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      const service = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
      
      if (!service) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Service not found'
        }, 404);
      }
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Get service error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch service'
      }, 500);
    }
  });

  // Update Service API
  api.put('/api/services/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const serviceData = await c.req.json();
      
      // Validate service_type and criticality
      const validServiceTypes = ['infrastructure', 'application', 'database', 'network', 'business_process'];
      const validCriticalities = ['critical', 'high', 'medium', 'low'];
      
      const serviceType = serviceData.service_type && validServiceTypes.includes(serviceData.service_type) 
        ? serviceData.service_type 
        : 'application';

      const criticality = serviceData.criticality && validCriticalities.includes(serviceData.criticality)
        ? serviceData.criticality
        : 'medium';

      // Update service
      const result = await c.env.DB.prepare(`
        UPDATE services SET 
          name = ?, 
          description = ?, 
          service_type = ?, 
          criticality = ?,
          availability_requirement = ?,
          recovery_time_objective = ?,
          recovery_point_objective = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        serviceData.name,
        serviceData.description || '',
        serviceType,
        criticality,
        parseFloat(serviceData.availability_requirement) || 99.0,
        serviceData.recovery_time_objective ? parseInt(serviceData.recovery_time_objective) : null,
        serviceData.recovery_point_objective ? parseInt(serviceData.recovery_point_objective) : null,
        id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Service not found or no changes made'
        }, 404);
      }

      // Get updated service
      const updatedService = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();

      return c.json<ApiResponse<any>>({
        success: true,
        data: updatedService,
        message: 'Service updated successfully'
      });
    } catch (error) {
      console.error('Update service error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to update service'
      }, 500);
    }
  });

  // Microsoft Defender Integration APIs
  api.get('/api/microsoft/incidents', authMiddleware, async (c) => {
    try {
      const { page = '1', limit = '20', severity = '', status = '' } = c.req.query();
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let query = 'SELECT * FROM defender_incidents WHERE 1=1';
      const params: any[] = [];
      
      if (severity) {
        query += ' AND severity = ?';
        params.push(severity);
      }
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_datetime DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const incidents = await c.env.DB.prepare(query).bind(...params).all();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: incidents.results,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch Microsoft Defender incidents'
      }, 500);
    }
  });

  api.post('/api/microsoft/sync-assets', authMiddleware, async (c) => {
    try {
      // Get Microsoft configuration
      const configResult = await c.env.DB.prepare(
        'SELECT * FROM microsoft_integration_config WHERE sync_enabled = 1 LIMIT 1'
      ).first();
      
      if (!configResult) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Microsoft integration not configured or disabled'
        }, 400);
      }
      
      const config: MicrosoftConfig = {
        tenant_id: configResult.tenant_id,
        client_id: configResult.client_id,
        client_secret: configResult.client_secret,
        scopes: JSON.parse(configResult.scopes || '[]')
      };
      
      const microsoftService = new MicrosoftGraphService(config);
      const syncedCount = await microsoftService.syncAssetsToDatabase(c.env.DB, 1); // Default org ID
      
      // Update last sync time
      await c.env.DB.prepare(
        'UPDATE microsoft_integration_config SET last_sync = datetime("now") WHERE id = 1'
      ).run();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: { message: 'Asset sync completed', synced_count: syncedCount },
        message: `Successfully synced ${syncedCount} assets from Microsoft Defender`
      });
    } catch (error) {
      console.error('Microsoft asset sync error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync assets from Microsoft Defender'
      }, 500);
    }
  });

  api.post('/api/microsoft/sync-incidents', authMiddleware, async (c) => {
    try {
      // Get Microsoft configuration
      const configResult = await c.env.DB.prepare(
        'SELECT * FROM microsoft_integration_config WHERE sync_enabled = 1 LIMIT 1'
      ).first();
      
      if (!configResult) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Microsoft integration not configured or disabled'
        }, 400);
      }
      
      const config: MicrosoftConfig = {
        tenant_id: configResult.tenant_id,
        client_id: configResult.client_id,
        client_secret: configResult.client_secret,
        scopes: JSON.parse(configResult.scopes || '[]')
      };
      
      const microsoftService = new MicrosoftGraphService(config);
      const syncedCount = await microsoftService.syncIncidentsToDatabase(c.env.DB);
      
      // Update risk scores based on new incident data
      await EnhancedRiskScoring.updateRiskScoresFromIncidents(c.env.DB);
      
      // Update last sync time
      await c.env.DB.prepare(
        'UPDATE microsoft_integration_config SET last_sync = datetime("now") WHERE id = 1'
      ).run();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: { message: 'Incident sync completed', synced_count: syncedCount },
        message: `Successfully synced ${syncedCount} incidents and updated risk scores`
      });
    } catch (error) {
      console.error('Microsoft incident sync error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync incidents from Microsoft Defender'
      }, 500);
    }
  });

  // Microsoft Defender Vulnerability Sync API
  api.post('/api/microsoft/sync-vulnerabilities', authMiddleware, async (c) => {
    try {
      // Get Microsoft configuration
      const configResult = await c.env.DB.prepare(
        'SELECT * FROM microsoft_integration_config WHERE sync_enabled = 1 LIMIT 1'
      ).first();
      
      if (!configResult) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Microsoft integration not configured or disabled'
        }, 400);
      }
      
      const config: MicrosoftConfig = {
        tenant_id: configResult.tenant_id,
        client_id: configResult.client_id,
        client_secret: configResult.client_secret,
        scopes: JSON.parse(configResult.scopes || '[]')
      };
      
      const microsoftService = new MicrosoftGraphService(config);
      const syncedCount = await microsoftService.syncVulnerabilitiesToDatabase(c.env.DB);
      
      // Sync asset vulnerabilities and update risk scores
      await microsoftService.syncAssetVulnerabilities(c.env.DB);
      await EnhancedRiskScoring.updateRiskScoresFromVulnerabilities(c.env.DB);
      
      // Update last sync time
      await c.env.DB.prepare(
        'UPDATE microsoft_integration_config SET last_sync = datetime("now") WHERE id = 1'
      ).run();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: { message: 'Vulnerability sync completed', synced_count: syncedCount },
        message: `Successfully synced ${syncedCount} vulnerabilities and updated risk scores`
      });
    } catch (error) {
      console.error('Microsoft vulnerability sync error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync vulnerabilities from Microsoft Defender'
      }, 500);
    }
  });

  // Get vulnerability data for assets  
  api.get('/api/vulnerabilities', authMiddleware, async (c) => {
    try {
      const { page = '1', limit = '20', severity = '', asset_id = '', cve_id = '' } = c.req.query();
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let query = `
        SELECT v.*, 
               COUNT(av.asset_id) as affected_assets_count,
               GROUP_CONCAT(a.name) as affected_asset_names
        FROM defender_vulnerabilities v
        LEFT JOIN asset_vulnerabilities av ON v.id = av.vulnerability_id
        LEFT JOIN assets a ON av.asset_id = a.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (severity) {
        query += ' AND v.severity = ?';
        params.push(severity);
      }
      
      if (asset_id) {
        query += ' AND av.asset_id = ?';
        params.push(asset_id);
      }
      
      if (cve_id) {
        query += ' AND v.cve_id LIKE ?';
        params.push(`%${cve_id}%`);
      }
      
      query += ' GROUP BY v.id ORDER BY v.cvss_score DESC, v.severity DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const vulnerabilities = await c.env.DB.prepare(query).bind(...params).all();
      
      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT v.id) as total FROM defender_vulnerabilities v 
                         LEFT JOIN asset_vulnerabilities av ON v.id = av.vulnerability_id 
                         WHERE 1=1 ${severity ? 'AND v.severity = ?' : ''} ${asset_id ? 'AND av.asset_id = ?' : ''}`;
      const countParams = [];
      if (severity) countParams.push(severity);
      if (asset_id) countParams.push(asset_id);
      const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: vulnerabilities.results,
        total: totalResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch vulnerabilities'
      }, 500);
    }
  });

  // Get vulnerability details for specific asset
  api.get('/api/assets/:id/vulnerabilities', authMiddleware, async (c) => {
    try {
      const assetId = c.req.param('id');
      const { severity = '' } = c.req.query();
      
      let query = `
        SELECT v.*, av.detected_at, av.status as vulnerability_status
        FROM defender_vulnerabilities v
        INNER JOIN asset_vulnerabilities av ON v.id = av.vulnerability_id
        WHERE av.asset_id = ?
      `;
      const params: any[] = [assetId];
      
      if (severity) {
        query += ' AND v.severity = ?';
        params.push(severity);
      }
      
      query += ' ORDER BY v.cvss_score DESC, v.severity DESC';
      
      const vulnerabilities = await c.env.DB.prepare(query).bind(...params).all();
      
      // Get vulnerability summary stats
      const statsQuery = `
        SELECT 
          v.severity,
          COUNT(*) as count,
          AVG(v.cvss_score) as avg_cvss,
          MAX(v.cvss_score) as max_cvss
        FROM defender_vulnerabilities v
        INNER JOIN asset_vulnerabilities av ON v.id = av.vulnerability_id
        WHERE av.asset_id = ?
        GROUP BY v.severity
      `;
      const stats = await c.env.DB.prepare(statsQuery).bind(assetId).all();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          vulnerabilities: vulnerabilities.results,
          summary: stats.results
        }
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch asset vulnerabilities'
      }, 500);
    }
  });

  api.post('/api/microsoft/test-connection', authMiddleware, async (c) => {
    try {
      const configData = await c.req.json();
      
      const config: MicrosoftConfig = {
        tenant_id: configData.tenant_id,
        client_id: configData.client_id,
        client_secret: configData.client_secret,
        scopes: configData.scopes || ['https://graph.microsoft.com/.default']
      };
      
      const microsoftService = new MicrosoftGraphService(config);
      const connectionTest = await microsoftService.testConnection();
      
      return c.json<ApiResponse<any>>({
        success: connectionTest.graph || connectionTest.defender,
        data: connectionTest,
        message: connectionTest.error ? 
          `Connection failed: ${connectionTest.error}` : 
          'Connection test completed'
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }, 500);
    }
  });

  // SAML Authentication API
  api.get('/api/auth/saml/metadata', async (c) => {
    try {
      const config = await c.env.DB.prepare('SELECT * FROM saml_config WHERE enabled = 1 LIMIT 1').first();
      
      if (!config) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'SAML not configured'
        }, 404);
      }
      
      // Generate SAML metadata XML
      const metadata = `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" 
                     entityID="${config.entity_id}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                Location="https://your-domain.pages.dev/api/auth/saml/callback"
                                index="0" isDefault="true"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
      
      return new Response(metadata, {
        headers: { 'Content-Type': 'application/xml' }
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to generate SAML metadata'
      }, 500);
    }
  });

  api.post('/api/auth/saml/callback', async (c) => {
    try {
      // SAML assertion processing would go here
      // This is a complex implementation that requires SAML parsing
      return c.json<ApiResponse<any>>({
        success: true,
        data: { message: 'SAML authentication processed' },
        message: 'SAML login successful'
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'SAML authentication failed'
      }, 500);
    }
  });

  // Settings API
  api.get('/api/settings/microsoft-config', authMiddleware, async (c) => {
    try {
      const config = await c.env.DB.prepare('SELECT tenant_id, client_id, redirect_uri, scopes, sync_enabled, sync_frequency FROM microsoft_integration_config LIMIT 1').first();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: config || {}
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch Microsoft configuration'
      }, 500);
    }
  });

  api.put('/api/settings/microsoft-config', authMiddleware, async (c) => {
    try {
      const configData = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        INSERT OR REPLACE INTO microsoft_integration_config 
        (id, tenant_id, client_id, client_secret, redirect_uri, scopes, sync_enabled, sync_frequency, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        configData.tenant_id,
        configData.client_id,
        configData.client_secret || 'encrypted-placeholder',
        configData.redirect_uri,
        JSON.stringify(configData.scopes || []),
        configData.sync_enabled ? 1 : 0,
        configData.sync_frequency || 3600
      ).run();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: { message: 'Microsoft configuration updated' },
        message: 'Configuration saved successfully'
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to update Microsoft configuration'
      }, 500);
    }
  });

  api.get('/api/settings/saml-config', authMiddleware, async (c) => {
    try {
      const config = await c.env.DB.prepare('SELECT entity_id, sso_url, enabled, attribute_mapping FROM saml_config LIMIT 1').first();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: config || {}
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch SAML configuration'
      }, 500);
    }
  });

  // Risk Analytics with Asset Integration
  api.get('/api/analytics/asset-risk-correlation', authMiddleware, async (c) => {
    try {
      const query = `
        SELECT 
          a.name as asset_name,
          a.risk_score,
          a.exposure_level,
          COUNT(ai.id) as incident_count,
          AVG(r.risk_score) as average_risk_score,
          s.name as service_name,
          s.criticality
        FROM assets a
        LEFT JOIN asset_incidents ai ON a.id = ai.asset_id
        LEFT JOIN risk_assets ra ON a.id = ra.asset_id
        LEFT JOIN risks r ON ra.risk_id = r.id
        LEFT JOIN services s ON a.service_id = s.id
        GROUP BY a.id
        ORDER BY a.risk_score DESC, incident_count DESC
        LIMIT 20
      `;
      
      const results = await c.env.DB.prepare(query).all();
      
      return c.json<ApiResponse<any>>({
        success: true,
        data: results.results
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to fetch asset risk correlation data'
      }, 500);
    }
  });

  return api;
}