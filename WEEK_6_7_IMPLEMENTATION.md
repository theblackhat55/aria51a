# Week 6-7 Implementation Plan - Enhanced Integration & Threat Intelligence

## 📋 Analysis Summary

### Existing Components Found:
✅ **Incident Management DDD Architecture** (Complete domain structure)
✅ **Integration Marketplace** (MS Defender, ServiceNow, Tenable)
✅ **Threat Intelligence Infrastructure** (feeds, items, GRC-focused)
✅ **Database Schema** (0117_threat_intelligence_grc_focused.sql)

### Strategy:
- **Enhance** existing components instead of creating duplicates
- **Consolidate** all integrations under `/integrations` module
- **Extend** threat intelligence with STIX/TAXII support
- **Connect** incidents with integrations and threat intel

---

## Week 6: Enhanced Incident Response & Integration

### Task 1: Connect Incident DDD Routes to Main Application
**Priority**: HIGH | **Effort**: 2 hours

**Current Status**:
- DDD routes exist but commented out in `index-secure.ts` (line 41)
- Reason: "Value objects need refactoring"

**Action Items**:
```typescript
// File: src/index-secure.ts
// UNCOMMENT and fix value object imports:
import incidentDDDRoutes from './domains/incidents/presentation/routes/incident-ddd.routes';

// Mount at line 544 (after incidents-routes.ts):
app.route('/api/v2/incidents', incidentDDDRoutes);
```

**Value Objects to Fix**:
1. Check `./domains/incidents/core/value-objects/` imports
2. Ensure all value objects export properly
3. Test API endpoints: `/api/v2/incidents/*`

---

### Task 2: Integration Marketplace - Incident Sync
**Priority**: HIGH | **Effort**: 1 day

**Goal**: Auto-sync incidents from MS Defender and ServiceNow

**Files to Enhance**:
```
src/routes/integration-marketplace-routes.ts
src/lib/microsoft-defender.ts
src/lib/servicenow-integration.ts
```

**Implementation**:

