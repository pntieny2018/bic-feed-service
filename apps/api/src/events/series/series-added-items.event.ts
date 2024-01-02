import { UserDto } from '@libs/service/user';

import { SeriesHasBeenAddItem } from '../../common/constants';
import { IEvent } from '../../common/interfaces';

export class SeriesAddedItemsEvent implements IEvent<ISeriesAddItemsPayload> {
  public payload: ISeriesAddItemsPayload;
  protected static event = SeriesHasBeenAddItem;

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
  actor: Partial<UserDto>;
  skipNotify?: boolean;
  context: 'publish' | 'add'; // publish: when publish post,article edit post, article; add when series add item
}
