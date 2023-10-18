import { CONTENT_TARGET } from '@beincom/constants';
import {
  createCursor,
  CursorPaginationResult,
  CursorPaginator,
} from '@libs/database/postgres/common';
import {
  CommentAttributes,
  CommentModel,
  CommentReactionModel,
  ReportContentDetailModel,
} from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { concat } from 'lodash';
import { FindOptions, Op, Sequelize, WhereOptions, col, Includeable } from 'sequelize';

import {
  FindOneOptions,
  GetAroundCommentProps,
  GetAroundCommentResult,
  GetPaginationCommentProps,
} from './interface';

@Injectable()
export class LibCommentRepository extends BaseRepository<CommentModel> {
  public constructor(
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {
    super(CommentModel);
  }

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentModel>> {
    const { authUserId, limit, order, postId, parentId, before, after } = input;
    const findOptions: FindOptions = {
      include: [
        authUserId
          ? {
              model: CommentReactionModel,
              as: 'ownerReactions',
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
        ...(authUserId && {
          [Op.and]: [
            Sequelize.literal(`NOT EXISTS (SELECT target_id FROM ${ReportContentDetailModel.getTableName()} as rp
            WHERE rp.target_id = "CommentModel"."id" AND rp.target_type = '${
              CONTENT_TARGET.COMMENT
            }' AND rp.created_by = ${this._sequelizeConnection.escape(authUserId)})`),
          ],
        }),
      },
    };

    const paginator = new CursorPaginator(
      this.model,
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
    commentId: string,
    props: GetAroundCommentProps
  ): Promise<GetAroundCommentResult> {
    const { limit } = props;
    const limitExcludeTarget = limit - 1;
    const first = Math.ceil(limitExcludeTarget / 2);
    const last = limitExcludeTarget - first;

    const targetComment = await this.first({
      where: { id: commentId },
    });
    const cursor = createCursor({ createdAt: targetComment.get('createdAt') });
    const postId = targetComment.get('postId');
    const parentId = targetComment.get('parentId');

    const soonerCommentsQuery = this.getPagination({
      ...props,
      limit: first,
      after: cursor,
      postId,
      parentId,
    });

    const laterCommentsQuery = this.getPagination({
      ...props,
      limit: last,
      before: cursor,
      postId,
      parentId,
    });

    const [soonerComment, laterComments] = await Promise.all([
      soonerCommentsQuery,
      laterCommentsQuery,
    ]);

    const rows = concat(laterComments.rows, targetComment, soonerComment.rows);

    const meta = {
      startCursor: laterComments.rows.length > 0 ? laterComments.meta.startCursor : cursor,
      endCursor: soonerComment.rows.length > 0 ? soonerComment.meta.endCursor : cursor,
      hasNextPage: soonerComment.meta.hasNextPage,
      hasPreviousPage: laterComments.meta.hasPreviousPage,
    };

    const targetIndex = rows.length - (soonerComment.rows?.length || 0) - 1;

    return { rows, meta, targetIndex };
  }

  public async findOne(
    where: WhereOptions<CommentAttributes>,
    options?: FindOneOptions
  ): Promise<CommentModel> {
    const findOptions: FindOptions = { where };
    if (options?.excludeReportedByUserId) {
      findOptions.where = {
        ...where,
        [Op.and]: [
          Sequelize.literal(
            `NOT EXISTS ( 
              SELECT target_id FROM ${ReportContentDetailModel.getTableName()} as rp
                WHERE rp.target_id = "CommentModel".id AND rp.target_type = '${
                  CONTENT_TARGET.COMMENT
                }' AND rp.created_by = ${this._sequelizeConnection.escape(
              options.excludeReportedByUserId
            )}
            )`
          ),
        ],
      };
    }

    findOptions.include = this._buildIncludeOptions(options);

    return this.model.findOne(findOptions);
  }

  public async destroyComment(id: string): Promise<void> {
    const childComments = await this.model.findAll({
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

      await this.delete({
        where: {
          parentId: id,
        },
        individualHooks: true,
        transaction: transaction,
      });

      await this.delete({
        where: {
          id,
        },
        transaction: transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private _buildIncludeOptions(options: FindOneOptions): Includeable[] {
    const includeable: Includeable[] = [];

    if (options?.includeOwnerReactions) {
      includeable.push({
        model: CommentReactionModel,
        as: 'ownerReactions',
        on: {
          [Op.and]: {
            comment_id: { [Op.eq]: col(`CommentModel.id`) },
            created_by: options?.includeOwnerReactions,
          },
        },
      });
    }

    if (options?.includeChildComments) {
      includeable.push({
        model: CommentModel,
        as: 'child',
        required: false,
        where: {
          id: {
            [Op.not]: options.includeChildComments.childCommentId,
          },
          createdAt: {
            [Op.lte]: Sequelize.literal(
              `(SELECT created_at FROM ${CommentModel.getTableName()} WHERE id = '${
                options.includeChildComments.childCommentId
              }')`
            ),
          },
        },

        limit: 100,
        order: [['createdAt', 'DESC']],
      });
    }

    return includeable;
  }
}
