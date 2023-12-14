import { ReactionsCount } from '@api/common/types';
import { RedisService } from '@libs/infra/redis';
import { Injectable } from '@nestjs/common';
import { merge } from 'lodash';

import { ICacheAdapter } from '../../domain/infra-adapter-interface';

@Injectable()
export class CacheAdapter implements ICacheAdapter {
  public constructor(private readonly _store: RedisService) {}

  public async setJson<T>(key: string, value: T): Promise<any> {
    return this._store.storeJson(key, value);
  }

  public async setJsonNx<T>(key: string, value: T, path = '$'): Promise<any> {
    return this._store.storeJson(key, value, path, true);
  }

  public async increaseValue(key: string, path: string): Promise<any> {
    const redisClient = this._store.getClient();
    return redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, 1);
  }

  public async decreaseValue(key: string, path: string): Promise<any> {
    const redisClient = this._store.getClient();
    return redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, -1);
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
}
