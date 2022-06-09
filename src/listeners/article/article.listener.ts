import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
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
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { PostPrivacy } from '../../database/models/post.model';
import { ArticleVideoSuccessEvent } from '../../events/article/article-video-success.event';
import { ArticleVideoFailedEvent } from '../../events/article/article-video-failed.event';
import { ArticleService } from '../../modules/article/article.service';

@Injectable()
export class ArticleListener {
  private _logger = new Logger(ArticleListener.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _postActivityService: PostActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _postService: PostService,
    private readonly _sentryService: SentryService,
    private readonly _mediaService: MediaService,
    private readonly _feedService: FeedService,
    private readonly _seriesService: SeriesService,
    private readonly _articleService: ArticleService
  ) {}

  @On(ArticleHasBeenDeletedEvent)
  public async onArticleDeleted(event: ArticleHasBeenDeletedEvent): Promise<void> {
    this._logger.debug(`Event: ${JSON.stringify(event)}`);
    const { actor, article } = event.payload;
    if (article.isDraft) return;

    this._seriesService.updateTotalArticle(article.series.map((c) => c.id));

    this._postService.deletePostEditedHistory(article.id).catch((e) => {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    });

    const index = ElasticsearchHelper.INDEX.ARTICLE;
    this._elasticsearchService
      .delete({ index, id: `${article.id}` })
      .catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      })
      .catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
        return;
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
    await this._postService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));

    if (isDraft) return;

    this._postService
      .savePostEditedHistory(article.id, { oldData: null, newData: article })
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
      content,
      media,
      mentions,
      audience,
      setting,
      createdAt,
      actor,
    };

    this._seriesService
      .updateTotalArticle((article as ArticleResponseDto).series.map((c) => c.id))
      .catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });

    const index = ElasticsearchHelper.INDEX.ARTICLE;
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
        [0]
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
    const { isDraft, id, content, commentsCount, media, mentions, setting, audience, isArticle } =
      oldArticle;

    if (oldArticle.isDraft === false) {
      const mediaIds = media.videos
        .filter((m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.FAILED)
        .map((i) => i.id);
      this._postService.processVideo(mediaIds).catch((ex) => this._logger.debug(ex));
    }

    if (oldArticle.isDraft === false && isDraft === true) {
      this._feedService.deleteNewsFeedByPost(id, null).catch((e) => {
        this._logger.error(e, e?.stack);
        this._sentryService.captureException(e);
      });
    }

    this._seriesService.updateTotalArticle(
      (oldArticle as ArticleResponseDto).series.map((c) => c.id)
    );

    if (isDraft) return;

    this._postService
      .savePostEditedHistory(id, { oldData: oldArticle, newData: oldArticle })
      .catch((e) => {
        this._logger.debug(e, e?.stack);
        this._sentryService.captureException(e);
      });
    //TODO:: send noti

    const index = ElasticsearchHelper.INDEX.ARTICLE;
    const dataUpdate = {
      commentsCount,
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
      .update({ index, id: `${id}`, body: { doc: dataUpdate } })
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
    const articles = await this._articleService.getArticlesByMedia(videoId);
    articles.forEach((article) => {
      this._postService.updatePostStatus(article.id);
      //TODO:: send noti

      const {
        actor,
        id,
        content,
        commentsCount,
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
      const index = ElasticsearchHelper.INDEX.ARTICLE;
      this._elasticsearchService.index({ index, id: `${id}`, body: dataIndex }).catch((e) => {
        this._logger.debug(e);
        this._sentryService.captureException(e);
      });
      this._seriesService.updateTotalArticle(
        (article as ArticleResponseDto).series.map((c) => c.id)
      );
      try {
        this._feedPublisherService.fanoutOnWrite(
          actor.id,
          id,
          audience.groups.map((g) => g.id),
          [0]
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
    const articles = await this._articleService.getArticlesByMedia(videoId);
    articles.forEach((article) => {
      this._postService.updatePostStatus(article.id);
      //TODO:: send noti
    });
  }
}
