import { CACHE_KEYS } from '@beincom/constants';
import { UserDto as ProfileUserDto } from '@beincom/dto';
import { AxiosHelper } from '@libs/common/helpers';
import { GROUP_HTTP_TOKEN, IHttpService, USER_HTTP_TOKEN } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { GROUP_ENDPOINT } from '@libs/service/group/src/endpoint.constant';
import { IUserService, ShowingBadgeDto } from '@libs/service/user';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';

import { USER_ENDPOINT } from './endpoint.constant';
import { UserDto, UserPermissionDto } from './user.dto';

@Injectable()
export class UserService implements IUserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(USER_HTTP_TOKEN) private readonly _userHttpService: IHttpService,
    @Inject(GROUP_HTTP_TOKEN) private readonly _groupHttpService: IHttpService
  ) {}

  public async findByUserName(username: string): Promise<UserDto> {
    try {
      return this._getUserDtoByUserName(username);
    } catch (e) {
      this._logger.error(e);
      return null;
    }
  }

  public async findById(id: string): Promise<UserDto> {
    try {
      const username = await this._getUsernameFromUserIdInCache(id);
      return this._getUserDtoByUserName(username);
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
      return this._getUsersFromCacheByIds(uniqueIds);
    } catch (e) {
      this._logger.error(e);
      return [];
    }
  }

  public async findAllByIdsWithAuthUser(ids: string[], authUserId: string): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    try {
      const uniqueIds = uniq(ids);
      return this._getUsersFromApiByIds(uniqueIds, authUserId);
    } catch (e) {
      this._logger.error(e);
      return [];
    }
  }

  private async _getUserDtoByUserName(username: string): Promise<UserDto> {
    if (!username) {
      return null;
    }

    const userProfile = await this._getProfileUserByUserNameFromCache(username);
    if (!userProfile) {
      return null;
    }

    const permissions = await this._getPermissionByUserId(userProfile.id);
    const showingBadges = userProfile.showingBadges as ShowingBadgeDto[];
    const joinedGroups = await this._getJoinedGroupsByUserIdFromCache(userProfile.id);

    return new UserDto({ ...userProfile, permissions, showingBadges, groups: joinedGroups });
  }

  private async _getUsersFromCacheByIds(ids: string[]): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    const usernames = await Promise.all(ids.map((id) => this._getUsernameFromUserIdInCache(id)));
    const users: UserDto[] = [];
    for (const username of usernames) {
      const user = await this._getUserDtoByUserName(username);
      users.push(user);
    }

    return users;
  }

  // TODO: now user squad is keeping this api for protect domain logic, will be refactor it later
  private async _getUsersFromApiByIds(ids: string[], authUserId: string): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    const params = { ids };
    if (authUserId) {
      params['actorId'] = authUserId;
    }
    const response = await this._userHttpService.get(USER_ENDPOINT.INTERNAL.GET_USERS, { params });
    if (response.status !== HttpStatus.OK) {
      return [];
    }

    const userApis = response.data['data'];

    return Promise.all(
      userApis.map(async (user) => {
        const permissions = await this._getPermissionByUserId(user.id);
        const showingBadgesWithCommunity: ShowingBadgeDto[] = user?.showingBadges?.map((badge) => ({
          ...badge,
          community: badge.community || null,
        }));

        return new UserDto({ ...user, permissions, showingBadges: showingBadgesWithCommunity });
      })
    );
  }

  private async _getUsernameFromUserIdInCache(userId: string): Promise<string> {
    return this._store.get<string>(`${CACHE_KEYS.USERNAME}:${userId}`);
  }

  private async _getProfileUserByUserNameFromCache(username: string): Promise<ProfileUserDto> {
    return this._store.get<ProfileUserDto>(`${CACHE_KEYS.USER_PROFILE}:${username}`);
  }

  private async _getShowingBadgesByUserIdFromCache(userId: string): Promise<ShowingBadgeDto[]> {
    return this._store.get<ShowingBadgeDto[]>(`${CACHE_KEYS.SHOWING_BADGES}:${userId}`);
  }

  private async _getJoinedGroupsByUserIdFromCache(userId: string): Promise<string[]> {
    return this._store.getSets(`${CACHE_KEYS.JOINED_GROUPS}:${userId}`);
  }

  private async _getPermissionByUserId(userId: string): Promise<UserPermissionDto> {
    const versionPermissionCacheKey = 'version';
    const permissions: UserPermissionDto = {
      communities: {},
      groups: {},
    };
    const communityPermissionCacheKey = `${CACHE_KEYS.COMMUNITY_PERMISSION}:${userId}`;
    const groupPermissionCacheKey = `${CACHE_KEYS.GROUP_PERMISSION}:${userId}`;

    const communityPermissions = await this._store.hgetall<Record<string, string[]>>(
      communityPermissionCacheKey
    );

    const groupPermissions = await this._store.hgetall<Record<string, string[]>>(
      groupPermissionCacheKey
    );

    // remove key version in communityPermissions and groupPermissions
    delete communityPermissions[versionPermissionCacheKey];
    delete groupPermissions[versionPermissionCacheKey];

    permissions.communities = communityPermissions;
    permissions.groups = groupPermissions;

    if (!communityPermissions || !groupPermissions) {
      const response = await this._groupHttpService.get(GROUP_ENDPOINT.INTERNAL.USER_PERMISSIONS, {
        params: { userId },
      });

      if (response.status !== HttpStatus.OK) {
        return null;
      }

      permissions.communities = response.data['data'].communities;
      permissions.groups = response.data['data'].groups;
    }

    return permissions;
  }

  public async canCudTags(userId: string, rootGroupId: string): Promise<boolean> {
    try {
      const response = await this._groupHttpService.get(
        AxiosHelper.injectParamsToStrUrl(GROUP_ENDPOINT.INTERNAL.CHECK_CUD_TAG, {
          userId,
          rootGroupId,
        })
      );
      return response.data.data;
    } catch (e) {
      this._logger.error(`[canCudTags] ${e.message}`);
      return false;
    }
  }
}
