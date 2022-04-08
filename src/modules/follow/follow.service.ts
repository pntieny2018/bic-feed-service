import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
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
    @InjectModel(FollowModel) private _followModel: typeof FollowModel
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
      await this._followModel.bulkCreate(bulkCreateData);
      this._eventEmitter.emit(new UsersHasBeenFollowedEvent(createFollowDto));
    } catch (ex) {
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
      await this._followModel.destroy({
        where: {
          groupId: unfollowDto.groupId,
          userId: {
            [Op.in]: unfollowDto.userIds,
          },
        },
      });
      this._eventEmitter.emit(new UsersHasBeenUnfollowedEvent(unfollowDto));
    } catch (ex) {
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
  public async getUniqueUserFollows(
    ignoreUserIds: number[],
    targetGroupIds: number[],
    groupIds: number[],
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
                  SELECT user_id FROM  ${schema}.${this._followModel.tableName}  tb2 
                  WHERE group_id IN  (${groupIds.join(',')}
                ) 
                AND tb1.user_id = tb2.user_id )  
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

      return {
        userIds: [],
        latestFollowId: 0,
      };
    }
  }
}
