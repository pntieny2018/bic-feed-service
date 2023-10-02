import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { SeriesUpdatedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { ImageDto } from '../../dto';
import { SeriesChangedMessagePayload } from '../../dto/message';

@EventsHandler(SeriesUpdatedEvent)
export class SeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { seriesEntity } = event;
    const snapshot = seriesEntity.getSnapshot();

    if (!seriesEntity.isPublished()) {
      return;
    }

    const groups = await this._groupAppService.findAllByIds(seriesEntity.get('groupIds'));
    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    const actor = await this._userAppService.findOne(seriesEntity.get('createdBy'));

    const payload: SeriesChangedMessagePayload = {
      state: 'update',
      before: {
        id: snapshot.id,
        actor,
        setting: snapshot.setting,
        type: snapshot.type,
        groupIds: snapshot.groupIds,
        title: snapshot.title,
        summary: snapshot.summary,
        lang: snapshot.lang,
        isHidden: snapshot.isHidden,
        status: snapshot.status,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt,
      },
      after: {
        id: seriesEntity.get('id'),
        actor,
        setting: seriesEntity.get('setting'),
        type: seriesEntity.get('type'),
        groupIds: seriesEntity.get('groupIds'),
        communityIds,
        title: seriesEntity.get('title'),
        summary: seriesEntity.get('summary'),
        lang: seriesEntity.get('lang'),
        isHidden: seriesEntity.get('isHidden'),
        status: seriesEntity.get('status'),
        coverMedia: seriesEntity.get('cover')
          ? new ImageDto(seriesEntity.get('cover').toObject())
          : null,
        state: {
          attachGroupIds: seriesEntity.getState().attachGroupIds,
          detachGroupIds: seriesEntity.getState().detachGroupIds,
        },
        createdAt: seriesEntity.get('createdAt'),
        updatedAt: seriesEntity.get('updatedAt'),
        publishedAt: seriesEntity.get('publishedAt'),
      },
    };

    this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.SERIES_CHANGED, {
      key: seriesEntity.getId(),
      value: new SeriesChangedMessagePayload(payload),
    });
  }
}