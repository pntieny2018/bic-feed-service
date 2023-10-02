import { EVENT_SERVICE_TOKEN, IEventPayload, IEventService } from '@libs/infra/event';
import { Inject } from '@nestjs/common';

import { IEventAdapter } from '../../domain/infra-adapter-interface';

export class EventAdapter implements IEventAdapter {
  public constructor(
    @Inject(EVENT_SERVICE_TOKEN)
    private readonly _eventService: IEventService
  ) {}

  public publish(event: IEventPayload): void {
    return this._eventService.publish(event);
  }
}
