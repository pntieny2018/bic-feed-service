import { SeriesHasBeenUpdated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { SeriesHasBeenUpdatedEventPayload } from './payload';

export class SeriesHasBeenUpdatedEvent implements IEvent<SeriesHasBeenUpdatedEventPayload> {
  protected static event = SeriesHasBeenUpdated;

  public payload: SeriesHasBeenUpdatedEventPayload;

  public constructor(payload: SeriesHasBeenUpdatedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesHasBeenUpdatedEvent.event;
  }
}
