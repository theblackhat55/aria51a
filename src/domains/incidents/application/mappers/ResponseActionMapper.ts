/**
 * ResponseActionMapper
 * 
 * Maps between ResponseAction entity and database/DTO representations.
 * Handles serialization and deserialization logic.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { ResponseAction, ResponseActionProps } from '../../core/entities/ResponseAction';
import { ResponseActionDTO } from '../dtos/ResponseActionDTO';
import { ResponseTypeVO } from '../../core/value-objects/ResponseType';
import { ActionStatusVO } from '../../core/value-objects/ActionStatus';

export class ResponseActionMapper {
  /**
   * Map ResponseAction entity to DTO
   */
  static toDTO(action: ResponseAction): ResponseActionDTO {
    const json = action.toJSON();
    
    return {
      id: json.id,
      incidentId: json.incidentId,
      actionType: json.actionType,
      description: json.description,
      performedBy: json.performedBy,
      performedAt: json.performedAt,
      status: json.status,
      outcome: json.outcome,
      evidenceUrls: json.evidenceUrls,
      durationMinutes: json.durationMinutes,
      cost: json.cost,
      toolsUsed: json.toolsUsed,
      affectedSystems: json.affectedSystems,
      notes: json.notes,
      reviewedBy: json.reviewedBy,
      reviewedAt: json.reviewedAt,
      reviewComments: json.reviewComments,
      organizationId: json.organizationId,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt
    };
  }

  /**
   * Map database row to ResponseAction entity
   */
  static toDomain(raw: any): ResponseAction {
    const props: ResponseActionProps = {
      incidentId: raw.incident_id,
      actionType: raw.action_type,
      description: raw.description,
      performedBy: raw.performed_by,
      performedAt: new Date(raw.performed_at),
      status: raw.status,
      outcome: raw.outcome,
      evidenceUrls: raw.evidence_urls ? JSON.parse(raw.evidence_urls) : [],
      durationMinutes: raw.duration_minutes,
      cost: raw.cost,
      toolsUsed: raw.tools_used ? JSON.parse(raw.tools_used) : [],
      affectedSystems: raw.affected_systems ? JSON.parse(raw.affected_systems) : [],
      notes: raw.notes,
      reviewedBy: raw.reviewed_by,
      reviewedAt: raw.reviewed_at ? new Date(raw.reviewed_at) : undefined,
      reviewComments: raw.review_comments,
      organizationId: raw.organization_id,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

    return ResponseAction.reconstitute(props, raw.id);
  }

  /**
   * Map ResponseAction entity to database row
   */
  static toPersistence(action: ResponseAction): any {
    const json = action.toJSON();

    return {
      id: json.id,
      incident_id: json.incidentId,
      action_type: json.actionType,
      description: json.description,
      performed_by: json.performedBy,
      performed_at: json.performedAt,
      status: json.status,
      outcome: json.outcome,
      evidence_urls: JSON.stringify(json.evidenceUrls),
      duration_minutes: json.durationMinutes,
      cost: json.cost,
      tools_used: JSON.stringify(json.toolsUsed),
      affected_systems: JSON.stringify(json.affectedSystems),
      notes: json.notes,
      reviewed_by: json.reviewedBy,
      reviewed_at: json.reviewedAt,
      review_comments: json.reviewComments,
      organization_id: json.organizationId,
      created_at: json.createdAt,
      updated_at: json.updatedAt
    };
  }
}
