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
import { UserDto } from '@libs/service/user';
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
    const { authUserId, limit, order, contentId, parentId, before, after } = input;
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
        postId: contentId,
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
    const contentId = targetComment.get('postId');
    const parentId = targetComment.get('parentId');

    const soonerCommentsQuery = this.getPagination({
      ...props,
      limit: first,
      after: cursor,
      contentId,
      parentId,
    });

    const laterCommentsQuery = this.getPagination({
      ...props,
      limit: last,
      before: cursor,
      contentId,
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

  public async findComment(id: string, authUser: UserDto): Promise<CommentModel> {
    const findOptions: FindOptions = {
      include: [
        authUser
          ? {
              model: CommentReactionModel,
              as: 'ownerReactions',
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
    return this.model.findOne(findOptions);
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
    if (options?.includeOwnerReactions) {
      findOptions.include = [
        {
          model: CommentReactionModel,
          as: 'ownerReactions',
          on: {
            [Op.and]: {
              comment_id: { [Op.eq]: col(`CommentModel.id`) },
              created_by: options?.includeOwnerReactions,
            },
          },
        },
      ];
    }

    return this.model.findOne(findOptions);
  }

  public async destroyComment(id: string): Promise<void> {
    const comment = await this.model.findOne({ where: { id } });
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
      await this.model.destroy({
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
}
