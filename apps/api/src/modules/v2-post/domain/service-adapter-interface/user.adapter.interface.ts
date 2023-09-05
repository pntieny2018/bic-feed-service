import { UserDto } from '@libs/service/user';

export type FindUserOption = {
  withPermission?: boolean;
  withGroupJoined?: boolean;
};

export const USER_ADAPTER = 'USER_ADAPTER';

export interface IUserAdapter {
  getUsersByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]>;
  findAllAndFilterByPersonalVisibility(userIds: string[], authUserId: string): Promise<UserDto[]>;
}
