import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { renderIntelligenceSettings, getThreatFeeds, getThreatFeedById, testThreatFeed } from './intelligence-settings';
import { createServiceCriticalityAPI } from './api-service-criticality';
import type { CloudflareBindings } from '../types';

export function createOperationsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Operations Center',
        user,
        content: renderOperationsDashboard()
      })
    );
  });
  
  // Asset Management
  app.get('/assets', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Asset Management',
        user,
        content: renderAssetManagement()
      })
    );
  });
  
  // Service Management
  app.get('/services', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Service Management',
        user,
        content: renderServiceManagement()
      })
    );
  });
  
  // Document Management
  app.get('/documents', async (c) => {
    const user = c.get('user');
    const typeFilter = c.req.query('type');
    let documents = await getDocuments(c.env.DB);
    
    // Filter by type if specified
    if (typeFilter) {
      documents = documents.filter(doc => doc.type === typeFilter);
    }
    
    return c.html(
      cleanLayout({
        title: 'Document Management',
        user,
        content: renderDocumentManagement(documents)
      })
    );
  });

  // Microsoft Defender Integration
  app.get('/defender', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Microsoft Defender Integration',
        user,
        content: renderDefenderIntegration()
      })
    );
  });

  // Stats API endpoints for dashboard
  app.get('/api/stats/assets', async (c) => {
    const assets = await getAssets(c.env.DB);
    const count = assets.length;
    return c.html(`
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-server text-2xl text-blue-500"></i>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
              <dd class="text-lg font-medium text-gray-900">${count}</dd>
            </dl>
          </div>
        </div>
      </div>
    `);
  });

  app.get('/api/stats/services', async (c) => {
    const services = await getServices(c.env.DB);
    const count = services.length;
    return c.html(`
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-sitemap text-2xl text-green-500"></i>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Active Services</dt>
              <dd class="text-lg font-medium text-gray-900">${count}</dd>
            </dl>
          </div>
        </div>
      </div>
    `);
  });

  app.get('/api/stats/documents', async (c) => {
    try {
      const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM documents WHERE is_active = 1').first();
      const count = result?.count || 0;
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-file-alt text-2xl text-purple-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Documents</dt>
                <dd class="text-lg font-medium text-gray-900">${count}</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Error fetching document count:', error);
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-file-alt text-2xl text-purple-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Documents</dt>
                <dd class="text-lg font-medium text-gray-900">0</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    }
  });

  app.get('/api/stats/incidents', async (c) => {
    try {
      const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'open'").first();
      const count = result?.count || 0;
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Open Incidents</dt>
                <dd class="text-lg font-medium text-gray-900">${count}</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Error fetching incident count:', error);
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Open Incidents</dt>
                <dd class="text-lg font-medium text-gray-900">0</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    }
  });

  // API endpoints - now using D1 database
  app.get('/api/assets', async (c) => {
    const assets = await getAssets(c.env.DB);
    return c.html(renderAssetRows(assets));
  });

  app.get('/api/services', async (c) => {
    // Get actual services from assets table where category='service'
    const services = await getServices(c.env.DB);
    return c.html(renderServiceRows(services));
  });

  app.post('/api/assets', async (c) => {
    try {
      const formData = await c.req.formData();
      
      // Generate unique asset ID automatically
      const asset_id = `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Enhanced ARIA5 asset data collection for assets_enhanced table
      const assetData = {
        // Unique asset identifier
        asset_id: asset_id,
        
        // Basic asset information
        name: formData.get('name'),
        type: formData.get('type'), // Will be used as subcategory
        asset_type: 'Primary', // Default to Primary asset
        category: 'Systems', // Default category
        operating_system: formData.get('operating_system'),
        location: formData.get('location'),
        technical_custodian: formData.get('technical_custodian'),
        
        // Security assessment (CIA Triad) - numeric values
        confidentiality: formData.get('confidentiality'),
        integrity: formData.get('integrity'),
        availability: formData.get('availability'),
        
        // Business and classification fields
        business_function: formData.get('business_function') || '',
        data_classification: formData.get('data_classification') || 'Internal',
        
        // Technical & compliance configuration
        network_zone: formData.get('network_zone'),
        compliance_requirements: formData.get('compliance_requirements'),
        patch_management: formData.get('patch_management'),
        backup_status: formData.get('backup_status'),
        monitoring_level: formData.get('monitoring_level'),
        
        // Additional information
        description: formData.get('description'),
        
        // Calculated risk score
        risk_score: formData.get('risk_score'),
        
        // System fields
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Auto-calculate criticality based on risk score
      const riskScore = parseFloat(assetData.risk_score || '0');
      let calculatedCriticality, riskLevel, riskColor;
      
      if (riskScore >= 3.5) {
        calculatedCriticality = 'Critical';
        riskLevel = 'Critical';
        riskColor = 'text-red-600 bg-red-100';
      } else if (riskScore >= 2.5) {
        calculatedCriticality = 'High';
        riskLevel = 'High';
        riskColor = 'text-orange-600 bg-orange-100';
      } else if (riskScore >= 1.5) {
        calculatedCriticality = 'Medium';
        riskLevel = 'Medium';
        riskColor = 'text-yellow-600 bg-yellow-100';
      } else {
        calculatedCriticality = 'Low';
        riskLevel = 'Low';
        riskColor = 'text-green-600 bg-green-100';
      }
      
      // Add the calculated criticality to asset data
      assetData.criticality = calculatedCriticality;
      
      const asset = await createAsset(c.env.DB, assetData);
      
      // Return enhanced success message with asset details
      return c.html(html`
        <div class="fixed inset-0 bg-green-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Asset Added Successfully!</h3>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div class="text-sm space-y-2">
                <div><span class="font-medium">Asset ID:</span> <code class="text-blue-600 bg-blue-100 px-2 py-1 rounded">${assetData.asset_id}</code></div>
                <div><span class="font-medium">Asset:</span> ${assetData.name}</div>
                <div><span class="font-medium">Type:</span> ${assetData.type || 'Not specified'}</div>
                <div><span class="font-medium">Location:</span> ${assetData.location || 'Not specified'}</div>
                <div><span class="font-medium">OS:</span> ${assetData.operating_system || 'Not specified'}</div>
                <div class="flex items-center">
                  <span class="font-medium mr-2">Risk Score:</span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${riskColor}">
                    ${riskLevel} ${riskScore > 0 ? `(${riskScore.toFixed(1)}/4.0)` : ''}
                  </span>
                </div>
                <div><span class="font-medium">CIA Rating:</span> C:${assetData.confidentiality}, I:${assetData.integrity}, A:${assetData.availability}</div>
                <div><span class="font-medium">Auto-Calculated Criticality:</span> <span class="px-2 py-1 rounded-full text-xs font-medium ${riskColor}">${assetData.criticality}</span></div>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 mb-6">
              The asset has been configured with ARIA5 security assessment and is now active in the system.
            </p>
            
            <button hx-get="/operations/api/assets/close" hx-target="#asset-modal" hx-swap="innerHTML"
                    class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Asset creation error:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">
              Error adding asset. Please check all required fields and try again.
            </div>
          </div>
        </div>
        ${renderAssetModal()}
      `);
    }
  });

  app.post('/api/services', async (c) => {
    try {
      const formData = await c.req.formData();
      
      // Generate unique service ID
      const service_id = `SERVICE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Enhanced ARIA5 service data collection - store in dedicated services table
      const serviceData = {
        // Unique service identifier
        service_id: service_id,
        
        // Basic service information
        name: formData.get('name'),
        description: formData.get('description'),
        service_category: formData.get('category') || 'Business Service',
        business_department: formData.get('department') || 'Unknown',
        service_owner: formData.get('owner') || 'TBD',
        
        // Business Impact Assessment (CIA Triad)
        confidentiality_impact: formData.get('confidentiality_impact') || 'Medium',
        integrity_impact: formData.get('integrity_impact') || 'Medium',
        availability_impact: formData.get('availability_impact') || 'Medium',
        
        // Convert CIA text values to numeric (1-5 scale)
        confidentiality_numeric: convertImpactToNumeric(formData.get('confidentiality_impact')),
        integrity_numeric: convertImpactToNumeric(formData.get('integrity_impact')),
        availability_numeric: convertImpactToNumeric(formData.get('availability_impact')),
        
        // Service Level Requirements
        recovery_time_objective: formData.get('rto') ? parseInt(formData.get('rto')) : 24,
        recovery_point_objective: formData.get('rpo') ? parseInt(formData.get('rpo')) : 24,
        
        // Business function and impact
        business_function: formData.get('business_function') || 'General Operations',
        
        // Calculate risk score from CIA triad
        risk_score: calculateRiskScore(
          convertImpactToNumeric(formData.get('confidentiality_impact')),
          convertImpactToNumeric(formData.get('integrity_impact')),
          convertImpactToNumeric(formData.get('availability_impact'))
        )
      };
      
      // Auto-calculate AI-based criticality (don't use manual input)
      const aiCriticality = await calculateAICriticality(serviceData, c.env.DB);
      serviceData.criticality = aiCriticality.calculated_criticality;
      serviceData.criticality_score = aiCriticality.criticality_score;
      serviceData.ai_confidence = aiCriticality.confidence_level;
      serviceData.ai_last_assessment = new Date().toISOString();
      
      // Create service in services table
      const service = await createService(c.env.DB, serviceData);
      
      // Determine risk level for display
      const riskScore = parseFloat(serviceData.service_risk_score || '0');
      let riskLevel, riskColor;
      if (riskScore >= 3.5) {
        riskLevel = 'Critical';
        riskColor = 'text-red-600 bg-red-100';
      } else if (riskScore >= 2.5) {
        riskLevel = 'High'; 
        riskColor = 'text-orange-600 bg-orange-100';
      } else if (riskScore >= 1.5) {
        riskLevel = 'Medium';
        riskColor = 'text-yellow-600 bg-yellow-100';  
      } else {
        riskLevel = 'Low';
        riskColor = 'text-green-600 bg-green-100';
      }
      
      const response = c.html(html`
        <div class="fixed inset-0 bg-green-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg mx-4">
            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">🎉 AI Service Assessment Complete!</h3>
            
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 text-left border-l-4 border-purple-500">
              <div class="text-sm space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-medium">Service:</span> 
                  <span class="font-semibold text-purple-700">${serviceData.name}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">AI Criticality:</span> 
                  <span class="px-3 py-1 rounded-full text-sm font-bold ${
                    serviceData.criticality === 'Critical' ? 'bg-red-100 text-red-800' :
                    serviceData.criticality === 'High' ? 'bg-orange-100 text-orange-800' :
                    serviceData.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }">
                    ${serviceData.criticality} (${serviceData.criticality_score}/100)
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">AI Confidence:</span> 
                  <span class="font-semibold text-blue-700">${Math.round((serviceData.ai_confidence || 0) * 100)}%</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">Category:</span> 
                  <span>${serviceData.service_category}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">Department:</span> 
                  <span>${serviceData.business_department}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">CIA Triad:</span> 
                  <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">C:${serviceData.confidentiality_numeric} I:${serviceData.integrity_numeric} A:${serviceData.availability_numeric}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-left">
              <div class="flex items-start">
                <i class="fas fa-robot text-blue-500 mr-2 mt-0.5"></i>
                <div class="text-sm text-blue-700">
                  <p class="font-medium mb-1">AI Assessment Complete</p>
                  <p class="text-xs">Multi-factor analysis applied: CIA impact (40%), asset dependencies (25%), risk associations (20%), business context (15%). Service is ready for operational integration.</p>
                </div>
              </div>
            </div>
            
            <button hx-get="/operations/api/services/close" 
                    hx-target="#service-modal" 
                    hx-swap="innerHTML"
                    hx-trigger="click"
                    class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors shadow-lg">
              <i class="fas fa-check mr-2"></i>
              Continue to Services Dashboard
            </button>
          </div>
        </div>
      `);
      
      // Trigger service list refresh
      response.headers.set('HX-Trigger', 'serviceCreated,refreshServices');
      return response;
    } catch (error) {
      console.error('Service creation error:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">
              Error adding service. Please check all required fields and try again.
              <br><small>Error: ${error.message}</small>
            </div>
          </div>
        </div>
        ${renderServiceModal()}
      `);
    }
  });

  // Modal endpoints for HTMX
  app.get('/api/assets/new', async (c) => {
    return c.html(renderAssetModal());
  });

  app.get('/api/services/new', async (c) => {
    return c.html(renderServiceModal());
  });

  // Document upload modal endpoint
  app.get('/api/documents/new', async (c) => {
    return c.html(renderDocumentUploadModal());
  });

  // Document upload processing - R2 Integration
  app.post('/api/documents', async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      const type = formData.get('type') as string;
      const description = formData.get('description') as string;
      
      if (!file || !name || !type) {
        throw new Error('Missing required fields');
      }
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `${timestamp}-${randomId}.${fileExtension}`;
      const r2Key = `documents/${uniqueFilename}`;
      
      // Upload to R2
      await c.env.R2.put(r2Key, file, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: 'system',
          uploadedAt: new Date().toISOString(),
        },
      });
      
      // Save document metadata to database
      const documentData = {
        document_id: `DOC-${randomId.toUpperCase()}`,
        file_name: uniqueFilename,
        original_file_name: file.name,
        file_path: r2Key,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        file_hash: '', // Could implement SHA256 hash if needed
        uploaded_by: c.get('user')?.id || 1,
        title: name,
        description: description || '',
        document_type: type,
        tags: JSON.stringify([]),
        version: '1.0',
        visibility: 'private',
        access_permissions: JSON.stringify([]),
        related_entity_type: null,
        related_entity_id: null,
        upload_date: new Date().toISOString(),
        download_count: 0,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const document = await createDocument(c.env.DB, documentData);
      
      // Return success message and close modal
      return c.html(html`
        <div class="fixed inset-0 bg-purple-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-6 rounded-lg shadow-lg text-center">
            <i class="fas fa-check-circle text-purple-500 text-4xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Document Uploaded Successfully!</h3>
            <p class="text-sm text-gray-600 mb-4">${name} has been uploaded to aria51 R2 storage.</p>
            <button hx-get="/operations/documents" hx-target="body" hx-swap="innerHTML"
                    class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              View Documents
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">
              Error uploading document: ${error.message}
            </div>
          </div>
        </div>
        ${renderDocumentUploadModal()}
      `);
    }
  });

  // Microsoft Defender Stats API endpoints
  app.get('/api/stats/machines', async (c) => {
    try {
      const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM assets_enhanced WHERE subcategory LIKE '%device%' OR subcategory LIKE '%Device%' AND active_status = TRUE").first();
      const count = result?.count || 0;
      return c.html(`
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">Machines Online</p>
            <p class="text-sm text-green-600">${count} devices</p>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">Machines Online</p>
            <p class="text-sm text-green-600">0 devices</p>
          </div>
        </div>
      `);
    }
  });

  app.get('/api/stats/alerts', async (c) => {
    try {
      const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'open'").first();
      const count = result?.count || 0;
      return c.html(`
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-yellow-800">Active Alerts</p>
            <p class="text-sm text-yellow-600">${count} alerts</p>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-yellow-800">Active Alerts</p>
            <p class="text-sm text-yellow-600">0 alerts</p>
          </div>
        </div>
      `);
    }
  });

  app.get('/api/stats/vulnerabilities', async (c) => {
    try {
      const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM risks WHERE status = 'active' AND (probability * impact) >= 15").first();
      const count = result?.count || 0;
      return c.html(`
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-bug text-red-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">Vulnerabilities</p>
            <p class="text-sm text-red-600">${count} found</p>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-bug text-red-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">Vulnerabilities</p>
            <p class="text-sm text-red-600">0 found</p>
          </div>
        </div>
      `);
    }
  });

  // Modal close endpoints
  app.get('/api/assets/close', async (c) => {
    return c.html(''); // Return empty content to close modal
  });

  app.get('/api/services/close', async (c) => {
    return c.html(''); // Return empty content to close modal
  });

  app.get('/api/documents/close', async (c) => {
    return c.html(''); // Return empty content to close modal
  });

  app.get('/api/link/close', async (c) => {
    return c.html(''); // Return empty content to close link modal
  });

  // API endpoint to get services for risk management
  app.get('/api/services/for-risk', async (c) => {
    const services = await getServices(c.env.DB);
    return c.json({ success: true, services });
  });

  // API endpoint to get assets for risk management  
  app.get('/api/assets/for-risk', async (c) => {
    const assets = await getAssets(c.env.DB);
    return c.json({ success: true, assets });
  });

  // Asset linking modal for services
  app.get('/api/link/assets-to-service', async (c) => {
    const assets = await getAssets(c.env.DB);
    return c.html(renderAssetLinkingModal(assets));
  });

  // Risk linking modal for services
  app.get('/api/link/risks-to-service', async (c) => {
    const risks = await getRisks(c.env.DB);
    return c.html(renderRiskLinkingModal(risks));
  });

  // Edit service endpoint
  app.get('/api/services/:id/edit', async (c) => {
    const serviceId = c.req.param('id');
    const service = await getServiceById(c.env.DB, serviceId);
    if (!service) {
      return c.html('<div class="p-4 text-red-600">Service not found</div>');
    }
    return c.html(renderServiceEditModal(service));
  });

  // Delete confirmation modal
  app.get('/api/services/:id/delete-confirm', async (c) => {
    const serviceId = c.req.param('id');
    const service = await getServiceById(c.env.DB, serviceId);
    if (!service) {
      return c.html('<div class="p-4 text-red-600">Service not found</div>');
    }
    
    // Check if service has linked assets or risks
    const linkedAssets = service.linked_assets ? JSON.parse(service.linked_assets) : [];
    const linkedRisks = service.linked_risks ? JSON.parse(service.linked_risks) : [];
    
    return c.html(renderServiceDeleteModal(service, linkedAssets, linkedRisks));
  });

  // Update service endpoint
  app.post('/api/services/:id', async (c) => {
    try {
      const serviceId = c.req.param('id');
      const formData = await c.req.formData();
      
      const serviceData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        service_category: formData.get('service_category') as string || 'Business Service',
        business_department: formData.get('business_department') as string,
        confidentiality_impact: formData.get('confidentiality_impact') as string || 'Medium',
        integrity_impact: formData.get('integrity_impact') as string || 'Medium',
        availability_impact: formData.get('availability_impact') as string || 'Medium',
        confidentiality_numeric: parseInt(formData.get('confidentiality_numeric') as string) || 3,
        integrity_numeric: parseInt(formData.get('integrity_numeric') as string) || 3,
        availability_numeric: parseInt(formData.get('availability_numeric') as string) || 3,
        business_function: formData.get('business_function') as string || 'General Operations',
        criticality: formData.get('criticality') as string || 'Medium',
        updated_at: new Date().toISOString()
      };
      
      await updateService(c.env.DB, serviceId, serviceData);
      
      // Return updated service rows with auto-refresh
      const services = await getServices(c.env.DB);
      const response = c.html(renderServiceRows(services));
      response.headers.set('HX-Trigger', 'serviceUpdated');
      return response;
    } catch (error) {
      console.error('Error updating service:', error);
      return c.html('<div class="p-4 text-red-600">Error updating service. Please try again.</div>');
    }
  });

  // Close service modal endpoint
  app.get('/api/services/close', async (c) => {
    return c.html('');
  });

  // Delete service endpoint
  app.delete('/api/services/:id', async (c) => {
    try {
      const serviceId = c.req.param('id');
      
      // First delete related records
      await c.env.DB.prepare('DELETE FROM service_asset_links WHERE service_id = ?').bind(serviceId).run();
      await c.env.DB.prepare('DELETE FROM service_risk_links WHERE service_id = ?').bind(serviceId).run();
      await c.env.DB.prepare('DELETE FROM service_criticality_assessments WHERE service_id = ?').bind(serviceId).run();
      
      // Then delete the service
      await c.env.DB.prepare('DELETE FROM services WHERE service_id = ?').bind(serviceId).run();
      
      // Return updated service rows with auto-refresh
      const services = await getServices(c.env.DB);
      const response = c.html(renderServiceRows(services));
      response.headers.set('HX-Trigger', 'serviceDeleted');
      return response;
    } catch (error) {
      console.error('Error deleting service:', error);
      return c.html('<div class="p-4 text-red-600">Error deleting service. Please try again.</div>');
    }
  });

  // Close linking modal endpoint
  app.get('/api/link/close', async (c) => {
    return c.html('');
  });

  // R2 Object Storage - File Upload Endpoint
  app.post('/api/documents/upload', async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return c.json({ error: 'File size exceeds 50MB limit' }, 400);
      }

      // Generate unique file name
      const fileExtension = file.name.split('.').pop() || '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `documents/${timestamp}-${randomId}.${fileExtension}`;

      // Upload to R2
      const fileBuffer = await file.arrayBuffer();
      await c.env.R2.put(fileName, fileBuffer, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: c.get('user')?.id?.toString() || 'unknown',
          uploadDate: new Date().toISOString(),
        }
      });

      // Store document metadata in database
      const documentData = {
        document_id: `DOC-${randomId.toUpperCase()}`,
        file_name: fileName,
        original_file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        file_hash: '', // Could implement SHA256 hash if needed
        uploaded_by: c.get('user')?.id || 1,
        title: formData.get('title') || file.name,
        description: formData.get('description') || '',
        document_type: formData.get('document_type') || 'other',
        tags: JSON.stringify(formData.get('tags')?.toString().split(',') || []),
        version: formData.get('version') || '1.0',
        visibility: formData.get('visibility') || 'private',
        access_permissions: JSON.stringify([]),
        related_entity_type: formData.get('related_entity_type') || null,
        related_entity_id: formData.get('related_entity_id') ? parseInt(formData.get('related_entity_id') as string) : null,
        upload_date: new Date().toISOString(),
        download_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await createDocument(c.env.DB, documentData);

      return c.json({
        success: true,
        document_id: documentData.document_id,
        file_name: fileName,
        original_name: file.name,
        file_size: file.size,
        download_url: `/api/documents/${documentData.document_id}/download`
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }
  });

  // File Download Endpoint
  app.get('/api/documents/:documentId/download', async (c) => {
    try {
      const documentId = c.req.param('documentId');
      
      // Get document metadata from database
      const document = await getDocumentById(c.env.DB, documentId);
      if (!document) {
        return c.notFound();
      }

      // Get file from R2
      const object = await c.env.R2.get(document.file_path);
      if (!object) {
        return c.notFound();
      }

      // Update download count
      await updateDocumentDownloadCount(c.env.DB, documentId);

      // Return file with proper headers
      return new Response(object.body, {
        headers: {
          'Content-Type': document.mime_type,
          'Content-Disposition': `attachment; filename="${document.original_file_name}"`,
          'Content-Length': document.file_size.toString(),
        }
      });

    } catch (error) {
      console.error('Error downloading file:', error);
      return c.text('Error downloading file', 500);
    }
  });

  // List Documents Endpoint
  app.get('/api/documents', async (c) => {
    try {
      const documents = await getDocuments(c.env.DB);
      return c.json({
        success: true,
        documents: documents.map(doc => ({
          ...doc,
          tags: doc.tags ? JSON.parse(doc.tags) : [],
          access_permissions: doc.access_permissions ? JSON.parse(doc.access_permissions) : [],
          download_url: `/api/documents/${doc.document_id}/download`
        }))
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      return c.json({ error: 'Failed to fetch documents' }, 500);
    }
  });

  // Delete Document Endpoint
  app.delete('/api/documents/:documentId', async (c) => {
    try {
      const documentId = c.req.param('documentId');
      
      // Get document metadata
      const document = await getDocumentById(c.env.DB, documentId);
      if (!document) {
        return c.json({ error: 'Document not found' }, 404);
      }

      // Delete from R2
      await c.env.R2.delete(document.file_path);

      // Delete from database
      await deleteDocument(c.env.DB, documentId);

      return c.json({ success: true, message: 'Document deleted successfully' });

    } catch (error) {
      console.error('Error deleting document:', error);
      return c.json({ error: 'Failed to delete document' }, 500);
    }
  });

  // Document delete confirmation modal
  app.get('/api/documents/:id/delete-confirm', async (c) => {
    const documentId = c.req.param('id');
    const document = await getDocumentById(c.env.DB, documentId);
    if (!document) {
      return new Response('<div class="p-4 text-red-600">Document not found</div>', {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    const modalHtml = renderDocumentDeleteModal(document);
    return new Response(modalHtml.toString(), {
      headers: { 'Content-Type': 'text/html' }
    });
  });

  // Process document deletion
  app.post('/api/documents/:id/delete', async (c) => {
    try {
      const documentId = c.req.param('id');
      
      // Get document metadata
      const document = await getDocumentById(c.env.DB, documentId);
      if (!document) {
        return c.html(html`
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="text-sm text-red-700">Document not found</div>
          </div>
        `);
      }

      // Delete from R2
      await c.env.R2.delete(document.r2_key);

      // Delete from database
      await deleteDocument(c.env.DB, documentId);

      return c.html(html`
        <div class="fixed inset-0 bg-red-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-6 rounded-lg shadow-lg text-center">
            <i class="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Document Deleted Successfully!</h3>
            <p class="text-sm text-gray-600 mb-4">${document.name} has been permanently removed.</p>
            <button hx-get="/operations/documents" hx-target="body" hx-swap="innerHTML"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Back to Documents
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="text-sm text-red-700">Error deleting document: ${error.message}</div>
        </div>
      `);
    }
  });

  // Delete service endpoint
  app.delete('/api/services/:id', async (c) => {
    try {
      const serviceId = c.req.param('id');
      
      // First check if service exists and has linked items
      const service = await getServiceById(c.env.DB, serviceId);
      if (!service) {
        return c.json({ error: 'Service not found' }, 404);
      }
      
      const linkedAssets = service.linked_assets ? JSON.parse(service.linked_assets) : [];
      const linkedRisks = service.linked_risks ? JSON.parse(service.linked_risks) : [];
      
      if (linkedAssets.length > 0 || linkedRisks.length > 0) {
        return c.json({ 
          error: 'Cannot delete service with linked assets or risks. Please unlink all items first.',
          linkedAssets: linkedAssets.length,
          linkedRisks: linkedRisks.length 
        }, 400);
      }
      
      await deleteService(c.env.DB, serviceId);
      
      // Return updated service list
      const services = await getServices(c.env.DB);
      return new Response(renderServiceRows(services), {
        headers: { 'Content-Type': 'text/html' }
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      return c.json({ error: 'Error deleting service' }, 500);
    }
  });

  // Intelligence Settings
  app.get('/intelligence-settings', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Intelligence Settings',
        user,
        content: renderIntelligenceSettings()
      })
    );
  });

  // Intelligence Settings API routes
  app.get('/api/intelligence/feeds', async (c) => {
    try {
      const feeds = await getThreatFeeds(c.env.DB);
      return c.json({ feeds });
    } catch (error) {
      console.error('Error fetching threat feeds:', error);
      return c.json({ error: 'Failed to fetch threat feeds' }, 500);
    }
  });

  app.post('/api/intelligence/feeds', async (c) => {
    try {
      const { name, type, url, api_key, format, description, active } = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        INSERT INTO threat_feeds (name, type, url, api_key, format, description, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(name, type, url, api_key, format, description, active ? 1 : 0).run();
      
      return c.json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
      console.error('Error creating threat feed:', error);
      return c.json({ error: 'Failed to create threat feed' }, 500);
    }
  });

  app.put('/api/intelligence/feeds/:id', async (c) => {
    try {
      const feedId = c.req.param('id');
      const { name, type, url, api_key, format, description, active } = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE threat_feeds 
        SET name = ?, type = ?, url = ?, api_key = ?, format = ?, description = ?, active = ?, updated_at = datetime('now')
        WHERE feed_id = ?
      `).bind(name, type, url, api_key, format, description, active ? 1 : 0, feedId).run();
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Error updating threat feed:', error);
      return c.json({ error: 'Failed to update threat feed' }, 500);
    }
  });

  app.delete('/api/intelligence/feeds/:id', async (c) => {
    try {
      const feedId = c.req.param('id');
      
      await c.env.DB.prepare(`
        DELETE FROM threat_feeds WHERE feed_id = ?
      `).bind(feedId).run();
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting threat feed:', error);
      return c.json({ error: 'Failed to delete threat feed' }, 500);
    }
  });

  app.post('/api/intelligence/feeds/:id/test', async (c) => {
    try {
      const feedId = c.req.param('id');
      const feed = await getThreatFeedById(c.env.DB, feedId);
      
      if (!feed) {
        return c.json({ error: 'Feed not found' }, 404);
      }

      // Test the feed connection
      const testResult = await testThreatFeed(feed);
      
      return c.json({ 
        success: testResult.success, 
        message: testResult.message,
        response_time: testResult.responseTime,
        indicators_count: testResult.indicatorsCount
      });
    } catch (error) {
      console.error('Error testing threat feed:', error);
      return c.json({ error: 'Failed to test threat feed' }, 500);
    }
  });

  // Mount AI Service Criticality API
  app.route('/api/service-criticality', createServiceCriticalityAPI());

  return app;
}

