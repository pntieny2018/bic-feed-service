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
   * Get all groupIds(include all child) that user can acess to SEE posts (allow public, open)
   *
   * @param group
   * @param authUser
   * @returns
   */
  public getGroupIdsCanAccess(group: GroupSharedDto, authUser: UserDto): string[] {
    if (!authUser) {
      if (group.privacy === GroupPrivacy.PUBLIC) {
        return [group.id];
      }
      return [];
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

    if (group.privacy === GroupPrivacy.PUBLIC || group.privacy === GroupPrivacy.OPEN) {
      filterGroupIdsUserJoined.push(group.id);
    }
    return ArrayHelper.arrayUnique(filterGroupIdsUserJoined);
  }

  /**
   * Get all groupIds(include all child) that user can acess to SEE articles (allow public, open, secret)
   *
   * @param group
   * @param authUser
   * @returns
   */
  public getGroupIdsCanAccessArticle(group: GroupSharedDto, authUser: UserDto): string[] {
    return this.getGroupIdsCanAccess(group, authUser);
  }
}
