/**
 * ValidationException - Exception for validation errors
 * Thrown when entity or value object validation fails
 */

import { DomainException } from './DomainException';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationException extends DomainException {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[], message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationException';
    this.errors = errors;
  }

  /**
   * Create from single field error
   */
  public static fromField(field: string, message: string, value?: any): ValidationException {
    return new ValidationException([{ field, message, value }]);
  }

  /**
   * Check if specific field has error
   */
  public hasFieldError(field: string): boolean {
    return this.errors.some(error => error.field === field);
  }

  /**
   * Get errors for specific field
   */
  public getFieldErrors(field: string): ValidationError[] {
    return this.errors.filter(error => error.field === field);
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      errors: this.errors
    };
  }
}
