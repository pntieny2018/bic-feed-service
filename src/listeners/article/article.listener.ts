import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { NIL as NIL_UUID } from 'uuid';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { On } from '../../common/decorators';
import { ArrayHelper } from '../../common/helpers';
import { MediaStatus, MediaType } from '../../database/models/media.model';
import { PostStatus } from '../../database/models/post.model';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent
} from '../../events/article';
import { SeriesAddedArticlesEvent } from '../../events/series';
import { ArticleService } from '../../modules/article/article.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { FeedService } from '../../modules/feed/feed.service';
import { MediaService } from '../../modules/media';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { TagService } from '../../modules/tag/tag.service';
import { NotificationService } from '../../notification';
import { PostActivityService } from '../../notification/activities';

@Injectable()
export class ArticleListener {
  private _logger = new Logger(ArticleListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _feedService: FeedService,
    private readonly _seriesService: SeriesService,
    private readonly _tagService: TagService,
    private readonly _articleService: ArticleService,
    private readonly _postServiceHistory: PostHistoryService,
    private readonly _postSearchService: SearchService,
    private readonly _postActivityService: PostActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _internalEventEmitter: InternalEventEmitterService
  ) {}

  @On(ArticleHasBeenDeletedEvent)
  public async onArticleDeleted(event: ArticleHasBeenDeletedEvent): Promise<void> {
    const { article } = event.payload;
    if (article.status !== PostStatus.PUBLISHED) return;

    this._postServiceHistory.deleteEditedHistory(article.id).catch((e) => {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    });

    this._postSearchService.deletePostsToSearch([article]).catch((e) => {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    });

    this._tagService
      .decreaseTotalUsed(article.postTags.map((e) => e.tagId))
      .catch((ex) => this._logger.debug(ex));

    const activity = this._postActivityService.createPayload({
      actor: {
        id: article.createdBy,
      },
      title: article.title,
      commentsCount: article.commentsCount,
      totalUsersSeen: article.totalUsersSeen,
      content: article.content,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      createdBy: article.createdBy,
      status: article.status,
      setting: {
        canComment: article.canComment,
        canReact: article.canReact,
        canShare: article.canShare,
      },
      id: article.id,
      audience: {
        users: [],
        groups: (article?.groups ?? []).map((g) => ({
          id: g.groupId,
        })) as any,
      },
      type: article.type,
      privacy: article.privacy,
    });

    this._notificationService.publishPostNotification({
      key: `${article.id}`,
      value: {
        actor: {
          id: article.createdBy,
        },
        event: event.getEventName(),
        data: activity,
      },
    });
  }

