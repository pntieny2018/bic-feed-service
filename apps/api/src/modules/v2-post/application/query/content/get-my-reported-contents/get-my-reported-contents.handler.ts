import { CONTENT_TARGET } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { PaginatedResponse } from '@libs/database/postgres/common';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { EntityHelper } from '../../../../../../common/helpers';
import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { ArticleDto, PostDto, ReportTargetDto } from '../../../dto';

import { GetMyReportedContentsQuery } from './get-my-reported-contents.query';

@QueryHandler(GetMyReportedContentsQuery)
export class GetMyReportedContentsHandler
  implements IQueryHandler<GetMyReportedContentsQuery, PaginatedResponse<ReportTargetDto>>
{
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(
    query: GetMyReportedContentsQuery
  ): Promise<PaginatedResponse<ReportTargetDto>> {
    const { authUser, limit, order, before, after } = query.payload;

    const { rows: reportEntities, meta } = await this._reportRepo.getPagination({
      where: {
        targetType: [CONTENT_TARGET.POST, CONTENT_TARGET.ARTICLE],
        targetActorId: authUser.id,
        status: REPORT_STATUS.HIDDEN,
      },
      include: { details: true },
      limit,
      order,
      before,
      after,
    });

    const contentIds = reportEntities.map((row) => row.get('targetId'));
    const contentEntities = await this._contentRepo.findAll({
      where: { ids: contentIds },
      include: { mustIncludeGroup: true },
    });
    const contents = await this._contentBinding.contentsBinding(contentEntities, authUser);

    const contentMap = ArrayHelper.convertArrayToObject(contents, 'id');
    const reportMap = EntityHelper.entityArrayToRecord(reportEntities, 'id');

    const reports: ReportTargetDto[] = [];

    for (const report of reportEntities) {
      const target = contentMap[report.get('targetId')] as PostDto | ArticleDto;
      const reasonCounts = await this._reportDomain.countReportReasons(
        reportMap[report.get('id')].getDetails()
      );

      reports.push({ target, reasonCounts });
    }

    return {
      list: reports,
      meta,
    };
  }
}
