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
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../../binding';
import { CommentExtendedDto, ReportTargetDto } from '../../../dto';

import { GetMyReportCommentsQuery } from './get-my-report-comments.query';

@QueryHandler(GetMyReportCommentsQuery)
export class GetMyReportCommentsHandler implements IQueryHandler<GetMyReportCommentsQuery> {
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding
  ) {}

  public async execute(
    query: GetMyReportCommentsQuery
  ): Promise<PaginatedResponse<ReportTargetDto>> {
    const { authUser, limit, order, before, after } = query.payload;

    const { rows: reportEntities, meta } = await this._reportRepo.getPagination({
      where: {
        targetType: [CONTENT_TARGET.COMMENT],
        targetActorId: authUser.id,
        status: REPORT_STATUS.HIDDEN,
      },
      include: { details: true },
      limit,
      order,
      before,
      after,
    });

    const commentIds = reportEntities.map((row) => row.get('targetId'));
    const commentEntities = await this._commentRepo.findAll({ id: commentIds });

    const comments = await this._commentBinding.commentsBinding(commentEntities, authUser);

    const commentMap = ArrayHelper.convertArrayToObject(comments, 'id');
    const reportMap = EntityHelper.entityArrayToRecord(reportEntities, 'id');
    const reports: ReportTargetDto[] = [];

    for (const report of reportEntities) {
      const target = commentMap[report.get('targetId')] as CommentExtendedDto;
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
