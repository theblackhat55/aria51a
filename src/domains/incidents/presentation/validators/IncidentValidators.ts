/**
 * Incident Validators
 * 
 * Zod schemas for validating incident-related API requests.
 * 
 * Part of the Incident Response Domain (Presentation Layer).
 */

import { z } from 'zod';

// Enums
const IncidentSeverityEnum = z.enum(['critical', 'high', 'medium', 'low', 'informational']);
const IncidentStatusEnum = z.enum(['detected', 'triaged', 'investigating', 'contained', 'eradicating', 'recovering', 'resolved', 'closed']);
const IncidentCategoryEnum = z.enum(['malware', 'phishing', 'data_breach', 'denial_of_service', 'unauthorized_access', 'insider_threat', 'system_failure', 'policy_violation', 'physical_security', 'other']);
const ImpactLevelEnum = z.enum(['catastrophic', 'major', 'moderate', 'minor', 'negligible']);

// Create Incident Schema
export const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: IncidentSeverityEnum,
  category: IncidentCategoryEnum,
  impact: ImpactLevelEnum,
  status: IncidentStatusEnum.optional(),
  assignedTo: z.number().int().positive().optional(),
  detectedAt: z.string().datetime().optional(),
  sourceIp: z.string().ip().optional(),
  targetAsset: z.string().max(255).optional(),
  affectedSystems: z.array(z.string()).optional(),
  estimatedCost: z.number().positive().optional(),
  dataCompromised: z.boolean().optional(),
  customersAffected: z.number().int().nonnegative().optional(),
  relatedRisks: z.array(z.number().int().positive()).optional(),
  relatedAssets: z.array(z.string()).optional()
});

// Update Incident Schema
export const UpdateIncidentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  severity: IncidentSeverityEnum.optional(),
  category: IncidentCategoryEnum.optional(),
  impact: ImpactLevelEnum.optional(),
  status: IncidentStatusEnum.optional(),
  assignedTo: z.number().int().positive().optional(),
  containedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  closedAt: z.string().datetime().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  lessonsLearned: z.string().optional(),
  actualCost: z.number().positive().optional(),
  dataCompromised: z.boolean().optional(),
  customersAffected: z.number().int().nonnegative().optional(),
  affectedSystems: z.array(z.string()).optional(),
  relatedRisks: z.array(z.number().int().positive()).optional(),
  relatedAssets: z.array(z.string()).optional()
});

// List Incidents Schema
export const ListIncidentsSchema = z.object({
  status: IncidentStatusEnum.optional(),
  severity: IncidentSeverityEnum.optional(),
  category: IncidentCategoryEnum.optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  slaBreached: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  dataCompromised: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(['detected_at', 'severity', 'status', 'updated_at']).default('detected_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Get Incident Statistics Schema
export const GetIncidentStatisticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});
