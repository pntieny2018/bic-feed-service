import { IEvent } from '../../common/interfaces';

export class SeriesRemovedItemsEvent implements IEvent<ISeriesRemovedItemsPayload> {
  protected static event = SeriesRemovedItemsEvent.name;

  public payload: ISeriesRemovedItemsPayload;

  public constructor(payload: ISeriesRemovedItemsPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesRemovedItemsEvent.event;
  }
}

export interface ISeriesRemovedItemsPayload {
  seriesId: string;
  itemIds: string[];
}
