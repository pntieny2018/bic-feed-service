import { IGroup, IGroupMember } from '@libs/service/group/src/interface';
import { UserDto } from '@libs/service/user';

export interface IGroupService {
  findById(groupId: string): Promise<IGroup>;

  findAllByIds(groupIds: string[]): Promise<IGroup[]>;

  getGroupMembersDividedByRole(
    actor: UserDto,
    groupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<IGroupMember[]>;

  getCommunityAdmins(
    rootGroupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<{
    admins: Record<string, string[]>;
    owners: Record<string, string[]>;
  }>;
}
