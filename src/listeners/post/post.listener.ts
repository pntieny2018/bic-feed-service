import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { MediaStatus } from '../../database/models/media.model';
import { PostPrivacy, PostStatus, PostType } from '../../database/models/post.model';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { FeedService } from '../../modules/feed/feed.service';
import { MediaService } from '../../modules/media';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { PostService } from '../../modules/post/post.service';
import { SearchService } from '../../modules/search/search.service';
import { NotificationService } from '../../notification';
import { PostActivityService } from '../../notification/activities';
import { FilterUserService } from '../../modules/filter-user';
import { PostsArchivedOrRestoredByGroupEvent } from '../../events/post/posts-archived-or-restored-by-group.event';
import { ArrayHelper } from '../../common/helpers';
import { SeriesAddedItemsEvent, SeriesRemovedItemsEvent } from '../../events/series';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { TagService } from '../../modules/tag/tag.service';
import { UserDto } from '../../modules/v2-user/application';
import { SeriesService } from '../../modules/series/series.service';

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
    private readonly _feedService: FeedService,
    private readonly _postHistoryService: PostHistoryService,
    private readonly _filterUserService: FilterUserService,
    private readonly _internalEventEmitter: InternalEventEmitterService,
    private readonly _tagService: TagService,
    private readonly _seriesService: SeriesService
  ) {}

  @On(PostHasBeenDeletedEvent)
  public async onPostDeleted(event: PostHasBeenDeletedEvent): Promise<void> {
    const { actor, post } = event.payload;
    if (post.status !== PostStatus.PUBLISHED) return;

    this._postHistoryService.deleteEditedHistory(post.id).catch((e) => {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    });

    this._tagService
      .decreaseTotalUsed(post.postTags.map((e) => e.tagId))
      .catch((ex) => this._logger.debug(ex));

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
        status: post.status,
        setting: {
          canComment: post.canComment,
          canReact: post.canReact,
          canShare: post.canShare,
        },
        id: post.id,
        audience: {
          users: [],
          //groups: (post?.groups ?? []).map((g) => g.groupId) as any,
          groups: post?.groups ?? ([] as any),
        },
        type: PostType.POST,
        privacy: PostPrivacy.OPEN,
      });

      await this._notificationService.publishPostNotification({
        key: `${post.id}`,
        value: {
          actor: {
            id: post.createdBy,
          },
          event: event.getEventName(),
          data: activity,
        },
      });

      const seriesIds = post['postSeries']?.map((postSeries) => postSeries.seriesId) ?? [];
      for (const seriesId of seriesIds) {
        this._internalEventEmitter.emit(
          new SeriesRemovedItemsEvent({
            items: [
              {
                id: post.id,
                title: null,
                content: post.content,
                type: post.type,
                createdBy: post.createdBy,
                groupIds: post.groups.map((group) => group.groupId),
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
              },
            ],
            seriesId: seriesId,
            actor: actor,
            contentIsDeleted: true,
          })
        );
      }

      return;
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      this._sentryService.captureException(error);
      return;
    }
  }

  @On(PostHasBeenPublishedEvent)
  public async onPostPublished(event: PostHasBeenPublishedEvent): Promise<void> {
    const { post, actor } = event.payload;
    const {
      status,
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
    if (post.videoIdProcessing) {
      await this._mediaService
        .processVideo([post.videoIdProcessing])
        .catch((ex) => this._logger.debug(JSON.stringify(ex?.stack)));
    }

    if (status !== PostStatus.PUBLISHED) return;

    const activity = this._postActivityService.createPayload(post);
    if (((activity.object.mentions as any) ?? [])?.length === 0) {
      activity.object.mentions = {};
    }
    // this._postHistoryService
    //   .saveEditedHistory(post.id, { oldData: null, newData: post })
    //   .catch((e) => {
    //     this._logger.error(JSON.stringify(e?.stack));
    //     this._sentryService.captureException(e);
    //   });

    await this._notificationService.publishPostNotification({
      key: `${post.id}`,
      value: {
        actor: {
          id: post.createdBy,
        },
        event: event.getEventName(),
        data: activity,
      },
    });
    const mentionUserIds = [];
    for (const key in mentions) {
      mentionUserIds.push(mentions[key].id);
    }
    this._postSearchService.addPostsToSearch([
      {
        id,
        type,
        content,
        isHidden,
        media,
        mentionUserIds,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
        createdBy,
        createdAt,
        updatedAt,
      },
    ]);

    if (post.tags.length) {
      this._tagService
        .increaseTotalUsed(post.tags.map((e) => e.id))
        .catch((ex) => this._logger.debug(ex));
    }

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        id,
        audience.groups.map((g) => g.id),
        []
      );
    } catch (error) {
      this._sentryService.captureException(error);
    }
    if (post.series && post.series.length) {
      for (const sr of post.series) {
        this._internalEventEmitter.emit(
          new SeriesAddedItemsEvent({
            itemIds: [post.id],
            seriesId: sr.id,
            actor: actor,
          })
        );
      }
    }
  }

  @On(PostHasBeenUpdatedEvent)
  public async onPostUpdated(event: PostHasBeenUpdatedEvent): Promise<void> {
    const { oldPost, newPost, actor } = event.payload;
    const {
      status,
      id,
      content,
      media,
      mentions,
      createdBy,
      audience,
      type,
      lang,
      createdAt,
      updatedAt,
      isHidden,
      tags,
    } = newPost;

    if (oldPost.status === PostStatus.PUBLISHED && newPost.videoIdProcessing) {
      this._mediaService
        .processVideo([newPost.videoIdProcessing])
        .catch((e) => this._sentryService.captureException(e));
    }

    if (status !== PostStatus.PUBLISHED) return;

    // this._postHistoryService
    //   .saveEditedHistory(id, { oldData: oldPost, newData: newPost })
    //   .catch((e) => {
    //     this._sentryService.captureException(e);
    //   });

    const mentionUserIds = [];
    const mentionMap = new Map<string, UserDto>();

    for (const key in mentions) {
      mentionUserIds.push(mentions[key].id);
      mentionMap.set(mentions[key].id, mentions[key]);
    }
    const validUserIds = await this._filterUserService.filterUser(newPost.id, mentionUserIds);

    const validMention = {};

    for (const id of validUserIds) {
      const u = mentionMap.get(id);
      validMention[u.username] = u;
    }
    newPost.mentions = validMention;

    if (!newPost.isHidden) {
      const updatedActivity = this._postActivityService.createPayload(newPost);
      const oldActivity = this._postActivityService.createPayload(oldPost);

      await this._notificationService.publishPostNotification({
        key: `${id}`,
        value: {
          actor: {
            id: newPost.createdBy,
          },
          event: event.getEventName(),
          data: updatedActivity,
          meta: {
            post: {
              oldData: oldActivity,
            },
          },
        },
      });
    }

    const mediaList = [];
    for (const mediaType in media) {
      for (const mediaItem of media[mediaType]) {
        mediaList.push({
          id: mediaItem.id,
          status: mediaItem.status,
          name: mediaItem.name,
          type: mediaItem.type,
          url: mediaItem.url,
          size: mediaItem.size,
          width: mediaItem.width,
          height: mediaItem.height,
          originName: mediaItem.originName,
          extension: mediaItem.extension,
          mimeType: mediaItem.mimeType,
          thumbnails: mediaItem.thumbnails,
          createdAt: mediaItem.createdAt,
          createdBy: mediaItem.createdBy,
        });
      }
    }
    this._postSearchService.updatePostsToSearch([
      {
        id,
        type,
        content,
        media: mediaList,
        isHidden,
        mentionUserIds,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
        createdBy,
        createdAt,
        updatedAt,
        lang,
      },
    ]);

    const oldTagIds = (oldPost.tags || []).map((e) => e.id);
    const newTagIds = (tags || []).map((e) => e.id);
    const deleteIds = ArrayHelper.arrDifferenceElements(oldTagIds, newTagIds);
    if (deleteIds) {
      this._tagService.decreaseTotalUsed(deleteIds).catch((ex) => this._logger.debug(ex));
    }
    const addIds = ArrayHelper.arrDifferenceElements(newTagIds, oldTagIds);
    if (addIds) {
      this._tagService.increaseTotalUsed(addIds).catch((ex) => this._logger.debug(ex));
    }

    const series = newPost.series?.map((s) => s.id) ?? [];
    const oldSeriesIds = oldPost.series?.map((s) => s.id) ?? [];
    if (series && series.length > 0) {
      const newSeriesIds = series.filter((id) => !oldSeriesIds.includes(id));

      newSeriesIds.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesAddedItemsEvent({
            itemIds: [newPost.id],
            seriesId: seriesId,
            actor: actor,
          })
        )
      );
    }
    if (oldSeriesIds && oldSeriesIds.length > 0) {
      const seriesIdsDeleted = oldSeriesIds.filter((id) => !series.includes(id));
      seriesIdsDeleted.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesRemovedItemsEvent({
            items: [
              {
                id: newPost.id,
                title: null,
                content: newPost.content,
                type: newPost.type,
                createdBy: newPost.createdBy,
                groupIds: newPost.audience.groups.map((group) => group.id),
                createdAt: newPost.createdAt,
                updatedAt: newPost.updatedAt,
              },
            ],
            seriesId: seriesId,
            actor: actor,
            contentIsDeleted: false,
          })
        )
      );
    }

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        id,
        audience.groups.map((g) => g.id),
        oldPost.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._sentryService.captureException(error);
    }
  }

  @On(PostVideoSuccessEvent)
  public async onPostVideoSuccess(event: PostVideoSuccessEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const posts = await this._postService.getsByMedia(videoId);
    posts.forEach((post) => {
      this._postService
        .updateData([post.id], {
          videoIdProcessing: null,
          status: PostStatus.PUBLISHED,
          mediaJson: {
            videos: [
              {
                url: hlsUrl,
                mimeType: properties.mimeType,
                size: properties.size,
                width: properties.width,
                height: properties.height,
                duration: properties.duration,
                thumbnails,
                status: MediaStatus.COMPLETED,
              },
            ],
            files: [],
            images: [],
          },
        })
        .catch((e) => {
          this._logger.error(JSON.stringify(e?.stack));
          this._sentryService.captureException(e);
        });
      const postActivity = this._postActivityService.createPayload(post);
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
      this._postSearchService.addPostsToSearch([
        {
          id,
          type,
          content,
          isHidden,
          media,
          mentionUserIds,
          groupIds: audience.groups.map((group) => group.id),
          communityIds: audience.groups.map((group) => group.rootGroupId),
          tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
          createdBy,
          createdAt,
          updatedAt,
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
    });

    const postWithSeries = await this._postService.getListWithGroupsByIds(
      posts.map((post) => post.id),
      false
    );
    for (const post of postWithSeries) {
      if (post['postSeries']?.length > 0) {
        for (const seriesItem of post['postSeries']) {
          this._internalEventEmitter.emit(
            new SeriesAddedItemsEvent({
              itemIds: [post.id],
              seriesId: seriesItem.id,
              actor: {
                id: post.createdBy,
              },
            })
          );
        }
      }
    }
  }

  @On(PostVideoFailedEvent)
  public async onPostVideoFailed(event: PostVideoFailedEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const posts = await this._postService.getsByMedia(videoId);
    posts.forEach((post) => {
      this._postService
        .updateData([post.id], {
          mediaJson: {
            videos: [
              {
                url: hlsUrl,
                mimeType: properties.mimeType,
                size: properties.size,
                width: properties.width,
                height: properties.height,
                duration: properties.duration,
                thumbnails: thumbnails,
                status: MediaStatus.FAILED,
              },
            ],
            files: [],
            images: [],
          },
          status: PostStatus.DRAFT,
        })
        .catch((e) => {
          this._logger.error(JSON.stringify(e?.stack));
          this._sentryService.captureException(e);
        });
      const postActivity = this._postActivityService.createPayload(post);
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
    });
  }

  @On(PostsArchivedOrRestoredByGroupEvent)
  public async onPostsArchivedOrRestoredByGroup(
    event: PostsArchivedOrRestoredByGroupEvent
  ): Promise<void> {
    await this._postSearchService.updateAttributePostsToSearch(
      event.payload.posts,
      event.payload.posts.map((post) => ({
        groupIds: event.payload.mappingPostIdGroupIds[post.id],
      }))
    );
  }
}
