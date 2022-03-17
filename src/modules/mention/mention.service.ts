import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserService } from '../../shared/user';
import { GroupService } from '../../shared/group';
import { UserDataShareDto, UserSharedDto } from '../../shared/user/dto';
import { LogicException } from '../../common/exceptions';
import { MENTION_ERROR_ID } from './errors/mention.error';
import { MentionHelper } from '../../common/helpers/mention.helper';
import { IMention, MentionModel } from '../../database/models/mention.model';
import { UserMentionDto } from './dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MentionService {
  public constructor(
    private _userService: UserService,
    private _groupService: GroupService,
    @InjectModel(MentionModel) private _mentionModel: typeof MentionModel
  ) {}

  /**
   * Check Valid Mentions
   * @param groupId number[]
   * @param content string
   * @param userIds number[]
   * @throws LogicException
   */
  public async checkValidMentions(
    groupId: number[],
    content: string,
    userIds: number[]
  ): Promise<void> {
    const users: UserSharedDto[] = await this._userService.getMany(userIds);

    const usernames = MentionHelper.findMention(content);

    if (users.length !== userIds.length) {
      throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
    }

    if (users.length !== usernames.length) {
      throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
    }

    for (const user of users) {
      if (
        !this._groupService.isMemberOfGroups(groupId, user.groups) ||
        !usernames.includes(user.username)
      ) {
        throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
      }
    }
  }

  /**
   * Create mentions
   * @param mentions  IMention[]
   */
  public async create(mentions: IMention[]): Promise<MentionModel[]> {
    return await this._mentionModel.bulkCreate(mentions);
  }

  /**
   * Resolve mentions by id
   * @param userIds number[]
   * @returns Promise resolve UserDataShareDto[]
   */
  public async resolveMentions(userIds: number[]): Promise<UserDataShareDto[]> {
    if (!userIds.length) return [];
    const users = await this._userService.getMany(userIds);

    return plainToInstance(UserDataShareDto, users, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Bind mention to comment
   * @param commentsResponse any[]
   */
  public async bindMentionsToComment(commentsResponse: any[]): Promise<void> {
    const userIds: number[] = [];

    for (const comment of commentsResponse) {
      if (comment.mentions && comment.mentions.length) {
        userIds.push(...comment.mentions.map((m) => m.userId));
      }
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          userIds.push(...cm.mentions.map((m) => m.userId));
        }
      }
    }

    const usersInfo = await this.resolveMentions(userIds);
    const convert = (usersData): UserMentionDto[] =>
      usersData.map((userData) => ({
        [userData.username]: userData,
      }));

    for (const comment of commentsResponse) {
      if (comment.mentions && comment.mentions.length) {
        comment.mentions = convert(
          comment.mentions.map((v) => usersInfo.find((u) => u.id === v.userId))
        );
      }
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          cm.mentions = convert(cm.mentions.map((v) => usersInfo.find((u) => u.id === v.userId)));
        }
      }
    }
  }
}