#### 2.1 Add Incident Sync API Endpoints
```typescript
// File: src/routes/integration-marketplace-routes.ts

// Add new routes:
app.post('/ms-defender/sync-incidents', async (c) => {
  const user = c.get('user');
  const orgId = getOrgId(user);
  
  // Check if MS Defender is installed
  const installation = await getInstallation(c.env.DB, 'ms-defender', orgId);
  if (!installation || !installation.is_active) {
    return c.json({ error: 'MS Defender not installed or inactive' }, 400);
  }
  
  // Fetch incidents from MS Defender
  const defenderService = new MicrosoftDefenderService(
    installation.api_key,
    installation.api_endpoint
  );
  
  const incidents = await defenderService.getIncidents({
    status: 'active',
    severity: ['high', 'critical']
  });
  
  // Store in local database
  let syncedCount = 0;
  for (const incident of incidents) {
    await c.env.DB.prepare(`
      INSERT INTO incidents (
        title, description, severity, status, category, 
        source, external_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(external_id) DO UPDATE SET
        status = excluded.status,
        updated_at = datetime('now')
    `).bind(
      incident.title,
      incident.description,
      mapDefenderSeverity(incident.severity),
      'open',
      'security',
      'ms_defender',
      incident.id
    ).run();
    syncedCount++;
  }
  
  return c.json({ 
    success: true, 
    synced: syncedCount,
    message: `Synced ${syncedCount} incidents from MS Defender`
  });
});

app.post('/servicenow/sync-incidents', async (c) => {
  const user = c.get('user');
  const orgId = getOrgId(user);
  
  const installation = await getInstallation(c.env.DB, 'servicenow', orgId);
  if (!installation || !installation.is_active) {
    return c.json({ error: 'ServiceNow not installed or inactive' }, 400);
  }
  
  const snowService = new ServiceNowIntegrationService(
    installation.api_endpoint,
    installation.api_key
  );
  
  const incidents = await snowService.getSecurityIncidents();
  
  let syncedCount = 0;
  for (const incident of incidents) {
    await c.env.DB.prepare(`
      INSERT INTO incidents (
        title, description, severity, status, category, 
        source, external_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(external_id) DO UPDATE SET
        status = excluded.status,
        updated_at = datetime('now')
    `).bind(
      incident.short_description,
      incident.description,
      mapServiceNowPriority(incident.priority),
      mapServiceNowState(incident.state),
      'security',
      'servicenow',
      incident.sys_id
    ).run();
    syncedCount++;
  }
  
  return c.json({ 
    success: true, 
    synced: syncedCount,
    message: `Synced ${syncedCount} incidents from ServiceNow`
  });
});
```

#### 2.2 Add Auto-Sync Job Support
```sql
-- File: migrations/0118_incident_sync_jobs.sql
CREATE TABLE IF NOT EXISTS incident_sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_key TEXT NOT NULL,
  organization_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  incidents_synced INTEGER DEFAULT 0,
  last_sync_at DATETIME,
  next_sync_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_next_sync 
  ON incident_sync_jobs(next_sync_at, status);
```

---

### Task 3: Workflow Automation Engine
**Priority**: HIGH | **Effort**: 2 days

**Goal**: Automated incident response workflows

**Files to Create/Enhance**:
```
src/services/incident-workflow-engine.ts (NEW)
src/routes/incidents-routes.ts (ENHANCE)
```

**Database Schema**:
```sql
-- File: migrations/0119_incident_workflows.sql
CREATE TABLE IF NOT EXISTS incident_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions TEXT, -- JSON: {severity: 'critical', source: 'ms_defender'}
  workflow_steps TEXT NOT NULL, -- JSON array of steps
  is_active INTEGER DEFAULT 1,
  organization_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS incident_workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  workflow_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  current_step INTEGER DEFAULT 0,
  step_results TEXT, -- JSON array
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (workflow_id) REFERENCES incident_workflows(id)
);

CREATE TABLE IF NOT EXISTS incident_response_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- contain, investigate, notify, remediate
  description TEXT NOT NULL,
  assigned_to INTEGER,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  due_date DATETIME,
  completed_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_incident 
  ON incident_workflow_executions(incident_id);
CREATE INDEX IF NOT EXISTS idx_response_actions_incident 
  ON incident_response_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_response_actions_assigned 
  ON incident_response_actions(assigned_to, status);
```

**Workflow Engine Implementation**:
```typescript
// File: src/services/incident-workflow-engine.ts
export interface WorkflowStep {
  id: string;
  type: 'notify' | 'contain' | 'investigate' | 'document';
  action: string;
  parameters: Record<string, any>;
  timeout_minutes: number;
}

export interface Workflow {
  id: number;
  name: string;
  trigger_conditions: {
    severity?: string[];
    source?: string[];
    category?: string[];
  };
  steps: WorkflowStep[];
}

export class IncidentWorkflowEngine {
  constructor(private db: D1Database) {}
  
  async executeWorkflow(incidentId: number, workflowId: number) {
    // Create execution record
    const execution = await this.db.prepare(`
      INSERT INTO incident_workflow_executions 
      (incident_id, workflow_id, status, started_at)
      VALUES (?, ?, 'running', datetime('now'))
    `).bind(incidentId, workflowId).run();
    
    const executionId = execution.meta.last_row_id;
    
    try {
      // Get workflow definition
      const workflow = await this.getWorkflow(workflowId);
      
      // Execute each step
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        // Update current step
        await this.db.prepare(`
          UPDATE incident_workflow_executions 
          SET current_step = ? 
          WHERE id = ?
        `).bind(i, executionId).run();
        
        // Execute step
        await this.executeStep(incidentId, step);
      }
      
      // Mark as completed
      await this.db.prepare(`
        UPDATE incident_workflow_executions 
        SET status = 'completed', completed_at = datetime('now')
        WHERE id = ?
      `).bind(executionId).run();
      
    } catch (error) {
      // Mark as failed
      await this.db.prepare(`
        UPDATE incident_workflow_executions 
        SET status = 'failed', 
            error_message = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(error.message, executionId).run();
      
      throw error;
    }
  }
  
  private async executeStep(incidentId: number, step: WorkflowStep) {
    switch (step.type) {
      case 'notify':
        await this.sendNotification(incidentId, step.parameters);
        break;
      case 'contain':
        await this.containThreat(incidentId, step.parameters);
        break;
      case 'investigate':
        await this.createInvestigationTask(incidentId, step.parameters);
        break;
      case 'document':
        await this.documentAction(incidentId, step.parameters);
        break;
    }
  }
  
  private async sendNotification(incidentId: number, params: any) {
    // Implementation: Email/SMS notifications
  }
  
  private async containThreat(incidentId: number, params: any) {
    // Implementation: Isolation actions via integrations
  }
  
  private async createInvestigationTask(incidentId: number, params: any) {
    await this.db.prepare(`
      INSERT INTO incident_response_actions 
      (incident_id, action_type, description, status)
      VALUES (?, 'investigate', ?, 'pending')
    `).bind(incidentId, params.description).run();
  }
  
  private async documentAction(incidentId: number, params: any) {
    // Implementation: Auto-documentation
  }
}
```

---

## Week 7: Enhanced Threat Intelligence

### Task 4: STIX/TAXII Integration
**Priority**: HIGH | **Effort**: 2 days

**Goal**: Support STIX 2.1 and TAXII 2.1 protocols

**Files to Enhance**:
```
src/routes/intelligence-routes.ts (ENHANCE)
src/services/threat-intelligence.ts (ENHANCE)
```

**Database Schema Enhancement**:
```sql
-- File: migrations/0120_stix_taxii_support.sql
-- Enhance existing threat_intelligence_feeds table
ALTER TABLE threat_intelligence_feeds 
ADD COLUMN feed_protocol TEXT DEFAULT 'rest'; -- rest, taxii_2.1, stix

