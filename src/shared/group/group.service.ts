import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { ChildGroup, GroupPrivacy, GroupSharedDto } from './dto';
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
   * Get all groupIds(include all child) that user can acess to SEE posts (allow public, open)
   *
   * @param group
   * @param authUser
   * @returns
   */
  public getGroupIdsCanAccess(group: GroupSharedDto, authUser: UserDto): string[] {
    let groupIds = [];
    if (!authUser) return ArrayHelper.arrayUnique(group.child.public);
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
    return ArrayHelper.arrayUnique(groupIds);
  }

  /**
   * Get all groupIds(include all child) that user can acess to SEE articles (allow public, open, secret)
   *
   * @param group
   * @param authUser
   * @returns
   */
  public getGroupIdsCanAccessArticle(group: GroupSharedDto, authUser: UserDto): string[] {
    let groupIds = [];
    if (
      group.privacy === GroupPrivacy.OPEN ||
      group.privacy === GroupPrivacy.PUBLIC ||
      group.privacy === GroupPrivacy.PRIVATE
    ) {
      groupIds = [...group.child.public, ...group.child.open, ...group.child.private];

      const privateGroupIds = [...group.child.secret].filter((groupId) =>
        authUser.profile.groups.includes(groupId)
      );
      groupIds.push(...privateGroupIds, group.id);
    } else {
      groupIds = [group.id, ...group.child.secret].filter((groupId) =>
        authUser.profile.groups.includes(groupId)
      );
      groupIds.push(...group.child.open);
      groupIds.push(...group.child.public);
    }
    return ArrayHelper.arrayUnique(groupIds);
  }
}
