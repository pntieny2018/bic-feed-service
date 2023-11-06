import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { Controller } from '@nestjs/common';
import { PublishContentToNewsfeedCommand } from '../../application/command/worker/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedCommand } from '../../application/command/worker/remove-post-from-newsfeed';
import { EventPatternAndLog } from '@libs/infra/log';
import { IKafkaConsumeMessage } from '@libs/infra/kafka';

@Controller()
export class PublishOrRemovePostToNewsfeedConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPatternAndLog(KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED)
  public async publishOrRemovePostToNewsfeed(
    message: IKafkaConsumeMessage<{
      userId: string;
      contentId: string;
      action: 'publish' | 'remove';
    }>
  ): Promise<void> {
    const { userId, contentId, action } = message.value;
    if (action === 'publish') {
      await this._commandBus.execute<PublishContentToNewsfeedCommand>(
        new PublishContentToNewsfeedCommand({ contentId, userId })
      );
    }

    if (action === 'remove') {
      await this._commandBus.execute<RemoveContentFromNewsfeedCommand>(
        new RemoveContentFromNewsfeedCommand({ contentId, userId })
      );
    }
  }
}
