import { IKafkaConsumerMessage } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PublishContentToNewsfeedCommand } from '../../v2-post/application/command/worker/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedCommand } from '../../v2-post/application/command/worker/remove-post-from-newsfeed';
import { KAFKA_TOPIC } from '@libs/infra/kafka/kafka.constant';

@Controller()
export class PublishOrRemovePostToNewsfeedConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED)
  public async publishOrRemovePostToNewsfeed(
    message: IKafkaConsumerMessage<{
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
