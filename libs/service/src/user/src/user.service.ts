import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { uniq } from 'lodash';
import qs from 'qs';
import { RedisService } from '@app/infra/redis';
import { AxiosHelper } from 'apps/api/src/common/helpers';
import { ENDPOINT } from 'apps/api/src/common/constants/endpoint.constant';
import { CACHE_KEYS } from 'apps/api/src/common/constants';
import { IUserService, IUser } from './interfaces';
import { USER_AXIOS_TOKEN } from '@app/infra/http';

@Injectable()
export class UserService implements IUserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(USER_AXIOS_TOKEN) private readonly _httpService: AxiosInstance
  ) {}

  public async findByUserName(username: string): Promise<IUser> {
    if (!username) return null;
    try {
      const userProfile = await this._getUserProfileFromCache(username);
      let user = await this._getUserFromCacheById(userProfile?.id);
      if (!user) {
        const response = await this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.USER.INTERNAL.GET_USER, {
            username: username,
          })
        );

        if (response.status !== HttpStatus.OK) return null;
        user = AxiosHelper.getDataResponse<IUser>(response);
      }
      return user;
    } catch (ex) {
      this._logger.debug(ex);
      return null;
    }
  }

  public async findOne(id: string): Promise<IUser> {
    let user = await this._getUserFromCacheById(id);
    if (!user) {
      try {
        const response = await this._httpService.get(ENDPOINT.USER.INTERNAL.USERS_PATH, {
          params: {
            ids: [id],
          },
          paramsSerializer: (params) => qs.stringify(params),
        });

        if (response.status !== HttpStatus.OK) return null;
        user = AxiosHelper.getDataArrayResponse<IUser>(response)[0];
      } catch (e) {
        this._logger.debug(e);
      }
    }
    return user;
  }

  public async findAllByIds(ids: string[]): Promise<IUser[]> {
    if (!ids || !ids.length) return [];

    const uniqueIds = uniq(ids);
    let users = await this._getUsersFromCacheByIds(uniqueIds);

    const notFoundUserIds = uniqueIds.filter((id) => !users.find((user) => user?.id === id));
    try {
      if (notFoundUserIds.length > 0) {
        const response = await this._httpService.get(ENDPOINT.USER.INTERNAL.USERS_PATH, {
          params: {
            ids: notFoundUserIds,
          },
          paramsSerializer: (params) => qs.stringify(params),
        });

        if (response.status === HttpStatus.OK) {
          users = users.concat(AxiosHelper.getDataArrayResponse<IUser>(response));
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
        AxiosHelper.injectParamsToStrUrl(ENDPOINT.USER.INTERNAL.CHECK_CUD_TAG, {
          userId,
          rootGroupId,
        })
      );

      return AxiosHelper.getDataResponse<boolean>(response);
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
    if (!id) return null;
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
