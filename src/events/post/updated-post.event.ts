import { AppEvent } from '../event.constant';
import { IEventPayload } from '../../common/interfaces';
import { IPostEventPayload } from './post.interface';
import { UserSharedDto } from '../../shared/user/dto';

export interface IUpdatedPostEventPayload {
  oldPost?: IPostEventPayload;
  newPost: IPostEventPayload;
}
export class UpdatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_UPDATED;
  public actor: UserSharedDto;
  public payload: IUpdatedPostEventPayload;
  public constructor(data: IUpdatedPostEventPayload, actor: UserSharedDto) {
    this.payload = data;
    this.actor = actor;
  }
}
