import { RedisOptions, Redis } from 'ioredis';

export class RedisStore {
  public static create(options: RedisOptions): Redis {
    return new Redis(options);
  }
}
