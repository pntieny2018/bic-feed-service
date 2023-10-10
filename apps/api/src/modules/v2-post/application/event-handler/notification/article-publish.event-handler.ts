import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ArticleHasBeenPublished } from '../../../../../common/constants';
import { ArticlePublishedEvent } from '../../../domain/event';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class NotiArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    const articleDto = await this._contentBinding.articleBinding(articleEntity, {
      actor,
      authUser: actor,
    });

    const seriesActorIds = articleDto.series.map((s) => s.createdBy) || [];

    await this._notiAdapter.sendArticleNotification({
      event: ArticleHasBeenPublished,
      actor,
      article: articleDto,
      ignoreUserIds: seriesActorIds,
    });
  }
}
