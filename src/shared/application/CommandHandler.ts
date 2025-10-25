/**
 * Command Handler Interface
 * 
 * Handles the execution of commands (write operations).
 * Each command should have exactly one handler.
 * 
 * @interface
 */

import { Command } from './Command';

export interface CommandHandler<TCommand extends Command, TResult = void> {
  /**
   * Execute the command and return the result
   * 
   * @param command - The command to execute
   * @returns Promise resolving to the command result
   * @throws Error if command execution fails
   */
  execute(command: TCommand): Promise<TResult>;
}

/**
 * Base Command Handler Abstract Class
 * 
 * Provides common functionality for command handlers
 */
export abstract class BaseCommandHandler<TCommand extends Command, TResult = void>
  implements CommandHandler<TCommand, TResult> {
  
  /**
   * Execute the command with pre/post execution hooks
   */
  public async execute(command: TCommand): Promise<TResult> {
    // Validate command before execution
    command.validate();

    // Pre-execution hook
    await this.beforeExecute(command);

    // Execute the command
    const result = await this.handle(command);

    // Post-execution hook
    await this.afterExecute(command, result);

    return result;
  }

  /**
   * Handle the command execution
   * Override this method with actual command logic
   */
  protected abstract handle(command: TCommand): Promise<TResult>;

  /**
   * Hook executed before command handling
   * Override for logging, metrics, etc.
   */
  protected async beforeExecute(command: TCommand): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Hook executed after successful command handling
   * Override for logging, metrics, event publishing, etc.
   */
  protected async afterExecute(command: TCommand, result: TResult): Promise<void> {
    // Override in subclasses if needed
  }
}
