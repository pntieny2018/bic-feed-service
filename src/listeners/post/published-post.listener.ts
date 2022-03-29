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
  public async onPostPublished(publishedPostEvent: PublishedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${publishedPostEvent}`);
    const { isDraft, id, content, media, setting, audience } = publishedPostEvent.payload;
    if (isDraft) return;

    // send message to kafka
    const index = ElasticsearchHelper.INDEX.POST;
    try {
      const dataIndex = {
        id,
        audience,
        content,
        media,
        setting,
      };
      await this._elasticsearchService.index({
        index,
        id: `${id}`,
        body: dataIndex,
      });

      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      return false;
    }
  }
}
