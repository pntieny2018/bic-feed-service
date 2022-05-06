import { Injectable } from '@nestjs/common';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { ArrayHelper } from '../../common/helpers';
import { plainToInstance } from 'class-transformer';
import { UserSharedDto } from '../../shared/user/dto';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { RemoveMentionDto, UserMentionDto } from './dto';
import { MentionableType } from '../../common/constants';
import { LogicException } from '../../common/exceptions';
import { MENTION_ERROR_ID } from './errors/mention.error';
import { getDatabaseConfig } from '../../config/database';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IMention, MentionModel } from '../../database/models/mention.model';

@Injectable()
export class MentionService {
  public constructor(
    private _userService: UserService,
    private _groupService: GroupService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(MentionModel) private _mentionModel: typeof MentionModel
  ) {}

  /**
   * Check Valid Mentions
   * @param groupIds
   * @param userIds number[]
   * @throws LogicException
   */
  public async checkValidMentions(groupIds: number[], userIds: number[]): Promise<void> {
    const users: UserSharedDto[] = await this._userService.getMany(userIds);
    for (const user of users) {
      if (!this._groupService.isMemberOfSomeGroups(groupIds, user.groups)) {
        throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
      }
    }
  }

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
      return await this._mentionModel.bulkCreate(mentions, { transaction });
    }
    return await this._mentionModel.bulkCreate(mentions);
  }

  /**
   * Resolve mentions by id
   * @param userIds number[]
   * @returns Promise resolve UserSharedDto[]
   */
  public async resolveMentions(userIds: number[]): Promise<UserSharedDto[]> {
    if (!userIds.length) return [];
    const users = await this._userService.getMany(userIds);
    return plainToInstance(UserSharedDto, users, {
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
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          userIds.push(...cm.mentions.map((m) => m.userId));
        }
      }
    }

    const usersInfo = await this.resolveMentions(userIds);
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
      if (comment.mentions && comment.mentions.length) {
        comment.mentions = convert(
          comment.mentions.map((v) => usersInfo.find((u) => u.id === v.userId))
        );
      }
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child?.list) {
          cm.mentions = convert(cm.mentions.map((v) => usersInfo.find((u) => u.id === v.userId)));
        }
      }
    }
  }

  /**
   * Bind mention to post
   * @param posts any[]
   */
  public async bindMentionsToPosts(posts: any[]): Promise<void> {
    const userIds: number[] = [];

    for (const post of posts) {
      if (post.mentions && post.mentions.length) {
        userIds.push(...post.mentions.map((m) => m.userId));
      }
    }

    const usersInfo = await this.resolveMentions(userIds);

    for (const post of posts) {
      if (post.mentions && post.mentions.length) {
        const mentions = [];
        post.mentions.forEach((mention) => {
          const user = usersInfo.find((u) => u.id === mention.userId);
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
    userIds: number[],
    mentionableType: MentionableType,
    entityId: number,
    transaction: Transaction
  ): Promise<boolean> {
    const currentMentions = await this._mentionModel.findAll({
      where: { mentionableType, entityId },
    });
    const currentMentionUserIds = currentMentions.map((i) => i.userId);

    const deleteUserIds = ArrayHelper.differenceArrNumber(currentMentionUserIds, userIds);
    if (deleteUserIds.length) {
      await this._mentionModel.destroy({
        where: { mentionableType, entityId, userId: deleteUserIds },
        transaction: transaction,
      });
    }

    const addUserIds = ArrayHelper.differenceArrNumber(userIds, currentMentionUserIds);
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

  public async destroy(removeMentionDto: RemoveMentionDto, transaction: Transaction): Promise<any> {
    const databaseConfig = getDatabaseConfig();

    if (removeMentionDto.commentId) {
      return await this._sequelizeConnection.query(
        `DELETE FROM ${databaseConfig.schema}.${MentionModel.tableName} where ${databaseConfig.schema}.${MentionModel.tableName}.entity_id = $commentId`,
        {
          type: QueryTypes.DELETE,
          bind: {
            commentId: removeMentionDto.commentId,
          },
          transaction: transaction,
        }
      );
    }

    if (removeMentionDto.postId) {
      return await this._sequelizeConnection.query(
        `DELETE FROM ${databaseConfig.schema}.${MentionModel.tableName} where ${databaseConfig.schema}.${MentionModel.tableName}.entityId = $postId`,
        {
          type: QueryTypes.DELETE,
          bind: {
            postId: removeMentionDto.postId,
          },
          transaction: transaction,
        }
      );
    }

    if (removeMentionDto.mentionIds) {
      return await this._mentionModel.destroy({
        where: {
          id: {
            [Op.in]: removeMentionDto.mentionIds,
          },
        },
        transaction: transaction,
      });
    }
  }

  public async deleteMentionByEntityIds(
    entityIds: number[],
    mentionableType: MentionableType,
    transaction: Transaction
  ): Promise<number> {
    return this._mentionModel.destroy({
      where: { entityId: entityIds, mentionableType },
      transaction: transaction,
    });
  }
}
