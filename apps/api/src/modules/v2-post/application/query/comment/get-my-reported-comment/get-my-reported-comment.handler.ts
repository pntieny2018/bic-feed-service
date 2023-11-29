import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
  IReportBinding,
  REPORT_BINDING_TOKEN,
} from '../../../binding';
import { CommentExtendedDto } from '../../../dto';

import { GetMyReportedCommentQuery } from './get-my-reported-comment.query';

@QueryHandler(GetMyReportedCommentQuery)
export class GetMyReportedCommentHandler
  implements IQueryHandler<GetMyReportedCommentQuery, CommentExtendedDto>
{
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomain: ICommentDomainService,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding
  ) {}

  public async execute(query: GetMyReportedCommentQuery): Promise<CommentExtendedDto> {
    const { commentId, authUser } = query.payload;

    const commentEntity = await this._commentDomain.getMyCommentById(commentId, authUser.id);
    const comments = await this._commentBinding.commentsBinding([commentEntity], { authUser });

    const comment = comments[0];

    const reportReasonsCount = await this._reportDomain.countAllReportReasons(comment.id);

    return {
      ...comment,
      reportReasonsCount: this._reportBinding.bindingReportReasonsCount(reportReasonsCount),
    };
  }
}
