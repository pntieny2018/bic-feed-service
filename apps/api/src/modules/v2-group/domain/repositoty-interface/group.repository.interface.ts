import { UserDto } from '@libs/service/user';

import { GroupEntity } from '../model/group';

export interface IGroupRepository {
  findOne(groupId: string): Promise<GroupEntity>;

  findAllByIds(groupIds: string[]): Promise<GroupEntity[]>;

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

export const GROUP_REPOSITORY_TOKEN = 'GROUP_REPOSITORY_TOKEN';
