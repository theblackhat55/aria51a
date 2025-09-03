// Ticketing System Integration Service for ARIA5.1
// Supports Jira, ServiceNow, and other ITSM platforms

export interface TicketingConfiguration {
  type: 'jira' | 'servicenow' | 'freshdesk' | 'zendesk' | 'linear';
  name: string;
  baseUrl: string;
  authentication: {
    type: 'bearer' | 'basic' | 'oauth2' | 'apikey';
    credentials: {
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
      email?: string;
    };
  };
  defaultProject?: string;
  defaultIssueType?: string;
  customFields?: Record<string, string>;
}

export interface Ticket {
  id: string;
  key?: string; // Jira ticket key (e.g., PROJ-123)
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  created: string;
  updated: string;
  labels?: string[];
  components?: string[];
  customFields?: Record<string, any>;
  project?: string;
  issueType?: string;
  resolution?: string;
  dueDate?: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  labels?: string[];
  components?: string[];
  project?: string;
  issueType?: string;
  dueDate?: string;
  customFields?: Record<string, any>;
  // ARIA5-specific fields
  sourceType?: 'risk' | 'incident' | 'compliance' | 'security';
  sourceId?: string;
  severity?: string;
}

export interface TicketComment {
  id: string;
  body: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  created: string;
  updated?: string;
}

export interface TicketSearchResult {
  tickets: Ticket[];
  total: number;
  startAt: number;
  maxResults: number;
}

export class TicketingIntegrationService {
  private configurations: Map<string, TicketingConfiguration> = new Map();

  /**
   * Register a ticketing system configuration
   */
  registerTicketingSystem(id: string, config: TicketingConfiguration): void {
    this.configurations.set(id, config);
  }

  /**
   * Get available ticketing configurations
   */
  getTicketingConfigurations(): Array<{ id: string; name: string; type: string }> {
    return Array.from(this.configurations.entries()).map(([id, config]) => ({
      id,
      name: config.name,
      type: config.type
    }));
  }

