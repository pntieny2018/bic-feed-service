import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { getDatabaseConfig } from '../../config/database';
import { CreateFollowDto, UnfollowDto } from './dto/requests';
import { FollowModel } from '../../database/models/follow.model';
import { GetUserIdsResponseDto } from './dto/response/get-user-ids-response.dto';
import { GetFollowedCondition, GetUserIdsDto } from './dto/requests/get-user-ids.dto';

@Injectable()
export class FollowService {
  private _databaseConfig = getDatabaseConfig();

  private _logger = new Logger(FollowService.name);

  public constructor(@InjectModel(FollowModel) private _followModel: typeof FollowModel) {}

  /**
   * Make user follow  group
   * @param createFollowDto CreateFollowDto
   * @returns Promise resolve Array<FollowModel>
   * @throws RpcException
   */
  public async follow(createFollowDto: CreateFollowDto): Promise<FollowModel[]> {
    try {
      const bulkCreateData = createFollowDto.userIds
        .map((userId) =>
          createFollowDto.groupIds.map((groupId) => ({
            userId: userId,
            groupId: groupId,
          }))
        )
        .flat();
      return await this._followModel.bulkCreate(bulkCreateData);
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
  public async unfollow(unfollowDto: UnfollowDto): Promise<number> {
    try {
      return await this._followModel.destroy({
        where: {
          groupId: unfollowDto.groupId,
          userId: {
            [Op.in]: unfollowDto.userIds,
          },
        },
      });
    } catch (ex) {
      throw new RpcException("Can't unfollow");
    }
  }

  /**
   * Get user follows
   * @param groupIds Array<Number>
   * @param followedAt
   * @param limit Number
   * @returns Promise resolve GetUsersFollowDto
   */
  public async getUserFollows(
    groupIds: number[],
    followedAt: Date = null,
    limit = 100
  ): Promise<GetUserIdsResponseDto> {
    let followedAtCondition: any = {
      createdAt: {
        [Op.gt]: followedAt,
      },
    };

    if (!followedAt) {
      followedAtCondition = {};
    }

    const follows = await this._followModel.findAll({
      attributes: ['userId', 'createdAt'],
      where: {
        groupId: {
          [Op.in]: groupIds,
        },
        ...followedAtCondition,
      },
      order: [['createdAt', 'ASC']],
      limit: limit,
    });

    const jsonData = follows.map((f) => f.toJSON());
    const userIds = jsonData.map((u) => u.userId);
    const followedAtResponse = jsonData[jsonData.length - 1].createdAt;

    return new GetUserIdsResponseDto(limit, followedAtResponse.toISOString(), {
      userIds: userIds,
    });
  }

  /**
   * Find user ids, who should remove post in newsfeed
   * @param getUserIdsDto GetUserIdsDto
   * @param followedAt Date
   * @param limit Number
   * @returns Promise resolve Array<Number>
   */
  public async getUserIdsWhenUpdatedGroupAudience(
    getUserIdsDto: GetUserIdsDto,
    followedAt: Date = null,
    limit = 100
  ): Promise<GetUserIdsResponseDto> {
    try {
      const schema = this._databaseConfig.schema;

      const followedAtCondition = FollowService._makeFollowedCondition(followedAt);

      const userIdsRaw = await this._followModel.sequelize.query(
        `
                    SELECT user_id  FROM ${schema}.${this._followModel.tableName}
                        WHERE user_id NOT IN (
                            SELECT user_id FROM ${schema}.${this._followModel.tableName} 
                            WHERE group_id IN $current
                        )
                        AND user_id IN (
                            SELECT user_id FROM ${schema}.${this._followModel.tableName}  
                            WHERE group_id IN $detached
                        )
                        ${followedAtCondition.condition}
                        LIMIT $limit
                        ORDER BY created_at DESC
          `,
        {
          bind: {
            current: getUserIdsDto.currentGroupIds,
            detached: getUserIdsDto.detachedGroupIds,
            limit: limit,
            ...followedAtCondition.bind,
          },
        }
      );
      if (userIdsRaw[0].length) {
        const followedAtResponse = userIdsRaw[0][userIdsRaw[0].length - 1]['created_at'];

        const userIds = userIdsRaw[0].map((u) => u['user_id']);
        return new GetUserIdsResponseDto(limit, followedAtResponse, {
          userIds: userIds,
        });
      }

      return new GetUserIdsResponseDto(limit, null, {
        userIds: [],
      });
    } catch (e) {
      this._logger.error(e, e.stack);

      return new GetUserIdsResponseDto(limit, null, {
        userIds: [],
      });
    }
  }

  private static _makeFollowedCondition(followedAt: Date = null): GetFollowedCondition {
    if (!followedAt) {
      return new GetFollowedCondition('', {});
    }
    return new GetFollowedCondition('AND created_at > $followedAt', {
      followedAt: followedAt,
    });
  }
}
