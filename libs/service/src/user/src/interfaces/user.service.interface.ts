import { IUser } from './user.interface';

export interface IUserService {
  findByUserName(username: string): Promise<IUser>;
  findOne(id: string): Promise<IUser>;
  findAllByIds(ids: string[]): Promise<IUser[]>;
  canCudTagInCommunityByUserId(userId: string, rootGroupId: string): Promise<boolean>;
}
