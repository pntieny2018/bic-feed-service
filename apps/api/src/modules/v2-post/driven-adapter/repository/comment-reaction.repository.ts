import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOneCommentReactionProps,
  GetPaginationCommentReactionProps,
  ICommentReactionRepository,
} from '../../domain/repositoty-interface';
import { CommentReactionMapper } from '../mapper/comment-reaction.mapper';
import { LibCommentReactionRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { PaginationResult, ReactionsCount } from '../../../../common/types';
import { Op, Sequelize } from 'sequelize';
import { ORDER } from '@beincom/constants';
import { NIL as NIL_UUID } from 'uuid';

@Injectable()
export class CommentReactionRepository implements ICommentReactionRepository {
  public constructor(
    private readonly _libCommentReactionRepo: LibCommentReactionRepository,
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
    return this._libCommentReactionRepo.createCommentReactionByStore(
      this._commentReactionMapper.toPersistence(data)
    );
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
    const result = await this._libCommentReactionRepo.findMany({
      select: ['commentId', 'reactionName'],
      selectRaw: [
        [`COUNT("id")`, 'total'],
        [`MIN("created_at")`, 'date'],
      ],
      where: {
        commentId: commentIds,
      },
      group: ['commentId', `reactionName`],
      order: [[Sequelize.literal('date'), ORDER.ASC]],
    });

    if (!result) {
      return new Map<string, ReactionsCount>();
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
