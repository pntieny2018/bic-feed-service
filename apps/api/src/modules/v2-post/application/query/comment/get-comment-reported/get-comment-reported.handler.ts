import { CONTENT_TARGET } from '@beincom/constants';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../../binding';
import { CommentBaseDto } from '../../../dto';

import { GetCommentReportedQuery } from './get-comment-reported.query';

@QueryHandler(GetCommentReportedQuery)
export class GetCommentReportedHandler
  implements IQueryHandler<GetCommentReportedQuery, CommentBaseDto>
{
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomainService: IReportDomainService,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding
  ) {}

  public async execute(query: GetCommentReportedQuery): Promise<CommentBaseDto> {
    const { commentId, authUser } = query.payload;

    const comment = await this._commentDomainService.getReportedComment(commentId, authUser.id);
    const report = await this._reportRepo.findOne({
      where: {
        targetId: comment.get('id'),
        targetType: CONTENT_TARGET.COMMENT,
        status: REPORT_STATUS.HIDDEN,
      },
      include: {
        details: true,
      },
    });

    const reportReasonsCount = await this._reportDomainService.countReportReasons(
      report.getDetails()
    );

    return this._commentBinding.commentBinding(comment, {
      actor: authUser,
      reportReasonsCount,
    });
  }
}
