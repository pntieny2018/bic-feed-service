import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { SeriesRemovedItemsEvent } from '../../../../../events/series';
import { PostDeletedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostDeletedEvent)
export class PostDeletedEventHandler implements IEventHandler<PostDeletedEvent> {
  public constructor(
    // TODO: call domain and using event bus
    private readonly _internalEventEmitter: InternalEventEmitterService
  ) {}

  public async handle(event: PostDeletedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (!postEntity.isPublished()) {
      return;
    }

    const seriesIds = postEntity.getSeriesIds() || [];
    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          items: [
            {
              id: postEntity.getId(),
              title: null,
              content: postEntity.get('content'),
              type: postEntity.getType(),
              createdBy: postEntity.getCreatedBy(),
              groupIds: postEntity.getGroupIds(),
              createdAt: postEntity.get('createdAt'),
              updatedAt: postEntity.get('updatedAt'),
            },
          ],
          seriesId: seriesId,
          actor: actor,
          contentIsDeleted: true,
        })
      );
    }
  }
}
