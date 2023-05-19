import { Controller, Get } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { PostPublishedMessagePayload } from '../../application/dto/message/post-published.message-payload';
import { PostDto } from '../../application/dto';
import { ProcessPostPublishedCommand } from '../../application/command/process-post-published/process-post-published.command';

@Controller()
export class PostPublishedConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_PUBLISHED)
  public async postPublished(@Payload('value') payload: PostPublishedMessagePayload): Promise<any> {
    await this._commandBus.execute<ProcessPostPublishedCommand, PostDto>(
      new ProcessPostPublishedCommand(payload)
    );
  }
}
