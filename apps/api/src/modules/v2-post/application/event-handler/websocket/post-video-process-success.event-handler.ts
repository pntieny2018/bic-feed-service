import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostVideoSuccessEvent } from '../../../domain/event';
import { IWebsocketAdapter, WEBSOCKET_ADAPTER } from '../../../domain/service-adapter-interface';

@EventsHandlerAndLog(PostVideoSuccessEvent)
export class WsPostVideoSuccessEventHandler implements IEventHandler<PostVideoSuccessEvent> {
  public constructor(
    @Inject(WEBSOCKET_ADAPTER)
    private readonly _websocketAdapter: IWebsocketAdapter
  ) {}

  public async handle(event: PostVideoSuccessEvent): Promise<void> {
    const { postEntity } = event.payload;

    if (postEntity.isPublished()) {
      return;
    }

    await this._websocketAdapter.emitPostVideoProcessedEvent({
      event: PostVideoSuccessEvent.event,
      recipients: [postEntity.getCreatedBy()],
      postId: postEntity.getId(),
      status: 'successful',
    });
  }
}
