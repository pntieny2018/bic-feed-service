import { UserEntity, UserId } from '../model/user';

export interface IUserRepository {
  findOne(id: UserId): Promise<UserEntity>;
  findAllByIds(ids: UserId[]): Promise<UserEntity[]>;
}

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';
