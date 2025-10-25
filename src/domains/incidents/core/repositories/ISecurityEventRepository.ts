/**
 * ISecurityEventRepository Interface
 * 
 * Defines the contract for SecurityEvent persistence operations.
 * Following Repository pattern from DDD.
 */

import { SecurityEvent } from '../entities/SecurityEvent';
import { EventSeverity } from '../value-objects/EventSeverity';
import { EventSource } from '../value-objects/EventSource';

export interface ListSecurityEventsOptions {
  organizationId: number;
  severity?: EventSeverity;
  source?: EventSource;
  eventType?: string;
  incidentId?: number;
  userId?: number;
  assetId?: string;
  sourceIp?: string;
  destinationIp?: string;
  falsePositive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minConfidence?: number;
  requiresInvestigation?: boolean;
  unlinked?: boolean; // Events not linked to any incident
  limit?: number;
  offset?: number;
  sortBy?: 'detected_at' | 'severity' | 'confidence' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SecurityEventStatistics {
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  byEventType: Record<string, number>;
  falsePositives: number;
  linkedToIncidents: number;
  requiresInvestigation: number;
  avgConfidence: number | null;
  avgThreatLevel: number | null;
  topSourceIps: Array<{ ip: string; count: number }>;
  topEventTypes: Array<{ type: string; count: number }>;
}

export interface CorrelationRule {
  timeWindowMinutes: number;
  minEvents: number;
  maxEvents?: number;
  criteria: {
    sourceIp?: string;
    destinationIp?: string;
    userId?: number;
    assetId?: string;
    eventType?: string;
    severity?: EventSeverity;
  };
}

export interface ISecurityEventRepository {
  /**
   * Save a new security event
   */
  save(event: SecurityEvent): Promise<SecurityEvent>;

  /**
   * Update an existing security event
   */
  update(event: SecurityEvent): Promise<SecurityEvent>;

  /**
   * Find security event by ID
   */
  findById(id: number, organizationId: number): Promise<SecurityEvent | null>;

  /**
   * List security events with filters and pagination
   */
  list(options: ListSecurityEventsOptions): Promise<{ events: SecurityEvent[]; total: number }>;

  /**
   * Delete security event
   */
  delete(id: number, organizationId: number): Promise<void>;

  /**
   * Check if security event exists
   */
  exists(id: number, organizationId: number): Promise<boolean>;

  /**
   * Get security event statistics
   */
  getStatistics(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<SecurityEventStatistics>;

  /**
   * Find events by incident
   */
  findByIncident(incidentId: number, organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Find unlinked events (not associated with any incident)
   */
  findUnlinkedEvents(organizationId: number, limit?: number): Promise<SecurityEvent[]>;

  /**
   * Find events requiring investigation
   */
  findEventsRequiringInvestigation(organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Find false positives
   */
  findFalsePositives(organizationId: number, limit?: number): Promise<SecurityEvent[]>;

  /**
   * Find events by source IP
   */
  findBySourceIp(sourceIp: string, organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Find events by asset
   */
  findByAsset(assetId: string, organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Find events by user
   */
  findByUser(userId: number, organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Find correlated events based on criteria
   */
  findCorrelatedEvents(rule: CorrelationRule, organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Find duplicate events by hash
   */
  findByHash(hash: string, organizationId: number): Promise<SecurityEvent[]>;

  /**
   * Count events by severity
   */
  countBySeverity(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>>;

  /**
   * Count events by source
   */
  countBySource(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>>;

  /**
   * Count events by type
   */
  countByEventType(organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>>;

  /**
   * Get top source IPs
   */
  getTopSourceIps(organizationId: number, limit: number, dateFrom?: Date, dateTo?: Date): Promise<Array<{ ip: string; count: number }>>;

  /**
   * Get event timeline (grouped by time intervals)
   */
  getEventTimeline(organizationId: number, intervalMinutes: number, dateFrom?: Date, dateTo?: Date): Promise<Array<{ timestamp: Date; count: number }>>;

  /**
   * Bulk link events to incident
   */
  bulkLinkToIncident(eventIds: number[], incidentId: number, organizationId: number): Promise<void>;

  /**
   * Clean up stale events (older than retention period)
   */
  cleanupStaleEvents(organizationId: number, retentionDays: number): Promise<number>;
}
