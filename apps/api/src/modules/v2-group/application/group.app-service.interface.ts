import { UserDto } from '@libs/service/user';

import { GroupDto } from './group.dto';

export interface IGroupApplicationService {
  findOne(id: string): Promise<GroupDto>;

  findAllByIds(ids: string[]): Promise<GroupDto[]>;

  getGroupIdAndChildIdsUserJoined(group: GroupDto, userGroupIds: string[]): string[];

  getGroupAdminIds(
    actor: UserDto,
    groupIds: string[],
    offset?: number,
    limit?: number
  ): Promise<string[]>;

  getAdminIds(
    rootGroupIds: string[],
    offset?: number,
    limit?: number
  ): Promise<{
    admins: Record<string, string[]>;
    owners: Record<string, string[]>;
  }>;
}

export const GROUP_APPLICATION_TOKEN = 'GROUP_APPLICATION_TOKEN';
