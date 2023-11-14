import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { PostVideoSuccessEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(PostVideoSuccessEvent)
export class VideoPostVideoSuccessEventHandler implements IEventHandler<PostVideoSuccessEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostVideoSuccessEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    const videoIds = postEntity.get('media').videos.map((video) => video.get('id'));

    await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_VIDEO_HAS_BEEN_USED, {
      key: null,
      value: { videoIds, userId: actor.id },
    });
  }
}