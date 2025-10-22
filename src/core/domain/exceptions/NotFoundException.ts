/**
 * NotFoundException - Exception when an entity is not found
 * Typically thrown by repositories when querying for non-existent entities
 */

import { DomainException } from './DomainException';

export class NotFoundException extends DomainException {
  public readonly entityName: string;
  public readonly entityId: string | number;

  constructor(entityName: string, entityId: string | number) {
    super(
      `${entityName} with ID '${entityId}' was not found`,
      'NOT_FOUND',
      { entityName, entityId }
    );
    this.name = 'NotFoundException';
    this.entityName = entityName;
    this.entityId = entityId;
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      entityName: this.entityName,
      entityId: this.entityId
    };
  }
}
