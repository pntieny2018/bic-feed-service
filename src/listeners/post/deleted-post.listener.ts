import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { DeletedPostEvent, UpdatedPostEvent } from '../../events/post';
@Injectable()
export class UpdatedPostListener {
  private _logger = new Logger(UpdatedPostListener.name);
  public constructor(private readonly _elasticsearchService: ElasticsearchService) {}

  @OnEvent(DeletedPostEvent.event)
  public async onPostCreated(updatedPostEvent: DeletedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${updatedPostEvent}`);
    const { id, isDraft } = updatedPostEvent.payload;
    if (isDraft) return false;

    // send message to kafka

    const index = ElasticsearchHelper.INDEX.POST;
    // sync post to elastic search
    try {
      await this._elasticsearchService.delete({
        index,
        id: `${id}`,
      });
      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      return false;
    }
  }
}
