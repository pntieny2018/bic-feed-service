import { UserDto } from '.';

export interface IUserApplicationService {
  findOne(id: string): Promise<UserDto>;
  findAllByIds(ids: string[]): Promise<UserDto[]>;
}

export const USER_APPLICATION_TOKEN = 'USER_APPLICATION_TOKEN';
