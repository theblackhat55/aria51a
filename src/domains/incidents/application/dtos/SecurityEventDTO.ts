/**
 * SecurityEventDTO
 * 
 * Data Transfer Object for SecurityEvent entity.
 * Used for API responses and data serialization.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

export interface SecurityEventDTO {
  id: number;
  eventType: string;
  severity: string;
  severityColor: string;
  source: string;
  sourceDescription: string;
  sourceSystem: string | null;
  sourceIp: string | null;
  destinationIp: string | null;
  sourcePort: number | null;
  destinationPort: number | null;
  protocol: string | null;
  userId: number | null;
  assetId: string | null;
  assetName: string | null;
  description: string;
  rawLog: string | null;
  detectedAt: string;
  signature: string | null;
  confidence: number | null;
  confidenceLevel: string;
  falsePositive: boolean;
  incidentId: number | null;
  correlatedEvents: number[];
  metadata: Record<string, any> | null;
  hash: string | null;
  isCorrelated: boolean;
  requiresAction: boolean;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityEventListDTO {
  id: number;
  eventType: string;
  severity: string;
  source: string;
  sourceIp: string | null;
  detectedAt: string;
  confidence: number | null;
  falsePositive: boolean;
  incidentId: number | null;
  organizationId: number;
}
