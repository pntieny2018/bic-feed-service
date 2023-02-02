import { DomainEventHandler } from '@beincom/domain';
import { EventsHandler } from '@beincom/nest-domain-event';
import { TagCreatedEvent } from '../../domain/event';

@EventsHandler(TagCreatedEvent)
export class TagCreatedEventHandler extends DomainEventHandler {
  public handle(event: TagCreatedEvent): void {
    console.log('TagCreatedEvent11111111111', event);
  }
}
