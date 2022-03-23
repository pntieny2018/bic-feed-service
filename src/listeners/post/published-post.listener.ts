import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { PublishedPostEvent } from '../../events/post';
@Injectable()
export class PublishedPostListener {
  private _logger = new Logger(PublishedPostListener.name);
  public constructor(private readonly _elasticsearchService: ElasticsearchService) {}

  @OnEvent(PublishedPostEvent.event)
  public async onPostCreated(publishedPostEvent: PublishedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${publishedPostEvent}`);
    const { postId } = publishedPostEvent.payload;

    // send message to kafka

    //const index = ElasticsearchHelper.INDEX.POST;
    // sync post to elastic search

    return true;
  }
}
