import { DomainEventHandler } from '@beincom/domain';
import { EventsHandler } from '@nestjs/cqrs';
import { TagCreatedEvent } from '../../domain/event';

@EventsHandler(TagCreatedEvent)
export class UserDomainEventHandler extends DomainEventHandler {
  public handle(event: TagCreatedEvent): void {
    console.log('TagCreatedEvent', event);
  }
}
