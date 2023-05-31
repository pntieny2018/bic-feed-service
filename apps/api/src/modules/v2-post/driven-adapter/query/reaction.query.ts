import { InjectModel } from '@nestjs/sequelize';
import { Inject } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';
import { getDatabaseConfig } from '../../../../config/database';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../domain/factory/interface/reaction.factory.interface';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { REACTION_TARGET } from '../../data-type/reaction-target.enum';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  GetReactionProps,
  IReactionQuery,
  ReactionsCount,
} from '../../domain/query-interface/reaction.query.interface';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { OrderEnum } from '../../../../common/dto';

export class ReactionQuery implements IReactionQuery {
  public constructor(
    @Inject(REACTION_FACTORY_TOKEN)
    private readonly _reactionFactory: IReactionFactory,
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel
  ) {}

  public async getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>> {
    const { schema } = getDatabaseConfig();
    const { target, targetId, latestId, limit, order, reactionName } = input;

    const conditions = {};
    const symbol = order === OrderEnum.DESC ? Op.lte : Op.gte;

    let executer = null;
    if (target === REACTION_TARGET.POST || target === REACTION_TARGET.ARTICLE) {
      executer = {
        model: this._postReactionModel,
        paramIdName: 'postId',
      };
    } else if (target === REACTION_TARGET.COMMENT) {
      executer = {
        model: this._commentReactionModel,
        paramIdName: 'commentId',
      };
    } else {
      return {
        rows: [],
        total: 0,
      };
    }

    if (latestId !== NIL_UUID) {
      conditions['id'] = {
        [Op.not]: latestId,
      };
      conditions['createdAt'] = {
        [symbol]: Sequelize.literal(
          `(SELECT r.created_at FROM ${schema}.${executer.model.tableName} AS r WHERE id=${latestId})`
        ),
      };
    }
    const { rows, count } = await executer.model.findAndCountAll({
      where: {
        reactionName: reactionName,
        [executer.paramIdName]: targetId,
        ...conditions,
      },
      limit: limit,
      order: [['createdAt', order]],
    });
    const result = rows.map((row) => this._reactionFactory.reconstitute(row));
    return {
      rows: result,
      total: count,
    };
  }

  public async getAndCountReactionByComments(commentIds: string[]): Promise<ReactionsCount> {
    const result = await this._commentReactionModel.findAll({
      attributes: [
        'commentId',
        'reactionName',
        [Sequelize.literal(`COUNT("id")`), 'total'],
        [Sequelize.literal(`MIN("created_at")`), 'date'],
      ],
      where: {
        commentId: commentIds,
      },
      group: ['commentId', `reactionName`],
      order: [[Sequelize.literal('date'), OrderEnum.ASC]],
    });

    if (!result) return;

    const reactionsCount = result.map((item) => {
      item = item.toJSON();
      return { [item['reactionName']]: parseInt(item['total']) };
    });

    return reactionsCount;
  }

  public async getAndCountReactionByContents(contentIds: string[]): Promise<ReactionsCount> {
    const result = await this._postReactionModel.findAll({
      attributes: [
        'postId',
        'reactionName',
        [Sequelize.literal(`COUNT("id")`), 'total'],
        [Sequelize.literal(`MIN("created_at")`), 'date'],
      ],
      where: {
        postId: contentIds,
      },
      group: ['postId', `reactionName`],
      order: [[Sequelize.literal('date'), OrderEnum.ASC]],
    });

    if (!result) return;

    const reactionsCount = result.map((item) => {
      item = item.toJSON();
      return { [item['reactionName']]: parseInt(item['total']) };
    });

    return reactionsCount;
  }
}
