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
  ILibCommentRepository,
} from './interface';

@Injectable()
export class LibCommentRepository implements ILibCommentRepository {
  public constructor(
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}

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
    commentId: string,
    props: GetAroundCommentProps
  ): Promise<GetAroundCommentResult> {
    const { limit } = props;
    const limitExcludeTarget = limit - 1;
    const first = Math.ceil(limitExcludeTarget / 2);
    const last = limitExcludeTarget - first;

    const targetComment = await this._commentModel.findByPk(commentId);
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
    return this._commentModel.findOne(findOptions);
  }

  public async createComment(data: CommentAttributes): Promise<CommentModel> {
    return this._commentModel.create(data);
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

    return this._commentModel.findOne(findOptions);
  }

  public async update(commentId: string, attributes: Partial<CommentAttributes>): Promise<void> {
    await this._commentModel.update(attributes, {
      where: {
        id: commentId,
      },
    });
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
}