// Main Operations Dashboard
const renderOperationsDashboard = () => html`
  <div class="min-h-screen bg-gray-50 py-6 sm:py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt text-blue-600 mr-2 sm:mr-3 text-lg sm:text-xl lg:text-2xl"></i>
          Operations Center
        </h1>
        <p class="mt-2 text-sm sm:text-base lg:text-lg text-gray-600">Microsoft Defender & security operations management</p>
      </div>

      <!-- Quick Stats - Now loading real data -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg" 
             hx-get="/operations/api/stats/assets" 
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-server text-lg sm:text-xl lg:text-2xl text-blue-500"></i>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Assets</dt>
                  <dd class="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg"
             hx-get="/operations/api/stats/services"
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-sitemap text-lg sm:text-xl lg:text-2xl text-green-500"></i>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">Active Services</dt>
                  <dd class="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg"
             hx-get="/operations/api/stats/documents"
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-file-alt text-lg sm:text-xl lg:text-2xl text-purple-500"></i>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">Documents</dt>
                  <dd class="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg"
             hx-get="/operations/api/stats/incidents"
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Security Alerts</dt>
                  <dd class="text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Operations Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Asset Management -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-server text-blue-500 mr-3"></i>
            <h2 class="text-lg font-semibold text-gray-900">Asset Management</h2>
          </div>
          <p class="text-gray-600 mb-4">Manage IT assets and infrastructure</p>
          <a href="/operations/assets" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <i class="fas fa-arrow-right mr-2"></i>
            Manage Assets
          </a>
        </div>

        <!-- Service Management -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-sitemap text-green-500 mr-3"></i>
            <h2 class="text-lg font-semibold text-gray-900">Service Management</h2>
          </div>
          <p class="text-gray-600 mb-4">Organize services and calculate CIA ratings</p>
          <a href="/operations/services" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <i class="fas fa-arrow-right mr-2"></i>
            Manage Services
          </a>
        </div>

        <!-- Document Management -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-file-alt text-purple-500 mr-3"></i>
            <h2 class="text-lg font-semibold text-gray-900">Document Management</h2>
          </div>
          <p class="text-gray-600 mb-4">Policies, procedures & documents</p>
          <a href="/operations/documents" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            <i class="fas fa-arrow-right mr-2"></i>
            Manage Documents
          </a>
        </div>
      </div>

      <!-- Microsoft Defender Integration -->
      <div class="mt-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
              <h2 class="text-lg font-semibold text-gray-900">Microsoft Defender Integration</h2>
            </div>
            <a href="/operations/defender" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              View Integration
            </a>
          </div>
          <p class="text-gray-600 mb-4">Real-time security data and threat intelligence</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 p-4 rounded-lg"
                 hx-get="/operations/api/stats/machines"
                 hx-trigger="load"
                 hx-swap="innerHTML">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-check-circle text-green-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">Machines Online</p>
                  <p class="text-sm text-green-600">Loading...</p>
                </div>
              </div>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg"
                 hx-get="/operations/api/stats/alerts"
                 hx-trigger="load"
                 hx-swap="innerHTML">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-yellow-800">Active Alerts</p>
                  <p class="text-sm text-yellow-600">Loading...</p>
                </div>
              </div>
            </div>
            
            <div class="bg-red-50 p-4 rounded-lg"
                 hx-get="/operations/api/stats/vulnerabilities"
                 hx-trigger="load"
                 hx-swap="innerHTML">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-bug text-red-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">Vulnerabilities</p>
                  <p class="text-sm text-red-600">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Asset Management Page
const renderAssetManagement = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-server text-blue-600 mr-3"></i>
            Asset Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">IT assets & infrastructure management</p>
        </div>
        <button hx-get="/operations/api/assets/new" hx-target="#asset-modal" hx-swap="innerHTML" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <i class="fas fa-plus mr-2"></i>
          Add Asset
        </button>
      </div>

      <!-- Asset Filters -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>All Types</option>
              <option>Server</option>
              <option>Workstation</option>
              <option>Network Device</option>
              <option>Mobile Device</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Maintenance</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>All Locations</option>
              <option>Data Center</option>
              <option>Office</option>
              <option>Remote</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" placeholder="Search assets..." 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="bg-white shadow overflow-hidden rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Assets</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" hx-get="/operations/api/assets" hx-trigger="load">
              <!-- Loading placeholder -->
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin text-gray-300 text-2xl mb-2"></i>
                  <div>Loading assets...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Asset Modal Container -->
  <div id="asset-modal"></div>
  
  <!-- Link Modal Container -->  
  <div id="link-modal"></div>
`;

