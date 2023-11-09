import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { PostUpdatedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(PostUpdatedEvent)
export class FilePostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      const { attachFileIds, detachFileIds } = postEntity.getState();

      if (attachFileIds.length) {
        await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_FILE_HAS_BEEN_USED, {
          key: null,
          value: { videoIds: attachFileIds, userId: actor.id },
        });
      }

      if (detachFileIds.length) {
        await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_FILES, {
          key: null,
          value: { videoIds: detachFileIds, userId: actor.id },
        });
      }
    }
  }
}
