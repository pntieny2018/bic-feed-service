import { IS_ENABLE_LOG } from '@libs/common/constants';
import { Inject, Injectable } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';

import { CustomLogger } from '../log';

import { BaseRedisService } from './base-redis.service';
import { REDIS_STORE_INSTANCE_TOKEN } from './redis-store.constants';

@Injectable()
export class RedisService extends BaseRedisService {
  public constructor(
    @Inject(REDIS_STORE_INSTANCE_TOKEN)
    private readonly _store: Cluster | Redis
  ) {
    super(_store, new CustomLogger(RedisService.name, IS_ENABLE_LOG));
  }
}
