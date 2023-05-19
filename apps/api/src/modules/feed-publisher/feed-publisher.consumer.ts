import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PostPublishedMessagePayload } from '../v2-post/application/dto/message/post-published.message-payload';
import { KAFKA_TOPIC } from '../../common/constants';
import { FeedPublisherService } from './feed-publisher.service';

@Controller()
export class FeedConsumer {
  public constructor(private readonly _feedPublisherService: FeedPublisherService) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_PUBLISHED)
  public async postPublished(
    @Payload('value') payload: PostPublishedMessagePayload
  ): Promise<void> {
    const { before, after } = payload;

    await this._feedPublisherService.fanoutOnWrite(after.id, after.groupIds, before.groupIds);
  }
}
