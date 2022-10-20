import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
import { SentryService } from '@app/sentry';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { MediaStatus } from '../../database/models/media.model';
import { MediaService } from '../../modules/media';
import { FeedService } from '../../modules/feed/feed.service';
import { SeriesService } from '../../modules/series/series.service';
import { ArticleVideoSuccessEvent } from '../../events/article/article-video-success.event';
import { ArticleVideoFailedEvent } from '../../events/article/article-video-failed.event';
import { ArticleService } from '../../modules/article/article.service';
import { NIL as NIL_UUID } from 'uuid';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { PostSearchService } from '../../modules/post/post-search.service';

@Injectable()
export class ArticleListener {
  private _logger = new Logger(ArticleListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _feedService: FeedService,
    private readonly _seriesService: SeriesService,
    private readonly _articleService: ArticleService,
    private readonly _postServiceHistory: PostHistoryService,
    private readonly _postSearchService: PostSearchService
  ) {}

  @On(ArticleHasBeenDeletedEvent)
  public async onArticleDeleted(event: ArticleHasBeenDeletedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { article } = event.payload;
    if (article.isDraft) return;

    if (article.series?.length > 0) {
      this._seriesService.updateTotalArticle(article.series.map((c) => c.id));
    }

    this._postServiceHistory.deleteEditedHistory(article.id).catch((e) => {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    });

    this._postSearchService.deletePostsToSearch([article]);
    //TODO:: send noti
  }

  @On(ArticleHasBeenPublishedEvent)
  public async onArticlePublished(event: ArticleHasBeenPublishedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { article, actor } = event.payload;
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
      title,
      summary,
    } = article;
    const mediaIds = media.videos
      .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
      .map((i) => i.id);
    this._mediaService.processVideo(mediaIds).catch((e) => this._logger.debug(e));

    if (isDraft) return;

    this._postServiceHistory
      .saveEditedHistory(article.id, { oldData: null, newData: article })
      .catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });

    if (article.series?.length > 0) {
      this._seriesService.updateTotalArticle(article.series.map((c) => c.id)).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    }

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
        title,
        summary,
      },
    ]);

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
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
    }
  }

  @On(ArticleHasBeenUpdatedEvent)
  public async onArticleUpdated(event: ArticleHasBeenUpdatedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { oldArticle, newArticle, actor } = event.payload;
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
      createdAt,
      lang,
      summary,
      title,
    } = oldArticle;

    if (oldArticle.isDraft === false) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
        .map((i) => i.id);
      this._mediaService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));
    }

    if (oldArticle.isDraft === false && isDraft === true) {
      this._feedService.deleteNewsFeedByPost(id, null).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    }

    let seriesIds = [];
    if (oldArticle.series?.length > 0) {
      seriesIds = oldArticle.series.map((c) => c.id);
    }

    if (newArticle.series?.length > 0) {
      seriesIds.push(...newArticle.series.map((c) => c.id));
    }
    this._seriesService.updateTotalArticle(seriesIds);

    if (isDraft) return;

    this._postServiceHistory
      .saveEditedHistory(id, { oldData: oldArticle, newData: oldArticle })
      .catch((e) => {
        this._logger.debug(e, e?.stack);
        this._sentryService.captureException(e);
      });
    //TODO:: send noti

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
        summary,
        title,
      },
    ]);

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        oldArticle.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
    }
  }

  @On(ArticleVideoSuccessEvent)
  public async onArticleVideoSuccess(event: ArticleVideoSuccessEvent): Promise<void> {
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
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.COMPLETED });
    const articles = await this._articleService.getsByMedia(videoId);
    articles.forEach((article) => {
      this._articleService.updateStatus(article.id);
      //TODO:: send noti

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
        summary,
        title,
      } = article;

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
          summary,
          title,
        },
      ]);

      if (article.series?.length > 0) {
        this._seriesService.updateTotalArticle(article.series.map((c) => c.id));
      }

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

  @On(ArticleVideoFailedEvent)
  public async onArticleVideoFailed(event: ArticleVideoFailedEvent): Promise<void> {
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
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.FAILED });
    const articles = await this._articleService.getsByMedia(videoId);
    articles.forEach((article) => {
      this._articleService.updateStatus(article.id);
      //TODO:: send noti
    });
  }
}
