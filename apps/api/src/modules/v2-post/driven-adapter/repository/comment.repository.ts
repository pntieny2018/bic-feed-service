import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { concat } from 'lodash';
import { FindOptions, Op, Sequelize, WhereOptions, col, Includeable } from 'sequelize';

import { createCursor, CursorPaginator } from '../../../../common/dto';
import { CursorPaginationResult } from '../../../../common/types';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { CommentModel, IComment } from '../../../../database/models/comment.model';
import { ReportContentDetailModel } from '../../../../database/models/report-content-detail.model';
import { TargetType } from '../../../report-content/contstants';
import { REACTION_TARGET } from '../../data-type/reaction.enum';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../domain/factory/interface';
import { CommentEntity } from '../../domain/model/comment';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOneProps,
  GetAroundCommentProps,
  GetPaginationCommentProps,
  ICommentRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class CommentRepository implements ICommentRepository {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _commentFactory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _factory: ICommentFactory
  ) {}

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { authUser, limit, order, postId, parentId, before, after } = input;
    const findOptions: FindOptions = {
      include: [
        authUser
          ? {
              model: CommentReactionModel,
              on: {
                [Op.and]: {
                  comment_id: { [Op.eq]: col(`CommentModel.id`) },
                  created_by: authUser,
                },
              },
            }
          : {},
      ].filter((item) => Object.keys(item).length !== 0) as Includeable[],
      where: {
        postId: postId,
        parentId: parentId,
        isHidden: false,
        ...(authUser && {
          [Op.and]: [
            Sequelize.literal(`NOT EXISTS (SELECT target_id FROM ${ReportContentDetailModel.getTableName()} as rp
            WHERE rp.target_id = "CommentModel"."id" AND rp.target_type = '${
              TargetType.COMMENT
            }' AND rp.created_by = ${this._sequelizeConnection.escape(authUser)})`),
          ],
        }),
      },
    };

    const paginator = new CursorPaginator(
      this._commentModel,
      ['createdAt'],
      { before, after, limit },
      order
    );

    const { rows, meta } = await paginator.paginate(findOptions);

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

  public async getAroundComment(
    comment: CommentEntity,
    props: GetAroundCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { limit } = props;
    const limitExcludeTarget = limit - 1;
    const first = Math.ceil(limitExcludeTarget / 2);
    const last = limitExcludeTarget - first;
    const cursor = createCursor({ createdAt: comment.get('createdAt') });

    const soonerCommentsQuery = this.getPagination({
      ...props,
      limit: first,
      after: cursor,
      postId: comment.get('postId'),
      parentId: comment.get('parentId'),
    });

    const laterCommentsQuery = this.getPagination({
      ...props,
      limit: last,
      before: cursor,
      postId: comment.get('postId'),
      parentId: comment.get('parentId'),
    });

    const [soonerComment, laterComments] = await Promise.all([
      soonerCommentsQuery,
      laterCommentsQuery,
    ]);

    const rows = concat(laterComments.rows, comment, soonerComment.rows);

    const meta = {
      startCursor: laterComments.rows.length > 0 ? laterComments.meta.startCursor : cursor,
      endCursor: soonerComment.rows.length > 0 ? soonerComment.meta.endCursor : cursor,
      hasNextPage: soonerComment.meta.hasNextPage,
      hasPreviousPage: laterComments.meta.hasPreviousPage,
    };

    return { rows, meta };
  }

  public async createComment(data: CommentEntity): Promise<CommentEntity> {
    const comment = await this._commentModel.create({
      id: data.get('id'),
      content: data.get('content'),
      postId: data.get('postId'),
      parentId: data.get('parentId'),
      isHidden: data.get('isHidden'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      giphyId: data.get('giphyId'),
      mediaJson: {
        files: data.get('media').files.map((file) => file.toObject()),
        images: data.get('media').images.map((image) => image.toObject()),
        videos: data.get('media').videos.map((video) => video.toObject()),
      },
      mentions: data.get('mentions'),
    });
    return this._modelToEntity(comment);
  }

  private _modelToEntity(comment: CommentModel): CommentEntity {
    if (comment === null) {
      return null;
    }
    return this._commentFactory.reconstitute({
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      edited: comment.edited,
      isHidden: comment.isHidden,
      giphyId: comment.giphyId,
      totalReply: comment.totalReply,
      createdBy: comment.createdBy,
      updatedBy: comment.updatedBy,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      content: comment.content,
      mentions: comment.mentions,
      media: {
        images: comment.mediaJson?.images.map((image) => new ImageEntity(image)),
        files: comment.mediaJson?.files.map((file) => new FileEntity(file)),
        videos: comment.mediaJson?.videos.map((video) => new VideoEntity(video)),
      },
      ownerReactions: (comment?.ownerReactions || []).map(
        (reaction) =>
          new ReactionEntity({
            id: reaction.id,
            target: REACTION_TARGET.COMMENT,
            targetId: comment.id,
            reactionName: reaction.reactionName,
            createdBy: reaction.createdBy,
            createdAt: reaction.createdAt,
          })
      ),
    });
  }

  public async findOne(
    where: WhereOptions<IComment>,
    options?: FindOneProps
  ): Promise<CommentEntity> {
    const findOptions: FindOptions = { where };
    if (options?.excludeReportedByUserId) {
      findOptions.where = {
        ...where,
        [Op.and]: [
          Sequelize.literal(
            `NOT EXISTS ( 
              SELECT target_id FROM ${ReportContentDetailModel.getTableName()} as rp
                WHERE rp.target_id = "CommentModel".id AND rp.target_type = '${
                  TargetType.COMMENT
                }' AND rp.created_by = ${this._sequelizeConnection.escape(
              options.excludeReportedByUserId
            )}
            )`
          ),
        ],
      };
    }
    if (options?.includeOwnerReactions) {
      findOptions.include = [
        {
          model: CommentReactionModel,
          on: {
            [Op.and]: {
              comment_id: { [Op.eq]: col(`CommentModel.id`) },
              created_by: options?.includeOwnerReactions,
            },
          },
        },
      ];
    }

    const comment = await this._commentModel.findOne(findOptions);

    return this._modelToEntity(comment);
  }

  public async update(commentEntity: CommentEntity): Promise<void> {
    try {
      const attributes = this._getUpdatedAttributes(commentEntity);
      await this._commentModel.update(attributes, {
        where: {
          id: commentEntity.get('id'),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public async destroyComment(id: string): Promise<void> {
    const comment = await this._commentModel.findOne({ where: { id } });
    const childComments = await this._commentModel.findAll({
      attributes: ['id'],
      where: {
        parentId: id,
      },
    });
    const childCommentIds = childComments.map((child) => child.id);
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._commentReactionModel.destroy({
        where: {
          commentId: [id, ...childCommentIds],
        },
        transaction: transaction,
      });
      await this._commentModel.destroy({
        where: {
          parentId: id,
        },
        individualHooks: true,
        transaction: transaction,
      });
      await comment.destroy({ transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private _getUpdatedAttributes(commentEntity: CommentEntity): Partial<IComment> {
    return {
      content: commentEntity.get('content'),
      updatedBy: commentEntity.get('updatedBy'),
      edited: commentEntity.get('edited'),
      giphyId: commentEntity.get('giphyId'),
      mediaJson: {
        files: commentEntity.get('media').files.map((file) => file.toObject()),
        images: commentEntity.get('media').images.map((image) => image.toObject()),
        videos: commentEntity.get('media').videos.map((video) => video.toObject()),
      },
      mentions: commentEntity.get('mentions'),
    };
  }
}
