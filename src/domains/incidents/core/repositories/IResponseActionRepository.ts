/**
 * IResponseActionRepository Interface
 * 
 * Defines the contract for ResponseAction persistence operations.
 * Following Repository pattern from DDD.
 */

import { ResponseAction } from '../entities/ResponseAction';
import { ResponseType } from '../value-objects/ResponseType';
import { ActionStatus } from '../value-objects/ActionStatus';

export interface ListResponseActionsOptions {
  organizationId: number;
  incidentId?: number;
  actionType?: ResponseType;
  status?: ActionStatus;
  performedBy?: number;
  dateFrom?: Date;
  dateTo?: Date;
  requiresReview?: boolean;
  isOverdue?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'performed_at' | 'status' | 'action_type' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ResponseActionStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  completed: number;
  pending: number;
  overdue: number;
  requiresReview: number;
  avgDurationMinutes: number | null;
  avgEffectivenessScore: number | null;
  totalCost: number | null;
}

export interface IResponseActionRepository {
  /**
   * Save a new response action
   */
  save(action: ResponseAction): Promise<ResponseAction>;

  /**
   * Update an existing response action
   */
  update(action: ResponseAction): Promise<ResponseAction>;

  /**
   * Find response action by ID
   */
  findById(id: number, organizationId: number): Promise<ResponseAction | null>;

  /**
   * List response actions with filters and pagination
   */
  list(options: ListResponseActionsOptions): Promise<{ actions: ResponseAction[]; total: number }>;

  /**
   * Delete response action
   */
  delete(id: number, organizationId: number): Promise<void>;

  /**
   * Check if response action exists
   */
  exists(id: number, organizationId: number): Promise<boolean>;

  /**
   * Get response action statistics
   */
  getStatistics(organizationId: number, incidentId?: number): Promise<ResponseActionStatistics>;

  /**
   * Find actions by incident
   */
  findByIncident(incidentId: number, organizationId: number): Promise<ResponseAction[]>;

  /**
   * Find actions by performer
   */
  findByPerformer(userId: number, organizationId: number): Promise<ResponseAction[]>;

  /**
   * Find pending actions
   */
  findPendingActions(organizationId: number): Promise<ResponseAction[]>;

  /**
   * Find overdue actions
   */
  findOverdueActions(organizationId: number): Promise<ResponseAction[]>;

  /**
   * Find actions requiring review
   */
  findActionsRequiringReview(organizationId: number): Promise<ResponseAction[]>;

  /**
   * Find actions by type
   */
  findByType(actionType: ResponseType, organizationId: number): Promise<ResponseAction[]>;

  /**
   * Count actions by status
   */
  countByStatus(organizationId: number, incidentId?: number): Promise<Record<string, number>>;

  /**
   * Count actions by type
   */
  countByType(organizationId: number, incidentId?: number): Promise<Record<string, number>>;

  /**
   * Get action timeline for incident (ordered by performed_at)
   */
  getIncidentTimeline(incidentId: number, organizationId: number): Promise<ResponseAction[]>;
}
