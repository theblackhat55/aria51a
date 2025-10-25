/**
 * IControlRepository - Repository interface for Control entity
 */

import { Control } from '../entities/Control';
import { ControlStatus } from '../value-objects/ControlStatus';

export interface ListControlsOptions {
  organizationId: number;
  frameworkId?: number;
  status?: ControlStatus;
  category?: string;
  assignedTo?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'control_id' | 'title' | 'status' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface IControlRepository {
  /**
   * Find control by ID
   */
  findById(id: number, organizationId: number): Promise<Control | null>;

  /**
   * List controls with filters
   */
  list(options: ListControlsOptions): Promise<{ controls: Control[]; total: number }>;

  /**
   * Save new control
   */
  save(control: Control): Promise<Control>;

  /**
   * Update existing control
   */
  update(control: Control): Promise<Control>;

  /**
   * Delete control
   */
  delete(id: number, organizationId: number): Promise<void>;

  /**
   * Find controls by framework
   */
  findByFramework(frameworkId: number, organizationId: number): Promise<Control[]>;

  /**
   * Find controls by status
   */
  findByStatus(frameworkId: number, status: ControlStatus, organizationId: number): Promise<Control[]>;

  /**
   * Get control statistics for a framework
   */
  getFrameworkStatistics(frameworkId: number, organizationId: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    averageCompletion: number;
    overdueAssessments: number;
  }>;
}
