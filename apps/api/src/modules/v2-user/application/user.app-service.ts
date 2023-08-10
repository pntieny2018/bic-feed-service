import { Inject } from '@nestjs/common';
import { UserEntity, UserProps } from '../domain/model/user';
import {
  FindByUsernameOption,
  FindUserOption,
  FindUsersOption,
  IUserApplicationService,
  UserDto,
} from '.';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface/user.repository.interface';

export class UserApplicationService implements IUserApplicationService {
  public constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly _repo: IUserRepository
  ) {}

  public async findByUserName(username: string, options?: FindByUsernameOption): Promise<UserDto> {
    if (!username) return null;
    const user = await this._repo.findByUserName(username);
    if (!user) return null;

    const excluded = [];
    if (!options?.withPermission) excluded.push('permissions');
    if (!options?.withGroupJoined) excluded.push('groups');

    return this._toDto(user, excluded);
  }

  public async findOne(userId: string, options?: FindUserOption): Promise<UserDto> {
    if (!userId) return null;
    const user = await this._repo.findOne(userId);
    if (!user) return null;

    const excluded = [];
    if (!options?.withPermission) excluded.push('permissions');
    if (!options?.withGroupJoined) excluded.push('groups');

    return this._toDto(user, excluded);
  }

  public async findAllByIds(userIds: string[], options?: FindUsersOption): Promise<UserDto[]> {
    if (!userIds || userIds?.length === 0) return [];
    const rows = await this._repo.findAllByIds(userIds);

    const excluded = [];
    if (!options?.withGroupJoined) excluded.push('groups');

    return rows.map((row) => this._toDto(row, excluded));
  }

  public async findAllAndFilterByPersonalVisibility(
    userIds: string[],
    authUserId: string
  ): Promise<UserDto[]> {
    if (!userIds || userIds?.length === 0) return [];
    const rows = await this._repo.findAllFromInternalByIds(userIds, authUserId);
    return rows.map((row) => this._toDto(row));
  }

  public async canCudTagInCommunityByUserId(userId: string, communityId: string): Promise<boolean> {
    return this._repo.canCudTagInCommunityByUserId(userId, communityId);
  }

  private _toDto(user: UserEntity, excluded: (keyof UserProps)[] = []): UserDto {
    return new UserDto({
      id: user.get('id'),
      username: user.get('username'),
      fullname: user.get('fullname'),
      email: user.get('email'),
      avatar: user.get('avatar'),
      ...(!excluded.includes('groups') && {
        groups: user.get('groups'),
      }),
      ...(!excluded.includes('permissions') && {
        permissions: user.get('permissions'),
      }),
      isDeactivated: user.get('isDeactivated'),
      isVerified: user.get('isVerified'),
      showingBadges: user.get('showingBadges'),
    });
  }
}
