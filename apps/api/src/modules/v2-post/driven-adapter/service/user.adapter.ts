import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';

import { FindUserOption, IUserAdapter } from '../../domain/service-adapter-interface ';

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
    const users = await this._userService.findAllByIds(userIds);

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
}
