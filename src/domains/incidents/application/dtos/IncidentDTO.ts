/**
 * IncidentDTO
 * 
 * Data Transfer Object for Incident entity.
 * Used for API responses and data serialization.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

export interface IncidentDTO {
  id: number;
  title: string;
  description: string;
  severity: string;
  severityColor: string;
  severityPriority: number;
  status: string;
  statusPhase: string;
  statusProgress: number;
  category: string;
  impact: string;
  impactColor: string;
  assignedTo: number | null;
  detectedAt: string;
  containedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  sourceIp: string | null;
  targetAsset: string | null;
  affectedSystems: string[];
  estimatedCost: number | null;
  actualCost: number | null;
  dataCompromised: boolean;
  customersAffected: number | null;
  rootCause: string | null;
  resolution: string | null;
  lessonsLearned: string | null;
  relatedRisks: number[];
  relatedAssets: string[];
  requiresExecutiveNotification: boolean;
  requiresLegalReview: boolean;
  // SLA tracking
  slaHours: number;
  slaBreached: boolean;
  slaRemainingHours: number | null;
  // Time metrics
  timeToContain: number | null;
  timeToResolve: number | null;
  // Multi-tenancy
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentListDTO {
  id: number;
  title: string;
  severity: string;
  severityColor: string;
  status: string;
  category: string;
  impact: string;
  assignedTo: number | null;
  detectedAt: string;
  slaBreached: boolean;
  dataCompromised: boolean;
  timeToContain: number | null;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}
