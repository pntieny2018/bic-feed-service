import { GroupDto, GroupMember } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

export interface IGroupService {
  findById(groupId: string): Promise<GroupDto>;

  findAllByIds(groupIds: string[]): Promise<GroupDto[]>;

  getGroupMembersDividedByRole(
    actor: UserDto,
    groupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<GroupMember[]>;

  getCommunityAdmins(
    rootGroupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<{
    admins: Record<string, string[]>;
    owners: Record<string, string[]>;
  }>;
}

export const GROUP_SERVICE_TOKEN = 'GROUP_SERVICE_TOKEN';
