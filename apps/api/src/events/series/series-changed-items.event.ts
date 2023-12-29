import { UserDto } from '@libs/service/user';

import { SeriesHasBeenChangeItems } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { IPost } from '../../database/models/post.model';
import { ISeriesState } from '../../notification/activities';

export class SeriesChangedItemsEvent implements IEvent<ISeriesChangeItemsPayload> {
  public payload: ISeriesChangeItemsPayload;
  protected static event = SeriesHasBeenChangeItems;

  public constructor(payload: ISeriesChangeItemsPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesChangedItemsEvent.event;
  }
}

export interface ISeriesChangeItemsPayload {
  series: ISeriesState[];
  content: IPost;
  actor: Partial<UserDto>;
}
