import { Inject } from '@nestjs/common';
import { FindUserOption, IUserApplicationService, UserDto } from '.';
import { UserEntity } from '../domain/model/user';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface/user.repository.interface';

export class UserApplicationService implements IUserApplicationService {
  @Inject(USER_REPOSITORY_TOKEN)
  private readonly _repo: IUserRepository;

  public async findByUserName(username: string, options?: FindUserOption): Promise<UserDto> {
    const user = await this._repo.findByUserName(username);
    if (!user) return null;
    if (options && options.withPermission) {
      const permission = await this._repo.getPermissionsByUserId(user.get('id'));
      user.setPermission(permission);
    }
    return this._toDto(user);
  }

  public async findOne(userId: string, options?: FindUserOption): Promise<UserDto> {
    const user = await this._repo.findOne(userId);
    if (options && options.withPermission) {
      const permission = await this._repo.getPermissionsByUserId(user.get('id'));
      user.setPermission(permission);
    }
    return this._toDto(user);
  }

  public async findAllByIds(userIds: string[]): Promise<UserDto[]> {
    const rows = await this._repo.findAllByIds(userIds);
    return rows.map((row) => this._toDto(row));
  }

  public async canCudTagInCommunityByUserId(userId: string, communityId: string): Promise<boolean> {
    return this._repo.canCudTagInCommunityByUserId(userId, communityId);
  }

  private _toDto(user: UserEntity): UserDto {
    return {
      id: user.get('id'),
      username: user.get('username'),
      fullname: user.get('fullname'),
      email: user.get('email'),
      avatar: user.get('avatar'),
      groups: user.get('groups'),
      permissions: user.get('permission'),
    };
  }
}
