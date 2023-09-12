import { UserDto } from './user.dto';

export const USER_SERVICE_TOKEN = 'USER_SERVICE_TOKEN';

export interface IUserService {
  findByUserName(username: string): Promise<UserDto>;
  findById(id: string): Promise<UserDto>;
  findAllByIds(ids: string[]): Promise<UserDto[]>;
}
