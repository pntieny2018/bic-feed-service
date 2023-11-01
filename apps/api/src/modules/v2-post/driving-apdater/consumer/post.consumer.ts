import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { PostVideoSuccessCommand } from '../../application/command/post';
import { PostVideoProcessedMessagePayload } from '../../application/dto/message';

@Controller()
export class PostConsumer {
  private readonly _logger = new Logger(PostConsumer.name);

  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern('123')
  // @EventPattern(KAFKA_TOPIC.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async eventVideoProcessed(
    @Payload('value') payload: PostVideoProcessedMessagePayload
  ): Promise<void> {
    const { status } = payload;

    this._logger.debug(`[eventVideoProcessed]: ${JSON.stringify(payload)}`);

    switch (status) {
      case MEDIA_PROCESS_STATUS.COMPLETED:
        await this._commandBus.execute(new PostVideoSuccessCommand(payload));
        break;
      case MEDIA_PROCESS_STATUS.FAILED:
        break;
      default:
        break;
    }
  }
}
