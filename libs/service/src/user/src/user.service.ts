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

  public async findProfileAndPermissionByUsername(username: string): Promise<UserDto> {
    try {
      const user = await this._getUserDtoByUserName(username);
      user.permissions = await this._getPermissionByUserId(user.id);
      return user;
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

    const showingBadges = userProfile.showingBadges as ShowingBadgeDto[];
    const joinedGroups = await this._getJoinedGroupsByUserIdFromCache(userProfile.id);

    return new UserDto({ ...userProfile, showingBadges, groups: joinedGroups });
  }

  private async _getUsersDtoByUserNames(usernames: string[]): Promise<UserDto[]> {
    if (usernames.length === 0) {
      return [];
    }

    const usersProfile = await this._getProfileUsersByUserNamesFromCache(usernames);

    const pipeline = this._store.getClient().pipeline();
    const results = new Map();

    usersProfile.forEach((userProfile) => {
      const key = `${CACHE_KEYS.JOINED_GROUPS}:${userProfile.id}`;
      pipeline.smembers(key);

      results.set(userProfile, key);
    });

    const joinedGroup = await pipeline.exec();
    const users: UserDto[] = [];
    joinedGroup.forEach((result, index) => {
      const [err, value] = result;

      const userProfile = usersProfile[index];
      const showingBadges = userProfile.showingBadges as ShowingBadgeDto[];
      const joinedGroups = value as string[];
      users.push(new UserDto({ ...userProfile, showingBadges, groups: joinedGroups }));
    });

    return users;
  }

  private async _getUsersFromCacheByIds(ids: string[]): Promise<UserDto[]> {
    if (!ids.length) {
      return [];
    }

    const usernames = await this._getUsernamesFromUserIdsInCache(ids);

    return this._getUsersDtoByUserNames(usernames);
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

    return userApis.map((user) => {
      const showingBadgesWithCommunity: ShowingBadgeDto[] = user?.showingBadges?.map((badge) => ({
        ...badge,
        community: badge.community || null,
      }));

      return new UserDto({ ...user, showingBadges: showingBadgesWithCommunity });
    });
  }

  private async _getUsernameFromUserIdInCache(userId: string): Promise<string> {
    return this._store.get<string>(`${CACHE_KEYS.USERNAME}:${userId}`);
  }

  private async _getUsernamesFromUserIdsInCache(userIds: string[]): Promise<string[]> {
    const keys = userIds.map((userId) => `${CACHE_KEYS.USERNAME}:${userId}`);
    return this._store.mget(keys);
  }

  private async _getProfileUserByUserNameFromCache(username: string): Promise<ProfileUserDto> {
    return this._store.get<ProfileUserDto>(`${CACHE_KEYS.USER_PROFILE}:${username}`);
  }

  private async _getProfileUsersByUserNamesFromCache(
    usernames: string[]
  ): Promise<ProfileUserDto[]> {
    const keys = usernames.map((username) => `${CACHE_KEYS.USER_PROFILE}:${username}`);
    return this._store.mget(keys);
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

    const isExistCommunityPermissionCacheKey = await this._store.existKey(
      communityPermissionCacheKey
    );
    const isExistGroupPermissionCacheKey = await this._store.existKey(groupPermissionCacheKey);

    if (!isExistCommunityPermissionCacheKey || !isExistGroupPermissionCacheKey) {
      const response = await this._groupHttpService.get(
        AxiosHelper.injectParamsToStrUrl(GROUP_ENDPOINT.INTERNAL.USER_PERMISSIONS, {
          userId,
        })
      );

      if (response.status !== HttpStatus.OK) {
        return null;
      }

      permissions.communities = response.data['data'].communities;
      permissions.groups = response.data['data'].groups;
      return permissions;
    }

    const communityPermissions = await this._store.hgetall<Record<string, string>>(
      communityPermissionCacheKey
    );

    const groupPermissions = await this._store.hgetall<Record<string, string>>(
      groupPermissionCacheKey
    );

    // remove key version in communityPermissions and groupPermissions
    delete communityPermissions[versionPermissionCacheKey];
    delete groupPermissions[versionPermissionCacheKey];

    for (const communityId in communityPermissions) {
      permissions.communities[communityId] = JSON.parse(communityPermissions[communityId]);
    }

    for (const groupId in groupPermissions) {
      permissions.groups[groupId] = JSON.parse(groupPermissions[groupId]);
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
