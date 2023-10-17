import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../common/constants';
import { SeriesChangedMessagePayload } from '../v2-post/application/dto/message';

import { FeedPublisherService } from './feed-publisher.service';

@Controller()
export class FeedConsumer {
  public constructor(private readonly _feedPublisherService: FeedPublisherService) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_CHANGED)
  public async seriesChanged(
    @Payload('value') payload: SeriesChangedMessagePayload
  ): Promise<void> {
    const { before, after, state } = payload;
    if (state === 'delete' || state === 'publish') {
      return;
    }

    await this._feedPublisherService.fanoutOnWrite(after.id, after.groupIds, before.groupIds);
  }
}
