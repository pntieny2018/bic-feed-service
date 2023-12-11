import { ReactionsCount } from '@api/common/types';
import { IContentCacheAdapter } from '@api/modules/v2-post/domain/infra-adapter-interface';
import { RedisContentService } from '@libs/infra/redis/redis-content.service';
import { Injectable } from '@nestjs/common';
import { merge } from 'lodash';

@Injectable()
export class ContentCacheAdapter implements IContentCacheAdapter {
  public constructor(private readonly _store: RedisContentService) {}

  public async setJson<T>(key: string, value: T): Promise<any> {
    return this._store.setJson(key, value);
  }

  public async setJsonNx<T>(key: string, value: T, path = '$'): Promise<any> {
    return this._store.setJson(key, value, path, true);
  }

  public async increaseValue(key: string, path: string): Promise<void> {
    const redisClient = this._store.getClient();
    await redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, 1);
  }

  public async decreaseValue(key: string, path: string): Promise<void> {
    const redisClient = this._store.getClient();
    await redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, -1);
  }

  public async getJson<T>(key: string, path?: string): Promise<T> {
    return this._store.getJson(key, path);
  }

  public async mgetJson<T>(keys: string[]): Promise<T[]> {
    return this._store.mgetJson(keys);
  }

  public async cacheContentReactionsCount(
    reactionsCountMap: Map<string, ReactionsCount>
  ): Promise<void> {
    const redisClient = this._store.getClient();
    const pipeline = redisClient.pipeline();
    for (const [contentId, reactionsCount] of reactionsCountMap.entries()) {
      pipeline.call(
        'JSON.SET',
        contentId,
        '$',
        JSON.stringify({ id: contentId, reactionCounts: merge({}, ...reactionsCount) }),
        'NX'
      );
    }
    await pipeline.exec();
  }

  public async deleteContentCache(contentId: string): Promise<void> {
    await this._store.del(contentId);
  }
}
