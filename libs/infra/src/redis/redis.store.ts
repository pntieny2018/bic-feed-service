import Redis, { RedisOptions } from 'ioredis';

export class RedisStore {
  public static create(options: RedisOptions): Redis {
    console.log('options====', options);
    return new Redis(options);
  }
}
