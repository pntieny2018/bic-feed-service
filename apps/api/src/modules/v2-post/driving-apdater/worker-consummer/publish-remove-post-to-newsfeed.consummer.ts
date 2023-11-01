import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import { PublishContentToNewsfeedCommand } from '../../application/command/worker/publish-post-to-newsfeed';
import { RemoveContentToNewsfeedCommand } from '../../application/command/worker/remove-post-to-newsfeed';

@Controller()
export class PublishOrRemovePostToNewsfeedConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED)
  public async publishOrRemovePostToNewsfeed(
    @Payload('value') payload: { userId: string; contentId: string; action: 'publish' | 'remove' }
  ): Promise<void> {
    const { userId, contentId, action } = payload;
    if (action === 'publish') {
      await this._commandBus.execute<PublishContentToNewsfeedCommand>(
        new PublishContentToNewsfeedCommand({ contentId, userId })
      );
    }

    if (action === 'remove') {
      await this._commandBus.execute<RemoveContentToNewsfeedCommand>(
        new RemoveContentToNewsfeedCommand({ contentId, userId })
      );
    }
  }
}