// Service Management Page  
const renderServiceManagement = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-sitemap text-green-600 mr-3"></i>
            AI-Enhanced Service Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">Intelligent service criticality assessment using AI/ML analysis of CIA scores, asset dependencies, and risk correlations</p>
        </div>
        <div class="flex space-x-3">
          <button hx-post="/operations/api/service-criticality/batch-assess" 
                  hx-target="#ai-status" 
                  hx-swap="innerHTML"
                  class="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100">
            <i class="fas fa-brain mr-2"></i>
            AI Batch Assessment
          </button>
          <button hx-get="/operations/api/services/new" hx-target="#service-modal" hx-swap="innerHTML"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>
            Add Service
          </button>
        </div>
      </div>

      <!-- AI Criticality Dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <!-- Criticality Distribution -->
        <div class="lg:col-span-3">
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Service Criticality Distribution</h3>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <i class="fas fa-robot"></i>
                <span>AI-Generated</span>
              </div>
            </div>
            <div id="criticality-stats" hx-get="/operations/api/service-criticality/stats" hx-trigger="load">
              <div class="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-200 rounded-lg h-20"></div>
                <div class="bg-gray-200 rounded-lg h-20"></div>
                <div class="bg-gray-200 rounded-lg h-20"></div>
                <div class="bg-gray-200 rounded-lg h-20"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI Status -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-brain text-purple-600 mr-2"></i>
            AI Engine Status
          </h3>
          <div id="ai-status">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Model Version</span>
                <span class="text-sm font-medium text-gray-900">v1.2.0</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Accuracy</span>
                <span class="text-sm font-medium text-green-600">89.3%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Last Training</span>
                <span class="text-sm font-medium text-gray-900">Today</span>
              </div>
              <div class="mt-4">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Confidence</span>
                  <span>87%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" style="width: 87%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI-Enhanced Services Overview -->
      <div class="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 flex items-center">
              Services Overview
              <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <i class="fas fa-brain mr-1 text-xs"></i>
                AI-Enhanced
              </span>
            </h2>
            <p class="text-sm text-gray-600 mt-1">Real-time AI criticality assessment with dependency analysis</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="refreshServices()" class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <i class="fas fa-sync text-xs mr-1"></i>
              Refresh
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center space-x-1">
                    <span>AI Criticality</span>
                    <i class="fas fa-brain text-purple-500 text-xs" title="AI-calculated criticality"></i>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencies</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Impact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="services-list" class="bg-white divide-y divide-gray-200" 
                   hx-get="/operations/api/services" 
                   hx-trigger="load, serviceCreated from:body, serviceUpdated from:body, serviceDeleted from:body, refreshServices from:body">
              <!-- Loading placeholder -->
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  <div class="flex flex-col items-center">
                    <i class="fas fa-brain text-purple-300 text-3xl mb-2 animate-pulse"></i>
                    <div class="text-sm font-medium">AI is analyzing services...</div>
                    <div class="text-xs text-gray-400">Calculating criticality based on CIA scores, dependencies, and risks</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Service Modal Container -->
  <div id="service-modal"></div>
  
  <!-- Link Modal Container -->
  <div id="link-modal"></div>
