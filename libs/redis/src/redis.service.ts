import { Inject, Injectable } from '@nestjs/common';
import { REDIS_STORE_INSTANCE_TOKEN } from './redis-store.constants';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  public constructor(@Inject(REDIS_STORE_INSTANCE_TOKEN) private readonly _store: Redis.Cluster | Redis.Redis) {}
  public getClient(): Redis.Cluster | Redis.Redis {
    return this._store;
  }
}
