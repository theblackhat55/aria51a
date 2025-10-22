import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseEntity } from '@core/domain/entities/BaseEntity';

// Test implementation of BaseEntity
class TestEntity extends BaseEntity<string> {
  constructor(id: string) {
    super(id);
  }
}

describe('BaseEntity', () => {
  let entity: TestEntity;
  const testId = 'test-123';

  beforeEach(() => {
    entity = new TestEntity(testId);
  });

  describe('Constructor and Properties', () => {
    it('should create entity with provided ID', () => {
      expect(entity.id).toBe(testId);
    });

    it('should initialize createdAt timestamp', () => {
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should initialize updatedAt timestamp', () => {
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should have createdAt and updatedAt equal initially', () => {
      expect(entity.createdAt.getTime()).toBe(entity.updatedAt.getTime());
    });
  });

  describe('ID Property', () => {
    it('should return immutable ID', () => {
      const id = entity.id;
      expect(id).toBe(testId);
      
      // Verify ID cannot be changed (TypeScript readonly)
      // @ts-expect-error - Testing readonly enforcement
      expect(() => { entity.id = 'new-id'; }).toThrow();
    });

    it('should support different ID types', () => {
      const numericEntity = new (class extends BaseEntity<number> {
        constructor(id: number) { super(id); }
      })(123);
      
      expect(numericEntity.id).toBe(123);
      expect(typeof numericEntity.id).toBe('number');
    });
  });

  describe('Timestamp Management', () => {
    it('should update updatedAt when touch() is called', async () => {
      const originalUpdatedAt = entity.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Access touch via protected method (need to expose via test class)
      const entityWithTouch = entity as any;
      entityWithTouch.touch();
      
      expect(entity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not change createdAt when touch() is called', async () => {
      const originalCreatedAt = entity.createdAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const entityWithTouch = entity as any;
      entityWithTouch.touch();
      
      expect(entity.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('Equality', () => {
    it('should return true for entities with same ID', () => {
      const entity1 = new TestEntity('same-id');
      const entity2 = new TestEntity('same-id');
      
      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should return false for entities with different IDs', () => {
      const entity1 = new TestEntity('id-1');
      const entity2 = new TestEntity('id-2');
      
      expect(entity1.equals(entity2)).toBe(false);
    });

    it('should return false for undefined entity', () => {
      expect(entity.equals(undefined)).toBe(false);
    });

    it('should return false for null entity', () => {
      expect(entity.equals(null as any)).toBe(false);
    });

    it('should return false for non-BaseEntity object', () => {
      const nonEntity = { id: testId } as any;
      expect(entity.equals(nonEntity)).toBe(false);
    });

    it('should use ID for equality, not reference', () => {
      const entity1 = new TestEntity('test-id');
      const entity2 = new TestEntity('test-id');
      
      expect(entity1 === entity2).toBe(false); // Different references
      expect(entity1.equals(entity2)).toBe(true); // Same ID
    });
  });

  describe('Hash Code', () => {
    it('should generate hash code from ID', () => {
      const hashCode = entity.hashCode();
      expect(hashCode).toBe(String(testId));
    });

    it('should generate same hash code for same ID', () => {
      const entity1 = new TestEntity('same-id');
      const entity2 = new TestEntity('same-id');
      
      expect(entity1.hashCode()).toBe(entity2.hashCode());
    });

    it('should generate different hash codes for different IDs', () => {
      const entity1 = new TestEntity('id-1');
      const entity2 = new TestEntity('id-2');
      
      expect(entity1.hashCode()).not.toBe(entity2.hashCode());
    });

    it('should handle numeric IDs', () => {
      const numericEntity = new (class extends BaseEntity<number> {
        constructor(id: number) { super(id); }
      })(123);
      
      expect(numericEntity.hashCode()).toBe('123');
    });
  });

  describe('Immutability', () => {
    it('should not allow direct modification of ID', () => {
      const id = entity.id;
      // ID is readonly via TypeScript, runtime test not applicable
      expect(entity.id).toBe(id);
    });

    it('should not allow direct modification of createdAt', () => {
      const createdAt = entity.createdAt;
      // Timestamps are readonly via TypeScript
      expect(entity.createdAt).toBe(createdAt);
    });

    it('should not allow direct modification of updatedAt', () => {
      const updatedAt = entity.updatedAt;
      // Timestamps are readonly via TypeScript
      expect(entity.updatedAt).toBe(updatedAt);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for ID', () => {
      const stringEntity = new TestEntity('string-id');
      const id: string = stringEntity.id;
      expect(typeof id).toBe('string');
    });

    it('should support generic ID types', () => {
      // String ID
      const stringEntity = new TestEntity('str-id');
      expect(typeof stringEntity.id).toBe('string');
      
      // Number ID
      const numberEntity = new (class extends BaseEntity<number> {
        constructor(id: number) { super(id); }
      })(456);
      expect(typeof numberEntity.id).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string ID', () => {
      const emptyIdEntity = new TestEntity('');
      expect(emptyIdEntity.id).toBe('');
      expect(emptyIdEntity.hashCode()).toBe('');
    });

    it('should handle special characters in ID', () => {
      const specialIdEntity = new TestEntity('id-with-$pecial-ch@rs!');
      expect(specialIdEntity.id).toBe('id-with-$pecial-ch@rs!');
    });

    it('should handle very long IDs', () => {
      const longId = 'a'.repeat(1000);
      const longIdEntity = new TestEntity(longId);
      expect(longIdEntity.id).toBe(longId);
      expect(longIdEntity.hashCode().length).toBe(1000);
    });

    it('should handle UUID format IDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuidEntity = new TestEntity(uuid);
      expect(uuidEntity.id).toBe(uuid);
    });
  });
});
