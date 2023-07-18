import { Inject } from '@nestjs/common';
import { FindByUsernameOption, FindUserOption, IUserApplicationService, UserDto } from '.';
import { UserEntity } from '../domain/model/user';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface/user.repository.interface';

export class UserApplicationService implements IUserApplicationService {
  @Inject(USER_REPOSITORY_TOKEN)
  private readonly _repo: IUserRepository;

  public async findByUserName(username: string, options?: FindByUsernameOption): Promise<UserDto> {
    if (!username) return null;
    const user = await this._repo.findByUserName(username);
    if (!user) return null;
    const result = this._toDto(user);
    if (!options?.withGroupJoined) {
      delete result.groups;
    }

    return result;
  }

  public async findOne(userId: string, options?: FindUserOption): Promise<UserDto> {
    if (!userId) return null;
    const user = await this._repo.findOne(userId);
    if (!user) return null;
    if (options && options.withPermission) {
      const permissions = await this._repo.getPermissionsByUserId(user.get('id'));
      user.setPermissions(permissions);
    }
    const result = this._toDto(user);
    if (!options?.withGroupJoined) {
      delete result.groups;
    }

    return result;
  }

  public async findAllByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]> {
    if (!userIds || userIds?.length === 0) return [];
    const rows = await this._repo.findAllByIds(userIds);

    if (options && options.withPermission) {
      const permissionsCached = await this._repo.getPermissionsByUserIds(userIds);
      rows.forEach((row) => {
        const permissions = permissionsCached[userIds.indexOf(row.get('id'))];
        if (permissions) row.setPermissions(permissions);
      });
    }

    return rows.map((row) => {
      const user = this._toDto(row);
      if (!options?.withGroupJoined) {
        delete user.groups;
      }
      return user;
    });
  }

  public async canCudTagInCommunityByUserId(userId: string, communityId: string): Promise<boolean> {
    return this._repo.canCudTagInCommunityByUserId(userId, communityId);
  }

  private _toDto(user: UserEntity): UserDto {
    return new UserDto({
      id: user.get('id'),
      username: user.get('username'),
      fullname: user.get('fullname'),
      email: user.get('email'),
      avatar: user.get('avatar'),
      groups: user.get('groups'),
      permissions: user.get('permissions'),
      isDeactivated: user.get('isDeactivated'),
      isVerified: user.get('isVerified'),
      showingBadges: user.get('showingBadges'),
    });
  }
}