  /**
   * Test ticketing system connection
   */
  async testConnection(systemId: string): Promise<{ success: boolean; message: string; userInfo?: any }> {
    const config = this.configurations.get(systemId);
    if (!config) {
      return { success: false, message: 'Ticketing system configuration not found' };
    }

    try {
      switch (config.type) {
        case 'jira':
          return await this.testJiraConnection(config);
        case 'servicenow':
          return await this.testServiceNowConnection(config);
        case 'freshdesk':
          return await this.testFreshdeskConnection(config);
        default:
          return { success: false, message: `Unsupported ticketing system: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a ticket
   */
  async createTicket(systemId: string, request: CreateTicketRequest): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const config = this.configurations.get(systemId);
    if (!config) {
      return { success: false, error: 'Ticketing system configuration not found' };
    }

    try {
      switch (config.type) {
        case 'jira':
          return await this.createJiraTicket(config, request);
        case 'servicenow':
          return await this.createServiceNowTicket(config, request);
        case 'freshdesk':
          return await this.createFreshdeskTicket(config, request);
        default:
          return { success: false, error: `Unsupported ticketing system: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a ticket
   */
  async updateTicket(systemId: string, ticketId: string, updates: Partial<CreateTicketRequest>): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const config = this.configurations.get(systemId);
    if (!config) {
      return { success: false, error: 'Ticketing system configuration not found' };
    }

    try {
      switch (config.type) {
        case 'jira':
          return await this.updateJiraTicket(config, ticketId, updates);
        case 'servicenow':
          return await this.updateServiceNowTicket(config, ticketId, updates);
        default:
          return { success: false, error: `Update not supported for: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(systemId: string, ticketId: string): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const config = this.configurations.get(systemId);
    if (!config) {
      return { success: false, error: 'Ticketing system configuration not found' };
    }

    try {
      switch (config.type) {
        case 'jira':
          return await this.getJiraTicket(config, ticketId);
        case 'servicenow':
          return await this.getServiceNowTicket(config, ticketId);
        default:
          return { success: false, error: `Get ticket not supported for: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search tickets
   */
  async searchTickets(systemId: string, query: {
    jql?: string; // For Jira
    status?: string[];
    assignee?: string;
    project?: string;
    labels?: string[];
    maxResults?: number;
    startAt?: number;
  }): Promise<{ success: boolean; result?: TicketSearchResult; error?: string }> {
    const config = this.configurations.get(systemId);
    if (!config) {
      return { success: false, error: 'Ticketing system configuration not found' };
    }

    try {
      switch (config.type) {
        case 'jira':
          return await this.searchJiraTickets(config, query);
        case 'servicenow':
          return await this.searchServiceNowTickets(config, query);
        default:
          return { success: false, error: `Search not supported for: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(systemId: string, ticketId: string, comment: string): Promise<{ success: boolean; comment?: TicketComment; error?: string }> {
    const config = this.configurations.get(systemId);
    if (!config) {
      return { success: false, error: 'Ticketing system configuration not found' };
    }

    try {
      switch (config.type) {
        case 'jira':
          return await this.addJiraComment(config, ticketId, comment);
        case 'servicenow':
          return await this.addServiceNowComment(config, ticketId, comment);
        default:
          return { success: false, error: `Comments not supported for: ${config.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Jira Integration Methods

  private async testJiraConnection(config: TicketingConfiguration): Promise<{ success: boolean; message: string; userInfo?: any }> {
    const response = await fetch(`${config.baseUrl}/rest/api/2/myself`, {
      headers: this.getJiraHeaders(config)
    });

    if (response.ok) {
      const userInfo = await response.json();
      return {
        success: true,
        message: `Jira connection successful. Connected as: ${userInfo.displayName}`,
        userInfo
      };
    } else {
      return { success: false, message: `Jira connection failed: ${response.status} ${response.statusText}` };
    }
  }

  private async createJiraTicket(config: TicketingConfiguration, request: CreateTicketRequest): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const priorityMap: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Highest'
    };

    const jiraIssue = {
      fields: {
        project: { key: request.project || config.defaultProject },
        summary: request.title,
        description: request.description,
        issuetype: { name: request.issueType || config.defaultIssueType || 'Task' },
        priority: { name: priorityMap[request.priority] || 'Medium' },
        labels: request.labels || [],
        ...(request.assignee && { assignee: { name: request.assignee } }),
        ...(request.dueDate && { duedate: request.dueDate }),
        // ARIA5-specific custom fields
        ...(config.customFields && {
          [config.customFields['aria5.source_type']]: request.sourceType,
          [config.customFields['aria5.source_id']]: request.sourceId,
          [config.customFields['aria5.severity']]: request.severity
        })
      }
    };

    const response = await fetch(`${config.baseUrl}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        ...this.getJiraHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jiraIssue)
    });

    if (response.ok) {
      const createdIssue = await response.json();
      const ticket = await this.getJiraTicket(config, createdIssue.key);
      return { success: true, ticket: ticket.ticket };
    } else {
      const errorText = await response.text();
      return { success: false, error: `Jira ticket creation failed: ${response.status} ${errorText}` };
    }
  }

  private async getJiraTicket(config: TicketingConfiguration, ticketId: string): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const response = await fetch(`${config.baseUrl}/rest/api/2/issue/${ticketId}`, {
      headers: this.getJiraHeaders(config)
    });

    if (response.ok) {
      const issue = await response.json();
      const ticket = this.parseJiraIssue(issue);
      return { success: true, ticket };
    } else {
      return { success: false, error: `Failed to get Jira ticket: ${response.status}` };
    }
  }

  private async updateJiraTicket(config: TicketingConfiguration, ticketId: string, updates: Partial<CreateTicketRequest>): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const updateFields: any = {};

    if (updates.title) updateFields.summary = updates.title;
    if (updates.description) updateFields.description = updates.description;
    if (updates.assignee) updateFields.assignee = { name: updates.assignee };
    if (updates.labels) updateFields.labels = updates.labels;

    const response = await fetch(`${config.baseUrl}/rest/api/2/issue/${ticketId}`, {
      method: 'PUT',
      headers: {
        ...this.getJiraHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: updateFields })
    });

    if (response.ok) {
      const ticket = await this.getJiraTicket(config, ticketId);
      return { success: true, ticket: ticket.ticket };
    } else {
      const errorText = await response.text();
      return { success: false, error: `Jira ticket update failed: ${response.status} ${errorText}` };
    }
  }

  private async searchJiraTickets(config: TicketingConfiguration, query: any): Promise<{ success: boolean; result?: TicketSearchResult; error?: string }> {
    let jql = query.jql || '';
    
    if (!jql) {
      const conditions = [];
      if (query.project) conditions.push(`project = "${query.project}"`);
      if (query.status?.length) conditions.push(`status IN (${query.status.map(s => `"${s}"`).join(',')})`);
      if (query.assignee) conditions.push(`assignee = "${query.assignee}"`);
      if (query.labels?.length) conditions.push(`labels IN (${query.labels.map(l => `"${l}"`).join(',')})`);
      
      jql = conditions.join(' AND ') || 'order by created DESC';
    }

    const params = new URLSearchParams({
      jql,
      maxResults: (query.maxResults || 50).toString(),
      startAt: (query.startAt || 0).toString()
    });

    const response = await fetch(`${config.baseUrl}/rest/api/2/search?${params}`, {
      headers: this.getJiraHeaders(config)
    });

    if (response.ok) {
      const searchResult = await response.json();
      const result: TicketSearchResult = {
        tickets: searchResult.issues.map((issue: any) => this.parseJiraIssue(issue)),
        total: searchResult.total,
        startAt: searchResult.startAt,
        maxResults: searchResult.maxResults
      };
      return { success: true, result };
    } else {
      return { success: false, error: `Jira search failed: ${response.status}` };
    }
  }

  private async addJiraComment(config: TicketingConfiguration, ticketId: string, comment: string): Promise<{ success: boolean; comment?: TicketComment; error?: string }> {
    const response = await fetch(`${config.baseUrl}/rest/api/2/issue/${ticketId}/comment`, {
      method: 'POST',
      headers: {
        ...this.getJiraHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: comment })
    });

    if (response.ok) {
      const commentData = await response.json();
      const ticketComment: TicketComment = {
        id: commentData.id,
        body: commentData.body,
        author: {
          id: commentData.author.accountId,
          name: commentData.author.displayName,
          email: commentData.author.emailAddress
        },
        created: commentData.created,
        updated: commentData.updated
      };
      return { success: true, comment: ticketComment };
    } else {
      return { success: false, error: `Failed to add Jira comment: ${response.status}` };
    }
  }

  private getJiraHeaders(config: TicketingConfiguration): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (config.authentication.type === 'basic') {
      const credentials = btoa(`${config.authentication.credentials.email}:${config.authentication.credentials.token}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (config.authentication.type === 'bearer') {
      headers['Authorization'] = `Bearer ${config.authentication.credentials.token}`;
    }

    return headers;
  }

  private parseJiraIssue(issue: any): Ticket {
    return {
      id: issue.id,
      key: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description || '',
      status: issue.fields.status.name,
      priority: this.mapJiraPriorityToStandard(issue.fields.priority?.name),
      assignee: issue.fields.assignee ? {
        id: issue.fields.assignee.accountId,
        name: issue.fields.assignee.displayName,
        email: issue.fields.assignee.emailAddress
      } : undefined,
      reporter: issue.fields.reporter ? {
        id: issue.fields.reporter.accountId,
        name: issue.fields.reporter.displayName,
        email: issue.fields.reporter.emailAddress
      } : undefined,
      created: issue.fields.created,
      updated: issue.fields.updated,
      labels: issue.fields.labels || [],
      project: issue.fields.project.key,
      issueType: issue.fields.issuetype.name,
      resolution: issue.fields.resolution?.name,
      dueDate: issue.fields.duedate
    };
  }

  private mapJiraPriorityToStandard(jiraPriority?: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'Lowest': 'low',
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high',
      'Highest': 'critical'
    };
    return priorityMap[jiraPriority || 'Medium'] || 'medium';
  }

  // ServiceNow Integration Methods

  private async testServiceNowConnection(config: TicketingConfiguration): Promise<{ success: boolean; message: string; userInfo?: any }> {
    const response = await fetch(`${config.baseUrl}/api/now/table/sys_user?sysparm_query=user_name=${config.authentication.credentials.username}&sysparm_limit=1`, {
      headers: this.getServiceNowHeaders(config)
    });

    if (response.ok) {
      const userData = await response.json();
      return {
        success: true,
        message: `ServiceNow connection successful. Connected as: ${config.authentication.credentials.username}`,
        userInfo: userData.result[0]
      };
    } else {
      return { success: false, message: `ServiceNow connection failed: ${response.status}` };
    }
  }

  private async createServiceNowTicket(config: TicketingConfiguration, request: CreateTicketRequest): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const priorityMap: Record<string, string> = {
      'low': '4',
      'medium': '3',
      'high': '2',
      'critical': '1'
    };

    const incident = {
      short_description: request.title,
      description: request.description,
      priority: priorityMap[request.priority] || '3',
      category: request.sourceType || 'Security',
      u_aria5_source_type: request.sourceType,
      u_aria5_source_id: request.sourceId,
      u_aria5_severity: request.severity
    };

    const response = await fetch(`${config.baseUrl}/api/now/table/incident`, {
      method: 'POST',
      headers: {
        ...this.getServiceNowHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incident)
    });

    if (response.ok) {
      const result = await response.json();
      const ticket = this.parseServiceNowIncident(result.result);
      return { success: true, ticket };
    } else {
      const errorText = await response.text();
      return { success: false, error: `ServiceNow ticket creation failed: ${response.status} ${errorText}` };
    }
  }

  private async getServiceNowTicket(config: TicketingConfiguration, ticketId: string): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const response = await fetch(`${config.baseUrl}/api/now/table/incident/${ticketId}`, {
      headers: this.getServiceNowHeaders(config)
    });

    if (response.ok) {
      const result = await response.json();
      const ticket = this.parseServiceNowIncident(result.result);
      return { success: true, ticket };
    } else {
      return { success: false, error: `Failed to get ServiceNow ticket: ${response.status}` };
    }
  }

  private async updateServiceNowTicket(config: TicketingConfiguration, ticketId: string, updates: Partial<CreateTicketRequest>): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const updateData: any = {};

    if (updates.title) updateData.short_description = updates.title;
    if (updates.description) updateData.description = updates.description;

    const response = await fetch(`${config.baseUrl}/api/now/table/incident/${ticketId}`, {
      method: 'PUT',
      headers: {
        ...this.getServiceNowHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      const result = await response.json();
      const ticket = this.parseServiceNowIncident(result.result);
      return { success: true, ticket };
    } else {
      return { success: false, error: `ServiceNow ticket update failed: ${response.status}` };
    }
  }

  private async searchServiceNowTickets(config: TicketingConfiguration, query: any): Promise<{ success: boolean; result?: TicketSearchResult; error?: string }> {
    const params = new URLSearchParams({
      sysparm_limit: (query.maxResults || 50).toString(),
      sysparm_offset: (query.startAt || 0).toString()
    });

    if (query.status?.length) {
      params.append('sysparm_query', `state IN ${query.status.join(',')}`);
    }

    const response = await fetch(`${config.baseUrl}/api/now/table/incident?${params}`, {
      headers: this.getServiceNowHeaders(config)
    });

    if (response.ok) {
      const result = await response.json();
      const searchResult: TicketSearchResult = {
        tickets: result.result.map((incident: any) => this.parseServiceNowIncident(incident)),
        total: result.result.length, // ServiceNow doesn't provide total count in basic API
        startAt: query.startAt || 0,
        maxResults: query.maxResults || 50
      };
      return { success: true, result: searchResult };
    } else {
      return { success: false, error: `ServiceNow search failed: ${response.status}` };
    }
  }

  private async addServiceNowComment(config: TicketingConfiguration, ticketId: string, comment: string): Promise<{ success: boolean; comment?: TicketComment; error?: string }> {
    // ServiceNow comments are usually added via work notes or comments field update
    const response = await fetch(`${config.baseUrl}/api/now/table/incident/${ticketId}`, {
      method: 'PUT',
      headers: {
        ...this.getServiceNowHeaders(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        work_notes: comment
      })
    });

    if (response.ok) {
      const ticketComment: TicketComment = {
        id: `comment-${Date.now()}`,
        body: comment,
        author: {
          id: config.authentication.credentials.username || 'system',
          name: config.authentication.credentials.username || 'System'
        },
        created: new Date().toISOString()
      };
      return { success: true, comment: ticketComment };
    } else {
      return { success: false, error: `Failed to add ServiceNow comment: ${response.status}` };
    }
  }

  private getServiceNowHeaders(config: TicketingConfiguration): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (config.authentication.type === 'basic') {
      const credentials = btoa(`${config.authentication.credentials.username}:${config.authentication.credentials.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    return headers;
  }

  private parseServiceNowIncident(incident: any): Ticket {
    return {
      id: incident.sys_id,
      key: incident.number,
      title: incident.short_description,
      description: incident.description || '',
      status: incident.state,
      priority: this.mapServiceNowPriorityToStandard(incident.priority),
      assignee: incident.assigned_to ? {
        id: incident.assigned_to.value,
        name: incident.assigned_to.display_value,
        email: ''
      } : undefined,
      created: incident.sys_created_on,
      updated: incident.sys_updated_on,
      customFields: {
        category: incident.category,
        aria5_source_type: incident.u_aria5_source_type,
        aria5_source_id: incident.u_aria5_source_id,
        aria5_severity: incident.u_aria5_severity
      }
    };
  }

  private mapServiceNowPriorityToStandard(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      '4': 'low',
      '3': 'medium',
      '2': 'high',
      '1': 'critical'
    };
    return priorityMap[priority] || 'medium';
  }

  // Freshdesk Integration (simplified)

  private async testFreshdeskConnection(config: TicketingConfiguration): Promise<{ success: boolean; message: string; userInfo?: any }> {
    const response = await fetch(`${config.baseUrl}/api/v2/agents/me`, {
      headers: {
        'Authorization': `Basic ${btoa(config.authentication.credentials.apiKey + ':X')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const agentInfo = await response.json();
      return {
        success: true,
        message: `Freshdesk connection successful. Connected as: ${agentInfo.contact.name}`,
        userInfo: agentInfo
      };
    } else {
      return { success: false, message: `Freshdesk connection failed: ${response.status}` };
    }
  }

  private async createFreshdeskTicket(config: TicketingConfiguration, request: CreateTicketRequest): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const priorityMap: Record<string, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    const ticket = {
      name: 'ARIA5 System',
      email: 'system@aria5.com',
      subject: request.title,
      description: request.description,
      priority: priorityMap[request.priority] || 2,
      status: 2, // Open
      source: 2, // Email
      tags: request.labels || []
    };

    const response = await fetch(`${config.baseUrl}/api/v2/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(config.authentication.credentials.apiKey + ':X')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticket)
    });

    if (response.ok) {
      const result = await response.json();
      const parsedTicket = this.parseFreshdeskTicket(result);
      return { success: true, ticket: parsedTicket };
    } else {
      const errorText = await response.text();
      return { success: false, error: `Freshdesk ticket creation failed: ${response.status} ${errorText}` };
    }
  }

  private parseFreshdeskTicket(ticket: any): Ticket {
    const priorityMap: Record<number, 'low' | 'medium' | 'high' | 'critical'> = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'critical'
    };

    return {
      id: ticket.id.toString(),
      title: ticket.subject,
      description: ticket.description_text || '',
      status: ticket.status_name || 'Open',
      priority: priorityMap[ticket.priority] || 'medium',
      created: ticket.created_at,
      updated: ticket.updated_at,
      labels: ticket.tags || []
    };
  }
}

// Ticket Builder Helper for ARIA5 Integration
export class TicketBuilder {
  /**
   * Create ticket from ARIA5 risk
   */
  static fromRisk(risk: any): CreateTicketRequest {
    const priority = this.mapRiskScoreToPriority(risk.risk_score);
    
    return {
      title: `Risk Alert: ${risk.title}`,
      description: `
Risk Details:
- ID: ${risk.id}
- Category: ${risk.category}
- Probability: ${risk.probability}/5
- Impact: ${risk.impact}/5
- Risk Score: ${risk.risk_score}
- Owner: ${risk.owner_name}
- Status: ${risk.status}

Description:
${risk.description}

Affected Assets:
${risk.affected_assets || 'Not specified'}

Review Date: ${risk.review_date || 'Not set'}
      `.trim(),
      priority,
      labels: ['aria5', 'risk-management', risk.category?.toLowerCase()].filter(Boolean),
      sourceType: 'risk',
      sourceId: risk.id.toString(),
      severity: priority
    };
  }

  /**
   * Create ticket from ARIA5 incident
   */
  static fromIncident(incident: any): CreateTicketRequest {
    return {
      title: `Security Incident: ${incident.title}`,
      description: `
Incident Details:
- ID: ${incident.id}
- Type: ${incident.type}
- Severity: ${incident.severity}
- Status: ${incident.status}
- Reported by: ${incident.reported_by_name}
- Detection Date: ${incident.detection_date}

Description:
${incident.description}

Impact Description:
${incident.impact_description || 'Not provided'}

Root Cause:
${incident.root_cause || 'Under investigation'}
      `.trim(),
      priority: this.mapSeverityToPriority(incident.severity),
      labels: ['aria5', 'security-incident', incident.type?.toLowerCase()].filter(Boolean),
      sourceType: 'incident',
      sourceId: incident.id.toString(),
      severity: incident.severity,
      assignee: incident.assigned_to_name
    };
  }

  /**
   * Create ticket from compliance finding
   */
  static fromComplianceFinding(assessment: any, finding: any): CreateTicketRequest {
    const priority = finding.status === 'non_compliant' ? 'high' : 'medium';
    
    return {
      title: `Compliance Issue: ${finding.control_name}`,
      description: `
Compliance Assessment Details:
- Assessment: ${assessment.name}
- Framework: ${assessment.framework_name}
- Control ID: ${finding.control_id}
- Control Name: ${finding.control_name}
- Status: ${finding.status}
- Assessor: ${assessment.assessor_name}

Finding Details:
${finding.notes || 'No additional notes provided'}

Justification:
${finding.justification || 'Not provided'}

Implementation Notes:
${finding.implementation_notes || 'Not provided'}
      `.trim(),
      priority,
      labels: ['aria5', 'compliance', assessment.framework_name?.toLowerCase().replace(/\s+/g, '-')].filter(Boolean),
      sourceType: 'compliance',
      sourceId: `${assessment.id}-${finding.control_id}`,
      severity: finding.status === 'non_compliant' ? 'high' : 'medium'
    };
  }

  private static mapRiskScoreToPriority(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 20) return 'critical';
    if (score >= 15) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  private static mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    return severityMap[severity?.toLowerCase()] || 'medium';
  }
}