import { NotificationService } from '../../notification';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { PublishedPostEvent } from '../../events/post';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { PostHasBeenCreated } from '../../common/constants';

@Injectable()
export class PublishedPostListener {
  private _logger = new Logger(PublishedPostListener.name);
  public constructor(
    private readonly _notificationService: NotificationService,
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  @OnEvent(PublishedPostEvent.event)
  public async onPostPublished(publishedPostEvent: PublishedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${publishedPostEvent}`);
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
      actor,
    } = publishedPostEvent.payload;
    if (isDraft) return;
    this._notificationService.publishPostNotification({
      key: `${publishedPostEvent.payload.id}`,
      value: {
        actor: publishedPostEvent.actor,
        event: PostHasBeenCreated,
        data: publishedPostEvent.payload,
      },
    });

    const index = ElasticsearchHelper.INDEX.POST;
    try {
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
      };
      await this._elasticsearchService.index({
        index,
        id: `${id}`,
        body: dataIndex,
      });

      // Fanout to write post to all news feed of user follow group audience
      await this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        [0]
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }
}
