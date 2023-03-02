import { RedisService } from '../../../../../libs/redis/src';
import { ArrayHelper, AxiosHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { UserEntity } from '../../domain/model/user';
import { IUserRepository } from '../../domain/repositoty-interface/user.repository.interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { HttpStatus, Logger } from '@nestjs/common';
import { CACHE_KEYS } from '../../../../common/constants/casl.constant';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';

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
  permission?: Permission;
};

type UserDataInRest = UserDataInCache;

export class UserRepository implements IUserRepository {
  private readonly _logger = new Logger(UserRepository.name);
  private readonly _store: RedisService;
  private readonly _prefixRedis = `${AppHelper.getRedisEnv()}SU:`;

  public constructor(private readonly _httpService: HttpService) {}

  public async findByUserName(username: string): Promise<UserEntity> {
    try {
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
      const user = AxiosHelper.getDataResponse<UserDataInRest>(response);
      return new UserEntity(user);
    } catch (ex) {
      this._logger.debug(ex);
      return null;
    }
  }

  public async findOne(id: string): Promise<UserEntity> {
    const user = await this._store.get<UserDataInCache>(`${this._prefixRedis + id}`);
    return new UserEntity(user);
  }

  public async findAllByIds(ids: string[]): Promise<UserEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(ids.map((id) => id)))].map(
      (groupId) => `${this._prefixRedis + groupId}`
    );

    const users = await this._store.mget(keys);
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
