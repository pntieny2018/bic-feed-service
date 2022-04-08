import { IEventPayload } from '../../common/interfaces';
import { UserSharedDto } from '../../shared/user/dto';
import { AppEvent } from '../event.constant';
import { IPostEventPayload } from './post.interface';
export class CreatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_CREATED;
  public payload: IPostEventPayload;
  public actor: UserSharedDto;
  public constructor(data: IPostEventPayload, actor: UserSharedDto) {
    this.payload = data;
    this.actor = actor;
  }
}
