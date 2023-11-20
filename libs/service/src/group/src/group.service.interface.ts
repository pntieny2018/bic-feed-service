import { ROLE_TYPE } from '@beincom/constants';
import { GroupDto, GroupMember } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

export type UserRoleInGroup = {
  GROUP_ADMIN: ROLE_TYPE.GROUP_ADMIN;
  COMMUNITY_ADMIN: ROLE_TYPE.COMMUNITY_ADMIN;
  OWNER: ROLE_TYPE.OWNER;
  MEMBER: ROLE_TYPE.MEMBER;
};

export type GetUserRoleInGroupsResult = {
  [key in 'communityAdmin' | 'owner' | 'groupAdmin']: {
    [key: string]: string[];
  };
};

export type GetUserIdsInGroups = {
  groupIds: string[];
  notInGroupIds: string[];
  after?: string;
  limit?: number;
};
export interface IGroupService {
  findById(groupId: string): Promise<GroupDto>;

  findAllByIds(groupIds: string[]): Promise<GroupDto[]>;

  getGroupMembersDividedByRole(
    actor: UserDto,
    groupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<GroupMember[]>;

  getUserRoleInGroups(
    groupIds: string[],
    roles: ROLE_TYPE[]
  ): Promise<GetUserRoleInGroupsResult | null>;

  isAdminInAnyGroups(userId: string, groupIds: string[]): Promise<boolean>;
  getUserIdsInGroups(GetUserIdsInGroups): Promise<{
    list: string[];
    cursor: string;
  }>;
}

export const GROUP_SERVICE_TOKEN = 'GROUP_SERVICE_TOKEN';
