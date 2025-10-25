/**
 * Unit tests for Risk entity
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Risk, CreateRiskProps } from '@/domains/risks/core/entities/Risk';
import { RiskStatus } from '@/domains/risks/core/value-objects/RiskStatus';

describe('Risk Entity', () => {
  let validProps: CreateRiskProps;

  beforeEach(() => {
    validProps = {
      title: 'Data Breach Risk',
      description: 'Potential unauthorized access to customer database',
      category: 'cybersecurity',
      probability: 4,
      impact: 5,
      ownerId: 1,
      organizationId: 1
    };
  });

  describe('create()', () => {
    it('should create a new risk with valid data', () => {
      const risk = Risk.create(validProps);

      expect(risk).toBeDefined();
      expect(risk.title).toBe(validProps.title);
      expect(risk.description).toBe(validProps.description);
      expect(risk.probability).toBe(validProps.probability);
      expect(risk.impact).toBe(validProps.impact);
      expect(risk.status.value).toBe(RiskStatus.Active);
    });

    it('should calculate risk score correctly', () => {
      const risk = Risk.create(validProps);
      const score = risk.calculateScore();

      expect(score.score).toBe(20); // 4 * 5 = 20
      expect(score.severity).toBe('critical');
    });

    it('should emit RiskCreatedEvent', () => {
      const risk = Risk.create(validProps);
      const events = risk.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('riskId');
      expect(events[0]).toHaveProperty('title', validProps.title);
    });

    it('should reject title shorter than 3 characters', () => {
      const invalidProps = { ...validProps, title: 'AB' };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Risk title must be at least 3 characters long'
      );
    });

    it('should reject title longer than 200 characters', () => {
      const invalidProps = { ...validProps, title: 'A'.repeat(201) };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Risk title must not exceed 200 characters'
      );
    });

    it('should reject description shorter than 10 characters', () => {
      const invalidProps = { ...validProps, description: 'Too short' };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Risk description must be at least 10 characters long'
      );
    });

    it('should reject probability less than 1', () => {
      const invalidProps = { ...validProps, probability: 0 };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Probability must be an integer between 1 and 5'
      );
    });

    it('should reject probability greater than 5', () => {
      const invalidProps = { ...validProps, probability: 6 };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Probability must be an integer between 1 and 5'
      );
    });

    it('should reject impact less than 1', () => {
      const invalidProps = { ...validProps, impact: 0 };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Impact must be an integer between 1 and 5'
      );
    });

    it('should reject impact greater than 5', () => {
      const invalidProps = { ...validProps, impact: 6 };

      expect(() => Risk.create(invalidProps)).toThrow(
        'Impact must be an integer between 1 and 5'
      );
    });
  });

  describe('updateAssessment()', () => {
    it('should update probability and impact', () => {
      const risk = Risk.create(validProps);
      risk.updateAssessment(3, 4);

      expect(risk.probability).toBe(3);
      expect(risk.impact).toBe(4);
      expect(risk.calculateScore().score).toBe(12);
    });

    it('should emit RiskAssessmentUpdatedEvent when score changes', () => {
      const risk = Risk.create(validProps);
      risk.clearDomainEvents(); // Clear creation event

      risk.updateAssessment(3, 4);
      const events = risk.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('oldScore', 20);
      expect(events[0]).toHaveProperty('newScore', 12);
    });

    it('should not emit event when score stays the same', () => {
      const risk = Risk.create(validProps);
      risk.clearDomainEvents();

      risk.updateAssessment(4, 5); // Same as initial
      const events = risk.getDomainEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('updateStatus()', () => {
    it('should update status to mitigated', () => {
      const risk = Risk.create(validProps);
      risk.updateStatus(RiskStatus.Mitigated);

      expect(risk.status.value).toBe(RiskStatus.Mitigated);
    });

    it('should emit RiskStatusChangedEvent', () => {
      const risk = Risk.create(validProps);
      risk.clearDomainEvents();

      risk.updateStatus(RiskStatus.Mitigated);
      const events = risk.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('oldStatus', RiskStatus.Active);
      expect(events[0]).toHaveProperty('newStatus', RiskStatus.Mitigated);
    });

    it('should reject invalid status transition', () => {
      const risk = Risk.create(validProps);
      risk.updateStatus(RiskStatus.Closed);

      // Cannot go from closed to active
      expect(() => risk.updateStatus(RiskStatus.Active)).toThrow(
        'Invalid status transition'
      );
    });
  });

  describe('mitigate()', () => {
    it('should change status to mitigated', () => {
      const risk = Risk.create(validProps);
      risk.mitigate();

      expect(risk.status.value).toBe(RiskStatus.Mitigated);
    });
  });

  describe('accept()', () => {
    it('should change status to accepted', () => {
      const risk = Risk.create(validProps);
      risk.accept();

      expect(risk.status.value).toBe(RiskStatus.Accepted);
    });
  });

  describe('close()', () => {
    it('should change status to closed from mitigated', () => {
      const risk = Risk.create(validProps);
      risk.mitigate();
      risk.close();

      expect(risk.status.value).toBe(RiskStatus.Closed);
    });

    it('should change status to closed from accepted', () => {
      const risk = Risk.create(validProps);
      risk.accept();
      risk.close();

      expect(risk.status.value).toBe(RiskStatus.Closed);
    });
  });

  describe('update()', () => {
    it('should update risk details', () => {
      const risk = Risk.create(validProps);

      risk.update({
        title: 'Updated Title',
        category: 'operational'
      });

      expect(risk.title).toBe('Updated Title');
      expect(risk.category).toBe('operational');
    });

    it('should validate updated title', () => {
      const risk = Risk.create(validProps);

      expect(() => risk.update({ title: 'AB' })).toThrow(
        'Risk title must be at least 3 characters long'
      );
    });
  });

  describe('setResidualRisk()', () => {
    it('should set residual risk value', () => {
      const risk = Risk.create(validProps);
      risk.setResidualRisk(10);

      expect(risk.residualRisk).toBe(10);
    });

    it('should reject residual risk less than 1', () => {
      const risk = Risk.create(validProps);

      expect(() => risk.setResidualRisk(0)).toThrow(
        'Residual risk must be between 1 and 25'
      );
    });

    it('should reject residual risk greater than 25', () => {
      const risk = Risk.create(validProps);

      expect(() => risk.setResidualRisk(26)).toThrow(
        'Residual risk must be between 1 and 25'
      );
    });
  });

  describe('requiresImmediateAttention()', () => {
    it('should return true for critical risks', () => {
      const risk = Risk.create(validProps); // 4*5=20, critical
      expect(risk.requiresImmediateAttention()).toBe(true);
    });

    it('should return true for high risks', () => {
      const risk = Risk.create({ ...validProps, probability: 3, impact: 5 }); // 15, high
      expect(risk.requiresImmediateAttention()).toBe(true);
    });

    it('should return false for medium risks', () => {
      const risk = Risk.create({ ...validProps, probability: 3, impact: 3 }); // 9, medium
      expect(risk.requiresImmediateAttention()).toBe(false);
    });
  });

  describe('isOverdueForReview()', () => {
    it('should return false when no review date set', () => {
      const risk = Risk.create(validProps);
      expect(risk.isOverdueForReview()).toBe(false);
    });

    it('should return true when review date is in the past', () => {
      const pastDate = new Date('2020-01-01');
      const risk = Risk.create({ ...validProps, reviewDate: pastDate });
      expect(risk.isOverdueForReview()).toBe(true);
    });

    it('should return false when review date is in the future', () => {
      const futureDate = new Date('2030-01-01');
      const risk = Risk.create({ ...validProps, reviewDate: futureDate });
      expect(risk.isOverdueForReview()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('should serialize to JSON', () => {
      const risk = Risk.create(validProps);
      const json = risk.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title', validProps.title);
      expect(json).toHaveProperty('probability', validProps.probability);
      expect(json).toHaveProperty('impact', validProps.impact);
      expect(json).toHaveProperty('riskScore');
      expect(json.riskScore).toHaveProperty('score', 20);
      expect(json.riskScore).toHaveProperty('severity', 'critical');
    });
  });
});
