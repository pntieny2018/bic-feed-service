import { CONTENT_TARGET } from '@beincom/constants';
import { createCursor, CursorPaginator } from '@libs/database/postgres/common';
import { IUser } from '@libs/service/user/src/interfaces';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CursorPaginationResult } from 'libs/database/src/postgres/common/type';
import { concat } from 'lodash';
import { FindOptions, Includeable, Op, Sequelize, col } from 'sequelize';

import { CommentReactionModel } from '../model/comment-reaction.model';
import { CommentAttributes, CommentModel } from '../model/comment.model';
import { ReportContentDetailModel } from '../model/report-content-detail.model';

import { GetAroundCommentProps, GetPaginationCommentProps, ILibCommentQuery } from './interface';

export class LibCommentQuery implements ILibCommentQuery {
  public constructor(
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize
  ) {}

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentModel>> {
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
              CONTENT_TARGET.COMMENT
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
      rows,
      meta,
    };
  }

  public async getAroundComment(
    comment: CommentAttributes,
    props: GetAroundCommentProps
  ): Promise<CursorPaginationResult<CommentModel>> {
    const { limit } = props;
    const limitExcludeTarget = limit - 1;
    const first = Math.ceil(limitExcludeTarget / 2);
    const last = limitExcludeTarget - first;
    const cursor = createCursor({ createdAt: comment.createdAt });

    const soonerCommentsQuery = this.getPagination({
      ...props,
      limit: first,
      after: cursor,
      postId: comment.postId,
      parentId: comment.parentId,
    });

    const laterCommentsQuery = this.getPagination({
      ...props,
      limit: last,
      before: cursor,
      postId: comment.postId,
      parentId: comment.parentId,
    });

    const currentCommentQuery = this._commentModel.findOne({
      where: {
        id: comment.id,
      },
    });

    const [soonerComment, laterComments, currentComment] = await Promise.all([
      soonerCommentsQuery,
      laterCommentsQuery,
      currentCommentQuery,
    ]);

    const rows = concat(laterComments.rows, currentComment, soonerComment.rows);

    const meta = {
      startCursor: laterComments.rows.length > 0 ? laterComments.meta.startCursor : cursor,
      endCursor: soonerComment.rows.length > 0 ? soonerComment.meta.endCursor : cursor,
      hasNextPage: soonerComment.meta.hasNextPage,
      hasPreviousPage: laterComments.meta.hasPreviousPage,
    };

    return { rows, meta };
  }

  public async findComment(id: string, authUser: IUser): Promise<CommentModel> {
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
    return this._commentModel.findOne(findOptions);
  }
}
