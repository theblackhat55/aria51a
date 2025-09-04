/**
 * Automated Incident Response Workflow Service
 * 
 * Provides comprehensive incident response automation including:
 * - Automated incident detection and classification
 * - Dynamic response workflow execution
 * - Integration with external tools and systems
 * - Real-time response coordination
 * - Post-incident analysis and learning
 */

export interface IncidentWorkflow {
  id: string;
  name: string;
  description: string;
  trigger_conditions: TriggerCondition[];
  workflow_steps: WorkflowStep[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration: number; // minutes
  success_criteria: string[];
  rollback_procedure: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  last_modified: string;
}

export interface TriggerCondition {
  type: 'severity' | 'category' | 'source' | 'keyword' | 'correlation' | 'time_based';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'matches_regex';
  value: string | number;
  weight: number; // 0-1, for scoring multiple conditions
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'notification' | 'investigation' | 'containment' | 'eradication' | 'recovery' | 'documentation' | 'custom';
  action: string;
  parameters: Record<string, any>;
  conditions: string[]; // Conditions for step execution
  timeout_minutes: number;
  retry_count: number;
  on_failure: 'continue' | 'stop' | 'escalate' | 'rollback';
  requires_approval: boolean;
  assigned_role: string;
  automation_script?: string;
}

export interface IncidentExecution {
  id: string;
  incident_id: string;
  workflow_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  current_step: number;
  started_at: string;
  completed_at?: string;
  executed_by: string;
  step_results: StepResult[];
  metrics: ExecutionMetrics;
}

export interface StepResult {
  step_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  started_at: string;
  completed_at?: string;
  duration_minutes: number;
  output: any;
  error_message?: string;
  approval_required?: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface ExecutionMetrics {
  total_duration: number;
  steps_executed: number;
  steps_failed: number;
  automation_percentage: number;
  mean_time_to_respond: number;
  mean_time_to_contain: number;
  mean_time_to_recover: number;
}

export interface ResponsePlaybook {
  id: string;
  name: string;
  incident_types: string[];
  severity_levels: string[];
  response_phases: ResponsePhase[];
  roles_required: string[];
  tools_required: string[];
  communication_plan: CommunicationPlan;
  escalation_matrix: EscalationRule[];
}

export interface ResponsePhase {
  phase: 'preparation' | 'identification' | 'containment' | 'eradication' | 'recovery' | 'lessons_learned';
  objectives: string[];
  tasks: ResponseTask[];
  success_criteria: string[];
  duration_estimate: number;
}

export interface ResponseTask {
  id: string;
  name: string;
  description: string;
  assigned_role: string;
  priority: number;
  dependencies: string[];
  automation_available: boolean;
  checklist_items: string[];
}

export interface CommunicationPlan {
  notification_channels: string[];
  stakeholder_groups: StakeholderGroup[];
  escalation_triggers: string[];
  communication_templates: Record<string, string>;
}

export interface StakeholderGroup {
  name: string;
  notification_method: 'email' | 'sms' | 'slack' | 'teams' | 'webhook';
  contact_info: string[];
  notification_triggers: string[];
  message_template: string;
}

export interface EscalationRule {
  trigger_condition: string;
  escalation_level: number;
  escalate_to_role: string;
  escalation_timeout: number;
  actions: string[];
}

export class IncidentResponseService {
  constructor(private db: D1Database) {}

