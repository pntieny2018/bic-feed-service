import { SeriesHasBeenDeleted } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { SeriesHasBeenDeletedEventPayload } from './payload';

export class SeriesHasBeenDeletedEvent implements IEvent<SeriesHasBeenDeletedEventPayload> {
  protected static event = SeriesHasBeenDeleted;

  public payload: SeriesHasBeenDeletedEventPayload;

  public constructor(payload: SeriesHasBeenDeletedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesHasBeenDeletedEvent.event;
  }
}
