/**
 * EventSource Value Object
 * 
 * Represents the source system that detected a security event.
 * Used for categorizing events and understanding detection capabilities.
 */

import { ValueObject } from '../../../../shared/core/ValueObject';

export enum EventSource {
  // Network Security
  Firewall = 'firewall',
  IDS = 'ids',                        // Intrusion Detection System
  IPS = 'ips',                        // Intrusion Prevention System
  NetworkMonitor = 'network_monitor',
  DLP = 'dlp',                        // Data Loss Prevention
  
  // Endpoint Security
  Antivirus = 'antivirus',
  EDR = 'edr',                        // Endpoint Detection and Response
  HostIDS = 'host_ids',
  
  // Identity & Access
  IAM = 'iam',                        // Identity and Access Management
  ActiveDirectory = 'active_directory',
  SSO = 'sso',                        // Single Sign-On
  MFA = 'mfa',                        // Multi-Factor Authentication
  
  // Cloud Security
  CASB = 'casb',                      // Cloud Access Security Broker
  CloudProvider = 'cloud_provider',
  CloudMonitor = 'cloud_monitor',
  
  // Application Security
  WAF = 'waf',                        // Web Application Firewall
  ApplicationLog = 'application_log',
  APIGateway = 'api_gateway',
  
  // Email Security
  EmailGateway = 'email_gateway',
  AntiSpam = 'anti_spam',
  EmailDLP = 'email_dlp',
  
  // SIEM & Analytics
  SIEM = 'siem',                      // Security Information and Event Management
  LogAggregator = 'log_aggregator',
  ThreatIntel = 'threat_intel',
  
  // Physical Security
  PhysicalAccess = 'physical_access',
  CCTV = 'cctv',
  
  // Other
  VulnerabilityScanner = 'vulnerability_scanner',
  ManualReport = 'manual_report',
  ThirdPartyAlert = 'third_party_alert',
  Other = 'other'
}

export class EventSourceVO extends ValueObject<EventSource> {
  private constructor(value: EventSource) {
    super(value);
  }

  public static create(value: EventSource): EventSourceVO {
    if (!Object.values(EventSource).includes(value)) {
      throw new Error(`Invalid event source: ${value}`);
    }
    return new EventSourceVO(value);
  }

  /**
   * Get human-readable label
   */
  public getLabel(): string {
    const labels: Record<EventSource, string> = {
      [EventSource.Firewall]: 'Firewall',
      [EventSource.IDS]: 'IDS',
      [EventSource.IPS]: 'IPS',
      [EventSource.NetworkMonitor]: 'Network Monitor',
      [EventSource.DLP]: 'DLP',
      [EventSource.Antivirus]: 'Antivirus',
      [EventSource.EDR]: 'EDR',
      [EventSource.HostIDS]: 'Host IDS',
      [EventSource.IAM]: 'IAM',
      [EventSource.ActiveDirectory]: 'Active Directory',
      [EventSource.SSO]: 'SSO',
      [EventSource.MFA]: 'MFA',
      [EventSource.CASB]: 'CASB',
      [EventSource.CloudProvider]: 'Cloud Provider',
      [EventSource.CloudMonitor]: 'Cloud Monitor',
      [EventSource.WAF]: 'WAF',
      [EventSource.ApplicationLog]: 'Application Log',
      [EventSource.APIGateway]: 'API Gateway',
      [EventSource.EmailGateway]: 'Email Gateway',
      [EventSource.AntiSpam]: 'Anti-Spam',
      [EventSource.EmailDLP]: 'Email DLP',
      [EventSource.SIEM]: 'SIEM',
      [EventSource.LogAggregator]: 'Log Aggregator',
      [EventSource.ThreatIntel]: 'Threat Intelligence',
      [EventSource.PhysicalAccess]: 'Physical Access',
      [EventSource.CCTV]: 'CCTV',
      [EventSource.VulnerabilityScanner]: 'Vulnerability Scanner',
      [EventSource.ManualReport]: 'Manual Report',
      [EventSource.ThirdPartyAlert]: 'Third-Party Alert',
      [EventSource.Other]: 'Other'
    };
    return labels[this._value];
  }

