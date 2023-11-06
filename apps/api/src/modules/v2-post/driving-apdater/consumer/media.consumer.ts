import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { PostVideoFailCommand, PostVideoSuccessCommand } from '../../application/command/post';
import { PostVideoProcessedMessagePayload } from '../../application/dto/message';

@Controller()
export class MediaConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async eventVideoProcessed(
    @Payload('value') payload: PostVideoProcessedMessagePayload
  ): Promise<void> {
    const { status } = payload;

    switch (status) {
      case MEDIA_PROCESS_STATUS.COMPLETED:
        await this._commandBus.execute(new PostVideoSuccessCommand(payload));
        break;
      case MEDIA_PROCESS_STATUS.FAILED:
        await this._commandBus.execute(new PostVideoFailCommand(payload));
        break;
      default:
        break;
    }
  }
}
