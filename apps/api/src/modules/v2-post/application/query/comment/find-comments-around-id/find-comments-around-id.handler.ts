import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../../binding/binding-comment/comment.interface';
import { FindCommentsAroundIdDto } from '../../../dto';

import { FindCommentsAroundIdQuery } from './find-comments-around-id.query';

@QueryHandler(FindCommentsAroundIdQuery)
export class FindCommentsAroundIdHandler
  implements IQueryHandler<FindCommentsAroundIdQuery, FindCommentsAroundIdDto>
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

  public async execute(query: FindCommentsAroundIdQuery): Promise<FindCommentsAroundIdDto> {
    const { authUser, commentId, limit, targetChildLimit } = query.payload;

    const comment = await this._commentDomainService.getVisibleComment(commentId, authUser.id);

    const post = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    this._contentValidator.checkCanReadContent(post, authUser);

    const aroundCommentPagination = await this._commentDomainService.getCommentsAroundId(
      commentId,
      {
        userId: authUser.id,
        limit,
        targetChildLimit,
      }
    );

    const bindingInstances = await this._commentBinding.commentsBinding(
      aroundCommentPagination.rows
    );

    return new FindCommentsAroundIdDto(bindingInstances, aroundCommentPagination.meta);
  }
}
