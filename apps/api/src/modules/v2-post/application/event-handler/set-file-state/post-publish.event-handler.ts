import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostPublishedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(PostPublishedEvent)
export class FilePostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, authUser } = event.payload;

    const fileIds = postEntity.get('media').files.map((file) => file.get('id'));

    if (fileIds.length) {
      await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_FILE_HAS_BEEN_USED, {
        key: null,
        value: { fileIds, userId: authUser.id },
      });
    }
  }
}
