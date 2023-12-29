import Redis, { RedisOptions } from 'ioredis';

export class RedisStore {
  public static create(options: RedisOptions): Redis {
    return new Redis(options);
  }
}
