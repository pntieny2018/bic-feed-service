import { IComment } from '../../../database/models/comment.model';
import { UserDto } from '../../../modules/v2-user/application';

export class CommentHasBeenDeletedEventPayload {
  public actor: UserDto;
  public comment: IComment;
}
