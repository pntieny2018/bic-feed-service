import { IComment } from '../../../database/models/comment.model';
import { UserDto } from '../../../modules/auth';

export class CommentHasBeenDeletedEventPayload {
  public actor: UserDto;
  public comment: IComment;
}
