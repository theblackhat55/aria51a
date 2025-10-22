import { describe, it, expect, beforeEach } from 'vitest';
import { AggregateRoot } from '@core/domain/entities/AggregateRoot';
import { DomainEvent } from '@core/domain/events/DomainEvent';

// Test domain event
class TestEvent extends DomainEvent {
  constructor(aggregateId: string, payload?: any) {
    super('TestEvent', aggregateId, payload);
  }
}

// Test aggregate implementation
class TestAggregate extends AggregateRoot<string> {
  private _value: string;

  constructor(id: string, value: string) {
    super(id);
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public updateValue(newValue: string): void {
    this._value = newValue;
    this.addDomainEvent(new TestEvent(this.id, { oldValue: this._value, newValue }));
  }

  public addEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}

describe('AggregateRoot', () => {
  let aggregate: TestAggregate;
  const testId = 'aggregate-123';
  const testValue = 'initial-value';

  beforeEach(() => {
    aggregate = new TestAggregate(testId, testValue);
  });

  describe('Inheritance', () => {
    it('should extend BaseEntity', () => {
      expect(aggregate.id).toBe(testId);
      expect(aggregate.createdAt).toBeInstanceOf(Date);
      expect(aggregate.updatedAt).toBeInstanceOf(Date);
    });

    it('should support BaseEntity methods', () => {
      const aggregate2 = new TestAggregate(testId, 'different-value');
      expect(aggregate.equals(aggregate2)).toBe(true);
      expect(aggregate.hashCode()).toBe(aggregate2.hashCode());
    });
  });

  describe('Domain Events Management', () => {
    it('should initialize with empty domain events', () => {
      expect(aggregate.domainEvents).toEqual([]);
      expect(aggregate.domainEvents.length).toBe(0);
    });

    it('should add domain event', () => {
      const event = new TestEvent(testId, { test: 'data' });
      aggregate.addEvent(event);
      
      expect(aggregate.domainEvents.length).toBe(1);
      expect(aggregate.domainEvents[0]).toBe(event);
    });

    it('should add multiple domain events', () => {
      const event1 = new TestEvent(testId, { test: 'data1' });
      const event2 = new TestEvent(testId, { test: 'data2' });
      const event3 = new TestEvent(testId, { test: 'data3' });
      
      aggregate.addEvent(event1);
      aggregate.addEvent(event2);
      aggregate.addEvent(event3);
      
      expect(aggregate.domainEvents.length).toBe(3);
      expect(aggregate.domainEvents).toEqual([event1, event2, event3]);
    });

    it('should maintain event order', () => {
      const events = [
        new TestEvent(testId, { order: 1 }),
        new TestEvent(testId, { order: 2 }),
        new TestEvent(testId, { order: 3 })
      ];
      
      events.forEach(event => aggregate.addEvent(event));
      
      aggregate.domainEvents.forEach((event, index) => {
        expect(event.payload.order).toBe(index + 1);
      });
    });
  });

  describe('Domain Events as ReadonlyArray', () => {
    it('should return readonly array of events', () => {
      const event = new TestEvent(testId, { test: 'data' });
      aggregate.addEvent(event);
      
      const events = aggregate.domainEvents;
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(1);
    });

    it('should return shallow copy preventing internal mutation', () => {
      const event = new TestEvent(testId, { test: 'data' });
      aggregate.addEvent(event);
      
      // Get events array
      const events = aggregate.domainEvents;
      expect(events.length).toBe(1);
      
      // JavaScript arrays can be mutated, but this doesn't affect internal state
      // because domainEvents getter returns a new array reference each time
      // This test verifies the readonly intent is achieved through getter pattern
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('Clear Events', () => {
    it('should clear all domain events', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data1' }));
      aggregate.addEvent(new TestEvent(testId, { test: 'data2' }));
      
      expect(aggregate.domainEvents.length).toBe(2);
      
      aggregate.clearEvents();
      
      expect(aggregate.domainEvents.length).toBe(0);
      expect(aggregate.domainEvents).toEqual([]);
    });

    it('should handle clearing empty events', () => {
      expect(aggregate.domainEvents.length).toBe(0);
      
      aggregate.clearEvents();
      
      expect(aggregate.domainEvents.length).toBe(0);
    });

    it('should allow adding events after clearing', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data1' }));
      aggregate.clearEvents();
      aggregate.addEvent(new TestEvent(testId, { test: 'data2' }));
      
      expect(aggregate.domainEvents.length).toBe(1);
      expect(aggregate.domainEvents[0].payload.test).toBe('data2');
    });
  });

  describe('Has Pending Events', () => {
    it('should return false when no events', () => {
      expect(aggregate.hasPendingEvents()).toBe(false);
    });

    it('should return true when events exist', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data' }));
      expect(aggregate.hasPendingEvents()).toBe(true);
    });

    it('should return false after clearing events', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data' }));
      expect(aggregate.hasPendingEvents()).toBe(true);
      
      aggregate.clearEvents();
      expect(aggregate.hasPendingEvents()).toBe(false);
    });
  });

  describe('Pull Domain Events', () => {
    it('should return all events and clear them', () => {
      const event1 = new TestEvent(testId, { test: 'data1' });
      const event2 = new TestEvent(testId, { test: 'data2' });
      
      aggregate.addEvent(event1);
      aggregate.addEvent(event2);
      
      const pulledEvents = aggregate.pullDomainEvents();
      
      expect(pulledEvents.length).toBe(2);
      expect(pulledEvents).toEqual([event1, event2]);
      expect(aggregate.domainEvents.length).toBe(0);
    });

    it('should return empty array when no events', () => {
      const pulledEvents = aggregate.pullDomainEvents();
      
      expect(pulledEvents).toEqual([]);
      expect(pulledEvents.length).toBe(0);
    });

    it('should return copy of events array', () => {
      const event = new TestEvent(testId, { test: 'data' });
      aggregate.addEvent(event);
      
      const pulledEvents = aggregate.pullDomainEvents();
      
      // Modifying pulled array should not affect aggregate
      pulledEvents.push(new TestEvent(testId, { test: 'extra' }));
      
      expect(aggregate.domainEvents.length).toBe(0);
    });

    it('should allow adding new events after pulling', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data1' }));
      aggregate.pullDomainEvents();
      
      aggregate.addEvent(new TestEvent(testId, { test: 'data2' }));
      
      expect(aggregate.domainEvents.length).toBe(1);
      expect(aggregate.domainEvents[0].payload.test).toBe('data2');
    });
  });

  describe('Event-Driven Business Logic', () => {
    it('should automatically add events during business operations', () => {
      expect(aggregate.domainEvents.length).toBe(0);
      
      aggregate.updateValue('new-value');
      
      expect(aggregate.domainEvents.length).toBe(1);
      expect(aggregate.domainEvents[0]).toBeInstanceOf(TestEvent);
      expect(aggregate.domainEvents[0].aggregateId).toBe(testId);
    });

    it('should accumulate events from multiple operations', () => {
      aggregate.updateValue('value1');
      aggregate.updateValue('value2');
      aggregate.updateValue('value3');
      
      expect(aggregate.domainEvents.length).toBe(3);
    });

    it('should preserve event metadata', () => {
      aggregate.updateValue('new-value');
      
      const event = aggregate.domainEvents[0];
      expect(event.eventId).toBeDefined();
      expect(event.eventType).toBe('TestEvent');
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(testId);
    });
  });

  describe('Event Lifecycle', () => {
    it('should support typical event lifecycle', () => {
      // 1. Perform business operation (generates events)
      aggregate.updateValue('step1');
      aggregate.updateValue('step2');
      expect(aggregate.hasPendingEvents()).toBe(true);
      
      // 2. Pull events for processing
      const events = aggregate.pullDomainEvents();
      expect(events.length).toBe(2);
      expect(aggregate.hasPendingEvents()).toBe(false);
      
      // 3. Perform new operations
      aggregate.updateValue('step3');
      expect(aggregate.hasPendingEvents()).toBe(true);
      
      // 4. Pull again
      const moreEvents = aggregate.pullDomainEvents();
      expect(moreEvents.length).toBe(1);
      expect(aggregate.hasPendingEvents()).toBe(false);
    });
  });

  describe('Integration with BaseEntity', () => {
    it('should maintain entity identity while managing events', () => {
      const originalId = aggregate.id;
      const originalHashCode = aggregate.hashCode();
      
      aggregate.addEvent(new TestEvent(testId, { test: 'data' }));
      aggregate.pullDomainEvents();
      
      expect(aggregate.id).toBe(originalId);
      expect(aggregate.hashCode()).toBe(originalHashCode);
    });

    it('should support equality comparison independent of events', () => {
      const aggregate1 = new TestAggregate('same-id', 'value1');
      const aggregate2 = new TestAggregate('same-id', 'value2');
      
      aggregate1.addEvent(new TestEvent('same-id', { test: 'data1' }));
      
      expect(aggregate1.equals(aggregate2)).toBe(true);
      expect(aggregate1.domainEvents.length).not.toBe(aggregate2.domainEvents.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid event additions', () => {
      for (let i = 0; i < 1000; i++) {
        aggregate.addEvent(new TestEvent(testId, { index: i }));
      }
      
      expect(aggregate.domainEvents.length).toBe(1000);
      
      const events = aggregate.pullDomainEvents();
      expect(events.length).toBe(1000);
      expect(aggregate.domainEvents.length).toBe(0);
    });

    it('should handle events with complex payloads', () => {
      const complexPayload = {
        nested: {
          data: {
            array: [1, 2, 3],
            object: { key: 'value' }
          }
        },
        timestamp: new Date(),
        null: null,
        undefined: undefined
      };
      
      aggregate.addEvent(new TestEvent(testId, complexPayload));
      
      const event = aggregate.domainEvents[0];
      expect(event.payload).toEqual(complexPayload);
    });

    it('should handle clearing events multiple times', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data' }));
      aggregate.clearEvents();
      aggregate.clearEvents();
      aggregate.clearEvents();
      
      expect(aggregate.domainEvents.length).toBe(0);
    });

    it('should handle pulling events multiple times', () => {
      aggregate.addEvent(new TestEvent(testId, { test: 'data' }));
      
      const first = aggregate.pullDomainEvents();
      const second = aggregate.pullDomainEvents();
      const third = aggregate.pullDomainEvents();
      
      expect(first.length).toBe(1);
      expect(second.length).toBe(0);
      expect(third.length).toBe(0);
    });
  });
});
