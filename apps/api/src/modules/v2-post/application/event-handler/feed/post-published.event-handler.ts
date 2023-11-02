import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { FeedPublisherService } from '../../../../feed-publisher';
import { PostPublishedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostPublishedEvent)
export class FeedPostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity } = event.payload;

    if (!postEntity.isPublished()) {
      return;
    }

    await this._feedPublisherService.fanoutOnWrite(
      postEntity.getId(),
      postEntity.getGroupIds(),
      []
    );
  }
}
