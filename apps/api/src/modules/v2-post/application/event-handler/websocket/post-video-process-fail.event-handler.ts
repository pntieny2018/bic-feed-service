import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostVideoFailedEvent } from '../../../domain/event';
import { IWebsocketAdapter, WEBSOCKET_ADAPTER } from '../../../domain/service-adapter-interface';

@EventsHandlerAndLog(PostVideoFailedEvent)
export class WsPostVideoFailedEventHandler implements IEventHandler<PostVideoFailedEvent> {
  public constructor(
    @Inject(WEBSOCKET_ADAPTER)
    private readonly _websocketAdapter: IWebsocketAdapter
  ) {}

  public async handle(event: PostVideoFailedEvent): Promise<void> {
    const { entity: postEntity } = event.payload;

    if (postEntity.isPublished()) {
      return;
    }

    await this._websocketAdapter.emitPostVideoProcessedEvent({
      event: PostVideoFailedEvent.event,
      recipients: [postEntity.getCreatedBy()],
      postId: postEntity.getId(),
      status: 'failed',
    });
  }
}
