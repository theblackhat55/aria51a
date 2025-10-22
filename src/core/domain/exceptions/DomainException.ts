/**
 * DomainException - Base exception for domain-level errors
 * These represent business rule violations or invalid domain states
 */

export class DomainException extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(message: string, code: string = 'DOMAIN_ERROR', details?: any) {
    super(message);
    this.name = 'DomainException';
    this.code = code;
    this.timestamp = new Date();
    this.details = details;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainException);
    }
  }

  public toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
      stack: this.stack
    };
  }
}
