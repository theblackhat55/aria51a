/**
 * ResponseType Value Object
 * 
 * Represents the type of response action taken during incident handling.
 * Aligned with NIST SP 800-61 incident response phases.
 */

import { ValueObject } from '../../../../shared/core/ValueObject';

export enum ResponseType {
  Detection = 'detection',               // Initial detection and alerting
  Triage = 'triage',                    // Initial assessment and prioritization
  Investigation = 'investigation',       // Evidence collection and analysis
  Containment = 'containment',          // Isolate affected systems
  Eradication = 'eradication',          // Remove threat/malware
  Recovery = 'recovery',                 // Restore systems and services
  Communication = 'communication',       // Internal/external notifications
  Documentation = 'documentation',       // Recording activities and findings
  ForensicAnalysis = 'forensic_analysis', // Detailed forensic investigation
  PatchDeployment = 'patch_deployment',  // Deploy security patches
  SystemRestore = 'system_restore',      // Restore from backups
  AccessRevocation = 'access_revocation', // Revoke compromised credentials
  MonitoringEnhancement = 'monitoring_enhancement', // Improve detection
  PolicyUpdate = 'policy_update',        // Update security policies
  TrainingDelivery = 'training_delivery', // Security awareness training
  VulnerabilityRemediation = 'vulnerability_remediation', // Fix vulnerabilities
  PostIncidentReview = 'post_incident_review', // Lessons learned
  Other = 'other'                        // Other response actions
}

export class ResponseTypeVO extends ValueObject<ResponseType> {
  private constructor(value: ResponseType) {
    super(value);
  }

  public static create(value: ResponseType): ResponseTypeVO {
    if (!Object.values(ResponseType).includes(value)) {
      throw new Error(`Invalid response type: ${value}`);
    }
    return new ResponseTypeVO(value);
  }

  /**
   * Get human-readable label
   */
  public getLabel(): string {
    const labels: Record<ResponseType, string> = {
      [ResponseType.Detection]: 'Detection',
      [ResponseType.Triage]: 'Triage',
      [ResponseType.Investigation]: 'Investigation',
      [ResponseType.Containment]: 'Containment',
      [ResponseType.Eradication]: 'Eradication',
      [ResponseType.Recovery]: 'Recovery',
      [ResponseType.Communication]: 'Communication',
      [ResponseType.Documentation]: 'Documentation',
      [ResponseType.ForensicAnalysis]: 'Forensic Analysis',
      [ResponseType.PatchDeployment]: 'Patch Deployment',
      [ResponseType.SystemRestore]: 'System Restore',
      [ResponseType.AccessRevocation]: 'Access Revocation',
      [ResponseType.MonitoringEnhancement]: 'Monitoring Enhancement',
      [ResponseType.PolicyUpdate]: 'Policy Update',
      [ResponseType.TrainingDelivery]: 'Training Delivery',
      [ResponseType.VulnerabilityRemediation]: 'Vulnerability Remediation',
      [ResponseType.PostIncidentReview]: 'Post-Incident Review',
      [ResponseType.Other]: 'Other'
    };
    return labels[this._value];
  }

  /**
   * Get description
   */
  public getDescription(): string {
    const descriptions: Record<ResponseType, string> = {
      [ResponseType.Detection]: 'Initial detection and alerting of the incident',
      [ResponseType.Triage]: 'Initial assessment and prioritization of the incident',
      [ResponseType.Investigation]: 'Evidence collection and detailed analysis',
      [ResponseType.Containment]: 'Isolate affected systems to prevent spread',
      [ResponseType.Eradication]: 'Remove threat, malware, or unauthorized access',
      [ResponseType.Recovery]: 'Restore systems and services to normal operation',
      [ResponseType.Communication]: 'Notify stakeholders (internal/external)',
      [ResponseType.Documentation]: 'Document activities, findings, and evidence',
      [ResponseType.ForensicAnalysis]: 'Detailed forensic investigation and analysis',
      [ResponseType.PatchDeployment]: 'Deploy security patches and updates',
      [ResponseType.SystemRestore]: 'Restore systems from clean backups',
      [ResponseType.AccessRevocation]: 'Revoke compromised credentials or access',
      [ResponseType.MonitoringEnhancement]: 'Improve detection and monitoring capabilities',
      [ResponseType.PolicyUpdate]: 'Update security policies and procedures',
      [ResponseType.TrainingDelivery]: 'Deliver security awareness training',
      [ResponseType.VulnerabilityRemediation]: 'Fix identified vulnerabilities',
      [ResponseType.PostIncidentReview]: 'Conduct lessons learned review',
      [ResponseType.Other]: 'Other response actions'
    };
    return descriptions[this._value];
  }

