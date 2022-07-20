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
import { SeriesService } from '../../modules/series/series.service';
import { PostPrivacy } from '../../database/models/post.model';
import { Severity } from '@sentry/node';

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
    private readonly _feedService: FeedService,
    private readonly _seriesService: SeriesService
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

    const index = ElasticsearchHelper.getIndexOfPostByLang(post.lang);
    try {
      this._elasticsearchService.delete({ index, id: `${post.id}` }).catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      });

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
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
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
    await this._postService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));

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
    };
    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    this._elasticsearchService
      .index({
        index,
        id: `${id}`,
        body: dataIndex,
        pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
      })
      .then((res) => {
        const lang = ElasticsearchHelper.getLangOfPostByIndexName(res.body._index);
        this._postService.updatePostData([id], { lang });
      })
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
        ['00000000-0000-0000-0000-000000000000']
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
    } = newPost;

    if (oldPost.isDraft === false) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
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
        meta: {
          post: {
            oldData: oldActivity,
          },
        },
      },
    });

    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    const dataUpdate = {
      commentsCount,
      totalUsersSeen,
      content,
      media,
      mentions,
      audience,
      setting,
      actor,
      isArticle,
    };
    this._elasticsearchService
      .index({
        index,
        id: `${id}`,
        body: dataUpdate,
        pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
      })
      .then((res) => {
        const newLang = ElasticsearchHelper.getLangOfPostByIndexName(res.body._index);
        if (lang !== newLang) {
          this._postService.updatePostData([id], { lang: newLang });
          const oldIndex = ElasticsearchHelper.getIndexOfPostByLang(lang);
          this._elasticsearchService
            .delete({ index: oldIndex, id: `${id}` })
            .then((res) => console.log(res))
            .catch((e) => {
              this._logger.debug(e);
              this._sentryService.captureException(e);
            });
        }
      })
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

      const dataIndex = {
        id,
        commentsCount,
        totalUsersSeen,
        content,
        media,
        mentions,
        audience,
        setting,
        createdAt,
        actor,
        isArticle,
      };
      const index = ElasticsearchHelper.ALIAS.POST.default.name;
      this._elasticsearchService
        .index({
          index,
          id: `${id}`,
          body: dataIndex,
          pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
        })
        .then((res) => {
          console.log(res);
          const lang = ElasticsearchHelper.getLangOfPostByIndexName(res.body._index);
          this._postService.updatePostData([id], { lang });
        })
        .catch((e) => {
          this._logger.debug(e);
          this._sentryService.captureException(e);
        });
      try {
        this._feedPublisherService.fanoutOnWrite(
          actor.id,
          id,
          audience.groups.map((g) => g.id),
          ['00000000-0000-0000-0000-000000000000']
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
