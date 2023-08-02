import { concat } from 'lodash';
import { Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Includeable, Op, Sequelize, col } from 'sequelize';
import { CommentModel } from '../../../../database/models/comment.model';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { ReportContentDetailModel } from '../../../../database/models/report-content-detail.model';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../domain/factory/interface';
import {
  GetArroundCommentProps,
  GetPaginationCommentProps,
  ICommentQuery,
} from '../../domain/query-interface';
import { CommentEntity } from '../../domain/model/comment';
import { TargetType } from '../../../report-content/contstants';
import { CursorPaginator, createCursor } from '../../../../common/dto/cusor-pagination';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { ReactionEntity } from '../../domain/model/reaction';
import { REACTION_TARGET } from '../../data-type/reaction-target.enum';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { UserDto } from '../../../v2-user/application';

export class CommentQuery implements ICommentQuery {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _factory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize
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
                  created_by: authUser.id,
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
            }' AND rp.created_by = ${this._sequelizeConnection.escape(authUser.id)})`),
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

  public async getArroundComment(
    comment: CommentEntity,
    props: GetArroundCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { limit } = props;
    const limitExcludeTarget = limit - 1;
    const fisrt = Math.ceil(limitExcludeTarget / 2);
    const last = limitExcludeTarget - fisrt;
    const cursor = createCursor({ createdAt: comment.get('createdAt') });

    const soonerCommentsQuery = this.getPagination({
      ...props,
      limit: fisrt,
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

  public async findComment(id: string, authUser: UserDto): Promise<CommentEntity> {
    const findOptions: FindOptions = {
      include: [
        authUser
          ? {
              model: CommentReactionModel,
              on: {
                [Op.and]: {
                  comment_id: { [Op.eq]: col(`CommentModel.id`) },
                  created_by: authUser.id,
                },
              },
            }
          : {},
      ].filter((item) => Object.keys(item).length !== 0) as Includeable[],
      where: {
        id,
        isHidden: false,
      },
    };
    const data = await this._commentModel.findOne(findOptions);
    const row = data.toJSON();
    return this._factory.reconstitute({
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
    });
  }
}
