import { UserEntity } from '../model/user';

export interface IUserRepository {
  findByUserName(username: string): Promise<UserEntity>;

  findOne(id: string): Promise<UserEntity>;

  findAllByIds(ids: string[]): Promise<UserEntity[]>;

  findAllFromInternalByIds(ids: string[], authUserId: string): Promise<UserEntity[]>;

  canCudTagInCommunityByUserId(userId: string, rootGroupId: string): Promise<boolean>;
}

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';
