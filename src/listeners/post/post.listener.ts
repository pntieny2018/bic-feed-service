import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import { SentryService } from '@app/sentry';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notification';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { PostActivityService } from '../../notification/activities';
import { PostService } from '../../modules/post/post.service';
import { MediaStatus } from '../../database/models/media.model';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { MediaService } from '../../modules/media';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { FeedService } from '../../modules/feed/feed.service';
import { PostPrivacy } from '../../database/models/post.model';
import { NIL as NIL_UUID } from 'uuid';
import { PostSearchService } from '../../modules/post/post-search.service';
import { PostHistoryService } from '../../modules/post/post-history.service';
@Injectable()
export class PostListener {
  private _logger = new Logger(PostListener.name);
  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _postActivityService: PostActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _postService: PostService,
    private readonly _postSearchService: PostSearchService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _feedService: FeedService,
    private readonly _postHistoryService: PostHistoryService
  ) {}

  @On(PostHasBeenDeletedEvent)
  public async onPostDeleted(event: PostHasBeenDeletedEvent): Promise<void> {
    const { actor, post } = event.payload;
    if (post.isDraft) return;

    this._postHistoryService.deleteEditedHistory(post.id).catch((e) => {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    });

    try {
      this._postSearchService.deletePostsToSearch([post]);

      const activity = this._postActivityService.createPayload({
        actor: actor,
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        createdBy: post.createdBy,
        isDraft: post.isDraft,
        isProcessing: false,
        setting: {
          canComment: post.canComment,
          canReact: post.canReact,
          canShare: post.canShare,
        },
        id: post.id,
        audience: {
          users: [],
          groups: (post?.groups ?? []).map((g) => g.groupId) as any,
        },
        isArticle: false,
        privacy: PostPrivacy.PUBLIC,
      });

      this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor,
          event: event.getEventName(),
          data: activity,
        },
      });

      return;
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      return;
    }
  }

  @On(PostHasBeenPublishedEvent)
  public async onPostPublished(event: PostHasBeenPublishedEvent): Promise<void> {
    const { post, actor } = event.payload;
    const {
      isDraft,
      id,
      content,
      commentsCount,
      totalUsersSeen,
      media,
      mentions,
      setting,
      audience,
      createdAt,
      isArticle,
    } = post;
    const mediaIds = media.videos
      .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
      .map((i) => i.id);
    await this._mediaService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));

    if (isDraft) return;

    const activity = this._postActivityService.createPayload(post);
    if (((activity.object.mentions as any) ?? [])?.length === 0) {
      activity.object.mentions = {};
    }
    this._postHistoryService
      .saveEditedHistory(post.id, { oldData: null, newData: post })
      .catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });

    this._notificationService.publishPostNotification({
      key: `${post.id}`,
      value: {
        actor,
        event: event.getEventName(),
        data: activity,
      },
    });

    this._postSearchService.addPostsToSearch([
      {
        id,
        isArticle,
        commentsCount,
        totalUsersSeen,
        content,
        media,
        mentions,
        audience,
        setting,
        createdAt,
        actor,
      },
    ]);

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        [NIL_UUID]
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
    }
  }

  @On(PostHasBeenUpdatedEvent)
  public async onPostUpdated(event: PostHasBeenUpdatedEvent): Promise<void> {
    const { oldPost, newPost, actor } = event.payload;
    const {
      isDraft,
      id,
      content,
      commentsCount,
      totalUsersSeen,
      media,
      mentions,
      setting,
      audience,
      isArticle,
      lang,
      createdAt,
    } = newPost;

    if (oldPost.isDraft === false) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
        .map((i) => i.id);
      this._mediaService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));
    }

    if (oldPost.isDraft === false && isDraft === true) {
      this._feedService.deleteNewsFeedByPost(id, null).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    }

    if (isDraft) return;

    this._postHistoryService
      .saveEditedHistory(id, { oldData: oldPost, newData: newPost })
      .catch((e) => {
        this._logger.debug(e, e?.stack);
        this._sentryService.captureException(e);
      });

    const updatedActivity = this._postActivityService.createPayload(newPost);
    const oldActivity = this._postActivityService.createPayload(oldPost);

    this._notificationService.publishPostNotification({
      key: `${id}`,
      value: {
        actor,
        event: event.getEventName(),
        data: updatedActivity,
        meta: {
          post: {
            oldData: oldActivity,
          },
        },
      },
    });

    this._postSearchService.updatePostsToSearch([
      {
        id,
        isArticle,
        commentsCount,
        totalUsersSeen,
        content,
        media,
        mentions,
        audience,
        setting,
        createdAt,
        actor,
        lang,
      },
    ]);
    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        oldPost.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
    }
  }

  @On(PostVideoSuccessEvent)
  public async onPostVideoSuccess(event: PostVideoSuccessEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const dataUpdate = {
      url: hlsUrl,
      status: MediaStatus.COMPLETED,
    };
    if (properties?.name) dataUpdate['name'] = properties.name;
    if (properties?.mimeType) dataUpdate['mimeType'] = properties.mimeType;
    if (properties?.size) dataUpdate['size'] = properties.size;
    if (thumbnails) dataUpdate['thumbnails'] = thumbnails;
    await this._mediaService.updateData([videoId], dataUpdate);
    const posts = await this._postService.getsByMedia(videoId);
    posts.forEach((post) => {
      this._postService.updateStatus(post.id);
      const postActivity = this._postActivityService.createPayload(post);
      this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor: post.actor,
          event: event.getEventName(),
          data: postActivity,
        },
      });

      const {
        actor,
        id,
        content,
        commentsCount,
        totalUsersSeen,
        media,
        mentions,
        setting,
        audience,
        createdAt,
        isArticle,
      } = post;

      this._postSearchService.addPostsToSearch([
        {
          id,
          isArticle,
          commentsCount,
          totalUsersSeen,
          content,
          media,
          mentions,
          audience,
          setting,
          createdAt,
          actor,
        },
      ]);
      try {
        this._feedPublisherService.fanoutOnWrite(
          actor.id,
          id,
          audience.groups.map((g) => g.id),
          [NIL_UUID]
        );
      } catch (error) {
        this._logger.error(error, error?.stack);
        this._sentryService.captureException(error);
      }
    });
  }

  @On(PostVideoFailedEvent)
  public async onPostVideoFailed(event: PostVideoFailedEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const dataUpdate = {
      url: hlsUrl,
      status: MediaStatus.FAILED,
    };
    if (properties?.name) dataUpdate['name'] = properties.name;
    if (properties?.mimeType) dataUpdate['mimeType'] = properties.mimeType;
    if (properties?.size) dataUpdate['size'] = properties.size;
    if (thumbnails) dataUpdate['thumbnails'] = thumbnails;
    await this._mediaService.updateData([videoId], dataUpdate);
    const posts = await this._postService.getsByMedia(videoId);
    posts.forEach((post) => {
      this._postService.updateStatus(post.id);
      const postActivity = this._postActivityService.createPayload(post);
      this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor: post.actor,
          event: event.getEventName(),
          data: postActivity,
        },
      });
    });
  }
}
