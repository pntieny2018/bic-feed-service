import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { NIL as NIL_UUID } from 'uuid';
import { On } from '../../common/decorators';
import { MediaStatus, MediaType } from '../../database/models/media.model';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
import { ArticleVideoFailedEvent } from '../../events/article/article-video-failed.event';
import { ArticleVideoSuccessEvent } from '../../events/article/article-video-success.event';
import { ArticleService } from '../../modules/article/article.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { FeedService } from '../../modules/feed/feed.service';
import { MediaService } from '../../modules/media';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { TagService } from '../../modules/tag/tag.service';

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
    private readonly _postSearchService: SearchService
  ) {}

  @On(ArticleHasBeenDeletedEvent)
  public async onArticleDeleted(event: ArticleHasBeenDeletedEvent): Promise<void> {
    const { article } = event.payload;
    if (article.isDraft) return;

    this._postServiceHistory.deleteEditedHistory(article.id).catch((e) => {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    });

    this._postSearchService.deletePostsToSearch([article]);
    if (!article.isDraft) {
      this._tagService
        .decreaseTotalUsed(article.postTags.map((e) => e.tagId))
        .catch((ex) => this._logger.debug(ex));
    }
    //TODO:: send noti
  }

  @On(ArticleHasBeenPublishedEvent)
  public async onArticlePublished(event: ArticleHasBeenPublishedEvent): Promise<void> {
    const { article, actor } = event.payload;
    const {
      isDraft,
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
    } = article;
    const mediaIds = media.videos
      .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
      .map((i) => i.id);
    this._mediaService
      .processVideo(mediaIds)
      .catch((e) => this._logger.debug(JSON.stringify(e?.stack)));

    if (isDraft) return;

    this._postServiceHistory
      .saveEditedHistory(article.id, { oldData: null, newData: article })
      .catch((e) => {
        this._logger.error(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });

    this._postSearchService.addPostsToSearch([
      {
        id,
        type,
        content,
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
    ]);

    if (article.tags.length) {
      this._tagService
        .increaseTotalUsed(article.tags.map((e) => e.id))
        .catch((ex) => this._logger.debug(ex));
    }

    //TODO:: send noti
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
  }

  @On(ArticleHasBeenUpdatedEvent)
  public async onArticleUpdated(event: ArticleHasBeenUpdatedEvent): Promise<void> {
    const { oldArticle, newArticle, actor } = event.payload;
    const {
      isDraft,
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
    } = newArticle;

    if (oldArticle.isDraft === false) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
        .map((i) => i.id);
      this._mediaService
        .processVideo(mediaIds)
        .catch((ex) => this._logger.debug(JSON.stringify(ex?.stack)));
    }

    if (oldArticle.isDraft === false && isDraft === true) {
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

    if (isDraft) return;

    this._postServiceHistory
      .saveEditedHistory(id, { oldData: oldArticle, newData: oldArticle })
      .catch((e) => {
        this._logger.debug(JSON.stringify(e?.stack));
        this._sentryService.captureException(e);
      });
    //TODO:: send noti

    this._postSearchService.updatePostsToSearch([
      {
        id,
        type,
        content,
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

    if (tags.length) {
      this._tagService
        .increaseTotalUsed(tags.map((e) => e.id))
        .catch((ex) => this._logger.debug(ex));
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

  @On(ArticleVideoSuccessEvent)
  public async onArticleVideoSuccess(event: ArticleVideoSuccessEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const dataUpdate = {
      url: hlsUrl,
      status: MediaStatus.COMPLETED,
    };
    if (properties?.name) dataUpdate['name'] = properties.name;
    if (properties?.mimeType) dataUpdate['mimeType'] = properties.mimeType;
    if (properties?.size) dataUpdate['size'] = properties.size;
    if (thumbnails) dataUpdate['thumbnails'] = thumbnails;
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.COMPLETED });
    const articles = await this._articleService.getsByMedia(videoId);
    articles.forEach((article) => {
      this._articleService.updateStatus(article.id);
      //TODO:: send noti

      const {
        actor,
        id,
        content,
        updatedAt,
        audience,
        createdAt,
        type,
        summary,
        title,
        coverMedia,
        createdBy,
        categories,
        tags,
      } = article;

      this._postSearchService.addPostsToSearch([
        {
          id,
          type,
          content,
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
      ]);

      try {
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
    });
  }

  @On(ArticleVideoFailedEvent)
  public async onArticleVideoFailed(event: ArticleVideoFailedEvent): Promise<void> {
    const { videoId, hlsUrl, properties, thumbnails } = event.payload;
    const dataUpdate = {
      url: hlsUrl,
      status: MediaStatus.COMPLETED,
    };
    if (properties?.name) dataUpdate['name'] = properties.name;
    if (properties?.mimeType) dataUpdate['mimeType'] = properties.mimeType;
    if (properties?.size) dataUpdate['size'] = properties.size;
    if (thumbnails) dataUpdate['thumbnails'] = thumbnails;
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.FAILED });
    const articles = await this._articleService.getsByMedia(videoId);
    articles.forEach((article) => {
      this._articleService.updateStatus(article.id);
      //TODO:: send noti
    });
  }
}
