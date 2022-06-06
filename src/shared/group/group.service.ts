import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { ChildGroup, GroupPrivacy, GroupSharedDto } from './dto';
import { UserDto } from '../../modules/auth';

@Injectable()
export class GroupService {
  public constructor(private _store: RedisService) {}

  public async get(groupId: number): Promise<GroupSharedDto> {
    const group = await this._store.get<GroupSharedDto>(`SG:${groupId}`);
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

  public async getMany(groupIds: number[]): Promise<GroupSharedDto[]> {
    const keys = [...new Set(groupIds)].map((groupId) => `SG:${groupId}`);
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
  public isMemberOfSomeGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return groupIds.some((groupId) => myGroupIds.includes(groupId));
  }

  /**
   * Check user must join all group audience
   * @param groupIds Number[]
   * @param myGroupIds Number[]
   */
  public isMemberOfGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return groupIds.every((groupId) => myGroupIds.includes(groupId));
  }

  public getGroupIdsCanAccess(group: GroupSharedDto, authUser: UserDto): number[] {
    let groupIds = [];
    if (group.privacy === GroupPrivacy.OPEN || group.privacy === GroupPrivacy.PUBLIC) {
      groupIds = [...group.child.public, ...group.child.open];

      const privateGroupIds = [...group.child.private, ...group.child.secret].filter((groupId) =>
        authUser.profile.groups.includes(groupId)
      );
      groupIds.push(...privateGroupIds, group.id);
    } else {
      groupIds = [group.id, ...group.child.private, ...group.child.secret].filter((groupId) =>
        authUser.profile.groups.includes(groupId)
      );
      groupIds.push(...group.child.open);
      groupIds.push(...group.child.public);
    }
    return groupIds;
  }
}
