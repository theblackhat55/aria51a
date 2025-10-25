/**
 * ActionStatus Value Object
 * 
 * Represents the current status of a response action.
 * Tracks the lifecycle from pending to completion or cancellation.
 */

import { ValueObject } from '../../../../shared/core/ValueObject';

export enum ActionStatus {
  Pending = 'pending',           // Action is scheduled but not started
  InProgress = 'in_progress',    // Action is currently being performed
  Blocked = 'blocked',           // Action is blocked by dependencies or issues
  Completed = 'completed',       // Action has been successfully completed
  Failed = 'failed',             // Action failed and needs retry
  Cancelled = 'cancelled'        // Action was cancelled
}

export class ActionStatusVO extends ValueObject<ActionStatus> {
  private constructor(value: ActionStatus) {
    super(value);
  }

  public static create(value: ActionStatus): ActionStatusVO {
    if (!Object.values(ActionStatus).includes(value)) {
      throw new Error(`Invalid action status: ${value}`);
    }
    return new ActionStatusVO(value);
  }

  /**
   * Get human-readable label
   */
  public getLabel(): string {
    const labels: Record<ActionStatus, string> = {
      [ActionStatus.Pending]: 'Pending',
      [ActionStatus.InProgress]: 'In Progress',
      [ActionStatus.Blocked]: 'Blocked',
      [ActionStatus.Completed]: 'Completed',
      [ActionStatus.Failed]: 'Failed',
      [ActionStatus.Cancelled]: 'Cancelled'
    };
    return labels[this._value];
  }

  /**
   * Get description
   */
  public getDescription(): string {
    const descriptions: Record<ActionStatus, string> = {
      [ActionStatus.Pending]: 'Action is scheduled but not yet started',
      [ActionStatus.InProgress]: 'Action is currently being performed',
      [ActionStatus.Blocked]: 'Action is blocked by dependencies or issues',
      [ActionStatus.Completed]: 'Action has been successfully completed',
      [ActionStatus.Failed]: 'Action failed and may need to be retried',
      [ActionStatus.Cancelled]: 'Action was cancelled and will not be performed'
    };
    return descriptions[this._value];
  }

  /**
   * Get color for UI display
   */
  public getColor(): string {
    const colors: Record<ActionStatus, string> = {
      [ActionStatus.Pending]: 'gray',
      [ActionStatus.InProgress]: 'blue',
      [ActionStatus.Blocked]: 'orange',
      [ActionStatus.Completed]: 'green',
      [ActionStatus.Failed]: 'red',
      [ActionStatus.Cancelled]: 'gray'
    };
    return colors[this._value];
  }

  /**
   * Get progress percentage (0-100)
   */
  public getProgressPercentage(): number {
    const progress: Record<ActionStatus, number> = {
      [ActionStatus.Pending]: 0,
      [ActionStatus.InProgress]: 50,
      [ActionStatus.Blocked]: 25,
      [ActionStatus.Completed]: 100,
      [ActionStatus.Failed]: 0,
      [ActionStatus.Cancelled]: 0
    };
    return progress[this._value];
  }

  /**
   * Get phase (for grouping)
   */
  public getPhase(): string {
    const phases: Record<ActionStatus, string> = {
      [ActionStatus.Pending]: 'Not Started',
      [ActionStatus.InProgress]: 'Active',
      [ActionStatus.Blocked]: 'Active',
      [ActionStatus.Completed]: 'Complete',
      [ActionStatus.Failed]: 'Complete',
      [ActionStatus.Cancelled]: 'Complete'
    };
    return phases[this._value];
  }

  /**
   * Check if action is in progress
   */
  public isInProgress(): boolean {
    return this._value === ActionStatus.InProgress;
  }

  /**
   * Check if action is completed (successfully)
   */
  public isCompleted(): boolean {
    return this._value === ActionStatus.Completed;
  }

  /**
   * Check if action is in final state (completed, failed, or cancelled)
   */
  public isFinal(): boolean {
    return [
      ActionStatus.Completed,
      ActionStatus.Failed,
      ActionStatus.Cancelled
    ].includes(this._value);
  }

  /**
   * Check if action can be started
   */
  public canStart(): boolean {
    return this._value === ActionStatus.Pending || 
           this._value === ActionStatus.Failed;
  }

  /**
   * Check if action can be retried
   */
  public canRetry(): boolean {
    return this._value === ActionStatus.Failed || 
           this._value === ActionStatus.Blocked;
  }

  /**
   * Check if action requires attention
   */
  public requiresAttention(): boolean {
    return this._value === ActionStatus.Blocked || 
           this._value === ActionStatus.Failed;
  }

  /**
   * Validate status transition
   */
  public canTransitionTo(newStatus: ActionStatus): boolean {
    const transitions: Record<ActionStatus, ActionStatus[]> = {
      [ActionStatus.Pending]: [
        ActionStatus.InProgress,
        ActionStatus.Cancelled
      ],
      [ActionStatus.InProgress]: [
        ActionStatus.Completed,
        ActionStatus.Failed,
        ActionStatus.Blocked,
        ActionStatus.Cancelled
      ],
      [ActionStatus.Blocked]: [
        ActionStatus.InProgress,
        ActionStatus.Failed,
        ActionStatus.Cancelled
      ],
      [ActionStatus.Completed]: [],  // Terminal state
      [ActionStatus.Failed]: [
        ActionStatus.Pending,  // For retry
        ActionStatus.InProgress,  // For retry
        ActionStatus.Cancelled
      ],
      [ActionStatus.Cancelled]: []  // Terminal state
    };

    return transitions[this._value]?.includes(newStatus) ?? false;
  }

  /**
   * Get valid next statuses
   */
  public getValidNextStatuses(): ActionStatus[] {
    const transitions: Record<ActionStatus, ActionStatus[]> = {
      [ActionStatus.Pending]: [ActionStatus.InProgress, ActionStatus.Cancelled],
      [ActionStatus.InProgress]: [ActionStatus.Completed, ActionStatus.Failed, ActionStatus.Blocked, ActionStatus.Cancelled],
      [ActionStatus.Blocked]: [ActionStatus.InProgress, ActionStatus.Failed, ActionStatus.Cancelled],
      [ActionStatus.Completed]: [],
      [ActionStatus.Failed]: [ActionStatus.Pending, ActionStatus.InProgress, ActionStatus.Cancelled],
      [ActionStatus.Cancelled]: []
    };

    return transitions[this._value] || [];
  }

  /**
   * Get icon for UI display
   */
  public getIcon(): string {
    const icons: Record<ActionStatus, string> = {
      [ActionStatus.Pending]: '⏳',
      [ActionStatus.InProgress]: '🔄',
      [ActionStatus.Blocked]: '🚫',
      [ActionStatus.Completed]: '✅',
      [ActionStatus.Failed]: '❌',
      [ActionStatus.Cancelled]: '⛔'
    };
    return icons[this._value];
  }

  /**
   * Get sortable priority (lower = more important)
   * Used for ordering actions in lists
   */
  public getSortPriority(): number {
    const priorities: Record<ActionStatus, number> = {
      [ActionStatus.Failed]: 1,      // Failed actions need immediate attention
      [ActionStatus.Blocked]: 2,     // Blocked actions need resolution
      [ActionStatus.InProgress]: 3,  // In progress actions are active
      [ActionStatus.Pending]: 4,     // Pending actions are scheduled
      [ActionStatus.Cancelled]: 5,   // Cancelled actions are done
      [ActionStatus.Completed]: 6    // Completed actions are done
    };
    return priorities[this._value];
  }
}
