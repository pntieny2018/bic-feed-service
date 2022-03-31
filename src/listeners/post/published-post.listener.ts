import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { PublishedPostEvent } from '../../events/post';
import { FeedPublisherService } from '../../modules/feed-publisher';
@Injectable()
export class PublishedPostListener {
  private _logger = new Logger(PublishedPostListener.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  @OnEvent(PublishedPostEvent.event)
  public async onPostPublished(publishedPostEvent: PublishedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${publishedPostEvent}`);
    const { isDraft, id, data, setting, audience } = publishedPostEvent.payload;
    if (isDraft) return;

    // send message to kafka
    const index = ElasticsearchHelper.INDEX.POST;
    try {
      const dataIndex = {
        id,
        audience,
        data,
        setting,
      };
      await this._elasticsearchService.index({
        index,
        id: `${id}`,
        body: dataIndex,
      });

      // Fanout to write post to all news feed of user follow group audience
      await this._feedPublisherService.fanoutOnWrite(id, {
        attached: audience.groups.map((g) => g.id),
      });
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }
}
