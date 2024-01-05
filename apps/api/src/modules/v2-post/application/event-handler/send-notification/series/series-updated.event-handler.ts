import { ArrayHelper } from '@libs/common/helpers';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SeriesUpdatedEvent } from '../../../../domain/event';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(SeriesUpdatedEvent)
export class NotiSeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { entity: seriesEntity, authUser } = event.payload;

    if (seriesEntity.isHidden()) {
      return;
    }

    const oldSeries = seriesEntity.getSnapshot();
    const { attachGroupIds } = seriesEntity.getState();

    if (!attachGroupIds.length) {
      return;
    }

    const newGroupAdminIds = await this._groupAdapter.getGroupAdminIds(attachGroupIds);
    const oldGroupAdminIds = await this._groupAdapter.getGroupAdminIds(oldSeries.groupIds);

    const filterGroupAdminIds = ArrayHelper.arrDifferenceElements<string>(
      newGroupAdminIds,
      oldGroupAdminIds
    );
    const notiGroupAdminIds = filterGroupAdminIds.filter((id) => id !== authUser.id);

    if (!notiGroupAdminIds.length) {
      return;
    }

    const seriesDto = await this._contentBinding.seriesBinding(seriesEntity, {
      actor: authUser,
      authUser,
    });

    const oldGroups = await this._groupAdapter.getGroupsByIds(oldSeries.groupIds);

    await this._notiAdapter.sendSeriesUpdatedNotification({
      actor: authUser,
      series: seriesDto,
      oldSeries: {
        ...oldSeries,
        audience: { groups: oldGroups },
        commentsCount: oldSeries.aggregation?.commentsCount,
        totalUsersSeen: oldSeries.aggregation?.totalUsersSeen,
        quiz: null,
        items: null,
        actor: authUser,
      },
      targetUserIds: notiGroupAdminIds,
    });
  }
}
