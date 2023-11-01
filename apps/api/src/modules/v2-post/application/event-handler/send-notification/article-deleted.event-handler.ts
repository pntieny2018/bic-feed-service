import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ArticleHasBeenDeleted } from '../../../../../common/constants';
import { ArticleDeletedEvent } from '../../../domain/event';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';

@EventsHandlerAndLog(ArticleDeletedEvent)
export class NotiArticleDeletedEventHandler implements IEventHandler<ArticleDeletedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ArticleDeletedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    const articleDto = await this._contentBinding.articleBinding(articleEntity, {
      actor,
      authUser: actor,
    });

    await this._notiAdapter.sendArticleNotification({
      event: ArticleHasBeenDeleted,
      actor,
      article: articleDto,
    });
  }
}
