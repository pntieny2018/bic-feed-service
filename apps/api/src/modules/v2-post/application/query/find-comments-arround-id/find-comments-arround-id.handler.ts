import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FindCommentsArroundIdQuery } from './find-comments-arround-id.query';
import { COMMENT_QUERY_TOKEN, ICommentQuery } from '../../../domain/query-interface';
import { FindCommentsArroundIdDto } from './find-comments-arround-id.dto';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  FindOnePostOptions,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { CommentNotFoundException } from '../../../domain/exception';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import { OrderEnum } from 'apps/api/src/common/dto';
import { NIL } from 'uuid';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../binding/binding-comment/comment.interface';

@QueryHandler(FindCommentsArroundIdQuery)
export class FindCommentsArroundIdHandler
  implements IQueryHandler<FindCommentsArroundIdQuery, FindCommentsArroundIdDto>
{
  public constructor(
    @Inject(COMMENT_QUERY_TOKEN)
    private readonly _commentQuery: ICommentQuery,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository
  ) {}

  public async execute(query: FindCommentsArroundIdQuery): Promise<FindCommentsArroundIdDto> {
    const { authUser, commentId, limit, targetChildLimit } = query.payload;

    const comment = await this._commentRepository.findOne(
      { id: commentId },
      { excludeReportedByUserId: authUser?.id, includeOwnerReactions: authUser?.id }
    );

    if (!comment) throw new CommentNotFoundException();

    const findOneOptions: FindOnePostOptions = {
      where: {
        id: comment.get('postId'),
        groupArchived: false,
        isHidden: false,
      },
    };

    if (authUser) findOneOptions.where.excludeReportedByUserId = authUser.id;

    const postEntity = await this._contentRepository.findOne(findOneOptions);

    if (!postEntity || (!postEntity.isOpen() && !authUser)) return new FindCommentsArroundIdDto([]);

    this._contentValidator.checkCanReadContent(postEntity, authUser);

    const isParentComment = comment.isParentComment();

    const target = await this._commentQuery.getArroundComment(comment, {
      limit: isParentComment ? limit : targetChildLimit,
      order: isParentComment ? OrderEnum.DESC : OrderEnum.ASC,
      authUser,
    });
    const targetInstances = await this._commentBinding.commentBinding(target.rows);
    const targetResult = new FindCommentsArroundIdDto(targetInstances, target.meta);

    if (isParentComment) return targetResult;

    const parentComment = await this._commentRepository.findOne(
      { id: comment.get('parentId'), parentId: NIL },
      { excludeReportedByUserId: authUser?.id, includeOwnerReactions: authUser?.id }
    );
    if (!parentComment) throw new CommentNotFoundException();

    const parentsTarget = await this._commentQuery.getArroundComment(parentComment, {
      limit,
      order: OrderEnum.DESC,
      authUser,
    });
    const parentInstances = await this._commentBinding.commentBinding(parentsTarget.rows);

    for (const instance of parentInstances) {
      if (instance.id === comment.get('parentId')) {
        instance.child = targetResult;
        break;
      }
    }

    return new FindCommentsArroundIdDto(parentInstances, parentsTarget.meta);
  }
}
