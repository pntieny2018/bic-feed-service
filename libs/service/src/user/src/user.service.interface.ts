import { UserDto, UserPermissionDto } from './user.dto';

export const USER_SERVICE_TOKEN = 'USER_SERVICE_TOKEN';

export interface IUserService {
  findProfileByUsername(username: string): Promise<UserDto>;
  findById(id: string): Promise<UserDto>;
  findAllByIds(ids: string[]): Promise<UserDto[]>;
  canCudTags(userId: string, rootGroupId: string): Promise<boolean>;
  getGroupIdsJoinedByUserId(userId: string): Promise<string[]>;
  getPermissionByUserId(userId: string): Promise<UserPermissionDto>;
}
