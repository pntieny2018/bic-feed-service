import { IEvent } from '../../common/interfaces';

export class SeriesReoderItemsEvent implements IEvent<ISeriesReorderItemsPayload> {
  protected static event = SeriesReoderItemsEvent.name;

  public payload: ISeriesReorderItemsPayload;

  public constructor(payload: ISeriesReorderItemsPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesReoderItemsEvent.event;
  }
}

export interface ISeriesReorderItemsPayload {
  seriesId: string;
  itemIds: string[];
}
