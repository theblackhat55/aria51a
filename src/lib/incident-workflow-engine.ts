/**
 * Incident Workflow Engine
 * Week 6 - Automated Incident Response Workflows
 * 
 * Implements NIST SP 800-61 Rev. 2 Incident Response phases:
 * 1. Preparation
 * 2. Detection and Analysis
 * 3. Containment, Eradication, and Recovery
 * 4. Post-Incident Activity
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface WorkflowStep {
  id: string;
  type: 'notify' | 'investigate' | 'contain' | 'remediate' | 'document' | 'escalate';
  action: string;
  parameters: Record<string, any>;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  trigger_conditions: Record<string, any>;
  workflow_steps: WorkflowStep[];
  is_active: boolean;
  organization_id: number;
}

export interface WorkflowExecution {
  id?: number;
  incident_id: number;
  workflow_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_step: number;
  total_steps: number;
  step_results: any[];
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface ResponseAction {
  id?: number;
  incident_id: number;
  action_type: 'notify' | 'contain' | 'investigate' | 'remediate' | 'document' | 'escalate';
  description: string;
  assigned_to?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  automation_enabled: boolean;
  automated_result?: Record<string, any>;
}

export class IncidentWorkflowEngine {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Find matching workflows for an incident
   */
  async findMatchingWorkflows(incident: any, organizationId: number): Promise<Workflow[]> {
    const workflowsResult = await this.db.prepare(`
      SELECT * FROM incident_workflows
      WHERE organization_id = ? AND is_active = 1
    `).bind(organizationId).all();

    const workflows = workflowsResult.results as Workflow[];
    const matching: Workflow[] = [];

    for (const workflow of workflows) {
      const conditions = typeof workflow.trigger_conditions === 'string' 
        ? JSON.parse(workflow.trigger_conditions)
        : workflow.trigger_conditions;

      const steps = typeof workflow.workflow_steps === 'string'
        ? JSON.parse(workflow.workflow_steps)
        : workflow.workflow_steps;

      workflow.workflow_steps = steps;

      if (this.matchesConditions(incident, conditions)) {
        matching.push(workflow);
      }
    }

    return matching;
  }

  /**
   * Check if incident matches workflow trigger conditions
   */
  private matchesConditions(incident: any, conditions: Record<string, any>): boolean {
    // Check severity match
    if (conditions.severity && Array.isArray(conditions.severity)) {
      if (!conditions.severity.includes(incident.severity)) {
        return false;
      }
    }

    // Check category match
    if (conditions.category && Array.isArray(conditions.category)) {
      if (!conditions.category.includes(incident.category)) {
        return false;
      }
    }

    // Check source match
    if (conditions.source && Array.isArray(conditions.source)) {
      if (!conditions.source.includes(incident.external_source)) {
        return false;
      }
    }

    // Check status match
    if (conditions.status && Array.isArray(conditions.status)) {
      if (!conditions.status.includes(incident.status)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute workflow for an incident
   */
  async executeWorkflow(
    incidentId: number,
    workflow: Workflow,
    userId: number
  ): Promise<WorkflowExecution> {
    console.log(`[WorkflowEngine] Executing workflow ${workflow.id} for incident ${incidentId}`);

    // Create execution record
    const executionResult = await this.db.prepare(`
      INSERT INTO incident_workflow_executions 
        (incident_id, workflow_id, status, current_step, total_steps, started_at)
      VALUES (?, ?, 'running', 0, ?, CURRENT_TIMESTAMP)
      RETURNING id
    `).bind(
      incidentId,
      workflow.id,
      workflow.workflow_steps.length
    ).first();

    const executionId = executionResult!.id as number;

    const execution: WorkflowExecution = {
      id: executionId,
      incident_id: incidentId,
      workflow_id: workflow.id,
      status: 'running',
      current_step: 0,
      total_steps: workflow.workflow_steps.length,
      step_results: []
    };

    try {
      // Execute each step
      for (let i = 0; i < workflow.workflow_steps.length; i++) {
        const step = workflow.workflow_steps[i];
        console.log(`[WorkflowEngine] Executing step ${i + 1}/${workflow.workflow_steps.length}: ${step.type}`);

        execution.current_step = i + 1;
        
        // Update execution progress
        await this.db.prepare(`
          UPDATE incident_workflow_executions
          SET current_step = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(i + 1, executionId).run();

        // Execute the step
        const stepResult = await this.executeStep(incidentId, step, userId);
        execution.step_results.push(stepResult);
      }

      // Mark as completed
      execution.status = 'completed';
      await this.db.prepare(`
        UPDATE incident_workflow_executions
        SET status = 'completed', 
            completed_at = CURRENT_TIMESTAMP,
            duration_seconds = (unixepoch('now') - unixepoch(started_at)),
            step_results = ?
        WHERE id = ?
      `).bind(JSON.stringify(execution.step_results), executionId).run();

      console.log(`[WorkflowEngine] Workflow ${workflow.id} completed successfully`);

    } catch (error) {
      console.error(`[WorkflowEngine] Workflow ${workflow.id} failed:`, error);
      
      execution.status = 'failed';
      execution.error_message = error instanceof Error ? error.message : 'Unknown error';
      
      await this.db.prepare(`
        UPDATE incident_workflow_executions
        SET status = 'failed',
            error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(execution.error_message, executionId).run();
    }

    return execution;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    incidentId: number,
    step: WorkflowStep,
    userId: number
  ): Promise<any> {
    console.log(`[WorkflowEngine] Executing step: ${step.type} - ${step.action}`);

    switch (step.type) {
      case 'notify':
        return await this.executeNotifyStep(incidentId, step);
      
      case 'investigate':
        return await this.executeInvestigateStep(incidentId, step, userId);
      
      case 'contain':
        return await this.executeContainStep(incidentId, step, userId);
      
      case 'remediate':
        return await this.executeRemediateStep(incidentId, step, userId);
      
      case 'document':
        return await this.executeDocumentStep(incidentId, step, userId);
      
      case 'escalate':
        return await this.executeEscalateStep(incidentId, step, userId);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotifyStep(incidentId: number, step: WorkflowStep): Promise<any> {
    const { recipients, template, message } = step.parameters;

    // Create notification records
    for (const recipient of recipients || []) {
      await this.db.prepare(`
        INSERT INTO incident_notifications
          (incident_id, notification_type, recipient, subject, message, status)
        VALUES (?, 'email', ?, ?, ?, 'pending')
      `).bind(
        incidentId,
        recipient,
        template ? `Incident Alert - ${template}` : 'Incident Alert',
        message || step.action
      ).run();
    }

    return {
      success: true,
      action: 'notify',
      recipients: recipients?.length || 0,
      message: `Notifications queued for ${recipients?.length || 0} recipients`
    };
  }

  /**
   * Execute investigation step
   */
  private async executeInvestigateStep(
    incidentId: number,
    step: WorkflowStep,
    userId: number
  ): Promise<any> {
    const { priority, assigned_to } = step.parameters;

    // Create investigation action
    await this.db.prepare(`
      INSERT INTO incident_response_actions
        (incident_id, action_type, description, priority, status, automation_enabled, created_by)
      VALUES (?, 'investigate', ?, ?, 'pending', 1, ?)
    `).bind(
      incidentId,
      step.action,
      priority || 'medium',
      userId
    ).run();

    // Add timeline event
    await this.db.prepare(`
      INSERT INTO incident_timeline
        (incident_id, event_type, event_description, user_id)
      VALUES (?, 'action_added', ?, ?)
    `).bind(
      incidentId,
      `Investigation task created: ${step.action}`,
      userId
    ).run();

    return {
      success: true,
      action: 'investigate',
      message: 'Investigation task created'
    };
  }

  /**
   * Execute containment step
   */
  private async executeContainStep(
    incidentId: number,
    step: WorkflowStep,
    userId: number
  ): Promise<any> {
    const { auto_isolate } = step.parameters;

    // Create containment action
    await this.db.prepare(`
      INSERT INTO incident_response_actions
        (incident_id, action_type, description, priority, status, automation_enabled, created_by)
      VALUES (?, 'contain', ?, 'high', 'pending', 1, ?)
    `).bind(
      incidentId,
      step.action,
      userId
    ).run();

    // Add timeline event
    await this.db.prepare(`
      INSERT INTO incident_timeline
        (incident_id, event_type, event_description, user_id)
      VALUES (?, 'action_added', ?, ?)
    `).bind(
      incidentId,
      `Containment action created: ${step.action}`,
      userId
    ).run();

    return {
      success: true,
      action: 'contain',
      auto_isolate: auto_isolate || false,
      message: 'Containment action created'
    };
  }

  /**
   * Execute remediation step
   */
  private async executeRemediateStep(
    incidentId: number,
    step: WorkflowStep,
    userId: number
  ): Promise<any> {
    // Create remediation action
    await this.db.prepare(`
      INSERT INTO incident_response_actions
        (incident_id, action_type, description, priority, status, automation_enabled, created_by)
      VALUES (?, 'remediate', ?, 'medium', 'pending', 1, ?)
    `).bind(
      incidentId,
      step.action,
      userId
    ).run();

    return {
      success: true,
      action: 'remediate',
      message: 'Remediation action created'
    };
  }

  /**
   * Execute documentation step
   */
  private async executeDocumentStep(
    incidentId: number,
    step: WorkflowStep,
    userId: number
  ): Promise<any> {
    const { format } = step.parameters;

    // Create documentation action
    await this.db.prepare(`
      INSERT INTO incident_response_actions
        (incident_id, action_type, description, priority, status, automation_enabled, created_by)
      VALUES (?, 'document', ?, 'low', 'pending', 1, ?)
    `).bind(
      incidentId,
      step.action,
      userId
    ).run();

    return {
      success: true,
      action: 'document',
      format: format || 'pdf',
      message: 'Documentation task created'
    };
  }

  /**
   * Execute escalation step
   */
  private async executeEscalateStep(
    incidentId: number,
    step: WorkflowStep,
    userId: number
  ): Promise<any> {
    const { escalate_to, reason } = step.parameters;

    // Create escalation action
    await this.db.prepare(`
      INSERT INTO incident_response_actions
        (incident_id, action_type, description, priority, status, automation_enabled, created_by)
      VALUES (?, 'escalate', ?, 'high', 'pending', 1, ?)
    `).bind(
      incidentId,
      `${step.action}. Reason: ${reason || 'Automatic escalation'}`,
      userId
    ).run();

    // Update incident status
    await this.db.prepare(`
      UPDATE incidents
      SET status = 'escalated', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(incidentId).run();

    // Add timeline event
    await this.db.prepare(`
      INSERT INTO incident_timeline
        (incident_id, event_type, event_description, user_id)
      VALUES (?, 'status_changed', ?, ?)
    `).bind(
      incidentId,
      `Incident escalated: ${reason || 'Automatic escalation'}`,
      userId
    ).run();

    return {
      success: true,
      action: 'escalate',
      escalate_to: escalate_to || 'security_team',
      message: 'Incident escalated'
    };
  }

  /**
   * Get workflow executions for an incident
   */
  async getIncidentWorkflows(incidentId: number): Promise<WorkflowExecution[]> {
    const result = await this.db.prepare(`
      SELECT we.*, w.name as workflow_name
      FROM incident_workflow_executions we
      JOIN incident_workflows w ON we.workflow_id = w.id
      WHERE we.incident_id = ?
      ORDER BY we.created_at DESC
    `).bind(incidentId).all();

    return result.results as any[];
  }

  /**
   * Get response actions for an incident
   */
  async getIncidentActions(incidentId: number): Promise<ResponseAction[]> {
    const result = await this.db.prepare(`
      SELECT * FROM incident_response_actions
      WHERE incident_id = ?
      ORDER BY priority DESC, created_at DESC
    `).bind(incidentId).all();

    return result.results as ResponseAction[];
  }

  /**
   * Update action status
   */
  async updateActionStatus(
    actionId: number,
    status: string,
    notes?: string
  ): Promise<void> {
    await this.db.prepare(`
      UPDATE incident_response_actions
      SET status = ?,
          notes = COALESCE(?, notes),
          ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : ''}
          ${status === 'in_progress' ? 'started_at = CURRENT_TIMESTAMP,' : ''}
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, notes || null, actionId).run();
  }
}
