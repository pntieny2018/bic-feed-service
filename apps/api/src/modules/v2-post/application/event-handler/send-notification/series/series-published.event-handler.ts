import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SeriesPublishedEvent } from '../../../../domain/event';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(SeriesPublishedEvent)
export class NotiSeriesPublishedEventHandler implements IEventHandler<SeriesPublishedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async handle(event: SeriesPublishedEvent): Promise<void> {
    const { seriesEntity, authUser } = event.payload;

    if (seriesEntity.isHidden()) {
      return;
    }

    const groupAdminIds = await this._groupAdapter.getGroupAdminIds(seriesEntity.getGroupIds());
    const notiGroupAdminIds = groupAdminIds.filter((id) => id !== authUser.id);

    if (notiGroupAdminIds.length) {
      const seriesDto = await this._contentBinding.seriesBinding(seriesEntity, {
        actor: authUser,
        authUser,
      });

      await this._notiAdapter.sendSeriesPublishedNotification({
        actor: authUser,
        series: seriesDto,
        targetUserIds: notiGroupAdminIds,
      });
    }
  }
}
