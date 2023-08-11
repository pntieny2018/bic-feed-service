import { CACHE_KEYS } from '@libs/common/constants';
import { AxiosHelper } from '@libs/common/helpers';
import { IHttpService, USER_HTTP_TOKEN } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';
import qs from 'qs';

import { USER_ENDPOINT } from './endpoint.constant';
import { IUserService, IUser } from './interfaces';


@Injectable()
export class UserService implements IUserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(USER_HTTP_TOKEN) private readonly _httpService: IHttpService
  ) {}

  public async findByUserName(username: string): Promise<IUser> {
    if (!username) {
      return null;
    }
    try {
      const userProfile = await this._getUserProfileFromCache(username);
      let user = await this._getUserFromCacheById(userProfile?.id);
      if (!user) {
        const response = await this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(USER_ENDPOINT.INTERNAL.GET_USER, {
            username: username,
          })
        );

        if (response.status !== HttpStatus.OK) {
          return null;
        }
        user = response.data['data'];
      }
      return user;
    } catch (ex) {
      this._logger.debug(ex);
      return null;
    }
  }

  public async findById(id: string): Promise<IUser> {
    let user = await this._getUserFromCacheById(id);
    if (!user) {
      try {
        const response = await this._httpService.get(USER_ENDPOINT.INTERNAL.USERS_PATH, {
          params: {
            ids: [id],
          },
          paramsSerializer: (params) => qs.stringify(params),
        });

        if (response.status !== HttpStatus.OK) {
          return null;
        }
        user = response.data['data'][0];
      } catch (e) {
        this._logger.debug(e);
      }
    }
    return user;
  }

  public async findAllByIds(ids: string[]): Promise<IUser[]> {
    if (!ids || !ids.length) {
      return [];
    }

    const uniqueIds = uniq(ids);
    let users = await this._getUsersFromCacheByIds(uniqueIds);

    const notFoundUserIds = uniqueIds.filter((id) => !users.find((user) => user?.id === id));
    try {
      if (notFoundUserIds.length > 0) {
        const response = await this._httpService.get(USER_ENDPOINT.INTERNAL.USERS_PATH, {
          params: {
            ids: notFoundUserIds,
          },
          paramsSerializer: (params) => qs.stringify(params),
        });

        if (response.status === HttpStatus.OK) {
          users = users.concat(response.data['data']);
        }
      }
    } catch (e) {
      this._logger.debug(e);
    }
    return users;
  }

  public async canCudTagInCommunityByUserId(userId: string, rootGroupId: string): Promise<boolean> {
    try {
      const response = await this._httpService.get(
        AxiosHelper.injectParamsToStrUrl(USER_ENDPOINT.INTERNAL.CHECK_CUD_TAG, {
          userId,
          rootGroupId,
        })
      );

      return response.data['data'];
    } catch (e) {
      this._logger.debug(e);
      return false;
    }
  }

  private async _getUserProfileFromCache(username: string): Promise<IUser> {
    const profileCacheKey = `${CACHE_KEYS.USER_PROFILE}:${username}`;
    return this._store.get<IUser>(profileCacheKey);
  }

  private async _getUserFromCacheById(id: string): Promise<IUser> {
    if (!id) {
      return null;
    }
    let user = null;
    const permissionCacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${id}`;
    const userGroupCacheKey = `${CACHE_KEYS.SHARE_USER}:${id}`;
    const [permissions, userGroups] = await this._store.mget([
      permissionCacheKey,
      userGroupCacheKey,
    ]);
    if (userGroups && permissions) {
      user = userGroups;
      user.permissions = permissions;
    }
    return user;
  }

  private async _getUsersFromCacheByIds(ids: string[]): Promise<IUser[]> {
    const userCacheKeys = ids.map((id) => `${CACHE_KEYS.SHARE_USER}:${id}`);
    return this._store.mget(userCacheKeys);
  }
}
