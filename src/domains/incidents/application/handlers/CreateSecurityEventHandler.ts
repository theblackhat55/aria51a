/**
 * CreateSecurityEventHandler
 * 
 * Handles CreateSecurityEventCommand to create new security events.
 * Follows CQRS pattern with command handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { CommandHandler } from '../../../../shared/application/CommandHandler';
import { CreateSecurityEventCommand } from '../commands/CreateSecurityEventCommand';
import { ISecurityEventRepository } from '../../core/repositories/ISecurityEventRepository';
import { SecurityEvent, SecurityEventProps } from '../../core/entities/SecurityEvent';
import { EventSeverityVO } from '../../core/value-objects/EventSeverity';
import { EventSourceVO } from '../../core/value-objects/EventSource';

export class CreateSecurityEventHandler implements CommandHandler<CreateSecurityEventCommand, SecurityEvent> {
  constructor(private readonly repository: ISecurityEventRepository) {}

  async handle(command: CreateSecurityEventCommand): Promise<SecurityEvent> {
    const { payload } = command;

    // Create value objects
    const severity = EventSeverityVO.create(payload.severity);
    const source = EventSourceVO.create(payload.source);

    // Build security event props
    const eventProps: SecurityEventProps = {
      eventType: payload.eventType,
      severity: payload.severity,
      source: payload.source,
      sourceSystem: payload.sourceSystem,
      sourceIp: payload.sourceIp,
      destinationIp: payload.destinationIp,
      sourcePort: payload.sourcePort,
      destinationPort: payload.destinationPort,
      protocol: payload.protocol,
      userId: payload.userId,
      assetId: payload.assetId,
      assetName: payload.assetName,
      description: payload.description,
      rawLog: payload.rawLog,
      detectedAt: payload.detectedAt || new Date(),
      signature: payload.signature,
      confidence: payload.confidence,
      falsePositive: payload.falsePositive || false,
      incidentId: payload.incidentId,
      correlatedEvents: payload.correlatedEvents || [],
      metadata: payload.metadata,
      organizationId: payload.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create security event entity
    const event = SecurityEvent.create(eventProps);

    // Check for duplicate events (by hash)
    if (event.hash) {
      const existing = await this.repository.findByHash(event.hash, payload.organizationId);
      if (existing) {
        // Return existing event instead of creating duplicate
        return existing;
      }
    }

    // Save to repository
    return await this.repository.save(event);
  }
}
