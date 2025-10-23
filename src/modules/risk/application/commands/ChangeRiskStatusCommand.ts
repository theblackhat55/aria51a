/**
 * ChangeRiskStatusCommand
 * Command to change the status of a risk
 * Follows CQRS pattern - commands change state
 */

export class ChangeRiskStatusCommand {
  constructor(
    public readonly riskId: number, // Database ID
    public readonly newStatus: string,
    public readonly reason?: string,
    public readonly changedBy?: number
  ) {}

  /**
   * Validate command data
   */
  validate(): boolean {
    // Must have a valid risk ID
    if (!this.riskId || this.riskId <= 0) {
      return false;
    }

    // Must have a new status
    if (!this.newStatus || this.newStatus.trim().length === 0) {
      return false;
    }

    // Validate status is one of the allowed values
    const validStatuses = ['active', 'mitigated', 'accepted', 'transferred', 'avoided', 'closed', 'monitoring'];
    if (!validStatuses.includes(this.newStatus.toLowerCase())) {
      return false;
    }

    return true;
  }

  /**
   * Get command name for logging/tracking
   */
  getCommandName(): string {
    return 'ChangeRiskStatusCommand';
  }

  /**
   * Get command metadata
   */
  getMetadata(): Record<string, any> {
    return {
      riskId: this.riskId,
      newStatus: this.newStatus,
      reason: this.reason,
      changedBy: this.changedBy
    };
  }
}
