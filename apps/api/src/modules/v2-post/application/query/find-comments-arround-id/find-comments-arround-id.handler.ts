import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FindCommentsArroundIdQuery } from './find-comments-arround-id.query';
import { COMMENT_QUERY_TOKEN, ICommentQuery } from '../../../domain/query-interface';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { CommentNotFoundException, ContentNotFoundException } from '../../../domain/exception';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import { OrderEnum } from 'apps/api/src/common/dto';
import { NIL } from 'uuid';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../binding/binding-comment/comment.interface';
import { FindCommentsArroundIdDto } from '../../dto';

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

    const postEntity = await this._contentRepository.findOne({
      where: {
        id: comment.get('postId'),
        groupArchived: false,
        isHidden: false,
        excludeReportedByUserId: authUser?.id,
      },
      include: {
        shouldIncludeGroup: true,
      },
    });
    if (!postEntity || (!postEntity.isOpen() && !authUser)) throw new ContentNotFoundException();
    this._contentValidator.checkCanReadContent(postEntity, authUser);

    const isChild = comment.isChildComment();

    const arroundTargetPagination = await this._commentQuery.getArroundComment(comment, {
      limit: isChild ? targetChildLimit : limit,
      order: OrderEnum.DESC,
      authUser,
    });
    const arroundTargetInstances = await this._commentBinding.commentsBinding(
      arroundTargetPagination.rows
    );
    const arroundTargetResult = new FindCommentsArroundIdDto(
      arroundTargetInstances,
      arroundTargetPagination.meta
    );

    if (!isChild) {
      const childsPagination = await this._commentQuery.getPagination({
        authUser,
        postId: comment.get('postId'),
        parentId: comment.get('id'),
        limit: targetChildLimit,
        order: OrderEnum.DESC,
      });

      if (childsPagination && childsPagination.rows?.length) {
        const childInstances = await this._commentBinding.commentsBinding(childsPagination.rows);
        const childsResult = new FindCommentsArroundIdDto(childInstances, childsPagination.meta);
        for (const instance of arroundTargetResult.list) {
          if (instance.id === comment.get('id')) {
            instance.child = childsResult;
            break;
          }
        }
      }

      return arroundTargetResult;
    }

    const parent = await this._commentRepository.findOne(
      { id: comment.get('parentId'), parentId: NIL },
      { excludeReportedByUserId: authUser?.id, includeOwnerReactions: authUser?.id }
    );
    if (!parent) throw new CommentNotFoundException();

    const arroundParentPagination = await this._commentQuery.getArroundComment(parent, {
      limit,
      order: OrderEnum.DESC,
      authUser,
    });
    const arroundParentInstances = await this._commentBinding.commentsBinding(
      arroundParentPagination.rows
    );
    for (const instance of arroundParentInstances) {
      if (instance.id === parent.get('id')) {
        instance.child = arroundTargetResult;
        break;
      }
    }

    return new FindCommentsArroundIdDto(arroundParentInstances, arroundParentPagination.meta);
  }
}
