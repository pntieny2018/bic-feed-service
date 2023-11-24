import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../../domain/domain-service/interface';
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../../binding';
import { CommentExtendedDto } from '../../../dto';

import { GetMyReportedCommentQuery } from './get-my-reported-comment.query';

@QueryHandler(GetMyReportedCommentQuery)
export class GetMyReportedCommentHandler
  implements IQueryHandler<GetMyReportedCommentQuery, CommentExtendedDto>
{
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding
  ) {}

  public async execute(query: GetMyReportedCommentQuery): Promise<CommentExtendedDto> {
    const { commentId, authUser } = query.payload;

    const comment = await this._commentDomainService.getMyCommentById(commentId, authUser.id);

    const commentsDto = await this._commentBinding.commentsBinding([comment], {
      authUser,
      includeReportReasonsCount: true,
    });

    return commentsDto[0];
  }
}
