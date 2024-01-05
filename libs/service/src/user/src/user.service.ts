import { CACHE_KEYS } from '@beincom/constants';
import { UserDto as UserProfileDto } from '@beincom/dto';
import { AxiosHelper } from '@libs/common/helpers';
import { Traceable } from '@libs/common/modules/opentelemetry';
import { GROUP_HTTP_TOKEN, IHttpService, USER_HTTP_TOKEN } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { GROUP_ENDPOINT } from '@libs/service/group/src/endpoint.constant';
import { IUserService, USER_ENDPOINT } from '@libs/service/user';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';

import { UserDto, UserPermissionDto, UserPublicProfileDto } from './user.dto';

@Traceable()
@Injectable()
export class UserService implements IUserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(GROUP_HTTP_TOKEN) private readonly _groupHttpService: IHttpService,
    @Inject(USER_HTTP_TOKEN) private readonly _userHttpService: IHttpService
  ) {}

  public async findById(id: string): Promise<UserDto> {
    try {
      return this._getUserByUserId(id);
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
      return this._getUsersByUserIds(ids);
    } catch (e) {
      this._logger.error(e);
      return [];
    }
  }

  public async findByUsername(username: string): Promise<UserDto> {
    if (!username) {
      return null;
    }

    const userProfile =
      (await this._getUserProfileFromCacheByUserName(username)) ||
      (await this._getUserProfileFromApiByUserName(username));

    if (!userProfile) {
      return null;
    }

    const joinedGroups = await this._getJoinedGroupsFromCacheByUserId(userProfile.id);

    return new UserDto({ ...userProfile, groups: joinedGroups });
  }

  private async _getUserByUserId(userId: string): Promise<UserDto> {
    const [username] = await this._getUsernamesFromCacheByUserIds([userId]);

    const userProfile =
      (await this._getUserProfileFromCacheByUserName(username)) ||
      (await this._getUsersProfileFromApiByUserIds([userId]))?.[0];

    if (!userProfile) {
      return null;
    }

    const joinedGroups = await this._getJoinedGroupsFromCacheByUserId(userProfile.id);

    return new UserDto({ ...userProfile, groups: joinedGroups });
  }

  private async _getUsersByUserIds(userIds: string[]): Promise<UserDto[]> {
    if (!userIds.length) {
      return [];
    }

    const usernames = await this._getUsernamesFromCacheByUserIds(uniq(userIds));
    let usersProfile: UserPublicProfileDto[] = await this._getUsersProfileFromCacheByUserNames(
      usernames
    );

    if (!usersProfile?.length) {
      usersProfile = await this._getUsersProfileFromApiByUserIds(userIds);
    }

    if (!usersProfile?.length) {
      return [];
    }

    const pipeline = this._store.getClient().pipeline();

    usersProfile.forEach((userProfile) => {
      const key = `${CACHE_KEYS.JOINED_GROUPS}:${userProfile.id}`;
      pipeline.smembers(key);
    });

    const joinedGroup = await pipeline.exec();
    const users: UserDto[] = [];
    joinedGroup.forEach((result, index) => {
      const [err, value] = result;

      if (err) {
        this._logger.error(err);
        return;
      }

      const userProfile = usersProfile[index];
      const joinedGroups = value as string[];
      users.push(new UserDto({ ...userProfile, groups: joinedGroups }));
    });

    return users;
  }

  private async _getUsernamesFromCacheByUserIds(userIds: string[]): Promise<string[]> {
    if (userIds?.length) {
      return [];
    }

    const keys = userIds.map((userId) => `${CACHE_KEYS.USERNAME}:${userId}`);
    return this._store.mget(keys);
  }

  private async _getUserProfileFromCacheByUserName(username: string): Promise<UserProfileDto> {
    return this._store.get(`${CACHE_KEYS.USER_PROFILE}:${username}`);
  }

  private async _getUsersProfileFromCacheByUserNames(
    usernames: string[]
  ): Promise<UserProfileDto[]> {
    if (!usernames?.length) {
      return [];
    }

    const keys = usernames.map((username) => `${CACHE_KEYS.USER_PROFILE}:${username}`);
    return this._store.mget(keys);
  }

  private async _getJoinedGroupsFromCacheByUserId(userId: string): Promise<string[]> {
    return this._store.getSets(`${CACHE_KEYS.JOINED_GROUPS}:${userId}`);
  }

  private async _getUserProfileFromApiByUserName(username: string): Promise<UserProfileDto> {
    try {
      const response = await this._userHttpService.get(
        AxiosHelper.injectParamsToStrUrl(USER_ENDPOINT.INTERNAL.GET_USER_PROFILE_BY_USERNAME, {
          username,
        })
      );
      return response.data.data;
    } catch (e) {
      this._logger.error(`[_getUserProfileFromApiByUserName] ${e.message}`);
      return null;
    }
  }

  private async _getUsersProfileFromApiByUserIds(
    userIds: string[]
  ): Promise<UserPublicProfileDto[]> {
    try {
      const response = await this._userHttpService.post(USER_ENDPOINT.INTERNAL.GET_USERS_PROFILE, {
        user_ids: userIds,
      });
      return response.data.data;
    } catch (e) {
      this._logger.error(`[_getUsersProfileFromApiByUserIds] ${e.message}`);
      return [];
    }
  }

  public async getPermissionByUserId(userId: string): Promise<UserPermissionDto> {
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

  public async getGroupIdsJoinedByUserId(userId: string): Promise<string[]> {
    return this._getJoinedGroupsFromCacheByUserId(userId);
  }
}
