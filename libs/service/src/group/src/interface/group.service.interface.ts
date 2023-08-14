import { IGroup, IGroupMember } from '@libs/service/group/src/interface';
import { IUser } from '@libs/service/user/src/interfaces';

export interface IGroupService {
  findById(groupId: string): Promise<IGroup>;

  findAllByIds(groupIds: string[]): Promise<IGroup[]>;

  getGroupMembersDividedByRole(
    actor: IUser,
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
