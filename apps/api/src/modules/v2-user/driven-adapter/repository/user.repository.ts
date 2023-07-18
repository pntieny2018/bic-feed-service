import qs from 'qs';
import { uniq } from 'lodash';
import { AxiosHelper } from '../../../../common/helpers';
import { UserBadge, UserEntity } from '../../domain/model/user';
import { IUserRepository } from '../../domain/repositoty-interface/user.repository.interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CACHE_KEYS } from '../../../../common/constants/casl.constant';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';
import { RedisService } from '@app/redis';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../../../config/axios';

type Permission = {
  communities: Record<string, string[]>;
  groups: Record<string, string[]>;
};
type UserDataInCache = {
  id: string;
  username: string;
  fullname: string;
  avatar: string;
  email: string;
  groups: string[];
  isDeactivated?: boolean;
  permissions?: Permission;
  isVerified?: boolean;
  showingBadges?: UserBadge[];
};

type UserDataInRest = UserDataInCache;

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly _logger = new Logger(UserRepository.name);

  public constructor(
    private readonly _httpService: HttpService,
    private readonly _store: RedisService,
    private readonly _configService: ConfigService
  ) {}

  public async findByUserName(username: string): Promise<UserEntity> {
    if (!username) return null;
    try {
      const userProfile = await this._getUserProfileFromCache(username);
      let user = await this._getUserFromCacheById(userProfile?.id);
      if (!user) {
        const response = await lastValueFrom(
          this._httpService.get(
            AxiosHelper.injectParamsToStrUrl(ENDPOINT.USER.INTERNAL.GET_USER, {
              username: username,
            })
          )
        );
        if (response.status !== HttpStatus.OK) return null;
        user = AxiosHelper.getDataResponse<UserDataInRest>(response);
      }
      return new UserEntity(user);
    } catch (ex) {
      this._logger.debug(ex);
      return null;
    }
  }

  public async findOne(id: string): Promise<UserEntity> {
    let user = await this._getUserFromCacheById(id);
    if (!user) {
      try {
        const response = await lastValueFrom(
          this._httpService.get(ENDPOINT.USER.INTERNAL.USERS_PATH, {
            params: {
              ids: [id],
            },
            paramsSerializer: (params) => qs.stringify(params),
          })
        );
        if (response.status !== HttpStatus.OK) return null;
        user = AxiosHelper.getDataArrayResponse<UserDataInRest>(response)[0];
      } catch (e) {
        this._logger.debug(e);
      }
    }
    return new UserEntity(user);
  }

  public async findAllByIds(ids: string[]): Promise<UserEntity[]> {
    const uniqueIds = uniq(ids);
    let users = await this._getUsersFromCacheByIds(uniqueIds);

    const notFoundUserIds = uniqueIds.filter((id) => !users.find((user) => user?.id === id));
    try {
      if (notFoundUserIds.length > 0) {
        const response = await lastValueFrom(
          this._httpService.get(ENDPOINT.USER.INTERNAL.USERS_PATH, {
            params: {
              ids: notFoundUserIds,
            },
            paramsSerializer: (params) => qs.stringify(params),
          })
        );
        if (response.status === HttpStatus.OK) {
          users = users.concat(AxiosHelper.getDataArrayResponse<UserDataInRest>(response));
        }
      }
    } catch (e) {
      this._logger.debug(e);
    }

    const result = [];
    for (const user of users) {
      if (user) {
        result.push(new UserEntity(user));
      }
    }
    return result;
  }

  /**
   * Note: Need to override domain to group endpoint. Change domain to user service soon
   */
  public async canCudTagInCommunityByUserId(userId: string, rootGroupId: string): Promise<boolean> {
    const axiosConfig = this._configService.get<IAxiosConfig>('axios');
    try {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.USER.INTERNAL.CHECK_CUD_TAG, {
            userId,
            rootGroupId,
          }),
          { baseURL: axiosConfig.group.baseUrl }
        )
      );
      return AxiosHelper.getDataResponse<boolean>(response);
    } catch (e) {
      this._logger.debug(e);
      return false;
    }
  }

  private async _getUserProfileFromCache(username: string): Promise<UserDataInCache> {
    const profileCacheKey = `${CACHE_KEYS.USER_PROFILE}:${username}`;
    return this._store.get<UserDataInCache>(profileCacheKey);
  }

  private async _getUserFromCacheById(id: string): Promise<UserDataInCache> {
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

  private async _getUsersFromCacheByIds(ids: string[]): Promise<UserDataInCache[]> {
    const result = [];
    if (!ids || !ids.length) return result;

    const userCacheKeys = ids.map((id) => `${CACHE_KEYS.SHARE_USER}:${id}`);
    const permissionCacheKeys = ids.map((id) => `${CACHE_KEYS.USER_PERMISSIONS}:${id}`);

    const userGroups = await this._store.mget(userCacheKeys);
    const userPermissions = await this._store.mget(permissionCacheKeys);

    ids.forEach((id, index) => {
      const user = userGroups[index];
      const permissions = userPermissions[index];
      if (user && permissions) {
        user.permissions = permissions;
        result.push(user);
      }
    });

    return result;
  }
}
