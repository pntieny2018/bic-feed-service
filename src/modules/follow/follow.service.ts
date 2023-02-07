import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { ArrayHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { FollowModel, IFollow } from '../../database/models/follow.model';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';
import {
  UsersHasBeenFollowedEventPayload,
  UsersHasBeenUnfollowedEventPayload,
} from '../../events/follow/payload';
import { FollowDto } from './dto/requests';
import { FollowsDto } from './dto/response/follows.dto';

@Injectable()
export class FollowService {
  private _databaseConfig = getDatabaseConfig();

  private _logger = new Logger(FollowService.name);

  public constructor(
    @InjectConnection() private _sequelize: Sequelize,
    private _eventEmitter: InternalEventEmitterService,
    @InjectModel(FollowModel) private _followModel: typeof FollowModel,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Make user follow  group
   */
  public async follow(createFollowDto: FollowDto): Promise<void> {
    try {
      const users = await this._followModel.findAll({
        attributes: [
          'userId',
          [Sequelize.literal(`string_agg(group_id::character varying, ',')`), 'groupId'],
        ],
        group: 'user_id',
      });

      const dataEventPayload: UsersHasBeenFollowedEventPayload = {
        users: [],
      };
      const bulkCreateData = [];
      for (const userId of createFollowDto.userIds) {
        const userEventPayload = {
          userId,
          followedGroupIds: [],
        };
        let currentGroupIds = new Set([]);
        const user = users.find((item) => item.userId === userId);
        if (user) {
          currentGroupIds = new Set(user.groupId.split(',') || []);
        }

        for (const groupId of createFollowDto.groupIds) {
          if (!currentGroupIds.has(groupId)) {
            userEventPayload.followedGroupIds.push(groupId);
            bulkCreateData.push({
              userId: userId,
              groupId: groupId,
            });
          }
        }
        dataEventPayload.users.push(userEventPayload);
      }

      const insertData = bulkCreateData
        .map((record) => {
          const escapedUserId = this._sequelize.escape(record.userId);
          const escapedGroupId = this._sequelize.escape(record.groupId);
          return `(${escapedUserId}, ${escapedGroupId})`;
        })
        .join(',');

      await this._followModel.sequelize.query(
        `INSERT INTO ${this._databaseConfig.schema}.${this._followModel.tableName} (user_id,group_id)
             VALUES ${insertData} ON CONFLICT (user_id,group_id) DO NOTHING;`
      );

      this._eventEmitter.emit(new UsersHasBeenFollowedEvent(dataEventPayload));
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new RpcException("Can't follow");
    }
  }

  /**
   * Make user unfollow  group
   */
  public async unfollow(unfollowDto: FollowDto): Promise<void> {
    try {
      await this._followModel.destroy({
        where: {
          groupId: {
            [Op.in]: unfollowDto.groupIds,
          },
          userId: {
            [Op.in]: unfollowDto.userIds,
          },
        },
      });

      const dataEventPayload: UsersHasBeenUnfollowedEventPayload = {
        users: [],
      };
      for (const userId of unfollowDto.userIds) {
        const userEventPayload = {
          userId,
          unfollowedGroupIds: [],
        };

        for (const groupId of unfollowDto.groupIds) {
          userEventPayload.unfollowedGroupIds.push(groupId);
        }
        dataEventPayload.users.push(userEventPayload);
      }

      this._eventEmitter.emit(new UsersHasBeenUnfollowedEvent(dataEventPayload));
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new RpcException("Can't unfollow");
    }
  }

  public async getUsersNotInGroups(userIds: number[], groupIds: number[]): Promise<number[]> {
    const schema = this._databaseConfig.schema;

    const rows = await this._sequelize.query(
      ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS (
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC)
                   AS duplicate_count
                   FROM ${schema}.${this._followModel.tableName}
                   WHERE group_id IN  (${groupIds
                     .map((id) => this._sequelize.escape(id))
                     .join(',')})
                   AND user_id IN (${userIds.map((id) => this._sequelize.escape(id)).join(',')})
              ) SELECT id, user_id FROM REMOVE_DUPLICATE tb1
                WHERE duplicate_count = 1 ; `
    );
    const targetIds = rows[0].map((r) => r['user_id']);
    return ArrayHelper.arrDifferenceElements(userIds, targetIds);
  }

  /**
   * Get unique user follows
   * @param ignoreUserIds Array<Number>
   * @param targetGroupIds Array<Number>
   * @param groupIds Array<Number>
   * @param followId Number
   * @param limit Number
   */
  public async getUserFollowGroupIds(
    groupIds: string[],
    notExistInGroupIds: string[] = [],
    followId = 0,
    limit = 1000
  ): Promise<FollowsDto> {
    try {
      const schema = this._databaseConfig.schema;
      let condition = `duplicate_count = 1 AND id > :followId`;

      if (notExistInGroupIds.length > 0) {
        condition += ` AND NOT EXISTS (
          SELECT user_id FROM  ${schema}.${this._followModel.tableName} tb2
          WHERE group_id IN (:notExistInGroupIds)
          AND tb1.user_id = tb2.user_id
        )`;
      }
      const rows = await this._sequelize.query(
        ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS (
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC)
                   AS duplicate_count
                   FROM ${schema}.${this._followModel.tableName}
                   WHERE group_id IN (:groupIds)
              ) SELECT id, user_id FROM REMOVE_DUPLICATE tb1
                WHERE ${condition} ORDER BY id ASC limit :limit ;
             `,
        {
          replacements: {
            followId: followId,
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
          latestFollowId: rows[0][rows[0].length - 1]['id'],
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
    followId = 0,
    limit = 1000
  ): Promise<FollowsDto> {
    this._logger.debug(`[filterUserFollows]:ignoreUserIds: ${ignoreUserIds}`);
    this._logger.debug(`[filterUserFollows]:groupIds: ${groupIds}`);
    this._logger.debug(`[filterUserFollows]:oldGroupIds: ${oldGroupIds}`);
    try {
      const filterConditions =
        oldGroupIds && oldGroupIds.length
          ? `
         AND group_id NOT IN  (${oldGroupIds.map((id) => this._sequelize.escape(id)).join(',')})
        `
          : '';
      const schema = this._databaseConfig.schema;

      const rows = await this._sequelize.query(
        ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS (
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC)
                   AS duplicate_count
                   FROM ${schema}.${this._followModel.tableName}
                   WHERE group_id IN  (${groupIds
                     .map((id) => this._sequelize.escape(id))
                     .join(',')}) ${filterConditions}
              AND user_id NOT IN (${ignoreUserIds
                .map((id) => this._sequelize.escape(id))
                .join(',')})
              ) SELECT id, user_id FROM REMOVE_DUPLICATE tb1
                WHERE duplicate_count = 1
                AND id > $followId  limit $limit ;
             `,
        {
          bind: {
            followId: followId,
            limit: limit,
          },
        }
      );
      const userIds = rows[0].map((r) => r['user_id']);
      if (userIds.length) {
        return {
          userIds: userIds,
          latestFollowId: rows[0][rows[0].length - 1]['id'],
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

  // TODO move this
  public async getValidUserIds(userIds: string[], groupIds: string[]): Promise<string[]> {
    const { schema } = getDatabaseConfig();

    const rows = await this._sequelize.query(
      ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS (
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC)
                   AS duplicate_count
                   FROM ${schema}.${FollowModel.tableName}
                   WHERE group_id IN  (${groupIds
                     .map((id) => this._sequelize.escape(id))
                     .join(',')})
              ) SELECT user_id FROM REMOVE_DUPLICATE tb1
                WHERE duplicate_count = 1
                AND user_id IN  (${userIds.map((id) => this._sequelize.escape(id)).join(',')})
             `
    );
    if (!rows) {
      return [];
    }

    return rows[0].map((r) => r['user_id']);
  }

  public async getFollowByUserId(userId: string): Promise<IFollow[]> {
    return this._followModel.findAll({ where: { userId } });
  }
}
