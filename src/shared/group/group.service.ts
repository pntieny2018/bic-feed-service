import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { GroupPrivacy, GroupSharedDto } from './dto';
import { UserDto } from '../../modules/auth';
import { ArrayHelper } from '../../common/helpers';
import { AppHelper } from '../../common/helpers/app.helper';

@Injectable()
export class GroupService {
  public constructor(private _store: RedisService) {}

  public async get(groupId: string): Promise<GroupSharedDto> {
    const group = await this._store.get<GroupSharedDto>(`${AppHelper.getRedisEnv()}SG:${groupId}`);
    if (group && !group?.child) {
      group.child = {
        open: [],
        public: [],
        private: [],
        secret: [],
      };
    }
    return group;
  }

  public async getMany(groupIds: string[]): Promise<GroupSharedDto[]> {
    const keys = [...new Set(groupIds)].map((groupId) => `${AppHelper.getRedisEnv()}SG:${groupId}`);
    if (keys.length) {
      const groups = await this._store.mget(keys);
      return groups.filter((g) => g !== null);
    }
    return [];
  }

  /**
   * Check user was join one or more group audience
   * @param groupIds Number[]
   * @param myGroupIds Number[]
   */
  public isMemberOfSomeGroups(groupIds: string[], myGroupIds: string[]): boolean {
    return groupIds.some((groupId) => myGroupIds.includes(groupId));
  }

  /**
   * Check user must join all group audience
   * @param groupIds Number[]
   * @param myGroupIds Number[]
   */
  public isMemberOfGroups(groupIds: string[], myGroupIds: string[]): boolean {
    return groupIds.every((groupId) => myGroupIds.includes(groupId));
  }

  /**
   * Get groupId and childIds(user joinned) to show posts in timeline
   */
  public getGroupIdAndChildIdsUserJoined(group: GroupSharedDto, authUser: UserDto): string[] {
    if (!authUser) {
      return this._getGroupIdsGuestCanSeePost(group);
    }

    const groupIdsUserJoined = authUser.profile.groups;
    const childIds = [
      ...group.child.public,
      ...group.child.open,
      ...group.child.private,
      ...group.child.secret,
    ];
    const filterGroupIdsUserJoined = [group.id, ...childIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === GroupPrivacy.PUBLIC) {
      filterGroupIdsUserJoined.push(group.id);
    }
    // if (group.privacy === GroupPrivacy.OPEN && this._hasJoinedCommunity(groupIdsUserJoined, group.rootGroupid)) {
    //   filterGroupIdsUserJoined.push(group.id);
    // }
    return ArrayHelper.arrayUnique(filterGroupIdsUserJoined);
  }

  /**
   * Get groupId and childIds(user joinned or open or public) to show posts in timeline
   */
  public getGroupIdAndChildIdsUserCanReadPost(group: GroupSharedDto, authUser: UserDto): string[] {
    if (!authUser) {
      return this._getGroupIdsGuestCanSeePost(group);
    }

    const groupIdsUserJoined = authUser.profile.groups;
    const childIds = [...group.child.private, ...group.child.secret];
    const filterGroupIdsUserJoined = [group.id, ...childIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    const publicOrOpenGroupIds = [...group.child.public, ...group.child.open];
    if (group.privacy === GroupPrivacy.PUBLIC) {
      publicOrOpenGroupIds.push(group.id);
    }
    // if (group.privacy === GroupPrivacy.OPEN && this._hasJoinedCommunity(groupIdsUserJoined, group.rootGroupid)) {
    //   filterGroupIdsUserJoined.push(group.id);
    // }
    return ArrayHelper.arrayUnique([...filterGroupIdsUserJoined, ...publicOrOpenGroupIds]);
  }

  private _hasJoinedCommunity(groupIdsUserJoined: string[], rootGroupId: string): boolean {
    return groupIdsUserJoined.includes(rootGroupId);
  }
  private _getGroupIdsGuestCanSeePost(group: GroupSharedDto): string[] {
    if (group.privacy === GroupPrivacy.PUBLIC) {
      return [group.id];
    }
    return [];
  }
}
