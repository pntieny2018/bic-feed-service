import { IEventPayload } from '../../common/interfaces';
import { AppEvent } from '../event.constant';
import { IPostEventPayload } from './post.interface';

export class PublishedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_PUBLISHED;
  public payload: IPostEventPayload;
  public constructor(data: IPostEventPayload) {
    Object.assign(this, { payload: data });
  }
}