  @On(ArticleHasBeenPublishedEvent)
  public async onArticlePublished(event: ArticleHasBeenPublishedEvent): Promise<void> {
    const { article, actor } = event.payload;
    const {
      status,
      id,
      content,
      media,
      audience,
      createdAt,
      updatedAt,
      type,
      title,
      summary,
      coverMedia,
      categories,
      tags,
      createdBy,
      isHidden,
    } = article;
    const mediaIds = media.videos
      .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
      .map((i) => i.id);
    this._mediaService
      .processVideo(mediaIds)
      .catch((e) => this._logger.debug(JSON.stringify(e?.stack)));

    if (status !== PostStatus.PUBLISHED) return;

    this._postServiceHistory
      .saveEditedHistory(article.id, { oldData: null, newData: article })
      .catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });

    this._postSearchService
      .addPostsToSearch([
        {
          id,
          type,
          content,
          isHidden,
          groupIds: audience.groups.map((group) => group.id),
          communityIds: audience.groups.map((group) => group.rootGroupId),
          createdBy,
          updatedAt,
          createdAt,
          title,
          summary,
          coverMedia: {
            id: coverMedia.id,
            createdBy: coverMedia.createdBy,
            url: coverMedia.url,
            createdAt: coverMedia.createdAt,
            name: coverMedia.name,
            type: coverMedia.type as MediaType,
            originName: coverMedia.originName,
            width: coverMedia.width,
            height: coverMedia.height,
            extension: coverMedia.extension,
          },
          categories: categories.map((category) => ({ id: category.id, name: category.name })),
          tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
        },
      ])
      .catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });

    if (article.tags.length) {
      this._tagService
        .increaseTotalUsed(article.tags.map((e) => e.id))
        .catch((ex) => this._logger.debug(ex));
    }

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        [NIL_UUID]
      );
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      this._sentryService.captureException(error);
    }

    const activity = this._postActivityService.createPayload(article);
    this._notificationService.publishPostNotification({
      key: `${article.id}`,
      value: {
        actor: actor.profile,
        event: event.getEventName(),
        data: activity,
      },
    });

    if (article.series && article.series.length) {
      for (const sr of article.series) {
        this._internalEventEmitter.emit(
          new SeriesAddedArticlesEvent({
            isAdded: false,
            articleIds: [article.id],
            seriesId: sr.id,
            actor: actor,
          })
        );
      }
    }
  }

  @On(ArticleHasBeenUpdatedEvent)
  public async onArticleUpdated(event: ArticleHasBeenUpdatedEvent): Promise<void> {
    const { oldArticle, newArticle, actor } = event.payload;
    const {
      status,
      id,
      content,
      media,
      createdBy,
      audience,
      type,
      createdAt,
      updatedAt,
      lang,
      summary,
      title,
      coverMedia,
      categories,
      tags,
      isHidden,
    } = newArticle;

    if (oldArticle.status === PostStatus.PUBLISHED && status === PostStatus.DRAFT) {
      this._feedService.deleteNewsFeedByPost(id, null).catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });
      if (tags.length) {
        this._tagService
          .decreaseTotalUsed(tags.map((e) => e.id))
          .catch((ex) => this._logger.debug(ex));
      }
    }

    if (status !== PostStatus.PUBLISHED) return;
    this._postServiceHistory
      .saveEditedHistory(id, { oldData: oldArticle, newData: oldArticle })
      .catch((e) => {
        this._logger.debug(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });

    this._postSearchService.updatePostsToSearch([
      {
        id,
        type,
        content,
        isHidden,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        createdAt,
        updatedAt,
        createdBy,
        lang,
        summary,
        title,
        coverMedia: {
          id: coverMedia.id,
          createdBy: coverMedia.createdBy,
          url: coverMedia.url,
          createdAt: coverMedia.createdAt,
          type: coverMedia.type as MediaType,
          name: coverMedia.name,
          originName: coverMedia.originName,
          width: coverMedia.width,
          height: coverMedia.height,
          extension: coverMedia.extension,
        },
        categories: categories.map((category) => ({ id: category.id, name: category.name })),
        tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
      },
    ]);

    if (tags.length !== oldArticle.tags.length) {
      const oldTagIds = oldArticle.tags.map((e) => e.id);
      const newTagIds = tags.map((e) => e.id);
      const deleteIds = ArrayHelper.arrDifferenceElements(oldTagIds, newTagIds);
      if (deleteIds) {
        this._tagService.decreaseTotalUsed(deleteIds).catch((ex) => this._logger.debug(ex));
      }
      const addIds = ArrayHelper.arrDifferenceElements(newTagIds, oldTagIds);
      if (addIds) {
        this._tagService.increaseTotalUsed(addIds).catch((ex) => this._logger.debug(ex));
      }
    }

    if (!newArticle.isHidden) {
      const updatedActivity = this._postActivityService.createPayload(newArticle);
      const oldActivity = this._postActivityService.createPayload(oldArticle);

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

      const series = newArticle.series?.map((s) => s.id) ?? [];

      if (series.length > 0) {
        const oldSeriesIds = oldArticle.series?.map((s) => s.id) ?? [];

        const newSeriesIds = series.filter((id) => !oldSeriesIds.includes(id));

        for (const seriesId of newSeriesIds) {
          this._internalEventEmitter.emit(
            new SeriesAddedArticlesEvent({
              isAdded: false,
              articleIds: [newArticle.id],
              seriesId: seriesId,
              actor: actor,
            })
          );
        }
      }
    }

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        oldArticle.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      this._sentryService.captureException(error);
    }
  }
}
