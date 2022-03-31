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
      createdBy,
    } = createdPostEvent.payload;
    if (isDraft) return;

    // send message to kafka

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
        createdBy,
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
