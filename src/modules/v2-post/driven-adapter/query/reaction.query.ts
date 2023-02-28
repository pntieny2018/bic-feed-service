import { GetReactionProps, IReactionQuery } from '../../domain/query-interface';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  IReactionRepository,
  REACTION_REPOSITORY_TOKEN,
} from '../../domain/repositoty-interface/reaction.repository.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Inject, Logger } from '@nestjs/common';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { OrderEnum } from '../../../../common/dto';
import sequelize, { Op } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../domain/factory/reaction.factory.interface';
import { getDatabaseConfig } from '../../../../config/database';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { ReactionEnum } from '../../../reaction/reaction.enum';

export class ReactionQuery implements IReactionQuery {
  @Inject(REACTION_FACTORY_TOKEN) private readonly _factory: IReactionFactory;
  private _logger = new Logger(ReactionQuery.name);
  @InjectModel(PostReactionModel)
  private readonly _postReactionModel: typeof PostReactionModel;
  @InjectModel(CommentReactionModel)
  private readonly _commentReactionModel: typeof CommentReactionModel;
  public async getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>> {
    const { schema } = getDatabaseConfig();
    const { target, targetId, latestId, limit, order, reactionName } = input;

    const conditions = {};
    const symbol = order === OrderEnum.DESC ? Op.lte : Op.gte;

    let executer = null;
    if (target === ReactionEnum.POST || target === ReactionEnum.ARTICLE) {
      executer = {
        model: this._postReactionModel,
        paramIdName: 'postId',
      };
    } else if (target === ReactionEnum.COMMENT) {
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
        [symbol]: sequelize.literal(
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
    const result = rows.map((row) => this._factory.reconstitute(row));
    return {
      rows: result,
      total: count,
    };
  }
}
