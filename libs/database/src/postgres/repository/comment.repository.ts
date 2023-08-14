import { CONTENT_TARGET } from '@beincom/constants';
import { CommentReactionModel } from '@libs/database/postgres/model/comment-reaction.model';
import { CommentAttributes, CommentModel } from '@libs/database/postgres/model/comment.model';
import { ReportContentDetailModel } from '@libs/database/postgres/model/report-content-detail.model';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize, WhereOptions, col } from 'sequelize';

import { FindOneOptions, ILibCommentRepository } from './interface';

@Injectable()
export class LibCommentRepository implements ILibCommentRepository {
  public constructor(
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}

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
    try {
      await this._commentModel.update(attributes, {
        where: {
          id: commentId,
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
}
