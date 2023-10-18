import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject, Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SeriesAddItem } from '../../../../../common/constants';
import { VerbActivity } from '../../../../v2-notification/data-type';
import { SeriesItemsAddedEvent } from '../../../domain/event';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding/binding-post';

@EventsHandlerAndLog(SeriesItemsAddedEvent)
export class NotiSeriesItemsAddedEventHandler implements IEventHandler<SeriesItemsAddedEvent> {
  private _logger = new Logger(NotiSeriesItemsAddedEventHandler.name);

  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notificationAdapter: INotificationAdapter
  ) {}

  public async handle(event: SeriesItemsAddedEvent): Promise<void> {
    const { seriesId, authUser, item: contentEntity, skipNotify, context } = event.payload;

    if (skipNotify) {
      return;
    }

    const seriesEntity = (await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
      mustIncludeGroup: true,
    })) as SeriesEntity;

    if (
      !seriesEntity ||
      !contentEntity ||
      !seriesEntity.isPublished() ||
      seriesEntity.getCreatedBy() === contentEntity.getCreatedBy()
    ) {
      return;
    }

    const item =
      contentEntity instanceof PostEntity
        ? await this._contentBinding.postBinding(contentEntity, { authUser })
        : await this._contentBinding.articleBinding(contentEntity, { authUser });
    const series = await this._contentBinding.seriesBinding(seriesEntity, { authUser });
    const isSendToContentCreator = contentEntity.getCreatedBy() !== authUser.id;

    const payload = {
      event: SeriesAddItem,
      actor: authUser,
      series,
      item,
      context,
      verb: VerbActivity.ADD,
      isSendToContentCreator,
    };

    try {
      await this._notificationAdapter.sendSeriesNotification(payload);
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
    }
  }
}
