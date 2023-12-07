import { PaginatedResponse } from '@libs/database/postgres/common';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { IReportValidator, REPORT_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
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
    @Inject(REPORT_VALIDATOR_TOKEN)
    private readonly _reportValidator: IReportValidator
  ) {}

  public async execute(
    query: GetListReportsQuery
  ): Promise<PaginatedResponse<ReportForManagerDto>> {
    const { authUser, groupId, limit, before, after } = query.payload;

    await this._reportValidator.checkPermissionManageReport(authUser.id, groupId);

    const { rows, meta } = await this._reportRepo.getPagination({
      groupId,
      status: REPORT_STATUS.CREATED,
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
