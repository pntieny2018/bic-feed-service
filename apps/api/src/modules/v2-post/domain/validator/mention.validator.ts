import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { LogicException } from '../../../../common/exceptions';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import { UserMentionDto } from '../../application/dto';
import { IMentionValidator } from './interface/mention.validator.interface';

@Injectable()
export class MentionValidator implements IMentionValidator {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService
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
    const users = await this._userAppService.findAllByIds(userIds, { withGroupJoined: true });
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
  public mapMentionWithUserInfo(mentions: string[], users: UserDto[]): UserMentionDto {
    if (users.length < mentions.length) {
      throw new BadRequestException('Mention users not found or resolved');
    }
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
}
