import { Inject, Injectable } from '@nestjs/common';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import { UserNoBelongGroupException } from '../exception/user-no-belong-group.exception';
import { IMentionValidator } from './interface';

@Injectable()
export class MentionValidator implements IMentionValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected readonly _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService
  ) {}
  public async validateMentionUsers(users: UserDto[], groups: GroupDto[] = []): Promise<void> {
    if (!users || users?.length === 0) return;
    const invalidUsers = [];
    for (const user of users) {
      if (!groups.some((group) => user.groups.includes(group.id))) {
        invalidUsers.push(user.id);
      }
    }

    if (invalidUsers.length) {
      throw new UserNoBelongGroupException({
        usersDenied: invalidUsers,
      });
    }
  }
}
