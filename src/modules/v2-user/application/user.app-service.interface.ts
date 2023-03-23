import { UserDto } from '.';

export type FindUserOption = {
  withPermission?: boolean;
  withGroupJoined?: boolean;
};
export interface IUserApplicationService {
  findByUserName(username: string, options?: FindUserOption): Promise<UserDto>;

  findOne(userId: string, options?: FindUserOption): Promise<UserDto>;

  findAllByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]>;

  checkMemberOfGroupIds(user: UserDto, groupids): Promise<void>;
}

export const USER_APPLICATION_TOKEN = 'USER_APPLICATION_TOKEN';
