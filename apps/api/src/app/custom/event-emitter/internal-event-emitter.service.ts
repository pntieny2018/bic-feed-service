import { Injectable } from '@nestjs/common';
import { IEvent } from '../../../common/interfaces';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InternalEventEmitterService {
  public constructor(private _eventEmitter: EventEmitter2) {}

  public emit(event: IEvent<unknown>): void {
    const eventName = event.getEventName();
    this._eventEmitter.emit(eventName, event);
  }
}
