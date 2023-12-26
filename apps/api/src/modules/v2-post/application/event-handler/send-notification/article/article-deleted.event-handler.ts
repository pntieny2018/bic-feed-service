import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ArticleDeletedEvent } from '../../../../domain/event';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(ArticleDeletedEvent)
export class NotiArticleDeletedEventHandler implements IEventHandler<ArticleDeletedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ArticleDeletedEvent): Promise<void> {
    const { entity: articleEntity, authUser } = event.payload;

    const articleDto = await this._contentBinding.articleBinding(articleEntity, {
      actor: authUser,
      authUser,
    });

    await this._notiAdapter.sendArticleDeletedNotification({
      actor: authUser,
      article: articleDto,
    });
  }
}
