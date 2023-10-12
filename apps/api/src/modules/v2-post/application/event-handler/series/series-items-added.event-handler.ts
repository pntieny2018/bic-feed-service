import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { SeriesAddItem } from '../../../../../common/constants';
import { SearchService } from '../../../../search/search.service';
import { SeriesNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import { VerbActivity } from '../../../../v2-notification/data-type';
import { SeriesItemsAddedEvent } from '../../../domain/event';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding/binding-post';

@EventsHandler(SeriesItemsAddedEvent)
export class SeriesItemsAddedEventHandler implements IEventHandler<SeriesItemsAddedEvent> {
  private _logger = new Logger(SeriesItemsAddedEventHandler.name);

  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notificationAdapter: INotificationAdapter
  ) {}

  public async handle(event: SeriesItemsAddedEvent): Promise<void> {
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

  private async _notificationHandler(event: SeriesItemsAddedEvent): Promise<void> {
    const { seriesId, authUser, itemId, context } = event.payload;

    const seriesEntity = (await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
      mustIncludeGroup: true,
    })) as SeriesEntity;
    const contentEntity = (await this._contentRepository.findContentByIdInActiveGroup(itemId, {
      mustIncludeGroup: true,
    })) as PostEntity | ArticleEntity;

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
    const isSendToContentCreator = contentEntity.getCreatedBy() !== authUser.id;
    const series = await this._contentBinding.seriesBinding(seriesEntity, { authUser });

    const payload: SeriesNotificationPayload = {
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
