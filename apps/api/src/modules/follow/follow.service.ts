import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { FollowModel, IFollow } from '../../database/models/follow.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { FollowsDto } from './dto/response/follows.dto';
import { getDatabaseConfig } from '@libs/database/postgres/config';

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
   * Get unique user follows
   * @param ignoreUserIds Array<Number>
   * @param targetGroupIds Array<Number>
   * @param groupIds Array<Number>
   * @param followId Number
   * @param limit Number
   */
  public async findUsersFollowedGroupIds(
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
