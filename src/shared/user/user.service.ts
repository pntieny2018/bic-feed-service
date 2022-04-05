import { UserSharedDto } from './dto';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService) {}

  /**
   *  Get user info by id
   * @param userId ID of user
   * @returns Promise resolve user info
   */
  public async get(userId: number): Promise<UserSharedDto> {    
    return await this._store.get<UserSharedDto>(`US:${userId}`);
  }

  /**
   *  Get users info by ids
   * @param userIds IDs of user
   * @returns Promise resolve users info
   */
  public async getMany(userIds: number[]): Promise<UserSharedDto[]> {    
    const keys = [...new Set(userIds)].map((userId) => `US:${userId}`);
    if (keys.length) {
      const users = await this._store.mget(keys);
      const filterNotNull = users.filter((i) => i !== null);
      return filterNotNull;
    }
    return [];
  }
}
