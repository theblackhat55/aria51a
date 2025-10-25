/**
 * Base Command Class
 * 
 * Represents an intention to change the state of the system (write operation).
 * Commands should be named in the imperative mood (e.g., CreateRisk, UpdateUser).
 * 
 * @abstract
 */

export abstract class Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = this.generateCommandId();
    this.timestamp = new Date();
  }

  /**
   * Generate a unique command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate the command before execution
   * Override this method for command-specific validation
   */
  public validate(): void {
    // Override in subclasses for validation logic
  }
}
