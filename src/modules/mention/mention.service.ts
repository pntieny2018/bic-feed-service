import { RemoveMentionDto, UserMentionDto } from './dto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { UserService } from '../../shared/user';
import { GroupService } from '../../shared/group';
import { UserDataShareDto, UserSharedDto } from '../../shared/user/dto';
import { LogicException } from '../../common/exceptions';
import { MENTION_ERROR_ID } from './errors/mention.error';
import { IMention, MentionModel } from '../../database/models/mention.model';
import { plainToInstance } from 'class-transformer';
import { MentionableType } from '../../common/constants';
import { ArrayHelper } from '../../common/helpers';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { getDatabaseConfig } from '../../config/database';

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
      if (!this._groupService.isMemberOfGroups(groupIds, user.groups)) {
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

  /**
   * Delete/Insert mention by entity
   * @param userIds Array of User ID
   * @param mentionableType Post or comment
   * @param entityId Post ID or Comment ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setMention(
    userIds: number[],
    mentionableType: MentionableType,
    entityId: number
  ): Promise<boolean> {
    const currentMentions = await this._mentionModel.findAll({
      where: { mentionableType, entityId },
    });
    const currentMentionUserIds = currentMentions.map((i) => i.userId);

    const deleteUserIds = ArrayHelper.differenceArrNumber(currentMentionUserIds, userIds);
    if (deleteUserIds.length) {
      await this._mentionModel.destroy({
        where: { mentionableType, entityId, userId: deleteUserIds },
      });
    }

    const addUserIds = ArrayHelper.differenceArrNumber(userIds, currentMentionUserIds);
    if (addUserIds.length) {
      await this._mentionModel.bulkCreate(
        addUserIds.map((userId) => ({
          mentionableType,
          entityId,
          userId,
        }))
      );
    }
    return true;
  }

  public async destroy(removeMentionDto: RemoveMentionDto): Promise<any> {
    const databaseConfig = getDatabaseConfig();

    if (removeMentionDto.commentId) {
      return await this._sequelizeConnection.query(
        `DELETE FROM ${databaseConfig.schema}.${MentionModel.tableName} where ${databaseConfig.schema}.${MentionModel.tableName}.comment_id = $commentId`,
        {
          type: QueryTypes.DELETE,
          bind: {
            commentId: removeMentionDto.commentId,
          },
        }
      );
    }

    if (removeMentionDto.postId) {
      return await this._sequelizeConnection.query(
        `DELETE FROM ${databaseConfig.schema}.${MentionModel.tableName} where ${databaseConfig.schema}.${MentionModel.tableName}.post_id = $postId`,
        {
          type: QueryTypes.DELETE,
          bind: {
            postId: removeMentionDto.postId,
          },
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
      });
    }
  }
}
