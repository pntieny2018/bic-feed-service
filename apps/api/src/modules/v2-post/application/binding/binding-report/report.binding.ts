import { Inject } from '@nestjs/common';

import { ReportEntity } from '../../../domain/model/report';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';
import { ReportDto } from '../../dto';

import { IReportBinding } from './report.interface';

export class ReportBinding implements IReportBinding {
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public binding(entity: ReportEntity): ReportDto {
    return new ReportDto({
      id: entity.get('id'),
      targetId: entity.get('targetId'),
      targetType: entity.get('targetType'),
      authorId: entity.get('authorId'),
      status: entity.get('status'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      details: entity.getDetails(),
    });
  }
}