ALTER TABLE threat_intelligence_feeds 
ADD COLUMN taxii_api_root TEXT;

ALTER TABLE threat_intelligence_feeds 
ADD COLUMN taxii_collection_id TEXT;

ALTER TABLE threat_intelligence_feeds 
ADD COLUMN auth_type TEXT DEFAULT 'none'; -- none, basic, bearer, certificate

-- IOC Management
CREATE TABLE IF NOT EXISTS threat_iocs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_type TEXT NOT NULL, -- ip, domain, url, hash, email
  ioc_value TEXT NOT NULL UNIQUE,
  threat_type TEXT, -- malware, phishing, c2, etc.
  confidence_score INTEGER DEFAULT 50, -- 0-100
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  first_seen DATETIME NOT NULL,
  last_seen DATETIME,
  source_feed_id INTEGER,
  tags TEXT, -- JSON array
  context TEXT, -- Additional context
  is_active INTEGER DEFAULT 1,
  false_positive INTEGER DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_feed_id) REFERENCES threat_intelligence_feeds(id)
);

CREATE INDEX IF NOT EXISTS idx_iocs_type_value ON threat_iocs(ioc_type, ioc_value);
CREATE INDEX IF NOT EXISTS idx_iocs_active ON threat_iocs(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_iocs_severity ON threat_iocs(severity, confidence_score);

-- Threat Actors
CREATE TABLE IF NOT EXISTS threat_actors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  aliases TEXT, -- JSON array
  description TEXT,
  sophistication TEXT, -- none, minimal, intermediate, advanced, expert
  resource_level TEXT, -- individual, club, contest, team, organization, government
  primary_motivation TEXT,
  sectors_targeted TEXT, -- JSON array
  regions_targeted TEXT, -- JSON array
  ttps TEXT, -- JSON array of MITRE ATT&CK techniques
  first_seen DATETIME,
  last_seen DATETIME,
  confidence_score INTEGER DEFAULT 50,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Threat Campaigns
CREATE TABLE IF NOT EXISTS threat_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  threat_actor_id INTEGER,
  objectives TEXT, -- JSON array
  first_seen DATETIME NOT NULL,
  last_seen DATETIME,
  status TEXT DEFAULT 'active', -- active, dormant, ended
  confidence_score INTEGER DEFAULT 50,
  related_incidents TEXT, -- JSON array of incident IDs
  related_iocs TEXT, -- JSON array of IOC IDs
  ttps TEXT, -- JSON array of MITRE ATT&CK techniques
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (threat_actor_id) REFERENCES threat_actors(id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_actor ON threat_campaigns(threat_actor_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON threat_campaigns(status, last_seen);
```

**STIX Parser Implementation**:
```typescript
// File: src/services/stix-parser.ts
export interface STIXObject {
  type: string;
  id: string;
  spec_version: '2.1';
  created: string;
  modified: string;
}

export interface STIXIndicator extends STIXObject {
  type: 'indicator';
  pattern: string; // [ipv4-addr:value = '10.0.0.1']
  pattern_type: 'stix';
  valid_from: string;
  valid_until?: string;
  indicator_types: string[];
}

export class STIXParser {
  parseBundle(stixBundle: any): {
    indicators: STIXIndicator[];
    threatActors: any[];
    campaigns: any[];
  } {
    const indicators: STIXIndicator[] = [];
    const threatActors: any[] = [];
    const campaigns: any[] = [];
    
    for (const obj of stixBundle.objects || []) {
      switch (obj.type) {
        case 'indicator':
          indicators.push(this.parseIndicator(obj));
          break;
        case 'threat-actor':
          threatActors.push(this.parseThreatActor(obj));
          break;
        case 'campaign':
          campaigns.push(this.parseCampaign(obj));
          break;
      }
    }
    
    return { indicators, threatActors, campaigns };
  }
  
  private parseIndicator(obj: any): STIXIndicator {
    // Parse STIX pattern to extract IOC
    const ioc = this.extractIOCFromPattern(obj.pattern);
    
    return {
      type: 'indicator',
      id: obj.id,
      spec_version: '2.1',
      created: obj.created,
      modified: obj.modified,
      pattern: obj.pattern,
      pattern_type: obj.pattern_type || 'stix',
      valid_from: obj.valid_from,
      valid_until: obj.valid_until,
      indicator_types: obj.indicator_types || []
    };
  }
  
  private extractIOCFromPattern(pattern: string): {
    type: string;
    value: string;
  } {
    // Parse STIX pattern: [ipv4-addr:value = '10.0.0.1']
    const ipMatch = pattern.match(/ipv4-addr:value\s*=\s*'([^']+)'/);
    if (ipMatch) return { type: 'ip', value: ipMatch[1] };
    
    const domainMatch = pattern.match(/domain-name:value\s*=\s*'([^']+)'/);
    if (domainMatch) return { type: 'domain', value: domainMatch[1] };
    
    const hashMatch = pattern.match(/file:hashes\.(?:MD5|SHA-256)\s*=\s*'([^']+)'/);
    if (hashMatch) return { type: 'hash', value: hashMatch[1] };
    
    return { type: 'unknown', value: pattern };
  }
}
```

**TAXII Client Implementation**:
```typescript
// File: src/services/taxii-client.ts
export class TAXII2Client {
  constructor(
    private apiRoot: string,
    private apiKey?: string
  ) {}
  
