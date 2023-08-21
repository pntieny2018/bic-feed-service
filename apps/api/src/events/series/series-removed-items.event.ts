import { CONTENT_TYPE } from '@beincom/constants';

import { SeriesRemoveItem } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { PostType } from '../../database/models/post.model';
import { UserDto } from '../../modules/v2-user/application';

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

export type ItemRemovedInSeriesEvent = {
  id: string;
  title: string;
  content: string;
  type: PostType | CONTENT_TYPE;
  createdBy: string;
  groupIds: string[];
  createdAt: Date;
  updatedAt?: Date;
};
export interface ISeriesRemovedItemsPayload {
  seriesId: string;
  items: ItemRemovedInSeriesEvent[];
  skipNotify?: boolean;
  actor: UserDto;
  contentIsDeleted: boolean;
}
