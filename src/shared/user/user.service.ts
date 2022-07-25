import { UserSharedDto } from './dto';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { AppHelper } from '../../common/helpers/app.helper';
import { CACHE_KEYS } from '../../common/constants/casl.constant';
import { ExternalService } from '../../app/external.service';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService, private _externalService: ExternalService) {}

  /**
   *  Get user info by id
   * @param userId ID of user
   * @returns Promise resolve user info
   */
  public async get(userId: string): Promise<UserSharedDto> {
    return await this._store.get<UserSharedDto>(`${AppHelper.getRedisEnv()}SU:${userId}`);
  }

  public async getPermissions(userId: string, payload: string): Promise<any> {
    const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
    const permissionCached = await this._store.get(cacheKey);
    if (permissionCached) return permissionCached;
    return await this._externalService.getPermission(payload);
  }

  /**
   *  Get users info by ids
   * @param userIds IDs of user
   * @returns Promise resolve users info
   */
  public async getMany(userIds: string[]): Promise<UserSharedDto[]> {
    const keys = [...new Set(userIds)].map((userId) => `${AppHelper.getRedisEnv()}SU:${userId}`);
    if (keys.length) {
      const users = await this._store.mget(keys);
      return users.filter((i) => i !== null);
    }
    return [];
  }
}
