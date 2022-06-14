import { Op } from 'sequelize';
import { FollowService } from '../follow';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, Logger } from '@nestjs/common';
import { ChangeGroupAudienceDto } from './dto/change-group-audience.dto';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { ArrayHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { SentryService } from '@app/sentry';

@Injectable()
export class FeedPublisherService {
  private _databaseConfig = getDatabaseConfig();

  private _logger = new Logger(FeedPublisherService.name);
  public constructor(
    private _followService: FollowService,
    @InjectModel(UserNewsFeedModel) private _userNewsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(UserSeenPostModel) private _userSeenPostModel: typeof UserSeenPostModel,
    private readonly _sentryService: SentryService
  ) {}

  public async attachPostsForUsersNewsFeed(userIds: number[], postIds: string[]): Promise<void> {
    this._logger.debug(`[attachPostsForUserNewsFeed]: ${JSON.stringify({ userIds, postIds })}`);
    const schema = this._databaseConfig.schema;
    try {
      const seenPostData = await this._userSeenPostModel.findAll({
        where: { postId: { [Op.in]: postIds }, userId: { [Op.in]: userIds } },
      });
      const seenPostDataMap = seenPostData.reduce(
        (dataMap, seenPostRecord) => ({ userId: true }),
        {}
      );

      const data = userIds
        .map((userId) => {
          return postIds.map((postId) => `(${userId},'${postId}', ${!!seenPostDataMap[userId]})`);
        })
        .flat();

      if (data && data.length) {
        await this._userNewsFeedModel.sequelize.query(
          `INSERT INTO ${schema}.${
            this._userNewsFeedModel.tableName
          } (user_id,post_id, is_seen_post) 
             VALUES ${data.join(',')} ON CONFLICT  (user_id,post_id) DO NOTHING;`
        );
      }
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
      this._sentryService.captureException(ex);
    }
  }

  /**
   * Attach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId String
   */
  public async attachPostForAnyNewsFeed(userIds: number[], postId: string): Promise<void> {
    this._logger.debug(`[attachPostsForAnyNewsFeed]: ${JSON.stringify({ userIds, postId })}`);
    const schema = this._databaseConfig.schema;
    try {
      const seenPostData = await this._userSeenPostModel.findAll({
        where: { postId, userId: { [Op.in]: userIds } },
      });
      const seenPostDataMap = seenPostData.reduce(
        (dataMap, seenPostRecord) => ({ userId: true }),
        {}
      );
      const data = userIds
        .map((userId) => {
          return `(${userId},'${postId}', ${!!seenPostDataMap[userId]})`;
        })
        .join(',');

      await this._userNewsFeedModel.sequelize.query(
        `INSERT INTO ${schema}.${this._userNewsFeedModel.tableName} (user_id,post_id, is_seen_post) 
             VALUES ${data} ON CONFLICT  (user_id,post_id) DO NOTHING;`
      );
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
      this._sentryService.captureException(ex);
    }
  }

  /**
   * Detach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId String
   */
  public async detachPostForAnyNewsFeed(userIds: number[], postId: string): Promise<void> {
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
      this._sentryService.captureException(ex);
    }
  }

  protected async processFanout(
    userId: number,
    postId: string,
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
        this._sentryService.captureException(ex);
        break;
      }
    }
  }

  public fanoutOnWrite(
    createdBy: number,
    postId: string,
    currentGroupIds: number[],
    oldGroupIds: number[]
  ): void {
    this._logger.debug(
      `[fanoutOnWrite]: postId:${postId} currentGroupIds:${currentGroupIds}, oldGroupIds:${oldGroupIds}`
    );
    const differenceGroupIds = [
      ...ArrayHelper.arrDifferenceElements(currentGroupIds, oldGroupIds),
      ...ArrayHelper.arrDifferenceElements(oldGroupIds, currentGroupIds),
    ];
    this._logger.debug(`[fanoutOnWrite]: differenceGroupIds: ${differenceGroupIds}`);
    if (differenceGroupIds.length) {
      const attachedGroupIds = differenceGroupIds.filter(
        (groupId) => !oldGroupIds.includes(groupId)
      );
      const detachedGroupIds = differenceGroupIds.filter((groupId) =>
        oldGroupIds.includes(groupId)
      );

      this._logger.debug(`[fanoutOnWrite]: attachedGroupIds: ${attachedGroupIds}`);
      this._logger.debug(`[fanoutOnWrite]: detachedGroupIds: ${detachedGroupIds}`);

      if (attachedGroupIds.length > 0 && detachedGroupIds.length == 0) {
        this.processFanout(createdBy, postId, {
          attached: attachedGroupIds,
          old: oldGroupIds,
          detached: [],
        }).catch((ex) => {
          this._logger.error(ex, ex.stack);
          this._sentryService.captureException(ex);
        });
      } else if (detachedGroupIds.length > 0) {
        if (attachedGroupIds.length > 0) {
          this.processFanout(createdBy, postId, {
            attached: attachedGroupIds,
            old: [
              ...currentGroupIds.filter((id) => !attachedGroupIds.includes(id)),
              ...detachedGroupIds,
            ],
            detached: [],
          }).catch((ex) => {
            this._logger.error(ex, ex.stack);
            this._sentryService.captureException(ex);
          });
        }
        if (detachedGroupIds[0] != 0)
          this.processFanout(createdBy, postId, {
            attached: [],
            detached: detachedGroupIds,
            current: currentGroupIds,
          }).catch((ex) => {
            this._logger.error(ex, ex.stack);
            this._sentryService.captureException(ex);
          });
      }
    }
  }
}
