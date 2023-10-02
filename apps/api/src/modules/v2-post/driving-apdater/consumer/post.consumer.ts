import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import {
  ProcessPostPublishedCommand,
  ProcessPostUpdatedCommand,
  ProcessPostDeletedCommand,
} from '../../application/command/post';
import { PostChangedMessagePayload } from '../../application/dto/message';

@Controller()
export class PostConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<any> {
    switch (payload.state) {
      case 'publish':
        await this._commandBus.execute<ProcessPostPublishedCommand, void>(
          new ProcessPostPublishedCommand(payload)
        );
        break;
      case 'update':
        await this._commandBus.execute<ProcessPostUpdatedCommand, void>(
          new ProcessPostUpdatedCommand(payload)
        );
        break;
      case 'delete':
        await this._commandBus.execute<ProcessPostDeletedCommand, void>(
          new ProcessPostDeletedCommand(payload)
        );
        break;
      default:
        break;
    }
  }
}
