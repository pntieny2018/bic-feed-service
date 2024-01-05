import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { UserNoBelongGroupException } from '../exception';
import {
  IUserAdapter,
  USER_ADAPTER,
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../service-adapter-interface';

import { IMentionValidator } from './interface';

@Injectable()
export class MentionValidator implements IMentionValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    protected readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    protected readonly _userAdapter: IUserAdapter,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService
  ) {}

  public validateMentionUsers(users: UserDto[], groups: GroupDto[]): void {
    if (!users?.length || !groups?.length) {
      return;
    }
    const invalidUsers = [];
    for (const user of users) {
      if (!groups.some((group) => user?.groups.includes(group.id))) {
        invalidUsers.push(user.id);
      }
    }

    if (invalidUsers.length) {
      throw new UserNoBelongGroupException(null, { usersDenied: invalidUsers });
    }
  }
}