  async getCollections(): Promise<any[]> {
    const response = await fetch(`${this.apiRoot}/collections/`, {
      headers: this.getHeaders()
    });
    
    const data = await response.json();
    return data.collections || [];
  }
  
  async getObjects(collectionId: string, params?: {
    added_after?: string;
    type?: string[];
    limit?: number;
  }): Promise<any> {
    const url = new URL(`${this.apiRoot}/collections/${collectionId}/objects/`);
    
    if (params?.added_after) {
      url.searchParams.set('added_after', params.added_after);
    }
    if (params?.type) {
      url.searchParams.set('match[type]', params.type.join(','));
    }
    if (params?.limit) {
      url.searchParams.set('limit', params.limit.toString());
    }
    
    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });
    
    return response.json();
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/taxii+json;version=2.1',
      'Content-Type': 'application/taxii+json;version=2.1'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }
}
```

**Add Threat Intel Feed Sync Routes**:
```typescript
// File: src/routes/intelligence-routes.ts

app.post('/feeds/:feedId/sync', async (c) => {
  const feedId = c.req.param('feedId');
  const user = c.get('user');
  
  // Get feed configuration
  const feed = await c.env.DB.prepare(`
    SELECT * FROM threat_intelligence_feeds WHERE id = ?
  `).bind(feedId).first();
  
  if (!feed) {
    return c.json({ error: 'Feed not found' }, 404);
  }
  
  let syncedCount = 0;
  
  if (feed.feed_protocol === 'taxii_2.1') {
    // TAXII sync
    const taxiiClient = new TAXII2Client(
      feed.taxii_api_root,
      feed.api_key
    );
    
    const result = await taxiiClient.getObjects(
      feed.taxii_collection_id,
      {
        added_after: feed.last_sync_at,
        type: ['indicator', 'threat-actor', 'campaign'],
        limit: 100
      }
    );
    
    const stixParser = new STIXParser();
    const parsed = stixParser.parseBundle(result);
    
    // Store IOCs
    for (const indicator of parsed.indicators) {
      const ioc = stixParser.extractIOCFromPattern(indicator.pattern);
      
      await c.env.DB.prepare(`
        INSERT INTO threat_iocs (
          ioc_type, ioc_value, threat_type, confidence_score,
          first_seen, last_seen, source_feed_id, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(ioc_value) DO UPDATE SET
          last_seen = excluded.last_seen,
          confidence_score = MAX(confidence_score, excluded.confidence_score)
      `).bind(
        ioc.type,
        ioc.value,
        indicator.indicator_types[0] || 'unknown',
        70, // Default confidence
        indicator.valid_from,
        indicator.valid_until || new Date().toISOString(),
        feedId
      ).run();
      
      syncedCount++;
    }
  } else {
    // REST API sync (existing logic)
    // ... existing code
  }
  
  // Update feed last sync time
  await c.env.DB.prepare(`
    UPDATE threat_intelligence_feeds 
    SET last_sync_at = datetime('now'),
        next_poll_at = datetime('now', '+' || poll_interval_minutes || ' minutes'),
        items_synced = items_synced + ?
    WHERE id = ?
  `).bind(syncedCount, feedId).run();
  
  return c.json({ 
    success: true, 
    synced: syncedCount,
    message: `Synced ${syncedCount} items from ${feed.name}`
  });
});
```

---

### Task 5: IOC Search & Enrichment UI
**Priority**: MEDIUM | **Effort**: 1 day

**Add IOC Management Page**:
```typescript
// File: src/routes/intelligence-routes.ts

