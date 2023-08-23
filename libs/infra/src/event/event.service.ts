import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';

import { getDebugContext, CONTEXT, getContext, initTracingContext } from '../log';

import { IEventPayload, IEventService } from './event.interface';

@Injectable()
export class EventService implements IEventService {
  public logger = new Logger(EventService.name);

  public constructor(private readonly eventBus: EventBus, private readonly cls: ClsService) {}

  public publish(event: IEventPayload): void {
    const eventName = event.constructor['event'];

    if (!this.cls || !this.cls.isActive()) {
      initTracingContext(eventName);
    }

    const context = getContext();
    this.cls.set(CONTEXT, { ...context, event: eventName });

    this.logger.debug(
      `EventPublisher: ${JSON.stringify({
        payload: event.payload,
        debugContext: getDebugContext({ ...context, event: eventName }),
      })}`
    );

    this.eventBus.publish(event);
  }
}
