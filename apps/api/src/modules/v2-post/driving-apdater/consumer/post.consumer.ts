import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessPostPublishedCommand } from '../../application/command/process-post-published/process-post-published.command';
import { ProcessPostUpdatedCommand } from '../../application/command/process-post-updated/process-post-updated.command';
import { PostChangedMessagePayload } from '../../application/dto/message';

@Controller()
export class PostConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<any> {
    if (payload.state === 'publish') {
      await this._commandBus.execute<ProcessPostPublishedCommand, void>(
        new ProcessPostPublishedCommand(payload)
      );
    }
    if (payload.state === 'update') {
      await this._commandBus.execute<ProcessPostUpdatedCommand, void>(
        new ProcessPostUpdatedCommand(payload)
      );
    }
  }
}
