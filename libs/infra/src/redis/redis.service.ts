import { StringHelper } from '@libs/common/helpers';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_STORE_INSTANCE_TOKEN } from './redis-store.constants';

@Injectable()
export class RedisService {
  private readonly _logger = new Logger(RedisService.name);
  public constructor(
    @Inject(REDIS_STORE_INSTANCE_TOKEN)
    private readonly _store: Redis.Cluster | Redis.Redis
  ) {}
  public getClient(): Redis.Cluster | Redis.Redis {
    return this._store;
  }

  public async set(key: string, value: unknown): Promise<any> {
    const response = await this._store.set(key, JSON.stringify(value));
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SET', key, value })}`);
    return response;
  }

  public async setNxEx(key: string, value: unknown, expireTime = 1000): Promise<any> {
    const setnxResult = await this._store.setnx(key, JSON.stringify(value));
    this._logger.debug(
      `[CACHE] ${JSON.stringify({ method: 'SETNX', key, value, result: setnxResult })}`
    );
    if (setnxResult === 1) {
      await this._store.expire(key, expireTime);
    }
    return setnxResult;
  }

  public async get<T>(key: string): Promise<T> {
    const result = await this._store.get(key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'GET', key, result })}`);
    try {
      return StringHelper.isJson(result) ? (JSON.parse(result) as T) : (result as unknown as T);
    } catch (e) {
      this._logger.error(e?.message);
      return null;
    }
  }

  public async hgetall<T>(key: string): Promise<T> {
    try {
      const result = await this._store.hgetall(key);
      this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'HGETALL', key, result })}`);
      return result as unknown as T;
    } catch (e) {
      this._logger.error(e?.message);
      return null;
    }
  }

  public async getSets(key: string): Promise<string[]> {
    const result = await this._store.smembers(key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SMEMBERS', key, result })}`);
    return result;
  }

  public async mget(keys: string[]): Promise<any> {
    if (keys.length === 0) {
      return [];
    }
    const result = await this._store.mget(keys);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'MGET', keys, result })}`);
    try {
      return result
        .map((r) => {
          return StringHelper.isJson(r) ? JSON.parse(r) : r;
        })
        .filter((r) => !!r);
    } catch (e) {
      return [];
    }
  }

  public async del(key: string): Promise<number> {
    const result = await this._store.del(key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'DEL', key, result })}`);
    return result;
  }

  public async reset(): Promise<'OK'> {
    return await this._store.flushdb();
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this._store.keys(pattern);
  }

  public async existKey(key: string): Promise<boolean> {
    return (await this._store.exists(key)) === 1;
  }
}
