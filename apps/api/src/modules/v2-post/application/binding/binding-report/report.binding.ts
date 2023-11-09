import { ReportEntity } from '../../../domain/model/report';
import { ReportDto } from '../../dto';

import { IReportBinding } from './report.interface';

export class ReportBinding implements IReportBinding {
  public binding(entity: ReportEntity): ReportDto {
    return new ReportDto({
      id: entity.get('id'),
      targetId: entity.get('targetId'),
      targetType: entity.get('targetType'),
      targetActorId: entity.get('targetActorId'),
      status: entity.get('status'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      details: entity.getDetails(),
    });
  }
}
