import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SeriesCreatedEvent } from '../../../../domain/event';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(SeriesCreatedEvent)
export class NotiSeriesPublishedEventHandler implements IEventHandler<SeriesCreatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async handle(event: SeriesCreatedEvent): Promise<void> {
    const { seriesEntity, actor } = event;

    if (seriesEntity.isHidden()) {
      return;
    }

    const groupAdminIds = await this._groupAdapter.getGroupAdminIds(seriesEntity.getGroupIds());
    const notiGroupAdminIds = groupAdminIds.filter((id) => id !== actor.id);

    if (notiGroupAdminIds.length) {
      const seriesDto = await this._contentBinding.seriesBinding(seriesEntity, {
        actor,
        authUser: actor,
      });

      await this._notiAdapter.sendSeriesPublishedNotification({
        actor,
        series: seriesDto,
        targetUserIds: notiGroupAdminIds,
      });
    }
  }
}
