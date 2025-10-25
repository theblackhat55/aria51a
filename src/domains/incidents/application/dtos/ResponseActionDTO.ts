/**
 * ResponseActionDTO
 * 
 * Data Transfer Object for ResponseAction entity.
 * Used for API responses and data serialization.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

export interface ResponseActionDTO {
  id: number;
  incidentId: number;
  actionType: string;
  actionTypeDescription: string;
  description: string;
  performedBy: number;
  performedAt: string;
  status: string;
  statusColor: string;
  outcome: string | null;
  evidenceUrls: string[];
  durationMinutes: number | null;
  cost: number | null;
  toolsUsed: string[];
  affectedSystems: string[];
  notes: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewComments: string | null;
  requiresReview: boolean;
  isPending: boolean;
  isCompleted: boolean;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseActionListDTO {
  id: number;
  incidentId: number;
  actionType: string;
  description: string;
  performedBy: number;
  performedAt: string;
  status: string;
  durationMinutes: number | null;
  organizationId: number;
}
