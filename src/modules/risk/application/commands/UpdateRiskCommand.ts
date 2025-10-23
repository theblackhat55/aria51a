/**
 * UpdateRiskCommand
 * Command to update an existing risk
 * Follows CQRS pattern - commands change state
 */

import { UpdateRiskDTO } from '../dto';

export class UpdateRiskCommand {
  constructor(
    public readonly riskId: number, // Database ID
    public readonly data: UpdateRiskDTO
  ) {}

  /**
   * Validate command data
   */
  validate(): boolean {
    // Must have a valid risk ID
    if (!this.riskId || this.riskId <= 0) {
      return false;
    }

    // Must have at least one field to update
    const hasUpdates = 
      this.data.title !== undefined ||
      this.data.description !== undefined ||
      this.data.category !== undefined ||
      this.data.probability !== undefined ||
      this.data.impact !== undefined ||
      this.data.status !== undefined ||
      this.data.ownerId !== undefined ||
      this.data.riskType !== undefined ||
      this.data.mitigationPlan !== undefined ||
      this.data.contingencyPlan !== undefined ||
      this.data.reviewDate !== undefined ||
      this.data.tags !== undefined;

    return hasUpdates;
  }

  /**
   * Get command name for logging/tracking
   */
  getCommandName(): string {
    return 'UpdateRiskCommand';
  }

  /**
   * Get command metadata
   */
  getMetadata(): Record<string, any> {
    return {
      riskId: this.riskId,
      updatedFields: Object.keys(this.data).filter(key => this.data[key] !== undefined),
      updatedBy: this.data.updatedBy
    };
  }
}
