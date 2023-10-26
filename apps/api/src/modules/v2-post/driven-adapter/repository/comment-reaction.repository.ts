import { ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';
import {
  LibCommentReactionRepository,
  LibReactionCommentDetailsRepository,
} from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

import { ReactionsCount } from '../../../../common/types';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOneCommentReactionProps,
  GetPaginationCommentReactionProps,
  ICommentReactionRepository,
} from '../../domain/repositoty-interface';
import { CommentReactionMapper } from '../mapper/comment-reaction.mapper';

@Injectable()
export class CommentReactionRepository implements ICommentReactionRepository {
  public constructor(
    private readonly _libCommentReactionRepo: LibCommentReactionRepository,
    private readonly _libReactionCommentDetailsRepo: LibReactionCommentDetailsRepository,
    private readonly _commentReactionMapper: CommentReactionMapper
  ) {}

  public async findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity> {
    const model = await this._libCommentReactionRepo.first({
      where: {
        ...input,
      },
    });
    return this._commentReactionMapper.toDomain(model);
  }

  public async create(data: ReactionEntity): Promise<void> {
    await this._libCommentReactionRepo.create(this._commentReactionMapper.toPersistence(data));
  }

  public async delete(id: string): Promise<void> {
    await this._libCommentReactionRepo.delete({
      where: {
        id,
      },
    });
  }

  public async getAndCountReactionByComments(
    commentIds: string[]
  ): Promise<Map<string, ReactionsCount>> {
    const reactionCount = await this._libReactionCommentDetailsRepo.findMany({
      where: {
        commentId: commentIds,
      },
    });

    return new Map<string, ReactionsCount>(
      commentIds.map((commentId) => {
        return [
          commentId,
          reactionCount
            .filter((i) => {
              return i.commentId === commentId;
            })
            .map((item) => {
              item = item.toJSON();
              return { [item['reactionName']]: item['count'] };
            }),
        ];
      })
    );
  }

  public async getPagination(
    input: GetPaginationCommentReactionProps
  ): Promise<PaginationResult<ReactionEntity>> {
    const { targetId, latestId, limit, order, reactionName } = input;

    const conditions = {};
    const symbol = order === ORDER.DESC ? Op.lte : Op.gte;

    if (latestId !== NIL_UUID) {
      conditions['createdAt'] = {
        [symbol]: latestId,
      };
    }
    const { rows, count } = await this._libCommentReactionRepo.findAndCountAll({
      where: {
        reactionName: reactionName,
        commentId: targetId,
        ...conditions,
      },
      limit,
      order: [['createdAt', order]],
    });
    const result = rows.map((row) => this._commentReactionMapper.toDomain(row));
    return {
      rows: result,
      total: count,
    };
  }
}
