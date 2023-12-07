import { ReactionsCount } from '@api/common/types';
import { CONTENT_TARGET, CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';
import { PostModel } from '@libs/database/postgres/model';
import {
  LibPostReactionRepository,
  LibReactionContentDetailsRepository,
} from '@libs/database/postgres/repository';
import { Inject, Injectable } from '@nestjs/common';
import { map } from 'lodash';
import { Op } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

import { CACHE_ADAPTER, ICacheAdapter } from '../../domain/infra-adapter-interface';
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
    private readonly _postReactionMapper: PostReactionMapper,
    @Inject(CACHE_ADAPTER)
    private readonly _cacheAdapter: ICacheAdapter
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
    const caches = await this._cacheAdapter.mgetJson(contentIds);

    const reactionsCountCachedMap = new Map<string, ReactionsCount>();
    caches.forEach((cache: string) => {
      const item = JSON.parse(cache);

      if (item.length > 0 && item[0].id) {
        const reactionCounts = item[0]?.reactionCounts;
        if (!reactionCounts) {
          return;
        }
        reactionsCountCachedMap.set(
          item[0].id,
          map(item[0].reactionCounts, (value, key) => ({ [key]: value }))
        );
      } else {
        return;
      }
    });

    const contentIdsNotCached = contentIds.filter((contentId) => {
      return !reactionsCountCachedMap.has(contentId);
    });

    const reactionCount = await this._libReactionContentDetailsRepo.findMany({
      where: {
        contentId: contentIdsNotCached,
      },
    });

    const reactionsCountMap = new Map<string, ReactionsCount>(
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

    await this._cacheAdapter.cacheContentReactionsCount(reactionsCountMap);

    return new Map([...reactionsCountMap, ...reactionsCountCachedMap]);
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
