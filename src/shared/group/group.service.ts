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
        closed: [],
        private: [],
        secret: [],
      };
    }
    return group;
  }

  public async getMany(groupIds: string[]): Promise<GroupSharedDto[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(groupIds))].map(
      (groupId) => `${AppHelper.getRedisEnv()}SG:${groupId}`
    );
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
   * Get groupId and childIds(user joinned) to show posts in timeline and in search
   * Anonymous: can not see posts
   * Guest can see post in current group(joinned or close) and child group(joined)
   */
  public getGroupIdAndChildIdsUserJoined(group: GroupSharedDto, authUser: UserDto): string[] {
    if (!authUser) {
      return [];
    }

    const groupIdsUserJoined = authUser.profile.groups;
    const childGroupIds = [
      ...group.child.open,
      //...group.child.closed,
      ...group.child.private,
      ...group.child.secret,
    ];
    const filterGroupIdsUserJoined = [group.id, ...childGroupIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === GroupPrivacy.OPEN) {
      filterGroupIdsUserJoined.push(group.id);
    }
    if (
      group.privacy === GroupPrivacy.CLOSED &&
      this._hasJoinedCommunity(groupIdsUserJoined, group.rootGroupId)
    ) {
      filterGroupIdsUserJoined.push(group.id);
    }
    return ArrayHelper.arrayUnique(filterGroupIdsUserJoined);
  }

  private _hasJoinedCommunity(groupIdsUserJoined: string[], rootGroupId: string): boolean {
    return groupIdsUserJoined.includes(rootGroupId);
  }
  private _getGroupIdsGuestCanSeePost(group: GroupSharedDto): string[] {
    if (group.privacy === GroupPrivacy.OPEN) {
      return [group.id];
    }
    return [];
  }

  public filterGroupIdsUsersJoined(groupIds: string[], user: UserDto): string[] {
    const groupIdsUserJoined = user.profile.groups || [];
    return groupIds.filter((groupId) => groupIdsUserJoined.includes(groupId));
  }
}