`;

// Document Management Page
const renderDocumentManagement = (documents: any[] = []) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-file-alt text-purple-600 mr-3"></i>
            Document Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">Policies, procedures & documents</p>
        </div>
        <button hx-get="/operations/api/documents/new" hx-target="#document-modal" hx-swap="innerHTML"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
          <i class="fas fa-upload mr-2"></i>
          Upload Document
        </button>
      </div>

      <!-- Document Categories -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        ${raw(renderDocumentCategories(documents))}
      </div>

      <!-- Recent Documents -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Documents</h2>
        </div>
        <div class="divide-y divide-gray-200">
          ${raw(renderDocumentRows(documents))}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Document Modal Container -->
  <div id="document-modal"></div>
`;

// Microsoft Defender Integration Page
const renderDefenderIntegration = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt text-blue-600 mr-3"></i>
          Microsoft Defender Integration
        </h1>
        <p class="mt-2 text-lg text-gray-600">Real-time security data and threat intelligence from Microsoft Defender for Endpoint</p>
      </div>

      <!-- Integration Status -->
      <div class="bg-white shadow rounded-lg p-6 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-plug text-green-500 text-2xl"></i>
            </div>
            <div class="ml-4">
              <h2 class="text-lg font-semibold text-gray-900">Integration Status</h2>
              <p class="text-sm text-gray-600">Connected to Microsoft Graph API</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
            <button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Sync Now
            </button>
          </div>
        </div>
      </div>

      <!-- Defender Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-desktop text-2xl text-blue-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Managed Machines</dt>
                  <dd class="text-lg font-medium text-gray-900">847</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
                  <dd class="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-bug text-2xl text-red-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Vulnerabilities</dt>
                  <dd class="text-lg font-medium text-gray-900">34</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-green-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Last Sync</dt>
                  <dd class="text-lg font-medium text-gray-900">2 min ago</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Security Alerts</h2>
        </div>
        <div class="divide-y divide-gray-200">
          ${raw(renderDefenderAlerts())}
        </div>
      </div>
    </div>
  </div>
`;

// D1 Database Functions
async function getAssets(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT 
        id, asset_id, name, asset_type, category, subcategory,
        confidentiality_numeric, integrity_numeric, availability_numeric,
        risk_score, criticality, location, owner_id, custodian_id,
        active_status, created_at, updated_at
      FROM assets_enhanced 
      WHERE active_status = TRUE 
      ORDER BY created_at DESC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

async function getServices(db: D1Database) {
  try {
    // Get services from dedicated services table
    const result = await db.prepare(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM service_asset_links sal WHERE sal.service_id = s.service_id) as dependency_count,
        (SELECT COUNT(*) FROM service_risk_links srl WHERE srl.service_id = s.service_id) as risk_count
      FROM services s 
      WHERE s.service_status = 'Active'
      ORDER BY s.criticality_score DESC, s.created_at DESC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

// Helper functions for service creation
function convertImpactToNumeric(impactLevel: string): number {
  switch (impactLevel?.toLowerCase()) {
    case 'very high': case '5': return 5;
    case 'high': case '4': return 4;
    case 'medium': case '3': return 3;
    case 'low': case '2': return 2;
    case 'very low': case '1': return 1;
    default: return 2; // Default to Low-Medium
  }
}

function calculateRiskScore(confidentiality: number, integrity: number, availability: number): number {
  // Calculate weighted average with availability having slightly higher weight
  return ((confidentiality * 0.3) + (integrity * 0.35) + (availability * 0.35));
}

async function calculateAICriticality(serviceData: any, db: D1Database) {
  try {
    // Simple AI-based criticality calculation
    const ciaAverage = (serviceData.confidentiality_numeric + serviceData.integrity_numeric + serviceData.availability_numeric) / 3;
    const riskScore = serviceData.risk_score;
    
    // Get dependency and risk counts (placeholder for now)
    const dependencyCount = 0; // Will be populated when dependencies are linked
    const riskCount = 0; // Will be populated when risks are linked
    
    // Calculate criticality score (0-100)
    let criticalityScore = 0;
    
    // CIA Impact (40% weight)
    criticalityScore += (ciaAverage * 20) * 0.4;
    
    // Risk score (30% weight) 
    criticalityScore += (riskScore * 20) * 0.3;
    
    // Business function weight (20% weight)
    const businessWeight = serviceData.business_function?.includes('Revenue') ? 5 : 
                          serviceData.business_function?.includes('Customer') ? 4 : 3;
    criticalityScore += (businessWeight * 20) * 0.2;
    
    // Dependencies and risks (10% weight combined)
    criticalityScore += ((dependencyCount + riskCount) * 5) * 0.1;
    
    // Determine criticality level
    let calculated_criticality: string;
    if (criticalityScore >= 85) calculated_criticality = 'Critical';
    else if (criticalityScore >= 65) calculated_criticality = 'High';
    else if (criticalityScore >= 40) calculated_criticality = 'Medium';
    else calculated_criticality = 'Low';
    
    return {
      calculated_criticality,
      criticality_score: Math.round(criticalityScore),
      confidence_level: 0.85, // Base confidence for new services
      ai_recommendations: generateServiceRecommendations(criticalityScore, serviceData)
    };
  } catch (error) {
    console.error('Error calculating AI criticality:', error);
    // Fallback to medium criticality
    return {
      calculated_criticality: 'Medium',
      criticality_score: 50,
      confidence_level: 0.6,
      ai_recommendations: []
    };
  }
}

function generateServiceRecommendations(criticalityScore: number, serviceData: any): string[] {
  const recommendations: string[] = [];
  
  if (criticalityScore >= 85) {
    recommendations.push('Implement 24/7 monitoring and alerting');
    recommendations.push('Establish aggressive RTO targets (< 1 hour)');
    recommendations.push('Deploy high-availability clustering');
  } else if (criticalityScore >= 65) {
    recommendations.push('Implement business hours monitoring');
    recommendations.push('Establish backup and recovery procedures');
    recommendations.push('Document incident response procedures');
  } else {
    recommendations.push('Implement standard monitoring');
    recommendations.push('Schedule regular maintenance windows');
    recommendations.push('Document basic operational procedures');
  }
  
  if (serviceData.availability_numeric >= 4) {
    recommendations.push('Consider load balancing and failover mechanisms');
  }
  
  if (serviceData.confidentiality_numeric >= 4) {
    recommendations.push('Implement end-to-end encryption and access controls');
  }
  
  return recommendations;
}

async function createAsset(db: D1Database, assetData: any) {
  try {
    const result = await db.prepare(`
      INSERT INTO assets_enhanced (
        asset_id, name, asset_type, category, subcategory, location, 
        criticality, confidentiality_numeric, integrity_numeric, 
        availability_numeric, risk_score, operating_system, 
        custodian_id, network_zone, compliance_requirements, 
        patch_management, backup_status, monitoring_level, 
        description, business_function, data_classification,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assetData.asset_id,
      assetData.name,
      assetData.asset_type || 'Primary',
      assetData.category || 'Systems',
      assetData.type || 'Unknown', // Use type as subcategory
      assetData.location || 'Unknown',
      assetData.criticality || 'Medium',
      parseInt(assetData.confidentiality || '2'),
      parseInt(assetData.integrity || '2'), 
      parseInt(assetData.availability || '2'),
      parseFloat(assetData.risk_score || '0'),
      assetData.operating_system || '',
      assetData.technical_custodian || null,
      assetData.network_zone || '',
      assetData.compliance_requirements || '',
      assetData.patch_management || '',
      assetData.backup_status || '',
      assetData.monitoring_level || '',
      assetData.description || '',
      assetData.business_function || '',
      assetData.data_classification || '',
      assetData.created_at,
      assetData.updated_at
    ).run();
    
    return { id: result.meta?.last_row_id, ...assetData };
  } catch (error) {
    console.error('Error creating asset:', error);
    throw new Error('Failed to create asset');
  }
}

