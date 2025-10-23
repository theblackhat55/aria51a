/**
 * DeleteRiskCommand
 * Command to delete a risk from the system
 * Follows CQRS pattern - commands change state
 */

export class DeleteRiskCommand {
  constructor(
    public readonly riskId: number, // Database ID
    public readonly deletedBy?: number,
    public readonly reason?: string
  ) {}

  /**
   * Validate command data
   */
  validate(): boolean {
    // Must have a valid risk ID
    return this.riskId > 0;
  }

  /**
   * Get command name for logging/tracking
   */
  getCommandName(): string {
    return 'DeleteRiskCommand';
  }

  /**
   * Get command metadata
   */
  getMetadata(): Record<string, any> {
    return {
      riskId: this.riskId,
      deletedBy: this.deletedBy,
      reason: this.reason
    };
  }
}
