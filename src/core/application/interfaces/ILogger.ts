/**
 * ILogger - Interface for logging abstraction
 * Allows different logging implementations without coupling to specific logger
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogContext {
  [key: string]: any;
}

export interface ILogger {
  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, context?: LogContext): void;

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): ILogger;
}
