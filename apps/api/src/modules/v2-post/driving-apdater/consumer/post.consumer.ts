import { Controller, Get } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { PostChangedMessagePayload } from '../../application/dto/message/post-published.message-payload';
import { PostDto } from '../../application/dto';
import { ProcessPostPublishedCommand } from '../../application/command/process-post-published/process-post-published.command';
import { ProcessPostUpdatedHandler } from '../../application/command/process-post-updated/process-post-updated.handler';
import { ProcessPostUpdatedCommand } from '../../application/command/process-post-updated/process-post-updated.command';

@Controller()
export class PostConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<any> {
    if (payload.isPublished) {
      await this._commandBus.execute<ProcessPostPublishedCommand, void>(
        new ProcessPostPublishedCommand(payload)
      );
    } else {
      await this._commandBus.execute<ProcessPostUpdatedCommand, void>(
        new ProcessPostUpdatedCommand(payload)
      );
    }
  }
}
