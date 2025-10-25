/**
 * AssessmentResult - Value Object for compliance assessment results
 * 
 * Represents the outcome of a compliance assessment/audit
 */

export enum AssessmentResult {
  Compliant = 'compliant',
  PartiallyCompliant = 'partially_compliant',
  NonCompliant = 'non_compliant',
  NotApplicable = 'not_applicable',
  NotAssessed = 'not_assessed'
}

export class AssessmentResultVO {
  private constructor(private readonly _value: AssessmentResult) {}

  static create(value: string): AssessmentResultVO {
    const lowerValue = value.toLowerCase();
    
    const resultMap: Record<string, AssessmentResult> = {
      'compliant': AssessmentResult.Compliant,
      'partially_compliant': AssessmentResult.PartiallyCompliant,
      'non_compliant': AssessmentResult.NonCompliant,
      'not_applicable': AssessmentResult.NotApplicable,
      'not_assessed': AssessmentResult.NotAssessed
    };

    const result = resultMap[lowerValue];
    if (!result) {
      const validResults = Object.values(AssessmentResult).join(', ');
      throw new Error(`Invalid assessment result: ${value}. Must be one of: ${validResults}`);
    }

    return new AssessmentResultVO(result);
  }

  get value(): AssessmentResult {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<AssessmentResult, string> = {
      [AssessmentResult.Compliant]: 'Compliant',
      [AssessmentResult.PartiallyCompliant]: 'Partially Compliant',
      [AssessmentResult.NonCompliant]: 'Non-Compliant',
      [AssessmentResult.NotApplicable]: 'Not Applicable',
      [AssessmentResult.NotAssessed]: 'Not Assessed'
    };
    return displayMap[this._value];
  }

  get color(): string {
    const colorMap: Record<AssessmentResult, string> = {
      [AssessmentResult.Compliant]: '#10B981',           // Green
      [AssessmentResult.PartiallyCompliant]: '#F59E0B',  // Orange
      [AssessmentResult.NonCompliant]: '#DC2626',        // Red
      [AssessmentResult.NotApplicable]: '#6B7280',       // Gray
      [AssessmentResult.NotAssessed]: '#9CA3AF'          // Light Gray
    };
    return colorMap[this._value];
  }

  get score(): number {
    const scoreMap: Record<AssessmentResult, number> = {
      [AssessmentResult.Compliant]: 100,
      [AssessmentResult.PartiallyCompliant]: 50,
      [AssessmentResult.NonCompliant]: 0,
      [AssessmentResult.NotApplicable]: -1,  // Special case
      [AssessmentResult.NotAssessed]: -1     // Special case
    };
    return scoreMap[this._value];
  }

  equals(other: AssessmentResultVO): boolean {
    return this._value === other._value;
  }

  isCompliant(): boolean {
    return this._value === AssessmentResult.Compliant;
  }

  requiresAction(): boolean {
    return this._value === AssessmentResult.NonCompliant || 
           this._value === AssessmentResult.PartiallyCompliant;
  }
}
