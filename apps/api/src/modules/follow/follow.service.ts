import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { getDatabaseConfig } from '../../config/database';
import { FollowModel, IFollow } from '../../database/models/follow.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostModel, PostStatus } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';

import { FollowDto } from './dto/requests';
import { FollowsDto } from './dto/response/follows.dto';

@Injectable()
export class FollowService {
  private _databaseConfig = getDatabaseConfig();

  private _logger = new Logger(FollowService.name);

  public constructor(
    @InjectModel(UserNewsFeedModel) private _userNewsFeedModel: typeof UserNewsFeedModel,
    @InjectConnection() private _sequelize: Sequelize,
    private _eventEmitter: InternalEventEmitterService,
    @InjectModel(FollowModel) private _followModel: typeof FollowModel,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Make user follow  group
   */

  public async follow(followDto: FollowDto): Promise<void> {
    const { userId, groupIds } = followDto;
    const schema = this._databaseConfig.schema;
    const MAX_POSTS_IN_NEWSFEED = 10000;
    try {
      const followedGroupIds = await this._filterGroupsUserJoined(userId, groupIds);
      if (followedGroupIds.length === 0) {
        return;
      }

      await this._createFollowData(userId, followedGroupIds);

      await this._userNewsFeedModel.sequelize.query(
        `
          INSERT INTO ${schema}.${this._userNewsFeedModel.tableName} (user_id, post_id, is_seen_post) 
          SELECT :userId as user_id, p.id as post_id, false as is_seen_post
          FROM ${schema}.${PostModel.tableName} p
          WHERE p.status = :status
                AND p.is_hidden = FALSE
                AND EXISTS (
                    SELECT post_id
                    FROM ${schema}.${PostGroupModel.tableName} pg
                    WHERE pg.group_id IN (:groupIds) 
                    AND pg.is_archived = :isArchived 
                    AND pg.post_id = p.id
                )
          ORDER BY p.created_at DESC
          LIMIT :limit
          ON CONFLICT (user_id, post_id) DO NOTHING
          `,
        {
          replacements: {
            userId,
            groupIds: followedGroupIds,
            status: PostStatus.PUBLISHED,
            isArchived: false,
            limit: MAX_POSTS_IN_NEWSFEED,
          },
        }
      );
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new RpcException("Can't follow");
    }
  }

  private async _filterGroupsUserJoined(userId: string, groupIds: string[]): Promise<string[]> {
    const groups = await this._followModel.findAll({
      attributes: ['groupId'],
      where: { userId },
    });
    const currentGroupIds = new Set(groups.map((group) => group.groupId));
    return groupIds.filter((groupId) => !currentGroupIds.has(groupId));
  }

  private async _createFollowData(userId: string, groupIds: string[]): Promise<void> {
    await this._followModel.bulkCreate(
      groupIds.map((groupId) => ({
        userId,
        groupId,
      })),
      { ignoreDuplicates: true }
    );
  }
  /**
   * Make user unfollow  group
   */
  public async unfollow(unfollowDto: FollowDto): Promise<void> {
    const { userId, groupIds: groupIdsUserLeft } = unfollowDto;
    const schema = this._databaseConfig.schema;
    try {
      await this._followModel.destroy({
        where: {
          groupId: {
            [Op.in]: groupIdsUserLeft,
          },
          userId,
        },
      });

      const groupsUserJoin = await this._followModel.findAll({
        where: {
          userId,
        },
      });
      const groupIdsUserJoined = groupsUserJoin.map((group) => group.groupId);

      let query = `DELETE FROM ${schema}.user_newsfeed u 
        WHERE user_id = :userId AND EXISTS(
           SELECT null
           FROM ${schema}.posts_groups pg
             WHERE pg.group_id IN(:groupIdsUserLeft) AND  pg.post_id = u.post_id
         )`;
      if (groupIdsUserJoined.length) {
        query += ` AND NOT EXISTS(
           SELECT null
           FROM ${schema}.posts_groups pg2
             WHERE pg2.group_Id IN(:groupIdsUserJoined) AND pg2.post_id = u.post_id
         )`;
      }

      await this._userNewsFeedModel.sequelize.query(query, {
        replacements: {
          userId,
          groupIdsUserLeft,
          groupIdsUserJoined,
        },
        type: QueryTypes.DELETE,
      });
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new RpcException("Can't unfollow");
    }
  }

  /**
   * Get unique user follows
   * @param ignoreUserIds Array<Number>
   * @param targetGroupIds Array<Number>
   * @param groupIds Array<Number>
   * @param followId Number
   * @param limit Number
   */
  public async _findUsersFollowedGroupIds(
    groupIds: string[],
    notExistInGroupIds: string[] = [],
    zindex = 0,
    limit = 1000
  ): Promise<FollowsDto> {
    try {
      const schema = this._databaseConfig.schema;
      let condition = ` group_id IN (:groupIds) AND zindex > :zindex`;

      if (notExistInGroupIds.length > 0) {
        condition += ` AND NOT EXISTS (
          SELECT user_id FROM  ${schema}.${this._followModel.tableName} tb2
          WHERE group_id IN (:notExistInGroupIds)
          AND tb1.user_id = tb2.user_id
        )`;
      }
      const rows = await this._sequelize.query(
        `SELECT DISTINCT(user_id), zindex
          FROM ${schema}.${this._followModel.tableName} tb1
          WHERE ${condition} ORDER BY zindex ASC limit :limit`,
        {
          replacements: {
            zindex,
            groupIds,
            notExistInGroupIds,
            limit: limit,
          },
        }
      );
      const userIds = rows[0].map((r) => r['user_id']);
      if (userIds.length) {
        return {
          userIds: userIds,
          latestFollowId: rows[0][rows[0].length - 1]['zindex'],
        };
      }

      return {
        userIds: [],
        latestFollowId: 0,
      };
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      return {
        userIds: [],
        latestFollowId: 0,
      };
    }
  }

  /**
   * filter user follows
   * @param ignoreUserIds Array<Number>
   * @param groupIds Array<Number>
   * @param oldGroupIds
   * @param followId Number
   * @param limit Number
   */
  public async gets(
    ignoreUserIds: string[],
    groupIds: string[],
    oldGroupIds: string[],
    zindex = 0,
    limit = 1000
  ): Promise<FollowsDto> {
    this._logger.debug(`[filterUserFollows]:ignoreUserIds: ${ignoreUserIds}`);
    this._logger.debug(`[filterUserFollows]:groupIds: ${groupIds}`);
    this._logger.debug(`[filterUserFollows]:oldGroupIds: ${oldGroupIds}`);
    try {
      const schema = this._databaseConfig.schema;
      let condition = 'group_id IN (:groupIds) AND zindex > :zindex';
      if (oldGroupIds && oldGroupIds.length > 0) {
        condition += ` AND NOT EXISTS (
        SELECT null
        FROM ${schema}.${this._followModel.tableName} AS "tmp"
        WHERE "tmp".user_id = "f".user_id AND tmp.group_id IN (:oldGroupIds)
        ) `;
      }

      if (ignoreUserIds && ignoreUserIds.length > 0) {
        condition += ` AND user_id NOT IN (:ignoreUserIds) `;
      }

      const rows = await this._sequelize.query(
        `SELECT DISTINCT(user_id), zindex
          FROM ${schema}.${this._followModel.tableName} f
          WHERE  ${condition}
          ORDER BY zindex ASC limit :limit ;
             `,
        {
          replacements: {
            groupIds,
            oldGroupIds,
            ignoreUserIds,
            zindex,
            limit: limit,
          },
        }
      );
      const userIds = rows[0].map((r) => r['user_id']);
      if (userIds.length) {
        return {
          userIds: userIds,
          latestFollowId: rows[0][rows[0].length - 1]['zindex'],
        };
      }

      return {
        userIds: [],
        latestFollowId: 0,
      };
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      return {
        userIds: [],
        latestFollowId: 0,
      };
    }
  }

  public async getFollowByUserId(userId: string): Promise<IFollow[]> {
    return this._followModel.findAll({ where: { userId } });
  }
}
