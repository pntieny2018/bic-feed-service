import { Inject } from '@nestjs/common';
import { IUserApplicationService, UserDto } from '.';
import { UserEntity, UserId } from '../domain/model/user';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface/user.repository.interface';

export class UserApplicationService implements IUserApplicationService {
  @Inject(USER_REPOSITORY_TOKEN)
  private readonly _repo: IUserRepository;

  public async findOne(id: string): Promise<UserDto> {
    const data = await this._repo.findOne(UserId.fromString(id));
    return this._toDto(data);
  }

  public async findAllByIds(ids: string[]): Promise<UserDto[]> {
    const userIds = ids.map((id) => UserId.fromString(id));
    const rows = await this._repo.findAllByIds(userIds);
    return rows.map((row) => this._toDto(row));
  }

  private _toDto(user: UserEntity): UserDto {
    return {
      id: user.get('id').value,
      username: user.get('username').value,
      email: user.get('email').value,
      avatar: user.get('avatar').value,
    };
  }
}
