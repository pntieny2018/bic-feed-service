import { ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';
import { LibPostReactionRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

import { ReactionsCount } from '../../../../common/types';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOnePostReactionProps,
  GetPaginationPostReactionProps,
  IPostReactionRepository,
} from '../../domain/repositoty-interface';
import { PostReactionMapper } from '../mapper/post-reaction.mapper';

@Injectable()
export class PostReactionRepository implements IPostReactionRepository {
  public constructor(
    private readonly _libPostReactionRepo: LibPostReactionRepository,
    private readonly _postReactionMapper: PostReactionMapper
  ) {}

  public async findOne(input: FindOnePostReactionProps): Promise<ReactionEntity> {
    const postReaction = await this._libPostReactionRepo.first({
      where: input,
    });
    return this._postReactionMapper.toDomain(postReaction);
  }

  public async create(data: ReactionEntity): Promise<void> {
    await this._libPostReactionRepo.create(this._postReactionMapper.toPersistence(data));
  }

  public async delete(id: string): Promise<void> {
    await this._libPostReactionRepo.delete({
      where: { id },
    });
  }

  public async getAndCountReactionByContents(
    contentIds: string[]
  ): Promise<Map<string, ReactionsCount>> {
    const result = await this._libPostReactionRepo.findMany({
      select: ['postId', 'reactionName'],
      selectRaw: [
        [`COUNT("id")`, 'total'],
        [`MIN("created_at")`, 'date'],
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

  public async getPagination(
    input: GetPaginationPostReactionProps
  ): Promise<PaginationResult<ReactionEntity>> {
    const { targetId, latestId, limit, order, reactionName } = input;

    const conditions = {};
    const symbol = order === ORDER.DESC ? Op.lte : Op.gte;

    if (latestId !== NIL_UUID) {
      conditions['createdAt'] = {
        [symbol]: latestId,
      };
    }
    const { rows, count } = await this._libPostReactionRepo.findAndCountAll({
      where: {
        reactionName: reactionName,
        postId: targetId,
        ...conditions,
      },
      limit,
      order: [['createdAt', order]],
    });
    const result = rows.map((row) => this._postReactionMapper.toDomain(row));
    return {
      rows: result,
      total: count,
    };
  }
}
