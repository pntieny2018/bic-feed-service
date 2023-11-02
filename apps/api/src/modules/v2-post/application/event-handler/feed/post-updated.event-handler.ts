import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { FeedPublisherService } from '../../../../feed-publisher';
import { PostUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostUpdatedEvent)
export class FeedPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity } = event.payload;

    if (postEntity.isHidden() || !postEntity.isPublished()) {
      return;
    }

    await this._feedPublisherService.fanoutOnWrite(
      postEntity.getId(),
      postEntity.getGroupIds(),
      postEntity.getSnapshot().groupIds
    );
  }
}
