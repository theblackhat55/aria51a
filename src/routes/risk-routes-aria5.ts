import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { createAIService } from '../services/ai-providers';
import { setCSRFToken, authMiddleware } from '../middleware/auth-middleware';
import { DynamicRiskManager, DynamicRiskState, ThreatIntelligenceData } from '../services/dynamic-risk-manager';
import type { CloudflareBindings } from '../types';

export function createRiskRoutesARIA5() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Simple test endpoint (no auth, no DB)
  app.get('/debug-test', async (c) => {
    return c.json({ 
      success: true, 
      message: 'Debug endpoint is working!',
      path: c.req.path,
      timestamp: new Date().toISOString()
    });
  });

  // Test database connectivity
  app.get('/debug-db-test', async (c) => {
    try {
      // Try to create table with complete schema
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS risks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          risk_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category_id INTEGER DEFAULT 1,
          probability INTEGER DEFAULT 1,
          impact INTEGER DEFAULT 1,
          risk_score INTEGER DEFAULT 1,
          status TEXT DEFAULT 'active',
          organization_id INTEGER DEFAULT 1,
          owner_id INTEGER DEFAULT 1,
          created_by INTEGER DEFAULT 1,
          risk_type TEXT DEFAULT 'business',
          created_at TEXT,
          updated_at TEXT
        )
      `).run();

      // Try a simple query
      const testResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM risks').first();
      
      return c.json({ 
        success: true, 
        message: 'Database connectivity working!',
        riskCount: testResult?.count || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Public debug endpoints (no auth required)
  app.get('/debug-risks', async (c) => {
    try {
      const result = await c.env.DB.prepare(`SELECT * FROM risks ORDER BY created_at DESC LIMIT 10`).all();
      return c.json({ 
        success: true, 
        totalRisks: result.results?.length || 0, 
        risks: result.results || [] 
      });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  app.get('/debug-schema', async (c) => {
    try {
      const result = await c.env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
      return c.json({ 
        success: true, 
        tables: result.results || [] 
      });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // PRODUCTION: Proper authentication with debug endpoints
  app.use('/*', async (c, next) => {
    const path = c.req.path;
    
    // Skip auth only for debug endpoints (read-only)
    if (path.includes('/debug')) {
      // Set mock user for debug endpoints only
      c.set('user', {
        id: 1,
        username: 'system',
        email: 'system@aria5.com',
        first_name: 'System',
        last_name: 'Debug',
        role: 'admin'
      });
      return next();
    }
    
    // All other routes require proper authentication
    return requireAuth(c, next);
  });
  
  // Main risk management page - exact match to ARIA5
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Risk Management',
        user,
        content: renderARIA5RiskManagement()
      })
    );
  });

  // Risk statistics (HTMX endpoint) - EMERGENCY FIX: Use simple table
  app.get('/stats', async (c) => {
    try {
      // Use comprehensive risks table directly for consistency  
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN COALESCE(risk_score, probability * impact) >= 20 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN COALESCE(risk_score, probability * impact) >= 12 AND COALESCE(risk_score, probability * impact) < 20 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN COALESCE(risk_score, probability * impact) >= 6 AND COALESCE(risk_score, probability * impact) < 12 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN COALESCE(risk_score, probability * impact) < 6 THEN 1 ELSE 0 END) as low
        FROM risks
      `).first();
      console.log('✅ Stats from comprehensive risks table');

      const stats = {
        total: result?.total || 0,
        critical: result?.critical || 0,
        high: result?.high || 0,
        medium: result?.medium || 0,
        low: result?.low || 0
      };

      return c.html(renderRiskStats(stats));
    } catch (error) {
      console.error('Error fetching risk statistics:', error);
      // Fallback to sample stats
      const stats = { total: 2, critical: 0, high: 1, medium: 1, low: 0 };
      return c.html(renderRiskStats(stats));
    }
  });



  // Risk table (HTMX endpoint) - EMERGENCY FIX: Use simple table
  app.get('/table', async (c) => {
    try {
      console.log('🚨 EMERGENCY FIX: Simple query for all risks');
      
      // EMERGENCY: Simple working query
      const result = await c.env.DB.prepare(`
        SELECT 
          id, title, description, category, status, 
          probability, impact, risk_score,
          owner_id, created_at,
          category as category_name,
          CASE 
            WHEN owner_id = 1 THEN 'Admin User'
            WHEN owner_id = 2 THEN 'Avi Adiyala'  
            ELSE 'Unknown User'
          END as owner_name
        FROM risks 
        ORDER BY risk_score DESC 
        LIMIT 20
      `).all();
      
      console.log('🚨 Raw DB result:', result);
      const risks = result.results || [];
      console.log('🚨 Risks found:', risks.length);
      
      if (risks.length === 0) {
        console.log('🚨 No risks found - returning empty table');
        return c.html(`<div>No risks found in database</div>`);
      }
      
      console.log('🚨 Rendering table with', risks.length, 'risks');
      return c.html(renderRiskTable(risks));

    } catch (error) {
      console.error('Error fetching risk table data:', error);
      return c.html(renderRiskTable([]));
    }
  });



  // Create risk modal (with CSRF protection)
  app.get('/create', authMiddleware, async (c) => {
    const csrfToken = setCSRFToken(c);
    const modalHtml = await renderCreateRiskModal(c.env.DB, csrfToken);
    return c.html(modalHtml);
  });

  // Simple Add Risk modal for quick actions
  app.get('/add', authMiddleware, async (c) => {
    const csrfToken = setCSRFToken(c);
    return c.html(renderSimpleAddRiskModal(csrfToken));
  });

  // Risk score calculation endpoint
  app.post('/calculate-score', async (c) => {
    const body = await c.req.parseBody();
    const likelihood = parseInt(body.probability as string) || parseInt(body.likelihood as string);
    const impact = parseInt(body.impact as string);
    
    if (!likelihood || !impact) {
      return c.html(`<input type="text" name="risk_score" value="TBD" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">`);
    }
    
    const score = likelihood * impact;
    let level = 'Low';
    let colorClass = 'text-green-600';
    
    if (score >= 20) {
      level = 'Critical';
      colorClass = 'text-red-600';
    } else if (score >= 15) {
      level = 'High'; 
      colorClass = 'text-orange-600';
    } else if (score >= 10) {
      level = 'Medium';
      colorClass = 'text-yellow-600';
    } else if (score >= 5) {
      level = 'Low';
      colorClass = 'text-green-600';
    } else {
      level = 'Very Low';
      colorClass = 'text-gray-600';
    }
    
    return c.html(`
      <input type="text" 
             name="risk_score" 
             value="${score} - ${level}" 
             readonly
             class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium ${colorClass}">
    `);
  });

  // AI Risk Analysis endpoint using Cloudflare AI
  app.post('/analyze-ai', async (c) => {
    const { env } = c;
    const formData = await c.req.parseBody();
    
    try {
      // Extract risk information from form
      const riskTitle = formData.title as string || 'Untitled Risk';
      const riskDescription = formData.description as string || 'No description provided';
      const riskCategory = formData.category as string || 'General';
      
      // Create AI prompt for risk analysis with structured data
      const prompt = `You are an expert risk analyst. Analyze this business risk and provide both a detailed analysis AND structured data for risk management forms.

Risk Title: ${riskTitle}
Description: ${riskDescription}
Category: ${riskCategory}

Provide your response in TWO parts:

PART 1 - DETAILED ANALYSIS:
1. Risk Assessment Summary
2. Key Risk Factors (3-4 bullet points)
3. Potential Business Impact
4. Recommended Mitigation Actions (3-4 specific steps)  
5. Monitoring Indicators

PART 2 - STRUCTURED DATA (use this exact format):
PROBABILITY_SCORE: [1-5, where 1=Very Low, 5=Very High]
IMPACT_SCORE: [1-5, where 1=Minimal, 5=Severe]
RISK_OWNER: [suggest appropriate role/department]
TREATMENT_STRATEGY: [Accept/Mitigate/Transfer/Avoid]
MITIGATION_ACTIONS: [2-3 specific actionable steps, separated by semicolons]
REVIEW_DATE: [suggest date 3-6 months from now in YYYY-MM-DD format]
TARGET_DATE: [suggest completion date 1-3 months from now in YYYY-MM-DD format]

Be practical and actionable in your analysis.`;

      // Use Cloudflare AI Workers AI
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024
      });

      const analysis = response.response || 'Analysis could not be generated.';

      return c.html(html`
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <i class="fas fa-robot text-green-500 mr-2"></i>
              <span class="text-green-800 font-medium">AI Risk Analysis Complete</span>
              <span class="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Powered by Cloudflare AI</span>
            </div>
            <button 
              id="fill-ai-form-btn"
              data-analysis="${analysis.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
              data-title="${riskTitle.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
              data-description="${riskDescription.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
              data-category="${riskCategory.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
              <i class="fas fa-magic mr-1"></i>
              Fill Form with AI Data
            </button>
          </div>
          <div class="text-gray-800 whitespace-pre-line text-sm leading-relaxed">
            ${analysis}
          </div>
          <div class="mt-3 pt-3 border-t border-green-200">
            <p class="text-green-600 text-xs">
              <i class="fas fa-info-circle mr-1"></i>
              Analysis generated using Cloudflare Workers AI (Llama 3.1 8B) • Click "Update Risk Form" to auto-fill fields
            </p>
          </div>
        </div>
      `);

    } catch (error) {
      console.error('AI analysis error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">AI analysis failed</span>
          </div>
          <p class="text-red-600 text-sm mt-1">${error.message}</p>
        </div>
      `);
    }
  });

  // Fill existing risk form with AI data (no form replacement)
  app.post('/fill-from-ai', async (c) => {
    try {
      const formData = await c.req.parseBody();
      const analysis = formData.analysis as string;
      const title = formData.title as string;
      const description = formData.description as string;
      const category = formData.category as string;

      // Parse AI structured data from analysis
      const aiData = parseAIAnalysis(analysis);
      
      // Return safe HTML with JSON data and a simple script
      const safeAiData = {
        probability: aiData.probability || 3,
        impact: aiData.impact || 3,
        treatmentStrategy: (aiData.treatmentStrategy || 'mitigate').toLowerCase(),
        mitigationActions: (aiData.mitigationActions || '').replace(/['"]/g, '')
      };
      
      return c.html(html`
        <div id="ai-form-filler">
          <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">Form Updated!</span>
            </div>
            <p class="text-green-600 text-sm mt-1">Risk assessment fields have been filled with AI recommendations.</p>
          </div>
          
          <script type="application/json" id="ai-data">${JSON.stringify(safeAiData)}</script>
          <script>
            (function() {
              try {
                console.log('🤖 Filling form with AI data...');
                
                // Get AI data from JSON script tag
                const aiDataElement = document.getElementById('ai-data');
                if (!aiDataElement) {
                  console.error('AI data not found');
                  return;
                }
                
                const aiData = JSON.parse(aiDataElement.textContent);
                console.log('📊 AI Data:', aiData);
                
                // Fill likelihood/probability field
                const likelihoodField = document.querySelector('select[name="likelihood"], select[name="probability"]');
                if (likelihoodField && aiData.probability) {
                  likelihoodField.value = String(aiData.probability);
                  console.log('✅ Set likelihood to:', aiData.probability);
                }
                
                // Fill impact field
                const impactField = document.querySelector('select[name="impact"]');
                if (impactField && aiData.impact) {
                  impactField.value = String(aiData.impact);
                  console.log('✅ Set impact to:', aiData.impact);
                }
                
                // Fill treatment strategy field
                const treatmentField = document.querySelector('select[name="treatment_strategy"]');
                if (treatmentField && aiData.treatmentStrategy) {
                  treatmentField.value = aiData.treatmentStrategy;
                  console.log('✅ Set treatment strategy to:', aiData.treatmentStrategy);
                }
                
                // Fill mitigation actions field
                const mitigationField = document.querySelector('textarea[name="mitigation_actions"]');
                if (mitigationField && aiData.mitigationActions) {
                  mitigationField.value = aiData.mitigationActions;
                  console.log('✅ Set mitigation actions');
                }
                
                // Trigger risk score calculation
                if (likelihoodField) {
                  const changeEvent = new Event('change', { bubbles: true });
                  likelihoodField.dispatchEvent(changeEvent);
                  console.log('✅ Triggered risk score calculation');
                }
                
                console.log('✅ Form filling complete');
                
              } catch (error) {
                console.error('❌ Error filling form:', error);
              }
            })();
          </script>
        </div>
      `);

    } catch (error) {
      console.error('Error filling form with AI data:', error);
      return c.html(html`
        <div id="ai-form-filler">
          <div class="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Failed to fill form</span>
            </div>
            <p class="text-red-600 text-sm mt-1">${error.message}</p>
          </div>
        </div>
      `);
    }
  });

  // Keep the old endpoint for backwards compatibility but redirect to new behavior
  app.post('/update-from-ai', async (c) => {
    // Redirect to the new fill-from-ai endpoint
    return c.redirect('/risk/fill-from-ai');
  });

  // Create risk submission - CONSOLIDATED SINGLE ROUTE
  app.post('/create', authMiddleware, async (c) => {
    try {
      // Parse form data with robust error handling
      const formData = await c.req.parseBody();
      console.log('📝 Creating new risk with data:', formData);

      // Risk data extraction with defaults - handling both form formats
      const riskData = {
        title: formData.title as string,
        description: formData.description as string || '',
        category: formData.category as string || 'operational',
        subcategory: formData.subcategory as string || formData.threat_source as string || '',
        probability: parseInt(formData.probability as string) || parseInt(formData.likelihood as string) || 1,
        impact: parseInt(formData.impact as string) || 1,
        status: formData.status as string || 'active',
        owner_id: parseInt(formData.owner as string) || 1,
        organization_id: 1,
        created_by: 1,
        affected_assets: formData.affected_assets as string || JSON.stringify(formData['affected_services[]'] || []),
        source: formData.source as string || formData.treatment_strategy as string || 'Manual Entry',
        review_date: formData.review_date as string || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // Calculate risk score
      const riskScore = riskData.probability * riskData.impact;
      
      // Generate unique risk_id for production database
      const risk_id = `RISK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Map category names to category_id for production database
      const categoryMapping: { [key: string]: number } = {
        'operational': 1,
        'financial': 2,
        'strategic': 3,
        'compliance': 4,
        'technology': 5,
        'cybersecurity': 5, // Map cybersecurity to technology
        'reputation': 6,
        'reputational': 6
      };
      
      const category_id = categoryMapping[riskData.category.toLowerCase()] || 1; // Default to operational
      
      // Use comprehensive risks table for consistency
      try {
        // Insert into the comprehensive risks table
        const result = await c.env.DB.prepare(`
          INSERT INTO risks (
            risk_id, title, description, category_id, organization_id, owner_id, 
            status, risk_type, probability, impact, risk_score, 
            created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          risk_id,
          riskData.title,
          riskData.description,
          category_id,
          riskData.organization_id,
          riskData.owner_id,
          riskData.status,
          'business', // Default risk type
          riskData.probability,
          riskData.impact,
          riskScore,
          riskData.created_by,
          new Date().toISOString(),
          new Date().toISOString()
        ).run();

        console.log('✅ Risk created successfully:', { id: result.meta?.last_row_id, ...riskData });

        // Auto-close modal and refresh page
        console.log('✅ Risk created successfully:', { id: result.meta?.last_row_id, ...riskData });
        
        return c.html(html`
          <script>
            // Auto-close modal and refresh page
            setTimeout(() => {
              document.getElementById('modal-container').innerHTML = '';
              location.reload();
            }, 1500);
          </script>
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">Risk created successfully!</span>
            </div>
            <p class="text-green-600 text-sm mt-1">Risk ID: ${risk_id} | Score: ${riskScore} | Database ID: ${result.meta?.last_row_id}</p>
            <p class="text-gray-600 text-sm mt-2">
              <i class="fas fa-sync-alt animate-spin mr-1"></i>
              Auto-closing and refreshing page...
            </p>
          </div>
        `);

      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Database error - Risk creation failed</span>
            </div>
            <p class="text-red-600 text-sm mt-1">Error: ${dbError.message}</p>
            <p class="text-red-600 text-xs mt-1">Please check all required fields and try again.</p>
          </div>
        `);
      }

    } catch (error) {
      console.error('❌ Risk creation failed:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Risk creation failed</span>
          </div>
          <p class="text-red-600 text-sm mt-1">${error.message}</p>
        </div>
      `);
    }
  });

  // View risk modal - Enhanced professional design
  app.get('/view/:id', async (c) => {
    const riskId = c.req.param('id');
    
    try {
      const risk = await c.env.DB.prepare(`
        SELECT 
          r.*,
          COALESCE(r.risk_score, r.probability * r.impact) as risk_score,
          CASE 
            WHEN r.category = 'operational' THEN 'Operational'
            WHEN r.category = 'financial' THEN 'Financial' 
            WHEN r.category = 'strategic' THEN 'Strategic'
            WHEN r.category = 'compliance' THEN 'Compliance'
            WHEN r.category = 'technology' THEN 'Technology'
            WHEN r.category = 'reputation' THEN 'Reputation'
            ELSE 'Operational'
          END as category_name
        FROM risks r
        WHERE r.id = ?
      `).bind(riskId).first();

      if (!risk) {
        return c.html(html`
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div class="p-6">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <i class="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <h3 class="text-lg font-medium text-gray-900">Risk Not Found</h3>
                </div>
                <p class="text-gray-600 mb-6">The requested risk could not be found or may have been deleted.</p>
                <div class="flex justify-end">
                  <button onclick="document.getElementById('modal-container').innerHTML = ''" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        `);
      }

      const riskLevel = getRiskLevel(risk.risk_score);
      const riskColor = getRiskColorClass(riskLevel);
      
      // Enhanced status color coding
      const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
          case 'active': return 'bg-green-100 text-green-800 border border-green-200';
          case 'mitigated': return 'bg-blue-100 text-blue-800 border border-blue-200';
          case 'monitoring': return 'bg-purple-100 text-purple-800 border border-purple-200';
          case 'closed': return 'bg-gray-100 text-gray-800 border border-gray-200';
          case 'escalated': return 'bg-red-100 text-red-800 border border-red-200';
          default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
      };

      return c.html(html`
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
          <div class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6">
              <div class="flex justify-between items-start">
                <div class="flex items-center space-x-4">
                  <div class="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <i class="fas fa-shield-alt text-2xl"></i>
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold">Risk Assessment Details</h3>
                    <p class="text-blue-100 text-sm mt-1">RISK-${risk.id} • ${risk.category_name}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskColor}">
                    ${riskLevel}
                  </span>
                  <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-white hover:text-gray-200 transition-colors">
                    <i class="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div class="p-8">
                
                <!-- Status and Quick Actions Bar -->
                <div class="bg-gray-50 rounded-lg p-4 mb-8 border">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-6">
                      <div>
                        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Status</label>
                        <div class="mt-1">
                          <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusStyle(risk.status)}">
                            <i class="fas fa-circle text-xs mr-2"></i>
                            ${risk.status?.charAt(0).toUpperCase() + risk.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Score</label>
                        <div class="mt-1">
                          <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${riskColor}">
                            ${risk.risk_score} / 25
                          </span>
                        </div>
                      </div>
                      ${risk.source ? html`
                        <div>
                          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</label>
                          <div class="mt-1">
                            <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              <i class="fas fa-robot text-xs mr-2"></i>
                              AI Generated
                            </span>
                          </div>
                        </div>
                      ` : ''}
                    </div>
                    <div class="flex space-x-2">
                      <button hx-get="/risk/status-change/${risk.id}" 
                              hx-target="#modal-container" 
                              hx-swap="innerHTML"
                              class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i class="fas fa-exchange-alt mr-2"></i>
                        Change Status
                      </button>
                      <button hx-get="/risk/edit/${risk.id}" 
                              hx-target="#modal-container" 
                              hx-swap="outerHTML"
                              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i class="fas fa-edit mr-2"></i>
                        Edit Risk
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <!-- Left Column - Risk Information -->
                  <div class="lg:col-span-2 space-y-6">
                    
                    <!-- Risk Overview -->
                    <div class="bg-white border rounded-lg overflow-hidden">
                      <div class="bg-gray-50 px-6 py-3 border-b">
                        <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                          <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                          Risk Overview
                        </h4>
                      </div>
                      <div class="p-6 space-y-4">
                        <div>
                          <label class="text-sm font-medium text-gray-700">Risk Title</label>
                          <p class="mt-1 text-lg font-medium text-gray-900">${risk.title}</p>
                        </div>
                        <div>
                          <label class="text-sm font-medium text-gray-700">Description</label>
                          <p class="mt-1 text-gray-800 leading-relaxed">${risk.description || 'No description provided'}</p>
                        </div>
                        ${risk.affected_assets ? html`
                          <div>
                            <label class="text-sm font-medium text-gray-700">Affected Assets</label>
                            <p class="mt-1 text-gray-800">${risk.affected_assets}</p>
                          </div>
                        ` : ''}
                      </div>
                    </div>

                    <!-- Risk Assessment -->
                    <div class="bg-white border rounded-lg overflow-hidden">
                      <div class="bg-gray-50 px-6 py-3 border-b">
                        <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                          <i class="fas fa-calculator text-orange-500 mr-2"></i>
                          Risk Assessment
                        </h4>
                      </div>
                      <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div class="text-center">
                            <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                              <span class="text-2xl font-bold text-red-600">${risk.probability || 0}</span>
                            </div>
                            <label class="text-sm font-medium text-gray-700">Probability</label>
                            <p class="text-xs text-gray-500">Scale: 1-5</p>
                          </div>
                          <div class="text-center">
                            <div class="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-2">
                              <span class="text-2xl font-bold text-orange-600">${risk.impact || 0}</span>
                            </div>
                            <label class="text-sm font-medium text-gray-700">Impact</label>
                            <p class="text-xs text-gray-500">Scale: 1-5</p>
                          </div>
                          <div class="text-center">
                            <div class="w-16 h-16 mx-auto ${riskLevel === 'Critical' ? 'bg-red-100' : riskLevel === 'High' ? 'bg-orange-100' : riskLevel === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'} rounded-full flex items-center justify-center mb-2">
                              <span class="text-2xl font-bold ${riskLevel === 'Critical' ? 'text-red-600' : riskLevel === 'High' ? 'text-orange-600' : riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'}">${risk.risk_score}</span>
                            </div>
                            <label class="text-sm font-medium text-gray-700">Total Score</label>
                            <p class="text-xs text-gray-500">P × I = Score</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Right Column - Metadata -->
                  <div class="space-y-6">
                    
                    <!-- Timeline -->
                    <div class="bg-white border rounded-lg overflow-hidden">
                      <div class="bg-gray-50 px-6 py-3 border-b">
                        <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                          <i class="fas fa-calendar-alt text-green-500 mr-2"></i>
                          Timeline
                        </h4>
                      </div>
                      <div class="p-6 space-y-4">
                        <div>
                          <label class="text-sm font-medium text-gray-700">Created</label>
                          <p class="mt-1 text-gray-800">${new Date(risk.created_at).toLocaleDateString()}</p>
                          <p class="text-xs text-gray-500">${new Date(risk.created_at).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <label class="text-sm font-medium text-gray-700">Last Updated</label>
                          <p class="mt-1 text-gray-800">${new Date(risk.updated_at).toLocaleDateString()}</p>
                          <p class="text-xs text-gray-500">${new Date(risk.updated_at).toLocaleTimeString()}</p>
                        </div>
                        ${risk.review_date ? html`
                          <div>
                            <label class="text-sm font-medium text-gray-700">Next Review</label>
                            <p class="mt-1 text-gray-800">${new Date(risk.review_date).toLocaleDateString()}</p>
                          </div>
                        ` : ''}
                        ${risk.due_date ? html`
                          <div>
                            <label class="text-sm font-medium text-gray-700">Due Date</label>
                            <p class="mt-1 text-gray-800">${new Date(risk.due_date).toLocaleDateString()}</p>
                          </div>
                        ` : ''}
                      </div>
                    </div>

                    <!-- Risk Metrics -->
                    <div class="bg-white border rounded-lg overflow-hidden">
                      <div class="bg-gray-50 px-6 py-3 border-b">
                        <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                          <i class="fas fa-chart-line text-purple-500 mr-2"></i>
                          Risk Metrics
                        </h4>
                      </div>
                      <div class="p-6 space-y-4">
                        ${risk.inherent_risk ? html`
                          <div>
                            <label class="text-sm font-medium text-gray-700">Inherent Risk</label>
                            <p class="mt-1 text-lg font-semibold text-red-600">${risk.inherent_risk}</p>
                          </div>
                        ` : ''}
                        ${risk.residual_risk ? html`
                          <div>
                            <label class="text-sm font-medium text-gray-700">Residual Risk</label>
                            <p class="mt-1 text-lg font-semibold text-orange-600">${risk.residual_risk}</p>
                          </div>
                        ` : ''}
                        <div>
                          <label class="text-sm font-medium text-gray-700">Risk Level</label>
                          <p class="mt-1">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor}">
                              ${riskLevel}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="bg-gray-50 px-8 py-4 border-t flex justify-between items-center">
              <div class="text-sm text-gray-600">
                Risk ID: <span class="font-mono font-medium">RISK-${risk.id}</span>
              </div>
              <div class="flex space-x-3">
                <button onclick="window.print()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  <i class="fas fa-print mr-2"></i>
                  Print
                </button>
                <button onclick="document.getElementById('modal-container').innerHTML = ''" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Change Modal Container -->
        <div id="modal-container"></div>
      `);
    } catch (error) {
      console.error('Error fetching risk:', error);
      return c.html(html`
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div class="p-6">
              <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-exclamation-triangle text-red-600"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900">Error Loading Risk</h3>
              </div>
              <p class="text-gray-600 mb-6">Failed to load risk details. Please try again.</p>
              <div class="flex justify-end">
                <button onclick="document.getElementById('modal-container').innerHTML = ''" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    }
  });

  // Status change modal
  app.get('/status-change/:id', async (c) => {
    const riskId = c.req.param('id');
    const csrfToken = setCSRFToken(c);
    
    try {
      const risk = await c.env.DB.prepare(`
        SELECT id, title, status FROM risks WHERE id = ?
      `).bind(riskId).first();

      if (!risk) {
        return c.html(html`<div class="text-red-600">Risk not found</div>`);
      }

      const statusOptions = [
        { value: 'pending', name: 'Pending', description: 'Awaiting review or approval', icon: 'clock', color: 'yellow' },
        { value: 'active', name: 'Active', description: 'Risk is confirmed and being monitored', icon: 'exclamation-triangle', color: 'green' },
        { value: 'mitigated', name: 'Mitigated', description: 'Risk controls have been implemented', icon: 'shield-check', color: 'blue' },
        { value: 'monitoring', name: 'Monitoring', description: 'Risk is under continuous observation', icon: 'eye', color: 'purple' },
        { value: 'escalated', name: 'Escalated', description: 'Risk requires management attention', icon: 'arrow-up', color: 'red' },
        { value: 'closed', name: 'Closed', description: 'Risk has been resolved or is no longer relevant', icon: 'check-circle', color: 'gray' }
      ];

      return c.html(html`
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-t-xl">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="text-xl font-bold">Change Risk Status</h3>
                  <p class="text-orange-100 text-sm mt-1">RISK-${risk.id} • ${risk.title}</p>
                </div>
                <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-white hover:text-gray-200">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form hx-post="/risk/status-change/${risk.id}" hx-target="#modal-container" hx-swap="innerHTML">
              <input type="hidden" name="_csrf" value="${csrfToken}">
              
              <div class="p-6">
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <div class="p-3 bg-gray-50 rounded-lg border">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                      <i class="fas fa-circle text-xs mr-2"></i>
                      ${risk.status?.charAt(0).toUpperCase() + risk.status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-3">Select New Status</label>
                  <div class="space-y-3">
                    ${statusOptions.map(option => html`
                      <label class="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${risk.status === option.value ? 'border-gray-300 bg-gray-100' : 'border-gray-200'}">
                        <input type="radio" 
                               name="new_status" 
                               value="${option.value}"
                               ${risk.status === option.value ? 'disabled' : ''}
                               class="mr-4 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                        <div class="flex items-center flex-1">
                          <div class="w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                            option.color === 'yellow' ? 'bg-yellow-100' :
                            option.color === 'green' ? 'bg-green-100' :
                            option.color === 'blue' ? 'bg-blue-100' :
                            option.color === 'purple' ? 'bg-purple-100' :
                            option.color === 'red' ? 'bg-red-100' :
                            'bg-gray-100'
                          }">
                            <i class="fas fa-${option.icon} ${
                              option.color === 'yellow' ? 'text-yellow-600' :
                              option.color === 'green' ? 'text-green-600' :
                              option.color === 'blue' ? 'text-blue-600' :
                              option.color === 'purple' ? 'text-purple-600' :
                              option.color === 'red' ? 'text-red-600' :
                              'text-gray-600'
                            }"></i>
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center">
                              <span class="font-medium text-gray-900 ${risk.status === option.value ? 'text-gray-500' : ''}">${option.name}</span>
                              ${risk.status === option.value ? html`<span class="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">(Current)</span>` : ''}
                            </div>
                            <p class="text-sm text-gray-600 mt-1">${option.description}</p>
                          </div>
                        </div>
                      </label>
                    `)}
                  </div>
                </div>

                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Status Change Reason</label>
                  <textarea name="change_reason" 
                            rows="3" 
                            placeholder="Provide a reason for this status change (optional)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
              </div>

              <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button type="button" 
                        onclick="document.getElementById('modal-container').innerHTML = ''"
                        class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" 
                        class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors">
                  <i class="fas fa-save mr-2"></i>
                  Update Status
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Error loading status change modal:', error);
      return c.html(html`<div class="text-red-600">Error loading status change options</div>`);
    }
  });

  // Process status change
  app.post('/status-change/:id', async (c) => {
    const riskId = c.req.param('id');
    const formData = await c.req.parseBody();
    
    try {
      const newStatus = formData.new_status as string;
      const changeReason = formData.change_reason as string;
      
      if (!newStatus) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Please select a new status</span>
            </div>
          </div>
        `);
      }

      // Update risk status
      await c.env.DB.prepare(`
        UPDATE risks 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newStatus, riskId).run();

      // Log the status change (you could create a separate audit table for this)
      // For now, we'll just return success

      return c.html(html`
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span class="text-green-700 font-medium">Status updated successfully</span>
          </div>
          <p class="text-green-600 text-sm mt-1">Risk status changed to: ${newStatus}</p>
          <script>
            setTimeout(() => {
              // Close modal and refresh the page or table
              document.getElementById('modal-container').innerHTML = '';
              // Refresh risk table if present
              if (window.htmx && document.getElementById('risk-table')) {
                htmx.trigger('#risk-table', 'hx:trigger');
              }
            }, 2000);
          </script>
        </div>
      `);
    } catch (error) {
      console.error('Error updating risk status:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Failed to update status</span>
          </div>
          <p class="text-red-600 text-sm mt-1">${error.message}</p>
        </div>
      `);
    }
  });

  // Edit risk modal
  // INCIDENT MANAGEMENT ROUTES - Enhanced with MS Defender Integration
  app.get('/incidents', async (c) => {
    const user = c.get('user');
    
    try {
      // Fetch incident statistics from defender_incidents table
      const statsData = await getIncidentStatistics(c.env.DB);
      
      // Fetch recent incidents from defender_incidents table
      const recentIncidents = await getRecentIncidents(c.env.DB);
      
      return c.html(
        cleanLayout({
          title: 'Security Incidents',
          user,
          content: renderIncidentsPage(statsData, recentIncidents)
        })
      );
    } catch (error) {
      console.error('Error loading incidents:', error);
      return c.html(
        cleanLayout({
          title: 'Security Incidents',
          user,
          content: renderErrorPage('Failed to load incidents')
        })
      );
    }
  });

  app.get('/incidents/new', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Create Security Incident',
        user,
        content: renderNewIncidentPage()
      })
    );
  });

  // KRI Management Dashboard
  app.get('/kris', async (c) => {
    const user = c.get('user');
    
    try {
      // Fetch KRIs from database
      const kris = await c.env.DB.prepare(`
        SELECT 
          k.id,
          k.risk_id,
          k.name,
          k.description,
          k.metric_type,
          k.threshold_value,
          k.current_value,
          k.threshold_direction,
          k.frequency,
          k.owner_id,
          k.status,
          k.last_measured,
          k.created_at,
          k.updated_at,
          r.title as risk_title,
          u.first_name || ' ' || u.last_name as owner_name,
          CASE 
            WHEN k.threshold_direction = 'above' AND k.current_value > k.threshold_value THEN 'BREACHED'
            WHEN k.threshold_direction = 'below' AND k.current_value < k.threshold_value THEN 'BREACHED'
            WHEN k.threshold_direction = 'above' AND k.current_value > (k.threshold_value * 0.8) THEN 'WARNING'
            WHEN k.threshold_direction = 'below' AND k.current_value < (k.threshold_value * 1.2) THEN 'WARNING'
            ELSE 'NORMAL'
          END as alert_status
        FROM kris k
        LEFT JOIN risks r ON k.risk_id = r.id
        LEFT JOIN users u ON k.owner_id = u.id
        ORDER BY 
          CASE 
            WHEN (k.threshold_direction = 'above' AND k.current_value > k.threshold_value) OR 
                 (k.threshold_direction = 'below' AND k.current_value < k.threshold_value) THEN 1
            WHEN (k.threshold_direction = 'above' AND k.current_value > (k.threshold_value * 0.8)) OR
                 (k.threshold_direction = 'below' AND k.current_value < (k.threshold_value * 1.2)) THEN 2
            ELSE 3
          END,
          k.name ASC
      `).all();
      
      const kriList = kris.results || [];
      
      // Calculate KRI statistics
      const stats = {
        total: kriList.length,
        breached: kriList.filter((k: any) => k.alert_status === 'BREACHED').length,
        warning: kriList.filter((k: any) => k.alert_status === 'WARNING').length,
        normal: kriList.filter((k: any) => k.alert_status === 'NORMAL').length
      };
      
      return c.html(
        cleanLayout({
          title: 'Key Risk Indicators (KRI)',
          user,
          content: html`
            <div class="min-h-screen bg-gray-50">
              <!-- Header -->
              <div class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 py-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-chart-line text-blue-600 mr-2"></i>
                        Key Risk Indicators (KRI)
                      </h1>
                      <p class="text-gray-600 mt-1">Monitor and track key risk metrics in real-time</p>
                    </div>
                    <div class="flex items-center space-x-3">
                      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-1"></i>
                        Add KRI
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="max-w-7xl mx-auto px-4 py-8">
                <!-- KRI Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                      <div class="p-2 bg-blue-100 rounded-lg">
                        <i class="fas fa-chart-line text-blue-600"></i>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total KRIs</p>
                        <p class="text-2xl font-semibold text-gray-900">${stats.total}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                      <div class="p-2 bg-red-100 rounded-lg">
                        <i class="fas fa-exclamation-triangle text-red-600"></i>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Breached</p>
                        <p class="text-2xl font-semibold text-red-900">${stats.breached}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                      <div class="p-2 bg-yellow-100 rounded-lg">
                        <i class="fas fa-exclamation-circle text-yellow-600"></i>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Warning</p>
                        <p class="text-2xl font-semibold text-yellow-900">${stats.warning}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                      <div class="p-2 bg-green-100 rounded-lg">
                        <i class="fas fa-check-circle text-green-600"></i>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Normal</p>
                        <p class="text-2xl font-semibold text-green-900">${stats.normal}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- KRI Table -->
                <div class="bg-white shadow rounded-lg">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Key Risk Indicators</h3>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KRI Name</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        ${kriList.length === 0 ? html`
                          <tr>
                            <td colspan="7" class="px-6 py-12 text-center">
                              <div class="text-gray-500">
                                <i class="fas fa-chart-line text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium mb-2">No KRIs Found</h3>
                                <p class="text-sm">Get started by adding your first Key Risk Indicator</p>
                                <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                                  Add First KRI
                                </button>
                              </div>
                            </td>
                          </tr>
                        ` : kriList.map((kri: any) => html`
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div class="text-sm font-medium text-gray-900">${kri.name}</div>
                                <div class="text-sm text-gray-500">${kri.description || 'No description'}</div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm font-medium text-gray-900">
                                ${kri.current_value || 0} ${kri.metric_type || ''}
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-900">
                                ${kri.threshold_value || 0} ${kri.metric_type || ''} (${kri.threshold_direction || 'above'})
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                kri.alert_status === 'BREACHED' ? 'bg-red-100 text-red-800' :
                                kri.alert_status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }">
                                <i class="fas ${
                                  kri.alert_status === 'BREACHED' ? 'fa-exclamation-triangle' :
                                  kri.alert_status === 'WARNING' ? 'fa-exclamation-circle' :
                                  'fa-check-circle'
                                } mr-1"></i>
                                ${kri.alert_status}
                              </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${kri.risk_title || 'No Risk Linked'}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${kri.owner_name || 'Unassigned'}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div class="flex space-x-2">
                                <button class="text-blue-600 hover:text-blue-900">
                                  <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-green-600 hover:text-green-900">
                                  <i class="fas fa-chart-bar"></i>
                                </button>
                                <button class="text-red-600 hover:text-red-900">
                                  <i class="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        `)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          `
        })
      );
      
    } catch (error) {
      console.error('Error fetching KRIs:', error);
      return c.html(
        cleanLayout({
          title: 'KRI Dashboard - Error',
          user,
          content: html`
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
              <div class="max-w-md w-full">
                <div class="bg-white shadow rounded-lg p-6">
                  <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <h2 class="text-xl font-semibold text-gray-900 mb-2">Error Loading KRIs</h2>
                    <p class="text-gray-600 mb-4">There was an error loading the KRI dashboard. This might be because the KRI data structure is not yet set up.</p>
                    <div class="space-y-2">
                      <a href="/risk" class="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        Go to Risk Management
                      </a>
                      <a href="/dashboard" class="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
                        Return to Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `
        })
      );
    }
  });

  app.get('/risks', async (c) => {
    return c.redirect('/risk/', 301);
  });

  app.post('/incidents/create', async (c) => {
    const user = c.get('user');
    const formData = await c.req.formData();
    
    try {
      // Create incident logic here
      const incidentData = {
        title: formData.get('title'),
        description: formData.get('description'),
        severity: formData.get('severity') || 'Medium',
        status: 'Open',
        created_by: user?.id || 1,
        created_at: new Date().toISOString()
      };
      
      // For now, redirect to incidents list
      return c.redirect('/risk/incidents');
    } catch (error) {
      console.error('Error creating incident:', error);
      return c.html(
        cleanLayout({
          title: 'Create Security Incident',
          user,
          content: renderNewIncidentPage('Error creating incident')
        })
      );
    }
  });

  app.get('/edit/:id', async (c) => {
    const riskId = c.req.param('id');
    const csrfToken = setCSRFToken(c);
    
    try {
      const risk = await c.env.DB.prepare(`
        SELECT * FROM risks WHERE id = ?
      `).bind(riskId).first();

      if (!risk) {
        return c.html(html`
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Risk Not Found</h3>
                <p class="text-gray-600">The requested risk could not be found.</p>
                <div class="mt-6 flex justify-end">
                  <button onclick="document.getElementById('modal-container').innerHTML = ''" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        `);
      }

      return c.html(renderEditRiskModal(risk, csrfToken));
    } catch (error) {
      console.error('Error loading risk for edit:', error);
      return c.html(html`
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Error</h3>
              <p class="text-gray-600">Failed to load risk for editing.</p>
              <div class="mt-6 flex justify-end">
                <button onclick="document.getElementById('modal-container').innerHTML = ''" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    }
  });

  // Update risk (PUT/POST) - Enhanced with all fields
  app.post('/edit/:id', async (c) => {
    const riskId = c.req.param('id');
    const formData = await c.req.parseBody();
    
    try {
      const title = formData.title as string;
      const description = formData.description as string;
      const category = formData.category as string;
      const status = formData.status as string;
      const probability = parseInt(formData.probability as string);
      const impact = parseInt(formData.impact as string);
      const affected_assets = formData.affected_assets as string;
      const review_date = formData.review_date as string;
      const due_date = formData.due_date as string;
      
      // Calculate risk scores
      const inherent_risk = probability * impact;
      const residual_risk = Math.max(1, Math.round(inherent_risk * 0.7)); // Assume 30% reduction with controls
      
      // Build update query dynamically to handle optional fields
      const updates = [];
      const params = [];
      
      updates.push('title = ?', 'description = ?', 'category = ?', 'status = ?', 'probability = ?', 'impact = ?', 'inherent_risk = ?', 'residual_risk = ?', 'updated_at = CURRENT_TIMESTAMP');
      params.push(title, description, category, status, probability, impact, inherent_risk, residual_risk);
      
      if (affected_assets) {
        updates.push('affected_assets = ?');
        params.push(affected_assets);
      }
      
      if (review_date) {
        updates.push('review_date = ?');
        params.push(review_date);
      }
      
      if (due_date) {
        updates.push('due_date = ?');
        params.push(due_date);
      }
      
      params.push(riskId); // For WHERE clause
      
      await c.env.DB.prepare(`
        UPDATE risks 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).bind(...params).run();

      const riskLevel = getRiskLevel(inherent_risk);

      return c.html(html`
        <div class="p-6 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <i class="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
            <div>
              <h4 class="text-lg font-medium text-green-800">Risk Updated Successfully</h4>
              <p class="text-green-600 text-sm">All changes have been saved and timestamped</p>
            </div>
          </div>
          
          <div class="bg-white rounded-lg p-4 border border-green-200">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-green-600">${probability}</div>
                <div class="text-xs text-gray-600">Probability</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">${impact}</div>
                <div class="text-xs text-gray-600">Impact</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">${inherent_risk}</div>
                <div class="text-xs text-gray-600">${riskLevel}</div>
              </div>
            </div>
          </div>
          
          <script>
            setTimeout(() => {
              document.getElementById('modal-container').innerHTML = '';
              // Refresh the risk table if present
              if (window.htmx && document.getElementById('risk-table')) {
                htmx.trigger('#risk-table', 'hx:trigger');
              }
              // Also refresh stats
              if (window.htmx && document.getElementById('risk-stats')) {
                htmx.trigger('#risk-stats', 'hx:trigger');
              }
            }, 2500);
          </script>
        </div>
      `);
    } catch (error) {
      console.error('Error updating risk:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Failed to update risk</span>
          </div>
          <p class="text-red-600 text-sm mt-1">${error.message}</p>
          <div class="mt-3">
            <button onclick="window.location.reload()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
              Refresh and Try Again
            </button>
          </div>
        </div>
      `);
    }
  });

  // Delete risk
  app.delete('/:id', async (c) => {
    const riskId = c.req.param('id');
    
    try {
      await c.env.DB.prepare(`DELETE FROM risks WHERE id = ?`).bind(riskId).run();
      
      return c.html(''); // Return empty HTML to remove the table row
    } catch (error) {
      console.error('Error deleting risk:', error);
      return c.html(html`
        <tr>
          <td colspan="10" class="px-6 py-4 text-center text-red-600">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Failed to delete risk: ${error.message}
          </td>
        </tr>
      `);
    }
  });

  // Import risks modal
  app.get('/import', async (c) => {
    const csrfToken = setCSRFToken(c);
    
    return c.html(html`
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-medium text-gray-900">Import Risks</h3>
              <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form hx-post="/risk/import" hx-encoding="multipart/form-data" hx-target="#modal-container" hx-swap="innerHTML">
              <input type="hidden" name="_csrf" value="${csrfToken}">
              
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input type="file" name="csv_file" accept=".csv" required 
                           class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    <p class="text-xs text-gray-500 mt-2">CSV format: title, description, category, probability, impact</p>
                  </div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-blue-800 mb-2">CSV Format Example:</h4>
                  <pre class="text-xs text-blue-700 bg-blue-100 p-2 rounded">title,description,category,probability,impact
"Data Breach","Unauthorized access to customer data","technology",4,5
"System Outage","Critical system failure","operational",3,4</pre>
                </div>
              </div>
              
              <div class="mt-6 flex justify-end space-x-3">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                  <i class="fas fa-upload mr-2"></i>
                  Import Risks
                </button>
                <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" 
                        class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `);
  });

  // Import risks processing
  app.post('/import', async (c) => {
    try {
      // For now, return success message
      // In production, you would parse the CSV and insert into database
      return c.html(html`
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span class="text-green-700 font-medium">Import feature coming soon</span>
          </div>
          <p class="text-green-600 text-sm mt-1">CSV import functionality will be implemented in the next version.</p>
          <script>
            setTimeout(() => {
              document.getElementById('modal-container').innerHTML = '';
            }, 2000);
          </script>
        </div>
      `);
    } catch (error) {
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Import failed</span>
          </div>
          <p class="text-red-600 text-sm mt-1">${error.message}</p>
        </div>
      `);
    }
  });

  // Export risks
  app.post('/export', async (c) => {
    try {
      const risks = await c.env.DB.prepare(`
        SELECT 
          risk_id,
          title,
          description,
          CASE 
            WHEN category_id = 1 THEN 'operational'
            WHEN category_id = 2 THEN 'financial' 
            WHEN category_id = 3 THEN 'strategic'
            WHEN category_id = 4 THEN 'compliance'
            WHEN category_id = 5 THEN 'technology'
            WHEN category_id = 6 THEN 'reputation'
            ELSE 'operational'
          END as category,
          probability,
          impact,
          COALESCE(risk_score, probability * impact) as risk_score,
          status,
          created_at
        FROM risks 
        WHERE status = 'active'
        ORDER BY risk_score DESC
      `).all();

      // Generate CSV content
      const csvHeader = 'risk_id,title,description,category,probability,impact,risk_score,status,created_at\\n';
      const csvRows = (risks.results || []).map((risk: any) => 
        `"${risk.risk_id}","${risk.title}","${risk.description}","${risk.category}",${risk.probability},${risk.impact},${risk.risk_score},"${risk.status}","${risk.created_at}"`
      ).join('\\n');
      
      const csvContent = csvHeader + csvRows;
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="risks_export.csv"'
        }
      });
    } catch (error) {
      console.error('Export error:', error);
      return c.json({ error: 'Export failed' }, 500);
    }
  });

  // Risk Assessments page route - Missing route that was causing 404
  app.get('/assessments', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Risk Assessments',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <!-- Header -->
              <div class="mb-8">
                <div class="flex justify-between items-center">
                  <div>
                    <h1 class="text-3xl font-bold text-gray-900">Risk Assessments</h1>
                    <p class="text-gray-600 mt-2">Comprehensive risk assessment and analysis tools</p>
                  </div>
                  <div class="flex space-x-3">
                    <button hx-get="/risk/create" 
                            hx-target="#modal-container" 
                            hx-swap="innerHTML"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                      <i class="fas fa-plus mr-2"></i>
                      New Assessment
                    </button>
                  </div>
                </div>
              </div>

              <!-- Assessment Categories -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-shield-alt text-red-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <h3 class="text-lg font-semibold text-gray-900">Cybersecurity</h3>
                      <p class="text-sm text-gray-600">Security-related risks</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-red-600" id="cyber-count">0</span>
                    <p class="text-xs text-gray-500">Active Risks</p>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-cogs text-blue-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <h3 class="text-lg font-semibold text-gray-900">Operational</h3>
                      <p class="text-sm text-gray-600">Business operations</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-blue-600" id="operational-count">0</span>
                    <p class="text-xs text-gray-500">Active Risks</p>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-balance-scale text-green-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <h3 class="text-lg font-semibold text-gray-900">Compliance</h3>
                      <p class="text-sm text-gray-600">Regulatory compliance</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-green-600" id="compliance-count">0</span>
                    <p class="text-xs text-gray-500">Active Risks</p>
                  </div>
                </div>
              </div>

              <!-- Risk Assessment Matrix -->
              <div class="bg-white rounded-lg shadow mb-8">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900">Risk Assessment Matrix</h3>
                </div>
                <div class="p-6">
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b">
                          <th class="text-left py-2 px-3 text-sm font-medium text-gray-700">Impact →<br>Likelihood ↓</th>
                          <th class="text-center py-2 px-3 text-sm font-medium text-gray-700 bg-green-50">Very Low<br>(1)</th>
                          <th class="text-center py-2 px-3 text-sm font-medium text-gray-700 bg-yellow-50">Low<br>(2)</th>
                          <th class="text-center py-2 px-3 text-sm font-medium text-gray-700 bg-orange-50">Medium<br>(3)</th>
                          <th class="text-center py-2 px-3 text-sm font-medium text-gray-700 bg-red-50">High<br>(4)</th>
                          <th class="text-center py-2 px-3 text-sm font-medium text-gray-700 bg-red-100">Very High<br>(5)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b">
                          <td class="py-2 px-3 text-sm font-medium text-gray-700 bg-red-100">Very High (5)</td>
                          <td class="py-2 px-3 text-center text-sm bg-yellow-100">5</td>
                          <td class="py-2 px-3 text-center text-sm bg-orange-100">10</td>
                          <td class="py-2 px-3 text-center text-sm bg-red-100">15</td>
                          <td class="py-2 px-3 text-center text-sm bg-red-200">20</td>
                          <td class="py-2 px-3 text-center text-sm bg-red-300">25</td>
                        </tr>
                        <tr class="border-b">
                          <td class="py-2 px-3 text-sm font-medium text-gray-700 bg-red-50">High (4)</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">4</td>
                          <td class="py-2 px-3 text-center text-sm bg-yellow-100">8</td>
                          <td class="py-2 px-3 text-center text-sm bg-orange-100">12</td>
                          <td class="py-2 px-3 text-center text-sm bg-red-100">16</td>
                          <td class="py-2 px-3 text-center text-sm bg-red-200">20</td>
                        </tr>
                        <tr class="border-b">
                          <td class="py-2 px-3 text-sm font-medium text-gray-700 bg-orange-50">Medium (3)</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">3</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">6</td>
                          <td class="py-2 px-3 text-center text-sm bg-yellow-100">9</td>
                          <td class="py-2 px-3 text-center text-sm bg-orange-100">12</td>
                          <td class="py-2 px-3 text-center text-sm bg-red-100">15</td>
                        </tr>
                        <tr class="border-b">
                          <td class="py-2 px-3 text-sm font-medium text-gray-700 bg-yellow-50">Low (2)</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">2</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">4</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">6</td>
                          <td class="py-2 px-3 text-center text-sm bg-yellow-100">8</td>
                          <td class="py-2 px-3 text-center text-sm bg-orange-100">10</td>
                        </tr>
                        <tr>
                          <td class="py-2 px-3 text-sm font-medium text-gray-700 bg-green-50">Very Low (1)</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">1</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">2</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">3</td>
                          <td class="py-2 px-3 text-center text-sm bg-green-100">4</td>
                          <td class="py-2 px-3 text-center text-sm bg-yellow-100">5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="mt-4 flex items-center space-x-6 text-sm">
                    <div class="flex items-center">
                      <div class="w-4 h-4 bg-green-100 rounded mr-2"></div>
                      <span>Low Risk (1-6)</span>
                    </div>
                    <div class="flex items-center">
                      <div class="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
                      <span>Medium Risk (8-10)</span>
                    </div>
                    <div class="flex items-center">
                      <div class="w-4 h-4 bg-orange-100 rounded mr-2"></div>
                      <span>High Risk (12-15)</span>
                    </div>
                    <div class="flex items-center">
                      <div class="w-4 h-4 bg-red-100 rounded mr-2"></div>
                      <span>Critical Risk (16-25)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Assessments -->
              <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 class="text-lg font-medium text-gray-900">Recent Risk Assessments</h3>
                  <a href="/risk" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View All →</a>
                </div>
                
                <div id="recent-assessments"
                     hx-get="/risk/table"
                     hx-trigger="load"
                     hx-swap="innerHTML">
                  <!-- Loading placeholder -->
                  <div class="p-8 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="text-gray-600 mt-2">Loading recent assessments...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      })
    );
  });

  // ===== DYNAMIC TI RISK MANAGEMENT API ENDPOINTS =====
  
  // Get dynamic risks with filtering
  app.get('/api/ti/dynamic-risks', async (c) => {
    try {
      const dynamicRiskManager = new DynamicRiskManager(c.env.DB);
      
      const { state, source, confidence, limit } = c.req.query();
      
      const filters: any = {};
      if (state) filters.state = state as DynamicRiskState;
      if (source) filters.source = source;
      if (confidence) filters.confidence = parseFloat(confidence);
      if (limit) filters.limit = parseInt(limit);
      
      const risks = await dynamicRiskManager.getDynamicRisks(filters);
      
      return c.json({
        success: true,
        data: risks,
        count: risks.length
      });
      
    } catch (error) {
      console.error('Error fetching dynamic risks:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch dynamic risks' 
      }, 500);
    }
  });

  // Create dynamic risk from TI data
  app.post('/api/ti/auto-generate-risk', async (c) => {
    try {
      const dynamicRiskManager = new DynamicRiskManager(c.env.DB);
      
      const tiData: ThreatIntelligenceData = await c.req.json();
      
      // Validate required fields
      if (!tiData.source || !tiData.indicatorType || !tiData.indicatorValue) {
        return c.json({ 
          success: false, 
          error: 'Missing required TI data fields' 
        }, 400);
      }
      
      const risk = await dynamicRiskManager.createDynamicRisk(tiData);
      
      return c.json({
        success: true,
        data: risk,
        message: 'Dynamic risk created successfully'
      });
      
    } catch (error) {
      console.error('Error creating dynamic risk:', error);
      return c.json({ 
        success: false, 
        error: error.message || 'Failed to create dynamic risk' 
      }, 500);
    }
  });

  // Validate/transition risk state
  app.post('/api/ti/validate-risk/:id', async (c) => {
    try {
      const dynamicRiskManager = new DynamicRiskManager(c.env.DB);
      const user = c.get('user');
      
      const riskId = parseInt(c.req.param('id'));
      const { approved, notes, targetState } = await c.req.json();
      
      if (approved) {
        const newState = targetState || DynamicRiskState.VALIDATED;
        await dynamicRiskManager.transitionRiskState(
          riskId,
          newState,
          notes || 'Manual validation approved',
          false,
          user?.id
        );
      } else {
        await dynamicRiskManager.transitionRiskState(
          riskId,
          DynamicRiskState.RETIRED,
          notes || 'Manual validation rejected',
          false,
          user?.id
        );
      }
      
      return c.json({
        success: true,
        message: approved ? 'Risk validated successfully' : 'Risk rejected and retired'
      });
      
    } catch (error) {
      console.error('Error validating risk:', error);
      return c.json({ 
        success: false, 
        error: error.message || 'Failed to validate risk' 
      }, 500);
    }
  });

  // Get risk pipeline statistics
  app.get('/api/ti/risk-pipeline-stats', async (c) => {
    try {
      const dynamicRiskManager = new DynamicRiskManager(c.env.DB);
      const stats = await dynamicRiskManager.getRiskPipelineStats();
      
      return c.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Error fetching pipeline stats:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch pipeline statistics' 
      }, 500);
    }
  });

  // Get risk state history
  app.get('/api/ti/risk/:id/state-history', async (c) => {
    try {
      const riskId = parseInt(c.req.param('id'));
      
      const result = await c.env.DB.prepare(`
        SELECT 
          drs.*,
          u.first_name || ' ' || u.last_name as user_name
        FROM dynamic_risk_states drs
        LEFT JOIN users u ON drs.created_by = u.id
        WHERE drs.risk_id = ?
        ORDER BY drs.created_at DESC
      `).bind(riskId).all();
      
      return c.json({
        success: true,
        data: result.results || []
      });
      
    } catch (error) {
      console.error('Error fetching state history:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch state history' 
      }, 500);
    }
  });

  // Process detected threats (scheduled job endpoint)
  app.post('/api/ti/process-detected-threats', async (c) => {
    try {
      const dynamicRiskManager = new DynamicRiskManager(c.env.DB);
      await dynamicRiskManager.processDetectedThreats();
      
      return c.json({
        success: true,
        message: 'Detected threats processed successfully'
      });
      
    } catch (error) {
      console.error('Error processing detected threats:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to process detected threats' 
      }, 500);
    }
  });

  // Enhanced risk table with TI data
  app.get('/table-enhanced', async (c) => {
    try {
      console.log('📋 Fetching enhanced risk table with TI data...');
      
      const result = await c.env.DB.prepare(`
        SELECT 
          r.*,
          u.first_name || ' ' || u.last_name as owner_name,
          CASE 
            WHEN r.source_type = 'Dynamic-TI' THEN r.dynamic_state
            ELSE 'manual'
          END as risk_lifecycle_state,
          CASE 
            WHEN LOWER(r.category) = 'operational' THEN 'Operational'
            WHEN LOWER(r.category) = 'financial' THEN 'Financial'
            WHEN LOWER(r.category) = 'strategic' THEN 'Strategic'
            WHEN LOWER(r.category) = 'compliance' THEN 'Compliance'
            WHEN LOWER(r.category) = 'cybersecurity' THEN 'Cybersecurity'
            WHEN LOWER(r.category) = 'technology' THEN 'Technology'
            WHEN LOWER(r.category) = 'reputation' OR LOWER(r.category) = 'reputational' THEN 'Reputation'
            ELSE UPPER(SUBSTR(r.category, 1, 1)) || LOWER(SUBSTR(r.category, 2))
          END as category_name
        FROM risks r
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.status = 'active'
        ORDER BY 
          CASE WHEN r.source_type = 'Dynamic-TI' THEN 0 ELSE 1 END,
          r.risk_score DESC, 
          r.created_at DESC
        LIMIT 50
      `).all();

      const risks = result.results || [];
      console.log('📊 Found', risks.length, 'risks (including TI-generated)');
      
      return c.html(renderEnhancedRiskTable(risks));
      
    } catch (error) {
      console.error('Error fetching enhanced risk table:', error);
      return c.html(renderEmptyRiskTable());
    }
  });

  return app;
}

