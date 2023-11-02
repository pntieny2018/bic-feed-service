import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { On } from '../../common/decorators';
import { MediaMarkAction, MediaType } from '../../database/models/media.model';
import { PostStatus, PostType } from '../../database/models/post.model';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { SeriesAddedItemsEvent } from '../../events/series';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { MediaService } from '../../modules/media';
import { PostService } from '../../modules/post/post.service';
import { SearchService } from '../../modules/search/search.service';
import {
  IPostEventApplicationService,
  POST_EVENT_APPLICATION_SERVICE,
} from '../../modules/ws/application/application-services/interface';
import { NotificationService } from '../../notification';
import { PostActivityService } from '../../notification/activities';

@Injectable()
export class PostListener {
  private _logger = new Logger(PostListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _postActivityService: PostActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _postService: PostService,
    private readonly _postSearchService: SearchService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _internalEventEmitter: InternalEventEmitterService,
    @Inject(POST_EVENT_APPLICATION_SERVICE)
    private readonly _postWebsocketApp: IPostEventApplicationService
  ) {}

  @On(PostVideoSuccessEvent)
  public async onPostVideoSuccess(event: PostVideoSuccessEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const posts = await this._postService.getsByMedia(videoId);
    const contentSeries = await this._postService.getPostsWithSeries(posts.map((post) => post.id));
    for (const post of posts) {
      const updateVideoData = {
        videoIdProcessing: null,
        mediaJson: {
          videos: [
            {
              id: videoId,
              url: hlsUrl,
              mimeType: properties.mimeType,
              size: properties.size,
              width: properties.width,
              height: properties.height,
              duration: properties.duration,
              thumbnails,
              status: MEDIA_PROCESS_STATUS.COMPLETED,
            },
          ],
          files: [],
          images: [],
        },
      };

      const isScheduledPost =
        post.status === PostStatus.WAITING_SCHEDULE || post.status === PostStatus.SCHEDULE_FAILED;

      const publishedAt = new Date();
      if (!isScheduledPost) {
        updateVideoData['status'] = PostStatus.PUBLISHED;
        updateVideoData['publishedAt'] = publishedAt;
      }

      try {
        await this._postService.updateData([post.id], updateVideoData);
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      }

      if (isScheduledPost) {
        this._logger.debug(
          `[Event video processed]: Post ${post.id} is scheduled - ${post.status}}`
        );
        continue;
      } else {
        this._logger.debug(
          `[Event video processed]: Post ${post.id} is published - ${post.status}}`
        );
      }

      await this._postService.markSeenPost(post.id, post.createdBy);

      const postActivity = this._postActivityService.createPayload({
        id: post.id,
        title: null,
        content: post.content,
        contentType: post.type,
        setting: post.setting,
        media: post.media,
        audience: post.audience,
        mentions: post.mentions as any,
        actor: post.actor,
        createdAt: post.createdAt,
      });
      await this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor: {
            id: post.actor.id,
          },
          event: event.getEventName(),
          data: postActivity,
          meta: {
            post: {
              ignoreUserIds: post.series?.map((series) => series.createdBy),
            },
          },
        },
      });

      // TODO: Move to v2-post module event handler
      await this._postWebsocketApp.emitPostVideoProcessedEvent({
        event: event.getEventName(),
        recipients: post.audience.groups.map((group) => group.id),
        postId: post.id,
        status: 'successful',
      });

      const {
        id,
        content,
        media,
        mentions,
        createdBy,
        audience,
        createdAt,
        updatedAt,
        type,
        isHidden,
        tags,
      } = post;

      const mentionUserIds = [];
      for (const key in mentions) {
        mentionUserIds.push(mentions[key].id);
      }

      await this._postSearchService.addPostsToSearch([
        {
          id,
          type,
          content,
          isHidden,
          media,
          mentionUserIds,
          groupIds: audience.groups.map((group) => group.id),
          communityIds: audience.groups.map((group) => group.rootGroupId),
          seriesIds: (contentSeries.find((item) => item.id === id).postSeries || []).map(
            (series) => series.seriesId
          ),
          tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
          createdBy,
          createdAt,
          updatedAt,
          publishedAt,
        },
      ]);

      try {
        this._feedPublisherService.fanoutOnWrite(
          id,
          audience.groups.map((g) => g.id),
          []
        );
      } catch (error) {
        this._logger.error(JSON.stringify(error?.stack));
        this._sentryService.captureException(error);
      }
    }

    for (const post of contentSeries) {
      const isScheduledPost =
        post.status === PostStatus.WAITING_SCHEDULE || post.status === PostStatus.SCHEDULE_FAILED;
      if (isScheduledPost) {
        continue;
      }

      if (post['postSeries']?.length > 0) {
        for (const seriesItem of post['postSeries']) {
          this._internalEventEmitter.emit(
            new SeriesAddedItemsEvent({
              itemIds: [post.id],
              seriesId: seriesItem.seriesId,
              actor: {
                id: post.createdBy,
              },
              context: 'publish',
            })
          );
        }
      }
    }

    await this._mediaService.emitMediaToUploadService(
      MediaType.VIDEO,
      MediaMarkAction.USED,
      [videoId],
      posts[0]?.createdBy || null
    );
  }

  @On(PostVideoFailedEvent)
  public async onPostVideoFailed(event: PostVideoFailedEvent): Promise<void> {
    const { videoId } = event.payload;
    const posts = await this._postService.getsByMedia(videoId);
    for (const post of posts) {
      const isScheduledPost =
        post.status === PostStatus.WAITING_SCHEDULE || post.status === PostStatus.SCHEDULE_FAILED;

      await this._postService
        .updateData([post.id], {
          mediaJson: {
            ...post.media,
            videos: [
              ...post.media?.videos?.map((video) => {
                if (video.id === videoId) {
                  return { ...video, status: MEDIA_PROCESS_STATUS.FAILED };
                }
                return video;
              }),
            ],
          },
          status: isScheduledPost ? PostStatus.SCHEDULE_FAILED : PostStatus.DRAFT,
          videoIdProcessing: null,
        })
        .catch((e) => {
          this._logger.error(JSON.stringify(e?.stack));
          this._sentryService.captureException(e);
        });

      if (isScheduledPost) {
        this._logger.debug(`[Event video failed]: Post ${post.id} is scheduled fail`);
        continue;
      } else {
        this._logger.debug(`[Event video failed]: Post ${post.id} is published fail`);
      }

      // TODO: Move to v2-post module event handler
      await this._postWebsocketApp.emitPostVideoProcessedEvent({
        event: event.getEventName(),
        recipients: post.audience.groups.map((group) => group.id),
        postId: post.id,
        status: 'failed',
      });

      const postActivity = this._postActivityService.createPayload({
        title: null,
        actor: post.actor,
        content: post.content,
        createdAt: post.createdAt,
        setting: {
          canComment: post.setting.canComment,
          canReact: post.setting.canReact,
          isImportant: post.setting.isImportant,
        },
        id: post.id,
        audience: post.audience,
        contentType: PostType.POST,
        mentions: post.mentions as any,
      });
      this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor: {
            id: post.actor.id,
          },
          event: event.getEventName(),
          data: postActivity,
        },
      });
    }
  }
}
