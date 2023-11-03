import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostHasBeenDeleted } from '../../../../../common/constants';
import { PostDeletedEvent } from '../../../domain/event';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';

@EventsHandlerAndLog(PostDeletedEvent)
export class NotiPostDeletedEventHandler implements IEventHandler<PostDeletedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: PostDeletedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    const postDto = await this._contentBinding.postBinding(postEntity, {
      actor,
      authUser: actor,
    });

    await this._notiAdapter.sendPostNotification({
      event: PostHasBeenDeleted,
      actor,
      post: postDto,
    });
  }
}
