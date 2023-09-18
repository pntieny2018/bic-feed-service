import { SharedUserDto, UserDto as ProfileUserDto } from '@beincom/dto';
import { CACHE_KEYS } from '@libs/common/constants';
import { AxiosHelper } from '@libs/common/helpers';
import { IHttpService, USER_HTTP_TOKEN } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';

import { USER_ENDPOINT } from './endpoint.constant';
import { UserDto, UserPermissionDto } from './user.dto';
import { IUserService } from './user.service.interface';

@Injectable()
export class UserService implements IUserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(USER_HTTP_TOKEN) private readonly _httpService: IHttpService
  ) {}

  public async findByUserName(username: string): Promise<UserDto> {
    try {
      const userCache = await this._getUserFromCacheByUsername(username);
      if (userCache) {
        return userCache;
      }

      const userApi = await this._getUsersFromApiByUsername(username);
      return userApi;
    } catch (e) {
      this._logger.error(e);
      return null;
    }
  }

  public async findById(id: string): Promise<UserDto> {
    try {
      const userCache = await this._getUserFromCacheById(id);
      if (userCache) {
        return userCache;
      }

      const userApis = await this._getUsersFromApiByIds([id]);
      return userApis[0];
    } catch (e) {
      this._logger.error(e);
      return null;
    }
  }

  public async findAllByIds(ids: string[]): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    try {
      const uniqueIds = uniq(ids);
      const userCaches = await this._getUsersFromCacheByIds(uniqueIds);

      const notFoundUserIds = uniqueIds.filter((id) => !userCaches.find((user) => user?.id === id));
      const userApis = await this._getUsersFromApiByIds(notFoundUserIds);

      return [...userCaches, ...userApis];
    } catch (e) {
      this._logger.error(e);
      return [];
    }
  }

  private async _getUserFromCacheByUsername(username: string): Promise<UserDto> {
    const profileCacheKey = `${CACHE_KEYS.USER_PROFILE}:${username}`;
    const user = await this._store.get<ProfileUserDto>(profileCacheKey);

    const permissions = await this._getUserPermissionFromCache(user.id);
    const showingBadgesWithCommunity = user?.showingBadges?.map((badge) => ({
      ...badge,
      community: badge.community || null,
    }));

    return new UserDto({ ...user, permissions, showingBadges: showingBadgesWithCommunity });
  }

  private async _getUserFromCacheById(id: string): Promise<UserDto> {
    if (!id) {
      return null;
    }

    const user = await this._store.get<SharedUserDto>(`${CACHE_KEYS.SHARE_USER}:${id}`);
    if (!user) {
      return null;
    }
    const permissions = await this._getUserPermissionFromCache(user.id);
    const showingBadgesWithCommunity = user?.showingBadges?.map((badge) => ({
      ...badge,
      community: badge.community || null,
    }));

    return new UserDto({ ...user, permissions, showingBadges: showingBadgesWithCommunity });
  }

  private async _getUsersFromCacheByIds(ids: string[]): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    const userCacheKeys = ids.map((id) => `${CACHE_KEYS.SHARE_USER}:${id}`);
    const userCaches: SharedUserDto[] = await this._store.mget(userCacheKeys);

    const users = await Promise.all(
      userCaches.map(async (user) => {
        const permissions = await this._getUserPermissionFromCache(user.id);
        const showingBadgesWithCommunity = user?.showingBadges?.map((badge) => ({
          ...badge,
          community: badge.community || null,
        }));

        return new UserDto({ ...user, permissions, showingBadges: showingBadgesWithCommunity });
      })
    );

    return users;
  }

  private async _getUserPermissionFromCache(userId: string): Promise<UserPermissionDto> {
    const permissionCacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
    return this._store.get<UserPermissionDto>(permissionCacheKey);
  }

  private async _getUsersFromApiByIds(ids: string[]): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    const response = await this._httpService.get(USER_ENDPOINT.INTERNAL.USERS_PATH, {
      params: { ids },
    });
    if (response.status !== HttpStatus.OK) {
      return [];
    }

    const userApis = response.data['data'];

    const users = await Promise.all(
      userApis.map(async (user) => {
        const permissions = await this._getUserPermissionFromCache(user.id);
        const showingBadgesWithCommunity = user?.showingBadges?.map((badge) => ({
          ...badge,
          community: badge.community || null,
        }));

        return new UserDto({ ...user, permissions, showingBadges: showingBadgesWithCommunity });
      })
    );

    return users;
  }

  private async _getUsersFromApiByUsername(username: string): Promise<UserDto> {
    const response = await this._httpService.get(
      AxiosHelper.injectParamsToStrUrl(USER_ENDPOINT.INTERNAL.GET_USER, {
        username: username,
      })
    );
    if (response.status !== HttpStatus.OK) {
      return null;
    }

    return response.data['data'];
  }
}