app.get('/iocs', async (c) => {
  const user = c.get('user');
  const searchQuery = c.req.query('q') || '';
  const iocType = c.req.query('type') || '';
  
  let whereClause = 'WHERE is_active = 1';
  const bindings = [];
  
  if (searchQuery) {
    whereClause += ' AND ioc_value LIKE ?';
    bindings.push(`%${searchQuery}%`);
  }
  
  if (iocType) {
    whereClause += ' AND ioc_type = ?';
    bindings.push(iocType);
  }
  
  const iocs = await c.env.DB.prepare(`
    SELECT 
      ti.*,
      tif.name as feed_name
    FROM threat_iocs ti
    LEFT JOIN threat_intelligence_feeds tif ON ti.source_feed_id = tif.id
    ${whereClause}
    ORDER BY ti.last_seen DESC, ti.confidence_score DESC
    LIMIT 100
  `).bind(...bindings).all();
  
  return c.html(
    cleanLayout({
      title: 'IOC Repository',
      user,
      content: renderIOCRepository(iocs.results, searchQuery, iocType)
    })
  );
});

const renderIOCRepository = (iocs: any[], searchQuery: string, iocType: string) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-biohazard text-red-600 mr-3"></i>
          IOC Repository
        </h1>
        <p class="mt-2 text-lg text-gray-600">Indicators of Compromise from multiple threat feeds</p>
      </div>
      
      <!-- Search & Filters -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
        <form action="/intelligence/iocs" method="get" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" name="q" value="${searchQuery}" 
                 placeholder="Search IOCs..." 
                 class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          
          <select name="type" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            <option value="ip" ${iocType === 'ip' ? 'selected' : ''}>IP Address</option>
            <option value="domain" ${iocType === 'domain' ? 'selected' : ''}>Domain</option>
            <option value="url" ${iocType === 'url' ? 'selected' : ''}>URL</option>
            <option value="hash" ${iocType === 'hash' ? 'selected' : ''}>File Hash</option>
            <option value="email" ${iocType === 'email' ? 'selected' : ''}>Email</option>
          </select>
          
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-search mr-2"></i>Search
          </button>
        </form>
      </div>
      
      <!-- IOC Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threat Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${iocs.length === 0 ? html`
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-info-circle text-3xl text-gray-300 mb-3"></i>
                    <p>No IOCs found. Try adjusting your filters.</p>
                  </td>
                </tr>
              ` : iocs.map(ioc => html`
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getIOCTypeColor(ioc.ioc_type)}">
                      ${ioc.ioc_type}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-sm">${ioc.ioc_value}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">${ioc.threat_type || 'Unknown'}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${ioc.confidence_score}%"></div>
                      </div>
                      <span class="text-sm text-gray-600">${ioc.confidence_score}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(ioc.severity)}">
                      ${ioc.severity}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${ioc.feed_name || 'Unknown'}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    ${new Date(ioc.last_seen).toLocaleString()}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <button onclick="enrichIOC('${ioc.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                      <i class="fas fa-search-plus"></i>
                    </button>
                    <button onclick="blockIOC('${ioc.id}')" class="text-red-600 hover:text-red-900">
                      <i class="fas fa-ban"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function enrichIOC(iocId) {
      // TODO: Implement IOC enrichment modal
      alert('Enrichment feature coming soon!');
    }
    
    function blockIOC(iocId) {
      // TODO: Implement IOC blocking action
      alert('Block feature coming soon!');
    }
    
    function getIOCTypeColor(type) {
      switch(type) {
        case 'ip': return 'bg-blue-100 text-blue-800';
        case 'domain': return 'bg-purple-100 text-purple-800';
        case 'url': return 'bg-green-100 text-green-800';
        case 'hash': return 'bg-yellow-100 text-yellow-800';
        case 'email': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    function getSeverityColor(severity) {
      switch(severity) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  </script>
`;
```

---

## Implementation Checklist

### Week 6 - Day 1
- [ ] Uncomment and fix DDD incident routes
- [ ] Test `/api/v2/incidents` endpoints
- [ ] Apply migration 0118_incident_sync_jobs.sql

### Week 6 - Day 2-3
- [ ] Add MS Defender incident sync endpoint
- [ ] Add ServiceNow incident sync endpoint
- [ ] Test integration sync manually

### Week 6 - Day 4-5
- [ ] Apply migration 0119_incident_workflows.sql
- [ ] Implement WorkflowEngine class
- [ ] Create default workflows (high severity auto-response)

### Week 7 - Day 1-2
- [ ] Apply migration 0120_stix_taxii_support.sql
- [ ] Implement STIX parser
- [ ] Implement TAXII client
- [ ] Test with AlienVault OTX (free TAXII feed)

### Week 7 - Day 3-4
- [ ] Add IOC management UI
- [ ] Add feed sync endpoint with TAXII support
- [ ] Test IOC search and filtering

### Week 7 - Day 5
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Documentation updates

---

## Testing Strategy

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
# Test incident sync
curl -X POST https://localhost:3000/integrations/ms-defender/sync-incidents \
  -H "Authorization: Bearer $TOKEN"

# Test IOC search
curl https://localhost:3000/intelligence/iocs?q=192.168&type=ip

# Test TAXII feed sync
curl -X POST https://localhost:3000/intelligence/feeds/1/sync \
  -H "Authorization: Bearer $TOKEN"
```

---

## Success Metrics

### Week 6 KPIs
- ✅ 100% incident sync from MS Defender
- ✅ <2 min workflow execution time
- ✅ 50+ incidents synced and processed

### Week 7 KPIs
- ✅ 5+ TAXII feeds integrated
- ✅ 10,000+ IOCs in repository
- ✅ <1s IOC search response time
- ✅ 95%+ STIX parsing accuracy

---

**Last Updated**: October 25, 2025  
**Status**: Ready for implementation  
**Estimated Completion**: 2 weeks (10 working days)
