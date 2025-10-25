/**
 * SecurityEvent Validators
 * 
 * Zod schemas for validating security event-related API requests.
 * 
 * Part of the Incident Response Domain (Presentation Layer).
 */

import { z } from 'zod';

// Enums
const EventSeverityEnum = z.enum(['critical', 'high', 'medium', 'low', 'informational']);
const EventSourceEnum = z.enum(['siem', 'ids', 'ips', 'firewall', 'antivirus', 'edr', 'dlp', 'waf', 'cloud_security', 'user_report', 'manual', 'other']);

// Create SecurityEvent Schema
export const CreateSecurityEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  severity: EventSeverityEnum,
  source: EventSourceEnum,
  sourceSystem: z.string().max(100).optional(),
  sourceIp: z.string().ip().optional(),
  destinationIp: z.string().ip().optional(),
  sourcePort: z.number().int().min(1).max(65535).optional(),
  destinationPort: z.number().int().min(1).max(65535).optional(),
  protocol: z.string().max(20).optional(),
  userId: z.number().int().positive().optional(),
  assetId: z.string().max(100).optional(),
  assetName: z.string().max(255).optional(),
  description: z.string().min(1),
  rawLog: z.string().optional(),
  detectedAt: z.string().datetime().optional(),
  signature: z.string().max(100).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  falsePositive: z.boolean().optional(),
  incidentId: z.number().int().positive().optional(),
  correlatedEvents: z.array(z.number().int().positive()).optional(),
  metadata: z.record(z.any()).optional()
});

// Update SecurityEvent Schema
export const UpdateSecurityEventSchema = z.object({
  severity: EventSeverityEnum.optional(),
  description: z.string().min(1).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  falsePositive: z.boolean().optional(),
  incidentId: z.number().int().positive().optional(),
  correlatedEvents: z.array(z.number().int().positive()).optional(),
  metadata: z.record(z.any()).optional()
});

// List SecurityEvents Schema
export const ListSecurityEventsSchema = z.object({
  eventType: z.string().optional(),
  severity: EventSeverityEnum.optional(),
  source: EventSourceEnum.optional(),
  sourceSystem: z.string().optional(),
  sourceIp: z.string().ip().optional(),
  destinationIp: z.string().ip().optional(),
  userId: z.coerce.number().int().positive().optional(),
  assetId: z.string().optional(),
  incidentId: z.coerce.number().int().positive().optional(),
  falsePositive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(['detected_at', 'severity', 'confidence', 'event_type']).default('detected_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
