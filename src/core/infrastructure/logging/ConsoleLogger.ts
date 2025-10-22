/**
 * ConsoleLogger - Simple console-based logger implementation
 * Suitable for development and simple production scenarios
 */

import { ILogger, LogLevel, LogContext } from '../../application/interfaces/ILogger';

export class ConsoleLogger implements ILogger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? { ...context, error: error.message, stack: error.stack }
      : context;
    this.log(LogLevel.ERROR, message, errorContext);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? { ...context, error: error.message, stack: error.stack }
      : context;
    this.log(LogLevel.FATAL, message, errorContext);
  }

  child(context: LogContext): ILogger {
    return new ConsoleLogger({ ...this.context, ...context });
  }

  private log(level: LogLevel, message: string, additionalContext?: LogContext): void {
    const timestamp = new Date().toISOString();
    const fullContext = { ...this.context, ...additionalContext };
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...fullContext
    };

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }
}
