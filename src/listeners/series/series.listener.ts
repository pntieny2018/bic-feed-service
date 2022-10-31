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
import { PostSearchService } from '../../modules/post/post-search.service';
import { PostType } from '../../database/models/post.model';

@Injectable()
export class SeriesListener {
  private _logger = new Logger(SeriesListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _postServiceHistory: PostHistoryService,
    private readonly _postSearchService: PostSearchService
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
    const { id, commentsCount, totalUsersSeen, audience, createdAt, title, summary } = series;

    this._postSearchService.addPostsToSearch([
      {
        id,
        commentsCount,
        totalUsersSeen,
        createdAt,
        actor,
        title,
        summary,
        audience,
        type: PostType.SERIES,
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
    const { oldSeries, actor } = event.payload;
    const { id, commentsCount, totalUsersSeen, audience, createdAt, lang, summary, title } =
      oldSeries;

    //TODO:: send noti

    this._postSearchService.updatePostsToSearch([
      {
        id,
        commentsCount,
        totalUsersSeen,
        audience,
        createdAt,
        actor,
        lang,
        summary,
        title,
        type: PostType.SERIES,
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
