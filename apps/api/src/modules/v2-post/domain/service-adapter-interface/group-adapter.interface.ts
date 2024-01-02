import { GroupDto } from '@libs/service/group/src/group.dto';

export const GROUP_ADAPTER = 'GROUP_ADAPTER';
export interface IGroupAdapter {
  getGroupById(groupId: string): Promise<GroupDto>;
  getGroupsByIds(groupIds: string[]): Promise<GroupDto[]>;
  isAdminInAnyGroups(userId: string, groupIds: string[]): Promise<boolean>;
  getGroupIdsAndChildIdsUserJoined(group: GroupDto, userGroupIds: string[]): string[];
  getGroupAdminIds(groupIds: string[]): Promise<string[]>;
  getGroupAdminMap(groupIds: string[]): Promise<{ [groupId: string]: string[] }>;
  getCommunityAdmins(groupIds: string[]): Promise<{
    communityAdmin: Record<string, string[]>;
    owners: Record<string, string[]>;
  }>;
}
