import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { On } from '../../common/decorators';
import { ArrayHelper } from '../../common/helpers';
import { MediaMarkAction, MediaStatus, MediaType } from '../../database/models/media.model';
import { PostStatus, PostType } from '../../database/models/post.model';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { PostsArchivedOrRestoredByGroupEvent } from '../../events/post/posts-archived-or-restored-by-group.event';
import { SeriesAddedItemsEvent, SeriesRemovedItemsEvent } from '../../events/series';
import { SeriesChangedItemsEvent } from '../../events/series/series-changed-items.event';
import { FeedService } from '../../modules/feed/feed.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { FilterUserService } from '../../modules/filter-user';
import { MediaService } from '../../modules/media';
import { SeriesSimpleResponseDto } from '../../modules/post/dto/responses';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { PostService } from '../../modules/post/post.service';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { TagService } from '../../modules/tag/tag.service';
import { UserDto } from '../../modules/v2-user/application';
import { NotificationService } from '../../notification';
import { ISeriesState, PostActivityService } from '../../notification/activities';

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
    if (post.status !== PostStatus.PUBLISHED) {
      return;
    }

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
        title: null,
        actor: actor,
        content: post.content,
        createdAt: post.createdAt,
        setting: {
          canComment: post.canComment,
          canReact: post.canReact,
          isImportant: post.isImportant,
        },
        id: post.id,
        audience: {
          //groups: (post?.groups ?? []).map((g) => g.groupId) as any,
          groups: post?.groups ?? ([] as any),
        },
        contentType: PostType.POST,
        mentions: post.mentions as any,
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
      publishedAt,
      type,
      isHidden,
      tags,
      setting,
    } = post;
    if (post.videoIdProcessing) {
      await this._mediaService
        .processVideo([post.videoIdProcessing])
        .catch((ex) => this._logger.debug(JSON.stringify(ex?.stack)));
    }

    if (status !== PostStatus.PUBLISHED) {
      return;
    }

    const activity = this._postActivityService.createPayload({
      id,
      title: null,
      content,
      contentType: type,
      setting,
      audience: audience,
      mentions: mentions as any,
      actor: actor,
      createdAt: createdAt,
    });
    if (((activity.object.mentions as any) ?? [])?.length === 0) {
      activity.object.mentions = {};
    }

    await this._notificationService.publishPostNotification({
      key: `${post.id}`,
      value: {
        actor: {
          id: post.createdBy,
        },
        event: event.getEventName(),
        data: activity,
        meta: {
          post: {
            ignoreUserIds: post.series?.map((series) => series.createdBy),
          },
        },
      },
    });
    const mentionUserIds = [];
    for (const key in mentions) {
      mentionUserIds.push(mentions[key].id);
    }
    const contentSeries = (await this._postService.getPostsWithSeries([id]))[0];
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
        seriesIds: contentSeries.postSeries.map((item) => item.seriesId),
        tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
        createdBy,
        createdAt,
        updatedAt,
        publishedAt,
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
            context: 'publish',
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
      publishedAt,
      isHidden,
      tags,
    } = newPost;

    if (oldPost.status === PostStatus.PUBLISHED && newPost.videoIdProcessing) {
      this._mediaService
        .processVideo([newPost.videoIdProcessing])
        .catch((e) => this._sentryService.captureException(e));
    }

    if (status !== PostStatus.PUBLISHED) {
      return;
    }

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
      const updatedActivity = this._postActivityService.createPayload({
        id: newPost.id,
        title: null,
        content: newPost.content,
        contentType: newPost.type,
        setting: newPost.setting,
        audience: newPost.audience,
        mentions: newPost.mentions as any,
        actor: newPost.actor,
        createdAt: newPost.createdAt,
      });
      const oldActivity = this._postActivityService.createPayload({
        id: oldPost.id,
        title: null,
        content: oldPost.content,
        contentType: oldPost.type,
        setting: oldPost.setting,
        audience: oldPost.audience,
        mentions: oldPost.mentions as any,
        actor: oldPost.actor,
        createdAt: oldPost.createdAt,
      });

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
              ignoreUserIds: newPost.series?.map((series) => series.createdBy),
            },
          },
        },
      });
    }
    const contentSeries = (await this._postService.getPostsWithSeries([id]))[0];
    this._postSearchService.updatePostsToSearch([
      {
        id,
        type,
        content,
        media,
        isHidden,
        mentionUserIds,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        seriesIds: contentSeries.postSeries.map((item) => item.seriesId),
        tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
        createdBy,
        createdAt,
        updatedAt,
        publishedAt,
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

    const seriesIds = newPost.series?.map((s) => s.id) ?? [];
    const oldSeriesIds = oldPost.series?.map((s) => s.id) ?? [];

    const getItems =
      (state: 'add' | 'remove') =>
      (s: SeriesSimpleResponseDto): ISeriesState => ({
        id: s.id,
        actor: { id: s.createdBy },
        title: s.title,
        state: state,
      });

    const removeSeriesWithState = (oldPost.series?.map(getItems('remove')) ?? []).filter(
      (item) => !seriesIds.includes(item.id)
    );

    const newSeriesWithState = (newPost.series?.map(getItems('add')) ?? []).filter(
      (item) => !oldSeriesIds.includes(item.id)
    );

    let skipNotifyForNewItems = [];
    let skipNotifyForRemoveItems = [];

    if (newSeriesWithState.length && removeSeriesWithState.length) {
      const result = new Map<string, ISeriesState[]>();

      [...newSeriesWithState, ...removeSeriesWithState].forEach((item: ISeriesState): void => {
        const key = item.actor.id;
        if (!result.has(key)) {
          result.set(key, []);
        }
        const items = result.get(key);
        items.push(item);
        result.set(key, items);
      });

      const sameOwnerItems = [];

      result.forEach((r) => {
        const newItem = r.filter((i) => i.state === 'add');
        const removeItem = r.filter((i) => i.state === 'remove');
        if (newItem.length && removeItem.length) {
          sameOwnerItems.push(r);
          skipNotifyForNewItems = newItem.map((i) => i.id);
          skipNotifyForRemoveItems = removeItem.map((i) => i.id);
        }
      });

      if (sameOwnerItems.length && !newPost.isHidden) {
        sameOwnerItems.forEach((so) => {
          this._internalEventEmitter.emit(
            new SeriesChangedItemsEvent({
              content: {
                id: newPost.id,
                content: newPost.content,
                type: newPost.type,
                createdBy: newPost.createdBy,
                createdAt: newPost.createdAt,
                updatedAt: newPost.createdAt,
              } as any,
              series: so,
              actor: actor,
            })
          );
        });
      }
    }

    if (seriesIds && seriesIds.length > 0) {
      const newSeriesIds = seriesIds.filter((id) => !oldSeriesIds.includes(id));

      newSeriesIds.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesAddedItemsEvent({
            itemIds: [newPost.id],
            seriesId: seriesId,
            skipNotify: skipNotifyForNewItems.includes(seriesId) || newPost.isHidden,
            actor: actor,
            context: 'publish',
          })
        )
      );
    }

    if (oldSeriesIds && oldSeriesIds.length > 0) {
      const seriesIdsDeleted = oldSeriesIds.filter((id) => !seriesIds.includes(id));
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
            skipNotify: skipNotifyForRemoveItems.includes(seriesId) || newPost.isHidden,
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
    const contentSeries = await this._postService.getPostsWithSeries(posts.map((post) => post.id));
    for (const post of posts) {
      const publishedAt = new Date();
      try {
        await this._postService.updateData([post.id], {
          videoIdProcessing: null,
          status: PostStatus.PUBLISHED,
          publishedAt,
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
                status: MediaStatus.COMPLETED,
              },
            ],
            files: [],
            images: [],
          },
        });
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      }

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
    posts.forEach((post) => {
      this._postService
        .updateData([post.id], {
          mediaJson: {
            ...post.media,
            videos: [
              ...post.media?.videos?.map((video) => {
                if (video.id === videoId) {
                  return { ...video, status: MediaStatus.FAILED };
                }
                return video;
              }),
            ],
          },
          status: PostStatus.DRAFT,
          videoIdProcessing: null,
        })
        .catch((e) => {
          this._logger.error(JSON.stringify(e?.stack));
          this._sentryService.captureException(e);
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
