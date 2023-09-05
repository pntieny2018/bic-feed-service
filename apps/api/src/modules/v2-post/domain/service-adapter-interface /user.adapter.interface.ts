import { UserDto } from '@libs/service/user';

export type FindUserOption = {
  withPermission?: boolean;
  withGroupJoined?: boolean;
};

export const USER_ADAPTER = 'USER_ADAPTER';

export interface IUserAdapter {
  getUserById(userId: string, options?: FindUserOption): Promise<UserDto>;
  getUsersByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]>;
}
