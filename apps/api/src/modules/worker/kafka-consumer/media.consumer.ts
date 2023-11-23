import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Payload } from '@nestjs/microservices';
import { PostVideoProcessedMessagePayload } from '../../v2-post/application/dto/message';
import { PostVideoProcessedCommand } from '../../v2-post/application/command/post';
import { KAFKA_TOPIC } from '@libs/infra/kafka/kafka.constant';

@Controller()
export class MediaConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async postVideoProcessed(
    @Payload('value') payload: PostVideoProcessedMessagePayload
  ): Promise<void> {
    await this._commandBus.execute(new PostVideoProcessedCommand(payload));
  }
}
