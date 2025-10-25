/**
 * SecurityEvent Entity
 * 
 * Represents a security event that may be part of an incident or standalone.
 * Security events are raw observations from security tools, logs, and monitoring systems.
 * Multiple related security events can be correlated into an incident.
 * 
 * Part of the Incident Response Domain.
 */

import { Entity } from '../../../../shared/core/Entity';
import { EventSeverity, EventSeverityVO } from '../value-objects/EventSeverity';
import { EventSource, EventSourceVO } from '../value-objects/EventSource';

export interface SecurityEventProps {
  eventType: string; // e.g., 'failed_login', 'malware_detected', 'port_scan'
  severity: EventSeverity;
  source: EventSource;
  sourceSystem?: string; // Specific system/tool that detected the event
  sourceIp?: string;
  destinationIp?: string;
  sourcePort?: number;
  destinationPort?: number;
  protocol?: string;
  userId?: number; // User involved in the event (if applicable)
  assetId?: string; // Asset/system identifier
  assetName?: string;
  description: string;
  rawLog?: string; // Raw log entry
  detectedAt: Date;
  signature?: string; // Detection signature/rule ID
  confidence?: number; // Confidence score (0-100)
  falsePositive?: boolean;
  incidentId?: number; // Linked incident (if correlated)
  correlatedEvents?: number[]; // Related event IDs
  metadata?: Record<string, any>; // Additional key-value data
  hash?: string; // Hash of event data for deduplication
  organizationId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SecurityEvent extends Entity<number> {
  private _eventType: string;
  private _severity: EventSeverityVO;
  private _source: EventSourceVO;
  private _sourceSystem?: string;
  private _sourceIp?: string;
  private _destinationIp?: string;
  private _sourcePort?: number;
  private _destinationPort?: number;
  private _protocol?: string;
  private _userId?: number;
  private _assetId?: string;
  private _assetName?: string;
  private _description: string;
  private _rawLog?: string;
  private _detectedAt: Date;
  private _signature?: string;
  private _confidence?: number;
  private _falsePositive: boolean;
  private _incidentId?: number;
  private _correlatedEvents: number[];
  private _metadata: Record<string, any>;
  private _hash?: string;
  private _organizationId: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: SecurityEventProps, id?: number) {
    super(id);
    this._eventType = props.eventType;
    this._severity = EventSeverityVO.create(props.severity);
    this._source = EventSourceVO.create(props.source);
    this._sourceSystem = props.sourceSystem;
    this._sourceIp = props.sourceIp;
    this._destinationIp = props.destinationIp;
    this._sourcePort = props.sourcePort;
    this._destinationPort = props.destinationPort;
    this._protocol = props.protocol;
    this._userId = props.userId;
    this._assetId = props.assetId;
    this._assetName = props.assetName;
    this._description = props.description;
    this._rawLog = props.rawLog;
    this._detectedAt = props.detectedAt;
    this._signature = props.signature;
    this._confidence = props.confidence;
    this._falsePositive = props.falsePositive ?? false;
    this._incidentId = props.incidentId;
    this._correlatedEvents = props.correlatedEvents || [];
    this._metadata = props.metadata || {};
    this._hash = props.hash;
    this._organizationId = props.organizationId;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  public static create(props: SecurityEventProps, id?: number): SecurityEvent {
    // Validation
    if (!props.eventType || props.eventType.trim().length === 0) {
      throw new Error('eventType is required');
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('description is required');
    }
    if (props.description.length > 2000) {
      throw new Error('description must be 2000 characters or less');
    }
    if (!props.organizationId || props.organizationId <= 0) {
      throw new Error('organizationId is required and must be positive');
    }
    if (props.confidence !== undefined && (props.confidence < 0 || props.confidence > 100)) {
      throw new Error('confidence must be between 0 and 100');
    }
    if (props.sourcePort !== undefined && (props.sourcePort < 0 || props.sourcePort > 65535)) {
      throw new Error('sourcePort must be between 0 and 65535');
    }
    if (props.destinationPort !== undefined && (props.destinationPort < 0 || props.destinationPort > 65535)) {
      throw new Error('destinationPort must be between 0 and 65535');
    }

    return new SecurityEvent(props, id);
  }

  // Getters
  public get eventType(): string {
    return this._eventType;
  }

  public get severity(): EventSeverityVO {
    return this._severity;
  }

  public get source(): EventSourceVO {
    return this._source;
  }

  public get sourceSystem(): string | undefined {
    return this._sourceSystem;
  }

  public get sourceIp(): string | undefined {
    return this._sourceIp;
  }

  public get destinationIp(): string | undefined {
    return this._destinationIp;
  }

  public get sourcePort(): number | undefined {
    return this._sourcePort;
  }

  public get destinationPort(): number | undefined {
    return this._destinationPort;
  }

  public get protocol(): string | undefined {
    return this._protocol;
  }

  public get userId(): number | undefined {
    return this._userId;
  }

  public get assetId(): string | undefined {
    return this._assetId;
  }

  public get assetName(): string | undefined {
    return this._assetName;
  }

  public get description(): string {
    return this._description;
  }

  public get rawLog(): string | undefined {
    return this._rawLog;
  }

  public get detectedAt(): Date {
    return this._detectedAt;
  }

  public get signature(): string | undefined {
    return this._signature;
  }

  public get confidence(): number | undefined {
    return this._confidence;
  }

  public get falsePositive(): boolean {
    return this._falsePositive;
  }

  public get incidentId(): number | undefined {
    return this._incidentId;
  }

  public get correlatedEvents(): number[] {
    return [...this._correlatedEvents];
  }

  public get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  public get hash(): string | undefined {
    return this._hash;
  }

  public get organizationId(): number {
    return this._organizationId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods

  /**
   * Mark as false positive
   */
  public markAsFalsePositive(reason?: string): void {
    this._falsePositive = true;
    if (reason) {
      this._metadata.falsePositiveReason = reason;
    }
    this.touch();
  }

  /**
   * Clear false positive flag
   */
  public clearFalsePositive(): void {
    this._falsePositive = false;
    delete this._metadata.falsePositiveReason;
    this.touch();
  }

  /**
   * Link to incident
   */
  public linkToIncident(incidentId: number): void {
    if (incidentId <= 0) {
      throw new Error('Invalid incident ID');
    }
    if (this._incidentId) {
      throw new Error('Event already linked to an incident');
    }

    this._incidentId = incidentId;
    this.touch();
  }

  /**
   * Unlink from incident
   */
  public unlinkFromIncident(): void {
    this._incidentId = undefined;
    this.touch();
  }

  /**
   * Add correlated event
   */
  public correlateWith(eventId: number): void {
    if (eventId === this._id) {
      throw new Error('Cannot correlate event with itself');
    }
    if (this._correlatedEvents.includes(eventId)) {
      throw new Error('Event already correlated');
    }

    this._correlatedEvents.push(eventId);
    this.touch();
  }

  /**
   * Remove correlated event
   */
  public uncorrelateWith(eventId: number): void {
    const index = this._correlatedEvents.indexOf(eventId);
    if (index === -1) {
      throw new Error('Event not correlated');
    }

    this._correlatedEvents.splice(index, 1);
    this.touch();
  }

  /**
   * Update confidence score
   */
  public updateConfidence(confidence: number): void {
    if (confidence < 0 || confidence > 100) {
      throw new Error('Confidence must be between 0 and 100');
    }

    this._confidence = confidence;
    this.touch();
  }

  /**
   * Add metadata
   */
  public addMetadata(key: string, value: any): void {
    if (!key || key.trim().length === 0) {
      throw new Error('Metadata key cannot be empty');
    }

    this._metadata[key] = value;
    this.touch();
  }

  /**
   * Remove metadata
   */
  public removeMetadata(key: string): void {
    delete this._metadata[key];
    this.touch();
  }

  /**
   * Update severity
   */
  public updateSeverity(newSeverity: EventSeverity): void {
    this._severity = EventSeverityVO.create(newSeverity);
    this.touch();
  }

  /**
   * Check if event is linked to incident
   */
  public isLinkedToIncident(): boolean {
    return !!this._incidentId;
  }

  /**
   * Check if event has correlations
   */
  public hasCorrelations(): boolean {
    return this._correlatedEvents.length > 0;
  }

  /**
   * Check if event requires investigation
   */
  public requiresInvestigation(): boolean {
    if (this._falsePositive) return false;
    if (this._severity.isHigh()) return true;
    if (this._source.requiresInvestigation()) return true;
    if (this.hasCorrelations()) return true;
    return false;
  }

  /**
   * Check if event should trigger alert
   */
  public shouldAlert(): boolean {
    if (this._falsePositive) return false;
    if (this._severity.isCritical() || this._severity.isHigh()) return true;
    if (this._confidence && this._confidence >= 90) return true;
    return false;
  }

  /**
   * Get age in hours
   */
  public getAgeHours(): number {
    const now = new Date();
    const diff = now.getTime() - this._detectedAt.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10;
  }

  /**
   * Check if event is stale (older than 30 days and not linked to incident)
   */
  public isStale(): boolean {
    if (this._incidentId) return false;
    return this.getAgeHours() > (30 * 24);
  }

  /**
   * Get threat level (0-100) based on severity, confidence, and correlations
   */
  public getThreatLevel(): number {
    let level = this._severity.getThreatScore(); // Base: 0-50

    // Add confidence factor (0-25)
    if (this._confidence) {
      level += (this._confidence / 100) * 25;
    }

    // Add correlation factor (0-15)
    if (this._correlatedEvents.length > 0) {
      level += Math.min(this._correlatedEvents.length * 3, 15);
    }

    // Add incident link factor (0-10)
    if (this._incidentId) {
      level += 10;
    }

    // Subtract false positive penalty
    if (this._falsePositive) {
      level = 0;
    }

    return Math.min(Math.round(level), 100);
  }

  /**
   * Generate network connection string
   */
  public getConnectionString(): string | null {
    if (!this._sourceIp && !this._destinationIp) return null;

    const src = this._sourceIp || 'unknown';
    const srcPort = this._sourcePort ? `:${this._sourcePort}` : '';
    const dst = this._destinationIp || 'unknown';
    const dstPort = this._destinationPort ? `:${this._destinationPort}` : '';
    const proto = this._protocol ? `[${this._protocol}]` : '';

    return `${src}${srcPort} → ${dst}${dstPort} ${proto}`.trim();
  }

  /**
   * Update timestamp
   */
  private touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): any {
    return {
      id: this._id,
      eventType: this._eventType,
      severity: this._severity.value,
      severityLabel: this._severity.getLabel(),
      severityColor: this._severity.getColor(),
      source: this._source.value,
      sourceLabel: this._source.getLabel(),
      sourceCategory: this._source.getCategory(),
      sourceSystem: this._sourceSystem,
      sourceIp: this._sourceIp,
      destinationIp: this._destinationIp,
      sourcePort: this._sourcePort,
      destinationPort: this._destinationPort,
      protocol: this._protocol,
      connectionString: this.getConnectionString(),
      userId: this._userId,
      assetId: this._assetId,
      assetName: this._assetName,
      description: this._description,
      rawLog: this._rawLog,
      detectedAt: this._detectedAt.toISOString(),
      ageHours: this.getAgeHours(),
      signature: this._signature,
      confidence: this._confidence,
      falsePositive: this._falsePositive,
      incidentId: this._incidentId,
      isLinkedToIncident: this.isLinkedToIncident(),
      correlatedEvents: this._correlatedEvents,
      correlationCount: this._correlatedEvents.length,
      hasCorrelations: this.hasCorrelations(),
      metadata: this._metadata,
      hash: this._hash,
      threatLevel: this.getThreatLevel(),
      requiresInvestigation: this.requiresInvestigation(),
      shouldAlert: this.shouldAlert(),
      isStale: this.isStale(),
      organizationId: this._organizationId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}
