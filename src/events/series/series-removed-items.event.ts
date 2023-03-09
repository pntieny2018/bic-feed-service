import { IEvent } from '../../common/interfaces';
import { UserDto } from '../../modules/v2-user/application';
import { SeriesRemoveItem } from '../../common/constants';

export class SeriesRemovedItemsEvent implements IEvent<ISeriesRemovedItemsPayload> {
  protected static event = SeriesRemoveItem;

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
  actor: UserDto;
}
