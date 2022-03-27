import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEvent } from '../../../common/interfaces/event.interface';

@Injectable()
export class InternalEventEmitterService {
  public constructor(private _eventEmitter: EventEmitter2) {}

  public emit(event: IEvent): void {
    const eventName = event.getEventName();
    this._eventEmitter.emit(eventName, event);
  }
}
