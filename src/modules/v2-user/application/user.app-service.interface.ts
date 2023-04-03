import { UserDto } from '.';

export type FindByUsernameOption = {
  withGroupJoined?: boolean;
};

export type FindUserOption = {
  withPermission?: boolean;
  withGroupJoined?: boolean;
};

export interface IUserApplicationService {
  findByUserName(username: string, options?: FindByUsernameOption): Promise<UserDto>;

  findOne(userId: string, options?: FindUserOption): Promise<UserDto>;

  findAllByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]>;
}

export const USER_APPLICATION_TOKEN = 'USER_APPLICATION_TOKEN';
