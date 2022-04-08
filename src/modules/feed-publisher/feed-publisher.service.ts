import { Op } from 'sequelize';
import { FollowService } from '../follow';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, Logger } from '@nestjs/common';
import { ChangeGroupAudienceDto } from './dto/change-group-audience.dto';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { ArrayHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';

@Injectable()
export class FeedPublisherService {
  private _databaseConfig = getDatabaseConfig();

  private _logger = new Logger(FeedPublisherService.name);
  public constructor(
    private _followService: FollowService,
    @InjectModel(UserNewsFeedModel) private _userNewsFeedModel: typeof UserNewsFeedModel
  ) {}

  public async attachPostsForUserNewsFeed(userId: number, postIds: number[]): Promise<void> {
    this._logger.debug(`[attachPostsForUserNewsFeed]: ${JSON.stringify({ userId, postIds })}`);

    try {
      await this._userNewsFeedModel.bulkCreate(
        postIds.map((postId) => ({
          userId: userId,
          postId: postId,
        }))
      );
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  /**
   * Attach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId Array<Number>
   */
  public async attachPostForAnyNewsFeed(userIds: number[], postId: number): Promise<void> {
    this._logger.debug(`[attachPostsForAnyNewsFeed]: ${JSON.stringify({ userIds, postId })}`);
    const schema = this._databaseConfig.schema;
    try {
      const data = userIds
        .map((userId) => {
          return `(${userId},${postId})`;
        })
        .join(',');

      await this._userNewsFeedModel.sequelize.query(
        `INSERT INTO ${schema}.${this._userNewsFeedModel.tableName} (user_id,post_id) 
             VALUES ${data} ON CONFLICT  (user_id,post_id) DO NOTHING;`
      );
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  /**
   * Detach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId Array<Number>
   */
  public async detachPostForAnyNewsFeed(userIds: number[], postId: number): Promise<void> {
    this._logger.debug(`[detachPostsForAnyNewsFeed]: ${JSON.stringify({ userIds, postId })}`);

    try {
      await this._userNewsFeedModel.destroy({
        where: {
          userId: {
            [Op.in]: userIds,
          },
          postId: postId,
        },
      });
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  public async detachPostForAllNewsFeed(postId: number): Promise<void> {
    try {
      await this._userNewsFeedModel.destroy({
        where: {
          postId: postId,
        },
      });
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  protected async processFanout(
    userId: number,
    postId: number,
    changeGroupAudienceDto: ChangeGroupAudienceDto
  ): Promise<void> {
    this._logger.debug(`[processFanout]: ${JSON.stringify({ postId, changeGroupAudienceDto })}`);
    let latestFollowId = 0;
    const { old, attached, detached, current } = changeGroupAudienceDto;
    let followers: {
      userIds: number[];
      latestFollowId: number;
    };

    while (true) {
      try {
        if (attached.length) {
          // if attached new group
          // I will only get users who are in the new group but not in the old groups
          followers = await this._followService.getUniqueUserFollows(
            [0],
            attached,
            old,
            latestFollowId
          );
          if (followers.userIds.length) {
            await this.attachPostForAnyNewsFeed(followers.userIds, postId);
          }
        }

        if (detached.length) {
          /**
           ** attached group
           ** detach group and attach new group
           ** replace group
           */
          // I will only get users who are in the attached group but not in the old groups
          followers = await this._followService.getUniqueUserFollows(
            [0],
            detached,
            current,
            latestFollowId
          );
          if (followers.userIds.length) {
            await this.detachPostForAnyNewsFeed(followers.userIds, postId);
          }
        }
        latestFollowId = followers?.latestFollowId ?? 0;
        if (!followers?.userIds?.length) {
          break;
        }
      } catch (ex) {
        this._logger.error(ex, ex.stack);

        break;
      }
    }
  }

  public fanoutOnWrite(
    createdBy: number,
    postId: number,
    currentGroupIds: number[],
    oldGroupIds: number[]
  ): void {
    const differenceGroupIds = [
      ...ArrayHelper.differenceArrNumber(currentGroupIds, oldGroupIds),
      ...ArrayHelper.differenceArrNumber(oldGroupIds, currentGroupIds),
    ];
    if (differenceGroupIds.length) {
      const attachedGroupIds = differenceGroupIds.filter(
        (groupId) => !oldGroupIds.includes(groupId)
      );
      const detachedGroupIds = differenceGroupIds.filter((groupId) =>
        oldGroupIds.includes(groupId)
      );

      if (attachedGroupIds.length > 0 && detachedGroupIds.length == 0) {
        this.processFanout(createdBy, postId, {
          attached: attachedGroupIds,
          old: oldGroupIds,
          detached: [],
        }).catch((ex) => this._logger.error(ex, ex.stack));
      } else if (detachedGroupIds.length > 0) {
        if (attachedGroupIds.length > 0) {
          this.processFanout(createdBy, postId, {
            attached: attachedGroupIds,
            old: [
              ...currentGroupIds.filter((id) => !attachedGroupIds.includes(id)),
              ...detachedGroupIds,
            ],
            detached: [],
          }).catch((ex) => this._logger.error(ex, ex.stack));
        }
        if (detachedGroupIds[0] != 0)
          this.processFanout(createdBy, postId, {
            attached: [],
            detached: detachedGroupIds,
            current: currentGroupIds,
          }).catch((ex) => this._logger.error(ex, ex.stack));
      }
    }
  }
}
