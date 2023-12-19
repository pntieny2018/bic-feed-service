import { IKafkaConsumerMessage, KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Payload } from '@nestjs/microservices';

import { PublishContentToNewsfeedCommand } from '../../application/command/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedCommand } from '../../application/command/remove-post-from-newsfeed';
import { NewsfeedAction } from '../../data-type';

@Controller()
export class PublishOrRemovePostToNewsfeedConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED)
  public async publishOrRemovePostToNewsfeed(
    @Payload()
    message: IKafkaConsumerMessage<{
      userId: string;
      contentId: string;
      action: NewsfeedAction;
    }>
  ): Promise<void> {
    const { userId, contentId, action } = message.value;
    if (action === NewsfeedAction.PUBLISH) {
      await this._commandBus.execute<PublishContentToNewsfeedCommand>(
        new PublishContentToNewsfeedCommand({ contentId, userId })
      );
    }

    if (action === NewsfeedAction.REMOVE) {
      await this._commandBus.execute<RemoveContentFromNewsfeedCommand>(
        new RemoveContentFromNewsfeedCommand({ contentId, userId })
      );
    }
  }
}
