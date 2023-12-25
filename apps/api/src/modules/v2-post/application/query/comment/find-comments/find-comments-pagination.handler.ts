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
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../../binding';
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
    const { contentId, authUser } = query.payload;

    const content = await this._contentDomainService.getVisibleContent(contentId, authUser.id);

    await this._contentValidator.checkCanReadContent(content, authUser);

    const { rows, meta } = await this._commentRepository.getPagination({
      ...query.payload,
      authUserId: authUser.id,
    });

    if (!rows || rows.length === 0) {
      return new FindCommentsPaginationDto([], meta);
    }

    const commentsDto = await this._commentBinding.commentsBinding(rows);

    return new FindCommentsPaginationDto(commentsDto, meta);
  }
}
