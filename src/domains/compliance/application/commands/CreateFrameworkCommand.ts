/**
 * CreateFrameworkCommand - Command for creating a new compliance framework
 */

import { Command } from '@/shared/application/Command';
import { FrameworkType } from '../../core/value-objects/FrameworkType';

export interface CreateFrameworkCommandPayload {
  name: string;
  type: FrameworkType;
  version: string;
  description: string;
  scope?: string;
  targetCompletionDate?: Date | string;
  organizationId: number;
  ownerId?: number;
  createdBy: number;
}

export class CreateFrameworkCommand extends Command<CreateFrameworkCommandPayload> {
  constructor(payload: CreateFrameworkCommandPayload) {
    super(payload);
  }
}
