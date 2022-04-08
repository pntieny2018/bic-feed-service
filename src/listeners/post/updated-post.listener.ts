import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ArrayHelper, ElasticsearchHelper } from '../../common/helpers';
import { UpdatedPostEvent } from '../../events/post';
import { FeedPublisherService } from '../../modules/feed-publisher';
@Injectable()
export class UpdatedPostListener {
  private _logger = new Logger(UpdatedPostListener.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  @OnEvent(UpdatedPostEvent.event)
  public async onPostUpdated(updatedPostEvent: UpdatedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${updatedPostEvent}`);
    const { oldPost } = updatedPostEvent.payload;
    const { id, content, media, isDraft, setting, audience, createdBy, commentsCount, mentions } =
      updatedPostEvent.payload.updatedPost;

    if (isDraft) return false;

    // send message to kafka

    const index = ElasticsearchHelper.INDEX.POST;
    // sync post to elastic search
    try {
      const dataUpdate = {
        commentsCount,
        content,
        media,
        mentions,
        audience,
        setting,
        createdBy,
      };
      await this._elasticsearchService.update({
        index,
        id: `${id}`,
        body: { doc: dataUpdate },
      });
      // Fanout to attach or detach post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        createdBy,
        id,
        audience.groups.map((g) => g.id),
        oldPost.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }
}
