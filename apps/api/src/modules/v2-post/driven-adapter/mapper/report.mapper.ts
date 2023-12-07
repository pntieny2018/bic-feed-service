import { ReportAttribute, ReportModel } from '@libs/database/postgres/model';
import { Injectable } from '@nestjs/common';

import { ReportEntity } from '../../domain/model/report';

@Injectable()
export class ReportMapper {
  public toDomain(model: ReportModel): ReportEntity {
    if (model === null) {
      return null;
    }
    return new ReportEntity({
      id: model.id,
      groupId: model.groupId,
      reportTo: model.reportTo,
      targetId: model.targetId,
      targetType: model.targetType,
      targetActorId: model.targetActorId,
      reasonsCount: model.reasonsCount,
      status: model.status,
      processedBy: model.processedBy,
      processedAt: model.processedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  public toPersistence(entity: ReportEntity): ReportAttribute {
    return {
      id: entity.get('id'),
      groupId: entity.get('groupId'),
      reportTo: entity.get('reportTo'),
      targetId: entity.get('targetId'),
      targetType: entity.get('targetType'),
      targetActorId: entity.get('targetActorId'),
      reasonsCount: entity.get('reasonsCount'),
      status: entity.get('status'),
      processedBy: entity.get('processedBy'),
      processedAt: entity.get('processedAt'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    };
  }
}
