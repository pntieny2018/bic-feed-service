import { AppEvent } from '../event.constant';
import { IEventPayload } from '../../common/interfaces';
import { PostResponseDto } from 'src/modules/post/dto/responses';
import { IPost } from '../../database/models/post.model';
import { UserDto } from 'src/modules/auth';

export class UpdatedPostEventPayload {
  public actor: UserDto;
  public oldPost: IPost;
  public updatedPost: PostResponseDto;
}
export class UpdatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_UPDATED;

  public payload: UpdatedPostEventPayload;
  public constructor(data: Partial<UpdatedPostEvent>) {
    Object.assign(this, data);
  }
}
