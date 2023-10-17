import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject, Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SeriesChangeItems } from '../../../../../common/constants';
import { VerbActivity } from '../../../../v2-notification/data-type';
import { SeriesSameOwnerChangedEvent } from '../../../domain/event';
import { PostEntity } from '../../../domain/model/content';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding/binding-post';

@EventsHandlerAndLog(SeriesSameOwnerChangedEvent)
export class NotiSeriesSameOwnerChangedEventHandler
  implements IEventHandler<SeriesSameOwnerChangedEvent>
{
  private _logger = new Logger(NotiSeriesSameOwnerChangedEventHandler.name);

  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notificationAdapter: INotificationAdapter
  ) {}

  public async handle(event: SeriesSameOwnerChangedEvent): Promise<void> {
    const { authUser, content, series: seriesEntitesWithState } = event.payload;

    const item =
      content instanceof PostEntity
        ? await this._contentBinding.postBinding(content, { authUser })
        : await this._contentBinding.articleBinding(content, { authUser });
    const seriesWithStateDto = await Promise.all(
      seriesEntitesWithState.map(async (entity) => ({
        ...(await this._contentBinding.seriesBinding(entity.item, { authUser })),
        state: entity.state,
      }))
    );

    const payload = {
      event: SeriesChangeItems,
      actor: authUser,
      series: seriesWithStateDto,
      item,
      verb: VerbActivity.CHANGE,
    };

    try {
      await this._notificationAdapter.sendSeriesNotification(payload);
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
    }
  }
}
