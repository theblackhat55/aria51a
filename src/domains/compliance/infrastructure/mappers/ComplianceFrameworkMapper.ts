/**
 * ComplianceFrameworkMapper - Maps between domain and persistence
 */

import { ComplianceFramework } from '../../core/entities/ComplianceFramework';

interface FrameworkDBRecord {
  id: number;
  name: string;
  type: string;
  version: string;
  description: string;
  scope: string | null;
  target_completion_date: string | null;
  certification_date: string | null;
  expiry_date: string | null;
  is_active: number;
  total_controls: number;
  implemented_controls: number;
  organization_id: number;
  owner_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export class ComplianceFrameworkMapper {
  static toDomain(raw: FrameworkDBRecord): ComplianceFramework {
    return ComplianceFramework.reconstitute({
      id: raw.id,
      name: raw.name,
      type: raw.type as any,
      version: raw.version,
      description: raw.description,
      scope: raw.scope ?? undefined,
      targetCompletionDate: raw.target_completion_date ? new Date(raw.target_completion_date) : undefined,
      certificationDate: raw.certification_date ? new Date(raw.certification_date) : undefined,
      expiryDate: raw.expiry_date ? new Date(raw.expiry_date) : undefined,
      isActive: raw.is_active === 1,
      totalControls: raw.total_controls,
      implementedControls: raw.implemented_controls,
      organizationId: raw.organization_id,
      ownerId: raw.owner_id ?? undefined,
      createdBy: raw.created_by,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    });
  }

  static toDomainList(records: FrameworkDBRecord[]): ComplianceFramework[] {
    return records.map(record => this.toDomain(record));
  }

  static toPersistence(framework: ComplianceFramework): Omit<FrameworkDBRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: framework.name,
      type: framework.type.value,
      version: framework.version,
      description: framework.description,
      scope: framework.scope ?? null,
      target_completion_date: framework.targetCompletionDate?.toISOString() ?? null,
      certification_date: framework.certificationDate?.toISOString() ?? null,
      expiry_date: framework.expiryDate?.toISOString() ?? null,
      is_active: framework.isActive ? 1 : 0,
      total_controls: framework.totalControls,
      implemented_controls: framework.implementedControls,
      organization_id: framework.organizationId,
      owner_id: framework.ownerId ?? null,
      created_by: framework.createdBy
    };
  }
}
