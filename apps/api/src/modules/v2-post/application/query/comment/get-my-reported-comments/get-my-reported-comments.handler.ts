import { CONTENT_TARGET } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { PaginatedResponse } from '@libs/database/postgres/common';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

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
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
  IReportBinding,
  REPORT_BINDING_TOKEN,
} from '../../../binding';
import { ReportTargetDto } from '../../../dto';

import { GetMyReportedCommentsQuery } from './get-my-reported-comments.query';

@QueryHandler(GetMyReportedCommentsQuery)
export class GetMyReportedCommentsHandler implements IQueryHandler<GetMyReportedCommentsQuery> {
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding
  ) {}

  public async execute(
    query: GetMyReportedCommentsQuery
  ): Promise<PaginatedResponse<ReportTargetDto>> {
    const { authUser, limit, order, before, after } = query.payload;

    const { rows: reportEntities, meta } = await this._reportRepo.getPagination({
      targetType: [CONTENT_TARGET.COMMENT],
      targetActorId: authUser.id,
      status: REPORT_STATUS.HIDDEN,
      limit,
      order,
      before,
      after,
    });

    const commentIds = reportEntities.map((row) => row.get('targetId'));
    const commentEntities = await this._commentRepo.findAll({ id: commentIds });

    const comments = await this._commentBinding.commentsBinding(commentEntities, {
      authUser,
    });

    const commentMap = ArrayHelper.convertArrayToObject(comments, 'id');
    const reportReasonsCountMap = await this._reportDomain.getReportReasonsMapByTargetIds(
      commentIds
    );

    const reports: ReportTargetDto[] = reportEntities.map((report) => ({
      target: commentMap[report.get('targetId')],
      reasonsCount: this._reportBinding.bindingReportReasonsCount(
        reportReasonsCountMap[report.get('targetId')]
      ),
    }));

    return {
      list: reports,
      meta,
    };
  }
}