  /**
   * Initialize incident response tables
   */
  async initializeTables(): Promise<void> {
    // Incident workflows table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS incident_workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        trigger_conditions TEXT NOT NULL, -- JSON array
        workflow_steps TEXT NOT NULL, -- JSON array
        priority TEXT NOT NULL,
        estimated_duration INTEGER DEFAULT 60,
        success_criteria TEXT, -- JSON array
        rollback_procedure TEXT, -- JSON array
        is_active BOOLEAN DEFAULT TRUE,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Incident executions table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS incident_executions (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        current_step INTEGER DEFAULT 0,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        executed_by TEXT,
        step_results TEXT, -- JSON array
        metrics TEXT, -- JSON object
        FOREIGN KEY (workflow_id) REFERENCES incident_workflows(id)
      )
    `).run();

    // Response playbooks table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS response_playbooks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        incident_types TEXT, -- JSON array
        severity_levels TEXT, -- JSON array
        response_phases TEXT NOT NULL, -- JSON array
        roles_required TEXT, -- JSON array
        tools_required TEXT, -- JSON array
        communication_plan TEXT, -- JSON object
        escalation_matrix TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Incident response metrics table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS incident_response_metrics (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        workflow_id TEXT,
        detection_time DATETIME,
        response_time DATETIME,
        containment_time DATETIME,
        eradication_time DATETIME,
        recovery_time DATETIME,
        total_duration INTEGER, -- minutes
        automation_percentage REAL,
        human_interventions INTEGER,
        false_positive BOOLEAN DEFAULT FALSE,
        lessons_learned TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create indexes
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_incident_executions_status ON incident_executions(status)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_incident_executions_incident ON incident_executions(incident_id)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_response_metrics_incident ON incident_response_metrics(incident_id)`).run();

    // Initialize default workflows and playbooks
    await this.initializeDefaultData();
  }

