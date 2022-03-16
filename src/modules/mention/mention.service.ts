import { Injectable } from '@nestjs/common';
import { UserService } from '../../shared/user';
import { UserSharedDto } from '../../shared/user/dto';
import { LogicException } from '../../common/exceptions';
import { MENTION_ERROR_ID } from './errors/mention.error';
import { MentionHelper } from '../../common/helpers/mention.helper';
import { GroupService } from '../../shared/group';
import { MentionableType } from 'src/common/constants';

@Injectable()
export class MentionService {
  public constructor(private _userService: UserService, private _groupService: GroupService) {}

  /**
   * Check Valid Mentions
   * @param groupId
   * @param content
   * @param userIds
   * @throws LogicException
   */
  public async checkValidMentions(
    groupIds: number[],
    content: string,
    userIds: number[]
  ): Promise<void> {
    const users: UserSharedDto[] = await this._userService.getMany(userIds);

    const usernames = MentionHelper.findMention(content);

    if (users.length !== userIds.length) {
      throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
    }
    console.log('users', users);
    console.log('usernames', usernames);
    
    if (users.length !== usernames.length) {
      throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
    }

    for (const user of users) {
      if (
        !this._groupService.isMemberOfGroups(groupIds, user.groups) ||
        !usernames.includes(user.username)
      ) {
        throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
      }
    }
  }
}
