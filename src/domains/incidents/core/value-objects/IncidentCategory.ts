/**
 * IncidentCategory - Value Object for incident categorization
 * 
 * Based on common security incident types
 */

export enum IncidentCategory {
  Malware = 'malware',                     // Malware infection
  Phishing = 'phishing',                   // Phishing attack
  DataBreach = 'data_breach',              // Data breach/exfiltration
  DenialOfService = 'denial_of_service',   // DoS/DDoS attack
  UnauthorizedAccess = 'unauthorized_access', // Unauthorized system access
  InsiderThreat = 'insider_threat',        // Malicious insider
  SystemFailure = 'system_failure',        // Technical failure
  PolicyViolation = 'policy_violation',    // Security policy violation
  PhysicalSecurity = 'physical_security',  // Physical security breach
  Other = 'other'                          // Other incident types
}

export class IncidentCategoryVO {
  private constructor(private readonly _value: IncidentCategory) {}

  static create(value: string): IncidentCategoryVO {
    const lowerValue = value.toLowerCase().replace(/\s+/g, '_');
    
    const categoryMap: Record<string, IncidentCategory> = {
      'malware': IncidentCategory.Malware,
      'phishing': IncidentCategory.Phishing,
      'data_breach': IncidentCategory.DataBreach,
      'denial_of_service': IncidentCategory.DenialOfService,
      'dos': IncidentCategory.DenialOfService,
      'ddos': IncidentCategory.DenialOfService,
      'unauthorized_access': IncidentCategory.UnauthorizedAccess,
      'insider_threat': IncidentCategory.InsiderThreat,
      'system_failure': IncidentCategory.SystemFailure,
      'policy_violation': IncidentCategory.PolicyViolation,
      'physical_security': IncidentCategory.PhysicalSecurity,
      'other': IncidentCategory.Other
    };

    const category = categoryMap[lowerValue];
    if (!category) {
      const validCategories = Object.values(IncidentCategory).join(', ');
      throw new Error(`Invalid incident category: ${value}. Must be one of: ${validCategories}`);
    }

    return new IncidentCategoryVO(category);
  }

  get value(): IncidentCategory {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<IncidentCategory, string> = {
      [IncidentCategory.Malware]: 'Malware',
      [IncidentCategory.Phishing]: 'Phishing',
      [IncidentCategory.DataBreach]: 'Data Breach',
      [IncidentCategory.DenialOfService]: 'Denial of Service',
      [IncidentCategory.UnauthorizedAccess]: 'Unauthorized Access',
      [IncidentCategory.InsiderThreat]: 'Insider Threat',
      [IncidentCategory.SystemFailure]: 'System Failure',
      [IncidentCategory.PolicyViolation]: 'Policy Violation',
      [IncidentCategory.PhysicalSecurity]: 'Physical Security',
      [IncidentCategory.Other]: 'Other'
    };
    return displayMap[this._value];
  }

  get icon(): string {
    const iconMap: Record<IncidentCategory, string> = {
      [IncidentCategory.Malware]: 'bug',
      [IncidentCategory.Phishing]: 'fishing',
      [IncidentCategory.DataBreach]: 'database',
      [IncidentCategory.DenialOfService]: 'server',
      [IncidentCategory.UnauthorizedAccess]: 'lock-open',
      [IncidentCategory.InsiderThreat]: 'user-secret',
      [IncidentCategory.SystemFailure]: 'exclamation-triangle',
      [IncidentCategory.PolicyViolation]: 'file-contract',
      [IncidentCategory.PhysicalSecurity]: 'building',
      [IncidentCategory.Other]: 'question-circle'
    };
    return iconMap[this._value];
  }

  equals(other: IncidentCategoryVO): boolean {
    return this._value === other._value;
  }

  requiresForensics(): boolean {
    return [
      IncidentCategory.DataBreach,
      IncidentCategory.Malware,
      IncidentCategory.InsiderThreat
    ].includes(this._value);
  }

  requiresLegalReview(): boolean {
    return [
      IncidentCategory.DataBreach,
      IncidentCategory.InsiderThreat
    ].includes(this._value);
  }
}
