import { CACHE_KEYS } from '@beincom/constants';
import { UserDto as ProfileUserDto } from '@beincom/dto';
import { AxiosHelper } from '@libs/common/helpers';
import { Traceable } from '@libs/common/modules/opentelemetry';
import { GROUP_HTTP_TOKEN, IHttpService } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { GROUP_ENDPOINT } from '@libs/service/group/src/endpoint.constant';
import { IUserService, ShowingBadgeDto } from '@libs/service/user';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';

import { UserDto, UserPermissionDto } from './user.dto';

@Traceable()
@Injectable()
export class UserService implements IUserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(GROUP_HTTP_TOKEN) private readonly _groupHttpService: IHttpService
  ) {}

  public async findProfileAndPermissionByUsername(username: string): Promise<UserDto> {
    try {
      const user = await this._getUserFromCacheByUserName(username);
      user.permissions = await this.getPermissionByUserId(user.id);
      return user;
    } catch (e) {
      this._logger.error(e);
      return null;
    }
  }

  public async findProfileAndPermissionById(id: string): Promise<UserDto> {
    try {
      const [username] = await this._getUsernamesFromCacheByUserIds([id]);
      const user = await this._getUserFromCacheByUserName(username);
      user.permissions = await this.getPermissionByUserId(user.id);
      return user;
    } catch (e) {
      this._logger.error(e);
      return null;
    }
  }

  public async findById(id: string): Promise<UserDto> {
    try {
      const [username] = await this._getUsernamesFromCacheByUserIds([id]);
      return this._getUserFromCacheByUserName(username);
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
      const usernames = await this._getUsernamesFromCacheByUserIds(uniq(ids));
      return this._getUsersFromCacheByUserNames(usernames);
    } catch (e) {
      this._logger.error(e);
      return [];
    }
  }

  private async _getUserFromCacheByUserName(username: string): Promise<UserDto> {
    if (!username) {
      return null;
    }

    const [userProfile] = await this._getUserProfilesFromCacheByUserNames([username]);
    if (!userProfile) {
      return null;
    }

    const showingBadges = userProfile.showingBadges as ShowingBadgeDto[];
    const joinedGroups = await this._getJoinedGroupsFromCacheByUserId(userProfile.id);

    return new UserDto({ ...userProfile, showingBadges, groups: joinedGroups });
  }

  private async _getUsersFromCacheByUserNames(usernames: string[]): Promise<UserDto[]> {
    if (!usernames.length) {
      return [];
    }

    const usersProfile = await this._getUserProfilesFromCacheByUserNames(usernames);

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

      if (err) {
        this._logger.error(err);
        return;
      }

      const userProfile = usersProfile[index];
      const showingBadges = userProfile.showingBadges as ShowingBadgeDto[];
      const joinedGroups = value as string[];
      users.push(new UserDto({ ...userProfile, showingBadges, groups: joinedGroups }));
    });

    return users;
  }

  private async _getUsernamesFromCacheByUserIds(userIds: string[]): Promise<string[]> {
    const keys = userIds.map((userId) => `${CACHE_KEYS.USERNAME}:${userId}`);
    return this._store.mget(keys);
  }

  private async _getUserProfilesFromCacheByUserNames(
    usernames: string[]
  ): Promise<ProfileUserDto[]> {
    const keys = usernames.map((username) => `${CACHE_KEYS.USER_PROFILE}:${username}`);
    return this._store.mget(keys);
  }

  private async _getJoinedGroupsFromCacheByUserId(userId: string): Promise<string[]> {
    return this._store.getSets(`${CACHE_KEYS.JOINED_GROUPS}:${userId}`);
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
