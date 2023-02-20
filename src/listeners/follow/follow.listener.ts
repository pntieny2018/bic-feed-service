import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { HTTP_STATUS_ID } from '../../common/constants';
import { On } from '../../common/decorators';
import { ExceptionHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { PostService } from '../../modules/post/post.service';
import { UserService } from '../../shared/user';

@Injectable()
export class FollowListener {
  private readonly _logger = new Logger(FollowListener.name);

  public constructor(
    private _postService: PostService,
    private _feedPublishService: FeedPublisherService,
    private _sentryService: SentryService,
    private readonly _userService: UserService,
    @InjectConnection() private _sequelizeConnection: Sequelize
  ) {}

  @On(UsersHasBeenFollowedEvent)
  public async onUsersFollowGroups(event: UsersHasBeenFollowedEvent): Promise<void> {
    this._logger.debug(`[onUsersFollowGroups]: ${JSON.stringify(event)}`);
    const { payload } = event;

    const { userId, followedGroupIds } = payload;

    const postIds = await this._postService.findIdsByGroupId(followedGroupIds);
    if (postIds.length) {
      this._feedPublishService
        .attachPostsForUsersNewsFeed([userId], postIds)
        .catch((ex) => this._sentryService.captureException(ex));
    }
  }

  @On(UsersHasBeenUnfollowedEvent)
  public async onUsersUnFollowGroup(event: UsersHasBeenUnfollowedEvent): Promise<void> {
    const { userId, unfollowedGroupIds } = event.payload;
    if (unfollowedGroupIds.length > 0) {
      this.detachAllPostsInGroupByUserId(userId, unfollowedGroupIds).catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });
    }
  }

  public async detachAllPostsInGroupByUserId(userId: string, groupIds: string[]): Promise<void> {
    this._logger.debug(`[detachAllPostsInGroupByUserId] userId: ${userId}. groupIds: ${groupIds}`);
    const { schema } = getDatabaseConfig();

    const query = `
    DELETE FROM ${schema}.user_newsfeed u 
    WHERE user_id = ${this._sequelizeConnection.escape(userId)} AND EXISTS(
     SELECT null
     FROM ${schema}.posts_groups pg
       WHERE pg.group_id IN(:groupIds) AND  pg.post_id = u.post_id
   )`;

    await this._sequelizeConnection.query(query, {
      replacements: {
        userId,
        groupIds,
      },
      type: QueryTypes.DELETE,
    });
  }
}