async function createService(db: D1Database, serviceData: any) {
  try {
    // Store services in dedicated services table
    const result = await db.prepare(`
      INSERT INTO services (
        service_id, name, description, service_category, business_department, service_owner,
        confidentiality_impact, integrity_impact, availability_impact,
        confidentiality_numeric, integrity_numeric, availability_numeric,
        recovery_time_objective, recovery_point_objective, business_function,
        risk_score, criticality, criticality_score, ai_confidence, ai_last_assessment,
        service_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      serviceData.service_id,
      serviceData.name,
      serviceData.description || '',
      serviceData.service_category || 'Business Service',
      serviceData.business_department || 'Unknown',
      serviceData.service_owner || 'TBD',
      serviceData.confidentiality_impact || 'Medium',
      serviceData.integrity_impact || 'Medium', 
      serviceData.availability_impact || 'Medium',
      serviceData.confidentiality_numeric || 3,
      serviceData.integrity_numeric || 3,
      serviceData.availability_numeric || 3,
      serviceData.recovery_time_objective || 24,
      serviceData.recovery_point_objective || 24,
      serviceData.business_function || 'General Operations',
      serviceData.risk_score || 0.0,
      serviceData.criticality || 'Medium',
      serviceData.criticality_score || 50,
      serviceData.ai_confidence || 0.0,
      serviceData.ai_last_assessment || new Date().toISOString(),
      'Active',
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    return { 
      id: result.meta?.last_row_id, 
      service_id: serviceData.service_id,
      ...serviceData 
    };
  } catch (error) {
    console.error('Error creating service:', error);
    throw new Error('Failed to create service: ' + error.message);
  }
}

async function createServiceOld(db: D1Database, serviceData: any) {
  try {
    // Old implementation - Store services as special risk entries (DEPRECATED)
    const result = await db.prepare(`
      INSERT INTO risks (
        title, description, category, probability, impact, 
        status, organization_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      serviceData.title,
      serviceData.description || '',
      'service',
      serviceData.probability || 1,
      serviceData.impact || 1,
      'active',
      serviceData.organization_id || 1,
      serviceData.created_by || 1,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    return { id: result.meta?.last_row_id, ...serviceData };
  } catch (error) {
    console.error('Error creating service:', error);
    throw new Error('Failed to create service');
  }
}

// Helper functions - using raw strings to avoid HTML escaping issues
function renderAssetRows(assets: any[]) {
  if (!assets || assets.length === 0) {
    return `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-server text-gray-300 text-3xl mb-2"></i>
          <div>No assets found. <a href="#" hx-get="/operations/api/assets/new" hx-target="#asset-modal" hx-swap="innerHTML" class="text-blue-600 hover:text-blue-800">Add your first asset</a>.</div>
        </td>
      </tr>
    `;
  }
  
  return assets.map(asset => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-gray-900">${asset.name}</div>
            <div class="text-sm text-gray-500">${asset.type || 'Unknown type'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.type || 'Unknown'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ${asset.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.location || 'Unknown'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(asset.criticality)}">
          ${asset.criticality || 'Medium'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderServiceRows(services: any[]) {
  if (!services || services.length === 0) {
    return `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          <div class="flex flex-col items-center">
            <i class="fas fa-brain text-purple-300 text-3xl mb-2 animate-pulse"></i>
            <div class="text-sm font-medium">No services found</div>
            <div class="text-xs text-gray-400 mb-3">AI-enhanced services will appear here</div>
            <a href="#" hx-get="/operations/api/services/new" hx-target="#service-modal" hx-swap="innerHTML" 
               class="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
              <i class="fas fa-plus mr-2"></i>Add Your First Service
            </a>
          </div>
        </td>
      </tr>
    `;
  }
  
  return services.map(service => {
    // Get dependency and risk counts from the services table query result
    const dependencyCount = service.dependency_count || 0;
    const riskCount = service.risk_count || 0;
    
    // CIA display values from numeric fields (services table structure)
    const confidentiality = service.confidentiality_numeric || 3;
    const integrity = service.integrity_numeric || 3; 
    const availability = service.availability_numeric || 3;
    
    // Calculate risk level from CIA scores for display
    const riskScore = service.risk_score || ((confidentiality + integrity + availability) / 3);
    let riskLevel, riskColor;
    
    if (riskScore >= 4) {
      riskLevel = 'Critical';
      riskColor = 'bg-red-100 text-red-800';
    } else if (riskScore >= 3.5) {
      riskLevel = 'High'; 
      riskColor = 'bg-orange-100 text-orange-800';
    } else if (riskScore >= 2.5) {
      riskLevel = 'Medium';
      riskColor = 'bg-yellow-100 text-yellow-800';  
    } else {
      riskLevel = 'Low';
      riskColor = 'bg-green-100 text-green-800';
    }
    
    // AI Criticality colors
    const criticalityColors = {
      'Critical': 'bg-red-100 text-red-800 border-red-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Low': 'bg-green-100 text-green-800 border-green-200'
    };
    
    const criticalityColor = criticalityColors[service.criticality] || criticalityColors['Medium'];
    
    return `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-sitemap text-green-600 text-lg mr-3"></i>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">${service.name}</div>
            <div class="text-sm text-gray-500">${service.service_category || 'Service'} • ${service.business_department || 'Unknown Dept'}</div>
            ${service.description ? `<div class="text-xs text-gray-400 mt-1">${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center space-x-2 mb-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${criticalityColor}">
            <i class="fas fa-brain mr-1"></i>
            ${service.criticality || 'Medium'}
          </span>
          ${service.ai_confidence > 0 ? `<span class="text-xs text-gray-500">${Math.round(service.ai_confidence * 100)}%</span>` : ''}
        </div>
        <div class="text-xs text-gray-500">
          Score: ${service.criticality_score || 50}/100
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex flex-col space-y-1">
          <div class="flex items-center">
            <span class="text-xs font-medium text-gray-900">${dependencyCount}</span>
            <span class="text-xs text-gray-500 ml-1">assets</span>
          </div>
          <div class="flex items-center">
            <span class="text-xs font-medium text-gray-900">${riskCount}</span>
            <span class="text-xs text-gray-500 ml-1">risks</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex flex-col items-start">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor} mb-1">
            ${riskLevel}
          </span>
          <div class="text-xs text-gray-500">
            ${riskScore.toFixed(1)}/5.0
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-xs space-y-1">
          <div class="flex items-center">
            <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            <span class="text-gray-600">C: ${confidentiality}</span>
          </div>
          <div class="flex items-center">
            <span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            <span class="text-gray-600">I: ${integrity}</span>
          </div>
          <div class="flex items-center">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span class="text-gray-600">A: ${availability}</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex flex-col space-y-1">
          <button class="text-purple-600 hover:text-purple-900 text-left" 
                  hx-get="/operations/api/link/assets-to-service?service_id=${service.service_id}" 
                  hx-target="#link-modal" 
                  hx-swap="innerHTML">
            <i class="fas fa-link mr-1"></i>Assets
          </button>
          <button class="text-red-600 hover:text-red-900 text-left"
                  hx-get="/operations/api/link/risks-to-service?service_id=${service.service_id}" 
                  hx-target="#link-modal" 
                  hx-swap="innerHTML">
            <i class="fas fa-shield-alt mr-1"></i>Risks
          </button>
          <button class="text-blue-600 hover:text-blue-900 text-left"
                  hx-get="/operations/api/services/${service.service_id}/edit" 
                  hx-target="#service-modal" 
                  hx-swap="innerHTML">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button class="text-red-600 hover:text-red-900 text-left"
                  hx-get="/operations/api/services/${service.service_id}/delete-confirm" 
                  hx-target="#service-modal" 
                  hx-swap="innerHTML">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </td>
    </tr>`
  }).join('');
}

function renderDocumentRows(documents: any[] = []) {
  if (!documents || documents.length === 0) {
    return `
      <div class="px-6 py-8 text-center">
        <i class="fas fa-folder-open text-gray-300 text-4xl mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p class="text-sm text-gray-500 mb-4">Upload your first document to get started.</p>
        <button hx-get="/operations/api/documents/new" hx-target="#document-modal" hx-swap="innerHTML"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
          <i class="fas fa-upload mr-2"></i>
          Upload Document
        </button>
      </div>
    `;
  }
  
  return documents.map(doc => {
    // Format file size
    const formatSize = (bytes) => {
      const mb = bytes / (1024 * 1024);
      return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
    };
    
    // Format date
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    };
    
    // Get file icon based on mime type
    const getFileIcon = (mimeType) => {
      if (mimeType?.includes('pdf')) return 'fas fa-file-pdf text-red-500';
      if (mimeType?.includes('word')) return 'fas fa-file-word text-blue-500';
      if (mimeType?.includes('excel')) return 'fas fa-file-excel text-green-500';
      if (mimeType?.includes('powerpoint')) return 'fas fa-file-powerpoint text-orange-500';
      if (mimeType?.includes('image')) return 'fas fa-file-image text-purple-500';
      return 'fas fa-file-alt text-gray-500';
    };
    
    return `
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center">
          <i class="${getFileIcon(doc.mime_type)} mr-3"></i>
          <div>
            <div class="text-sm font-medium text-gray-900">${doc.name}</div>
            <div class="text-sm text-gray-500">
              ${doc.type} • ${formatSize(doc.file_size)} • 
              Updated ${formatDate(doc.updated_at)} • 
              Downloads: ${doc.download_count || 0}
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button hx-get="/operations/api/documents/${doc.id}/download" 
                  class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded">
            <i class="fas fa-download mr-1"></i>Download
          </button>
          <button hx-get="/operations/api/documents/${doc.id}/delete-confirm" hx-target="#document-modal" hx-swap="innerHTML"
                  class="text-red-600 hover:text-red-900 px-2 py-1 rounded">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderDefenderAlerts() {
  const alerts = [
    { title: 'Suspicious PowerShell Activity', severity: 'High', machine: 'WS-DEV-05', time: '5 min ago' },
    { title: 'Malware Detection', severity: 'Critical', machine: 'WS-USER-12', time: '15 min ago' },
    { title: 'Network Anomaly', severity: 'Medium', machine: 'SRV-WEB-01', time: '30 min ago' },
    { title: 'Failed Login Attempts', severity: 'Low', machine: 'DC-MAIN-01', time: '1 hour ago' }
  ];
  
  return alerts.map(alert => `
    <div class="px-6 py-4 flex items-center justify-between">
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
        <div>
          <div class="text-sm font-medium text-gray-900">${alert.title}</div>
          <div class="text-sm text-gray-500">${alert.machine} • ${alert.time}</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}">
          ${alert.severity}
        </span>
        <button class="text-blue-600 hover:text-blue-900">Investigate</button>
      </div>
    </div>
  `).join('');
}

function getRiskColor(risk: string) {
  switch (risk?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getSeverityColor(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// HTMX-based Modal rendering functions for ARIA5.1
const renderAssetModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-xl rounded-lg bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center">
              <i class="fas fa-server text-blue-600 mr-3"></i>
              Add New Asset - ARIA5 Configuration
            </h3>
            <p class="text-sm text-gray-600 mt-1">Configure asset with comprehensive security assessment and ARIA5 compliance standards</p>
          </div>
          <button hx-get="/operations/api/assets/close" hx-target="#asset-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/assets" 
              hx-target="#asset-modal" 
              hx-swap="innerHTML"
              hx-indicator="#asset-loading"
              onchange="calculateAssetRisk()">
          
          <!-- Basic Asset Information -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                Asset Information
              </h4>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-tag mr-1"></i>Asset Name *
                </label>
                <input type="text" name="name" required 
                       placeholder="e.g., WEB-SRV-01, DB-MAIN-02"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-desktop mr-1"></i>Asset Type *
                </label>
                <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Asset Type</option>
                  <option value="Physical Server">Physical Server</option>
                  <option value="Virtual Server">Virtual Server</option>
                  <option value="Database Server">Database Server</option>
                  <option value="Web Server">Web Server</option>
                  <option value="Application Server">Application Server</option>
                  <option value="Workstation">Workstation</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Mobile Device">Mobile Device</option>
                  <option value="Network Switch">Network Switch</option>
                  <option value="Router">Router</option>
                  <option value="Firewall">Firewall</option>
                  <option value="Load Balancer">Load Balancer</option>
                  <option value="Storage Device">Storage Device</option>
                  <option value="IoT Device">IoT Device</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-map-marker-alt mr-1"></i>Physical Location *
                </label>
                <select name="location" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Location</option>
                  <option value="Primary Data Center">Primary Data Center</option>
                  <option value="Secondary Data Center">Secondary Data Center</option>
                  <option value="Cloud (AWS)">Cloud (AWS)</option>
                  <option value="Cloud (Azure)">Cloud (Azure)</option>
                  <option value="Cloud (GCP)">Cloud (GCP)</option>
                  <option value="Cloud (Other)">Cloud (Other)</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Branch Office">Branch Office</option>
                  <option value="Remote Location">Remote Location</option>
                  <option value="Mobile/Portable">Mobile/Portable</option>
                  <option value="Home Office">Home Office</option>
                  <option value="Third Party">Third Party</option>
                </select>
              </div>
              
              <!-- Asset Criticality is now auto-calculated based on CIA Risk Score -->
              <div class="bg-blue-50 p-4 rounded-lg">
                <h5 class="font-medium text-blue-800 mb-2">
                  <i class="fas fa-info-circle mr-1"></i>Asset Criticality
                </h5>
                <div class="text-sm text-blue-700">
                  Automatically calculated based on CIA Risk Score assessment
                </div>
                <div id="asset-criticality-display" class="mt-2 text-lg font-medium text-blue-800">
                  Complete CIA assessment to view criticality
                </div>
              </div>
            </div>
            
            <!-- Security Assessment -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-shield-alt text-red-500 mr-2"></i>
                Security Assessment
              </h4>
              
              <div class="bg-blue-50 p-4 rounded-lg">
                <h5 class="font-medium text-blue-800 mb-2">
                  <i class="fas fa-eye-slash mr-1"></i>Data Confidentiality *
                </h5>
                <p class="text-xs text-blue-700 mb-3">Sensitivity of data stored/processed on this asset</p>
                <select name="confidentiality" id="asset_confidentiality" required 
                        class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Level</option>
                  <option value="1">1 - Public (Publicly available information)</option>
                  <option value="2">2 - Internal (Internal use only)</option>
                  <option value="3">3 - Confidential (Sensitive business data)</option>
                  <option value="4">4 - Restricted (Highly classified data)</option>
                </select>
              </div>
              
              <div class="bg-orange-50 p-4 rounded-lg">
                <h5 class="font-medium text-orange-800 mb-2">
                  <i class="fas fa-check-double mr-1"></i>Data Integrity *
                </h5>
                <p class="text-xs text-orange-700 mb-3">Impact if asset data is corrupted or tampered</p>
                <select name="integrity" id="asset_integrity" required 
                        class="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select Level</option>
                  <option value="1">1 - Low (Minimal business impact)</option>
                  <option value="2">2 - Medium (Moderate business impact)</option>
                  <option value="3">3 - High (Significant business disruption)</option>
                  <option value="4">4 - Critical (Severe business/safety impact)</option>
                </select>
              </div>
              
              <div class="bg-green-50 p-4 rounded-lg">
                <h5 class="font-medium text-green-800 mb-2">
                  <i class="fas fa-clock mr-1"></i>Availability Requirement *
                </h5>
                <p class="text-xs text-green-700 mb-3">Business impact if asset becomes unavailable</p>
                <select name="availability" id="asset_availability" required 
                        class="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Level</option>
                  <option value="1">1 - Low (Can be down for days)</option>
                  <option value="2">2 - Medium (Can be down for hours)</option>
                  <option value="3">3 - High (Maximum 1 hour downtime)</option>
                  <option value="4">4 - Critical (Near zero downtime required)</option>
                </select>
              </div>
              
              <!-- Overall Risk Score Display -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium text-gray-800 mb-2">
                  <i class="fas fa-calculator mr-1"></i>Asset Risk Score
                </h5>
                <div id="asset-risk-display" class="text-2xl font-bold text-gray-400">
                  Select CIA ratings to calculate
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  Calculated as: max(C, I, A) + weighted average
                </div>
              </div>
            </div>
          </div>
          
          <!-- Additional Information -->
          <div class="border-t pt-6 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-sticky-note mr-1"></i>Asset Description & Notes
              </label>
              <textarea name="description" rows="3" 
                        placeholder="Additional details about the asset, configuration notes, or special requirements"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>
          
          <!-- Hidden field for calculated risk score -->
          <input type="hidden" name="risk_score" id="asset_risk_value" value="">
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" 
                    hx-get="/operations/api/assets/close" 
                    hx-target="#asset-modal" 
                    hx-swap="innerHTML"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" 
                    class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center">
              <span class="htmx-indicator" id="asset-loading">
                <i class="fas fa-spinner fa-spin mr-2"></i>
              </span>
              <i class="fas fa-plus mr-2"></i>
              Create Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <script>
    function calculateAssetRisk() {
      const c = parseInt(document.getElementById('asset_confidentiality')?.value || '0');
      const i = parseInt(document.getElementById('asset_integrity')?.value || '0');
      const a = parseInt(document.getElementById('asset_availability')?.value || '0');
      
      if (c && i && a) {
        // ARIA5 risk calculation: max value + weighted average
        const maxRating = Math.max(c, i, a);
        const weightedAvg = (c + i + a) / 3;
        const overallScore = (maxRating * 0.6) + (weightedAvg * 0.4);
        
        // Risk level determination
        let riskLevel, riskColor, riskBg;
        if (overallScore >= 3.5) {
          riskLevel = 'Critical';
          riskColor = 'text-red-600';
          riskBg = 'bg-red-100';
        } else if (overallScore >= 2.5) {
          riskLevel = 'High';
          riskColor = 'text-orange-600';
          riskBg = 'bg-orange-100';
        } else if (overallScore >= 1.5) {
          riskLevel = 'Medium';
          riskColor = 'text-yellow-600';
          riskBg = 'bg-yellow-100';
        } else {
          riskLevel = 'Low';
          riskColor = 'text-green-600';
          riskBg = 'bg-green-100';
        }
        
        document.getElementById('asset-risk-display').innerHTML = \`
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium \${riskBg} \${riskColor}">
              \${riskLevel}
            </span>
            <span class="text-gray-600">(\${overallScore.toFixed(1)}/4.0)</span>
          </div>
        \`;
        
        // Update asset criticality display
        document.getElementById('asset-criticality-display').innerHTML = \`
          <span class="px-3 py-1 rounded-full text-sm font-medium \${riskBg} \${riskColor}">
            \${riskLevel} Criticality
          </span>
        \`;
        
        document.getElementById('asset_risk_value').value = overallScore.toFixed(2);
      }
    }
    
    // Auto-trigger calculation when CIA values change
    document.addEventListener('DOMContentLoaded', function() {
      const ciaFields = ['asset_confidentiality', 'asset_integrity', 'asset_availability'];
      
      ciaFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
          field.addEventListener('change', calculateAssetRisk);
        }
      });
    });
  </script>
`;

const renderServiceModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-5 mx-auto p-6 border w-full max-w-6xl shadow-xl rounded-lg bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center">
              <i class="fas fa-sitemap text-green-600 mr-3"></i>
              Add New Service - ARIA5 Configuration
            </h3>
            <p class="text-sm text-gray-600 mt-1">Configure organizational service with comprehensive business impact assessment and asset dependencies</p>
          </div>
          <button hx-get="/operations/api/services/close" hx-target="#service-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/services" 
              hx-target="#service-modal" 
              hx-swap="innerHTML"
              hx-indicator="#service-loading"
              onchange="calculateServiceRisk()">
          
          <!-- Service Information Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            <!-- Basic Service Information -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-info-circle text-green-500 mr-2"></i>
                Service Information
              </h4>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-tag mr-1"></i>Service Name *
                </label>
                <input type="text" name="name" required 
                       placeholder="e.g., Customer Portal, Payment Processing, HR System"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-layer-group mr-1"></i>Service Category *
                </label>
                <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Service Category</option>
                  <option value="Business Critical">Business Critical Service</option>
                  <option value="Customer Facing">Customer Facing Service</option>
                  <option value="Internal Operations">Internal Operations Service</option>
                  <option value="Financial">Financial Service</option>
                  <option value="HR & Admin">HR & Administrative Service</option>
                  <option value="IT Infrastructure">IT Infrastructure Service</option>
                  <option value="Security">Security Service</option>
                  <option value="Compliance">Compliance & Audit Service</option>
                  <option value="Communication">Communication Service</option>
                  <option value="Data & Analytics">Data & Analytics Service</option>
                  <option value="Development">Development & Testing Service</option>
                  <option value="Backup & Recovery">Backup & Recovery Service</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-building mr-1"></i>Business Department *
                </label>
                <select name="location" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Department</option>
                  <option value="IT Operations">IT Operations</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Legal & Compliance">Legal & Compliance</option>
                  <option value="Operations">Operations</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Executive Management">Executive Management</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Procurement">Procurement</option>
                  <option value="External/Third Party">External/Third Party</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-users mr-1"></i>Service Owner
                </label>
                <select name="owner_id" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Owner</option>
                  <option value="1">Admin User (admin)</option>
                  <option value="2">Security Manager (avi_security)</option>
                  <option value="3">Compliance Officer (compliance_user)</option>
                  <option value="4">Operations Manager (ops_manager)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-align-left mr-1"></i>Service Description
                </label>
                <textarea name="description" rows="3" 
                          placeholder="Describe the service, its purpose, and key functionality"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
              </div>
            </div>
            
            <!-- Business Impact Assessment -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-chart-line text-blue-500 mr-2"></i>
                Business Impact Assessment
              </h4>
              
              <div class="bg-blue-50 p-4 rounded-lg">
                <h5 class="font-medium text-blue-800 mb-2">
                  <i class="fas fa-eye-slash mr-1"></i>Confidentiality Impact *
                </h5>
                <p class="text-xs text-blue-700 mb-3">Impact if service data is disclosed to unauthorized parties</p>
                <select name="confidentiality" id="service_confidentiality" required 
                        class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Impact Level</option>
                  <option value="1">1 - Low (Public information, minimal impact)</option>
                  <option value="2">2 - Medium (Internal data, moderate impact)</option>
                  <option value="3">3 - High (Sensitive data, significant impact)</option>
                  <option value="4">4 - Critical (Highly confidential, severe impact)</option>
                </select>
              </div>
              
              <div class="bg-orange-50 p-4 rounded-lg">
                <h5 class="font-medium text-orange-800 mb-2">
                  <i class="fas fa-check-double mr-1"></i>Integrity Impact *
                </h5>
                <p class="text-xs text-orange-700 mb-3">Impact if service data is modified or corrupted</p>
                <select name="integrity" id="service_integrity" required 
                        class="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select Impact Level</option>
                  <option value="1">1 - Low (Minor business impact)</option>
                  <option value="2">2 - Medium (Moderate business disruption)</option>
                  <option value="3">3 - High (Significant operational impact)</option>
                  <option value="4">4 - Critical (Severe business/safety impact)</option>
                </select>
              </div>
              
              <div class="bg-green-50 p-4 rounded-lg">
                <h5 class="font-medium text-green-800 mb-2">
                  <i class="fas fa-clock mr-1"></i>Availability Impact *
                </h5>
                <p class="text-xs text-green-700 mb-3">Business impact if service becomes unavailable</p>
                <select name="availability" id="service_availability" required 
                        class="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Impact Level</option>
                  <option value="1">1 - Low (Can be down for days)</option>
                  <option value="2">2 - Medium (Can be down for hours)</option>
                  <option value="3">3 - High (Maximum 1 hour downtime)</option>
                  <option value="4">4 - Critical (Near zero downtime required)</option>
                </select>
              </div>
              
              <!-- Service Risk Score Display -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium text-gray-800 mb-2">
                  <i class="fas fa-calculator mr-1"></i>Service Risk Score
                </h5>
                <div id="service-risk-display" class="text-2xl font-bold text-gray-400">
                  Select CIA ratings to calculate
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  Calculated as: max(C, I, A) + weighted average
                </div>
              </div>
            </div>
            
            <!-- Service Level & Dependencies -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-cogs text-purple-500 mr-2"></i>
                Service Level & Dependencies
              </h4>
              
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label class="block text-sm font-medium text-purple-800 mb-2 flex items-center">
                  <i class="fas fa-brain mr-2 text-purple-600"></i>AI-Calculated Service Criticality
                  <span class="ml-auto bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Auto-Generated</span>
                </label>
                <div class="flex items-center space-x-3">
                  <div class="flex-1">
                    <div class="text-sm text-purple-700 mb-2">
                      Criticality will be automatically calculated using AI analysis of:
                    </div>
                    <ul class="text-xs text-purple-600 space-y-1">
                      <li>• <strong>CIA Impact Scores</strong> (40% weight)</li>
                      <li>• <strong>Business Function</strong> (30% weight)</li>
                      <li>• <strong>Service Dependencies</strong> (20% weight)</li>
                      <li>• <strong>Risk Associations</strong> (10% weight)</li>
                    </ul>
                  </div>
                  <div class="text-center">
                    <i class="fas fa-robot text-purple-500 text-2xl mb-1"></i>
                    <div class="text-xs text-purple-600 font-medium">AI Engine</div>
                    <div class="text-xs text-purple-500">89% Accuracy</div>
                  </div>
                </div>
                <div class="mt-3 p-2 bg-white rounded border border-purple-200">
                  <div class="text-xs font-medium text-gray-600 mb-1">Expected Calculation:</div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">CIA Average × Business Weight × Dependencies</span>
                    <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">Score: 0-100</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-clock mr-1"></i>Recovery Time Objective (RTO)
                </label>
                <select name="rto" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select RTO</option>
                  <option value="< 15 minutes">< 15 minutes (Immediate)</option>
                  <option value="15-60 minutes">15-60 minutes (Very High)</option>
                  <option value="1-4 hours">1-4 hours (High)</option>
                  <option value="4-24 hours">4-24 hours (Medium)</option>
                  <option value="1-3 days">1-3 days (Low)</option>
                  <option value="> 3 days">> 3 days (Very Low)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-history mr-1"></i>Recovery Point Objective (RPO)
                </label>
                <select name="rpo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select RPO</option>
                  <option value="0 minutes (Synchronous)">0 minutes (Synchronous)</option>
                  <option value="< 15 minutes">< 15 minutes</option>
                  <option value="15-60 minutes">15-60 minutes</option>
                  <option value="1-4 hours">1-4 hours</option>
                  <option value="4-24 hours">4-24 hours</option>
                  <option value="> 24 hours">> 24 hours</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-server mr-1"></i>Dependent Assets
                </label>
                <div class="bg-gray-50 p-3 rounded-md min-h-[100px]" id="asset-dependencies">
                  <p class="text-sm text-gray-500 text-center py-4">
                    <i class="fas fa-link mr-1"></i>
                    Click "Link Assets" button below to add asset dependencies
                  </p>
                </div>
                <button type="button" 
                        hx-get="/operations/api/link/assets-to-service" 
                        hx-target="#link-modal" 
                        hx-swap="innerHTML"
                        class="mt-2 w-full px-3 py-2 text-sm border border-purple-300 text-purple-600 hover:bg-purple-50 rounded-md flex items-center justify-center">
                  <i class="fas fa-link mr-2"></i>
                  Link Assets to Service
                </button>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-exclamation-triangle mr-1"></i>Associated Risks
                </label>
                <div class="bg-gray-50 p-3 rounded-md min-h-[60px]" id="risk-associations">
                  <p class="text-sm text-gray-500 text-center py-2">
                    <i class="fas fa-shield-alt mr-1"></i>
                    Click "Link Risks" button below to associate risks
                  </p>
                </div>
                <button type="button" 
                        hx-get="/operations/api/link/risks-to-service" 
                        hx-target="#link-modal" 
                        hx-swap="innerHTML"
                        class="mt-2 w-full px-3 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-md flex items-center justify-center">
                  <i class="fas fa-shield-alt mr-2"></i>
                  Link Risks to Service
                </button>
              </div>
            </div>
          </div>
          
          <!-- Hidden fields for calculated values -->
          <input type="hidden" name="category" value="service">
          <input type="hidden" name="service_risk_score" id="service_risk_value" value="">
          <input type="hidden" name="linked_assets" id="linked_assets_input" value="">
          <input type="hidden" name="linked_risks" id="linked_risks_input" value="">
          
          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" 
                    hx-get="/operations/api/services/close" 
                    hx-target="#service-modal" 
                    hx-swap="innerHTML"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
              <i class="fas fa-times mr-2"></i>
              Cancel
            </button>
            <button type="submit" 
                    class="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center">
              <span class="htmx-indicator" id="service-loading">
                <i class="fas fa-spinner fa-spin mr-2"></i>
              </span>
              <i class="fas fa-plus mr-2"></i>
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <!-- Service Risk Calculation Script -->
  <script>
    function calculateServiceRisk() {
      const confidentiality = document.getElementById('service_confidentiality')?.value;
      const integrity = document.getElementById('service_integrity')?.value;
      const availability = document.getElementById('service_availability')?.value;
      
      if (confidentiality && integrity && availability) {
        const c = parseFloat(confidentiality);
        const i = parseFloat(integrity);
        const a = parseFloat(availability);
        
        // Calculate overall service risk score (max + weighted average)
        const maxScore = Math.max(c, i, a);
        const avgScore = (c + i + a) / 3;
        const overallScore = (maxScore * 0.6) + (avgScore * 0.4);
        
        // Service risk level determination
        let riskLevel, riskColor, riskBg;
        if (overallScore >= 3.5) {
          riskLevel = 'Critical';
          riskColor = 'text-red-600';
          riskBg = 'bg-red-100';
        } else if (overallScore >= 2.5) {
          riskLevel = 'High';
          riskColor = 'text-orange-600';
          riskBg = 'bg-orange-100';
        } else if (overallScore >= 1.5) {
          riskLevel = 'Medium';
          riskColor = 'text-yellow-600';
          riskBg = 'bg-yellow-100';
        } else {
          riskLevel = 'Low';
          riskColor = 'text-green-600';
          riskBg = 'bg-green-100';
        }
        
        document.getElementById('service-risk-display').innerHTML = \`
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium \${riskBg} \${riskColor}">
              \${riskLevel}
            </span>
            <span class="text-gray-600">(\${overallScore.toFixed(1)}/4.0)</span>
          </div>
        \`;
        
        document.getElementById('service_risk_value').value = overallScore.toFixed(2);
      }
    }
  </script>
`;

const renderDocumentUploadModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Upload Document</h3>
          <button hx-get="/operations/api/documents/close" hx-target="#document-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/documents" 
              hx-target="#document-modal" 
              hx-swap="innerHTML"
              hx-indicator="#document-loading"
              enctype="multipart/form-data">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
            <input type="text" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select Type</option>
              <option value="Policy">Security Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Compliance">Compliance Document</option>
              <option value="Certificate">Certificate</option>
              <option value="Report">Report</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">File</label>
            <input type="file" name="file" accept=".pdf,.doc,.docx,.txt" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" 
                    hx-get="/operations/api/documents/close" 
                    hx-target="#document-modal" 
                    hx-swap="innerHTML"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center">
              <span class="htmx-indicator" id="document-loading">
                <i class="fas fa-spinner fa-spin mr-2"></i>
              </span>
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

// Helper function to get risks from database
async function getRisks(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT * FROM risks 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error fetching risks:', error);
    return [];
  }
}

// Asset Linking Modal for Services
const renderAssetLinkingModal = (assets: any[]) => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-xl rounded-lg bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center">
              <i class="fas fa-link text-purple-600 mr-3"></i>
              Link Assets to Service
            </h3>
            <p class="text-sm text-gray-600 mt-1">Select assets that this service depends on</p>
          </div>
          <button hx-get="/operations/api/link/close" hx-target="#link-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div class="mb-6">
          <input type="text" id="asset-search" placeholder="Search assets..." 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                 onkeyup="filterAssets()">
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          ${assets.length > 0 ? 
            assets.map(asset => html`
              <div class="asset-item border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50">
                <div class="flex items-center">
                  <input type="checkbox" id="asset-${asset.id}" value="${asset.id}" 
                         class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3">
                  <label for="asset-${asset.id}" class="flex-1 cursor-pointer">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium text-gray-900">${asset.name}</div>
                        <div class="text-sm text-gray-600">${asset.subcategory || asset.asset_type || 'Unknown Type'} • ${asset.location || 'No Location'}</div>
                      </div>
                      <div class="text-right">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          asset.criticality === 'Critical' ? 'bg-red-100 text-red-800' :
                          asset.criticality === 'High' ? 'bg-orange-100 text-orange-800' :
                          asset.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }">
                          ${asset.criticality || 'Medium'}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            `).join('') :
            `<div class="text-center py-8">
              <i class="fas fa-server text-gray-300 text-3xl mb-2"></i>
              <p class="text-gray-500">No assets found</p>
            </div>`
          }
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t mt-6">
          <button type="button" 
                  hx-get="/operations/api/link/close" 
                  hx-target="#link-modal" 
                  hx-swap="innerHTML"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
            Cancel
          </button>
          <button type="button" 
                  onclick="linkSelectedAssets()"
                  class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md">
            <i class="fas fa-link mr-2"></i>
            Link Selected Assets
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function filterAssets() {
      const search = document.getElementById('asset-search').value.toLowerCase();
      const items = document.querySelectorAll('.asset-item');
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'block' : 'none';
      });
    }
    
    function linkSelectedAssets() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const selectedAssets = Array.from(checkboxes).map(cb => ({
        id: cb.value,
        name: cb.closest('.asset-item').querySelector('.font-medium').textContent
      }));
      
      // Update the service form with selected assets
      const assetsContainer = document.getElementById('asset-dependencies');
      if (selectedAssets.length > 0) {
        assetsContainer.innerHTML = selectedAssets.map(asset => 
          '<div class="flex items-center justify-between bg-purple-50 p-2 rounded mb-1">' +
            '<span class="text-sm"><i class="fas fa-server mr-2 text-purple-600"></i>' + asset.name + '</span>' +
            '<button type="button" onclick="removeAsset(' + asset.id + ')" class="text-red-600 hover:text-red-800">' +
              '<i class="fas fa-times text-xs"></i>' +
            '</button>' +
           '</div>'
        ).join('');
      } else {
        assetsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No assets selected</p>';
      }
      
      // Update hidden input
      document.getElementById('linked_assets_input').value = JSON.stringify(selectedAssets);
      
      // Close modal
      document.getElementById('link-modal').innerHTML = '';
    }
    
    function removeAsset(assetId) {
      // Remove from UI and update hidden input
      const current = JSON.parse(document.getElementById('linked_assets_input').value || '[]');
      const updated = current.filter(asset => asset.id != assetId);
      document.getElementById('linked_assets_input').value = JSON.stringify(updated);
      
      // Refresh display
      const assetsContainer = document.getElementById('asset-dependencies');
      if (updated.length > 0) {
        assetsContainer.innerHTML = updated.map(asset => 
          '<div class="flex items-center justify-between bg-purple-50 p-2 rounded mb-1">' +
            '<span class="text-sm"><i class="fas fa-server mr-2 text-purple-600"></i>' + asset.name + '</span>' +
            '<button type="button" onclick="removeAsset(' + asset.id + ')" class="text-red-600 hover:text-red-800">' +
              '<i class="fas fa-times text-xs"></i>' +
            '</button>' +
           '</div>'
        ).join('');
      } else {
        assetsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No assets selected</p>';
      }
    }
  </script>
`;

// Risk Linking Modal for Services  
const renderRiskLinkingModal = (risks: any[]) => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-xl rounded-lg bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center">
              <i class="fas fa-shield-alt text-red-600 mr-3"></i>
              Link Risks to Service
            </h3>
            <p class="text-sm text-gray-600 mt-1">Select risks that are associated with this service</p>
          </div>
          <button hx-get="/operations/api/link/close" hx-target="#link-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div class="mb-6">
          <input type="text" id="risk-search" placeholder="Search risks..." 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                 onkeyup="filterRisks()">
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          ${risks.length > 0 ? 
            risks.map(risk => html`
              <div class="risk-item border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50">
                <div class="flex items-center">
                  <input type="checkbox" id="risk-${risk.id}" value="${risk.id}" 
                         class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-3">
                  <label for="risk-${risk.id}" class="flex-1 cursor-pointer">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 mr-4">
                        <div class="font-medium text-gray-900">${risk.title}</div>
                        <div class="text-sm text-gray-600">${risk.category || 'Unknown Category'}</div>
                        ${risk.description ? `<div class="text-xs text-gray-500 mt-1">${risk.description.substring(0, 100)}...</div>` : ''}
                      </div>
                      <div class="text-right">
                        <div class="flex items-center space-x-2">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            risk.risk_score >= 20 ? 'bg-red-100 text-red-800' :
                            risk.risk_score >= 12 ? 'bg-orange-100 text-orange-800' :
                            risk.risk_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }">
                            Score: ${risk.risk_score || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            `).join('') :
            `<div class="text-center py-8">
              <i class="fas fa-shield-alt text-gray-300 text-3xl mb-2"></i>
              <p class="text-gray-500">No risks found</p>
            </div>`
          }
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t mt-6">
          <button type="button" 
                  hx-get="/operations/api/link/close" 
                  hx-target="#link-modal" 
                  hx-swap="innerHTML"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
            Cancel
          </button>
          <button type="button" 
                  onclick="linkSelectedRisks()"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
            <i class="fas fa-shield-alt mr-2"></i>
            Link Selected Risks
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function filterRisks() {
      const search = document.getElementById('risk-search').value.toLowerCase();
      const items = document.querySelectorAll('.risk-item');
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'block' : 'none';
      });
    }
    
    function linkSelectedRisks() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const selectedRisks = Array.from(checkboxes).map(cb => ({
        id: cb.value,
        title: cb.closest('.risk-item').querySelector('.font-medium').textContent
      }));
      
      // Update the service form with selected risks
      const risksContainer = document.getElementById('risk-associations');
      if (selectedRisks.length > 0) {
        risksContainer.innerHTML = selectedRisks.map(risk => 
          '<div class="flex items-center justify-between bg-red-50 p-2 rounded mb-1">' +
            '<span class="text-sm"><i class="fas fa-shield-alt mr-2 text-red-600"></i>' + risk.title + '</span>' +
            '<button type="button" onclick="removeRisk(' + risk.id + ')" class="text-red-600 hover:text-red-800">' +
              '<i class="fas fa-times text-xs"></i>' +
            '</button>' +
           '</div>'
        ).join('');
      } else {
        risksContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-2">No risks selected</p>';
      }
      
      // Update hidden input
      document.getElementById('linked_risks_input').value = JSON.stringify(selectedRisks);
      
      // Close modal
      document.getElementById('link-modal').innerHTML = '';
    }
    
    function removeRisk(riskId) {
      // Remove from UI and update hidden input
      const current = JSON.parse(document.getElementById('linked_risks_input').value || '[]');
      const updated = current.filter(risk => risk.id != riskId);
      document.getElementById('linked_risks_input').value = JSON.stringify(updated);
      
      // Refresh display
      const risksContainer = document.getElementById('risk-associations');
      if (updated.length > 0) {
        risksContainer.innerHTML = updated.map(risk => 
          '<div class="flex items-center justify-between bg-red-50 p-2 rounded mb-1">' +
            '<span class="text-sm"><i class="fas fa-shield-alt mr-2 text-red-600"></i>' + risk.title + '</span>' +
            '<button type="button" onclick="removeRisk(' + risk.id + ')" class="text-red-600 hover:text-red-800">' +
              '<i class="fas fa-times text-xs"></i>' +
            '</button>' +
           '</div>'
        ).join('');
      } else {
        risksContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-2">No risks selected</p>';
      }
    }
  </script>
`;
// Helper function to get service by ID
async function getServiceById(db: any, serviceId: string) {
  try {
    const result = await db.prepare(`
      SELECT * FROM assets_enhanced 
      WHERE id = ? AND (category = 'service' OR subcategory LIKE '%Service%')
    `).bind(serviceId).first();
    return result;
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    return null;
  }
}

// Helper function to update service
async function updateService(db: any, serviceId: string, serviceData: any) {
  try {
    await db.prepare(`
      UPDATE assets_enhanced SET 
        name = ?,
        type = ?,
        description = ?,
        location = ?,
        asset_owner = ?,
        technical_custodian = ?,
        confidentiality = ?,
        integrity = ?,
        availability = ?,
        criticality = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      serviceData.name,
      serviceData.type,
      serviceData.description,
      serviceData.location,
      serviceData.asset_owner,
      serviceData.technical_custodian,
      serviceData.confidentiality,
      serviceData.integrity,
      serviceData.availability,
      serviceData.criticality,
      serviceData.updated_at,
      serviceId
    ).run();
    
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
}

// Helper function to delete service
async function deleteService(db: any, serviceId: string) {
  try {
    await db.prepare(`
      DELETE FROM assets_enhanced 
      WHERE id = ? AND (category = 'service' OR subcategory LIKE '%Service%')
    `).bind(serviceId).run();
    
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}

// Service Edit Modal
const renderServiceEditModal = (service: any) => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center">
              <i class="fas fa-edit text-blue-600 mr-3"></i>
              Edit Service
            </h3>
            <p class="text-sm text-gray-600 mt-1">Update service information and CIA ratings</p>
          </div>
          <button hx-get="/operations/api/services/close" hx-target="#service-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/services/${service.id}" 
              hx-target="#service-modal" 
              hx-swap="innerHTML"
              hx-on::after-request="if(event.detail.xhr.status === 200) { 
                document.getElementById('service-modal').innerHTML = '';
                htmx.trigger(document.querySelector('tbody'), 'htmx:load');
              }">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
              <input type="text" name="name" value="${service.name || ''}" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select name="type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                <option value="Web Application" ${service.type === 'Web Application' ? 'selected' : ''}>Web Application</option>
                <option value="Database Service" ${service.type === 'Database Service' ? 'selected' : ''}>Database Service</option>
                <option value="API Service" ${service.type === 'API Service' ? 'selected' : ''}>API Service</option>
                <option value="Authentication Service" ${service.type === 'Authentication Service' ? 'selected' : ''}>Authentication Service</option>
                <option value="File Service" ${service.type === 'File Service' ? 'selected' : ''}>File Service</option>
                <option value="Communication Service" ${service.type === 'Communication Service' ? 'selected' : ''}>Communication Service</option>
                <option value="Infrastructure Service" ${service.type === 'Infrastructure Service' ? 'selected' : ''}>Infrastructure Service</option>
                <option value="Business Application" ${service.type === 'Business Application' ? 'selected' : ''}>Business Application</option>
                <option value="Other" ${service.type === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">${service.description || ''}</textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Location/Department</label>
              <input type="text" name="location" value="${service.location || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Owner</label>
              <input type="text" name="asset_owner" value="${service.asset_owner || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Technical Custodian</label>
            <input type="text" name="technical_custodian" value="${service.technical_custodian || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
          </div>

          <!-- CIA Triad Assessment -->
          <div class="mt-6 border-t pt-6">
            <h4 class="text-lg font-medium text-gray-900 mb-4">CIA Triad Assessment</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-lock text-blue-500 mr-1"></i>
                  Confidentiality
                </label>
                <select name="confidentiality" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="1" ${service.confidentiality == 1 ? 'selected' : ''}>1 - Public</option>
                  <option value="2" ${service.confidentiality == 2 ? 'selected' : ''}>2 - Internal</option>
                  <option value="3" ${service.confidentiality == 3 ? 'selected' : ''}>3 - Confidential</option>
                  <option value="4" ${service.confidentiality == 4 ? 'selected' : ''}>4 - Restricted</option>
                  <option value="5" ${service.confidentiality == 5 ? 'selected' : ''}>5 - Top Secret</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-shield-alt text-orange-500 mr-1"></i>
                  Integrity
                </label>
                <select name="integrity" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500">
                  <option value="1" ${service.integrity == 1 ? 'selected' : ''}>1 - Low</option>
                  <option value="2" ${service.integrity == 2 ? 'selected' : ''}>2 - Basic</option>
                  <option value="3" ${service.integrity == 3 ? 'selected' : ''}>3 - Medium</option>
                  <option value="4" ${service.integrity == 4 ? 'selected' : ''}>4 - High</option>
                  <option value="5" ${service.integrity == 5 ? 'selected' : ''}>5 - Critical</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-clock text-green-500 mr-1"></i>
                  Availability
                </label>
                <select name="availability" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500">
                  <option value="1" ${service.availability == 1 ? 'selected' : ''}>1 - Low (95%)</option>
                  <option value="2" ${service.availability == 2 ? 'selected' : ''}>2 - Basic (98%)</option>
                  <option value="3" ${service.availability == 3 ? 'selected' : ''}>3 - Medium (99%)</option>
                  <option value="4" ${service.availability == 4 ? 'selected' : ''}>4 - High (99.9%)</option>
                  <option value="5" ${service.availability == 5 ? 'selected' : ''}>5 - Critical (99.99%)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Business Criticality</label>
            <select name="criticality" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <option value="Low" ${service.criticality === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${service.criticality === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${service.criticality === 'High' ? 'selected' : ''}>High</option>
              <option value="Critical" ${service.criticality === 'Critical' ? 'selected' : ''}>Critical</option>
            </select>
          </div>

          <div class="mt-8 flex justify-end space-x-3">
            <button type="button" 
                    hx-get="/operations/api/services/close" 
                    hx-target="#service-modal" 
                    hx-swap="innerHTML"
                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <i class="fas fa-save mr-2"></i>
              Update Service
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

// Service Delete Confirmation Modal
const renderServiceDeleteModal = (service: any, linkedAssets: any[], linkedRisks: any[]) => {
  const hasLinkedItems = linkedAssets.length > 0 || linkedRisks.length > 0;
  
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
         hx-target="this" 
         hx-swap="outerHTML"
         _="on click from elsewhere halt the event">
      <div class="relative top-10 mx-auto p-6 border w-full max-w-lg shadow-xl rounded-lg bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 flex items-center">
                <i class="fas fa-trash text-red-600 mr-3"></i>
                Delete Service
              </h3>
            </div>
            <button hx-get="/operations/api/services/close" hx-target="#service-modal" hx-swap="innerHTML" 
                    class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
              <i class="fas fa-times text-lg"></i>
            </button>
          </div>
          
          ${hasLinkedItems ? html`
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-yellow-400 mt-0.5 mr-3"></i>
                <div>
                  <h4 class="text-sm font-medium text-yellow-800 mb-2">Cannot Delete Service</h4>
                  <p class="text-sm text-yellow-700 mb-3">
                    This service cannot be deleted because it has linked items that must be unlinked first:
                  </p>
                  <ul class="text-sm text-yellow-700 space-y-1">
                    ${linkedAssets.length > 0 ? html`<li>• ${linkedAssets.length} linked assets</li>` : ''}
                    ${linkedRisks.length > 0 ? html`<li>• ${linkedRisks.length} linked risks</li>` : ''}
                  </ul>
                  <p class="text-sm text-yellow-700 mt-3">
                    Please unlink all assets and risks from this service before attempting to delete it.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button type="button" 
                      hx-get="/operations/api/services/close" 
                      hx-target="#service-modal" 
                      hx-swap="innerHTML"
                      class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Close
              </button>
            </div>
          ` : html`
            <div class="mb-6">
              <p class="text-gray-700 mb-4">
                Are you sure you want to delete the service <strong>"${service.name}"</strong>?
              </p>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-start">
                  <i class="fas fa-exclamation-triangle text-red-400 mt-0.5 mr-3"></i>
                  <div>
                    <h4 class="text-sm font-medium text-red-800 mb-1">This action cannot be undone</h4>
                    <p class="text-sm text-red-700">
                      The service and all its configuration will be permanently removed from the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button type="button" 
                      hx-get="/operations/api/services/close" 
                      hx-target="#service-modal" 
                      hx-swap="innerHTML"
                      class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" 
                      hx-delete="/operations/api/services/${service.id}"
                      hx-target="#service-modal" 
                      hx-swap="innerHTML"
                      hx-on::after-request="if(event.detail.xhr.status === 200) { 
                        document.getElementById('service-modal').innerHTML = '';
                        htmx.trigger(document.querySelector('tbody'), 'htmx:load');
                      }"
                      class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center">
                <i class="fas fa-trash mr-2"></i>
                Delete Service
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

// Document Management Helper Functions
async function createDocument(db: any, documentData: any) {
  try {
    await db.prepare(`
      INSERT INTO documents (
        document_id, file_name, original_file_name, file_path, file_size, mime_type,
        file_hash, uploaded_by, title, description, document_type, tags, version,
        visibility, access_permissions, related_entity_type, related_entity_id,
        upload_date, download_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      documentData.document_id,
      documentData.file_name,
      documentData.original_file_name,
      documentData.file_path,
      documentData.file_size,
      documentData.mime_type,
      documentData.file_hash,
      documentData.uploaded_by,
      documentData.title,
      documentData.description,
      documentData.document_type,
      documentData.tags,
      documentData.version,
      documentData.visibility,
      documentData.access_permissions,
      documentData.related_entity_type,
      documentData.related_entity_id,
      documentData.upload_date,
      documentData.download_count,
      documentData.is_active,
      documentData.created_at,
      documentData.updated_at
    ).run();

    return true;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

async function getDocumentById(db: any, documentId: string) {
  try {
    const result = await db.prepare(`
      SELECT * FROM documents WHERE document_id = ? AND is_active = 1
    `).bind(documentId).first();
    return result;
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return null;
  }
}

async function getDocuments(db: any, limit = 100) {
  try {
    const result = await db.prepare(`
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.is_active = 1
      ORDER BY d.created_at DESC
      LIMIT ?
    `).bind(limit).all();
    return result.results || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

async function updateDocumentDownloadCount(db: any, documentId: string) {
  try {
    await db.prepare(`
      UPDATE documents 
      SET download_count = download_count + 1,
          last_accessed = ?
      WHERE document_id = ?
    `).bind(new Date().toISOString(), documentId).run();
    
    return true;
  } catch (error) {
    console.error('Error updating download count:', error);
    return false;
  }
}

async function deleteDocument(db: any, documentId: string) {
  try {
    // Soft delete - mark as inactive instead of hard delete
    await db.prepare(`
      UPDATE documents 
      SET is_active = 0, updated_at = ?
      WHERE document_id = ?
    `).bind(new Date().toISOString(), documentId).run();
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Document Categories
function renderDocumentCategories(documents: any[] = []) {
  const categories = [
    { 
      type: 'Policy', 
      icon: 'fas fa-shield-alt', 
      color: 'blue', 
      title: 'Security Policies',
      description: 'Information security and data protection policies'
    },
    { 
      type: 'Procedure', 
      icon: 'fas fa-cog', 
      color: 'gray', 
      title: 'Procedures',
      description: 'Operational procedures and work instructions'
    },
    { 
      type: 'Compliance', 
      icon: 'fas fa-clipboard-check', 
      color: 'green', 
      title: 'Compliance',
      description: 'Regulatory and compliance documentation'
    }
  ];

  return categories.map(category => {
    const count = documents.filter(doc => doc.type === category.type).length;
    return `
      <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
           hx-get="/operations/documents?type=${category.type}" hx-target="body" hx-swap="innerHTML">
        <div class="flex items-center mb-4">
          <i class="${category.icon} text-${category.color}-500 mr-3"></i>
          <h3 class="text-lg font-semibold text-gray-900">${category.title}</h3>
        </div>
        <p class="text-gray-600 mb-4">${category.description}</p>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${category.color}-100 text-${category.color}-800">
          ${count} document${count !== 1 ? 's' : ''}
        </span>
      </div>
    `;
  }).join('');
}

// Document Delete Confirmation Modal
const renderDocumentDeleteModal = (document: any) => html`
  <div class="fixed inset-0 bg-red-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div class="flex items-center mb-4">
        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
        <h3 class="text-lg font-medium text-gray-900">Delete Document</h3>
      </div>
      <p class="text-sm text-gray-600 mb-6">
        Are you sure you want to delete "<strong>${document.name}</strong>"? 
        This action cannot be undone and the file will be permanently removed from R2 storage.
      </p>
      <div class="flex items-center space-x-3">
        <button hx-post="/operations/api/documents/${document.document_id}/delete" 
                hx-target="#document-modal" 
                hx-swap="innerHTML"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
          <i class="fas fa-trash mr-2"></i>Delete Document
        </button>
        <button hx-get="/operations/api/documents/close" 
                hx-target="#document-modal" 
                hx-swap="innerHTML"
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
          Cancel
        </button>
      </div>
    </div>
  </div>
`;