  /**
   * Get category
   */
  public getCategory(): string {
    const categories: Record<EventSource, string> = {
      [EventSource.Firewall]: 'Network Security',
      [EventSource.IDS]: 'Network Security',
      [EventSource.IPS]: 'Network Security',
      [EventSource.NetworkMonitor]: 'Network Security',
      [EventSource.DLP]: 'Network Security',
      [EventSource.Antivirus]: 'Endpoint Security',
      [EventSource.EDR]: 'Endpoint Security',
      [EventSource.HostIDS]: 'Endpoint Security',
      [EventSource.IAM]: 'Identity & Access',
      [EventSource.ActiveDirectory]: 'Identity & Access',
      [EventSource.SSO]: 'Identity & Access',
      [EventSource.MFA]: 'Identity & Access',
      [EventSource.CASB]: 'Cloud Security',
      [EventSource.CloudProvider]: 'Cloud Security',
      [EventSource.CloudMonitor]: 'Cloud Security',
      [EventSource.WAF]: 'Application Security',
      [EventSource.ApplicationLog]: 'Application Security',
      [EventSource.APIGateway]: 'Application Security',
      [EventSource.EmailGateway]: 'Email Security',
      [EventSource.AntiSpam]: 'Email Security',
      [EventSource.EmailDLP]: 'Email Security',
      [EventSource.SIEM]: 'SIEM & Analytics',
      [EventSource.LogAggregator]: 'SIEM & Analytics',
      [EventSource.ThreatIntel]: 'SIEM & Analytics',
      [EventSource.PhysicalAccess]: 'Physical Security',
      [EventSource.CCTV]: 'Physical Security',
      [EventSource.VulnerabilityScanner]: 'Scanning & Assessment',
      [EventSource.ManualReport]: 'Human Intelligence',
      [EventSource.ThirdPartyAlert]: 'External Intelligence',
      [EventSource.Other]: 'Other'
    };
    return categories[this._value];
  }

  /**
   * Get reliability score (0-100)
   */
  public getReliabilityScore(): number {
    const scores: Record<EventSource, number> = {
      [EventSource.SIEM]: 95,
      [EventSource.EDR]: 90,
      [EventSource.IPS]: 90,
      [EventSource.IDS]: 85,
      [EventSource.WAF]: 85,
      [EventSource.ThreatIntel]: 85,
      [EventSource.Firewall]: 80,
      [EventSource.CASB]: 80,
      [EventSource.DLP]: 80,
      [EventSource.Antivirus]: 75,
      [EventSource.EmailGateway]: 75,
      [EventSource.IAM]: 75,
      [EventSource.CloudProvider]: 70,
      [EventSource.ActiveDirectory]: 70,
      [EventSource.NetworkMonitor]: 70,
      [EventSource.HostIDS]: 70,
      [EventSource.VulnerabilityScanner]: 65,
      [EventSource.SSO]: 65,
      [EventSource.MFA]: 65,
      [EventSource.ApplicationLog]: 60,
      [EventSource.APIGateway]: 60,
      [EventSource.CloudMonitor]: 60,
      [EventSource.AntiSpam]: 60,
      [EventSource.EmailDLP]: 60,
      [EventSource.LogAggregator]: 55,
      [EventSource.PhysicalAccess]: 50,
      [EventSource.CCTV]: 50,
      [EventSource.ManualReport]: 40,
      [EventSource.ThirdPartyAlert]: 50,
      [EventSource.Other]: 30
    };
    return scores[this._value];
  }

  /**
   * Check if source is real-time
   */
  public isRealTime(): boolean {
    return [
      EventSource.IPS,
      EventSource.Firewall,
      EventSource.EDR,
      EventSource.WAF,
      EventSource.SIEM,
      EventSource.NetworkMonitor
    ].includes(this._value);
  }

  /**
   * Check if source is automated
   */
  public isAutomated(): boolean {
    return this._value !== EventSource.ManualReport;
  }

  /**
   * Check if source can block threats
   */
  public canBlockThreats(): boolean {
    return [
      EventSource.IPS,
      EventSource.Firewall,
      EventSource.WAF,
      EventSource.EDR,
      EventSource.DLP,
      EventSource.EmailGateway
    ].includes(this._value);
  }

