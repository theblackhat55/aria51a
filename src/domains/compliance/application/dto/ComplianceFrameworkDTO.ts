/**
 * ComplianceFrameworkDTO - Data Transfer Objects for ComplianceFramework
 */

import { ComplianceFramework } from '../../core/entities/ComplianceFramework';

export interface ComplianceFrameworkDTO {
  id: number;
  name: string;
  type: string;
  typeDisplay: string;
  typeShortName: string;
  version: string;
  description: string;
  scope?: string;
  targetCompletionDate?: string;
  certificationDate?: string;
  expiryDate?: string;
  isActive: boolean;
  totalControls: number;
  implementedControls: number;
  completionPercentage: number;
  isOverdue: boolean;
  isCertified: boolean;
  isCertificationExpired: boolean;
  isCertificationExpiringSoon: boolean;
  isRegulatory: boolean;
  isCertifiable: boolean;
  organizationId: number;
  ownerId?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceFrameworkListDTO {
  frameworks: ComplianceFrameworkDTO[];
  total: number;
  limit: number;
  offset: number;
}

export class ComplianceFrameworkDTOMapper {
  /**
   * Convert single entity to DTO
   */
  static toDTO(framework: ComplianceFramework): ComplianceFrameworkDTO {
    const json = framework.toJSON();
    return {
      ...json,
      targetCompletionDate: json.targetCompletionDate?.toISOString(),
      certificationDate: json.certificationDate?.toISOString(),
      expiryDate: json.expiryDate?.toISOString(),
      createdAt: json.createdAt.toISOString(),
      updatedAt: json.updatedAt.toISOString()
    };
  }

  /**
   * Convert list of entities to DTOs
   */
  static toDTOList(frameworks: ComplianceFramework[]): ComplianceFrameworkDTO[] {
    return frameworks.map(framework => this.toDTO(framework));
  }

  /**
   * Convert to list DTO with pagination
   */
  static toListDTO(
    frameworks: ComplianceFramework[],
    total: number,
    limit: number,
    offset: number
  ): ComplianceFrameworkListDTO {
    return {
      frameworks: this.toDTOList(frameworks),
      total,
      limit,
      offset
    };
  }
}
