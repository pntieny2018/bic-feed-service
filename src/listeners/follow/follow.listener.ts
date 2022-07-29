import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { SentryService } from '@app/sentry';
import { InjectConnection } from '@nestjs/sequelize';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { ExceptionHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { getDatabaseConfig } from '../../config/database';
import { QueryTypes } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

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

    const { userIds, groupIds } = payload;

    const postIds = await this._postService.findPostIdsByGroupId(groupIds);

    if (postIds && postIds.length) {
      this._feedPublishService
        .attachPostsForUsersNewsFeed(userIds, postIds)
        .catch((ex) => this._sentryService.captureException(ex));
    }
  }

  @On(UsersHasBeenUnfollowedEvent)
  public async onUsersUnFollowGroup(event: UsersHasBeenUnfollowedEvent): Promise<void> {
    this._logger.debug(`[onUsersUnFollowGroup]: ${JSON.stringify(event)}`);
    const {
      payload: { userIds, groupIds },
    } = event;

    userIds.forEach((userId: string) => {
      this.detachPosts(userId, groupIds).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    });
  }

  public async detachPosts(userId: string, groupIds: string[]): Promise<any> {
    this._logger.debug(`[userUnfollowGroup] userId: ${userId}. groupId: ${groupIds}`);

    const userSharedDto = await this._userService.get(userId);

    if (!userSharedDto) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_EXISTING);
    }

    let filterGroup = (userSharedDto.groups ?? [])
      .filter((gId) => !groupIds.includes(gId))
      .map((gId) => `'${gId}'`);

    if (!filterGroup.length) {
      filterGroup = [`''`];
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
          WHERE "un_sq".user_id = :userId
        ) AS "un_need_to_delete"
          WHERE ( "un_need_to_delete".groups_of_post::text[] &&  ARRAY[${filterGroup}] )= false
      )
    
    `;

    await this._sequelizeConnection.query(query, {
      replacements: {
        userId: userId,
      },
      type: QueryTypes.DELETE,
    });
  }
}
