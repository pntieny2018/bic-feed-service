import { IEventPayload } from '../../common/interfaces';
import { AppEvent } from '../event.constant';
import { IPostEventPayload } from './post.interface';
export class CreatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_CREATED;
  public payload: IPostEventPayload;
  public constructor(data: IPostEventPayload) {
    Object.assign(this, { payload: data });
  }
}
