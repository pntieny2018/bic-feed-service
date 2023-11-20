import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostVideoFailedEvent } from '../../../../domain/event';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(PostVideoFailedEvent)
export class NotiPostVideoFailedEventHandler implements IEventHandler<PostVideoFailedEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: PostVideoFailedEvent): Promise<void> {
    const { postEntity, authUser } = event.payload;

    if (postEntity.isPublished()) {
      return;
    }

    const postDto = await this._contentBinding.postBinding(postEntity, {
      actor: authUser,
      authUser,
    });

    await this._notiAdapter.sendPostVideoProcessFailedNotification({
      actor: authUser,
      post: postDto,
    });
  }
}
