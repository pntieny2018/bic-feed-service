import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';

@Injectable()
export class FollowListener {
  private readonly _logger = new Logger(FollowListener.name);

  public constructor(
    private _postService: PostService,
    private _feedPublishService: FeedPublisherService
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
    const { payload } = event;
  }
}
