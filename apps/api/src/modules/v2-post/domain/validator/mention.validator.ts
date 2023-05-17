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
import { UserMentionDto } from '../../application/dto/user-mention.dto';
import { MentionUserNotFoundException } from '../exception/mention-user-not-found.exception';
import { LogicException } from '../../../../common/exceptions/logic.exception';
import { HTTP_STATUS_ID } from '../../../../common/constants/http-status-id';

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


  /**
   * Check Valid Mentions
   * @param groupIds
   * @param userIds number[]
   * @return users UserDto[]
   * @throws LogicException
   */
  public async checkValidMentionsAndReturnUsers(
    groupIds: string[],
    userIds: string[]
  ): Promise<UserDto[]> {
    userIds = [...new Set(userIds)];
    const users = await this._userApplicationService.findAllByIds(userIds, {
      withGroupJoined: true,
    });
    if (users?.length < userIds.length) {
      throw new MentionUserNotFoundException();
    }
    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    }
    return users;
  }

  /**
   * Map mentions to UserInfo
   * @param mentions string[]
   * @param users UserDto[]
   * @throws BadRequestException
   * returns UserMentionDto
   */
  public mapMentionWithUserInfo(users: UserDto[]): UserMentionDto {
    return users.reduce((returnValue, current) => {
      return {
        ...returnValue,
        [current.username]: {
          id: current.id,
          username: current.username,
          fullname: current.fullname,
        },
      };
    }, {});
  }

  public async validateMentionUsers(users: UserDto[], groups: GroupDto[]): Promise<void> {
    if (!users?.length || !groups?.length) return;
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
