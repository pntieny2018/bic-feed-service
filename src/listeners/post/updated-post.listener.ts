import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ArrayHelper, ElasticsearchHelper } from '../../common/helpers';
import { UpdatedPostEvent } from '../../events/post';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { NotificationService } from '../../notification';
@Injectable()
export class UpdatedPostListener {
  private _logger = new Logger(UpdatedPostListener.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _notificationService: NotificationService
  ) {}

  @OnEvent(UpdatedPostEvent.event)
  public async onPostUpdated(updatedPostEvent: UpdatedPostEvent): Promise<boolean> {
    this._logger.debug(`Event: ${updatedPostEvent}`);
    const { oldPost } = updatedPostEvent.payload;
    const { id, content, media, isDraft, setting, audience, actor, commentsCount, mentions } =
      updatedPostEvent.payload.newPost;

    if (isDraft) return false;

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
        actor,
      };
      await this._elasticsearchService.update({
        index,
        id: `${id}`,
        body: { doc: dataUpdate },
      });

      this._notificationService.publishPostNotification({
        key: `${updatedPostEvent.payload.newPost.id}`,
        value: {
          actor: updatedPostEvent.actor,
          event: UpdatedPostEvent.event,
          data: updatedPostEvent.payload,
        },
      });

      // Fanout to attach or detach post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        actor.id,
        id,
        audience.groups.map((g) => g.id),
        oldPost.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }
}
