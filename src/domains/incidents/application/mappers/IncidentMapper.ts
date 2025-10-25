/**
 * IncidentMapper
 * 
 * Maps between Incident domain entity and database/DTO representations.
 * Handles serialization and deserialization logic.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { Incident, IncidentProps } from '../../core/entities/Incident';
import { IncidentDTO, IncidentListDTO } from '../dtos/IncidentDTO';
import { IncidentSeverityVO } from '../../core/value-objects/IncidentSeverity';
import { IncidentStatusVO } from '../../core/value-objects/IncidentStatus';
import { IncidentCategoryVO } from '../../core/value-objects/IncidentCategory';
import { ImpactLevelVO } from '../../core/value-objects/ImpactLevel';

export class IncidentMapper {
  /**
   * Map Incident entity to full DTO
   */
  static toDTO(incident: Incident): IncidentDTO {
    const json = incident.toJSON();
    
    return {
      id: json.id,
      title: json.title,
      description: json.description,
      severity: json.severity,
      severityColor: json.severityColor,
      severityPriority: json.severityPriority,
      status: json.status,
      statusPhase: json.statusPhase,
      statusProgress: json.statusProgress,
      category: json.category,
      impact: json.impact,
      impactColor: json.impactColor,
      assignedTo: json.assignedTo,
      detectedAt: json.detectedAt,
      containedAt: json.containedAt,
      resolvedAt: json.resolvedAt,
      closedAt: json.closedAt,
      sourceIp: json.sourceIp,
      targetAsset: json.targetAsset,
      affectedSystems: json.affectedSystems,
      estimatedCost: json.estimatedCost,
      actualCost: json.actualCost,
      dataCompromised: json.dataCompromised,
      customersAffected: json.customersAffected,
      rootCause: json.rootCause,
      resolution: json.resolution,
      lessonsLearned: json.lessonsLearned,
      relatedRisks: json.relatedRisks,
      relatedAssets: json.relatedAssets,
      requiresExecutiveNotification: json.requiresExecutiveNotification,
      requiresLegalReview: json.requiresLegalReview,
      slaHours: json.slaHours,
      slaBreached: json.slaBreached,
      slaRemainingHours: json.slaRemainingHours,
      timeToContain: json.timeToContain,
      timeToResolve: json.timeToResolve,
      organizationId: json.organizationId,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt
    };
  }

  /**
   * Map Incident entity to list DTO (lighter version)
   */
  static toListDTO(incident: Incident): IncidentListDTO {
    const json = incident.toJSON();
    
    return {
      id: json.id,
      title: json.title,
      severity: json.severity,
      severityColor: json.severityColor,
      status: json.status,
      category: json.category,
      impact: json.impact,
      assignedTo: json.assignedTo,
      detectedAt: json.detectedAt,
      slaBreached: json.slaBreached,
      dataCompromised: json.dataCompromised,
      timeToContain: json.timeToContain,
      organizationId: json.organizationId,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt
    };
  }

  /**
   * Map database row to Incident entity
   */
  static toDomain(raw: any): Incident {
    const props: IncidentProps = {
      title: raw.title,
      description: raw.description,
      severity: IncidentSeverityVO.create(raw.severity),
      status: IncidentStatusVO.create(raw.status),
      category: IncidentCategoryVO.create(raw.category),
      impact: ImpactLevelVO.create(raw.impact),
      assignedTo: raw.assigned_to,
      detectedAt: new Date(raw.detected_at),
      containedAt: raw.contained_at ? new Date(raw.contained_at) : undefined,
      resolvedAt: raw.resolved_at ? new Date(raw.resolved_at) : undefined,
      closedAt: raw.closed_at ? new Date(raw.closed_at) : undefined,
      sourceIp: raw.source_ip,
      targetAsset: raw.target_asset,
      affectedSystems: raw.affected_systems ? JSON.parse(raw.affected_systems) : [],
      estimatedCost: raw.estimated_cost,
      actualCost: raw.actual_cost,
      dataCompromised: Boolean(raw.data_compromised),
      customersAffected: raw.customers_affected,
      rootCause: raw.root_cause,
      resolution: raw.resolution,
      lessonsLearned: raw.lessons_learned,
      relatedRisks: raw.related_risks ? JSON.parse(raw.related_risks) : [],
      relatedAssets: raw.related_assets ? JSON.parse(raw.related_assets) : [],
      organizationId: raw.organization_id,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

    return Incident.reconstitute(props, raw.id);
  }

  /**
   * Map Incident entity to database row
   */
  static toPersistence(incident: Incident): any {
    const json = incident.toJSON();

    return {
      id: json.id,
      title: json.title,
      description: json.description,
      severity: json.severity,
      status: json.status,
      category: json.category,
      impact: json.impact,
      assigned_to: json.assignedTo,
      detected_at: json.detectedAt,
      contained_at: json.containedAt,
      resolved_at: json.resolvedAt,
      closed_at: json.closedAt,
      source_ip: json.sourceIp,
      target_asset: json.targetAsset,
      affected_systems: JSON.stringify(json.affectedSystems),
      estimated_cost: json.estimatedCost,
      actual_cost: json.actualCost,
      data_compromised: json.dataCompromised ? 1 : 0,
      customers_affected: json.customersAffected,
      root_cause: json.rootCause,
      resolution: json.resolution,
      lessons_learned: json.lessonsLearned,
      related_risks: JSON.stringify(json.relatedRisks),
      related_assets: JSON.stringify(json.relatedAssets),
      organization_id: json.organizationId,
      created_at: json.createdAt,
      updated_at: json.updatedAt
    };
  }
}
