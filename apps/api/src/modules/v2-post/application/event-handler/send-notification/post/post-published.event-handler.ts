import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { PostPublishedEvent } from '../../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../../domain/infra-adapter-interface';
import { PostEntity, SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(PostPublishedEvent)
export class NotiPostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, authUser } = event.payload;

    if (postEntity.isPublished()) {
      const postDto = await this._contentBinding.postBinding(postEntity, {
        actor: authUser,
        authUser,
      });

      const contentWithArchivedGroups =
        (await this._contentRepository.findContentByIdInArchivedGroup(postEntity.getId(), {
          shouldIncludeSeries: true,
        })) as PostEntity;

      const seriesIds = uniq([
        ...postEntity.getSeriesIds(),
        ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
      ]);
      const seriesEntities = (await this._contentRepository.findAll({
        where: {
          groupArchived: false,
          isHidden: false,
          ids: seriesIds,
        },
      })) as SeriesEntity[];
      const seriesActorIds = (seriesEntities || []).map((series) => series.get('createdBy'));

      await this._notiAdapter.sendPostPublishedNotification({
        actor: authUser,
        post: postDto,
        ignoreUserIds: seriesActorIds,
      });
    } else if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntity.getVideoIdProcessing()] },
      });
    }
  }
}
