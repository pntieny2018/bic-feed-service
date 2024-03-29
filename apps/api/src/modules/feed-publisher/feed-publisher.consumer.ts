import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { FeedPublisherService } from './feed-publisher.service';
import {
  ArticleChangedMessagePayload,
  SeriesChangedMessagePayload,
  PostChangedMessagePayload,
} from '../v2-post/application/dto/message';

@Controller()
export class FeedConsumer {
  public constructor(private readonly _feedPublisherService: FeedPublisherService) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<void> {
    const { before, after, state } = payload;

    await this._feedPublisherService.fanoutOnWrite(
      after.id,
      after.groupIds,
      state === 'publish' ? [] : before.groupIds
    );
  }

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_CHANGED)
  public async seriesChanged(
    @Payload('value') payload: SeriesChangedMessagePayload
  ): Promise<void> {
    const { before, after, state } = payload;
    if (state === 'delete') return;

    await this._feedPublisherService.fanoutOnWrite(
      after.id,
      after.groupIds,
      state === 'publish' ? [] : before.groupIds
    );
  }

  @EventPattern(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED)
  public async articleChanged(
    @Payload('value') payload: ArticleChangedMessagePayload
  ): Promise<void> {
    const { before, after, state } = payload;
    if (state === 'delete') return;

    await this._feedPublisherService.fanoutOnWrite(
      after.id,
      after.groupIds,
      state === 'publish' ? [] : before.groupIds
    );
  }
}
