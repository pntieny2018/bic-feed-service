import { AppEvent } from '../event.constant';
import { IEventPayload } from '../../common/interfaces';
import { IPostEventPayload } from './post.interface';

export interface IUpdatedPostEventPayload {
  oldPost?: IPostEventPayload;
  updatedPost: IPostEventPayload;
}
export class UpdatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_UPDATED;

  public payload: IUpdatedPostEventPayload;
  public constructor(data: IUpdatedPostEventPayload) {
    Object.assign(this, { payload: data });
  }
}
