import { UserEntity, UserPermission } from '../model/user';

export interface IUserRepository {
  findByUserName(username: string): Promise<UserEntity>;

  findOne(id: string): Promise<UserEntity>;

  findAllByIds(ids: string[]): Promise<UserEntity[]>;

  getPermissionsByUserId(id: string): Promise<UserPermission>;

  getPermissionsByUserIds(userIds: string[]): Promise<UserPermission[]>;

  canCudTagInCommunityByUserId(userId: string, rootGroupId: string): Promise<boolean>;
}

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';
