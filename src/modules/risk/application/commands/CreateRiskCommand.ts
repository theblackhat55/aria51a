/**
 * CreateRiskCommand
 * Command to create a new risk in the system
 * Follows CQRS pattern - commands change state
 */

import { CreateRiskDTO } from '../dto';

export class CreateRiskCommand {
  constructor(public readonly data: CreateRiskDTO) {}

  /**
   * Validate command data
   */
  validate(): boolean {
    // Basic validation - detailed validation happens in handler
    if (!this.data.riskId || !this.data.title || !this.data.description) {
      return false;
    }

    if (!this.data.category || !this.data.probability || !this.data.impact) {
      return false;
    }

    if (!this.data.organizationId || !this.data.ownerId || !this.data.createdBy) {
      return false;
    }

    return true;
  }

  /**
   * Get command name for logging/tracking
   */
  getCommandName(): string {
    return 'CreateRiskCommand';
  }

  /**
   * Get command metadata
   */
  getMetadata(): Record<string, any> {
    return {
      riskId: this.data.riskId,
      category: this.data.category,
      organizationId: this.data.organizationId,
      createdBy: this.data.createdBy
    };
  }
}
