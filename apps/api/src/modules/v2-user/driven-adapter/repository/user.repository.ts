import { ArrayHelper, AxiosHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { UserEntity } from '../../domain/model/user';
import { IUserRepository } from '../../domain/repositoty-interface/user.repository.interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CACHE_KEYS } from '../../../../common/constants/casl.constant';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';
import { RedisService } from '@app/redis';

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
};

type UserDataInRest = UserDataInCache;

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly _logger = new Logger(UserRepository.name);

  private readonly _prefixRedis = `${AppHelper.getRedisEnv()}SU:`;

  public constructor(
    private readonly _httpService: HttpService,
    private readonly _store: RedisService
  ) {}

  public async findByUserName(username: string): Promise<UserEntity> {
    try {
      const userCacheKey = `${CACHE_KEYS.USER_PROFILE}:${username}`;
      const user = await this._store.get<UserDataInCache>(userCacheKey);
      let userWithGroups = null;
      if (user) {
        const permissionCacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${user.id}`;
        const userGroupCacheKey = `${this._prefixRedis + user.id}`;
        const [permissions, userGroups] = await this._store.mget([
          permissionCacheKey,
          userGroupCacheKey,
        ]);
        if (userGroups && permissions) {
          userWithGroups = userGroups;
          userWithGroups.permissions = permissions;
        }
      }
      if (!userWithGroups) {
        const response = await lastValueFrom(
          this._httpService.get(
            AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.GET_USER, {
              username: username,
            })
          )
        );
        if (response.status !== HttpStatus.OK) {
          return null;
        }
        userWithGroups = AxiosHelper.getDataResponse<UserDataInRest>(response);
      }
      return new UserEntity(userWithGroups);
    } catch (ex) {
      this._logger.debug(ex);
      return null;
    }
  }

  public async findOne(id: string): Promise<UserEntity> {
    let user = await this._store.get<UserDataInCache>(`${this._prefixRedis + id}`);
    if (!user) {
      try {
        const response = await lastValueFrom(
          this._httpService.get(
            AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.USERS_PATH, {
              ids: id,
            })
          )
        );
        if (response.status === HttpStatus.OK) {
          user = AxiosHelper.getDataArrayResponse<UserDataInRest>(response)[0];
        }
      } catch (e) {
        this._logger.debug(e);
      }

      if (!user) {
        return null;
      }
    }
    return new UserEntity(user);
  }

  public async findAllByIds(ids: string[]): Promise<UserEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(ids.map((id) => id)))].map(
      (userId) => `${this._prefixRedis + userId}`
    );

    let users = await this._store.mget(keys);
    const notFoundUserIds = ids.filter((id) => !users.find((user) => user?.id === id));
    try {
      if (notFoundUserIds.length > 0) {
        const response = await lastValueFrom(
          this._httpService.get(
            AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.USERS_PATH, {
              ids: notFoundUserIds.join(','),
            })
          )
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

  public async getPermissionsByUserId(userId: string): Promise<Permission> {
    const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
    const permissionCached = await this._store.get<Permission>(cacheKey);
    if (permissionCached) return permissionCached;

    return {
      communities: {},
      groups: {},
    };
  }

  public async canCudTagInCommunityByUserId(userId: string, rootGroupId: string): Promise<boolean> {
    try {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.CHECK_CUD_TAG, {
            userId,
            rootGroupId,
          })
        )
      );
      return AxiosHelper.getDataResponse<boolean>(response);
    } catch (e) {
      return false;
    }
  }
}
