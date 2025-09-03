// SIEM Integration Service for ARIA5.1
// Supports Splunk, Microsoft Sentinel, and other SIEM platforms

export interface SIEMConfiguration {
  type: 'splunk' | 'sentinel' | 'qradar' | 'elasticsearch' | 'sumologic';
  name: string;
  baseUrl: string;
  authentication: {
    type: 'bearer' | 'basic' | 'oauth2' | 'apikey';
    credentials: {
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
      clientId?: string;
      clientSecret?: string;
      tenantId?: string;
    };
  };
  options?: {
    index?: string; // For Splunk
    workspace?: string; // For Sentinel
    timeFormat?: string;
    batchSize?: number;
    retryAttempts?: number;
  };
}

export interface SIEMEvent {
  timestamp: string;
  source: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  sourceIp?: string;
  destinationIp?: string;
  userId?: string;
  username?: string;
  deviceName?: string;
  eventId?: string;
  category: string;
  subcategory?: string;
  rawData?: any;
  customFields?: Record<string, any>;
}

export interface SIEMQuery {
  query: string;
  timeRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
  fields?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SIEMSearchResult {
  events: SIEMEvent[];
  totalCount: number;
  took: number; // Query execution time in ms
  metadata: {
    query: string;
    timeRange?: {
      start: string;
      end: string;
    };
    searchId?: string;
  };
}

export interface SIEMAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdTime: string;
  updatedTime: string;
  assignee?: string;
  tags: string[];
  sourceRule: string;
  eventCount: number;
  relatedEvents: string[];
}

export class SIEMIntegrationService {
  private configurations: Map<string, SIEMConfiguration> = new Map();

  /**
   * Register a SIEM configuration
   */
  registerSIEM(id: string, config: SIEMConfiguration): void {
    this.configurations.set(id, config);
  }

  /**
   * Get available SIEM configurations
   */
  getSIEMConfigurations(): Array<{ id: string; name: string; type: string }> {
    return Array.from(this.configurations.entries()).map(([id, config]) => ({
      id,
      name: config.name,
      type: config.type
    }));
  }

