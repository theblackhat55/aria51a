/**
 * UpdateRiskCommand - Command for updating an existing risk
 */

import { Command } from '@/shared/application/Command';

export interface UpdateRiskCommandPayload {
  id: number;
  organizationId: number;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  probability?: number;
  impact?: number;
  ownerId?: number;
  source?: string;
  affectedAssets?: string;
  reviewDate?: Date | string;
  dueDate?: Date | string;
  updatedBy: number;
}

export class UpdateRiskCommand extends Command<UpdateRiskCommandPayload> {
  constructor(payload: UpdateRiskCommandPayload) {
    super(payload);
  }
}
