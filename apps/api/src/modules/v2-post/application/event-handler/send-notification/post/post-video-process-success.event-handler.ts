import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostVideoSuccessEvent } from '../../../../domain/event';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(PostVideoSuccessEvent)
export class NotiPostVideoSuccessEventHandler implements IEventHandler<PostVideoSuccessEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: PostVideoSuccessEvent): Promise<void> {
    const { postEntity, authUser } = event.payload;

    const postDto = await this._contentBinding.postBinding(postEntity, {
      actor: authUser,
      authUser,
    });

    await this._notiAdapter.sendPostVideoProcessSuccessNotification({
      actor: authUser,
      post: postDto,
    });
  }
}
