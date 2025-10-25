/**
 * CreateRiskCommand - Command for creating a new risk
 */

import { Command } from '@/shared/application/Command';

export interface CreateRiskCommandPayload {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  probability: number;
  impact: number;
  ownerId: number;
  organizationId: number;
  source?: string;
  affectedAssets?: string;
  reviewDate?: Date | string;
  dueDate?: Date | string;
  createdBy: number;
}

export class CreateRiskCommand extends Command<CreateRiskCommandPayload> {
  constructor(payload: CreateRiskCommandPayload) {
    super(payload);
  }
}
