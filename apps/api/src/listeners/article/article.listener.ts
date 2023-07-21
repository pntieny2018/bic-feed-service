import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { On } from '../../common/decorators';
import { ArrayHelper } from '../../common/helpers';
import { PostStatus } from '../../database/models/post.model';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
import {
  SeriesAddedItemsEvent,
  SeriesChangedItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../events/series';
import { ArticleService } from '../../modules/article/article.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { FeedService } from '../../modules/feed/feed.service';
import { MediaService } from '../../modules/media';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { TagService } from '../../modules/tag/tag.service';
import { NotificationService } from '../../notification';
import { ISeriesState, PostActivityService } from '../../notification/activities';
import { SeriesSimpleResponseDto } from '../../modules/post/dto/responses';
import { PostService } from '../../modules/post/post.service';

@Injectable()
export class ArticleListener {
  private _logger = new Logger(ArticleListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _postService: PostService,
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
    const { article, actor } = event.payload;
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
        username: 'unused',
        email: 'unused',
        avatar: 'unused',
        fullname: 'unused',
      },
      title: article.title,
      content: article.content,
      contentType: article.type,
      createdAt: article.createdAt,
      setting: {
        canComment: article.canComment,
        canReact: article.canReact,
        isImportant: article.isImportant,
      },
      id: article.id,
      audience: {
        groups: (article?.groups ?? []).map((g) => ({
          id: g.groupId,
        })) as any,
      },
    });

    await this._notificationService.publishPostNotification({
      key: `${article.id}`,
      value: {
        actor: {
          id: article.createdBy,
        },
        event: event.getEventName(),
        data: activity,
      },
    });

    const seriesIds = article['postSeries'].map((series) => series.seriesId) ?? [];
    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          items: [
            {
              id: article.id,
              title: article.title,
              content: article.content,
              type: article.type,
              createdBy: article.createdBy,
              groupIds: article.groups.map((group) => group.groupId),
              createdAt: article.createdAt,
              updatedAt: article.updatedAt,
            },
          ],
          seriesId: seriesId,
          actor,
          contentIsDeleted: true,
        })
      );
    }
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
      publishedAt,
      type,
      title,
      summary,
      coverMedia,
      categories,
      tags,
      createdBy,
      isHidden,
    } = article;

    if (status !== PostStatus.PUBLISHED) return;

    const contentSeries = (await this._postService.getPostsWithSeries([id]))[0];
    this._postSearchService
      .addPostsToSearch([
        {
          id,
          type,
          content,
          isHidden,
          groupIds: audience.groups.map((group) => group.id),
          communityIds: audience.groups.map((group) => group.rootGroupId),
          seriesIds: contentSeries.postSeries.map((item) => item.seriesId),
          createdBy,
          updatedAt,
          createdAt,
          publishedAt,
          title,
          summary,
          coverMedia,
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
        id,
        audience.groups.map((g) => g.id),
        []
      );
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      this._sentryService.captureException(error);
    }

    const activity = this._postActivityService.createPayload({
      id: article.id,
      title: article.title,
      content: article.content,
      contentType: article.type,
      setting: article.setting,
      audience: article.audience,
      mentions: article.mentions as any,
      actor: article.actor,
      createdAt: article.createdAt,
    });
    await this._notificationService.publishPostNotification({
      key: `${article.id}`,
      value: {
        actor: actor,
        event: event.getEventName(),
        data: activity,
        meta: {
          post: {
            ignoreUserIds: article.series?.map((series) => series.createdBy),
          },
        },
      },
    });

    if (article.series && article.series.length) {
      for (const sr of article.series) {
        this._internalEventEmitter.emit(
          new SeriesAddedItemsEvent({
            itemIds: [article.id],
            seriesId: sr.id,
            actor: actor,
            context: 'publish',
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
      createdBy,
      audience,
      type,
      createdAt,
      updatedAt,
      publishedAt,
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

    const contentSeries = (await this._postService.getPostsWithSeries([id]))[0];

    this._postSearchService.updatePostsToSearch([
      {
        id,
        type,
        content,
        isHidden,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        seriesIds: contentSeries.postSeries.map((item) => item.seriesId),
        createdAt,
        updatedAt,
        publishedAt,
        createdBy,
        lang,
        summary,
        title,
        coverMedia,
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
      const updatedActivity = this._postActivityService.createPayload({
        id: newArticle.id,
        title: newArticle.title,
        content: newArticle.content,
        contentType: newArticle.type,
        setting: newArticle.setting,
        audience: newArticle.audience,
        mentions: newArticle.mentions as any,
        actor: newArticle.actor,
        createdAt: newArticle.createdAt,
      });
      const oldActivity = this._postActivityService.createPayload({
        id: oldArticle.id,
        title: oldArticle.title,
        content: oldArticle.content,
        contentType: oldArticle.type,
        setting: oldArticle.setting,
        audience: oldArticle.audience,
        mentions: oldArticle.mentions as any,
        actor: oldArticle.actor,
        createdAt: oldArticle.createdAt,
      });

      await this._notificationService.publishPostNotification({
        key: `${id}`,
        value: {
          actor: actor,
          event: event.getEventName(),
          data: updatedActivity,
          meta: {
            post: {
              oldData: oldActivity,
              ignoreUserIds: newArticle.series?.map((series) => series.createdBy),
            },
          },
        },
      });
    }

    const seriesIds = newArticle.series?.map((s) => s.id) ?? [];
    const oldSeriesIds = oldArticle.series?.map((s) => s.id) ?? [];
    const newSeriesIds = seriesIds.filter((id) => !oldSeriesIds.includes(id));

    const getItems =
      (state: 'add' | 'remove') =>
      (s: SeriesSimpleResponseDto): ISeriesState => ({
        id: s.id,
        actor: { id: s.createdBy },
        title: s.title,
        state: state,
      });

    const removeSeriesWithState = (oldArticle.series?.map(getItems('remove')) ?? []).filter(
      (item) => !seriesIds.includes(item.id)
    );

    const newSeriesWithState = (newArticle.series?.map(getItems('add')) ?? []).filter(
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

      if (sameOwnerItems.length && !newArticle.isHidden) {
        sameOwnerItems.forEach((so) => {
          this._internalEventEmitter.emit(
            new SeriesChangedItemsEvent({
              content: {
                id: newArticle.id,
                content: newArticle.content,
                type: newArticle.type,
                createdBy: newArticle.createdBy,
                createdAt: newArticle.createdAt,
                updatedAt: newArticle.createdAt,
              } as any,
              series: so,
              actor: actor,
            })
          );
        });
      }
    }

    for (const seriesId of newSeriesIds) {
      this._internalEventEmitter.emit(
        new SeriesAddedItemsEvent({
          itemIds: [newArticle.id],
          seriesId: seriesId,
          skipNotify: skipNotifyForNewItems.includes(seriesId) || newArticle.isHidden,
          actor: actor,
          context: 'publish',
        })
      );
    }

    const seriesIdsShouldRemove = oldSeriesIds.filter((id) => !seriesIds.includes(id));

    for (const seriesId of seriesIdsShouldRemove) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          seriesId,
          items: [
            {
              id: newArticle.id,
              title: newArticle.title,
              content: newArticle.content,
              type: newArticle.type,
              createdBy: newArticle.createdBy,
              groupIds: newArticle.audience.groups.map((group) => group.id),
              createdAt: newArticle.createdAt,
              updatedAt: newArticle.updatedAt,
            },
          ],
          actor,
          skipNotify: skipNotifyForRemoveItems.includes(seriesId) || newArticle.isHidden,
          contentIsDeleted: false,
        })
      );
    }

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
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
