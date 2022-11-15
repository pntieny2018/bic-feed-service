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
    return [
      {
        isCommunity: true,
        communityId: '010a9acb-92e1-46e6-9558-0a08e80cfb1c',
        id: '7462673a-8078-4ec3-a82c-0d1a81796618',
        icon: 'https://bic-dev-entity-attribute-s3-bucket.s3.ap-southeast-1.amazonaws.com/static/group/default-avatar.png',
        name: 'Thế giới Wibu',
        privacy: 'PUBLIC' as GroupPrivacy,
        rootGroupId: '7462673a-8078-4ec3-a82c-0d1a81796618',
        child: {
          public: ['1eceeefc-fd93-454a-ba38-100c31690a16', '48b9ed03-af3b-4ec7-ab60-2c68ef728a26'],
          open: [],
          private: [],
          secret: [],
        },
      },
    ]
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
    const childGroupIds = [
      ...group.child.public,
      ...group.child.open,
      ...group.child.private,
      ...group.child.secret,
    ];
    const filterGroupIdsUserJoined = [group.id, ...childGroupIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === GroupPrivacy.PUBLIC) {
      filterGroupIdsUserJoined.push(group.id);
    }
    if (
      group.privacy === GroupPrivacy.OPEN &&
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
    if (group.privacy === GroupPrivacy.PUBLIC) {
      return [group.id];
    }
    return [];
  }
}
