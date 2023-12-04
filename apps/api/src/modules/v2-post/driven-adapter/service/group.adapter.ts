import { PRIVACY, ROLE_TYPE } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { GroupDto } from '@libs/service/group/src/group.dto';
import {
  GROUP_SERVICE_TOKEN,
  IGroupService,
} from '@libs/service/group/src/group.service.interface';
import { Inject, Injectable } from '@nestjs/common';

import { GroupNotFoundException } from '../../domain/exception';
import { GetUserIdsInGroupsProps, IGroupAdapter } from '../../domain/service-adapter-interface';

@Injectable()
export class GroupAdapter implements IGroupAdapter {
  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupService: IGroupService
  ) {}

  public async getGroupById(groupId: string): Promise<GroupDto> {
    const group = await this._groupService.findById(groupId);
    if (!group) {
      throw new GroupNotFoundException();
    }
    return group;
  }

  public async getGroupsByIds(groupIds: string[]): Promise<GroupDto[]> {
    return this._groupService.findAllByIds(groupIds);
  }

  public async isAdminInAnyGroups(userId: string, groupIds: string[]): Promise<boolean> {
    return this._groupService.isAdminInAnyGroups(userId, groupIds);
  }

  public getGroupIdsAndChildIdsUserJoined(group: GroupDto, groupIdsUserJoined: string[]): string[] {
    const childGroupIds = [
      ...group.child.open,
      ...group.child.closed,
      ...group.child.private,
      ...group.child.secret,
    ];
    const groupAndChildIdsUserJoined = [group.id, ...childGroupIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === PRIVACY.OPEN) {
      groupAndChildIdsUserJoined.push(group.id);
    }

    const hasJoinedCommunity = groupIdsUserJoined.includes(group.rootGroupId);
    if (group.privacy === PRIVACY.CLOSED && hasJoinedCommunity) {
      groupAndChildIdsUserJoined.push(group.id);
    }
    return ArrayHelper.arrayUnique(groupAndChildIdsUserJoined);
  }

  public async getGroupAdminIds(groupIds: string[]): Promise<string[]> {
    const groupMembers = await this._groupService.getUserRoleInGroups(groupIds, [
      ROLE_TYPE.GROUP_ADMIN,
    ]);
    const groupAdmins = groupMembers.groupAdmin;

    const adminIds = Object.values(groupAdmins).flat();

    return ArrayHelper.arrayUnique(adminIds);
  }

  public async getGroupAdminMap(groupIds: string[]): Promise<{ [groupId: string]: string[] }> {
    const groupMembers = await this._groupService.getUserRoleInGroups(groupIds, [
      ROLE_TYPE.GROUP_ADMIN,
    ]);

    return groupMembers.groupAdmin;
  }

  public async getUserIdsInGroups(
    props: GetUserIdsInGroupsProps
  ): Promise<{ list: string[]; cursor: string }> {
    return this._groupService.getUserIdsInGroups(props);
  }

  public async getCommunityAdmins(groupIds: string[]): Promise<{
    communityAdmin: Record<string, string[]>;
    owners: Record<string, string[]>;
  }> {
    const communityRoles = await this._groupService.getUserRoleInGroups(groupIds, [
      ROLE_TYPE.COMMUNITY_ADMIN,
      ROLE_TYPE.OWNER,
    ]);

    return {
      communityAdmin: communityRoles.communityAdmin,
      owners: communityRoles.owner,
    };
  }
}
