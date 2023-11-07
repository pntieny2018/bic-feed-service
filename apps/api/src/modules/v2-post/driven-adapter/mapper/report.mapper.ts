import { ReportContentAttribute, ReportContentModel } from '@libs/database/postgres/model';
import { Injectable } from '@nestjs/common';

import { ReportEntity } from '../../domain/model/report';

@Injectable()
export class ReportMapper {
  public toDomain(model: ReportContentModel): ReportEntity {
    if (model === null) {
      return null;
    }
    return new ReportEntity(model.toJSON());
  }

  public toPersistence(entity: ReportEntity): ReportContentAttribute {
    return {
      id: entity.get('id'),
      targetId: entity.get('targetId'),
      targetType: entity.get('targetType'),
      authorId: entity.get('authorId'),
      status: entity.get('status'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      details: entity.getDetails(),
    };
  }
}
