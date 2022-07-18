import { UserSharedDto } from './dto';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { AppHelper } from '../../common/helpers/app.helper';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService) {}

  /**
   *  Get user info by id
   * @param userId ID of user
   * @returns Promise resolve user info
   */
  public async get(userId: number): Promise<UserSharedDto> {
    console.log('xxxxxxxxxxx', `${AppHelper.getRedisEnv()}SU:${userId}`);
    return await this._store.get<UserSharedDto>(`${AppHelper.getRedisEnv()}SU:${userId}`);
  }

  /**
   *  Get users info by ids
   * @param userIds IDs of user
   * @returns Promise resolve users info
   */
  public async getMany(userIds: number[]): Promise<UserSharedDto[]> {
    const keys = [...new Set(userIds)].map((userId) => `${AppHelper.getRedisEnv()}SU:${userId}`);
    if (keys.length) {
      const users = await this._store.mget(keys);
      return users.filter((i) => i !== null);
    }
    return [];
  }
}