  /**
   * Get priority (1-5, 1 = highest)
   */
  public getPriority(): number {
    const priorities: Record<ResponseType, number> = {
      [ResponseType.Detection]: 1,
      [ResponseType.Triage]: 1,
      [ResponseType.Containment]: 1,
      [ResponseType.Investigation]: 2,
      [ResponseType.Eradication]: 2,
      [ResponseType.Communication]: 2,
      [ResponseType.Recovery]: 3,
      [ResponseType.AccessRevocation]: 2,
      [ResponseType.ForensicAnalysis]: 3,
      [ResponseType.PatchDeployment]: 3,
      [ResponseType.SystemRestore]: 3,
      [ResponseType.Documentation]: 4,
      [ResponseType.MonitoringEnhancement]: 4,
      [ResponseType.VulnerabilityRemediation]: 4,
      [ResponseType.PolicyUpdate]: 4,
      [ResponseType.PostIncidentReview]: 5,
      [ResponseType.TrainingDelivery]: 5,
      [ResponseType.Other]: 3
    };
    return priorities[this._value];
  }

  /**
   * Get NIST phase
   */
  public getNISTPhase(): string {
    const phases: Record<ResponseType, string> = {
      [ResponseType.Detection]: 'Detection and Analysis',
      [ResponseType.Triage]: 'Detection and Analysis',
      [ResponseType.Investigation]: 'Detection and Analysis',
      [ResponseType.ForensicAnalysis]: 'Detection and Analysis',
      [ResponseType.Containment]: 'Containment, Eradication, and Recovery',
      [ResponseType.Eradication]: 'Containment, Eradication, and Recovery',
      [ResponseType.Recovery]: 'Containment, Eradication, and Recovery',
      [ResponseType.AccessRevocation]: 'Containment, Eradication, and Recovery',
      [ResponseType.PatchDeployment]: 'Containment, Eradication, and Recovery',
      [ResponseType.SystemRestore]: 'Containment, Eradication, and Recovery',
      [ResponseType.VulnerabilityRemediation]: 'Containment, Eradication, and Recovery',
      [ResponseType.Communication]: 'Detection and Analysis',
      [ResponseType.Documentation]: 'Post-Incident Activity',
      [ResponseType.MonitoringEnhancement]: 'Post-Incident Activity',
      [ResponseType.PolicyUpdate]: 'Post-Incident Activity',
      [ResponseType.TrainingDelivery]: 'Post-Incident Activity',
      [ResponseType.PostIncidentReview]: 'Post-Incident Activity',
      [ResponseType.Other]: 'Other'
    };
    return phases[this._value];
  }

  /**
   * Check if action requires peer review
   */
  public requiresPeerReview(): boolean {
    return [
      ResponseType.ForensicAnalysis,
      ResponseType.Eradication,
      ResponseType.AccessRevocation,
      ResponseType.PostIncidentReview
    ].includes(this._value);
  }

  /**
   * Check if action should be logged as evidence
   */
  public shouldLogAsEvidence(): boolean {
    return [
      ResponseType.Detection,
      ResponseType.Investigation,
      ResponseType.ForensicAnalysis,
      ResponseType.Containment,
      ResponseType.Eradication,
      ResponseType.AccessRevocation
    ].includes(this._value);
  }

  /**
   * Check if action is time-critical
   */
  public isTimeCritical(): boolean {
    return [
      ResponseType.Detection,
      ResponseType.Containment,
      ResponseType.AccessRevocation
    ].includes(this._value);
  }

  /**
   * Get typical duration in minutes
   */
  public getTypicalDurationMinutes(): number {
    const durations: Record<ResponseType, number> = {
      [ResponseType.Detection]: 15,
      [ResponseType.Triage]: 30,
      [ResponseType.Investigation]: 120,
      [ResponseType.Containment]: 60,
      [ResponseType.Eradication]: 90,
      [ResponseType.Recovery]: 180,
      [ResponseType.Communication]: 20,
      [ResponseType.Documentation]: 45,
      [ResponseType.ForensicAnalysis]: 240,
      [ResponseType.PatchDeployment]: 90,
      [ResponseType.SystemRestore]: 120,
      [ResponseType.AccessRevocation]: 15,
      [ResponseType.MonitoringEnhancement]: 120,
      [ResponseType.PolicyUpdate]: 60,
      [ResponseType.TrainingDelivery]: 60,
      [ResponseType.VulnerabilityRemediation]: 180,
      [ResponseType.PostIncidentReview]: 90,
      [ResponseType.Other]: 60
    };
    return durations[this._value];
  }

  /**
   * Get icon for UI display
   */
  public getIcon(): string {
    const icons: Record<ResponseType, string> = {
      [ResponseType.Detection]: '🔍',
      [ResponseType.Triage]: '📋',
      [ResponseType.Investigation]: '🔬',
      [ResponseType.Containment]: '🚧',
      [ResponseType.Eradication]: '🗑️',
      [ResponseType.Recovery]: '🔄',
      [ResponseType.Communication]: '📢',
      [ResponseType.Documentation]: '📝',
      [ResponseType.ForensicAnalysis]: '🔬',
      [ResponseType.PatchDeployment]: '🔧',
      [ResponseType.SystemRestore]: '💾',
      [ResponseType.AccessRevocation]: '🔒',
      [ResponseType.MonitoringEnhancement]: '📊',
      [ResponseType.PolicyUpdate]: '📜',
      [ResponseType.TrainingDelivery]: '🎓',
      [ResponseType.VulnerabilityRemediation]: '🛠️',
      [ResponseType.PostIncidentReview]: '📖',
      [ResponseType.Other]: '❓'
    };
    return icons[this._value];
  }
}
