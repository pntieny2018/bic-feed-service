import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SeriesDeletedEvent } from '../../../domain/event';
import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';

@EventsHandlerAndLog(SeriesDeletedEvent)
export class NotiSeriesDeletedEventHandler implements IEventHandler<SeriesDeletedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: SeriesDeletedEvent): Promise<void> {
    const { seriesEntity, actor } = event;

    if (seriesEntity.isHidden() || !seriesEntity.get('itemIds')?.length) {
      return;
    }

    const items = (await this._contentRepository.findAll({
      where: {
        ids: seriesEntity.get('itemIds'),
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
      },
    })) as (PostEntity | ArticleEntity)[];

    if (items.every((item) => item.isOwner(actor.id))) {
      return;
    }

    const seriesDto = await this._contentBinding.seriesBinding(seriesEntity, {
      authUser: actor,
      actor,
    });

    await this._notiAdapter.sendSeriesDeletedNotification({
      actor,
      series: seriesDto,
    });
  }
}
