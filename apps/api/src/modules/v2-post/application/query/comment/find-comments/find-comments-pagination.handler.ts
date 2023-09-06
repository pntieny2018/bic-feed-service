import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
} from '../../../../domain/repositoty-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../../binding/binding-comment/comment.interface';
import { FindCommentsPaginationDto } from '../../../dto';

import { FindCommentsPaginationQuery } from './find-comments-pagination.query';

@QueryHandler(FindCommentsPaginationQuery)
export class FindCommentsPaginationHandler
  implements IQueryHandler<FindCommentsPaginationQuery, FindCommentsPaginationDto>
{
  public constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindCommentsPaginationQuery): Promise<FindCommentsPaginationDto> {
    const { postId, authUser } = query.payload;

    const post = await this._contentDomainService.getVisibleContent(postId, authUser.id);

    this._contentValidator.checkCanReadContent(post, authUser);

    const { rows, meta } = await this._commentRepository.getPagination({
      ...query.payload,
      authUser: authUser.id,
    });

    if (!rows || rows.length === 0) {
      return new FindCommentsPaginationDto([], meta);
    }

    const instances = await this._commentBinding.commentsBinding(rows, authUser);

    return new FindCommentsPaginationDto(instances, meta);
  }
}
