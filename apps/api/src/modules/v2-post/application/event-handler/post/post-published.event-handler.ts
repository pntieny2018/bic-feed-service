import { MEDIA_TYPE } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import {
  IMediaDomainService,
  ISeriesDomainService,
  ITagDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
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
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      await this._processFile(postEntity);
      await this._tagDomain.increaseTotalUsedByContent(postEntity);
      this._processSeriesItemsChanged(postEntity, actor);
    }

    if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntity.getVideoIdProcessing()] },
      });
    }
  }

  private async _processFile(postEntity: PostEntity): Promise<void> {
    const fileIds = postEntity.get('media').files.map((file) => file.get('id'));

    if (fileIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.FILE,
        fileIds,
        postEntity.get('createdBy')
      );
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
