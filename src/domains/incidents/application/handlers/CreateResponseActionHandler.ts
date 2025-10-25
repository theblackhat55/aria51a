/**
 * CreateResponseActionHandler
 * 
 * Handles CreateResponseActionCommand to create new response actions.
 * Follows CQRS pattern with command handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { CommandHandler } from '../../../../shared/application/CommandHandler';
import { CreateResponseActionCommand } from '../commands/CreateResponseActionCommand';
import { IResponseActionRepository } from '../../core/repositories/IResponseActionRepository';
import { ResponseAction, ResponseActionProps } from '../../core/entities/ResponseAction';
import { ResponseTypeVO } from '../../core/value-objects/ResponseType';
import { ActionStatusVO } from '../../core/value-objects/ActionStatus';

export class CreateResponseActionHandler implements CommandHandler<CreateResponseActionCommand, ResponseAction> {
  constructor(private readonly repository: IResponseActionRepository) {}

  async handle(command: CreateResponseActionCommand): Promise<ResponseAction> {
    const { payload } = command;

    // Create value objects
    const actionType = ResponseTypeVO.create(payload.actionType);
    const status = payload.status 
      ? ActionStatusVO.create(payload.status)
      : ActionStatusVO.create('pending' as any);

    // Build response action props
    const actionProps: ResponseActionProps = {
      incidentId: payload.incidentId,
      actionType: payload.actionType,
      description: payload.description,
      performedBy: payload.performedBy,
      performedAt: payload.performedAt || new Date(),
      status: payload.status || ('pending' as any),
      outcome: payload.outcome,
      evidenceUrls: payload.evidenceUrls || [],
      durationMinutes: payload.durationMinutes,
      cost: payload.cost,
      toolsUsed: payload.toolsUsed || [],
      affectedSystems: payload.affectedSystems || [],
      notes: payload.notes,
      organizationId: payload.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create response action entity
    const action = ResponseAction.create(actionProps);

    // Save to repository
    return await this.repository.save(action);
  }
}
