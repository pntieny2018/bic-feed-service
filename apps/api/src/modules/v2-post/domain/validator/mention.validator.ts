import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../v2-user/application';
import { UserNoBelongGroupException } from '../exception';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../service-adapter-interface /group-adapter.interface';

import { IMentionValidator } from './interface';

@Injectable()
export class MentionValidator implements IMentionValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    protected readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService
  ) {}

  public async validateMentionUsers(users: UserDto[], groups: GroupDto[]): Promise<void> {
    if (!users?.length || !groups?.length) {
      return;
    }
    const invalidUsers = [];
    for (const user of users) {
      if (!groups.some((group) => user.groups.includes(group.id))) {
        invalidUsers.push(user.id);
      }
    }

    if (invalidUsers.length) {
      throw new UserNoBelongGroupException(null, { usersDenied: invalidUsers });
    }
  }
}
