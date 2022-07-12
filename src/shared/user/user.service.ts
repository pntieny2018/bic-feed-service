import { UserSharedDto } from './dto';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private _cacheKeyUserPermissions = 'user_permissions';

  public constructor(private _store: RedisService) {}

  /**
   *  Get user info by id
   * @param userId ID of user
   * @returns Promise resolve user info
   */
  public async get(userId: number): Promise<UserSharedDto> {
    return await this._store.get<UserSharedDto>(`SU:${userId}`);
  }

  /**
   *  Get users info by ids
   * @param userIds IDs of user
   * @returns Promise resolve users info
   */
  public async getMany(userIds: number[]): Promise<UserSharedDto[]> {
    const keys = [...new Set(userIds)].map((userId) => `SU:${userId}`);
    if (keys.length) {
      const users = await this._store.mget(keys);
      return users.filter((i) => i !== null);
    }
    return [];
  }

  public async getCachedPermissionsOfUser(userId: number): Promise<
    {
      action: string;
      subject: string;
      conditions: {
        id: number;
      };
    }[]
  > {
    return await this._store.get(`${this._cacheKeyUserPermissions}:${userId}`);
  }
}
