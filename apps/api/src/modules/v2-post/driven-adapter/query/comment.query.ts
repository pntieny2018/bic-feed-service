import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Includeable, Op, Sequelize, WhereAttributeHash, col } from 'sequelize';
import { CommentModel, IComment } from '../../../../database/models/comment.model';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { ReportContentDetailModel } from '../../../../database/models/report-content-detail.model';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../domain/factory/interface';
import { GetPaginationCommentProps, ICommentQuery } from '../../domain/query-interface';
import { CommentEntity } from '../../domain/model/comment';
import { TargetType } from '../../../report-content/contstants';
import { paginate } from '../../../../common/dto/cusor-pagination';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { ReactionEntity } from '../../domain/model/reaction';
import { REACTION_TARGET } from '../../data-type/reaction-target.enum';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

export class CommentQuery implements ICommentQuery {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _factory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel
  ) {}

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { authUserId, limit, order, postId, parentId, previousCursor, nextCursor } = input;
    const restQueryOptions = this._getRestCondition(input);
    const findOptions: FindOptions = {
      include: [
        authUserId
          ? {
              model: CommentReactionModel,
              on: {
                [Op.and]: {
                  comment_id: { [Op.eq]: col(`CommentModel.id`) },
                  created_by: authUserId,
                },
              },
            }
          : {},
      ].filter((item) => Object.keys(item).length !== 0) as Includeable[],
      where: {
        postId: postId,
        parentId: parentId,
        isHidden: false,
        [Op.and]: [
          Sequelize.literal(`NOT EXISTS (SELECT target_id FROM ${ReportContentDetailModel.getTableName()} as rp
            WHERE rp.target_id = "CommentModel"."id" AND rp.target_type = '${
              TargetType.COMMENT
            }')`),
        ],
        ...restQueryOptions,
      },
      order: [['createdAt', order]],
    };

    const { rows, meta } = await paginate(
      this._commentModel,
      findOptions,
      { previousCursor, nextCursor, limit },
      order,
      'createdAt'
    );

    return {
      rows: rows.map((row) =>
        this._factory.reconstitute({
          id: row.id,
          postId: row.postId,
          parentId: row.parentId,
          edited: row.edited,
          isHidden: row.isHidden,
          giphyId: row.giphyId,
          totalReply: row.totalReply,
          createdBy: row.createdBy,
          updatedBy: row.updatedBy,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          content: row.content,
          mentions: row.mentions,
          media: {
            images: (row.mediaJson?.images || []).map((image) => new ImageEntity(image)),
            files: (row.mediaJson?.files || []).map((file) => new FileEntity(file)),
            videos: (row.mediaJson?.videos || []).map((video) => new VideoEntity(video)),
          },
          ownerReactions: (row?.ownerReactions || []).map(
            (reaction) =>
              new ReactionEntity({
                id: reaction.id,
                target: REACTION_TARGET.COMMENT,
                targetId: row.id,
                reactionName: reaction.reactionName,
                createdBy: reaction.createdBy,
                createdAt: reaction.createdAt,
              })
          ),
        })
      ),
      meta,
    };
  }

  private _getRestCondition(
    getCommentsDto: GetPaginationCommentProps
  ): WhereAttributeHash<IComment> {
    const { createdAtGT, createdAtGTE, createdAtLT, createdAtLTE } = getCommentsDto;
    const restQueryOptions: WhereAttributeHash<IComment> = {};

    if (createdAtGT) {
      restQueryOptions['createdAt'] = { [Op.gt]: createdAtGT };
    }
    if (createdAtGTE) {
      restQueryOptions['createdAt'] = { [Op.gte]: createdAtGTE };
    }
    if (createdAtLT) {
      restQueryOptions['createdAt'] = { [Op.lt]: createdAtLT };
    }
    if (createdAtLTE) {
      restQueryOptions['createdAt'] = { [Op.lte]: createdAtLTE };
    }

    return restQueryOptions;
  }
}
