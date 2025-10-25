/**
 * SecurityEventMapper
 * 
 * Maps between SecurityEvent entity and database/DTO representations.
 * Handles serialization and deserialization logic.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { SecurityEvent, SecurityEventProps } from '../../core/entities/SecurityEvent';
import { SecurityEventDTO } from '../dtos/SecurityEventDTO';
import { EventSeverityVO } from '../../core/value-objects/EventSeverity';
import { EventSourceVO } from '../../core/value-objects/EventSource';

export class SecurityEventMapper {
  /**
   * Map SecurityEvent entity to DTO
   */
  static toDTO(event: SecurityEvent): SecurityEventDTO {
    const json = event.toJSON();
    
    return {
      id: json.id,
      eventType: json.eventType,
      severity: json.severity,
      source: json.source,
      sourceSystem: json.sourceSystem,
      sourceIp: json.sourceIp,
      destinationIp: json.destinationIp,
      sourcePort: json.sourcePort,
      destinationPort: json.destinationPort,
      protocol: json.protocol,
      userId: json.userId,
      assetId: json.assetId,
      assetName: json.assetName,
      description: json.description,
      rawLog: json.rawLog,
      detectedAt: json.detectedAt,
      signature: json.signature,
      confidence: json.confidence,
      falsePositive: json.falsePositive,
      incidentId: json.incidentId,
      correlatedEvents: json.correlatedEvents,
      metadata: json.metadata,
      hash: json.hash,
      organizationId: json.organizationId,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt
    };
  }

  /**
   * Map database row to SecurityEvent entity
   */
  static toDomain(raw: any): SecurityEvent {
    const props: SecurityEventProps = {
      eventType: raw.event_type,
      severity: raw.severity,
      source: raw.source,
      sourceSystem: raw.source_system,
      sourceIp: raw.source_ip,
      destinationIp: raw.destination_ip,
      sourcePort: raw.source_port,
      destinationPort: raw.destination_port,
      protocol: raw.protocol,
      userId: raw.user_id,
      assetId: raw.asset_id,
      assetName: raw.asset_name,
      description: raw.description,
      rawLog: raw.raw_log,
      detectedAt: new Date(raw.detected_at),
      signature: raw.signature,
      confidence: raw.confidence,
      falsePositive: Boolean(raw.false_positive),
      incidentId: raw.incident_id,
      correlatedEvents: raw.correlated_events ? JSON.parse(raw.correlated_events) : [],
      metadata: raw.metadata ? JSON.parse(raw.metadata) : undefined,
      hash: raw.hash,
      organizationId: raw.organization_id,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

    return SecurityEvent.reconstitute(props, raw.id);
  }

  /**
   * Map SecurityEvent entity to database row
   */
  static toPersistence(event: SecurityEvent): any {
    const json = event.toJSON();

    return {
      id: json.id,
      event_type: json.eventType,
      severity: json.severity,
      source: json.source,
      source_system: json.sourceSystem,
      source_ip: json.sourceIp,
      destination_ip: json.destinationIp,
      source_port: json.sourcePort,
      destination_port: json.destinationPort,
      protocol: json.protocol,
      user_id: json.userId,
      asset_id: json.assetId,
      asset_name: json.assetName,
      description: json.description,
      raw_log: json.rawLog,
      detected_at: json.detectedAt,
      signature: json.signature,
      confidence: json.confidence,
      false_positive: json.falsePositive ? 1 : 0,
      incident_id: json.incidentId,
      correlated_events: JSON.stringify(json.correlatedEvents),
      metadata: json.metadata ? JSON.stringify(json.metadata) : null,
      hash: json.hash,
      organization_id: json.organizationId,
      created_at: json.createdAt,
      updated_at: json.updatedAt
    };
  }
}
