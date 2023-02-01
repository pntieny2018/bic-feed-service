import { DomainEventHandler } from '@beincom/domain';
import { EventsHandler } from '@nestjs/cqrs';
import { TagDeletedEvent } from '../../domain/event/tag-deleted.event';

@EventsHandler(TagDeletedEvent)
export class UserDomainEventHandler extends DomainEventHandler {
  public handle(event: TagDeletedEvent): void {
    console.log('event', event);
  }
}
