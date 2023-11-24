import { KAFKA_TOPIC } from '@libs/infra/kafka/kafka.constant';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostDeletedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(PostDeletedEvent)
export class FilePostDeletedEventHandler implements IEventHandler<PostDeletedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostDeletedEvent): Promise<void> {
    const { postEntity, authUser } = event.payload;

    const fileIds = postEntity.get('media').files.map((file) => file.get('id'));

    await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_FILES, {
      key: null,
      value: { fileIds, userId: authUser.id },
    });
  }
}
