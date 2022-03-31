import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { CreatedPostEvent } from '../../events/post';

@Injectable()
export class CreatedPostListener {
  private _logger = new Logger(CreatedPostListener.name);
  public constructor(private readonly _elasticsearchService: ElasticsearchService) {}

  @OnEvent(CreatedPostEvent.event)
  public async onPostCreated(createdPostEvent: CreatedPostEvent): Promise<boolean> {
    const { isDraft, id, content, media, setting, audience } = createdPostEvent.payload;
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
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }
}
