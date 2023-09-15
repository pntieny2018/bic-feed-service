import { uniq } from 'lodash';
import { AxiosHelper } from '../../../../common/helpers';
import { UserEntity, UserProps } from '../../domain/model/user';
import { IUserRepository } from '../../domain/repositoty-interface/user.repository.interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CACHE_KEYS } from '../../../../common/constants/casl.constant';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';
import { RedisService } from '@app/redis';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../../../config/axios';

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
        user = AxiosHelper.getDataResponse<UserProps>(response);
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
      user = (await this._getUsersFromIntenalByIds([id]))[0];
    }
    return new UserEntity(user);
  }

  public async findAllByIds(ids: string[]): Promise<UserEntity[]> {
    if (!ids || !ids.length) return [];

    const uniqueIds = uniq(ids);
    const result = [];
    let users = await this._getUsersFromCacheByIds(uniqueIds);

    const notFoundUserIds = uniqueIds.filter((id) => !users.find((user) => user?.id === id));
    if (notFoundUserIds.length > 0) {
      const usersData = await this._getUsersFromIntenalByIds(notFoundUserIds);
      users = users.concat(usersData);
    }

    for (const user of users) {
      if (user) {
        result.push(new UserEntity(user));
      }
    }
    return result;
  }

  public async findAllFromInternalByIds(ids: string[], authUserId: string): Promise<UserEntity[]> {
    if (!ids || !ids.length) return [];
    const uniqueIds = uniq(ids);
    const usersData = await this._getUsersFromIntenalByIds(uniqueIds, authUserId);
    return usersData.map((user) => new UserEntity(user));
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

  private async _getUserProfileFromCache(username: string): Promise<UserProps> {
    const profileCacheKey = `${CACHE_KEYS.USER_PROFILE}:${username}`;
    return this._store.get<UserProps>(profileCacheKey);
  }

  private async _getUserFromCacheById(id: string): Promise<UserProps> {
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

  private async _getUsersFromCacheByIds(ids: string[]): Promise<UserProps[]> {
    const userCacheKeys = ids.map((id) => `${CACHE_KEYS.SHARE_USER}:${id}`);
    return this._store.mget(userCacheKeys);
  }

  private async _getUsersFromIntenalByIds(
    ids: string[],
    authUserId?: string
  ): Promise<UserProps[]> {
    let users: UserProps[] = [];
    try {
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.USER.INTERNAL.GET_USERS, ids, {
          params: {
            ...(authUserId && {
              actorId: authUserId,
            }),
          },
        })
      );
      if (response.status === HttpStatus.OK || response.status === HttpStatus.CREATED) {
        users = AxiosHelper.getDataArrayResponse<UserProps>(response);
      }
    } catch (e) {
      this._logger.debug(e);
    }

    return users;
  }
}
