import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { SeriesDeletedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { SeriesChangedMessagePayload } from '../../dto/message';

@EventsHandler(SeriesDeletedEvent)
export class SeriesDeletedEventHandler implements IEventHandler<SeriesDeletedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService
  ) {}

  public async handle(event: SeriesDeletedEvent): Promise<void> {
    const { seriesEntity } = event;

    if (!seriesEntity.isPublished()) {
      return;
    }

    const actor = await this._userAppService.findOne(seriesEntity.get('createdBy'));

    const payload: SeriesChangedMessagePayload = {
      state: 'delete',
      before: {
        id: seriesEntity.get('id'),
        actor,
        type: seriesEntity.get('type'),
        groupIds: seriesEntity.get('groupIds'),
        itemIds: seriesEntity.get('itemIds'),
        title: seriesEntity.get('title'),
        summary: seriesEntity.get('summary'),
        lang: seriesEntity.get('lang'),
        isHidden: seriesEntity.get('isHidden'),
        status: seriesEntity.get('status'),
        createdAt: seriesEntity.get('createdAt'),
        updatedAt: seriesEntity.get('updatedAt'),
      },
    };

    this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.SERIES_CHANGED, {
      key: seriesEntity.getId(),
      value: new SeriesChangedMessagePayload(payload),
    });
  }
}
