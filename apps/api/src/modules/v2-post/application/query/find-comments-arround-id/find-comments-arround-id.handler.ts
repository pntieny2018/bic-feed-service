import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../binding/binding-comment/comment.interface';
import { FindCommentsArroundIdDto } from '../../dto';

import { FindCommentsArroundIdQuery } from './find-comments-arround-id.query';

@QueryHandler(FindCommentsArroundIdQuery)
export class FindCommentsArroundIdHandler
  implements IQueryHandler<FindCommentsArroundIdQuery, FindCommentsArroundIdDto>
{
  public constructor(
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindCommentsArroundIdQuery): Promise<FindCommentsArroundIdDto> {
    const { authUser, commentId, limit, targetChildLimit } = query.payload;

    const comment = await this._commentDomainService.getVisibleComment(commentId, authUser.id);

    const post = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    this._contentValidator.checkCanReadContent(post, authUser);

    const isChild = comment.isChildComment();

    const arroundCommentPagination = await this._commentDomainService.getCommentsArroundId(
      commentId,
      {
        userId: authUser.id,
        limit,
        targetChildLimit,
        isChild,
      }
    );

    const bindingInstances = await this._commentBinding.commentsBinding(
      arroundCommentPagination.rows
    );

    return new FindCommentsArroundIdDto(bindingInstances, arroundCommentPagination.meta);
  }
}
