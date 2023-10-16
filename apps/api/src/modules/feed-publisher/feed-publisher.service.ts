import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { ArrayHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostModel, PostStatus } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { FollowService } from '../follow';

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

  public async attachPostsForUsersNewsFeed(
    userId: string,
    groupIds: string[],
    limit = 1000
  ): Promise<void> {
    const schema = this._databaseConfig.schema;
    try {
      this._logger.debug(`[attachPostsForUsersNewsFeed]: userId:${userId} -- groupIds:${groupIds}`);

      for (const groupId of groupIds) {
        await this._userNewsFeedModel.sequelize.query(
          `
          INSERT INTO ${schema}.${this._userNewsFeedModel.tableName} (user_id, post_id, is_seen_post) 
          SELECT ${userId} as user_id, post_id, false as is_seen_post
          FROM ${schema}.${PostGroupModel.tableName} pg
          INNER JOIN ${schema}.${PostModel.tableName} p ON p.id = pg.post_id
          WHERE pg.group_id = :groupId 
                AND pg.is_archived = :isArchived 
                AND p.status :status
                AND p.is_hidden = FALSE
          ORDER BY p.created_at DESC
          LIMIT :limit
          ON CONFLICT (user_id, post_id) DO NOTHING
          `,
          {
            replacements: {
              groupId,
              status: PostStatus.PUBLISHED,
              isArchived: false,
              limit,
            },
          }
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
      //for ex: old: 12, new: 2,3 => attach: 3 and keep 1,2
      this._logger.debug(
        `[fanoutOnWrite]: attachedGroupIds: ${JSON.stringify(
          attachedGroupIds
        )} and keep: ${JSON.stringify(oldGroupIds)}`
      );
      while (true) {
        const { userIds, latestFollowId: lastId } = await this._followService.getUserFollowGroupIds(
          attachedGroupIds,
          oldGroupIds,
          latestFollowId,
          1000
        );
        if (userIds.length) {
          await this.attachPostToUserIds(userIds, postId);
          this._logger.debug(
            `[fanoutOnWrite]: attached post: ${postId} to users(${userIds.length}): ${userIds}`
          );
        }
        if (userIds.length === 0 || userIds.length < 1000) {
          break;
        }
        latestFollowId = lastId;
      }
    }

    if (detachedGroupIds.length > 0) {
      let latestFollowId = 0;
      //for ex: old: 12, new: 2 => detach: 1 and keep 2
      this._logger.debug(
        `[fanoutOnWrite]: detachedGroupIds: ${JSON.stringify(
          detachedGroupIds
        )} and keep: ${JSON.stringify(newGroupIds)}`
      );
      while (true) {
        const { userIds, latestFollowId: lastId } = await this._followService.getUserFollowGroupIds(
          detachedGroupIds,
          newGroupIds,
          latestFollowId,
          1000
        );
        if (userIds.length) {
          await this.detachPostFromUserIds(userIds, postId);
        }
        this._logger.debug(
          `[fanoutOnWrite]: dettached post: ${postId} to users(${userIds.length}): ${userIds}`
        );
        if (userIds.length === 0 || userIds.length < 1000) {
          break;
        }
        latestFollowId = lastId;
      }
    }
  }
}
