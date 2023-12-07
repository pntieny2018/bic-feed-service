import { IEvent } from '../../common/interfaces';
import { UserDto } from '../../modules/v2-user/application';
import { SeriesHasBeenChangeItems } from '../../common/constants';
import { ISeriesState } from '../../notification/activities';
import { IPost } from '../../database/models/post.model';

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
