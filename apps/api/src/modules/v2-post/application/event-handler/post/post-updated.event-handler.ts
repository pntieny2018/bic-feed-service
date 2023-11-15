import { MEDIA_TYPE } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { KAFKA_TOPIC } from 'apps/api/src/common/constants';

import {
  IMediaDomainService,
  ISeriesDomainService,
  ITagDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PostUpdatedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { PostEntity } from '../../../domain/model/content';

@EventsHandlerAndLog(PostUpdatedEvent)
export class PostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomain: ISeriesDomainService,
    @Inject(TAG_DOMAIN_SERVICE_TOKEN)
    private readonly _tagDomain: ITagDomainService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomain: IMediaDomainService,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      await this._processMedia(postEntity, actor);
      await this._tagDomain.updateTagsUsedByContent(postEntity);
      await this._seriesDomain.sendContentUpdatedSeriesEvent({ content: postEntity, actor });
    }

    if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntity.getVideoIdProcessing()] },
      });
    }
  }

  private async _processMedia(postEntity: PostEntity, actor: UserDto): Promise<void> {
    const { attachVideoIds, attachFileIds, detachVideoIds, detachFileIds } = postEntity.getState();

    if (attachVideoIds.length) {
      await this._mediaDomain.setMediaUsed(
        MEDIA_TYPE.VIDEO,
        postEntity.getState().attachVideoIds,
        actor.id
      );
    }
    if (attachFileIds.length) {
      await this._mediaDomain.setMediaUsed(
        MEDIA_TYPE.FILE,
        postEntity.getState().attachFileIds,
        actor.id
      );
    }

    if (detachVideoIds.length) {
      await this._mediaDomain.setMediaDelete(
        MEDIA_TYPE.VIDEO,
        postEntity.getState().detachVideoIds,
        actor.id
      );
    }

    if (detachFileIds.length) {
      await this._mediaDomain.setMediaDelete(
        MEDIA_TYPE.FILE,
        postEntity.getState().detachFileIds,
        actor.id
      );
    }
  }
}
