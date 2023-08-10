import { Inject } from '@nestjs/common';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPIC } from '../../../../../common/constants';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SeriesChangedMessagePayload } from '../../dto/message';
import { SeriesDeletedEvent } from '../../../domain/event/series.event';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';

@EventsHandler(SeriesDeletedEvent)
export class SeriesDeletedEventHandler implements IEventHandler<SeriesDeletedEvent> {
  public constructor(
    private readonly _kafkaService: KafkaService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService
  ) {}

  public async handle(event: SeriesDeletedEvent): Promise<void> {
    const { seriesEntity } = event;

    if (!seriesEntity.isPublished()) return;

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

    this._kafkaService.emit(KAFKA_TOPIC.CONTENT.SERIES_CHANGED, {
      key: seriesEntity.getId(),
      value: new SeriesChangedMessagePayload(payload),
    });
  }
}