  /**
   * Test SIEM connection
   */
  async testConnection(siemId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const config = this.configurations.get(siemId);
    if (!config) {
      return { success: false, message: 'SIEM configuration not found' };
    }

    const startTime = Date.now();

    try {
      switch (config.type) {
        case 'splunk':
          return await this.testSplunkConnection(config, startTime);
        case 'sentinel':
          return await this.testSentinelConnection(config, startTime);
        case 'elasticsearch':
          return await this.testElasticsearchConnection(config, startTime);
        default:
          return { success: false, message: `Unsupported SIEM type: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send events to SIEM
   */
  async sendEvents(siemId: string, events: SIEMEvent[]): Promise<{ success: boolean; processed: number; error?: string }> {
    const config = this.configurations.get(siemId);
    if (!config) {
      return { success: false, processed: 0, error: 'SIEM configuration not found' };
    }

    try {
      switch (config.type) {
        case 'splunk':
          return await this.sendToSplunk(config, events);
        case 'sentinel':
          return await this.sendToSentinel(config, events);
        case 'elasticsearch':
          return await this.sendToElasticsearch(config, events);
        default:
          return { success: false, processed: 0, error: `Unsupported SIEM type: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        processed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search SIEM for events
   */
  async searchEvents(siemId: string, query: SIEMQuery): Promise<SIEMSearchResult> {
    const config = this.configurations.get(siemId);
    if (!config) {
      throw new Error('SIEM configuration not found');
    }

    switch (config.type) {
      case 'splunk':
        return await this.searchSplunk(config, query);
      case 'sentinel':
        return await this.searchSentinel(config, query);
      case 'elasticsearch':
        return await this.searchElasticsearch(config, query);
      default:
        throw new Error(`Unsupported SIEM type: ${config.type}`);
    }
  }

  /**
   * Get alerts from SIEM
   */
  async getAlerts(siemId: string, options?: {
    severity?: string[];
    status?: string[];
    timeRange?: { start: string; end: string };
    limit?: number;
  }): Promise<SIEMAlert[]> {
    const config = this.configurations.get(siemId);
    if (!config) {
      throw new Error('SIEM configuration not found');
    }

    switch (config.type) {
      case 'splunk':
        return await this.getSplunkAlerts(config, options);
      case 'sentinel':
        return await this.getSentinelAlerts(config, options);
      default:
        throw new Error(`Alert retrieval not supported for SIEM type: ${config.type}`);
    }
  }

  // Splunk Integration Methods

  private async testSplunkConnection(config: SIEMConfiguration, startTime: number): Promise<{ success: boolean; message: string; latency?: number }> {
    const response = await fetch(`${config.baseUrl}/services/server/info`, {
      headers: this.getSplunkHeaders(config)
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return { success: true, message: 'Splunk connection successful', latency };
    } else {
      return { success: false, message: `Splunk connection failed: ${response.status}` };
    }
  }

  private async sendToSplunk(config: SIEMConfiguration, events: SIEMEvent[]): Promise<{ success: boolean; processed: number; error?: string }> {
    const splunkEvents = events.map(event => ({
      time: new Date(event.timestamp).getTime() / 1000,
      source: event.source,
      sourcetype: 'aria5_security',
      index: config.options?.index || 'main',
      event: {
        ...event,
        _time: event.timestamp
      }
    }));

    const response = await fetch(`${config.baseUrl}/services/collector/event`, {
      method: 'POST',
      headers: {
        ...this.getSplunkHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ event: splunkEvents })
    });

    if (response.ok) {
      return { success: true, processed: events.length };
    } else {
      const errorText = await response.text();
      return { success: false, processed: 0, error: `Splunk ingestion failed: ${errorText}` };
    }
  }

  private async searchSplunk(config: SIEMConfiguration, query: SIEMQuery): Promise<SIEMSearchResult> {
    const searchQuery = this.buildSplunkQuery(query, config);
    
    // Create search job
    const searchResponse = await fetch(`${config.baseUrl}/services/search/jobs`, {
      method: 'POST',
      headers: {
        ...this.getSplunkHeaders(config),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        search: searchQuery,
        output_mode: 'json'
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Splunk search failed: ${searchResponse.status}`);
    }

    const searchJob = await searchResponse.json();
    const sid = searchJob.sid;

    // Poll for results
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!completed && attempts < maxAttempts) {
      const statusResponse = await fetch(`${config.baseUrl}/services/search/jobs/${sid}`, {
        headers: {
          ...this.getSplunkHeaders(config),
          'Content-Type': 'application/json'
        }
      });

      const status = await statusResponse.json();
      completed = status.entry[0].content.isDone;

      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    // Get results
    const resultsResponse = await fetch(`${config.baseUrl}/services/search/jobs/${sid}/results?output_mode=json&count=${query.limit || 100}`, {
      headers: this.getSplunkHeaders(config)
    });

    const results = await resultsResponse.json();
    
    return {
      events: results.results.map((result: any) => this.parseSplunkEvent(result)),
      totalCount: results.results.length,
      took: 0, // Splunk doesn't provide query time
      metadata: {
        query: searchQuery,
        timeRange: query.timeRange,
        searchId: sid
      }
    };
  }

  private getSplunkHeaders(config: SIEMConfiguration): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (config.authentication.type === 'bearer' && config.authentication.credentials.token) {
      headers['Authorization'] = `Bearer ${config.authentication.credentials.token}`;
    } else if (config.authentication.type === 'basic' && config.authentication.credentials.username) {
      const credentials = btoa(`${config.authentication.credentials.username}:${config.authentication.credentials.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }
    
    return headers;
  }

  private buildSplunkQuery(query: SIEMQuery, config: SIEMConfiguration): string {
    let splunkQuery = `search ${query.query}`;
    
    if (query.timeRange) {
      splunkQuery += ` earliest="${query.timeRange.start}" latest="${query.timeRange.end}"`;
    }
    
    if (config.options?.index) {
      splunkQuery += ` index="${config.options.index}"`;
    }
    
    if (query.fields?.length) {
      splunkQuery += ` | fields ${query.fields.join(', ')}`;
    }
    
    if (query.sortBy) {
      splunkQuery += ` | sort ${query.sortOrder === 'desc' ? '-' : ''}${query.sortBy}`;
    }
    
    if (query.limit) {
      splunkQuery += ` | head ${query.limit}`;
    }
    
    return splunkQuery;
  }

  private parseSplunkEvent(result: any): SIEMEvent {
    return {
      timestamp: result._time || new Date().toISOString(),
      source: result.source || 'splunk',
      eventType: result.eventType || 'unknown',
      severity: result.severity || 'medium',
      title: result.title || result._raw?.substring(0, 100) || 'Splunk Event',
      description: result.description || result._raw || '',
      category: result.category || 'security',
      rawData: result
    };
  }

  private async getSplunkAlerts(config: SIEMConfiguration, options?: any): Promise<SIEMAlert[]> {
    // Splunk alerts would typically be retrieved via saved searches or alert manager
    // This is a simplified implementation
    const query: SIEMQuery = {
      query: 'source="splunk_alerts" OR sourcetype="alert"',
      timeRange: options?.timeRange,
      limit: options?.limit || 50
    };

    const results = await this.searchSplunk(config, query);
    
    return results.events.map((event, index) => ({
      id: `splunk-alert-${index}`,
      title: event.title,
      description: event.description,
      severity: event.severity,
      status: 'open',
      createdTime: event.timestamp,
      updatedTime: event.timestamp,
      tags: [],
      sourceRule: 'splunk-search',
      eventCount: 1,
      relatedEvents: []
    }));
  }

  // Microsoft Sentinel Integration Methods

  private async testSentinelConnection(config: SIEMConfiguration, startTime: number): Promise<{ success: boolean; message: string; latency?: number }> {
    const token = await this.getSentinelToken(config);
    
    const response = await fetch(`${config.baseUrl}/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return { success: true, message: 'Microsoft Sentinel connection successful', latency };
    } else {
      return { success: false, message: `Sentinel connection failed: ${response.status}` };
    }
  }

  private async sendToSentinel(config: SIEMConfiguration, events: SIEMEvent[]): Promise<{ success: boolean; processed: number; error?: string }> {
    const token = await this.getSentinelToken(config);
    
    // Sentinel uses Log Analytics Data Collector API
    const workspaceId = config.options?.workspace;
    if (!workspaceId) {
      return { success: false, processed: 0, error: 'Workspace ID required for Sentinel' };
    }

    const logData = events.map(event => ({
      TimeGenerated: event.timestamp,
      Source: event.source,
      EventType: event.eventType,
      Severity: event.severity,
      Title: event.title,
      Description: event.description,
      Category: event.category,
      SourceIP: event.sourceIp,
      DestinationIP: event.destinationIp,
      UserID: event.userId,
      Username: event.username,
      DeviceName: event.deviceName,
      EventID: event.eventId,
      RawData: JSON.stringify(event.rawData || {})
    }));

    // Note: This would require the Log Analytics Data Collector API
    // For now, we'll simulate the response
    console.log('📊 Sentinel Events Sent (Development Mode)', {
      workspace: workspaceId,
      events: events.length,
      data: logData
    });

    return { success: true, processed: events.length };
  }

  private async searchSentinel(config: SIEMConfiguration, query: SIEMQuery): Promise<SIEMSearchResult> {
    const token = await this.getSentinelToken(config);
    const workspaceId = config.options?.workspace;
    
    if (!workspaceId) {
      throw new Error('Workspace ID required for Sentinel queries');
    }

    // Build KQL query
    const kqlQuery = this.buildSentinelKQLQuery(query);
    
    const response = await fetch(`${config.baseUrl}/v1/workspaces/${workspaceId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: kqlQuery,
        timespan: query.timeRange ? `${query.timeRange.start}/${query.timeRange.end}` : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`Sentinel query failed: ${response.status}`);
    }

    const results = await response.json();
    
    return {
      events: results.tables[0]?.rows?.map((row: any[]) => this.parseSentinelEvent(row, results.tables[0].columns)) || [],
      totalCount: results.tables[0]?.rows?.length || 0,
      took: 0,
      metadata: {
        query: kqlQuery,
        timeRange: query.timeRange
      }
    };
  }

  private async getSentinelToken(config: SIEMConfiguration): Promise<string> {
    const { clientId, clientSecret, tenantId } = config.authentication.credentials;
    
    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Client ID, Client Secret, and Tenant ID required for Sentinel authentication');
    }

    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://api.loganalytics.io/.default',
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      throw new Error(`Sentinel authentication failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private buildSentinelKQLQuery(query: SIEMQuery): string {
    let kqlQuery = query.query;
    
    if (query.timeRange) {
      kqlQuery += ` | where TimeGenerated between (datetime(${query.timeRange.start}) .. datetime(${query.timeRange.end}))`;
    }
    
    if (query.fields?.length) {
      kqlQuery += ` | project ${query.fields.join(', ')}`;
    }
    
    if (query.sortBy) {
      kqlQuery += ` | order by ${query.sortBy} ${query.sortOrder || 'asc'}`;
    }
    
    if (query.limit) {
      kqlQuery += ` | take ${query.limit}`;
    }
    
    return kqlQuery;
  }

  private parseSentinelEvent(row: any[], columns: any[]): SIEMEvent {
    const event: any = {};
    columns.forEach((column: any, index: number) => {
      event[column.name] = row[index];
    });

    return {
      timestamp: event.TimeGenerated || new Date().toISOString(),
      source: event.Source || 'sentinel',
      eventType: event.EventType || 'unknown',
      severity: event.Severity || 'medium',
      title: event.Title || event.EventType || 'Sentinel Event',
      description: event.Description || '',
      sourceIp: event.SourceIP,
      destinationIp: event.DestinationIP,
      userId: event.UserID,
      username: event.Username,
      deviceName: event.DeviceName,
      eventId: event.EventID,
      category: event.Category || 'security',
      rawData: event
    };
  }

  private async getSentinelAlerts(config: SIEMConfiguration, options?: any): Promise<SIEMAlert[]> {
    const token = await this.getSentinelToken(config);
    
    // This would use the Security Graph API or Sentinel API
    // Simplified implementation for now
    return [];
  }

  // Elasticsearch Integration Methods

  private async testElasticsearchConnection(config: SIEMConfiguration, startTime: number): Promise<{ success: boolean; message: string; latency?: number }> {
    const response = await fetch(`${config.baseUrl}/_cluster/health`, {
      headers: this.getElasticsearchHeaders(config)
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return { success: true, message: 'Elasticsearch connection successful', latency };
    } else {
      return { success: false, message: `Elasticsearch connection failed: ${response.status}` };
    }
  }

  private async sendToElasticsearch(config: SIEMConfiguration, events: SIEMEvent[]): Promise<{ success: boolean; processed: number; error?: string }> {
    const index = config.options?.index || 'aria5-security';
    const bulkData = events.flatMap(event => [
      { index: { _index: index } },
      {
        '@timestamp': event.timestamp,
        ...event
      }
    ]);

    const response = await fetch(`${config.baseUrl}/_bulk`, {
      method: 'POST',
      headers: {
        ...this.getElasticsearchHeaders(config),
        'Content-Type': 'application/json'
      },
      body: bulkData.map(item => JSON.stringify(item)).join('\n') + '\n'
    });

    if (response.ok) {
      return { success: true, processed: events.length };
    } else {
      const errorText = await response.text();
      return { success: false, processed: 0, error: `Elasticsearch ingestion failed: ${errorText}` };
    }
  }

  private async searchElasticsearch(config: SIEMConfiguration, query: SIEMQuery): Promise<SIEMSearchResult> {
    const index = config.options?.index || 'aria5-security';
    
    const searchBody = {
      query: {
        query_string: {
          query: query.query
        }
      },
      size: query.limit || 100,
      from: query.offset || 0,
      sort: query.sortBy ? [{ [query.sortBy]: { order: query.sortOrder || 'desc' } }] : undefined,
      _source: query.fields || true
    };

    if (query.timeRange) {
      searchBody.query = {
        bool: {
          must: [
            searchBody.query,
            {
              range: {
                '@timestamp': {
                  gte: query.timeRange.start,
                  lte: query.timeRange.end
                }
              }
            }
          ]
        }
      } as any;
    }

    const response = await fetch(`${config.baseUrl}/${index}/_search`, {
      method: 'POST',
      headers: {
        ...this.getElasticsearchHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch search failed: ${response.status}`);
    }

    const results = await response.json();
    
    return {
      events: results.hits.hits.map((hit: any) => this.parseElasticsearchEvent(hit._source)),
      totalCount: results.hits.total.value,
      took: results.took,
      metadata: {
        query: query.query,
        timeRange: query.timeRange
      }
    };
  }

  private getElasticsearchHeaders(config: SIEMConfiguration): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (config.authentication.type === 'basic' && config.authentication.credentials.username) {
      const credentials = btoa(`${config.authentication.credentials.username}:${config.authentication.credentials.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (config.authentication.type === 'apikey' && config.authentication.credentials.apiKey) {
      headers['Authorization'] = `ApiKey ${config.authentication.credentials.apiKey}`;
    }
    
    return headers;
  }

  private parseElasticsearchEvent(source: any): SIEMEvent {
    return {
      timestamp: source['@timestamp'] || source.timestamp || new Date().toISOString(),
      source: source.source || 'elasticsearch',
      eventType: source.eventType || source.event_type || 'unknown',
      severity: source.severity || 'medium',
      title: source.title || source.message || 'Elasticsearch Event',
      description: source.description || source.message || '',
      sourceIp: source.sourceIp || source.source_ip,
      destinationIp: source.destinationIp || source.dest_ip,
      userId: source.userId || source.user_id,
      username: source.username,
      deviceName: source.deviceName || source.host,
      eventId: source.eventId || source.event_id,
      category: source.category || 'security',
      subcategory: source.subcategory,
      rawData: source
    };
  }
}

// SIEM Event Builder Helper
export class SIEMEventBuilder {
  /**
   * Create SIEM event from ARIA5 risk
   */
  static fromRisk(risk: any): SIEMEvent {
    return {
      timestamp: new Date().toISOString(),
      source: 'aria5-risk-management',
      eventType: 'risk_identified',
      severity: this.mapRiskScoreToSeverity(risk.risk_score),
      title: `Risk Identified: ${risk.title}`,
      description: risk.description,
      category: 'risk_management',
      subcategory: risk.category,
      customFields: {
        riskId: risk.id,
        riskScore: risk.risk_score,
        probability: risk.probability,
        impact: risk.impact,
        owner: risk.owner_name,
        status: risk.status
      },
      rawData: risk
    };
  }

  /**
   * Create SIEM event from ARIA5 incident
   */
  static fromIncident(incident: any): SIEMEvent {
    return {
      timestamp: incident.created_at,
      source: 'aria5-incident-management',
      eventType: 'security_incident',
      severity: this.mapIncidentSeverityToSIEM(incident.severity),
      title: `Security Incident: ${incident.title}`,
      description: incident.description,
      category: 'incident_response',
      subcategory: incident.type,
      userId: incident.reported_by?.toString(),
      username: incident.reported_by_name,
      customFields: {
        incidentId: incident.id,
        severity: incident.severity,
        status: incident.status,
        assignedTo: incident.assigned_to_name,
        detectionDate: incident.detection_date
      },
      rawData: incident
    };
  }

  /**
   * Create SIEM event from compliance assessment
   */
  static fromComplianceEvent(assessment: any, finding: any): SIEMEvent {
    return {
      timestamp: new Date().toISOString(),
      source: 'aria5-compliance',
      eventType: 'compliance_finding',
      severity: finding.status === 'non_compliant' ? 'high' : 'low',
      title: `Compliance Finding: ${finding.control_name}`,
      description: `Control ${finding.control_id} assessment result: ${finding.status}`,
      category: 'compliance',
      subcategory: assessment.framework_name,
      customFields: {
        assessmentId: assessment.id,
        controlId: finding.control_id,
        frameworkName: assessment.framework_name,
        complianceStatus: finding.status,
        assessor: assessment.assessor_name
      },
      rawData: { assessment, finding }
    };
  }

  private static mapRiskScoreToSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 20) return 'critical';
    if (score >= 15) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  private static mapIncidentSeverityToSIEM(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    return severityMap[severity.toLowerCase()] || 'medium';
  }
}