/**
 * ImpactLevel - Value Object for business impact assessment
 * 
 * Measures the business impact of a security incident
 */

export enum ImpactLevel {
  Catastrophic = 'catastrophic',   // Complete business disruption
  Major = 'major',                 // Significant business impact
  Moderate = 'moderate',           // Limited business impact
  Minor = 'minor',                 // Minimal business impact
  Negligible = 'negligible'        // No measurable business impact
}

export class ImpactLevelVO {
  private constructor(private readonly _value: ImpactLevel) {}

  static create(value: string): ImpactLevelVO {
    const lowerValue = value.toLowerCase();
    
    const impactMap: Record<string, ImpactLevel> = {
      'catastrophic': ImpactLevel.Catastrophic,
      'major': ImpactLevel.Major,
      'moderate': ImpactLevel.Moderate,
      'minor': ImpactLevel.Minor,
      'negligible': ImpactLevel.Negligible
    };

    const impact = impactMap[lowerValue];
    if (!impact) {
      const validImpacts = Object.values(ImpactLevel).join(', ');
      throw new Error(`Invalid impact level: ${value}. Must be one of: ${validImpacts}`);
    }

    return new ImpactLevelVO(impact);
  }

  get value(): ImpactLevel {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<ImpactLevel, string> = {
      [ImpactLevel.Catastrophic]: 'Catastrophic',
      [ImpactLevel.Major]: 'Major',
      [ImpactLevel.Moderate]: 'Moderate',
      [ImpactLevel.Minor]: 'Minor',
      [ImpactLevel.Negligible]: 'Negligible'
    };
    return displayMap[this._value];
  }

  get color(): string {
    const colorMap: Record<ImpactLevel, string> = {
      [ImpactLevel.Catastrophic]: '#7F1D1D',  // Dark Red
      [ImpactLevel.Major]: '#DC2626',         // Red
      [ImpactLevel.Moderate]: '#F59E0B',      // Amber
      [ImpactLevel.Minor]: '#10B981',         // Green
      [ImpactLevel.Negligible]: '#6B7280'     // Gray
    };
    return colorMap[this._value];
  }

  get score(): number {
    const scoreMap: Record<ImpactLevel, number> = {
      [ImpactLevel.Catastrophic]: 5,
      [ImpactLevel.Major]: 4,
      [ImpactLevel.Moderate]: 3,
      [ImpactLevel.Minor]: 2,
      [ImpactLevel.Negligible]: 1
    };
    return scoreMap[this._value];
  }

  get financialThreshold(): string {
    // Indicative financial impact thresholds
    const thresholdMap: Record<ImpactLevel, string> = {
      [ImpactLevel.Catastrophic]: '> $1M',
      [ImpactLevel.Major]: '$100K - $1M',
      [ImpactLevel.Moderate]: '$10K - $100K',
      [ImpactLevel.Minor]: '$1K - $10K',
      [ImpactLevel.Negligible]: '< $1K'
    };
    return thresholdMap[this._value];
  }

  equals(other: ImpactLevelVO): boolean {
    return this._value === other._value;
  }

  requiresExecutiveNotification(): boolean {
    return this._value === ImpactLevel.Catastrophic || 
           this._value === ImpactLevel.Major;
  }

  requiresRegulatorNotification(): boolean {
    return this._value === ImpactLevel.Catastrophic;
  }
}
