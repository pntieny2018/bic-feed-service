import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  ITagDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PostPublishedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { PostEntity } from '../../../domain/model/content';

@EventsHandlerAndLog(PostPublishedEvent)
export class PostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(TAG_DOMAIN_SERVICE_TOKEN)
    private readonly _tagDomain: ITagDomainService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomain: ISeriesDomainService,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      await this._tagDomain.increaseTotalUsedByContent(postEntity);
      this._processSeriesItemsChanged(postEntity, actor);
    }
  }

  private _processSeriesItemsChanged(postEntity: PostEntity, actor: UserDto): void {
    const seriesIds = postEntity.getSeriesIds();
    for (const seriesId of seriesIds) {
      this._seriesDomain.sendSeriesItemsAddedEvent({
        authUser: actor,
        seriesId,
        item: postEntity,
        context: 'publish',
      });
    }
  }
}
