import { IS_ENABLE_LOG } from '@libs/common/constants';
import { Inject, Injectable } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';

import { CustomLogger } from '../log';

import { BaseRedisService } from './base-redis.service';
import { REDIS_CONTENT_INSTANCE_TOKEN } from './redis-store.constants';

@Injectable()
export class RedisContentService extends BaseRedisService {
  public constructor(
    @Inject(REDIS_CONTENT_INSTANCE_TOKEN)
    private readonly _store: Cluster | Redis
  ) {
    super(_store, new CustomLogger(RedisContentService.name, IS_ENABLE_LOG));
  }

  public async del(key: string): Promise<any> {
    const result = await this._store.call('DEL', key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'DEL', key, result })}`);
    return result;
  }

  public async setJson<T>(key: string, value: T, path?: string, nx?: boolean): Promise<any> {
    return this._store.call(
      'JSON.SET',
      key,
      `${path ? `$.${path}` : '$'}`,
      JSON.stringify(value),
      ...(nx ? ['NX'] : [])
    );
  }

  public async getJson<T>(key: string, path?: string): Promise<T> {
    const result = await this._store.call('JSON.GET', key, `${path ? `$.${path}` : '$'}`);
    try {
      return JSON.parse(result as string)[0];
    } catch (e) {
      this._logger.error(e?.message);
      return null;
    }
  }

  public async mgetJson<T>(keys: string[]): Promise<T[]> {
    if (!keys?.length) {
      return [];
    }
    const result = await this._store.call('JSON.MGET', ...keys, '$');
    return (result as any[]).filter((r) => !!r).map((r) => JSON.parse(r));
  }

  public async increaseValue(key: string, path: string, increase = 1): Promise<number> {
    const increaseResult = await this._store.call('JSON.NUMINCRBY', key, `$.${path}`, increase);
    return JSON.parse(increaseResult as string)[0];
  }

  public async decreaseValue(key: string, path: string, decrease = -1): Promise<number> {
    const decreaseResult = await this._store.call('JSON.NUMINCRBY', key, `$.${path}`, decrease);
    return JSON.parse(decreaseResult as string)[0];
  }
}
