import { Op } from 'sequelize';
import { SentryService } from '@app/sentry';
import { Sequelize } from 'sequelize-typescript';
import { ArrayHelper } from '../../common/helpers';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { getDatabaseConfig } from '../../config/database';
import { CreateFollowDto, UnfollowDto } from './dto/requests';
import { FollowModel } from '../../database/models/follow.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';

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
   * @param createFollowDto CreateFollowDto
   * @returns Promise resolve Array<FollowModel>
   * @throws RpcException
   */
  public async follow(createFollowDto: CreateFollowDto): Promise<void> {
    try {
      const bulkCreateData = createFollowDto.userIds
        .map((userId) =>
          createFollowDto.groupIds.map((groupId) => ({
            userId: userId,
            groupId: groupId,
          }))
        )
        .flat();

      const insertData = bulkCreateData
        .map((record) => {
          return `(${record.userId},${record.groupId})`;
        })
        .join(',');

      await this._followModel.sequelize.query(
        `INSERT INTO ${this._databaseConfig.schema}.${this._followModel.tableName} (user_id,group_id) 
             VALUES ${insertData} ON CONFLICT (user_id,group_id) DO NOTHING;`
      );

      this._eventEmitter.emit(new UsersHasBeenFollowedEvent(createFollowDto));
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new RpcException("Can't follow");
    }
  }

  /**
   * Make user unfollow  group
   * @param unfollowDto UnfollowDto
   * @returns Promise resolve Number
   * @throws RpcException
   */
  public async unfollow(unfollowDto: UnfollowDto): Promise<void> {
    try {
      const response = await this._followModel.destroy({
        where: {
          groupId: {
            [Op.in]: unfollowDto.groupIds,
          },
          userId: {
            [Op.in]: unfollowDto.userIds,
          },
        },
      });
      this._logger.debug(`[unfollow] ${response}`);
      this._eventEmitter.emit(new UsersHasBeenUnfollowedEvent(unfollowDto));
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
                   WHERE group_id IN  (${groupIds.join(',')})  
                   AND user_id IN (${userIds.join(',')})  
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
  public async getUniqueUserFollows(
    ignoreUserIds: string[],
    targetGroupIds: string[],
    groupIds: string[],
    followId = 0,
    limit = 1000
  ): Promise<{
    userIds: number[];
    latestFollowId: number;
  }> {
    try {
      const schema = this._databaseConfig.schema;

      const rows = await this._sequelize.query(
        ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS ( 
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC) 
                   AS duplicate_count
                   FROM ${schema}.${this._followModel.tableName} 
                   WHERE group_id IN  (${targetGroupIds.join(',')})  
              ) SELECT id, user_id FROM REMOVE_DUPLICATE tb1 
                WHERE duplicate_count = 1 
                AND NOT EXISTS (
                  SELECT user_id FROM  ${schema}.${this._followModel.tableName} tb2 
                  WHERE group_id IN (${groupIds.join(',')})
                  AND tb1.user_id = tb2.user_id 
                )
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
      this._logger.error(ex, ex.stack);
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
   * @param followId Number
   * @param limit Number
   */
  public async filterUserFollows(
    ignoreUserIds: number[],
    groupIds: number[],
    followId = 0,
    limit = 1000
  ): Promise<{
    userIds: number[];
    latestFollowId: number;
  }> {
    this._logger.debug(
      `[filterUserFollows]:ignoreUserIds: ${ignoreUserIds}. groupIds: ${groupIds}`
    );
    try {
      const schema = this._databaseConfig.schema;

      const rows = await this._sequelize.query(
        ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS ( 
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC) 
                   AS duplicate_count
                   FROM ${schema}.${this._followModel.tableName} 
                   WHERE group_id IN  (${groupIds.join(',')})  
                   AND user_id NOT IN (${ignoreUserIds.join(',')})
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
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
      return {
        userIds: [],
        latestFollowId: 0,
      };
    }
  }

  public async getValidUserIds(userIds: string[], groupIds: string[]): Promise<string[]> {
    const { schema } = getDatabaseConfig();

    const rows = await this._sequelize.query(
      ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS ( 
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC) 
                   AS duplicate_count
                   FROM ${schema}.${FollowModel.tableName} 
                   WHERE group_id IN  (${groupIds.join(',')})  
              ) SELECT user_id FROM REMOVE_DUPLICATE tb1 
                WHERE duplicate_count = 1 
                AND user_id IN  (${userIds.join(',')})  
             `
    );
    if (!rows) {
      return [];
    }

    return rows[0].map((r) => r['user_id']);
  }
}
