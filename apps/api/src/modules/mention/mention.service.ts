import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ArrayHelper } from '../../common/helpers';
import { Transaction } from 'sequelize';
import { UserMentionDto } from './dto';
import { MentionableType } from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IMention, MentionModel } from '../../database/models/mention.model';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';

@Injectable()
export class MentionService {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(MentionModel) private _mentionModel: typeof MentionModel
  ) {}

  /**
   * Create mentions
   * @param mentions  IMention[]
   * @param transaction Sequelize
   */
  public async create(
    mentions: IMention[],
    transaction: Transaction = null
  ): Promise<MentionModel[]> {
    if (transaction) {
      return this._mentionModel.bulkCreate(mentions, { transaction });
    }
    return this._mentionModel.bulkCreate(mentions);
  }

  /**
   * Resolve mentions by id
   * @param userIds number[]
   * @returns Promise resolve UserSharedDto[]
   */
  public async resolve(userIds: string[]): Promise<UserDto[]> {
    if (!userIds.length) return [];
    const users = await this._userAppService.findAllByIds(userIds);
    return users;
  }

  /**
   * Bind mention to comment
   * @param commentsResponse any[]
   */
  public async bindToComment(commentsResponse: any[]): Promise<void> {
    const userIds: string[] = this._getUserIdsFromComments(commentsResponse);
    const usersInfo = await this.resolve(userIds);
    const convert = (usersData: any[]): UserMentionDto => {
      const replacement = {};
      usersData
        .filter((i) => i !== null && i !== undefined)
        .forEach((user) => {
          replacement[user.username] = user;
        });
      return replacement;
    };
    for (const comment of commentsResponse) {
      if (comment?.parent) {
        comment.parent.mentions = convert(
          comment.parent.mentions.map((userId) => usersInfo.find((u) => u.id === userId))
        );
      }
      // if (comment.mentions && comment.mentions.length) {
      comment.mentions = convert(
        comment.mentions.map((userId) => usersInfo.find((u) => u.id === userId))
      );
      // }
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child?.list) {
          cm.mentions = convert(
            cm.mentions.map((userId) => usersInfo.find((u) => u.id === userId))
          );
        }
      }
    }
  }

  private _getUserIdsFromComments(commentsResponse: any[]): string[] {
    const userIds: string[] = [];
    for (const comment of commentsResponse) {
      if (comment?.parent?.mentions.length) {
        userIds.push(...comment.parent.mentions);
      }
      if (comment.mentions && comment.mentions.length) {
        userIds.push(...comment.mentions);
      }
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          if (cm.mentions?.length) userIds.push(...cm.mentions);
        }
      }
    }
    return userIds;
  }

  /**
   * Bind mention to post
   * @param posts any[]
   */
  public async bindToPosts(posts: any[]): Promise<void> {
    const userIds: string[] = [];

    for (const post of posts) {
      if (post.mentions && post.mentions.length) {
        userIds.push(...post.mentions);
      }
    }

    const usersInfo = await this.resolve(userIds);
    for (const post of posts) {
      if (post.mentions?.length) {
        const mentions = [];
        post.mentions.forEach((userId) => {
          const user = usersInfo.find((u) => u.id === userId);
          if (user) mentions.push(user);
        });
        post.mentions = mentions.reduce((obj, cur) => ({ ...obj, [cur.username]: cur }), {});
      }
    }
  }
  /**
   * Delete/Insert mention by entity
   * @param userIds Array of User ID
   * @param mentionableType Post or comment
   * @param entityId Post ID or Comment ID
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setMention(
    userIds: string[],
    mentionableType: MentionableType,
    entityId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const currentMentions = await this._mentionModel.findAll({
      where: { mentionableType, entityId },
      transaction,
    });
    const currentMentionUserIds = currentMentions.map((i) => i.userId);

    const deleteUserIds = ArrayHelper.arrDifferenceElements(currentMentionUserIds, userIds);
    if (deleteUserIds.length) {
      await this._mentionModel.destroy({
        where: { mentionableType, entityId, userId: deleteUserIds },
        transaction: transaction,
      });
    }

    const addUserIds = ArrayHelper.arrDifferenceElements(userIds, currentMentionUserIds);
    if (addUserIds.length) {
      await this._mentionModel.bulkCreate(
        addUserIds.map((userId) => ({
          mentionableType,
          entityId,
          userId,
        })),
        {
          transaction: transaction,
        }
      );
    }
    return true;
  }

  public async deleteByEntityIds(
    entityIds: string[],
    mentionableType: MentionableType,
    transaction: Transaction
  ): Promise<number> {
    return this._mentionModel.destroy({
      where: { entityId: entityIds, mentionableType },
      transaction: transaction,
    });
  }
}
