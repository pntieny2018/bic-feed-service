import { IEventPayload } from '../../common/interfaces';
import { AppEvent } from '../event.constant';
import { PostResponseDto } from 'src/modules/post/dto/responses';

export class CreatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_CREATED;
  public payload: {
    post: PostResponseDto;
  };
  public constructor(data: PostResponseDto) {
    this.payload = { post: data };
  }
}
