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

export class ReactionQuery implements IReactionQuery {
  @Inject(REACTION_FACTORY_TOKEN) private readonly _factory: IReactionFactory;
  private _logger = new Logger(ReactionQuery.name);
  @InjectModel(PostReactionModel)
  private readonly _postReactionModel: typeof PostReactionModel;
  public async getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>> {
    const { schema } = getDatabaseConfig();
    const { target, targetId, latestId, limit, order, reactionName } = input;

    const conditions = {};
    const symbol = order === OrderEnum.DESC ? Op.lte : Op.gte;

    if (latestId !== NIL_UUID) {
      conditions['id'] = {
        [Op.not]: latestId,
      };
    }

    if (latestId !== NIL_UUID) {
      conditions['createdAt'] = {
        [symbol]: sequelize.literal(
          `(SELECT pr.created_at FROM ${schema}.posts_reactions AS pr WHERE id=${latestId})`
        ),
      };
    }
    const { rows, count } = await this._postReactionModel.findAndCountAll({
      where: {
        reactionName: reactionName,
        postId: targetId,
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
