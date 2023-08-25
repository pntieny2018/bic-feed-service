import { ORDER } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { getDatabaseConfig } from '../../../../config/database';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { REACTION_TARGET } from '../../data-type/reaction.enum';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../domain/factory/interface/reaction.factory.interface';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  GetReactionProps,
  IReactionQuery,
  ReactionsCount,
} from '../../domain/query-interface/reaction.query.interface';

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
    const symbol = order === ORDER.DESC ? Op.lte : Op.gte;

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

  public async getAndCountReactionByComments(
    commentIds: string[]
  ): Promise<Map<string, ReactionsCount>> {
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
      order: [[Sequelize.literal('date'), ORDER.ASC]],
    });

    if (!result) {
      return;
    }

    return new Map<string, ReactionsCount>(
      commentIds.map((commentId) => {
        return [
          commentId,
          result
            .filter((i) => {
              return i.commentId === commentId;
            })
            .map((item) => {
              item = item.toJSON();
              return { [item['reactionName']]: parseInt(item['total']) };
            }),
        ];
      })
    );
  }

  public async getAndCountReactionByContents(
    contentIds: string[]
  ): Promise<Map<string, ReactionsCount>> {
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
      order: [[Sequelize.literal('date'), ORDER.ASC]],
    });

    if (!result) {
      return new Map<string, ReactionsCount>();
    }

    return new Map<string, ReactionsCount>(
      contentIds.map((contentId) => {
        return [
          contentId,
          result
            .filter((i) => {
              return i.postId === contentId;
            })
            .map((item) => {
              item = item.toJSON();
              return { [item['reactionName']]: parseInt(item['total']) };
            }),
        ];
      })
    );
  }
}
