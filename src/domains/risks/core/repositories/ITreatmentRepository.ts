/**
 * ITreatmentRepository - Repository interface for RiskTreatment entity
 */

import { RiskTreatment, TreatmentStatus, TreatmentType } from '../entities/RiskTreatment';

export interface ITreatmentRepository {
  /**
   * Find a treatment by ID
   */
  findById(id: number): Promise<RiskTreatment | null>;

  /**
   * Find all treatments for a risk
   */
  findByRisk(riskId: number): Promise<RiskTreatment[]>;

  /**
   * Find treatments by status
   */
  findByStatus(status: TreatmentStatus): Promise<RiskTreatment[]>;

  /**
   * Find treatments by owner
   */
  findByOwner(ownerId: number): Promise<RiskTreatment[]>;

  /**
   * Find overdue treatments
   */
  findOverdue(): Promise<RiskTreatment[]>;

  /**
   * Save a new treatment
   */
  save(treatment: RiskTreatment): Promise<RiskTreatment>;

  /**
   * Update a treatment
   */
  update(treatment: RiskTreatment): Promise<RiskTreatment>;

  /**
   * Delete a treatment
   */
  delete(id: number): Promise<void>;

  /**
   * Count treatments for a risk
   */
  countByRisk(riskId: number): Promise<number>;

  /**
   * Get treatment statistics
   */
  getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }>;
}
