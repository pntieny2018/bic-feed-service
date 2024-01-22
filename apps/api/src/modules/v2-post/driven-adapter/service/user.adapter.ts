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
    return this._userService.findById(userId, options);
  }

  public async getUsersByIds(userIds: string[], options?: FindUserOption): Promise<UserDto[]> {
    const uniqueIds = uniq(userIds);
    return this._userService.findAllByIds(uniqueIds, options);
  }

  public async canCudTags(userId: string, groupId: string): Promise<boolean> {
    return this._userService.canCudTags(userId, groupId);
  }

  public async getGroupIdsJoinedByUserId(userId: string): Promise<string[]> {
    return this._userService.getGroupIdsJoinedByUserId(userId);
  }
}
