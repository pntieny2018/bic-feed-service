import Redis, { RedisOptions } from 'ioredis';

export class RedisStore {
  public static create(options: RedisOptions): Redis.Redis {
    return new Redis(options);
  }
}
