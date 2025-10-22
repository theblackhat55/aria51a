/**
 * Comprehensive Core Domain Tests
 * Tests: ValueObject, DomainEvent, EventBus, Exceptions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValueObject } from '@core/domain/entities/ValueObject';
import { DomainEvent } from '@core/domain/events/DomainEvent';
import { EventBus } from '@core/domain/events/EventBus';
import { IEventHandler } from '@core/domain/events/IEventHandler';
import { DomainException } from '@core/domain/exceptions/DomainException';
import { ValidationException } from '@core/domain/exceptions/ValidationException';
import { NotFoundException } from '@core/domain/exceptions/NotFoundException';

// ====== ValueObject Tests ======

class TestValueObject extends ValueObject<{ name: string; age: number }> {
  constructor(name: string, age: number) {
    super({ name, age });
  }

  get name(): string { return this.props.name; }
  get age(): number { return this.props.age; }
}

describe('ValueObject', () => {
  it('should create immutable value object', () => {
    const vo = new TestValueObject('John', 30);
    expect(vo.name).toBe('John');
    expect(vo.age).toBe(30);
  });

  it('should return frozen props', () => {
    const vo = new TestValueObject('John', 30);
    expect(Object.isFrozen(vo.getValue())).toBe(true);
  });

  it('should compare by value equality', () => {
    const vo1 = new TestValueObject('John', 30);
    const vo2 = new TestValueObject('John', 30);
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should return false for different values', () => {
    const vo1 = new TestValueObject('John', 30);
    const vo2 = new TestValueObject('Jane', 30);
    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should generate hash code from value', () => {
    const vo1 = new TestValueObject('John', 30);
    const vo2 = new TestValueObject('John', 30);
    expect(vo1.hashCode()).toBe(vo2.hashCode());
  });
});

// ====== DomainEvent Tests ======

class TestDomainEvent extends DomainEvent {
  constructor(aggregateId: string, payload?: any) {
    super('TestEvent', aggregateId, payload);
  }
}

describe('DomainEvent', () => {
  it('should create event with metadata', () => {
    const event = new TestDomainEvent('agg-123', { test: 'data' });
    
    expect(event.eventId).toBeDefined();
    expect(event.eventType).toBe('TestEvent');
    expect(event.aggregateId).toBe('agg-123');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.payload).toEqual({ test: 'data' });
  });

  it('should generate unique event IDs', () => {
    const event1 = new TestDomainEvent('agg-123');
    const event2 = new TestDomainEvent('agg-123');
    
    expect(event1.eventId).not.toBe(event2.eventId);
  });

  it('should serialize to JSON', () => {
    const event = new TestDomainEvent('agg-123', { test: 'data' });
    const json = event.toJSON();
    
    expect(json).toHaveProperty('eventId');
    expect(json).toHaveProperty('eventType');
    expect(json).toHaveProperty('occurredOn');
    expect(json).toHaveProperty('aggregateId');
    expect(json).toHaveProperty('payload');
  });
});

// ====== EventBus Tests ======

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clearSubscriptions();
  });

  it('should be singleton', () => {
    const instance1 = EventBus.getInstance();
    const instance2 = EventBus.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should subscribe to events', async () => {
    const handler = vi.fn();
    const mockHandler: IEventHandler<TestDomainEvent> = { handle: handler };
    
    eventBus.subscribe('TestEvent', mockHandler);
    
    const event = new TestDomainEvent('agg-123');
    await eventBus.publish(event);
    
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should handle multiple subscribers', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    eventBus.subscribe('TestEvent', { handle: handler1 });
    eventBus.subscribe('TestEvent', { handle: handler2 });
    
    const event = new TestDomainEvent('agg-123');
    await eventBus.publish(event);
    
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should execute handlers by priority', async () => {
    const executionOrder: number[] = [];
    
    eventBus.subscribe('TestEvent', { 
      handle: async () => { executionOrder.push(1); }
    }, 1);
    
    eventBus.subscribe('TestEvent', { 
      handle: async () => { executionOrder.push(3); }
    }, 3);
    
    eventBus.subscribe('TestEvent', { 
      handle: async () => { executionOrder.push(2); }
    }, 2);
    
    await eventBus.publish(new TestDomainEvent('agg-123'));
    
    expect(executionOrder).toEqual([3, 2, 1]);
  });

  it('should handle errors gracefully', async () => {
    const handler1 = vi.fn(() => { throw new Error('Handler error'); });
    const handler2 = vi.fn();
    
    eventBus.subscribe('TestEvent', { handle: handler1 });
    eventBus.subscribe('TestEvent', { handle: handler2 });
    
    const event = new TestDomainEvent('agg-123');
    await eventBus.publish(event);
    
    // Both handlers should be called despite error
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should publish multiple events', async () => {
    const handler = vi.fn();
    eventBus.subscribe('TestEvent', { handle: handler });
    
    const events = [
      new TestDomainEvent('agg-1'),
      new TestDomainEvent('agg-2'),
      new TestDomainEvent('agg-3')
    ];
    
    await eventBus.publishAll(events);
    
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('should unsubscribe handlers', async () => {
    const handler = vi.fn();
    const mockHandler = { handle: handler };
    
    eventBus.subscribe('TestEvent', mockHandler);
    eventBus.unsubscribe('TestEvent', mockHandler);
    
    await eventBus.publish(new TestDomainEvent('agg-123'));
    
    expect(handler).not.toHaveBeenCalled();
  });

  it('should subscribe to all events', async () => {
    const handler = vi.fn();
    eventBus.subscribeToAll({ handle: handler });
    
    await eventBus.publish(new TestDomainEvent('agg-123'));
    
    expect(handler).toHaveBeenCalled();
  });

  it('should clear all subscriptions', () => {
    const handler = vi.fn();
    eventBus.subscribe('TestEvent', { handle: handler });
    eventBus.clearSubscriptions();
    
    // Should not throw
    expect(() => eventBus.publish(new TestDomainEvent('agg-123'))).not.toThrow();
  });
});

// ====== Exception Tests ======

describe('DomainException', () => {
  it('should create exception with message and code', () => {
    const error = new DomainException('Test error', 'TEST_ERROR');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should include details', () => {
    const details = { field: 'test', value: 123 };
    const error = new DomainException('Test error', 'TEST_ERROR', details);
    
    expect(error.details).toEqual(details);
  });

  it('should have default code', () => {
    const error = new DomainException('Test error');
    expect(error.code).toBe('DOMAIN_ERROR');
  });

  it('should be instance of Error', () => {
    const error = new DomainException('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have name DomainException', () => {
    const error = new DomainException('Test error');
    expect(error.name).toBe('DomainException');
  });
});

describe('ValidationException', () => {
  it('should create with validation errors', () => {
    const errors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'age', message: 'Must be positive', value: -1 }
    ];
    
    const error = new ValidationException(errors);
    
    expect(error.errors).toEqual(errors);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create from single field', () => {
    const error = ValidationException.fromField('email', 'Invalid email', 'not-an-email');
    
    expect(error.errors.length).toBe(1);
    expect(error.errors[0].field).toBe('email');
    expect(error.errors[0].message).toBe('Invalid email');
    expect(error.errors[0].value).toBe('not-an-email');
  });

  it('should check for field errors', () => {
    const errors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'age', message: 'Must be positive' }
    ];
    
    const error = new ValidationException(errors);
    
    expect(error.hasFieldError('email')).toBe(true);
    expect(error.hasFieldError('name')).toBe(false);
  });

  it('should have custom message', () => {
    const error = new ValidationException([], 'Custom validation message');
    expect(error.message).toBe('Custom validation message');
  });
});

describe('NotFoundException', () => {
  it('should create with entity name and ID', () => {
    const error = new NotFoundException('User', 'user-123');
    
    expect(error.message).toContain('User');
    expect(error.message).toContain('user-123');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should include entity details', () => {
    const error = new NotFoundException('User', 'user-123');
    
    expect(error.details.entityName).toBe('User');
    expect(error.details.entityId).toBe('user-123');
  });

  it('should be instance of DomainException', () => {
    const error = new NotFoundException('User', 'user-123');
    expect(error).toBeInstanceOf(DomainException);
  });
});
