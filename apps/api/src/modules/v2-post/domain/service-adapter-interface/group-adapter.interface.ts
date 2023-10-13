import { GroupDto } from '@libs/service/group/src/group.dto';

export const GROUP_ADAPTER = 'GROUP_ADAPTER';

export interface IGroupAdapter {
  getGroupsByIds(groupIds: string[]): Promise<GroupDto[]>;
  isAdminInAnyGroups(userId: string, groupIds: string[]): Promise<boolean>;
  getGroupIdAndChildIdsUserJoined(group: GroupDto, userGroupIds: string[]): string[];
}
