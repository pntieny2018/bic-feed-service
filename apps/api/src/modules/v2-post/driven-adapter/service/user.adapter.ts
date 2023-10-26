import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { uniq } from 'lodash';

import { UserNotFoundException } from '../../domain/exception';
import { FindUserOption, IUserAdapter } from '../../domain/service-adapter-interface';

export class UserAdapter implements IUserAdapter {
  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService
  ) {}

  public async getUserById(userId: string, options?: FindUserOption): Promise<UserDto> {
    const user = await this._userService.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const excluded = this._getExcludedFields(options);

    return new UserDto(user, excluded);
  }

  public async getUsersByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]> {
    const uniqueIds = uniq(userIds);
    const users = await this._userService.findAllByIds(uniqueIds);

    if (!users || users.length !== uniqueIds.length) {
      const notFoundIds = uniqueIds.filter((id) => !users.find((user) => user.id === id));
      throw new UserNotFoundException(`User not found with ids: ${notFoundIds.join(', ')}`);
    }

    const excluded = this._getExcludedFields(options);

    return users.map((user) => new UserDto(user, excluded));
  }

  private _getExcludedFields(options?: FindUserOption): string[] {
    const excluded = [];
    if (!options?.withPermission) {
      excluded.push('permissions');
    }
    if (!options?.withGroupJoined) {
      excluded.push('groups');
    }
    return excluded;
  }

  public async findAllAndFilterByPersonalVisibility(
    userIds: string[],
    authUserId: string
  ): Promise<UserDto[]> {
    if (!userIds || userIds?.length === 0) {
      return [];
    }
    return this._userService.findAllByIdsWithAuthUser(userIds, authUserId);
  }

  public async canCudTags(userId: string, groupId: string): Promise<boolean> {
    return this._userService.canCudTags(userId, groupId);
  }
}
