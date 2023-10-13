import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { SeriesRemoveItem } from '../../../../../common/constants';
import { SearchService } from '../../../../search/search.service';
import { SeriesNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import { VerbActivity } from '../../../../v2-notification/data-type';
import { SeriesItemsRemovedEvent } from '../../../domain/event';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding/binding-post';

@EventsHandler(SeriesItemsRemovedEvent)
export class SeriesItemsRemovedEventHandler implements IEventHandler<SeriesItemsRemovedEvent> {
  private _logger = new Logger(SeriesItemsRemovedEventHandler.name);

  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notificationAdapter: INotificationAdapter
  ) {}

  public async handle(event: SeriesItemsRemovedEvent): Promise<void> {
    const { seriesId, skipNotify } = event.payload;
    const seriesEntity = (await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
      shouldIncludeItems: true,
    })) as SeriesEntity;

    if (!seriesEntity.isPublished()) {
      return;
    }

    await this._postSearchService.updateAttributePostToSearch(
      { id: seriesEntity.getId(), lang: seriesEntity.get('lang') },
      {
        items: seriesEntity.get('items'),
      }
    );

    if (!skipNotify) {
      await this._notificationHandler(event);
    }
  }

  private async _notificationHandler(event: SeriesItemsRemovedEvent): Promise<void> {
    const { seriesId, authUser, item: contentEntity, contentIsDeleted } = event.payload;

    const seriesEntity = (await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
      mustIncludeGroup: true,
    })) as SeriesEntity;

    if (
      !seriesEntity ||
      !contentEntity ||
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

    const payload: SeriesNotificationPayload = {
      event: SeriesRemoveItem,
      actor: authUser,
      series,
      item,
      contentIsDeleted,
      verb: VerbActivity.REMOVE,
      isSendToContentCreator,
    };

    try {
      await this._notificationAdapter.sendSeriesNotification(payload);
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
    }
  }
}
