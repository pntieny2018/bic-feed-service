import { IEvent } from '../../common/interfaces';
import { UserDto } from '../../modules/v2-user/application';
import { SeriesAddItem } from '../../common/constants';

export class SeriesAddedItemsEvent implements IEvent<ISeriesAddItemsPayload> {
  public payload: ISeriesAddItemsPayload;
  protected static event = SeriesAddItem;

  public constructor(payload: ISeriesAddItemsPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesAddedItemsEvent.event;
  }
}

export interface ISeriesAddItemsPayload {
  seriesId: string;
  itemIds: string[];
  actor: UserDto;
}
