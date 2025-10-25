/**
 * IIncidentRepository Interface
 * 
 * Defines the contract for Incident persistence operations.
 * Following Repository pattern from DDD.
 */

import { Incident } from '../entities/Incident';
import { IncidentStatus } from '../value-objects/IncidentStatus';
import { IncidentSeverity } from '../value-objects/IncidentSeverity';
import { IncidentCategory } from '../value-objects/IncidentCategory';

export interface ListIncidentsOptions {
  organizationId: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  assignedTo?: number;
  search?: string;
  slaBreached?: boolean;
  dataCompromised?: boolean;
  requiresLegalReview?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'detected_at' | 'severity' | 'status' | 'updated_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface IncidentStatistics {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  slaBreached: number;
  dataCompromised: number;
  avgTimeToContain: number | null;
  avgTimeToResolve: number | null;
  avgCost: number | null;
}

export interface IIncidentRepository {
  /**
   * Save a new incident
   */
  save(incident: Incident): Promise<Incident>;

  /**
   * Update an existing incident
   */
  update(incident: Incident): Promise<Incident>;

  /**
   * Find incident by ID
   */
  findById(id: number, organizationId: number): Promise<Incident | null>;

  /**
   * List incidents with filters and pagination
   */
  list(options: ListIncidentsOptions): Promise<{ incidents: Incident[]; total: number }>;

  /**
   * Delete incident
   */
  delete(id: number, organizationId: number): Promise<void>;

  /**
   * Check if incident exists
   */
  exists(id: number, organizationId: number): Promise<boolean>;

  /**
   * Get incident statistics
   */
  getStatistics(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<IncidentStatistics>;

  /**
   * Find incidents by assigned user
   */
  findByAssignedTo(userId: number, organizationId: number): Promise<Incident[]>;

  /**
   * Find open incidents (not closed)
   */
  findOpenIncidents(organizationId: number): Promise<Incident[]>;

  /**
   * Find SLA breached incidents
   */
  findSLABreachedIncidents(organizationId: number): Promise<Incident[]>;

  /**
   * Find incidents requiring legal review
   */
  findIncidentsRequiringLegalReview(organizationId: number): Promise<Incident[]>;

  /**
   * Find incidents by related risk
   */
  findByRelatedRisk(riskId: number, organizationId: number): Promise<Incident[]>;

  /**
   * Find incidents by category
   */
  findByCategory(category: IncidentCategory, organizationId: number): Promise<Incident[]>;

  /**
   * Count incidents by status
   */
  countByStatus(organizationId: number): Promise<Record<string, number>>;

  /**
   * Count incidents by severity
   */
  countBySeverity(organizationId: number): Promise<Record<string, number>>;
}
