import { CONTENT_TARGET, ORDER } from '@beincom/constants';
import { getDatabaseConfig, PaginationResult } from '@libs/database/postgres/common';
import { CommentReactionModel, PostReactionModel } from '@libs/database/postgres/model';
import {
  GetReactionProps,
  ILibReactionRepository,
  ReactionsCount,
} from '@libs/database/postgres/repository/interface';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

export class LibReactionRepository implements ILibReactionRepository {
  public constructor(
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel
  ) {}

  public async getPagination(
    input: GetReactionProps
  ): Promise<PaginationResult<PostReactionModel | CommentReactionModel>> {
    const { schema } = getDatabaseConfig();
    const { target, targetId, latestId, limit, order, reactionName } = input;

    const conditions = {};
    const symbol = order === ORDER.DESC ? Op.lte : Op.gte;

    let executer = null;
    if (target === CONTENT_TARGET.POST || target === CONTENT_TARGET.ARTICLE) {
      executer = {
        model: this._postReactionModel,
        paramIdName: 'postId',
      };
    } else if (target === CONTENT_TARGET.COMMENT) {
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
    return {
      rows,
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