  /**
   * Check if source requires investigation
   */
  public requiresInvestigation(): boolean {
    return [
      EventSource.IDS,
      EventSource.NetworkMonitor,
      EventSource.ThreatIntel,
      EventSource.VulnerabilityScanner,
      EventSource.ManualReport,
      EventSource.ThirdPartyAlert
    ].includes(this._value);
  }

  /**
   * Check if source is network-based
   */
  public isNetworkBased(): boolean {
    return this.getCategory() === 'Network Security';
  }

  /**
   * Check if source is endpoint-based
   */
  public isEndpointBased(): boolean {
    return this.getCategory() === 'Endpoint Security';
  }

  /**
   * Check if source is cloud-based
   */
  public isCloudBased(): boolean {
    return this.getCategory() === 'Cloud Security';
  }

  /**
   * Get typical false positive rate (0-100)
   */
  public getFalsePositiveRate(): number {
    const rates: Record<EventSource, number> = {
      [EventSource.IPS]: 5,
      [EventSource.EDR]: 5,
      [EventSource.SIEM]: 10,
      [EventSource.ThreatIntel]: 10,
      [EventSource.WAF]: 15,
      [EventSource.IDS]: 20,
      [EventSource.Firewall]: 15,
      [EventSource.DLP]: 25,
      [EventSource.Antivirus]: 10,
      [EventSource.VulnerabilityScanner]: 30,
      [EventSource.NetworkMonitor]: 20,
      [EventSource.EmailGateway]: 20,
      [EventSource.AntiSpam]: 35,
      [EventSource.ApplicationLog]: 40,
      [EventSource.CASB]: 15,
      [EventSource.HostIDS]: 20,
      [EventSource.IAM]: 10,
      [EventSource.ActiveDirectory]: 10,
      [EventSource.SSO]: 5,
      [EventSource.MFA]: 5,
      [EventSource.CloudProvider]: 15,
      [EventSource.CloudMonitor]: 25,
      [EventSource.APIGateway]: 30,
      [EventSource.EmailDLP]: 25,
      [EventSource.LogAggregator]: 35,
      [EventSource.PhysicalAccess]: 5,
      [EventSource.CCTV]: 10,
      [EventSource.ManualReport]: 20,
      [EventSource.ThirdPartyAlert]: 30,
      [EventSource.Other]: 50
    };
    return rates[this._value];
  }

  /**
   * Get icon for UI display
   */
  public getIcon(): string {
    const icons: Record<EventSource, string> = {
      [EventSource.Firewall]: '🔥',
      [EventSource.IDS]: '🔍',
      [EventSource.IPS]: '🛡️',
      [EventSource.NetworkMonitor]: '📡',
      [EventSource.DLP]: '🔐',
      [EventSource.Antivirus]: '🦠',
      [EventSource.EDR]: '💻',
      [EventSource.HostIDS]: '🖥️',
      [EventSource.IAM]: '👤',
      [EventSource.ActiveDirectory]: '📁',
      [EventSource.SSO]: '🔑',
      [EventSource.MFA]: '🔐',
      [EventSource.CASB]: '☁️',
      [EventSource.CloudProvider]: '☁️',
      [EventSource.CloudMonitor]: '📊',
      [EventSource.WAF]: '🌐',
      [EventSource.ApplicationLog]: '📝',
      [EventSource.APIGateway]: '🚪',
      [EventSource.EmailGateway]: '📧',
      [EventSource.AntiSpam]: '🚫',
      [EventSource.EmailDLP]: '📧',
      [EventSource.SIEM]: '🎯',
      [EventSource.LogAggregator]: '📚',
      [EventSource.ThreatIntel]: '🕵️',
      [EventSource.PhysicalAccess]: '🚪',
      [EventSource.CCTV]: '📹',
      [EventSource.VulnerabilityScanner]: '🔬',
      [EventSource.ManualReport]: '👨‍💼',
      [EventSource.ThirdPartyAlert]: '📢',
      [EventSource.Other]: '❓'
    };
    return icons[this._value];
  }
}
