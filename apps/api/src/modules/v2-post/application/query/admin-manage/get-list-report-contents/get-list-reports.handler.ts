import { PaginatedResponse } from '@libs/database/postgres/common';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { IManageValidator, MANAGE_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../../../binding';
import { ReportForManagerDto } from '../../../dto';

import { GetListReportsQuery } from './get-list-reports.query';

@QueryHandler(GetListReportsQuery)
export class GetListReportsHandler implements IQueryHandler<GetListReportsQuery> {
  public constructor(
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding,
    @Inject(MANAGE_VALIDATOR_TOKEN)
    private readonly _manageValidator: IManageValidator
  ) {}

  public async execute(
    query: GetListReportsQuery
  ): Promise<PaginatedResponse<ReportForManagerDto>> {
    const { authUser, groupId, limit, before, after } = query.payload;

    await this._manageValidator.validateManageReportContent({
      rootGroupId: groupId,
      userId: authUser.id,
    });

    const { rows, meta } = await this._reportRepo.getListReports({
      groupId,
      limit,
      before,
      after,
    });

    const reports = await this._reportBinding.bindingReportsForManager(rows);

    return {
      list: reports,
      meta,
    };
  }
}
