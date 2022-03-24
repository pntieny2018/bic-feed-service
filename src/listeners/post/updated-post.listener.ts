import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { UpdatedPostEvent } from '../../events/post';
@Injectable()
export class UpdatedPostListener {
  private _logger = new Logger(UpdatedPostListener.name);
  public constructor(private readonly _elasticsearchService: ElasticsearchService) {}

  @OnEvent(UpdatedPostEvent.event)
  public async onPostUpdated(updatedPostEvent: UpdatedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${updatedPostEvent}`);
    const { id, data, isDraft, setting, audience } = updatedPostEvent.payload.updatedPost;
    if (isDraft) return false;

    // send message to kafka

    const index = ElasticsearchHelper.INDEX.POST;
    // sync post to elastic search
    try {
      const dataUpdate = {
        audience,
        data,
        setting,
      };
      await this._elasticsearchService.update({
        index,
        id: `${id}`,
        body: { doc: dataUpdate },
      });
      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      return false;
    }
  }
}
