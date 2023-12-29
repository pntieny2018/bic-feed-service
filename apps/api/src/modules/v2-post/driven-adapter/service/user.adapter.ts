import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { uniq } from 'lodash';

import { FindUserOption, IUserAdapter } from '../../domain/service-adapter-interface';

export class UserAdapter implements IUserAdapter {
  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService
  ) {}

  public async getUserById(userId: string, options?: FindUserOption): Promise<UserDto> {
    const user = await this._userService.findById(userId);

    const excluded = this._getExcludedFields(options);

    return new UserDto(user, excluded);
  }

  public async getUsersByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]> {
    const uniqueIds = uniq(userIds);
    const users = await this._userService.findAllByIds(uniqueIds);

    const excluded = this._getExcludedFields(options);

    return users.map((user) => new UserDto(user, excluded));
  }

  private _getExcludedFields(options?: FindUserOption): string[] {
    const excluded = [];

    if (!options?.withGroupJoined) {
      excluded.push('groups');
    }
    return excluded;
  }

  public async canCudTags(userId: string, groupId: string): Promise<boolean> {
    return this._userService.canCudTags(userId, groupId);
  }

  public async getGroupIdsJoinedByUserId(userId: string): Promise<string[]> {
    return this._userService.getGroupIdsJoinedByUserId(userId);
  }
}
