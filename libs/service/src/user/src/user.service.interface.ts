import { UserDto, UserPermissionDto } from './user.dto';

export const USER_SERVICE_TOKEN = 'USER_SERVICE_TOKEN';

export type FindUserOption = {
  withGroupJoined?: boolean;
};

export interface IUserService {
  findByUsername(username: string): Promise<UserDto>;
  findById(id: string, options?: FindUserOption): Promise<UserDto>;
  findAllByIds(ids: string[], options?: FindUserOption): Promise<UserDto[]>;
  canCudTags(userId: string, rootGroupId: string): Promise<boolean>;
  getGroupIdsJoinedByUserId(userId: string): Promise<string[]>;
  getPermissionByUserId(userId: string): Promise<UserPermissionDto>;
}
