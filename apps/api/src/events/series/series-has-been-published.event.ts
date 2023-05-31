import { SeriesHasBeenPublished } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { SeriesHasBeenPublishedEventPayload } from './payload';

export class SeriesHasBeenPublishedEvent implements IEvent<SeriesHasBeenPublishedEventPayload> {
  protected static event = SeriesHasBeenPublished;

  public payload: SeriesHasBeenPublishedEventPayload;

  public constructor(payload: SeriesHasBeenPublishedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesHasBeenPublishedEvent.event;
  }
}
