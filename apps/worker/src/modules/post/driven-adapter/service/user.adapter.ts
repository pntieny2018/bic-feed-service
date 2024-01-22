import { IUserService, USER_SERVICE_TOKEN } from '@libs/service/user';
import { Inject } from '@nestjs/common';

import { IUserAdapter } from '../../domain/service-adapter-interface';

export class UserAdapter implements IUserAdapter {
  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService
  ) {}

  public async getGroupIdsJoinedByUserId(userId: string): Promise<string[]> {
    return this._userService.getGroupIdsJoinedByUserId(userId);
  }
}
