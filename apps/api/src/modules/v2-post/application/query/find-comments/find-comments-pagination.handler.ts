import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FindCommentsPaginationQuery } from './find-comments-pagination.query';
import { COMMENT_QUERY_TOKEN, ICommentQuery } from '../../../domain/query-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  FindContentProps,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../binding/binding-comment/comment.interface';
import { ContentNotFoundException } from '../../../domain/exception';
import { FindCommentsPaginationDto } from '../../dto';

@QueryHandler(FindCommentsPaginationQuery)
export class FindCommentsPaginationHandler
  implements IQueryHandler<FindCommentsPaginationQuery, FindCommentsPaginationDto>
{
  public constructor(
    @Inject(COMMENT_QUERY_TOKEN)
    private readonly _commentQuery: ICommentQuery,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(query: FindCommentsPaginationQuery): Promise<FindCommentsPaginationDto> {
    const { postId, authUser } = query.payload;
    const findOneOptions: FindContentProps = {
      where: {
        id: postId,
        groupArchived: false,
      },
    };

    if (authUser) findOneOptions.where.excludeReportedByUserId = authUser.id;

    const postEntity = await this._contentRepository.findOne(findOneOptions);

    if (
      !postEntity ||
      (!postEntity.isOpen() && !authUser) ||
      (postEntity.isHidden() && !postEntity.isOwner(authUser?.id))
    )
      throw new ContentNotFoundException();

    const { rows, meta } = await this._commentQuery.getPagination(query.payload);

    if (!rows || rows.length === 0) return new FindCommentsPaginationDto([], meta);

    const instances = await this._commentBinding.commentBinding(rows);

    return new FindCommentsPaginationDto(instances, meta);
  }
}
