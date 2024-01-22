import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  COMMENT_VALIDATOR_TOKEN,
  CONTENT_VALIDATOR_TOKEN,
  ICommentValidator,
  IContentValidator,
} from '../../../../domain/validator/interface';
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../../binding';
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
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(COMMENT_VALIDATOR_TOKEN)
    private readonly _commentValidator: ICommentValidator
  ) {}

  public async execute(query: FindCommentsAroundIdQuery): Promise<FindCommentsAroundIdDto> {
    const { authUser, commentId, limit, targetChildLimit } = query.payload;

    const comment = await this._commentDomainService.getVisibleComment(commentId, authUser.id);

    await this._commentValidator.validateNotHiddenComment(comment);

    const post = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    await this._contentValidator.checkCanReadContent(post, authUser);

    const { rows, meta } = await this._commentDomainService.getCommentsAroundId(commentId, {
      userId: authUser.id,
      limit,
      targetChildLimit,
    });

    const commentsDto = await this._commentBinding.commentsBinding(rows);

    return new FindCommentsAroundIdDto(commentsDto, meta);
  }
}
