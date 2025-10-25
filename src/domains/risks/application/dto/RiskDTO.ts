/**
 * RiskDTO - Data Transfer Object for Risk entity
 * 
 * Used for API responses and serialization
 */

import { Risk } from '../../core/entities/Risk';

export interface RiskDTO {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  probability: number;
  impact: number;
  riskScore: {
    score: number;
    severity: string;
    probabilityLabel: string;
    impactLabel: string;
    severityLabel: string;
    color: string;
    percentage: number;
  };
  status: string;
  statusDisplay: string;
  statusColor: string;
  ownerId: number;
  organizationId: number;
  inherentRisk?: number;
  residualRisk?: number;
  source?: string;
  affectedAssets?: string;
  reviewDate?: string;
  dueDate?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiskListDTO {
  risks: RiskDTO[];
  total: number;
  limit: number;
  offset: number;
}

export interface RiskStatisticsDTO {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}

/**
 * Mapper class to convert Risk entities to DTOs
 */
export class RiskDTOMapper {
  /**
   * Convert single Risk entity to DTO
   */
  static toDTO(risk: Risk): RiskDTO {
    return risk.toJSON() as RiskDTO;
  }

  /**
   * Convert array of Risk entities to DTOs
   */
  static toDTOList(risks: Risk[]): RiskDTO[] {
    return risks.map(risk => this.toDTO(risk));
  }

  /**
   * Convert to paginated list DTO
   */
  static toListDTO(
    risks: Risk[],
    total: number,
    limit: number,
    offset: number
  ): RiskListDTO {
    return {
      risks: this.toDTOList(risks),
      total,
      limit,
      offset
    };
  }

  /**
   * Convert statistics to DTO
   */
  static toStatisticsDTO(stats: {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  }): RiskStatisticsDTO {
    return stats;
  }
}
