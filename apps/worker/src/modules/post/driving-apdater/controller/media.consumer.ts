import { PostVideoProcessedCommand } from '@api/modules/v2-post/application/command/post';
import { PostVideoProcessedMessagePayload } from '@api/modules/v2-post/application/dto/message';
import { IKafkaConsumerMessage, KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Payload } from '@nestjs/microservices';

/**
 * TODO: Move commands to worker folder
 */
@Controller()
export class MediaConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async postVideoProcessed(
    @Payload()
    message: IKafkaConsumerMessage<PostVideoProcessedMessagePayload>
  ): Promise<void> {
    const { value } = message;
    this._commandBus.execute(new PostVideoProcessedCommand(value));
  }
}