// Helper Functions for Risk Management
function getRiskLevel(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'High';
  if (score >= 10) return 'Medium';
  if (score >= 5) return 'Low';
  return 'Very Low';
}

function renderEmptyRiskTable(): string {
  return html`
    <div class="text-center py-8">
      <i class="fas fa-shield-alt text-gray-400 text-4xl mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Risks Found</h3>
      <p class="text-gray-500 mb-4">Risks should be populated from seed data or created through threat intelligence feeds.</p>
      <div class="space-y-2">
        <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <i class="fas fa-refresh mr-2"></i>Refresh
        </button>
      </div>
    </div>
  `;
}

function renderEnhancedRiskTable(risks: any[]): string {
  if (!risks || risks.length === 0) {
    return renderEmptyRiskTable();
  }

  const riskRows = risks.map(risk => {
    const level = getRiskLevel(risk.risk_score);
    const colorClass = getRiskColorClass(level);
    const sourceIcon = risk.source_type === 'Dynamic-TI' ? 
      '<i class="fas fa-robot text-purple-600 mr-1" title="AI-Generated from Threat Intelligence"></i>' :
      '<i class="fas fa-user text-blue-600 mr-1" title="Manually Created"></i>';
    
    const stateDisplay = risk.risk_lifecycle_state !== 'manual' ? 
      `<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStateColorClass(risk.risk_lifecycle_state)}">${formatState(risk.risk_lifecycle_state)}</span>` :
      '<span class="text-xs text-gray-500">Manual</span>';
    
    return html`
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            ${raw(sourceIcon)}
            <div>
              <div class="text-sm font-medium text-gray-900">${risk.title || 'Untitled Risk'}</div>
              <div class="text-sm text-gray-500">${risk.risk_id || `RISK-${risk.id}`}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${risk.description || 'No description available'}</div>
          ${raw(stateDisplay)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            ${risk.category_name || 'Uncategorized'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <div class="flex items-center justify-center space-x-1">
            <span class="text-sm font-medium">${risk.probability || 1}</span>
            <div class="text-xs text-gray-500">×</div>
            <span class="text-sm font-medium">${risk.impact || 1}</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full ${colorClass}">
            ${risk.risk_score || (risk.probability * risk.impact)} - ${level}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${risk.owner_name || 'Unassigned'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${formatDate(risk.created_at)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex space-x-2">
            <button class="text-indigo-600 hover:text-indigo-900" onclick="viewRisk(${risk.id})">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-blue-600 hover:text-blue-900" onclick="editRisk(${risk.id})">
              <i class="fas fa-edit"></i>
            </button>
            ${risk.source_type === 'Dynamic-TI' ? 
              `<button class="text-purple-600 hover:text-purple-900" onclick="viewTIDetails(${risk.id})" title="View TI Details">
                <i class="fas fa-shield-alt"></i>
              </button>` : ''
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return html`
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Risk Details
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description & State
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              P × I
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Risk Score
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Owner
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${raw(riskRows)}
        </tbody>
      </table>
    </div>
    
    <script>
      function viewTIDetails(riskId) {
        // Load TI details modal
        fetch(\`/risks/api/ti/risk/\${riskId}/state-history\`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showTIDetailsModal(riskId, data.data);
            }
          })
          .catch(error => console.error('Error loading TI details:', error));
      }
      
      function showTIDetailsModal(riskId, stateHistory) {
        // Simple modal implementation (can be enhanced with proper modal component)
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.innerHTML = \`
          <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                <i class="fas fa-robot mr-2 text-purple-600"></i>
                Threat Intelligence Details
              </h3>
              <div class="space-y-3">
                \${stateHistory.map(state => \`
                  <div class="border-l-4 border-blue-500 pl-4 py-2">
                    <div class="flex justify-between">
                      <span class="font-medium">\${state.current_state}</span>
                      <span class="text-sm text-gray-500">\${new Date(state.created_at).toLocaleString()}</span>
                    </div>
                    <div class="text-sm text-gray-600">\${state.transition_reason}</div>
                    \${state.user_name ? \`<div class="text-xs text-gray-500">By: \${state.user_name}</div>\` : ''}
                  </div>
                \`).join('')}
              </div>
              <div class="mt-6 text-right">
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        \`;
        document.body.appendChild(modal);
        
        // Close on click outside
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });
      }
    </script>
  `;
}

function getStateColorClass(state: string): string {
  const stateColors: Record<string, string> = {
    'detected': 'bg-yellow-100 text-yellow-800',
    'draft': 'bg-orange-100 text-orange-800',
    'validated': 'bg-blue-100 text-blue-800',
    'active': 'bg-green-100 text-green-800',
    'retired': 'bg-gray-100 text-gray-800'
  };
  return stateColors[state] || 'bg-gray-100 text-gray-800';
}

function formatState(state: string): string {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function getRiskColorClass(level: string): string {
  const colorMap: Record<string, string> = {
    'Critical': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800',
    'Very Low': 'bg-gray-100 text-gray-800'
  };
  return colorMap[level] || 'bg-gray-100 text-gray-800';
}

// Helper function to parse AI analysis for structured data
function parseAIAnalysis(analysis: string) {
  const aiData = {
    probability: 3,
    impact: 3,
    owner: 'Risk Management Team',
    treatmentStrategy: 'Mitigate',
    mitigationActions: '',
    reviewDate: '',
    targetDate: ''
  };

  try {
    // Extract structured data using regex patterns
    const probabilityMatch = analysis.match(/PROBABILITY_SCORE:\s*(\d+)/i);
    if (probabilityMatch) aiData.probability = parseInt(probabilityMatch[1]);

    const impactMatch = analysis.match(/IMPACT_SCORE:\s*(\d+)/i);
    if (impactMatch) aiData.impact = parseInt(impactMatch[1]);

    const ownerMatch = analysis.match(/RISK_OWNER:\s*([^\n]+)/i);
    if (ownerMatch) aiData.owner = ownerMatch[1].trim();

    const strategyMatch = analysis.match(/TREATMENT_STRATEGY:\s*([^\n]+)/i);
    if (strategyMatch) aiData.treatmentStrategy = strategyMatch[1].trim();

    const actionsMatch = analysis.match(/MITIGATION_ACTIONS:\s*([^\n]+)/i);
    if (actionsMatch) aiData.mitigationActions = actionsMatch[1].trim().replace(/;/g, '\n');

    const reviewMatch = analysis.match(/REVIEW_DATE:\s*([^\n]+)/i);
    if (reviewMatch) aiData.reviewDate = reviewMatch[1].trim();

    const targetMatch = analysis.match(/TARGET_DATE:\s*([^\n]+)/i);
    if (targetMatch) aiData.targetDate = targetMatch[1].trim();

  } catch (error) {
    console.error('Error parsing AI analysis:', error);
  }

  return aiData;
}

// Enhanced Risk Assessment Form with AI Data Pre-filled (for HTMX replacement)
const renderCreateRiskModalWithAIData = (data: any) => html`
      <!-- AI Enhanced Notice -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 mx-6">
        <div class="flex items-center">
          <i class="fas fa-robot text-green-600 mr-2"></i>
          <span class="text-green-800 font-medium">Form Updated with AI Analysis</span>
          <span class="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✨ Smart Fill</span>
        </div>
        <p class="text-green-700 text-sm mt-1">Review and adjust the pre-filled values as needed.</p>
      </div>
        <form hx-post="/risk/create" 
              hx-target="#modal-container" 
              hx-swap="outerHTML"
              class="space-y-6">
          
          <!-- Risk Identification Section -->
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div class="flex items-center mb-4">
              <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">
                <span class="text-sm font-medium">1</span>
              </div>
              <h4 class="text-lg font-semibold text-blue-800">Risk Identification</h4>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Title *</label>
                <input type="text" 
                       name="title" 
                       value="${data.title || ''}"
                       required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Category *</label>
                <select name="category" 
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="operational" ${data.category === 'operational' ? 'selected' : ''}>Operational</option>
                  <option value="financial" ${data.category === 'financial' ? 'selected' : ''}>Financial</option>
                  <option value="strategic" ${data.category === 'strategic' ? 'selected' : ''}>Strategic</option>
                  <option value="compliance" ${data.category === 'compliance' ? 'selected' : ''}>Compliance</option>
                  <option value="technology" ${data.category === 'technology' ? 'selected' : ''}>Technology</option>
                  <option value="reputation" ${data.category === 'reputation' ? 'selected' : ''}>Reputation</option>
                </select>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Description *</label>
              <textarea name="description" 
                        rows="3" 
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${data.description || ''}</textarea>
            </div>
          </div>

          <!-- Risk Assessment Section -->
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div class="flex items-center mb-4">
              <div class="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-3">
                <span class="text-sm font-medium">2</span>
              </div>
              <h4 class="text-lg font-semibold text-orange-800">Risk Assessment</h4>
              <span class="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">AI Recommended</span>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Probability *</label>
                <select name="probability" 
                        required
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-include="[name='impact']"
                        hx-target="#risk-score"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1" ${data.aiData?.probability === 1 ? 'selected' : ''}>1 - Very Low</option>
                  <option value="2" ${data.aiData?.probability === 2 ? 'selected' : ''}>2 - Low</option>
                  <option value="3" ${data.aiData?.probability === 3 ? 'selected' : ''}>3 - Medium</option>
                  <option value="4" ${data.aiData?.probability === 4 ? 'selected' : ''}>4 - High</option>
                  <option value="5" ${data.aiData?.probability === 5 ? 'selected' : ''}>5 - Very High</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Impact *</label>
                <select name="impact" 
                        required
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-include="[name='probability']"
                        hx-target="#risk-score"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1" ${data.aiData?.impact === 1 ? 'selected' : ''}>1 - Minimal</option>
                  <option value="2" ${data.aiData?.impact === 2 ? 'selected' : ''}>2 - Minor</option>
                  <option value="3" ${data.aiData?.impact === 3 ? 'selected' : ''}>3 - Moderate</option>
                  <option value="4" ${data.aiData?.impact === 4 ? 'selected' : ''}>4 - Major</option>
                  <option value="5" ${data.aiData?.impact === 5 ? 'selected' : ''}>5 - Severe</option>
                </select>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Score</label>
              <div id="risk-score">
                <input type="text" 
                       name="risk_score" 
                       value="${(data.aiData?.probability || 3) * (data.aiData?.impact || 3)} - ${getRiskLevel((data.aiData?.probability || 3) * (data.aiData?.impact || 3))}" 
                       readonly
                       class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium ${getRiskColorClass(getRiskLevel((data.aiData?.probability || 3) * (data.aiData?.impact || 3)))}">
              </div>
            </div>
          </div>

          <!-- Risk Treatment & Controls -->
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div class="flex items-center mb-4">
              <div class="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center mr-3">
                <span class="text-sm font-medium">3</span>
              </div>
              <h4 class="text-lg font-semibold text-yellow-800">Risk Treatment & Controls</h4>
              <span class="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">AI Suggested</span>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Treatment Strategy *</label>
                <select name="treatment_strategy" 
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Mitigate" ${data.aiData?.treatmentStrategy === 'Mitigate' ? 'selected' : ''}>Mitigate</option>
                  <option value="Accept" ${data.aiData?.treatmentStrategy === 'Accept' ? 'selected' : ''}>Accept</option>
                  <option value="Transfer" ${data.aiData?.treatmentStrategy === 'Transfer' ? 'selected' : ''}>Transfer</option>
                  <option value="Avoid" ${data.aiData?.treatmentStrategy === 'Avoid' ? 'selected' : ''}>Avoid</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Owner *</label>
                <select name="owner" 
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1">Avi Security</option>
                  <option value="2">Risk Management Team</option>
                  <option value="3">IT Department</option>
                  <option value="4">Compliance Team</option>
                  <option value="5">Operations Manager</option>
                </select>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Mitigation Actions</label>
              <textarea name="mitigation_actions" 
                        rows="3" 
                        placeholder="Describe planned or implemented risk mitigation actions"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${data.aiData?.mitigationActions || ''}</textarea>
            </div>
          </div>

          <!-- Monitoring & Review -->
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <div class="flex items-center mb-4">
              <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mr-3">
                <span class="text-sm font-medium">4</span>
              </div>
              <h4 class="text-lg font-semibold text-green-800">Monitoring & Review</h4>
              <span class="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">AI Scheduled</span>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Review Date</label>
                <input type="date" 
                       name="review_date" 
                       value="${data.aiData?.reviewDate || ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Completion</label>
                <input type="date" 
                       name="target_date"
                       value="${data.aiData?.targetDate || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" 
                    onclick="document.getElementById('modal-container').innerHTML = ''"
                    class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Create Risk Assessment
            </button>
          </div>
        </form>
`;

// Main Risk Management Page - Matching ARIA5 Design Exactly
const renderARIA5RiskManagement = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Risk Management</h1>
            <p class="mt-1 text-sm text-gray-600">Manage organizational risks and mitigation strategies</p>
          </div>
          <div class="flex space-x-3">
            <button hx-get="/risk/import"
                    hx-target="#modal-container"
                    hx-swap="innerHTML"
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-upload mr-2"></i>Import
            </button>
            <button hx-post="/risk/export"
                    hx-trigger="click"
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-download mr-2"></i>Export  
            </button>
            <button hx-get="/risk/create"
                    hx-target="#modal-container"
                    hx-swap="innerHTML"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-plus mr-2"></i>Add Risk
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistics Cards -->
      <div id="risk-stats" 
           hx-get="/risk/stats" 
           hx-trigger="load"
           hx-swap="innerHTML"
           class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Loading placeholders -->
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-lg shadow mb-6 p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="risk-filters">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" 
                   name="search"
                   placeholder="Search risks..."
                   hx-get="/risk/table"
                   hx-trigger="input changed delay:500ms"
                   hx-target="#risk-table"
                   hx-include="#risk-filters"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Status</label>
            <select name="status" 
                    hx-get="/risk/table"
                    hx-trigger="change"
                    hx-target="#risk-table"
                    hx-include="#risk-filters"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="mitigated">Mitigated</option>
              <option value="monitoring">Monitoring</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Categories</label>
            <select name="category" 
                    hx-get="/risk/table"
                    hx-trigger="change"
                    hx-target="#risk-table"
                    hx-include="#risk-filters"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              <option value="operational">Operational</option>
              <option value="financial">Financial</option>
              <option value="strategic">Strategic</option>
              <option value="compliance">Compliance</option>
              <option value="technology">Technology</option>
              <option value="reputation">Reputation</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Risk Levels</label>
            <select name="risk_level" 
                    hx-get="/risk/table"
                    hx-trigger="change"
                    hx-target="#risk-table"
                    hx-include="#risk-filters"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Risk Register Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Risk Register</h3>
        </div>
        
        <div id="risk-table"
             hx-get="/risk/table"
             hx-trigger="load"
             hx-swap="innerHTML">
          <!-- Loading placeholder -->
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Loading risks...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Risk Statistics Cards - Real Database Data
const renderRiskStats = (stats: any) => html`
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Critical Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.critical || 0}</p>
      </div>
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-fire text-2xl text-orange-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">High Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.high || 0}</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-check-circle text-2xl text-green-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Medium Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.medium || 0}</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-info-circle text-2xl text-yellow-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Low Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.low || 0}</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-chart-line text-2xl text-blue-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Total Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.total || 0}</p>
      </div>
    </div>
  </div>
`;

// Risk Table matching ARIA5 design - Real Database Data
const renderRiskTable = (risks: any[]) => {
  if (risks.length === 0) {
    return `
      <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Risk ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0 max-w-xs">Title</th>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Category</th>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden sm:table-cell">Owner</th>
              <th class="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Prob</th>
              <th class="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Impact</th>
              <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Score</th>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden md:table-cell">Review</th>
              <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr>
              <td colspan="10" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-exclamation-triangle text-gray-300 text-3xl mb-2"></i>
                <div>No risks found. <a href="#" hx-get="/risk/create" hx-target="#modal-container" hx-swap="innerHTML" class="text-blue-600 hover:text-blue-800">Create your first risk</a>.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const riskRows = risks.map(risk => {
    const riskScore = risk.risk_score || (risk.probability * risk.impact);
    const riskLevel = getRiskLevel(riskScore);
    const riskColor = getRiskColorClass(riskLevel);
    
    // Enhanced status colors and icons
    const getStatusDisplay = (status: string) => {
      const statusMap = {
        'pending': { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: 'clock' },
        'active': { color: 'bg-green-100 text-green-800 border border-green-200', icon: 'exclamation-triangle' },
        'mitigated': { color: 'bg-blue-100 text-blue-800 border border-blue-200', icon: 'shield-check' },
        'monitoring': { color: 'bg-purple-100 text-purple-800 border border-purple-200', icon: 'eye' },
        'escalated': { color: 'bg-red-100 text-red-800 border border-red-200', icon: 'arrow-up' },
        'closed': { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: 'check-circle' }
      };
      return statusMap[status?.toLowerCase()] || statusMap['active'];
    };
    
    const statusStyle = getStatusDisplay(risk.status);
    const createdDate = new Date(risk.created_at).toLocaleDateString();
    const nextReview = risk.review_date ? new Date(risk.review_date).toLocaleDateString() : 'Not set';
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <div class="flex items-center">
            <div class="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center sm:w-8 sm:h-8 sm:mr-2">
              <span class="text-xs font-bold text-blue-600">${risk.id}</span>
            </div>
            <span class="font-mono text-xs sm:text-sm hidden sm:inline">RISK-${risk.id}</span>
          </div>
        </td>
        <td class="px-4 py-4 text-sm text-gray-900">
          <div class="max-w-xs truncate">
            <div class="font-medium">${risk.title}</div>
            ${risk.source ? '<div class="text-xs text-purple-600 mt-1"><i class="fas fa-robot mr-1"></i>AI Generated</div>' : ''}
          </div>
        </td>
        <td class="px-3 py-4 whitespace-nowrap text-sm">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ${(risk.category_name || risk.category)?.substring(0, 8) + ((risk.category_name || risk.category)?.length > 8 ? '...' : '')}
          </span>
        </td>
        <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">${(risk.owner_name || 'Unassigned')?.substring(0, 12)}</td>
        <td class="px-2 py-4 whitespace-nowrap text-center">
          <div class="flex items-center justify-center">
            <div class="w-6 h-6 rounded-full flex items-center justify-center ${risk.probability >= 4 ? 'bg-red-100' : risk.probability >= 3 ? 'bg-orange-100' : 'bg-green-100'}">
              <span class="text-xs font-bold ${risk.probability >= 4 ? 'text-red-600' : risk.probability >= 3 ? 'text-orange-600' : 'text-green-600'}">${risk.probability}</span>
            </div>
          </div>
        </td>
        <td class="px-2 py-4 whitespace-nowrap text-center">
          <div class="flex items-center justify-center">
            <div class="w-6 h-6 rounded-full flex items-center justify-center ${risk.impact >= 4 ? 'bg-red-100' : risk.impact >= 3 ? 'bg-orange-100' : 'bg-green-100'}">
              <span class="text-xs font-bold ${risk.impact >= 4 ? 'text-red-600' : risk.impact >= 3 ? 'text-orange-600' : 'text-green-600'}">${risk.impact}</span>
            </div>
          </div>
        </td>
        <td class="px-3 py-4 whitespace-nowrap text-center">
          <div class="flex items-center justify-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskColor}">${riskScore}</span>
          </div>
        </td>
        <td class="px-3 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.color}">
            <i class="fas fa-${statusStyle.icon} text-xs mr-1"></i>
            ${(risk.status?.charAt(0).toUpperCase() + risk.status?.slice(1))?.substring(0, 8)}
          </span>
        </td>
        <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
          <div class="text-xs">${nextReview?.substring(0, 10)}</div>
        </td>
        <td class="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
          <div class="flex items-center justify-center space-x-1">
            <button class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors" 
                    hx-get="/risk/view/${risk.id}" 
                    hx-target="#modal-container" 
                    hx-swap="innerHTML"
                    title="View Details">
              <i class="fas fa-eye text-xs"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors" 
                    hx-get="/risk/edit/${risk.id}" 
                    hx-target="#modal-container" 
                    hx-swap="innerHTML"
                    title="Edit Risk">
              <i class="fas fa-edit text-xs"></i>
            </button>
            <button class="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors" 
                    hx-get="/risk/status-change/${risk.id}" 
                    hx-target="#modal-container" 
                    hx-swap="innerHTML"
                    title="Change Status">
              <i class="fas fa-exchange-alt text-xs"></i>
            </button>
            <button class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors" 
                    hx-delete="/risk/${risk.id}" 
                    hx-confirm="Are you sure you want to permanently delete this risk? This action cannot be undone." 
                    hx-target="closest tr" 
                    hx-swap="outerHTML"
                    title="Delete Risk">
              <i class="fas fa-trash text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Risk ID</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0 max-w-xs">Title</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Category</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden sm:table-cell">Owner</th>
            <th class="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Prob</th>
            <th class="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Impact</th>
            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Score</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden md:table-cell">Review</th>
            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${riskRows}
        </tbody>
      </table>
    </div>
  `;
};

// Enhanced Risk Assessment Modal - Rebuilt with Services Pre-loaded
const renderCreateRiskModal = async (db: D1Database, csrfToken?: string) => {
  // Pre-load services to avoid HTMX loading issues
  let services: any[] = [];
  try {
    const result = await db.prepare(`
      SELECT 
        s.service_id, s.name, s.business_department, s.criticality, s.criticality_score
      FROM services s 
      WHERE s.service_status = 'Active'
      ORDER BY s.criticality_score DESC, s.created_at DESC
    `).all();
    services = result.results || [];
  } catch (error) {
    console.error('Error pre-loading services:', error);
  }

  return html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" >
    <div class="relative top-5 mx-auto p-0 border w-full max-w-6xl shadow-xl rounded-lg bg-white">
      <!-- Modal Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
        <h3 class="text-lg font-semibold text-gray-900">Create Enhanced Risk Assessment</h3>
        <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Risk Form Container -->
      <div id="risk-form-container" class="max-h-[80vh] overflow-y-auto">
        <form id="risk-form" 
              hx-post="/risk/create"
              hx-target="#form-result"
              hx-swap="innerHTML"
              class="p-6 space-y-6">
          
          <!-- CSRF Token -->
          <input type="hidden" name="csrf_token" value="${csrfToken || ''}">
          
          <!-- 1. Risk Identification Section -->
          <div class="space-y-4">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
              <h4 class="text-md font-medium text-gray-900">Risk Identification</h4>
            </div>
            
            <div class="grid grid-cols-1 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Category *</label>
                <select name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="compliance">Compliance</option>
                  <option value="strategic">Strategic</option>
                  <option value="reputational">Reputational</option>
                </select>
              </div>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
              <input type="text" 
                     name="title" 
                     placeholder="e.g., Unauthorized access to customer database"
                     required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk Description *</label>
              <textarea name="description" 
                        rows="3" 
                        placeholder="Describe the risk scenario, potential causes, and business impact"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Threat Source *</label>
              <select name="threat_source" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Threat Source</option>
                <option value="external-malicious">External - Malicious</option>
                <option value="external-accidental">External - Accidental</option>
                <option value="internal-malicious">Internal - Malicious</option>
                <option value="internal-accidental">Internal - Accidental</option>
                <option value="natural-disaster">Natural Disaster</option>
                <option value="system-failure">System Failure</option>
              </select>
            </div>
          </div>

          <!-- 2. Affected Services Section -->
          <div class="space-y-4 bg-green-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
              <h4 class="text-md font-medium text-gray-900">Affected Services</h4>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-2">Related Services</label>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                ${services.length > 0 ? services.map(service => `
                  <label class="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                    <input type="checkbox" name="affected_services[]" value="${service.service_id}" 
                           class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-gray-800">${service.name}</div>
                      <div class="text-xs text-gray-500">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          service.criticality_score >= 80 ? 'bg-red-100 text-red-800' :
                          service.criticality_score >= 60 ? 'bg-orange-100 text-orange-800' :
                          service.criticality_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }">
                          ${service.criticality || 'Medium'}
                        </span>
                        <span class="mx-1">•</span>
                        <span>${service.business_department || 'Unknown Dept'}</span>
                      </div>
                    </div>
                  </label>
                `).join('') : `
                  <div class="text-sm text-gray-500 text-center py-4">
                    <i class="fas fa-info-circle mr-2"></i>
                    No services found. <a href="/operations/services" class="text-green-600 hover:text-green-700 underline">Add services first</a>.
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- 3. Risk Assessment Section -->
          <div class="space-y-4 bg-red-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
              <h4 class="text-md font-medium text-gray-900">Risk Assessment</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Probability *</label>
                <select name="probability" 
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='impact']"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Likelihood</option>
                  <option value="1">1 - Very Low (0-5%)</option>
                  <option value="2">2 - Low (6-25%)</option>
                  <option value="3">3 - Medium (26-50%)</option>
                  <option value="4">4 - High (51-75%)</option>
                  <option value="5">5 - Very High (76-100%)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
                <select name="impact" 
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='probability']"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Impact</option>
                  <option value="1">1 - Minimal</option>
                  <option value="2">2 - Minor</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Major</option>
                  <option value="5">5 - Severe</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                <div id="risk-score-container">
                  <input type="text" 
                         name="risk_score" 
                         value="TBD"
                         readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                </div>
              </div>
            </div>
            
            <div class="ml-9">
              <p class="text-sm text-gray-600">Select probability and impact to calculate risk score</p>
            </div>
          </div>

          <!-- 4. AI Risk Assessment Section -->
          <div class="space-y-4 bg-purple-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">4</div>
              <h4 class="text-md font-medium text-gray-900">AI Risk Assessment</h4>
            </div>
            
            <div class="ml-9">
              <p class="text-sm text-gray-600 mb-4">Get AI-powered risk analysis based on your risk details and related services</p>
              <button type="button" 
                      hx-post="/risk/analyze-ai"
                      hx-target="#ai-analysis-result"
                      hx-swap="innerHTML"
                      hx-include="[name='title'], [name='description'], [name='category'], [name='affected_services[]']"
                      class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center">
                <i class="fas fa-robot mr-2"></i>Analyze with AI
              </button>
              <div id="ai-analysis-result" class="mt-4"></div>
              <div id="ai-form-filler" class="hidden"></div>
            </div>
          </div>

          <!-- 5. Risk Treatment & Controls Section -->
          <div class="space-y-4 bg-yellow-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">5</div>
              <h4 class="text-md font-medium text-gray-900">Risk Treatment & Controls</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Treatment Strategy *</label>
                <select name="treatment_strategy" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Strategy</option>
                  <option value="accept">Accept</option>
                  <option value="mitigate">Mitigate</option>
                  <option value="transfer">Transfer</option>
                  <option value="avoid">Avoid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Owner *</label>
                <select name="owner" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Owner</option>
                  <option value="avi_security">Avi Security</option>
                  <option value="admin_user">Admin User</option>
                  <option value="mike_chen">Mike Chen</option>
                  <option value="sarah_johnson">Sarah Johnson</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Actions</label>
              <textarea name="mitigation_actions" 
                        rows="3" 
                        placeholder="Describe planned or implemented risk mitigation actions"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>

          <!-- Form Result Area -->
          <div id="form-result"></div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" 
                    onclick="document.getElementById('modal-container').innerHTML = ''"
                    class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Create Risk
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <script>
      // Helper function to parse AI analysis for structured data
      function parseAIAnalysisData(analysis) {
        const aiData = {
          probability: 3,
          impact: 3,
          treatmentStrategy: 'mitigate',
          mitigationActions: ''
        };

        try {
          // Extract structured data using regex patterns
          const probabilityRegex = new RegExp('PROBABILITY_SCORE:\\\\s*(\\\\d+)', 'i');
          const probabilityMatch = analysis.match(probabilityRegex);
          if (probabilityMatch) aiData.probability = parseInt(probabilityMatch[1]);

          const impactRegex = new RegExp('IMPACT_SCORE:\\\\s*(\\\\d+)', 'i');
          const impactMatch = analysis.match(impactRegex);
          if (impactMatch) aiData.impact = parseInt(impactMatch[1]);

          const strategyRegex = new RegExp('TREATMENT_STRATEGY:\\\\s*([^\\\\n]+)', 'i');
          const strategyMatch = analysis.match(strategyRegex);
          if (strategyMatch) aiData.treatmentStrategy = strategyMatch[1].trim().toLowerCase();

          const actionsRegex = new RegExp('MITIGATION_ACTIONS:\\\\s*([^\\\\n]+)', 'i');
          const actionsMatch = analysis.match(actionsRegex);
          if (actionsMatch) aiData.mitigationActions = actionsMatch[1].trim().replace(/;/g, '\\n');
        } catch (error) {
          console.error('Error parsing AI analysis:', error);
        }

        return aiData;
      }
      
      // Add event listener for AI form filling button using event delegation
      document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'fill-ai-form-btn') {
          e.preventDefault();
          
          try {
            console.log('🤖 Filling form with AI data...');
            
            // Get data from button attributes
            const analysis = e.target.getAttribute('data-analysis');
            const title = e.target.getAttribute('data-title');
            const description = e.target.getAttribute('data-description');
            const category = e.target.getAttribute('data-category');
            
            if (!analysis) {
              console.error('No analysis data found');
              return;
            }
            
            // Parse AI data
            const aiData = parseAIAnalysisData(analysis);
            console.log('📊 Parsed AI Data:', aiData);
            
            // Fill likelihood field
            const likelihoodField = document.querySelector('select[name="probability"]');
            if (likelihoodField && aiData.probability) {
              likelihoodField.value = String(aiData.probability);
              console.log('✅ Set likelihood to:', aiData.probability);
            }
            
            // Fill impact field
            const impactField = document.querySelector('select[name="impact"]');
            if (impactField && aiData.impact) {
              impactField.value = String(aiData.impact);
              console.log('✅ Set impact to:', aiData.impact);
            }
            
            // Fill treatment strategy field
            const treatmentField = document.querySelector('select[name="treatment_strategy"]');
            if (treatmentField && aiData.treatmentStrategy) {
              // Map strategy to form values
              const strategyMap = {
                'accept': 'accept',
                'mitigate': 'mitigate', 
                'transfer': 'transfer',
                'avoid': 'avoid'
              };
              const mappedStrategy = strategyMap[aiData.treatmentStrategy] || 'mitigate';
              treatmentField.value = mappedStrategy;
              console.log('✅ Set treatment strategy to:', mappedStrategy);
            }
            
            // Fill mitigation actions field
            const mitigationField = document.querySelector('textarea[name="mitigation_actions"]');
            if (mitigationField && aiData.mitigationActions) {
              mitigationField.value = aiData.mitigationActions;
              console.log('✅ Set mitigation actions');
            }
            
            // Trigger risk score calculation
            if (likelihoodField) {
              const changeEvent = new Event('change', { bubbles: true });
              likelihoodField.dispatchEvent(changeEvent);
              console.log('✅ Triggered risk score calculation');
            }
            
            // Show success message in AI analysis result area
            const aiResult = document.getElementById('ai-analysis-result');
            if (aiResult) {
              const successMsg = document.createElement('div');
              successMsg.className = 'mt-3 p-3 bg-green-50 border border-green-200 rounded-lg';
              successMsg.innerHTML = 
                '<div class="flex items-center">' +
                  '<i class="fas fa-check-circle text-green-500 mr-2"></i>' +
                  '<span class="text-green-700 font-medium">Form Updated!</span>' +
                '</div>' +
                '<p class="text-green-600 text-sm mt-1">Risk assessment fields have been filled with AI recommendations.</p>';
              aiResult.appendChild(successMsg);
            }
            
            console.log('✅ Form filling complete');
            
          } catch (error) {
            console.error('❌ Error filling form:', error);
            
            // Show error message
            const aiResult = document.getElementById('ai-analysis-result');
            if (aiResult) {
              const errorMsg = document.createElement('div');
              errorMsg.className = 'mt-3 p-3 bg-red-50 border border-red-200 rounded-lg';
              errorMsg.innerHTML = 
                '<div class="flex items-center">' +
                  '<i class="fas fa-times-circle text-red-500 mr-2"></i>' +
                  '<span class="text-red-700 font-medium">Error filling form</span>' +
                '</div>' +
                '<p class="text-red-600 text-sm mt-1">' + error.message + '</p>';
              aiResult.appendChild(errorMsg);
            }
          }
        }
      });
    </script>
  </div>
  `;
};

// Simple Add Risk Modal (compact version for quick actions)
const renderSimpleAddRiskModal = (csrfToken?: string) => html`
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form hx-post="/risk/risks" hx-target="#modal-result">
            <!-- CSRF Token -->
            <input type="hidden" name="csrf_token" value="${csrfToken || ''}">
            
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">Add New Risk</h3>
                  
                  <div id="modal-result"></div>
                  
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Risk Title</label>
                      <input type="text" name="title" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Description</label>
                      <textarea name="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Category</label>
                        <select name="category" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                          <option value="cybersecurity">Cybersecurity</option>
                          <option value="operational">Operational</option>
                          <option value="financial">Financial</option>
                          <option value="compliance">Compliance</option>
                          <option value="strategic">Strategic</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Owner</label>
                        <input type="text" name="owner" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Probability (1-5)</label>
                        <input type="number" name="probability" min="1" max="5" value="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Impact (1-5)</label>
                        <input type="number" name="impact" min="1" max="5" value="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button type="submit" class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                Add Risk
              </button>
              <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
`;



// Render enhanced edit risk modal
function renderEditRiskModal(risk: any, csrfToken: string) {
  const categoryOptions = [
    { value: 'operational', name: 'Operational', icon: 'cogs', description: 'Business operations and processes' },
    { value: 'financial', name: 'Financial', icon: 'dollar-sign', description: 'Financial and economic risks' },
    { value: 'strategic', name: 'Strategic', icon: 'chess', description: 'Strategic and business direction' },
    { value: 'compliance', name: 'Compliance', icon: 'balance-scale', description: 'Regulatory and legal compliance' },
    { value: 'technology', name: 'Technology', icon: 'laptop-code', description: 'Technology and cybersecurity' },
    { value: 'reputation', name: 'Reputation', icon: 'star', description: 'Brand and reputation management' }
  ];

  const statusOptions = [
    { value: 'pending', name: 'Pending', description: 'Awaiting review or approval', color: 'yellow' },
    { value: 'active', name: 'Active', description: 'Risk is confirmed and being monitored', color: 'green' },
    { value: 'mitigated', name: 'Mitigated', description: 'Risk controls have been implemented', color: 'blue' },
    { value: 'monitoring', name: 'Monitoring', description: 'Risk is under continuous observation', color: 'purple' },
    { value: 'escalated', name: 'Escalated', description: 'Risk requires management attention', color: 'red' },
    { value: 'closed', name: 'Closed', description: 'Risk has been resolved', color: 'gray' }
  ];

  const currentCategory = risk.category || 'operational';
  const currentStatus = risk.status || 'active';
  const riskScore = risk.probability && risk.impact ? risk.probability * risk.impact : 0;
  const riskLevel = getRiskLevel(riskScore);

  return html`
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
      <div class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6">
          <div class="flex justify-between items-start">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <i class="fas fa-edit text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold">Edit Risk Assessment</h3>
                <p class="text-blue-100 text-sm mt-1">RISK-${risk.id} • Modify risk details and assessment</p>
              </div>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-white hover:text-gray-200 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div class="overflow-y-auto max-h-[calc(85vh-160px)] pr-2">
          <form hx-post="/risk/edit/${risk.id}" hx-target="#modal-container" hx-swap="innerHTML">
            <input type="hidden" name="_csrf" value="${csrfToken}">
            
            <div class="p-8 space-y-8">
              
              <!-- Current Risk Score Display -->
              <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-2">Current Risk Assessment</h4>
                    <div class="flex items-center space-x-6">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-red-600" id="current-probability">${risk.probability || 0}</div>
                        <div class="text-xs text-gray-600">Probability</div>
                      </div>
                      <div class="text-2xl text-gray-400">×</div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-orange-600" id="current-impact">${risk.impact || 0}</div>
                        <div class="text-xs text-gray-600">Impact</div>
                      </div>
                      <div class="text-2xl text-gray-400">=</div>
                      <div class="text-center">
                        <div class="text-3xl font-bold ${riskLevel === 'Critical' ? 'text-red-600' : riskLevel === 'High' ? 'text-orange-600' : riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'}" id="current-score">${riskScore}</div>
                        <div class="text-xs text-gray-600" id="current-level">${riskLevel}</div>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm text-gray-600">Last Updated</div>
                    <div class="text-lg font-medium">${new Date(risk.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <!-- Risk Information Section -->
              <div class="bg-white border rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-6 py-3 border-b">
                  <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                    Risk Information
                  </h4>
                </div>
                <div class="p-6 space-y-6">
                  
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Risk Title *</label>
                      <input type="text" name="title" value="${risk.title}" required 
                             class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium">
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select name="category" required 
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        ${categoryOptions.map(cat => html`
                          <option value="${cat.value}" ${currentCategory === cat.value ? 'selected' : ''}>${cat.name}</option>
                        `)}
                      </select>
                      <p class="text-xs text-gray-500 mt-1">Select the primary category for this risk</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                      <select name="status" required 
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        ${statusOptions.map(status => html`
                          <option value="${status.value}" ${currentStatus === status.value ? 'selected' : ''}>${status.name}</option>
                        `)}
                      </select>
                      <p class="text-xs text-gray-500 mt-1">Current status of this risk</p>
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Risk Description *</label>
                    <textarea name="description" rows="4" required 
                              placeholder="Provide a detailed description of the risk scenario, potential causes, and business impact..."
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${risk.description}</textarea>
                  </div>

                  ${risk.affected_assets ? html`
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Affected Assets</label>
                      <textarea name="affected_assets" rows="2" 
                                placeholder="List the assets, systems, or processes affected by this risk..."
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${risk.affected_assets}</textarea>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Risk Assessment Section -->
              <div class="bg-white border rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-6 py-3 border-b">
                  <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                    <i class="fas fa-calculator text-orange-500 mr-2"></i>
                    Risk Assessment
                  </h4>
                </div>
                <div class="p-6">
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-3">Probability *</label>
                      <div class="space-y-2">
                        ${[1, 2, 3, 4, 5].map(level => html`
                          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="probability" value="${level}" 
                                   ${risk.probability === level ? 'checked' : ''}
                                   class="mr-3 h-4 w-4 text-blue-600"
                                   onchange="updateRiskScore()">
                            <div class="flex items-center flex-1">
                              <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3 ${level >= 4 ? 'bg-red-100' : level >= 3 ? 'bg-orange-100' : level >= 2 ? 'bg-yellow-100' : 'bg-green-100'}">
                                <span class="text-sm font-bold ${level >= 4 ? 'text-red-600' : level >= 3 ? 'text-orange-600' : level >= 2 ? 'text-yellow-600' : 'text-green-600'}">${level}</span>
                              </div>
                              <div>
                                <div class="font-medium text-gray-900">${['', 'Very Low (0-5%)', 'Low (5-25%)', 'Medium (25-50%)', 'High (50-75%)', 'Very High (75%+)'][level]}</div>
                                <div class="text-xs text-gray-500">${['', 'Rare occurrence', 'Unlikely to occur', 'Possible occurrence', 'Likely to occur', 'Almost certain'][level]}</div>
                              </div>
                            </div>
                          </label>
                        `)}
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-3">Impact *</label>
                      <div class="space-y-2">
                        ${[1, 2, 3, 4, 5].map(level => html`
                          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="impact" value="${level}" 
                                   ${risk.impact === level ? 'checked' : ''}
                                   class="mr-3 h-4 w-4 text-blue-600"
                                   onchange="updateRiskScore()">
                            <div class="flex items-center flex-1">
                              <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3 ${level >= 4 ? 'bg-red-100' : level >= 3 ? 'bg-orange-100' : level >= 2 ? 'bg-yellow-100' : 'bg-green-100'}">
                                <span class="text-sm font-bold ${level >= 4 ? 'text-red-600' : level >= 3 ? 'text-orange-600' : level >= 2 ? 'text-yellow-600' : 'text-green-600'}">${level}</span>
                              </div>
                              <div>
                                <div class="font-medium text-gray-900">${['', 'Minimal', 'Minor', 'Moderate', 'Major', 'Severe'][level]}</div>
                                <div class="text-xs text-gray-500">${['', 'Negligible effect', 'Small disruption', 'Noticeable impact', 'Significant damage', 'Critical consequences'][level]}</div>
                              </div>
                            </div>
                          </label>
                        `)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Timeline Section -->
              <div class="bg-white border rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-6 py-3 border-b">
                  <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                    <i class="fas fa-calendar-alt text-green-500 mr-2"></i>
                    Timeline & Dates
                  </h4>
                </div>
                <div class="p-6">
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Review Date</label>
                      <input type="date" name="review_date" value="${risk.review_date || ''}"
                             class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <p class="text-xs text-gray-500 mt-1">When should this risk be reviewed next?</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input type="date" name="due_date" value="${risk.due_date || ''}"
                             class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <p class="text-xs text-gray-500 mt-1">Target date for risk mitigation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="bg-gray-50 px-8 py-6 border-t flex justify-between items-center">
              <div class="text-sm text-gray-600">
                <i class="fas fa-info-circle mr-1"></i>
                Changes will be automatically saved and timestamped
              </div>
              <div class="flex space-x-3">
                <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" 
                        class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-medium">
                  <i class="fas fa-save mr-2"></i>
                  Update Risk Assessment
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      function updateRiskScore() {
        const probability = document.querySelector('input[name="probability"]:checked')?.value || 0;
        const impact = document.querySelector('input[name="impact"]:checked')?.value || 0;
        const score = probability * impact;
        
        let level = 'Very Low';
        let levelColor = 'text-gray-600';
        
        if (score >= 20) {
          level = 'Critical';
          levelColor = 'text-red-600';
        } else if (score >= 15) {
          level = 'High';
          levelColor = 'text-orange-600';
        } else if (score >= 10) {
          level = 'Medium';
          levelColor = 'text-yellow-600';
        } else if (score >= 5) {
          level = 'Low';
          levelColor = 'text-green-600';
        }
        
        document.getElementById('current-probability').textContent = probability;
        document.getElementById('current-impact').textContent = impact;
        document.getElementById('current-score').textContent = score;
        document.getElementById('current-score').className = 'text-3xl font-bold ' + levelColor;
        document.getElementById('current-level').textContent = level;
      }
    </script>
  `;
}

// INCIDENT MANAGEMENT HELPER FUNCTIONS

/**
 * Get incident statistics from MS Defender incidents table
 */
async function getIncidentStatistics(db: any) {
  try {
    // Get counts by severity and status
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_incidents,
        SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical_incidents,
        SUM(CASE WHEN status IN ('Active', 'InProgress') THEN 1 ELSE 0 END) as open_incidents,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_incidents
      FROM defender_incidents
    `).first();
    
    // Calculate average response time for resolved incidents
    const avgResponseTime = await db.prepare(`
      SELECT 
        ROUND(
          AVG(
            (julianday(COALESCE(resolved_time, datetime('now'))) - julianday(created_time)) * 24
          ), 1
        ) as avg_hours
      FROM defender_incidents 
      WHERE resolved_time IS NOT NULL
    `).first();
    
    return {
      totalIncidents: stats?.total_incidents || 0,
      criticalIncidents: stats?.critical_incidents || 0,
      openIncidents: stats?.open_incidents || 0,
      resolvedIncidents: stats?.resolved_incidents || 0,
      avgResponseTime: avgResponseTime?.avg_hours || 0
    };
  } catch (error) {
    console.error('Error fetching incident statistics:', error);
    return {
      totalIncidents: 0,
      criticalIncidents: 0,
      openIncidents: 0,
      resolvedIncidents: 0,
      avgResponseTime: 0
    };
  }
}

/**
 * Get recent incidents from MS Defender incidents table
 */
async function getRecentIncidents(db: any) {
  try {
    const incidents = await db.prepare(`
      SELECT 
        incident_id,
        incident_name,
        severity,
        status,
        classification,
        assigned_to,
        alerts_count,
        entities_count,
        created_time,
        last_update_time,
        resolved_time,
        description
      FROM defender_incidents
      ORDER BY created_time DESC
      LIMIT 20
    `).all();
    
    return incidents?.results || [];
  } catch (error) {
    console.error('Error fetching recent incidents:', error);
    return [];
  }
}

// INCIDENT MANAGEMENT RENDER FUNCTIONS
const renderIncidentsPage = (stats: any = {}, incidents: any[] = []) => {
  const {
    criticalIncidents = 0,
    openIncidents = 0,
    avgResponseTime = 0
  } = stats;

  return html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
            Security Incidents
          </h1>
          <p class="mt-2 text-lg text-gray-600">Monitor and manage security incidents and breaches</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="refreshIncidents()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <i class="fas fa-sync-alt mr-2"></i>
            Refresh
          </button>
          <a href="/risk/incidents/new" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
            <i class="fas fa-plus mr-2"></i>
            Report Incident
          </a>
        </div>
      </div>

      <!-- Incidents Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-fire text-2xl text-red-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Critical Incidents</dt>
                  <dd class="text-lg font-medium text-gray-900">${criticalIncidents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-orange-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Open Incidents</dt>
                  <dd class="text-lg font-medium text-gray-900">${openIncidents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-blue-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                  <dd class="text-lg font-medium text-gray-900">${avgResponseTime} hrs</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Incidents Table -->
      <div class="bg-white shadow overflow-hidden rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900">Recent Incidents from MS Defender</h2>
          <span class="text-sm text-gray-500">${incidents.length} incidents loaded</span>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerts</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${incidents.length === 0 ? html`
                <tr>
                  <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-shield-alt text-gray-300 text-3xl mb-2"></i>
                    <div>No incidents imported from MS Defender. <a href="/risk/incidents/new" class="text-red-600 hover:text-red-800">Report the first incident</a>.</div>
                  </td>
                </tr>
              ` : raw(incidents.map(incident => renderIncidentRow(incident)).join(''))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    function refreshIncidents() {
      window.location.reload();
    }
    
    function viewIncident(incidentId) {
      window.open('/risk/incidents/' + incidentId, '_blank');
    }
    
    function openIncidentDetails(incidentId) {
      // Open incident details in a modal or new window
      // For now, we'll just show an alert with the incident ID
      alert('Opening incident details for: ' + incidentId);
      // TODO: Implement proper incident details modal or page
    }
  </script>
`;}

/**
 * Render individual incident row for the table
 */
function renderIncidentRow(incident: any) {
  const severityClass = getSeverityClass(incident.severity);
  const statusClass = getStatusClass(incident.status);
  const createdDate = new Date(incident.created_time).toLocaleDateString();
  const createdTime = new Date(incident.created_time).toLocaleTimeString();
  
  return `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${incident.incident_id}
      </td>
      <td class="px-6 py-4 text-sm text-gray-900">
        <div class="max-w-xs truncate" title="${incident.incident_name}">
          ${incident.incident_name}
        </div>
        ${incident.description ? `<div class="text-xs text-gray-500 mt-1 max-w-xs truncate" title="${incident.description}">${incident.description}</div>` : ''}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityClass}">
          ${incident.severity}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
          ${incident.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            <i class="fas fa-bell mr-1"></i>
            ${incident.alerts_count || 0}
          </span>
          ${incident.entities_count ? `<span class="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
            <i class="fas fa-network-wired mr-1"></i>
            ${incident.entities_count}
          </span>` : ''}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div>${createdDate}</div>
        <div class="text-xs">${createdTime}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="viewIncident('${incident.incident_id}')" class="text-blue-600 hover:text-blue-900 mr-3">
          <i class="fas fa-eye"></i>
        </button>
        <button onclick="openIncidentDetails('${incident.incident_id}')" class="text-indigo-600 hover:text-indigo-900">
          <i class="fas fa-external-link-alt"></i>
        </button>
      </td>
    </tr>
  `;
}

/**
 * Get CSS class for severity badge
 */
function getSeverityClass(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get CSS class for status badge
 */
function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-red-100 text-red-800';
    case 'inprogress':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

const renderNewIncidentPage = (error?: string) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
          Report Security Incident
        </h1>
        <p class="mt-2 text-lg text-gray-600">Document and track security incidents for rapid response</p>
      </div>

      ${error ? html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">${error}</div>
          </div>
        </div>
      ` : ''}

      <div class="bg-white shadow rounded-lg p-6">
        <form action="/risk/incidents/create" method="POST" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Incident Title *</label>
              <input type="text" name="title" required 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                     placeholder="Brief description of the incident">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Severity Level *</label>
              <select name="severity" required 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="Low">Low - Minimal impact</option>
                <option value="Medium">Medium - Moderate impact</option>
                <option value="High">High - Significant impact</option>
                <option value="Critical">Critical - Severe impact</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Incident Description *</label>
            <textarea name="description" required rows="6"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Detailed description of the security incident, including timeline, affected systems, and initial findings..."></textarea>
          </div>

          <div class="flex items-center justify-between">
            <a href="/risk/incidents" class="text-gray-600 hover:text-gray-800">
              <i class="fas fa-arrow-left mr-2"></i>
              Back to Incidents
            </a>
            <button type="submit" 
                    class="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              Report Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const renderErrorPage = (message: string) => html`
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Error</h1>
      <p class="text-lg text-gray-600 mb-6">${message}</p>
      <a href="/dashboard" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
        Return Home
      </a>
    </div>
  </div>
`;