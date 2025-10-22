/**
 * Comprehensive Infrastructure Tests
 * Tests: DependencyContainer, ConsoleLogger, DTOs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyContainer } from '@core/infrastructure/DependencyContainer';
import { ConsoleLogger } from '@core/infrastructure/logging/ConsoleLogger';
import { PaginationDTO } from '@core/application/dto/PaginationDTO';
import { ResponseDTO } from '@core/application/dto/ResponseDTO';

// ====== DependencyContainer Tests ======

class TestService {
  getValue() { return 'test'; }
}

class TestServiceWithDeps {
  constructor(private dependency: TestService) {}
  getDependency() { return this.dependency; }
}

describe('DependencyContainer', () => {
  let container: DependencyContainer;

  beforeEach(() => {
    container = DependencyContainer.getInstance();
    container.clear();
  });

  it('should be singleton', () => {
    const instance1 = DependencyContainer.getInstance();
    const instance2 = DependencyContainer.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register and resolve singleton', () => {
    container.registerSingleton('TestService', TestService);
    
    const instance1 = container.resolve<TestService>('TestService');
    const instance2 = container.resolve<TestService>('TestService');
    
    expect(instance1).toBe(instance2); // Same instance
    expect(instance1.getValue()).toBe('test');
  });

  it('should register and resolve transient', () => {
    container.registerTransient('TestService', TestService);
    
    const instance1 = container.resolve<TestService>('TestService');
    const instance2 = container.resolve<TestService>('TestService');
    
    expect(instance1).not.toBe(instance2); // Different instances
    expect(instance1.getValue()).toBe('test');
  });

  it('should register and resolve instance', () => {
    const instance = new TestService();
    container.registerInstance('TestService', instance);
    
    const resolved = container.resolve<TestService>('TestService');
    
    expect(resolved).toBe(instance);
  });

  it('should throw on unregistered service', () => {
    expect(() => {
      container.resolve('UnregisteredService');
    }).toThrow();
  });

  it('should check if service exists', () => {
    container.registerSingleton('TestService', TestService);
    
    expect(container.has('TestService')).toBe(true);
    expect(container.has('NonExistent')).toBe(false);
  });

  it('should clear all services', () => {
    container.registerSingleton('TestService', TestService);
    expect(container.has('TestService')).toBe(true);
    
    container.clear();
    expect(container.has('TestService')).toBe(false);
  });

  it('should register factory function', () => {
    container.registerSingleton('TestService', () => new TestService());
    
    const instance = container.resolve<TestService>('TestService');
    expect(instance.getValue()).toBe('test');
  });
});

// ====== ConsoleLogger Tests ======

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new ConsoleLogger();
    // ConsoleLogger uses console.debug, console.info, console.warn, console.error
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    consoleSpy.debug.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('should log debug messages', () => {
    logger.debug('Debug message');
    expect(consoleSpy.debug).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.info('Info message');
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('Warning message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Error message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should log with context', () => {
    logger.info('Message', { userId: '123', action: 'login' });
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should create child logger with context', () => {
    const childLogger = logger.child({ service: 'AuthService' });
    childLogger.info('Child message');
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should include timestamp in logs', () => {
    logger.info('Test message');
    const logOutput = JSON.parse(consoleSpy.info.mock.calls[0][0]);
    expect(logOutput).toHaveProperty('timestamp');
  });
});

// ====== PaginationDTO Tests ======

describe('PaginationDTO', () => {
  it('should create pagination response', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const response = PaginationDTO.createResponse(items, 10, 1, 5);
    
    expect(response.items).toEqual(items);
    expect(response.page).toBe(1);
    expect(response.limit).toBe(5);
    expect(response.total).toBe(10);
    expect(response.totalPages).toBe(2);
    expect(response.hasNext).toBe(true);
  });

  it('should calculate offset correctly', () => {
    expect(PaginationDTO.calculateOffset(1, 10)).toBe(0);
    expect(PaginationDTO.calculateOffset(2, 10)).toBe(10);
    expect(PaginationDTO.calculateOffset(3, 10)).toBe(20);
  });

  it('should validate pagination parameters', () => {
    expect(PaginationDTO.validate(1, 10)).toBe(true);
    expect(PaginationDTO.validate(0, 10)).toBe(false);
    expect(PaginationDTO.validate(1, 0)).toBe(false);
    expect(PaginationDTO.validate(-1, 10)).toBe(false);
  });

  it('should calculate total pages correctly', () => {
    const response1 = PaginationDTO.createResponse([], 10, 1, 5);
    expect(response1.totalPages).toBe(2);
    
    const response2 = PaginationDTO.createResponse([], 15, 1, 5);
    expect(response2.totalPages).toBe(3);
    
    const response3 = PaginationDTO.createResponse([], 0, 1, 5);
    expect(response3.totalPages).toBe(0);
  });

  it('should determine hasNext correctly', () => {
    const response1 = PaginationDTO.createResponse([], 10, 1, 5);
    expect(response1.hasNext).toBe(true);
    
    const response2 = PaginationDTO.createResponse([], 10, 2, 5);
    expect(response2.hasNext).toBe(false);
  });
});

// ====== ResponseDTO Tests ======

describe('ResponseDTO', () => {
  it('should create success response', () => {
    const data = { userId: '123', name: 'John' };
    const response = ResponseDTO.success(data);
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.timestamp).toBeDefined();
  });

  it('should create error response', () => {
    const response = ResponseDTO.error('ERROR_CODE', 'Error message');
    
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe('ERROR_CODE');
    expect(response.error?.message).toBe('Error message');
  });

  it('should create validation error response', () => {
    const errors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'age', message: 'Must be positive' }
    ];
    
    const response = ResponseDTO.validationError(errors);
    
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('VALIDATION_ERROR');
    expect(response.error?.details).toEqual({ errors });
  });

  it('should create not found response', () => {
    const response = ResponseDTO.notFound('User', 'user-123');
    
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('NOT_FOUND');
    expect(response.error?.message).toContain('User');
    expect(response.error?.message).toContain('user-123');
  });

  it('should create unauthorized response', () => {
    const response = ResponseDTO.unauthorized('Please log in');
    
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('UNAUTHORIZED');
    expect(response.error?.message).toBe('Please log in');
  });

  it('should create forbidden response', () => {
    const response = ResponseDTO.forbidden('Access denied');
    
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('FORBIDDEN');
    expect(response.error?.message).toBe('Access denied');
  });

  it('should include meta in success response', () => {
    const meta = { requestId: 'req-123', duration: 150 };
    const response = ResponseDTO.success({ data: 'test' }, meta);
    
    expect(response.meta).toEqual(meta);
  });

  it('should exclude stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const response = ResponseDTO.error('ERROR', 'Message', undefined, 'stack trace here');
    
    expect(response.error?.stack).toBeUndefined();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should include stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const stackTrace = 'Error: Test\n  at file.ts:10:5';
    const response = ResponseDTO.error('ERROR', 'Message', undefined, stackTrace);
    
    expect(response.error?.stack).toBe(stackTrace);
    
    process.env.NODE_ENV = originalEnv;
  });
});
