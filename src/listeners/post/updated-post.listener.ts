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
    const { id, data, isDraft, setting, audience } = updatedPostEvent.payload.updatedPost;
    const { oldPost } = updatedPostEvent.payload;
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
      // Fanout to attach or detach post to all news feed of user follow group audience
      this._fanout(
        id,
        audience.groups.map((g) => g.id),
        oldPost.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }

  private _fanout(postId: number, currentGroupIds: number[], oldGroupIds: number[]): void {
    const differenceGroupIds = ArrayHelper.differenceArrNumber(currentGroupIds, oldGroupIds);
    const attachedGroupIds = differenceGroupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    const detachedGroupIds = differenceGroupIds.filter((groupId) => oldGroupIds.includes(groupId));

    this._feedPublisherService
      .fanoutOnWrite(postId, {
        attached: attachedGroupIds,
      })
      .catch((ex) => this._logger.error(ex, ex.stack));

    this._feedPublisherService
      .fanoutOnWrite(postId, {
        detached: detachedGroupIds,
        current: currentGroupIds,
      })
      .catch((ex) => this._logger.error(ex, ex.stack));
  }
}
