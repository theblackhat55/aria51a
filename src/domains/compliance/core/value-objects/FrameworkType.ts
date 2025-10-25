/**
 * FrameworkType - Value Object for compliance framework types
 * 
 * Common compliance and security frameworks
 */

export enum FrameworkType {
  NISTCSF = 'nist_csf',           // NIST Cybersecurity Framework
  ISO27001 = 'iso_27001',         // ISO/IEC 27001
  SOC2 = 'soc_2',                 // SOC 2
  GDPR = 'gdpr',                  // General Data Protection Regulation
  HIPAA = 'hipaa',                // Health Insurance Portability and Accountability Act
  PCI DSS = 'pci_dss',            // Payment Card Industry Data Security Standard
  NIST800_53 = 'nist_800_53',     // NIST SP 800-53
  CIS = 'cis',                    // CIS Controls
  COBIT = 'cobit',                // Control Objectives for Information Technologies
  FISMA = 'fisma',                // Federal Information Security Management Act
  FedRAMP = 'fedramp',            // Federal Risk and Authorization Management Program
  Custom = 'custom'               // Custom framework
}

export class FrameworkTypeVO {
  private constructor(private readonly _value: FrameworkType) {}

  static create(value: string): FrameworkTypeVO {
    const lowerValue = value.toLowerCase();
    
    const typeMap: Record<string, FrameworkType> = {
      'nist_csf': FrameworkType.NISTCSF,
      'iso_27001': FrameworkType.ISO27001,
      'soc_2': FrameworkType.SOC2,
      'gdpr': FrameworkType.GDPR,
      'hipaa': FrameworkType.HIPAA,
      'pci_dss': FrameworkType.PCI DSS,
      'nist_800_53': FrameworkType.NIST800_53,
      'cis': FrameworkType.CIS,
      'cobit': FrameworkType.COBIT,
      'fisma': FrameworkType.FISMA,
      'fedramp': FrameworkType.FedRAMP,
      'custom': FrameworkType.Custom
    };

    const type = typeMap[lowerValue];
    if (!type) {
      const validTypes = Object.values(FrameworkType).join(', ');
      throw new Error(`Invalid framework type: ${value}. Must be one of: ${validTypes}`);
    }

    return new FrameworkTypeVO(type);
  }

  get value(): FrameworkType {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<FrameworkType, string> = {
      [FrameworkType.NISTCSF]: 'NIST Cybersecurity Framework',
      [FrameworkType.ISO27001]: 'ISO/IEC 27001',
      [FrameworkType.SOC2]: 'SOC 2',
      [FrameworkType.GDPR]: 'GDPR',
      [FrameworkType.HIPAA]: 'HIPAA',
      [FrameworkType.PCI DSS]: 'PCI DSS',
      [FrameworkType.NIST800_53]: 'NIST SP 800-53',
      [FrameworkType.CIS]: 'CIS Controls',
      [FrameworkType.COBIT]: 'COBIT',
      [FrameworkType.FISMA]: 'FISMA',
      [FrameworkType.FedRAMP]: 'FedRAMP',
      [FrameworkType.Custom]: 'Custom Framework'
    };
    return displayMap[this._value];
  }

  get shortName(): string {
    const shortNameMap: Record<FrameworkType, string> = {
      [FrameworkType.NISTCSF]: 'NIST CSF',
      [FrameworkType.ISO27001]: 'ISO 27001',
      [FrameworkType.SOC2]: 'SOC 2',
      [FrameworkType.GDPR]: 'GDPR',
      [FrameworkType.HIPAA]: 'HIPAA',
      [FrameworkType.PCI DSS]: 'PCI DSS',
      [FrameworkType.NIST800_53]: 'NIST 800-53',
      [FrameworkType.CIS]: 'CIS',
      [FrameworkType.COBIT]: 'COBIT',
      [FrameworkType.FISMA]: 'FISMA',
      [FrameworkType.FedRAMP]: 'FedRAMP',
      [FrameworkType.Custom]: 'Custom'
    };
    return shortNameMap[this._value];
  }

  equals(other: FrameworkTypeVO): boolean {
    return this._value === other._value;
  }

  isRegulatory(): boolean {
    return [
      FrameworkType.GDPR,
      FrameworkType.HIPAA,
      FrameworkType.PCI DSS,
      FrameworkType.FISMA
    ].includes(this._value);
  }

  isCertifiable(): boolean {
    return [
      FrameworkType.ISO27001,
      FrameworkType.SOC2,
      FrameworkType.FedRAMP
    ].includes(this._value);
  }
}
