import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { DeletedPostEvent } from '../../events/post';
import { FeedPublisherService } from '../../modules/feed-publisher';
@Injectable()
export class DeletedPostListener {
  private _logger = new Logger(DeletedPostListener.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  @OnEvent(DeletedPostEvent.event)
  public async onPostDeleted(updatedPostEvent: DeletedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${updatedPostEvent}`);
    const { id, isDraft } = updatedPostEvent.payload;
    if (isDraft) return false;

    // send message to kafka

    const index = ElasticsearchHelper.INDEX.POST;
    try {
      await this._elasticsearchService.delete({
        index,
        id: `${id}`,
      });
      await this._feedPublisherService.detachPostForAllNewsFeed(id);

      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      return false;
    }
  }
}
