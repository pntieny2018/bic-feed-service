import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  IReportContentValidator,
  REPORT_CONTENT_VALIDATOR_TOKEN,
} from '../../../../domain/validator/interface';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../../../binding';
import { GetListReportsPaginationDto } from '../../../dto';

import { GetListReportsQuery } from './get-list-reports.query';

@QueryHandler(GetListReportsQuery)
export class GetListReportsHandler implements IQueryHandler<GetListReportsQuery> {
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomainService: IReportDomainService,
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding,
    @Inject(REPORT_CONTENT_VALIDATOR_TOKEN)
    private readonly _reportContentValidator: IReportContentValidator
  ) {}

  public async execute(query: GetListReportsQuery): Promise<GetListReportsPaginationDto> {
    const { authUser, groupId, limit, before, after } = query.payload;

    await this._reportContentValidator.validateAdminRootGroup({
      rootGroupId: groupId,
      userId: authUser.id,
    });

    const { rows, meta } = await this._reportDomainService.getListReports({
      rootGroupId: groupId,
      limit,
      before,
      after,
    });

    const reports = await this._reportBinding.bindingList(rows);

    return {
      list: reports,
      meta,
    };
  }
}
