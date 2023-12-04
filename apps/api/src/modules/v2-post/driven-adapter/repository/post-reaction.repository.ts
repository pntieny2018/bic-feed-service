import { CONTENT_TARGET, CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';
import { PostModel } from '@libs/database/postgres/model';
import {
  LibPostReactionRepository,
  LibReactionContentDetailsRepository,
} from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

import { ReactionsCount } from '../../../../common/types';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOnePostReactionProps,
  GetPaginationPostReactionProps,
  IPostReactionRepository,
  UpdateCountContentReactionProps,
} from '../../domain/repositoty-interface';
import { PostReactionMapper } from '../mapper/post-reaction.mapper';

@Injectable()
export class PostReactionRepository implements IPostReactionRepository {
  public constructor(
    private readonly _libPostReactionRepo: LibPostReactionRepository,
    private readonly _libReactionContentDetailsRepo: LibReactionContentDetailsRepository,
    private readonly _postReactionMapper: PostReactionMapper
  ) {}

  public async findOne(input: FindOnePostReactionProps): Promise<ReactionEntity> {
    const postReaction = await this._libPostReactionRepo.first({
      where: input,
      include: [
        {
          model: PostModel,
          as: 'post',
          required: false,
          select: ['type'],
        },
      ],
    });

    if (!postReaction) {
      return null;
    }

    postReaction.target =
      postReaction.post?.type === CONTENT_TYPE.ARTICLE
        ? CONTENT_TARGET.ARTICLE
        : CONTENT_TARGET.POST;
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
    const reactionCount = await this._libReactionContentDetailsRepo.findMany({
      where: {
        contentId: contentIds,
      },
    });

    return new Map<string, ReactionsCount>(
      contentIds.map((contentId) => {
        return [
          contentId,
          reactionCount
            .filter((i) => {
              return i.contentId === contentId;
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
    input: GetPaginationPostReactionProps
  ): Promise<PaginationResult<ReactionEntity>> {
    const { targetId, target, latestId, limit, order, reactionName } = input;

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

    const result = rows.map((row) => {
      row.target = target;
      return this._postReactionMapper.toDomain(row);
    });

    return {
      rows: result,
      total: count,
    };
  }

  public async increaseReactionCount(props: UpdateCountContentReactionProps): Promise<void> {
    const { reactionName, contentId } = props;
    await this._libReactionContentDetailsRepo.increaseReactionCount(reactionName, contentId);
  }

  public async decreaseReactionCount(props: UpdateCountContentReactionProps): Promise<void> {
    const { reactionName, contentId } = props;
    await this._libReactionContentDetailsRepo.decreaseReactionCount(reactionName, contentId);
  }
}
