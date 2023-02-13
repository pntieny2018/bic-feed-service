import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { NIL as NIL_UUID } from 'uuid';
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
import { UserSharedDto } from '../../shared/user/dto';
import { PostsArchivedOrRestoredByGroupEvent } from '../../events/post/posts-archived-or-restored-by-group.event';

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
    private readonly _filterUserService: FilterUserService
  ) {}

  @On(PostHasBeenDeletedEvent)
  public async onPostDeleted(event: PostHasBeenDeletedEvent): Promise<void> {
    const { actor, post } = event.payload;
    if (post.status !== PostStatus.PUBLISHED) return;

    this._postHistoryService.deleteEditedHistory(post.id).catch((e) => {
      this._logger.error(JSON.stringify(e?.stack));
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
    } = post;
    const mediaIds = media.videos
      .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
      .map((i) => i.id);
    await this._mediaService
      .processVideo(mediaIds)
      .catch((ex) => this._logger.debug(JSON.stringify(ex?.stack)));

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

    this._notificationService.publishPostNotification({
      key: `${post.id}`,
      value: {
        actor,
        event: event.getEventName(),
        data: activity,
      },
    });
    const mentionUserIds = [];
    for (const key in mentions) {
      mentionUserIds.push(mentions[key].id);
    }
    const mediaList = [];
    for (const mediaType in media) {
      for (const mediaItem of media[mediaType]) {
        mediaList.push({
          id: mediaItem.id,
          status: mediaItem.status,
          type: mediaItem.type,
          name: mediaItem.name,
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
    this._postSearchService.addPostsToSearch([
      {
        id,
        type,
        content,
        isHidden,
        media: mediaList,
        mentionUserIds,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        createdBy,
        createdAt,
        updatedAt,
      },
    ]);

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
    } = newPost;

    if (oldPost.status === PostStatus.PUBLISHED) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
        .map((i) => i.id);
      this._mediaService
        .processVideo(mediaIds)
        .catch((e) => this._sentryService.captureException(e));
    }

    if (oldPost.status === PostStatus.PUBLISHED && status !== PostStatus.PUBLISHED) {
      this._feedService.deleteNewsFeedByPost(id, null).catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });
    }

    if (status !== PostStatus.PUBLISHED) return;

    // this._postHistoryService
    //   .saveEditedHistory(id, { oldData: oldPost, newData: newPost })
    //   .catch((e) => {
    //     this._sentryService.captureException(e);
    //   });

    const mentionUserIds = [];
    const mentionMap = new Map<string, UserSharedDto>();

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
        createdBy,
        createdAt,
        updatedAt,
        lang,
      },
    ]);
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
      this._postService.updateStatus(post.id).catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });
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
        media,
        mentions,
        createdBy,
        audience,
        createdAt,
        updatedAt,
        type,
        isHidden,
      } = post;

      const mentionUserIds = [];
      for (const key in mentions) {
        mentionUserIds.push(mentions[key].id);
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
      this._postSearchService.addPostsToSearch([
        {
          id,
          type,
          content,
          isHidden,
          media: mediaList,
          mentionUserIds,
          groupIds: audience.groups.map((group) => group.id),
          communityIds: audience.groups.map((group) => group.rootGroupId),
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
      this._postService.updateStatus(post.id).catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });
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

  @On(PostsArchivedOrRestoredByGroupEvent)
  public async onPostsArchivedOrRestoredByGroup(
    event: PostsArchivedOrRestoredByGroupEvent
  ): Promise<void> {
    for (const post of event.payload.posts) {
      if (post.status === PostStatus.PUBLISHED) {
        await this._postSearchService.updateAttributePostToSearch(post, {
          groupIds: event.payload.mappingPostIdGroupIds[post.id],
        });
      }
    }
    await this._postSearchService.updateAttributePostsToSearch(
      event.payload.posts,
      event.payload.posts.map((post) => ({
        groupIds: event.payload.mappingPostIdGroupIds[post.id],
      }))
    );
  }
}
