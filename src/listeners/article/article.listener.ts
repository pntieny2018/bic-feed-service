import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
import { SentryService } from '@app/sentry';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchHelper } from '../../common/helpers';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { MediaStatus } from '../../database/models/media.model';
import { MediaService } from '../../modules/media';
import { FeedService } from '../../modules/feed/feed.service';
import { SeriesService } from '../../modules/series/series.service';
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { ArticleVideoSuccessEvent } from '../../events/article/article-video-success.event';
import { ArticleVideoFailedEvent } from '../../events/article/article-video-failed.event';
import { ArticleService } from '../../modules/article/article.service';
import { NIL as NIL_UUID } from 'uuid';
import { PostHistoryService } from '../../modules/post/post-history.service';

@Injectable()
export class ArticleListener {
  private _logger = new Logger(ArticleListener.name);

  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _feedService: FeedService,
    private readonly _seriesService: SeriesService,
    private readonly _articleService: ArticleService,
    private readonly _postServiceHistory: PostHistoryService
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

    const index = ElasticsearchHelper.ALIAS.ARTICLE[article.lang]?.name || 'default';
    this._elasticsearchService.delete({ index, id: `${article.id}` }).catch((e) => {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    });
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

    const dataIndex = {
      id,
      isArticle,
      categories: article.categories ?? [],
      series: article.series ?? [],
      hashtags: article.hashtags ?? [],
      title: article.title ?? null,
      summary: article.summary ?? null,
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

    if (article.series?.length > 0) {
      this._seriesService.updateTotalArticle(article.series.map((c) => c.id)).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    }

    const index = ElasticsearchHelper.ALIAS.ARTICLE.default.name;
    this._elasticsearchService.index({ index, id: `${id}`, body: dataIndex }).catch((e) => {
      this._logger.debug(e);
      this._sentryService.captureException(e);
    });

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

    const index = ElasticsearchHelper.ALIAS.ARTICLE.default.name;
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
      categories: newArticle.categories ?? [],
      series: newArticle.series ?? [],
      hashtags: newArticle.hashtags ?? [],
      title: newArticle.title ?? null,
      summary: newArticle.summary ?? null,
    };
    this._elasticsearchService
      .index({ index, id: `${id}`, body: dataUpdate })
      .then()
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
      } = article;

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
        categories: article.categories ?? [],
        series: article.series ?? [],
        hashtags: article.hashtags ?? [],
        title: article.title ?? null,
        summary: article.summary ?? null,
      };
      const index = ElasticsearchHelper.ALIAS.ARTICLE.default.name;
      this._elasticsearchService.index({ index, id: `${id}`, body: dataIndex }).catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      });

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