  /**
   * Initialize default workflows and playbooks
   */
  private async initializeDefaultData(): Promise<void> {
    // Default incident response workflows
    const defaultWorkflows = [
      {
        id: 'malware_response',
        name: 'Malware Incident Response',
        description: 'Automated response workflow for malware detection',
        trigger_conditions: [
          { type: 'category', operator: 'equals', value: 'malware', weight: 1.0 },
          { type: 'severity', operator: 'greater_than', value: 'medium', weight: 0.7 }
        ],
        workflow_steps: [
          {
            id: 'isolate_host',
            name: 'Isolate Affected Host',
            type: 'containment',
            action: 'network_isolation',
            parameters: { isolation_type: 'network', preserve_evidence: true },
            conditions: [],
            timeout_minutes: 5,
            retry_count: 2,
            on_failure: 'escalate',
            requires_approval: false,
            assigned_role: 'security_analyst'
          },
          {
            id: 'collect_artifacts',
            name: 'Collect Forensic Artifacts',
            type: 'investigation',
            action: 'artifact_collection',
            parameters: { artifacts: ['memory_dump', 'disk_image', 'network_logs'] },
            conditions: [],
            timeout_minutes: 30,
            retry_count: 1,
            on_failure: 'continue',
            requires_approval: false,
            assigned_role: 'forensic_analyst'
          },
          {
            id: 'malware_analysis',
            name: 'Analyze Malware Sample',
            type: 'investigation',
            action: 'malware_sandbox_analysis',
            parameters: { sandbox_type: 'automated', timeout: 15 },
            conditions: [],
            timeout_minutes: 20,
            retry_count: 1,
            on_failure: 'continue',
            requires_approval: false,
            assigned_role: 'malware_analyst'
          },
          {
            id: 'eradicate_malware',
            name: 'Remove Malware',
            type: 'eradication',
            action: 'malware_removal',
            parameters: { method: 'automated_scan', quarantine: true },
            conditions: [],
            timeout_minutes: 15,
            retry_count: 2,
            on_failure: 'escalate',
            requires_approval: true,
            assigned_role: 'security_engineer'
          },
          {
            id: 'restore_systems',
            name: 'Restore Normal Operations',
            type: 'recovery',
            action: 'system_restoration',
            parameters: { validation_required: true, monitoring_period: 24 },
            conditions: [],
            timeout_minutes: 30,
            retry_count: 1,
            on_failure: 'escalate',
            requires_approval: true,
            assigned_role: 'system_administrator'
          }
        ],
        priority: 'high'
      },
      {
        id: 'phishing_response',
        name: 'Phishing Incident Response',
        description: 'Automated response workflow for phishing attacks',
        trigger_conditions: [
          { type: 'category', operator: 'equals', value: 'phishing', weight: 1.0 },
          { type: 'keyword', operator: 'contains', value: 'email', weight: 0.5 }
        ],
        workflow_steps: [
          {
            id: 'block_sender',
            name: 'Block Malicious Sender',
            type: 'containment',
            action: 'email_block',
            parameters: { block_type: 'sender_domain', scope: 'organization' },
            conditions: [],
            timeout_minutes: 2,
            retry_count: 2,
            on_failure: 'continue',
            requires_approval: false,
            assigned_role: 'security_analyst'
          },
          {
            id: 'quarantine_emails',
            name: 'Quarantine Similar Emails',
            type: 'containment',
            action: 'email_quarantine',
            parameters: { search_criteria: 'sender_similarity', time_range: 24 },
            conditions: [],
            timeout_minutes: 5,
            retry_count: 1,
            on_failure: 'continue',
            requires_approval: false,
            assigned_role: 'email_administrator'
          },
          {
            id: 'user_notification',
            name: 'Notify Affected Users',
            type: 'notification',
            action: 'user_awareness',
            parameters: { message_type: 'phishing_alert', delivery_method: 'email' },
            conditions: [],
            timeout_minutes: 10,
            retry_count: 1,
            on_failure: 'continue',
            requires_approval: false,
            assigned_role: 'communication_team'
          }
        ],
        priority: 'medium'
      }
    ];

    for (const workflow of defaultWorkflows) {
      await this.db.prepare(`
        INSERT OR IGNORE INTO incident_workflows (id, name, description, trigger_conditions, workflow_steps, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        workflow.id,
        workflow.name,
        workflow.description,
        JSON.stringify(workflow.trigger_conditions),
        JSON.stringify(workflow.workflow_steps),
        workflow.priority
      ).run();
    }

    // Default response playbook
    const defaultPlaybook = {
      id: 'security_incident_playbook',
      name: 'Security Incident Response Playbook',
      incident_types: ['malware', 'phishing', 'data_breach', 'unauthorized_access', 'ddos'],
      severity_levels: ['low', 'medium', 'high', 'critical'],
      response_phases: [
        {
          phase: 'preparation',
          objectives: ['Ensure response team readiness', 'Verify tools and procedures'],
          tasks: [
            {
              id: 'verify_contacts',
              name: 'Verify Emergency Contacts',
              description: 'Confirm all stakeholder contact information is current',
              assigned_role: 'incident_commander',
              priority: 1,
              dependencies: [],
              automation_available: false,
              checklist_items: ['Management contacts', 'Technical team contacts', 'Legal contacts']
            }
          ],
          success_criteria: ['All systems operational', 'Team availability confirmed'],
          duration_estimate: 15
        },
        {
          phase: 'identification',
          objectives: ['Confirm incident occurrence', 'Initial impact assessment'],
          tasks: [
            {
              id: 'incident_triage',
              name: 'Perform Initial Triage',
              description: 'Assess incident severity and scope',
              assigned_role: 'security_analyst',
              priority: 1,
              dependencies: [],
              automation_available: true,
              checklist_items: ['Severity assessment', 'Scope determination', 'Evidence collection']
            }
          ],
          success_criteria: ['Incident confirmed', 'Initial scope determined'],
          duration_estimate: 30
        }
      ],
      roles_required: ['incident_commander', 'security_analyst', 'forensic_analyst'],
      tools_required: ['SIEM', 'forensic_tools', 'communication_platform'],
      communication_plan: {
        notification_channels: ['email', 'slack', 'phone'],
        stakeholder_groups: [
          {
            name: 'Security Team',
            notification_method: 'slack',
            contact_info: ['#security-incidents'],
            notification_triggers: ['all_incidents'],
            message_template: 'Security incident detected: {incident_title}'
          },
          {
            name: 'Management',
            notification_method: 'email',
            contact_info: ['management@company.com'],
            notification_triggers: ['high_severity', 'critical_severity'],
            message_template: 'URGENT: Security incident requires management attention'
          }
        ],
        escalation_triggers: ['high_severity', 'prolonged_duration', 'media_attention'],
        communication_templates: {
          'initial_notification': 'Security incident detected at {timestamp}. Initial assessment in progress.',
          'status_update': 'Incident status update: {status}. Estimated resolution: {eta}.',
          'resolution': 'Security incident resolved at {timestamp}. Post-incident review scheduled.'
        }
      },
      escalation_matrix: [
        {
          trigger_condition: 'severity_high_and_duration_60min',
          escalation_level: 1,
          escalate_to_role: 'security_manager',
          escalation_timeout: 60,
          actions: ['notify_management', 'activate_crisis_team']
        }
      ]
    };

    await this.db.prepare(`
      INSERT OR IGNORE INTO response_playbooks (id, name, incident_types, severity_levels, response_phases, roles_required, tools_required, communication_plan, escalation_matrix)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      defaultPlaybook.id,
      defaultPlaybook.name,
      JSON.stringify(defaultPlaybook.incident_types),
      JSON.stringify(defaultPlaybook.severity_levels),
      JSON.stringify(defaultPlaybook.response_phases),
      JSON.stringify(defaultPlaybook.roles_required),
      JSON.stringify(defaultPlaybook.tools_required),
      JSON.stringify(defaultPlaybook.communication_plan),
      JSON.stringify(defaultPlaybook.escalation_matrix)
    ).run();
  }

  /**
   * Evaluate incident for workflow triggers
   */
  async evaluateIncidentTriggers(incident: {
    id: string;
    category: string;
    severity: string;
    description: string;
    source: string;
    metadata: any;
  }): Promise<IncidentWorkflow[]> {
    // Get all active workflows
    const workflows = await this.db.prepare(`
      SELECT * FROM incident_workflows WHERE is_active = TRUE
    `).all();

    const triggeredWorkflows: IncidentWorkflow[] = [];

    for (const workflow of workflows.results as any[]) {
      const triggers = JSON.parse(workflow.trigger_conditions);
      let score = 0;
      let maxScore = 0;

      for (const trigger of triggers) {
        maxScore += trigger.weight;
        
        if (this.evaluateTriggerCondition(trigger, incident)) {
          score += trigger.weight;
        }
      }

      // Workflow triggers if score >= 50% of max possible score
      if (score >= maxScore * 0.5) {
        triggeredWorkflows.push({
          ...workflow,
          trigger_conditions: triggers,
          workflow_steps: JSON.parse(workflow.workflow_steps),
          success_criteria: JSON.parse(workflow.success_criteria || '[]'),
          rollback_procedure: JSON.parse(workflow.rollback_procedure || '[]')
        });
      }
    }

    return triggeredWorkflows.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Execute incident response workflow
   */
  async executeWorkflow(incidentId: string, workflowId: string, executedBy: string): Promise<IncidentExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Get workflow details
    const workflow = await this.db.prepare(`
      SELECT * FROM incident_workflows WHERE id = ?
    `).bind(workflowId).first() as any;

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const workflowSteps = JSON.parse(workflow.workflow_steps);
    
    // Create execution record
    const execution: IncidentExecution = {
      id: executionId,
      incident_id: incidentId,
      workflow_id: workflowId,
      status: 'in_progress',
      current_step: 0,
      started_at: new Date().toISOString(),
      executed_by: executedBy,
      step_results: [],
      metrics: {
        total_duration: 0,
        steps_executed: 0,
        steps_failed: 0,
        automation_percentage: 0,
        mean_time_to_respond: 0,
        mean_time_to_contain: 0,
        mean_time_to_recover: 0
      }
    };

    // Store initial execution record
    await this.db.prepare(`
      INSERT INTO incident_executions (id, incident_id, workflow_id, status, executed_by, step_results, metrics)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      executionId,
      incidentId,
      workflowId,
      execution.status,
      executedBy,
      JSON.stringify(execution.step_results),
      JSON.stringify(execution.metrics)
    ).run();

    // Execute workflow steps
    for (let i = 0; i < workflowSteps.length; i++) {
      const step = workflowSteps[i];
      const stepResult = await this.executeWorkflowStep(step, execution, i);
      
      execution.step_results.push(stepResult);
      execution.current_step = i + 1;
      
      // Update execution record
      await this.db.prepare(`
        UPDATE incident_executions 
        SET current_step = ?, step_results = ?, metrics = ?
        WHERE id = ?
      `).bind(
        execution.current_step,
        JSON.stringify(execution.step_results),
        JSON.stringify(execution.metrics),
        executionId
      ).run();

      // Handle step failure
      if (stepResult.status === 'failed') {
        if (step.on_failure === 'stop') {
          execution.status = 'failed';
          break;
        } else if (step.on_failure === 'escalate') {
          await this.escalateIncident(incidentId, workflowId, step);
        }
      }
    }

    // Finalize execution
    execution.completed_at = new Date().toISOString();
    execution.status = execution.status === 'failed' ? 'failed' : 'completed';
    
    // Calculate final metrics
    execution.metrics = this.calculateExecutionMetrics(execution);

    // Update final execution record
    await this.db.prepare(`
      UPDATE incident_executions 
      SET status = ?, completed_at = ?, metrics = ?
      WHERE id = ?
    `).bind(
      execution.status,
      execution.completed_at,
      JSON.stringify(execution.metrics),
      executionId
    ).run();

    return execution;
  }

  /**
   * Execute individual workflow step
   */
  private async executeWorkflowStep(step: WorkflowStep, execution: IncidentExecution, stepIndex: number): Promise<StepResult> {
    const stepResult: StepResult = {
      step_id: step.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      duration_minutes: 0,
      output: null
    };

    try {
      // Check if step requires approval
      if (step.requires_approval) {
        stepResult.approval_required = true;
        stepResult.status = 'pending';
        // In a real implementation, this would wait for approval
        // For demo, we'll simulate auto-approval after delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        stepResult.approved_by = 'auto_approved';
        stepResult.approved_at = new Date().toISOString();
      }

      // Execute step based on type
      stepResult.output = await this.executeStepAction(step);
      stepResult.status = 'completed';
      
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error_message = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (step.retry_count > 0) {
        // In a real implementation, implement retry logic here
      }
    }

    stepResult.completed_at = new Date().toISOString();
    stepResult.duration_minutes = Math.round(
      (new Date(stepResult.completed_at).getTime() - new Date(stepResult.started_at).getTime()) / 60000
    );

    return stepResult;
  }

  /**
   * Execute specific step action
   */
  private async executeStepAction(step: WorkflowStep): Promise<any> {
    // Simulate step execution based on action type
    switch (step.action) {
      case 'network_isolation':
        return { action: 'Host isolated from network', affected_hosts: 1 };
      
      case 'artifact_collection':
        return { 
          action: 'Forensic artifacts collected',
          artifacts: step.parameters.artifacts,
          evidence_id: `evidence_${Date.now()}`
        };
      
      case 'malware_sandbox_analysis':
        return {
          action: 'Malware analysis completed',
          threat_level: 'high',
          family: 'TrojanDropper',
          iocs: ['192.168.1.100', 'malicious.example.com']
        };
      
      case 'malware_removal':
        return {
          action: 'Malware removed successfully',
          quarantined_files: 5,
          clean_status: 'verified'
        };
      
      case 'system_restoration':
        return {
          action: 'Systems restored to normal operation',
          restored_services: ['web_server', 'database', 'email'],
          validation_passed: true
        };
      
      case 'email_block':
        return {
          action: 'Sender blocked',
          blocked_addresses: ['attacker@malicious.com'],
          scope: step.parameters.scope
        };
      
      case 'email_quarantine':
        return {
          action: 'Emails quarantined',
          quarantined_count: Math.floor(Math.random() * 10) + 1,
          time_range: step.parameters.time_range
        };
      
      case 'user_awareness':
        return {
          action: 'User notification sent',
          recipients: Math.floor(Math.random() * 100) + 50,
          delivery_method: step.parameters.delivery_method
        };
      
      default:
        return { action: `Executed ${step.action}`, status: 'completed' };
    }
  }

  /**
   * Get incident response metrics and analytics
   */
  async getResponseMetrics(timeRange: '24h' | '7d' | '30d' = '30d'): Promise<any> {
    const timeFilter = timeRange === '24h' ? "datetime('now', '-1 day')" :
                      timeRange === '7d' ? "datetime('now', '-7 days')" :
                      "datetime('now', '-30 days')";

    const executions = await this.db.prepare(`
      SELECT COUNT(*) as total_executions,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_executions,
             COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_executions,
             AVG(JSON_EXTRACT(metrics, '$.total_duration')) as avg_duration,
             AVG(JSON_EXTRACT(metrics, '$.automation_percentage')) as avg_automation
      FROM incident_executions
      WHERE started_at > ${timeFilter}
    `).first();

    const workflowPerformance = await this.db.prepare(`
      SELECT workflow_id, 
             COUNT(*) as execution_count,
             AVG(JSON_EXTRACT(metrics, '$.total_duration')) as avg_duration,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as success_count
      FROM incident_executions
      WHERE started_at > ${timeFilter}
      GROUP BY workflow_id
    `).all();

    const responseMetrics = await this.db.prepare(`
      SELECT AVG(total_duration) as mean_total_duration,
             AVG(automation_percentage) as mean_automation,
             AVG(human_interventions) as mean_human_interventions,
             COUNT(CASE WHEN false_positive = TRUE THEN 1 END) as false_positive_count
      FROM incident_response_metrics
      WHERE created_at > ${timeFilter}
    `).first();

    return {
      summary: {
        total_executions: (executions as any)?.total_executions || 0,
        success_rate: ((executions as any)?.successful_executions || 0) / ((executions as any)?.total_executions || 1),
        average_duration: (executions as any)?.avg_duration || 0,
        automation_percentage: (executions as any)?.avg_automation || 0
      },
      workflow_performance: (workflowPerformance.results as any[])?.map(row => ({
        workflow_id: row.workflow_id,
        execution_count: row.execution_count,
        success_rate: row.success_count / row.execution_count,
        average_duration: row.avg_duration
      })) || [],
      response_times: {
        mean_total_duration: (responseMetrics as any)?.mean_total_duration || 0,
        mean_automation: (responseMetrics as any)?.mean_automation || 0,
        mean_human_interventions: (responseMetrics as any)?.mean_human_interventions || 0,
        false_positive_rate: ((responseMetrics as any)?.false_positive_count || 0) / ((executions as any)?.total_executions || 1)
      }
    };
  }

  // Helper methods
  private evaluateTriggerCondition(trigger: TriggerCondition, incident: any): boolean {
    const { type, operator, value } = trigger;
    
    switch (type) {
      case 'severity':
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        const incidentSeverity = severityOrder[incident.severity as keyof typeof severityOrder];
        const triggerSeverity = severityOrder[value as keyof typeof severityOrder];
        
        switch (operator) {
          case 'equals': return incidentSeverity === triggerSeverity;
          case 'greater_than': return incidentSeverity > triggerSeverity;
          case 'less_than': return incidentSeverity < triggerSeverity;
          default: return false;
        }
      
      case 'category':
        return operator === 'equals' ? incident.category === value : 
               operator === 'contains' ? incident.category.includes(value) : false;
      
      case 'keyword':
        const searchText = (incident.description + ' ' + JSON.stringify(incident.metadata)).toLowerCase();
        return operator === 'contains' ? searchText.includes((value as string).toLowerCase()) :
               operator === 'matches_regex' ? new RegExp(value as string, 'i').test(searchText) : false;
      
      default:
        return false;
    }
  }

  private async escalateIncident(incidentId: string, workflowId: string, failedStep: WorkflowStep): Promise<void> {
    // In a real implementation, this would trigger escalation procedures
    console.log(`Escalating incident ${incidentId} due to failure in step ${failedStep.name}`);
  }

  private calculateExecutionMetrics(execution: IncidentExecution): ExecutionMetrics {
    const stepResults = execution.step_results;
    const totalDuration = stepResults.reduce((sum, step) => sum + step.duration_minutes, 0);
    const stepsExecuted = stepResults.filter(step => step.status === 'completed').length;
    const stepsFailed = stepResults.filter(step => step.status === 'failed').length;
    
    // Calculate automation percentage (steps that didn't require approval)
    const automatedSteps = stepResults.filter(step => !step.approval_required).length;
    const automationPercentage = stepResults.length > 0 ? automatedSteps / stepResults.length : 0;

    return {
      total_duration: totalDuration,
      steps_executed: stepsExecuted,
      steps_failed: stepsFailed,
      automation_percentage: automationPercentage,
      mean_time_to_respond: stepResults.length > 0 ? stepResults[0].duration_minutes : 0,
      mean_time_to_contain: totalDuration * 0.3, // Estimate
      mean_time_to_recover: totalDuration * 0.6 // Estimate
    };
  }
}