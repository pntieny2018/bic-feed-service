import { IGroup } from '@app/service/group/src/interface';
import { IUser } from '@app/service/user/src/interfaces';

export interface IGroupService {
  findOne(groupId: string): Promise<IGroup>;

  findAllByIds(groupIds: string[]): Promise<IGroup[]>;

  getGroupAdminIds(
    actor: IUser,
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
