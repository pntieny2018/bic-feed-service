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
  public async follow(followDto: FollowDto): Promise<void> {
    const { userId, groupIds } = followDto;
    try {
      const followedGroupIds = await this._filterGroupsUserJoined(userId, groupIds);

      await this._createFollowData(userId, followedGroupIds);

      this._eventEmitter.emit(
        new UsersHasBeenFollowedEvent({
          userId,
          followedGroupIds,
        })
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
    const { userId, groupIds } = unfollowDto;
    try {
      await this._followModel.destroy({
        where: {
          groupId: {
            [Op.in]: unfollowDto.groupIds,
          },
          userId: unfollowDto.userId,
        },
      });

      this._eventEmitter.emit(
        new UsersHasBeenUnfollowedEvent({
          userId,
          unfollowedGroupIds: groupIds,
        })
      );
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
  public async getUserFollowGroupIds(
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
      let condition = 'group_id IN (:groupIds) AND zindex > :zindex';
      if (oldGroupIds.length > 0) {
        condition += ' AND group_id NOT IN (:oldGroupIds)';
      }
      if (ignoreUserIds.length > 0) {
        condition += ' AND user_id NOT IN (:ignoreUserIds)';
      }
      const schema = this._databaseConfig.schema;

      const rows = await this._sequelize.query(
        `SELECT DISTINCT(user_id), zindex
          FROM ${schema}.${this._followModel.tableName} tb1
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
