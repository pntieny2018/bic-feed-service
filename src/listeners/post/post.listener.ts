import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import { SentryService } from '@app/sentry';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notification';
import { ElasticsearchHelper } from '../../common/helpers';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { PostActivityService } from '../../notification/activities';
import { PostService } from '../../modules/post/post.service';
import { MediaStatus } from '../../database/models/media.model';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { MediaService } from '../../modules/media';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { FeedService } from '../../modules/feed/feed.service';

@Injectable()
export class PostListener {
  private _logger = new Logger(PostListener.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _postActivityService: PostActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _postService: PostService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _feedService: FeedService
  ) {}

  @On(PostHasBeenDeletedEvent)
  public async onPostDeleted(event: PostHasBeenDeletedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { actor, post } = event.payload;
    if (post.isDraft) return;

    this._postService.deletePostEditedHistory(post.id).catch((e) => {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    });

    const index = ElasticsearchHelper.INDEX.POST;
    try {
      this._elasticsearchService.delete({ index, id: `${post.id}` }).catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      });

      const activity = this._postActivityService.createPayload({
        actor: actor,
        commentsCount: post.commentsCount,
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
          groups: post.groups.map((g) => g.groupId) as any,
        },
        isArticle: false,
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
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { post, actor } = event.payload;
    const { isDraft, id, content, commentsCount, media, mentions, setting, audience, createdAt } =
      post;

    const mediaIds = media.videos
      .filter((m) => m.status === MediaStatus.WAITING_PROCESS)
      .map((i) => i.id);
    this._postService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));

    if (isDraft) return;

    const activity = this._postActivityService.createPayload(post);
    if (((activity.object.mentions as any) ?? [])?.length === 0) {
      activity.object.mentions = {};
    }
    this._postService
      .savePostEditedHistory(post.id, { oldData: null, newData: post })
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

    const dataIndex = {
      id,
      commentsCount,
      content,
      media,
      mentions,
      audience,
      setting,
      createdAt,
      actor,
    };
    const index = ElasticsearchHelper.INDEX.POST;
    this._elasticsearchService.index({ index, id: `${id}`, body: dataIndex }).catch((e) => {
      this._logger.debug(e);
      this._sentryService.captureException(e);
    });

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        [0]
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
    }
  }

  @On(PostHasBeenUpdatedEvent)
  public async onPostUpdated(event: PostHasBeenUpdatedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { oldPost, newPost, actor } = event.payload;
    const { isDraft, id, content, commentsCount, media, mentions, setting, audience } = newPost;

    if (oldPost.isDraft === false) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS)
        .map((i) => i.id);
      this._postService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));
    }

    if (oldPost.isDraft === false && isDraft === true) {
      this._feedService.deleteNewsFeedByPost(id, null).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    }

    if (isDraft) return;

    this._postService
      .savePostEditedHistory(id, { oldData: oldPost, newData: newPost })
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
        oldData: oldActivity,
      },
    });

    const index = ElasticsearchHelper.INDEX.POST;
    const dataUpdate = {
      commentsCount,
      content,
      media,
      mentions,
      audience,
      setting,
      actor,
    };
    this._elasticsearchService
      .update({ index, id: `${id}`, body: { doc: dataUpdate } })
      .catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      });

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
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { videoId, hlsUrl } = event.payload;
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.COMPLETED });
    const posts = await this._postService.getPostsByMedia(videoId);
    posts.forEach((post) => {
      this._postService.updatePostStatus(post.id);
      const postActivity = this._postActivityService.createPayload(post);
      this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor: post.actor,
          event: event.getEventName(),
          data: postActivity,
        },
      });

      const { actor, id, content, commentsCount, media, mentions, setting, audience, createdAt } =
        post;

      const dataIndex = {
        id,
        commentsCount,
        content,
        media,
        mentions,
        audience,
        setting,
        createdAt,
        actor,
      };
      const index = ElasticsearchHelper.INDEX.POST;
      this._elasticsearchService.index({ index, id: `${id}`, body: dataIndex }).catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      });

      try {
        this._feedPublisherService.fanoutOnWrite(
          actor.id,
          id,
          audience.groups.map((g) => g.id),
          [0]
        );
      } catch (error) {
        this._logger.error(error, error?.stack);
        this._sentryService.captureException(error);
      }
    });
  }

  @On(PostVideoFailedEvent)
  public async onPostVideoFailed(event: PostVideoFailedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);

    const { videoId, hlsUrl } = event.payload;
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.FAILED });
    const posts = await this._postService.getPostsByMedia(videoId);
    posts.forEach((post) => {
      this._postService.updatePostStatus(post.id);
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
