/**
 * ValidationMiddleware - Request Validation
 * 
 * Validates incoming request data against schemas.
 * Ensures data integrity and type safety before processing.
 */

import { Context, Next } from 'hono';
import { ValidationException, ValidationError } from '../../../domain/exceptions/ValidationException';
import { ResponseDTO } from '../../../application/dto/ResponseDTO';

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /**
   * Field type
   */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid' | 'date';
  
  /**
   * Whether field is required
   */
  required?: boolean;
  
  /**
   * Minimum value/length
   */
  min?: number;
  
  /**
   * Maximum value/length
   */
  max?: number;
  
  /**
   * Regex pattern for string validation
   */
  pattern?: RegExp;
  
  /**
   * Custom validation function
   */
  custom?: (value: any) => boolean | string;
  
  /**
   * Allowed values (enum)
   */
  enum?: any[];
  
  /**
   * Nested schema for object/array validation
   */
  schema?: ValidationSchema;
  
  /**
   * Custom error message
   */
  message?: string;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  /**
   * Schema to validate against
   */
  schema: ValidationSchema;
  
  /**
   * Where to find data to validate
   */
  source?: 'body' | 'query' | 'params';
  
  /**
   * Whether to strip unknown fields
   */
  stripUnknown?: boolean;
  
  /**
   * Whether to allow partial validation (not all required fields)
   */
  allowPartial?: boolean;
}

/**
 * Validation middleware factory
 * 
 * @example
 * ```typescript
 * const createUserSchema: ValidationSchema = {
 *   email: { type: 'email', required: true },
 *   name: { type: 'string', required: true, min: 2, max: 100 },
 *   age: { type: 'number', min: 18, max: 120 }
 * };
 * 
 * app.post('/api/users', 
 *   validate({ schema: createUserSchema, source: 'body' }), 
 *   async (c) => { ... }
 * );
 * ```
 */
export function validate(config: ValidationConfig) {
  return async (c: Context, next: Next) => {
    try {
      // Get data to validate
      let data: any;
      const source = config.source || 'body';
      
      if (source === 'body') {
        data = await c.req.json();
      } else if (source === 'query') {
        data = Object.fromEntries(c.req.queries());
      } else if (source === 'params') {
        data = c.req.param();
      }

      // Validate data
      const errors = validateData(data, config.schema, config);
      
      if (errors.length > 0) {
        return c.json(
          ResponseDTO.validationError(errors),
          400
        );
      }

      // Store validated data in context
      c.set('validatedData', data);
      
      await next();
      
    } catch (error) {
      if (error instanceof ValidationException) {
        return c.json(
          ResponseDTO.validationError(error.errors),
          400
        );
      }
      throw error;
    }
  };
}

/**
 * Validate data against schema
 */
function validateData(
  data: any, 
  schema: ValidationSchema,
  config: ValidationConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check each field in schema
  for (const [field, rule] of Object.entries(schema)) {
    const value = data?.[field];

    // Check required
    if (rule.required && !config.allowPartial && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: rule.message || `${field} is required`,
        value
      });
      continue;
    }

    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Validate type
    const typeError = validateType(field, value, rule);
    if (typeError) {
      errors.push(typeError);
      continue;
    }

    // Validate constraints
    const constraintErrors = validateConstraints(field, value, rule);
    errors.push(...constraintErrors);
  }

  // Check for unknown fields
  if (config.stripUnknown && data && typeof data === 'object') {
    for (const field of Object.keys(data)) {
      if (!schema[field]) {
        delete data[field];
      }
    }
  }

  return errors;
}

/**
 * Validate field type
 */
function validateType(field: string, value: any, rule: ValidationRule): ValidationError | null {
  const actualType = typeof value;

  switch (rule.type) {
    case 'string':
      if (actualType !== 'string') {
        return { field, message: `${field} must be a string`, value };
      }
      break;

    case 'number':
      if (actualType !== 'number' || isNaN(value)) {
        return { field, message: `${field} must be a number`, value };
      }
      break;

    case 'boolean':
      if (actualType !== 'boolean') {
        return { field, message: `${field} must be a boolean`, value };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { field, message: `${field} must be an array`, value };
      }
      break;

    case 'object':
      if (actualType !== 'object' || Array.isArray(value)) {
        return { field, message: `${field} must be an object`, value };
      }
      break;

    case 'email':
      if (actualType !== 'string' || !isValidEmail(value)) {
        return { field, message: `${field} must be a valid email`, value };
      }
      break;

    case 'url':
      if (actualType !== 'string' || !isValidUrl(value)) {
        return { field, message: `${field} must be a valid URL`, value };
      }
      break;

    case 'uuid':
      if (actualType !== 'string' || !isValidUuid(value)) {
        return { field, message: `${field} must be a valid UUID`, value };
      }
      break;

    case 'date':
      if (actualType !== 'string' || isNaN(Date.parse(value))) {
        return { field, message: `${field} must be a valid date`, value };
      }
      break;
  }

  return null;
}

/**
 * Validate field constraints
 */
function validateConstraints(field: string, value: any, rule: ValidationRule): ValidationError[] {
  const errors: ValidationError[] = [];

  // Min/Max for numbers
  if (rule.type === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must be at least ${rule.min}`, 
        value 
      });
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must be at most ${rule.max}`, 
        value 
      });
    }
  }

  // Min/Max for strings
  if (rule.type === 'string') {
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must be at least ${rule.min} characters`, 
        value 
      });
    }
    if (rule.max !== undefined && value.length > rule.max) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must be at most ${rule.max} characters`, 
        value 
      });
    }
  }

  // Min/Max for arrays
  if (rule.type === 'array') {
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must have at least ${rule.min} items`, 
        value 
      });
    }
    if (rule.max !== undefined && value.length > rule.max) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must have at most ${rule.max} items`, 
        value 
      });
    }
  }

  // Pattern matching
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      errors.push({ 
        field, 
        message: rule.message || `${field} has invalid format`, 
        value 
      });
    }
  }

  // Enum validation
  if (rule.enum && rule.enum.length > 0) {
    if (!rule.enum.includes(value)) {
      errors.push({ 
        field, 
        message: rule.message || `${field} must be one of: ${rule.enum.join(', ')}`, 
        value 
      });
    }
  }

  // Custom validation
  if (rule.custom) {
    const result = rule.custom(value);
    if (result !== true) {
      errors.push({ 
        field, 
        message: typeof result === 'string' ? result : (rule.message || `${field} validation failed`), 
        value 
      });
    }
  }

  // Nested schema validation
  if (rule.schema) {
    if (rule.type === 'object') {
      const nestedErrors = validateData(value, rule.schema, { schema: rule.schema });
      errors.push(...nestedErrors.map(e => ({
        ...e,
        field: `${field}.${e.field}`
      })));
    } else if (rule.type === 'array' && Array.isArray(value)) {
      value.forEach((item, index) => {
        const nestedErrors = validateData(item, rule.schema!, { schema: rule.schema! });
        errors.push(...nestedErrors.map(e => ({
          ...e,
          field: `${field}[${index}].${e.field}`
        })));
      });
    }
  }

  return errors;
}

/**
 * Email validation regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * UUID validation regex
 */
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Helper to get validated data from context
 * 
 * @example
 * ```typescript
 * app.post('/api/users', validate({ schema }), async (c) => {
 *   const data = getValidatedData(c);
 *   // data is validated and type-safe
 * });
 * ```
 */
export function getValidatedData<T = any>(c: Context): T {
  return c.get('validatedData');
}
