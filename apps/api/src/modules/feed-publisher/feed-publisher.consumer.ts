import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PostChangedMessagePayload } from '../v2-post/application/dto/message/post-published.message-payload';
import { KAFKA_TOPIC } from '../../common/constants';
import { FeedPublisherService } from './feed-publisher.service';

@Controller()
export class FeedConsumer {
  public constructor(private readonly _feedPublisherService: FeedPublisherService) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<void> {
    const { before, after } = payload;

    await this._feedPublisherService.fanoutOnWrite(after.id, after.groupIds, before.groupIds);
  }
}
