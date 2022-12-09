import {
  SeriesHasBeenDeletedEvent,
  SeriesHasBeenPublishedEvent,
  SeriesHasBeenUpdatedEvent,
} from '../../events/series';
import { SentryService } from '@app/sentry';
import { On } from '../../common/decorators';
import { Injectable, Logger, Post } from '@nestjs/common';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { NIL as NIL_UUID } from 'uuid';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { PostType } from '../../database/models/post.model';
import { SearchService } from '../../modules/search/search.service';
import { MediaType } from '../../database/models/media.model';

@Injectable()
export class SeriesListener {
  private _logger = new Logger(SeriesListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _postServiceHistory: PostHistoryService,
    private readonly _postSearchService: SearchService
  ) {}

  @On(SeriesHasBeenDeletedEvent)
  public async onSeriesDeleted(event: SeriesHasBeenDeletedEvent): Promise<void> {
    const { series } = event.payload;
    if (series.isDraft) return;

    this._postServiceHistory.deleteEditedHistory(series.id).catch((e) => {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    });

    this._postSearchService.deletePostsToSearch([series]);
    //TODO:: send noti
  }

  @On(SeriesHasBeenPublishedEvent)
  public async onSeriesPublished(event: SeriesHasBeenPublishedEvent): Promise<void> {
    const { series, actor } = event.payload;
    const { id, createdBy, audience, createdAt, updatedAt, title, summary, coverMedia } = series;

    this._postSearchService.addPostsToSearch([
      {
        id,
        createdAt,
        updatedAt,
        createdBy,
        title,
        summary,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        type: PostType.SERIES,
        articles: series.articles.map((article) => ({ id: article.id, zindex: article.zindex })),
        coverMedia: {
          id: coverMedia.id,
          createdBy: coverMedia.createdBy,
          url: coverMedia.url,
          type: coverMedia.type as MediaType,
          createdAt: coverMedia.createdAt,
          name: coverMedia.name,
          originName: coverMedia.originName,
          width: coverMedia.width,
          height: coverMedia.height,
          extension: coverMedia.extension,
        },
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

  @On(SeriesHasBeenUpdatedEvent)
  public async onSeriesUpdated(event: SeriesHasBeenUpdatedEvent): Promise<void> {
    const { newSeries, oldSeries, actor } = event.payload;
    const {
      id,
      createdBy,
      updatedAt,
      audience,
      createdAt,
      lang,
      summary,
      title,
      coverMedia,
      articles,
    } = newSeries;

    //TODO:: send noti

    this._postSearchService.updatePostsToSearch([
      {
        id,
        groupIds: audience.groups.map((group) => group.id),
        communityIds: audience.groups.map((group) => group.rootGroupId),
        createdAt,
        updatedAt,
        createdBy,
        lang,
        summary,
        title,
        type: PostType.SERIES,
        articles: articles.map((article) => ({ id: article.id, zindex: article.zindex })),
        coverMedia: {
          id: coverMedia.id,
          url: coverMedia.url,
          type: coverMedia.type as MediaType,
          createdBy: coverMedia.createdBy,
          createdAt: coverMedia.createdAt,
          name: coverMedia.name,
          originName: coverMedia.originName,
          width: coverMedia.width,
          height: coverMedia.height,
          extension: coverMedia.extension,
        },
      },
    ]);

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        oldSeries.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
    }
  }
}
