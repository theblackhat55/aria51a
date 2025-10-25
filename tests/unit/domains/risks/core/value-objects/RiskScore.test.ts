/**
 * Unit tests for RiskScore value object
 */

import { describe, it, expect } from 'vitest';
import { RiskScore } from '@/domains/risks/core/value-objects/RiskScore';

describe('RiskScore Value Object', () => {
  describe('calculate()', () => {
    it('should calculate score correctly', () => {
      const score = RiskScore.calculate(4, 5);
      expect(score.score).toBe(20);
    });

    it('should reject invalid probability', () => {
      expect(() => RiskScore.calculate(0, 5)).toThrow(
        'Probability must be an integer between 1 and 5'
      );
      expect(() => RiskScore.calculate(6, 5)).toThrow(
        'Probability must be an integer between 1 and 5'
      );
    });

    it('should reject invalid impact', () => {
      expect(() => RiskScore.calculate(4, 0)).toThrow(
        'Impact must be an integer between 1 and 5'
      );
      expect(() => RiskScore.calculate(4, 6)).toThrow(
        'Impact must be an integer between 1 and 5'
      );
    });
  });

  describe('severity', () => {
    it('should classify as critical (20-25)', () => {
      expect(RiskScore.calculate(4, 5).severity).toBe('critical'); // 20
      expect(RiskScore.calculate(5, 5).severity).toBe('critical'); // 25
    });

    it('should classify as high (15-19)', () => {
      expect(RiskScore.calculate(3, 5).severity).toBe('high'); // 15
      expect(RiskScore.calculate(5, 4).severity).toBe('high'); // 20
    });

    it('should classify as medium (8-14)', () => {
      expect(RiskScore.calculate(2, 4).severity).toBe('medium'); // 8
      expect(RiskScore.calculate(3, 4).severity).toBe('medium'); // 12
    });

    it('should classify as low (4-7)', () => {
      expect(RiskScore.calculate(2, 2).severity).toBe('low'); // 4
      expect(RiskScore.calculate(2, 3).severity).toBe('low'); // 6
    });

    it('should classify as very_low (1-3)', () => {
      expect(RiskScore.calculate(1, 1).severity).toBe('very_low'); // 1
      expect(RiskScore.calculate(1, 3).severity).toBe('very_low'); // 3
    });
  });

  describe('requiresImmediateAttention()', () => {
    it('should return true for critical', () => {
      expect(RiskScore.calculate(5, 5).requiresImmediateAttention()).toBe(true);
    });

    it('should return true for high', () => {
      expect(RiskScore.calculate(3, 5).requiresImmediateAttention()).toBe(true);
    });

    it('should return false for medium', () => {
      expect(RiskScore.calculate(3, 3).requiresImmediateAttention()).toBe(false);
    });
  });

  describe('isAcceptable()', () => {
    it('should return true for low risks', () => {
      expect(RiskScore.calculate(2, 2).isAcceptable()).toBe(true);
    });

    it('should return true for very_low risks', () => {
      expect(RiskScore.calculate(1, 1).isAcceptable()).toBe(true);
    });

    it('should return false for medium risks', () => {
      expect(RiskScore.calculate(3, 3).isAcceptable()).toBe(false);
    });
  });

  describe('comparison', () => {
    it('should compare risk scores', () => {
      const high = RiskScore.calculate(4, 5);
      const low = RiskScore.calculate(2, 2);

      expect(high.isHigherThan(low)).toBe(true);
      expect(low.isLowerThan(high)).toBe(true);
    });
  });

  describe('percentage', () => {
    it('should calculate percentage correctly', () => {
      expect(RiskScore.calculate(5, 5).percentage).toBe(100); // 25/25 = 100%
      expect(RiskScore.calculate(3, 4).percentage).toBe(48); // 12/25 = 48%
      expect(RiskScore.calculate(1, 1).percentage).toBe(4); // 1/25 = 4%
    });
  });

  describe('labels', () => {
    it('should provide probability labels', () => {
      expect(RiskScore.calculate(1, 1).probabilityLabel).toBe('Very Rare');
      expect(RiskScore.calculate(3, 3).probabilityLabel).toBe('Possible');
      expect(RiskScore.calculate(5, 5).probabilityLabel).toBe('Almost Certain');
    });

    it('should provide impact labels', () => {
      expect(RiskScore.calculate(1, 1).impactLabel).toBe('Negligible');
      expect(RiskScore.calculate(3, 3).impactLabel).toBe('Moderate');
      expect(RiskScore.calculate(5, 5).impactLabel).toBe('Catastrophic');
    });
  });
});
