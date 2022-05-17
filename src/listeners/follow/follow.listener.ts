import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { SentryService } from '../../../libs/sentry/src';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { ExceptionHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { getDatabaseConfig } from '../../config/database';
import { QueryTypes } from 'sequelize';

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
    const { payload } = event;

    const postIds = await this._postService.findPostIdsByGroupId(payload.groupIds[0]);

    payload.userIds.map((userId) =>
      this._feedPublishService.attachPostsForUserNewsFeed(userId, postIds)
    );
  }

  @On(UsersHasBeenUnfollowedEvent)
  public async onUsersUnFollowGroup(event: UsersHasBeenUnfollowedEvent): Promise<void> {
    const {
      payload: { userIds, groupId },
    } = event;

    userIds.forEach(async (userId: number) => {
      return this.userUnfollowGroup(userId, groupId).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    });
  }

  public async userUnfollowGroup(userId: number, groupId: number): Promise<any> {
    this._logger.debug(`[userUnfollowGroup] userId: ${userId}. groupId: ${groupId}`);

    const userSharedDto = await this._userService.get(userId);
    if (!userSharedDto) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
    }

    const { schema } = getDatabaseConfig();

    const query = `
      DELETE FROM ${schema}.user_newsfeed AS "un"
      WHERE "un".id IN 
      (
        SELECT "un_need_to_delete".id
        FROM (
          SELECT "un_sq".id, (
            SELECT ARRAY_AGG("pg".group_id)
		        FROM ${schema}.posts_groups AS "pg"
		        WHERE "pg".post_id = "un_sq".post_id
          ) AS groups_of_post
          FROM ${schema}.user_newsfeed AS "un_sq"
          WHERE "un_sq".user_id=${this._sequelizeConnection.escape(userId)}
        ) AS "un_need_to_delete"
        WHERE "un_need_to_delete".groups_of_post && ARRAY[${userSharedDto.groups ?? []}] = false
      )
    `;

    await this._sequelizeConnection.query(query, { type: QueryTypes.DELETE });
  }
}
