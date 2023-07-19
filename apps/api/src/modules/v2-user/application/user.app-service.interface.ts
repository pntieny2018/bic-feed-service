import { UserDto } from '.';
import { GroupDto } from '../../v2-group/application';

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

  canCudTagInCommunityByUserId(userId: string, communityId: string): Promise<boolean>;
}

export const USER_APPLICATION_TOKEN = 'USER_APPLICATION_TOKEN';
