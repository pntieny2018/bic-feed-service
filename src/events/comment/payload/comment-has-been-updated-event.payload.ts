import { IComment } from '../../../database/models/comment.model';
import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { UserDto } from '../../../modules/auth';

export class CommentHasBeenUpdatedEventPayload {
  public actor: UserDto;
  public oldComment: IComment;
  public commentResponse: CommentResponseDto;
  public oldCommentResponse?: CommentResponseDto;
}
