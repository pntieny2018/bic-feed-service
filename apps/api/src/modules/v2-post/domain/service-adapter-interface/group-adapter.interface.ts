import { GroupDto } from '@libs/service/group/src/group.dto';

export const GROUP_ADAPTER = 'GROUP_ADAPTER';

export interface IGroupAdapter {
  getGroupById(groupId: string): Promise<GroupDto>;
  getGroupsByIds(groupIds: string[]): Promise<GroupDto[]>;
  getGroupIdsAndChildIdsUserJoined(group: GroupDto, groupIdsUserJoined: string[]): string[];
}
