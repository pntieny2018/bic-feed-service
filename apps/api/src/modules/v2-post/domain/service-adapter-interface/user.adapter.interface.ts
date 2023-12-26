import { UserDto } from '@libs/service/user';

export type FindUserOption = {
  withGroupJoined?: boolean;
};

export const USER_ADAPTER = 'USER_ADAPTER';

export interface IUserAdapter {
  getUserById(userId: string, options?: FindUserOption): Promise<UserDto>;
  getUserByIdWithPermission(userId: string): Promise<UserDto>;
  getUsersByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]>;
  canCudTags(userId: string, groupId: string): Promise<boolean>;
  getGroupIdsJoinedByUserId(userId: string): Promise<string[]>;
}
