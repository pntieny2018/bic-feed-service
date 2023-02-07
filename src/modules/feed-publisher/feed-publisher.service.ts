import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';
import { ArrayHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { FollowService } from '../follow';
import { FollowsDto } from '../follow/dto/response/follows.dto';
import { ChangeGroupAudienceDto } from './dto/change-group-audience.dto';

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

  public async attachPostsForUsersNewsFeed(userIds: string[], postIds: string[]): Promise<void> {
    const schema = this._databaseConfig.schema;
    try {
      this._logger.debug(`[attachPostsForUsersNewsFeed]: userIds:${userIds} -- postIds:${postIds}`);
      // const seenPostData = await this._userSeenPostModel.findAll({
      //   where: { postId: { [Op.in]: postIds }, userId: { [Op.in]: userIds } },
      // });
      // const seenPostDataMap = seenPostData.reduce(
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //   (_dataMap, _seenPostRecord) => ({ userId: true }),
      //   {}
      // );

      const data = userIds
        .map((userId) => {
          //return postIds.map((postId) => `('${userId}','${postId}', ${!!seenPostDataMap[userId]})`);
          return postIds.map((postId) => `('${userId}','${postId}', false)`);
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
      this._logger.debug(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    }
  }

  /**
   * Attach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId String
   */
  public async attachPostToUserIds(userIds: string[], postId: string): Promise<void> {
    const schema = this._databaseConfig.schema;
    try {
      // const seenPostData = await this._userSeenPostModel.findAll({
      //   where: { postId, userId: { [Op.in]: userIds } },
      // });
      // const seenPostDataMap = seenPostData.reduce(
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //   (_dataMap, _seenPostRecord) => ({ userId: true }),
      //   {}
      // );
      const data = userIds
        .map((userId) => {
          //return `('${userId}','${postId}', ${!!seenPostDataMap[userId]})`;
          return `('${userId}','${postId}', false)`;
        })
        .join(',');

      await this._userNewsFeedModel.sequelize.query(
        `INSERT INTO ${schema}.${this._userNewsFeedModel.tableName} (user_id,post_id, is_seen_post) 
             VALUES ${data} ON CONFLICT  (user_id,post_id) DO NOTHING;`
      );
    } catch (ex) {
      this._logger.debug(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    }
  }

  /**
   * Detach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId String
   */
  public async detachPostFromUserIds(userIds: string[], postId: string): Promise<void> {
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
      this._logger.debug(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    }
  }

  public async fanoutOnWrite(
    postId: string,
    newGroupIds: string[],
    oldGroupIds: string[]
  ): Promise<void> {
    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (attachedGroupIds.length > 0) {
      let latestFollowId = 0;
      //for ex: old: 12, new: 2,3 => notchange is 2, attach: 3
      const groupIdsNotChange = ArrayHelper.arrDifferenceElements(newGroupIds, attachedGroupIds);
      this._logger.debug(
        `[fanoutOnWrite]: attachedGroupIds: ${attachedGroupIds} and keep: ${groupIdsNotChange}`
      );
      while (true) {
        const { userIds, latestFollowId: lastId } = await this._followService.getUserFollowGroupIds(
          attachedGroupIds,
          groupIdsNotChange,
          latestFollowId,
          1000
        );
        if (userIds.length) {
          await this.attachPostToUserIds(userIds, postId);
          this._logger.debug(
            `[fanoutOnWrite]: attached post: ${postId} to users(${userIds.length}): ${userIds}`
          );
        }
        if (userIds.length === 0 || userIds.length < 1000) break;
        latestFollowId = lastId;
      }
    }

    if (detachedGroupIds.length > 0) {
      let latestFollowId = 0;
      //for ex: old: 12, new: 2,3 => notchange is 2, detach: 1
      const groupIdsNotChange = ArrayHelper.arrDifferenceElements(oldGroupIds, detachedGroupIds);
      this._logger.debug(
        `[fanoutOnWrite]: detachedGroupIds: ${detachedGroupIds} and keep: ${groupIdsNotChange}`
      );
      while (true) {
        const { userIds, latestFollowId: lastId } = await this._followService.getUserFollowGroupIds(
          detachedGroupIds,
          groupIdsNotChange,
          latestFollowId,
          1000
        );
        if (userIds.length) {
          await this.detachPostFromUserIds(userIds, postId);
        }
        this._logger.debug(
          `[fanoutOnWrite]: dettached post: ${postId} to users(${userIds.length}): ${userIds}`
        );
        if (userIds.length === 0 || userIds.length < 1000) break;
        latestFollowId = lastId;
      }
    }
  }
}
